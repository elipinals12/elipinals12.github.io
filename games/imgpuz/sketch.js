/**
 * @file sketch.js
 * @description A variable-size image sliding puzzle game built with p5.js.
 * Features a splash screen, default/custom image loading, grid size slider,
 * timer, slider focus fix, and gapless tile rendering using direct image drawing.
 * --- VERSION: Direct Drawing (Mimicking Reference for Loading Stability) ---
 */

// --- Constants ---
const MIN_GRID_SIZE = 2;        // Minimum selectable grid dimension
const MAX_GRID_SIZE = 10;       // Maximum selectable grid dimension
const DEFAULT_GRID_SIZE = 4;    // Initial grid dimension
// <<<--- Updated Default Image Path as requested ---<<<
const DEFAULT_IMAGE_PATH = './../../ref/realtree.jpg'; // Default image location relative to HTML

// Game States - Used to control program flow and UI visibility
const STATE_SPLASH = 'splash';      // Initial screen asking for image choice
const STATE_LOADING = 'loading';    // Intermediate state while preparing puzzle assets/data
const STATE_PLAYING = 'playing';    // Main gameplay state
const STATE_SOLVED = 'solved';      // State when the puzzle is successfully solved

// --- Global Variables ---

// Image Data
let puzzleImage;            // p5.Image object currently used for the puzzle (default or custom)
let defaultPuzzleImage;     // Stores the preloaded default p5.Image object
let isDefaultImageLoaded = false; // Flag: True if default image loaded successfully in preload
// <<<--- Stores calculated info for direct drawing from the source image (reverted) ---<<<
let puzzleImageSourceInfo = {
    img: null, // Reference to the source p5.Image
    size: 0,   // Pixel dimension of the square source area used
    offsetX: 0,// Top-left X offset within the original image to get the square source area
    offsetY: 0,// Top-left Y offset within the original image
    srcTileW: 0,// Calculated width of one tile in the source image pixels
    srcTileH: 0 // Calculated height of one tile in the source image pixels
};
// <<<--- Removed `tiles = []` array ---<<<

// Board State & Layout
let gridSize = DEFAULT_GRID_SIZE; // Current grid dimension (NxN)
let board = [];             // 1D array storing the current order of tile indices (0 to n*n-1)
let tileWidth = 0;          // Calculated on-screen display width of a single tile (can be fractional)
let tileHeight = 0;         // Calculated on-screen display height of a single tile (can be fractional)
let puzzleAreaSize = 0;     // Pixel dimension (width & height) of the square puzzle area
let puzzleX = 0;            // Top-left X coordinate for centering the puzzle area
let puzzleY = 0;            // Top-left Y coordinate for centering the puzzle area

// Game Flow & State
let gameState = STATE_SPLASH; // Start the game at the splash screen
let isPuzzleReady = false;    // Flag: True when image, source info, and board are ready
let isSolved = false;         // Flag: True if the current board configuration is solved

// Timer
let timerRunning = false;     // Flag: True when the timer is actively counting
let startTime = 0;          // Milliseconds timestamp when the timer started (via millis())
let elapsedTime = 0;        // Current elapsed time in seconds
let timerDisplayString = "0:00.00"; // Formatted time string for display
// Timer Flashing (when solved)
let timerFlashState = true;   // Controls the visibility state for the flashing effect
const TIMER_FLASH_INTERVAL = 400; // Milliseconds between flash state toggles
let lastFlashToggle = 0;      // Timestamp of the last flash toggle

// UI DOM Elements (references to p5.dom elements)
let gridSizeSlider, gridSizeLabel, resetButton, fileInput, uploadLabel; // Game UI
let splashTitle, splashText, defaultButton, uploadButton; // Splash UI
let cnv; // p5 Canvas object


// =============================================================================
// P5.JS CORE FUNCTIONS: preload, setup, draw
// =============================================================================

/**
 * @function preload
 * @description Loads assets (default image) before setup() begins.
 */
function preload() {
    console.log("Preloading default image...");
    defaultPuzzleImage = loadImage(DEFAULT_IMAGE_PATH,
        (img) => {
            console.log("Default image loaded successfully.");
            isDefaultImageLoaded = true;
            // Enable button if it exists already
            if (gameState === STATE_SPLASH && defaultButton) {
                defaultButton.removeAttribute('disabled');
            }
        },
        (err) => {
            console.error(`!!! FAILED TO LOAD DEFAULT IMAGE: ${DEFAULT_IMAGE_PATH}`, err);
            isDefaultImageLoaded = false;
        }
    );
}

/**
 * @function setup
 * @description Initializes canvas, creates DOM elements, sets initial UI state. Runs once after preload.
 */
function setup() {
    console.log("Setting up sketch...");
    cnv = createCanvas(windowWidth, windowHeight);
    cnv.style('display', 'block');

    calculateLayout(); // Initial calculation for element positioning

    createSplashUI(); // Create DOM elements
    createGameUI();

    positionElements(); // Position based on initial state (splash)
    if (gameState === STATE_SPLASH) {
        showSplashUI();
        hideGameUI();
        // Ensure button state reflects loaded status *after* button creation
        if (!isDefaultImageLoaded && defaultButton) {
            defaultButton.attribute('disabled', '');
        } else if (isDefaultImageLoaded && defaultButton) {
            defaultButton.removeAttribute('disabled');
        }
    } else { // Fallback if state isn't splash initially
        hideSplashUI();
        showGameUI();
    }

    // Alert if default image failed during preload (only once)
    if (!isDefaultImageLoaded && gameState === STATE_SPLASH) {
        alert(`Warning: Could not load default image "${DEFAULT_IMAGE_PATH}". Check path/server. 'Use Default' disabled.`);
    }

    // Default p5 settings
    noStroke(); imageMode(CORNER); textAlign(CENTER, CENTER);
    console.log("Setup complete. Initial state:", gameState);
}

/**
 * @function draw
 * @description Main p5 loop. Clears background, updates timer, draws based on gameState.
 */
function draw() {
    background(30); // Clear background

    // Update Timer if running
    if (timerRunning) {
        elapsedTime = (millis() - startTime) / 1000.0;
        timerDisplayString = formatTime(elapsedTime);
    }

    // Game State Machine - controls what gets drawn
    switch (gameState) {
        case STATE_SPLASH:
            // UI is DOM based, nothing to draw on canvas here
            break;
        case STATE_LOADING:
            fill(200); textSize(24);
            // Use the lowercase text from user request
            text("loading puzzle...", width / 2, height / 2);
            break;
        case STATE_PLAYING:
        case STATE_SOLVED:
            // Draw puzzle board and timer ONLY if puzzle is ready
            // <<<--- Check based on isPuzzleReady flag ---<<<
            if (isPuzzleReady) {
                drawPuzzleBoard(); // <<<--- Draws using direct image sampling ---<<<
                drawTimer();
            } else {
                // If in playing/solved state but not ready, indicates an error after init attempt
                drawErrorState("Error: Puzzle Not Ready");
                console.error("Attempting to draw puzzle but isPuzzleReady is false in state:", gameState);
            }
            break;
    }
}

// =============================================================================
// UI CREATION AND MANAGEMENT
// =============================================================================

/**
 * @function createSplashUI
 * @description Creates the DOM elements for the splash screen. Uses lowercase text as requested.
 */
function createSplashUI() {
    splashTitle = createDiv("welcome to imgpzl") // Lowercase
        .style('font-size', '32px').style('color', 'white')
        .style('text-align', 'center').style('width', '100%');
    splashText = createDiv("use the default image or upload your own?") // Lowercase
        .style('font-size', '18px').style('color', 'lightgray')
        .style('text-align', 'center').style('width', '100%');
    defaultButton = createButton("Use Default")
        .size(100, 40).mousePressed(useDefaultImage);
    uploadButton = createButton("Upload Image")
        .size(100, 40).mousePressed(triggerUpload);
}

/**
 * @function createGameUI
 * @description Creates the DOM elements for the main game interface.
 */
function createGameUI() {
    gridSizeLabel = createDiv(`Grid Size: ${gridSize}x${gridSize}`)
        .style('color', 'white').style('font-family', 'sans-serif')
        .style('text-align', 'center');
    gridSizeSlider = createSlider(MIN_GRID_SIZE, MAX_GRID_SIZE, gridSize, 1)
        .input(handleSliderChange);
    resetButton = createButton('Shuffle / Reset')
        .mousePressed(resetPuzzle);
    uploadLabel = createDiv('Upload New Image:')
        .style('color', 'white').style('font-family', 'sans-serif')
        .style('text-align', 'center');
    // Create the file input, keep it visible but potentially styled minimally
    fileInput = createFileInput(handleFile)
        .style('color', 'white'); // Basic styling
        // .hide(); // Use .hide() if you ONLY want the 'Upload Image' button to trigger it
}

/**
 * @function showSplashUI
 * @description Makes splash screen elements visible and ensures correct button state.
 */
function showSplashUI() {
    if (splashTitle) splashTitle.show();
    if (splashText) splashText.show();
    if (defaultButton) {
        defaultButton.show();
        // Update button state based on loaded flag
        if (!isDefaultImageLoaded) defaultButton.attribute('disabled', '');
        else defaultButton.removeAttribute('disabled');
    }
    if (uploadButton) uploadButton.show();
}

/**
 * @function hideSplashUI
 * @description Hides splash screen elements.
 */
function hideSplashUI() {
    if (splashTitle) splashTitle.hide();
    if (splashText) splashText.hide();
    if (defaultButton) defaultButton.hide();
    if (uploadButton) uploadButton.hide();
}

/**
 * @function showGameUI
 * @description Makes main game UI elements visible and positions them.
 */
function showGameUI() {
    if (gridSizeLabel) gridSizeLabel.show();
    if (gridSizeSlider) gridSizeSlider.show();
    if (resetButton) resetButton.show();
    if (uploadLabel) uploadLabel.show();
    if (fileInput) fileInput.show(); // Ensure file input is shown with game UI
    positionGameUI(); // Reposition after showing
}

/**
 * @function hideGameUI
 * @description Hides main game UI elements.
 */
function hideGameUI() {
    if (gridSizeLabel) gridSizeLabel.hide();
    if (gridSizeSlider) gridSizeSlider.hide();
    if (resetButton) resetButton.hide();
    if (uploadLabel) uploadLabel.hide();
    if (fileInput) fileInput.hide();
}

/**
 * @function positionElements
 * @description Positions all UI elements based on the current state and layout.
 */
function positionElements() {
    // Positions UI based on current state and calculated layout
    calculateLayout(); // Ensure layout is up-to-date

    if (gameState === STATE_SPLASH) {
        // Center splash elements vertically and horizontally
        let currentY = height * 0.3;
        if (splashTitle) { splashTitle.position(0, currentY); currentY += 50; } // Add vertical spacing
        if (splashText) { splashText.position(0, currentY); currentY += 50; }
        if (defaultButton) defaultButton.position(width / 2 - 110, currentY);
        if (uploadButton) uploadButton.position(width / 2 + 10, currentY);
    } else {
        positionGameUI(); // Position game elements if not splash
    }
}

/**
 * @function positionGameUI
 * @description Positions game UI elements sequentially below the puzzle area.
 */
function positionGameUI() {
    // Positions slider, labels, buttons relative to the centered puzzle area
    // Assumes calculateLayout() has been called recently
    let uiStartX = puzzleX;
    let uiWidth = puzzleAreaSize;
    let timerHeight = 30; // Reserved vertical space for timer text
    // Start positioning below the puzzle area and reserved timer space
    let uiStartY = puzzleY + puzzleAreaSize + 10 + timerHeight + 10;
    let currentY = uiStartY;
    let itemHeight = 25; // Standard height for labels/buttons
    let itemMargin = 10; // Vertical margin between items

    // Position Game UI elements vertically downwards, centered horizontally within puzzle width
    if (gridSizeLabel) {
        gridSizeLabel.style('width', `${uiWidth}px`); // Make label span puzzle width for centering text
        gridSizeLabel.position(uiStartX, currentY);
        currentY += itemHeight + itemMargin;
    }
    if (gridSizeSlider) {
        let sliderWidth = min(uiWidth * 0.8, 200); // Make slider reasonably wide but not excessive
        gridSizeSlider.style('width', `${sliderWidth}px`);
        gridSizeSlider.position(uiStartX + (uiWidth - sliderWidth) / 2, currentY); // Center slider
        currentY += itemHeight + itemMargin;
    }
    if (resetButton) {
        // Center the button based on its actual width
        resetButton.position(uiStartX + (uiWidth - resetButton.width) / 2, currentY);
        currentY += itemHeight + itemMargin + 5; // Extra space after button
    }
    if (uploadLabel) {
        uploadLabel.style('width', `${uiWidth}px`); // Span width for text centering
        uploadLabel.position(uiStartX, currentY);
        currentY += itemHeight; // Less margin before file input
    }
    if (fileInput) {
        // Center the file input element (may need adjustment based on browser styling)
        fileInput.position(uiStartX + (uiWidth - fileInput.width) / 2, currentY);
    }
}

// =============================================================================
// STATE TRANSITION AND INITIALIZATION
// =============================================================================

/**
 * @function useDefaultImage
 * @description Called by 'Use Default' button. Sets active image and starts game initialization.
 */
function useDefaultImage() {
    if (!isDefaultImageLoaded || !defaultPuzzleImage) {
        alert("Default image is not available (load may have failed).");
        return;
    }
    console.log("Starting game with default image.");
    puzzleImage = defaultPuzzleImage; // Set the active image source
    startGame(); // Transition to loading/playing state
}

/**
 * @function triggerUpload
 * @description Called by 'Upload Image' button. Clicks the actual file input element.
 */
function triggerUpload() {
    console.log("Triggering file input click...");
    // Click the hidden/styled HTML file input element associated with the p5 fileInput object
    if (fileInput && fileInput.elt) {
        fileInput.elt.click();
    } else {
         console.warn("File input element not found to trigger click.");
    }
}

/**
 * @function startGame
 * @description Central function to transition from splash to loading, then attempt puzzle initialization.
 *              Uses setTimeout to allow the "Loading..." message to render.
 *              Assumes 'puzzleImage' has been set correctly before calling.
 */
function startGame() {
    hideSplashUI();
    gameState = STATE_LOADING;
    isPuzzleReady = false; // Ensure not ready during load
    redraw(); // Show loading message immediately

    // Short delay allows the "Loading..." message to render before potentially blocking initialization
    setTimeout(() => {
        console.log("Attempting puzzle initialization (startGame)...");
        if (initializePuzzle(gridSize)) { // Initialize board, calculate source info, shuffle
            console.log("Initialization successful.");
            showGameUI();
            // State (playing/solved) is set by checkWinCondition inside initializePuzzle
        } else {
            // Handle initialization failure
            console.error("Initialization failed.");
            gameState = STATE_SPLASH; // Revert to splash
            showSplashUI();
            hideGameUI(); // Ensure game UI is hidden
            alert("Error: Failed to prepare the puzzle from the selected image.");
        }
        redraw(); // Update display after initialization attempt
    }, 50); // 50ms delay
}

// =============================================================================
// PUZZLE BOARD DRAWING (Direct Method - Reverted)
// =============================================================================

/**
 * @function drawPuzzleBoard
 * @description Draws the puzzle using the direct source sampling method (9-argument image()).
 *              Mimics the logic from the provided reference code.
 */
function drawPuzzleBoard() {
    // Guard clause: Only draw if puzzle is ready and source info is valid
    // <<<--- Check puzzleImageSourceInfo.img as per reference ---<<<
    if (!isPuzzleReady || !puzzleImageSourceInfo.img) {
        console.error("drawPuzzleBoard called unexpectedly when puzzle not ready or source info missing.");
        drawErrorState("Error: Puzzle Data Missing");
        return;
    }

    push(); // Isolate drawing state
    translate(puzzleX, puzzleY); // Move origin to puzzle area corner

    let blankValue = gridSize * gridSize - 1;
    let blankIndex = board.indexOf(blankValue);
    // Calculate blank position (needed for solved state drawing)
    let blankCol = (blankIndex !== -1) ? blankIndex % gridSize : -1;
    let blankRow = (blankIndex !== -1) ? floor(blankIndex / gridSize) : -1;

    // Get pre-calculated source image info for efficient drawing
    // <<<--- Destructure puzzleImageSourceInfo ---<<<
    let { img, offsetX, offsetY, srcTileW, srcTileH } = puzzleImageSourceInfo;

    // Loop through each position on the board
    for (let i = 0; i < board.length; i++) {
        let tileValue = board[i]; // The piece value (0..n*n-1) currently at this board position 'i'
        if (tileValue === blankValue) continue; // Skip drawing the empty space

        let boardCol = i % gridSize; let boardRow = floor(i / gridSize);

        // Calculate precise integer Destination rect (dx, dy, dw, dh) for gapless rendering
        let dx = round(boardCol * tileWidth); let dy = round(boardRow * tileHeight);
        let dNextX = round((boardCol + 1) * tileWidth); let dNextY = round((boardRow + 1) * tileHeight);
        let dw = dNextX - dx; let dh = dNextY - dy;

        // Calculate integer Source rect (sx, sy, sw, sh) from original image
        let srcTileCol = tileValue % gridSize; let srcTileRow = floor(tileValue / gridSize);
        // <<<--- Use floor for source coordinates as per reference ---<<<
        let sx = floor(offsetX + srcTileCol * srcTileW); let sy = floor(offsetY + srcTileRow * srcTileH);
        let sw = floor(srcTileW); let sh = floor(srcTileH);

        // <<<--- Validate source rect before drawing (from reference) ---<<<
        if (sx < 0 || sy < 0 || sw <= 0 || sh <= 0 || sx + sw > img.width + 1 || sy + sh > img.height + 1) {
             console.error(`Invalid source rect for tileValue ${tileValue}: sx=${sx}, sy=${sy}, sw=${sw}, sh=${sh}`);
             fill(255, 0, 0); noStroke(); rect(dx, dy, dw, dh); continue; // Draw error indicator
        }

        // <<<--- Draw the tile piece using direct source sampling (9-argument image) ---<<<
        image(img, dx, dy, dw, dh, sx, sy, sw, sh);
    }

    // --- Draw Final Tile and Solved Overlay (if solved) ---
    // <<<--- Logic adapted from reference drawPuzzleBoard ---<<<
    if (gameState === STATE_SOLVED && blankIndex !== -1) {
        // Calculate precise destination for the blank spot
        let dx = round(blankCol * tileWidth); let dy = round(blankRow * tileHeight);
        let dNextX = round((blankCol + 1) * tileWidth); let dNextY = round((blankRow + 1) * tileHeight);
        let dw = dNextX - dx; let dh = dNextY - dy;

        // Calculate source for the final piece (value = blankValue)
        let srcTileCol = blankValue % gridSize; let srcTileRow = floor(blankValue / gridSize);
        let sx = floor(offsetX + srcTileCol * srcTileW); let sy = floor(offsetY + srcTileRow * srcTileH);
        let sw = floor(srcTileW); let sh = floor(srcTileH);

        // Draw final piece if source is valid
        if (!(sx < 0 || sy < 0 || sw <= 0 || sh <= 0 || sx + sw > img.width + 1 || sy + sh > img.height + 1)) {
            image(img, dx, dy, dw, dh, sx, sy, sw, sh);
        } else {
             console.error("Invalid source rect for final solved tile.");
             fill(0, 0, 255); noStroke(); rect(dx, dy, dw, dh); // Draw blue error indicator
        }

        // Draw transparent green solved overlay
        fill(0, 200, 0, 80); noStroke();
        rect(0, 0, puzzleAreaSize, puzzleAreaSize); // Cover the whole puzzle area
        // Draw "SOLVED!" text
        fill(255); textSize(max(20, puzzleAreaSize / 8)); noStroke(); // Scale text size
        textAlign(CENTER, CENTER);
        text("SOLVED!", puzzleAreaSize / 2, puzzleAreaSize / 2);
    }
    pop(); // Restore original drawing settings
}

/**
 * @function drawErrorState
 * @description Helper function to draw an error message within the puzzle area.
 * @param {string} [message="Error: Puzzle Unavailable"] - The error message to display.
 */
function drawErrorState(message = "Error: Puzzle Unavailable") {
     push();
     translate(puzzleX, puzzleY); // Position correctly
     fill(50); noStroke(); rect(0, 0, puzzleAreaSize, puzzleAreaSize); // Dark background for area
     fill(255, 50, 50); textSize(max(16, puzzleAreaSize / 15)); // Red text
     textAlign(CENTER, CENTER);
     text(message, puzzleAreaSize / 2, puzzleAreaSize / 2); // Centered text
     pop();
}


// =============================================================================
// TIMER LOGIC AND DRAWING
// =============================================================================

/**
 * @function drawTimer
 * @description Draws the formatted timer string below the puzzle area,
 *              handling the flashing effect when the puzzle is solved.
 */
function drawTimer() {
    let timerX = puzzleX + puzzleAreaSize / 2; // Center horizontally below puzzle
    let timerY = puzzleY + puzzleAreaSize + 15; // Position below puzzle + padding
    let timerSize = max(18, puzzleAreaSize / 20); // Scale timer font size slightly

    textSize(timerSize);
    textAlign(CENTER, TOP); // Align text by its center horizontally and top vertically

    // Determine fill color based on game state (flashing if solved)
    if (gameState === STATE_SOLVED) {
        let now = millis();
        // Toggle flash state at defined interval
        if (now - lastFlashToggle > TIMER_FLASH_INTERVAL) {
            timerFlashState = !timerFlashState; // Toggle visibility state
            lastFlashToggle = now; // Record time of this toggle
        }
        // Apply flashing alpha: full green or dimmer green
        fill(0, 255, 0, timerFlashState ? 255 : 100);
    } else {
        // Solid green when playing or just started (timer at 0:00.00)
        fill(0, 255, 0, 255);
    }
    text(timerDisplayString, timerX, timerY); // Display the formatted time string
}

/**
 * @function formatTime
 * @description Formats a time given in seconds into a "M:SS.ss" string.
 * @param {number} seconds - The time duration in seconds.
 * @returns {string} The formatted time string (e.g., "1:05.32").
 */
function formatTime(seconds) {
    let mins = floor(seconds / 60);
    let secs = floor(seconds) % 60;
    let hund = floor((seconds * 100) % 100); // Hundredths of a second
    // nf() pads with leading zeros: nf(number, [leftDigits=0], [rightDigits=0])
    return `${nf(mins, 1)}:${nf(secs, 2)}.${nf(hund, 2)}`; // M:SS.ss format
}


// =============================================================================
// PUZZLE INITIALIZATION AND CORE LOGIC
// =============================================================================

/**
 * @function initializePuzzle
 * @description Sets up the core puzzle logic: calculates source image info,
 *              creates the board array, resets timer, shuffles the board.
 *              This version uses the direct drawing method (no tile slicing).
 *              Mimics the logic from the provided reference code.
 * @param {number} size - The dimension of the grid (e.g., 4 for 4x4).
 * @returns {boolean} True if initialization successful, false otherwise.
 */
function initializePuzzle(size) {
    console.log(`Initializing puzzle core for size ${size}x${size}`);
    isPuzzleReady = false; isSolved = false; // Reset flags

    // 1. Validate Input Image
    // <<<--- Check width as per reference ---<<<
    if (!puzzleImage || !puzzleImage.width || puzzleImage.width <= 0) {
        console.error("InitializePuzzle Error: Invalid or missing puzzleImage.");
        // Fallback attempt (optional, but can prevent hard crash)
        if (isDefaultImageLoaded && puzzleImage !== defaultPuzzleImage) {
            console.warn("Falling back to default image."); puzzleImage = defaultPuzzleImage;
        } else return false; // Still no valid image
    }
    // 2. Validate Grid Size
    if (size < MIN_GRID_SIZE || size > MAX_GRID_SIZE) {
         console.error(`InitializePuzzle Error: Invalid grid size ${size}.`);
         return false;
    }

    gridSize = size; // Set grid size globally
    if (gridSizeLabel) gridSizeLabel.html(`Grid Size: ${gridSize}x${gridSize}`);
    calculateLayout(); // Recalculate layout (essential for source info calc below)

    // 3. Calculate and store source image parameters for direct drawing
    // <<<--- Logic directly from reference initializePuzzle ---<<<
    try {
        puzzleImageSourceInfo.img = puzzleImage; // Store reference to image
        let imgSize = min(puzzleImage.width, puzzleImage.height); // Use smallest dimension for square area
        puzzleImageSourceInfo.size = imgSize;
        // Calculate offsets to center the square area within the image
        puzzleImageSourceInfo.offsetX = (puzzleImage.width - imgSize) / 2;
        puzzleImageSourceInfo.offsetY = (puzzleImage.height - imgSize) / 2;
        // Calculate dimensions of one tile within the source square area
        puzzleImageSourceInfo.srcTileW = imgSize / gridSize;
        puzzleImageSourceInfo.srcTileH = imgSize / gridSize;
        // Further validation
        if (puzzleImageSourceInfo.srcTileW <= 0 || puzzleImageSourceInfo.srcTileH <= 0) {
            throw new Error("Calculated source tile dimension is zero or negative.");
        }
        // Check for NaN which can happen if imgSize or gridSize is invalid
        if (isNaN(puzzleImageSourceInfo.offsetX) || isNaN(puzzleImageSourceInfo.srcTileW)){
             throw new Error("NaN calculation encountered for source info.");
        }
        console.log("Calculated source image info successfully.");
    } catch (e) {
        console.error("Error calculating source image info:", e);
        puzzleImageSourceInfo.img = null; // Invalidate source info on error
        return false; // Indicate initialization failure
    }

    // 4. Setup board array in solved state
    board = [];
    let totalTiles = gridSize * gridSize;
    for (let i = 0; i < totalTiles; i++) {
        board.push(i); // 0, 1, 2, ..., n*n-1
    }

    // 5. Reset Timer
    timerRunning = false; elapsedTime = 0; startTime = 0;
    timerDisplayString = formatTime(0); timerFlashState = true; lastFlashToggle = 0;

    // 6. Shuffle the board
    shufflePuzzle();

    // 7. Final Checks and State Setting
    checkWinCondition(); // Sets isSolved and gameState (PLAYING or SOLVED)
    // <<<--- Puzzle is ready ONLY if source info is calculated and board shuffled ---<<<
    isPuzzleReady = true;
    console.log("Puzzle core initialized. Ready:", isPuzzleReady, "State:", gameState);
    return true; // Indicate successful initialization
}

/**
 * @function resetPuzzle
 * @description Resets and shuffles the puzzle using the current image and grid size settings.
 *              Uses the setTimeout pattern for loading state.
 */
function resetPuzzle() {
     console.log("Resetting puzzle...");
     if (!puzzleImage) { alert("Cannot reset, no image is currently loaded."); return; }

     hideGameUI(); // Hide immediately
     gameState = STATE_LOADING; // Show loading briefly
     isPuzzleReady = false;
     redraw(); // Show loading message

     // Use setTimeout as in reference/previous version
     setTimeout(() => {
        console.log("Attempting re-initialization (reset)...");
         if (initializePuzzle(gridSize)) { // Re-initialize with current settings
             console.log("Re-initialization successful.");
             showGameUI(); // Ensure game UI is visible
             // State is set by initializePuzzle/checkWinCondition
         } else { // Handle potential init failure during reset
             console.error("Re-initialization failed during reset.");
             gameState = STATE_SPLASH; // Revert to splash
             showSplashUI();
             alert("Error re-initializing puzzle. Returning to start screen.");
         }
         redraw(); // Update display after attempt
     }, 50);
}

/**
 * @function calculateLayout
 * @description Calculates the centered puzzle position (puzzleX, puzzleY, puzzleAreaSize)
 *              and tile dimensions. Also updates the cached source image info needed for drawing.
 *              Mimics the logic from the provided reference code.
 */
function calculateLayout() {
    let safeMargin = 30; let uiSpace = 180; // Adjusted spacing estimates

    // Calculate available space, leaving room for margins and UI below
    let availableWidth = windowWidth - safeMargin * 2;
    let availableHeight = windowHeight - safeMargin * 2 - uiSpace;

    // Puzzle area is the largest square that fits
    puzzleAreaSize = floor(min(availableWidth, availableHeight));
    puzzleAreaSize = max(100, puzzleAreaSize); // Minimum size safeguard

    // Center the puzzle area horizontally, position vertically considering UI space
    puzzleX = floor((windowWidth - puzzleAreaSize) / 2);
    let totalContentHeight = puzzleAreaSize + uiSpace;
    puzzleY = floor((windowHeight - totalContentHeight) / 2) + safeMargin / 2;
    puzzleY = max(safeMargin, puzzleY); // Ensure top margin

    // Calculate display tile dimensions (can be fractional)
    if (gridSize > 0) {
        tileWidth = puzzleAreaSize / gridSize;
        tileHeight = puzzleAreaSize / gridSize;
    } else { tileWidth = 0; tileHeight = 0; }
    // console.log(`Layout Updated: Area=${puzzleAreaSize}px @ (${puzzleX},${puzzleY}), TileW=${tileWidth.toFixed(3)}px`); // Less verbose

    // <<<--- Update cached source image info (logic from reference calculateLayout) ---<<<
     if (puzzleImage && puzzleImage.width > 0 && gridSize > 0) {
         try {
            // Reference the current puzzle image
            puzzleImageSourceInfo.img = puzzleImage;
            // Recalculate source parameters based on current image and grid size
            let imgSize = min(puzzleImage.width, puzzleImage.height);
            puzzleImageSourceInfo.size = imgSize;
            puzzleImageSourceInfo.offsetX = (puzzleImage.width - imgSize) / 2;
            puzzleImageSourceInfo.offsetY = (puzzleImage.height - imgSize) / 2;
            puzzleImageSourceInfo.srcTileW = imgSize / gridSize;
            puzzleImageSourceInfo.srcTileH = imgSize / gridSize;
            // Validate calculation
            if (puzzleImageSourceInfo.srcTileW <= 0 || isNaN(puzzleImageSourceInfo.srcTileW)) {
                 throw new Error("Invalid src tile width calculated.");
            }
            // If calculations succeed, the puzzle *could* be ready, but initializePuzzle is the main gatekeeper
            // isPuzzleReady should only be true after initializePuzzle completes fully.
         } catch (e) {
              console.error("Error recalculating source info on layout:", e);
              // If calculation fails here, mark puzzle as not ready and invalidate source info
              isPuzzleReady = false;
              puzzleImageSourceInfo.img = null;
         }
     } else {
          // Invalidate cache if no valid image or grid size during layout calculation
          puzzleImageSourceInfo.img = null;
          // If the game was playing/solved, mark as not ready if image/grid becomes invalid
          if (gameState !== STATE_SPLASH && gameState !== STATE_LOADING) {
               // isPuzzleReady = false; // Let initializePuzzle control this primarily
          }
     }
}

// <<<--- Removed createImageTiles function ---<<<

/**
 * @function shufflePuzzle
 * @description Randomizes the order of elements in the global `board` array
 *              using a series of valid swaps starting from the blank tile's position.
 *              Ensures the resulting puzzle is solvable. (Using reference code's logic)
 */
function shufflePuzzle() {
    console.log("Shuffling board...");
    let blankValue = gridSize*gridSize - 1; let blankIndex = board.indexOf(blankValue);
    // Safety check/recovery for blank tile (from reference)
    if (blankIndex === -1) {
        console.error("Shuffle Error: Blank tile not found!");
        board=[]; let tt=gridSize*gridSize; for(let i=0;i<tt;i++) board.push(i); blankIndex=tt-1;
        if(board.length===0 || blankIndex >= board.length || board[blankIndex]!==blankValue) {
            console.error("Cannot recover board state for shuffling!"); return;
        }
        console.warn("Recovered blank index by resetting board.");
    }

    let shuffleMoves = 150 * gridSize * gridSize; // Number of random moves
    let lastMoveSourceIndex = -1; // Prevent immediately moving back

    for (let i=0; i<shuffleMoves; i++){
        let possibleMoveTargetIndices = []; // Indices of tiles that can swap with blank
        let blankRow = floor(blankIndex / gridSize);
        let blankCol = blankIndex % gridSize;

        // Check potential moves (tile index to swap with blank)
        let tileAboveIndex = blankIndex - gridSize;
        let tileBelowIndex = blankIndex + gridSize;
        let tileLeftIndex = blankIndex - 1;
        let tileRightIndex = blankIndex + 1;

        // Check UP (can tile below move up? Not the one just moved?)
        if (blankRow < gridSize - 1 && tileBelowIndex !== lastMoveSourceIndex) possibleMoveTargetIndices.push(tileBelowIndex);
        // Check DOWN (can tile above move down? Not the one just moved?)
        if (blankRow > 0 && tileAboveIndex !== lastMoveSourceIndex) possibleMoveTargetIndices.push(tileAboveIndex);
        // Check LEFT (can tile right move left? Not the one just moved?)
        if (blankCol < gridSize - 1 && tileRightIndex !== lastMoveSourceIndex) possibleMoveTargetIndices.push(tileRightIndex);
        // Check RIGHT (can tile left move right? Not the one just moved?)
        if (blankCol > 0 && tileLeftIndex !== lastMoveSourceIndex) possibleMoveTargetIndices.push(tileLeftIndex);

        if (possibleMoveTargetIndices.length > 0){
            // Pick a random valid move target index
            let moveTargetIndex = random(possibleMoveTargetIndices);
            swap(board, blankIndex, moveTargetIndex); // Perform the swap
            // Update blank position and record where it came from
            lastMoveSourceIndex = blankIndex;
            blankIndex = moveTargetIndex;
        } else {
            // Reset constraint if stuck (no valid moves other than reversing)
            lastMoveSourceIndex = -1;
            // i--; // Optionally retry if stuck
        }
    }
    isSolved = false; // Ensure not marked solved after shuffle
    console.log("Shuffle complete.");
    // Check if somehow shuffled to solved state (rare)
    if (checkWinCondition()) { console.warn("Shuffle resulted in solved state."); }
}


// =============================================================================
// INPUT HANDLERS (Slider, File Upload, Keyboard)
// =============================================================================

/**
 * @function handleSliderChange
 * @description Callback for the grid size slider. Updates size and re-initializes puzzle if game active.
 */
function handleSliderChange() {
    let newSize = gridSizeSlider.value();
    if (newSize !== gridSize) {
        console.log("Slider changed to:", newSize);
        // Only re-initialize if size changed AND game is active
        if (gameState === STATE_PLAYING || gameState === STATE_SOLVED) {
            hideGameUI(); // Hide immediately
            gameState = STATE_LOADING;
            isPuzzleReady = false;
            redraw(); // Show loading message

            setTimeout(() => { // Use setTimeout pattern
                console.log("Attempting re-initialization (slider)...");
                if (initializePuzzle(newSize)) {
                     console.log("Re-initialization from slider successful.");
                     showGameUI();
                } else {
                    console.error("Re-initialization from slider failed.");
                    gameState = STATE_SPLASH; showSplashUI(); // Revert on failure
                    alert("Error changing grid size.");
                }
                 redraw();
            }, 50);
        } else { // Update size var and label if game not active
             gridSize = newSize;
             if (gridSizeLabel) gridSizeLabel.html(`Grid Size: ${gridSize}x${gridSize}`);
             console.log("Slider changed while inactive. Size set to:", newSize);
        }
    }
}

/**
 * @function handleFile
 * @description Callback for the file input. Loads selected image and re-initializes puzzle.
 *              Uses the setTimeout pattern.
 * @param {p5.File} file - The file object from the input element.
 */
function handleFile(file) {
    console.log("File input changed:", file);
    if (!file || !file.type || !file.data) {
        console.warn("Invalid file object received."); alert("Could not process file.");
        if (fileInput) fileInput.value(''); return;
    }

    if (file.type.startsWith('image')) {
        console.log("Attempting to load image from file data...");
        hideSplashUI(); hideGameUI(); // Hide all UI
        gameState = STATE_LOADING; // Show loading message
        isPuzzleReady = false;
        redraw(); // Update display

        // Load the image from the file data URL
        loadImage(file.data,
            // Success Callback
            (newImg) => {
                console.log("Custom image loaded successfully.");
                puzzleImage = newImg; // Update the active image

                setTimeout(() => { // Use setTimeout for initialization
                    console.log("Attempting initialization with upload...");
                    if (initializePuzzle(gridSize)) { // Initialize with the new image
                        console.log("Initialization with upload successful.");
                        showGameUI(); // Show game UI if init succeeds
                    } else { // Handle initialization failure
                        console.error("Initialization with upload failed.");
                        gameState = STATE_SPLASH; showSplashUI();
                        alert("Error preparing puzzle from uploaded image.");
                    }
                     redraw(); // Update after init attempt
                }, 50);

                if (fileInput) fileInput.value(''); // Clear the file input value

            },
            // Error Callback for loadImage
            (err) => {
                console.error("Error loading image data from file:", err);
                alert("Failed to load file as image. Use JPG, PNG, GIF, WebP etc.");
                if (fileInput) fileInput.value('');
                gameState = STATE_SPLASH; showSplashUI(); // Revert to splash
                 redraw();
            }
        );
    } else {
        alert(`File is not recognized as an image (${file.type}).`);
        if (fileInput) fileInput.value(''); // Clear the input
    }
}

/**
 * @function keyPressed
 * @description p5 function called when a key is pressed. Handles arrow key movement,
 *              starts the timer on first move, and fixes slider focus issue.
 */
function keyPressed() {
    // Ignore input if not in the playing state or if puzzle isn't ready
    if (gameState !== STATE_PLAYING || !isPuzzleReady) return;

    let blankValue = gridSize * gridSize - 1;
    let blankIndex = board.indexOf(blankValue);
    if (blankIndex === -1) {
        console.error("Keypress error: Blank index not found!"); return;
    }

    let targetIndex = -1; // Board index of the tile to swap with the blank
    let blankRow = floor(blankIndex / gridSize);
    let blankCol = blankIndex % gridSize;

    // Determine target index based on arrow key pressed and boundaries
    if (keyCode === UP_ARROW && blankRow < gridSize - 1) targetIndex = blankIndex + gridSize; // Tile below moves up
    else if (keyCode === DOWN_ARROW && blankRow > 0) targetIndex = blankIndex - gridSize; // Tile above moves down
    else if (keyCode === LEFT_ARROW && blankCol < gridSize - 1) targetIndex = blankIndex + 1; // Tile right moves left
    else if (keyCode === RIGHT_ARROW && blankCol > 0) targetIndex = blankIndex - 1; // Tile left moves right

    // If a valid move was identified
    if (targetIndex !== -1 && targetIndex >= 0 && targetIndex < board.length) {
        // Start Timer only on the very first valid move
        if (!timerRunning && !isSolved) {
            timerRunning = true; startTime = millis(); elapsedTime = 0;
            console.log("Timer started!");
        }

        swap(board, blankIndex, targetIndex); // Perform the tile swap
        checkWinCondition(); // Check if this move solved the puzzle (stops timer, sets state)

        // --- Slider Focus Fix ---
        if (document.activeElement && document.activeElement !== document.body) {
           document.activeElement.blur();
        }
        return false; // Prevent default browser behavior for arrow keys
    }
}

/**
 * @function checkWinCondition
 * @description Checks if the global `board` array is in the solved state.
 *              Updates `isSolved` flag, `gameState`, stops timer, and initializes flashing if solved.
 *              Mimics the logic from the provided reference code.
 * @returns {boolean} True if the puzzle is solved, false otherwise.
 */
function checkWinCondition() {
    let totalTiles = gridSize * gridSize;
    // Basic sanity check
    if (!board || board.length !== totalTiles) {
        console.error("Win check failed: Board invalid!");
        isSolved=false; if(gameState===STATE_SOLVED)gameState=STATE_PLAYING; return false;
    }

    // Check each board position
    for (let i = 0; i < totalTiles; i++) {
        if (board[i] !== i) { // If any tile is out of order
            const previouslySolved = isSolved;
            isSolved = false;
            // If moved after being solved, switch back to playing
            if (previouslySolved) {
                 console.log("Moved out of solved state.");
                 gameState = STATE_PLAYING;
                 // Timer remains stopped unless restarted on move
            }
            return false; // Not solved
        }
    }
    // If loop completes, it's solved
    if (!isSolved) { // Actions only on the transition *to* solved
        console.log(">>> PUZZLE SOLVED! <<<");
        timerRunning = false; // Stop timer
        lastFlashToggle = millis(); timerFlashState = true; // Init flash
    }
    isSolved = true; gameState = STATE_SOLVED; // Set flags/state
    return true; // Is solved
}

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * @function swap
 * @description Swaps two elements in an array in place. Includes validation.
 * @param {Array} arr - The array.
 * @param {number} i - Index of first element.
 * @param {number} j - Index of second element.
 */
function swap(arr, i, j) {
    if (arr && i >= 0 && i < arr.length && j >= 0 && j < arr.length) {
        [arr[i], arr[j]] = [arr[j], arr[i]]; // ES6 destructuring swap
    } else {
        console.warn(`Swap attempt with invalid indices: ${i}, ${j} in array length ${arr?.length}`);
    }
}

/**
 * @function windowResized
 * @description p5 function called when the browser window is resized.
 *              Adjusts canvas size, recalculates layout (including source info), and repositions UI.
 */
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    console.log("Window resized.");
    // Recalculate layout, which now includes updating puzzleImageSourceInfo
    calculateLayout();
    // Reposition UI elements based on the new layout and current state
    positionElements();
    console.log("Window resized processed. Layout and UI updated.");
    // No need to explicitly recreate tiles or re-initialize puzzle with direct drawing method
}