/**
 * @file sketch.js
 * @description A variable-size image sliding puzzle game built with p5.js.
 * Features a splash screen, default/custom image loading, grid size slider,
 * timer, slider focus fix, and gapless tile rendering using direct image drawing.
 */

// --- Constants ---
const MIN_GRID_SIZE = 2;        // Minimum selectable grid dimension
const MAX_GRID_SIZE = 10;       // Maximum selectable grid dimension
const DEFAULT_GRID_SIZE = 4;    // Initial grid dimension
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
// Stores calculated info for direct drawing from the source image
let puzzleImageSourceInfo = {
    img: null, size: 0, offsetX: 0, offsetY: 0, srcTileW: 0, srcTileH: 0
};

// Board State & Layout
let gridSize = DEFAULT_GRID_SIZE; // Current grid dimension (NxN)
let board = [];             // 1D array storing the current order of tile indices (0 to n*n-1)
let tileWidth = 0;          // Calculated on-screen display width of a single tile
let tileHeight = 0;         // Calculated on-screen display height of a single tile
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
        if (!isDefaultImageLoaded && defaultButton) {
            defaultButton.attribute('disabled', '');
        }
    } else { // Fallback if state isn't splash initially
        hideSplashUI();
        showGameUI();
    }

    // Alert if default image failed during preload
    if (!isDefaultImageLoaded && gameState === STATE_SPLASH) {
        alert(`Warning: Could not load default image "${DEFAULT_IMAGE_PATH}". Check path/server. 'Use Default' disabled.`);
    }

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
            // UI is DOM based
            break;
        case STATE_LOADING:
            fill(200); textSize(24);
            text("loading puzzle...", width / 2, height / 2); // Lowercase text
            break;
        case STATE_PLAYING:
        case STATE_SOLVED:
            // Draw puzzle board and timer ONLY if puzzle is ready
            if (isPuzzleReady) {
                drawPuzzleBoard(); // Draws using direct source sampling
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
 * @description Creates the DOM elements for the splash screen.
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
    fileInput = createFileInput(handleFile) // Hidden input triggered by buttons
        .style('color', 'white').hide();
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
    if (fileInput) fileInput.show();
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
    calculateLayout(); // Ensure layout variables are current
    if (gameState === STATE_SPLASH) {
        // Center splash elements
        if (splashTitle) splashTitle.position(0, height * 0.3);
        if (splashText) splashText.position(0, height * 0.4);
        if (defaultButton) defaultButton.position(width / 2 - 110, height * 0.5);
        if (uploadButton) uploadButton.position(width / 2 + 10, height * 0.5);
    } else {
        // Position game elements relative to puzzle area
        positionGameUI();
    }
}

/**
 * @function positionGameUI
 * @description Positions game UI elements sequentially below the puzzle area.
 */
function positionGameUI() {
    // Assumes calculateLayout() called recently
    let uiStartX = puzzleX; let uiWidth = puzzleAreaSize;
    let timerHeight = 30; // Reserved vertical space for timer text
    let uiStartY = puzzleY + puzzleAreaSize + 10 + timerHeight + 10; // Start below puzzle & timer area
    let currentY = uiStartY;
    let itemHeight = 25; let itemMargin = 5;

    // Position Game UI elements vertically downwards
    if (gridSizeLabel) {
        gridSizeLabel.style('width', `${uiWidth}px`); gridSizeLabel.position(uiStartX, currentY);
        currentY += itemHeight + itemMargin;
    }
    if (gridSizeSlider) {
        let sliderWidth = uiWidth * 0.5; gridSizeSlider.style('width', `${sliderWidth}px`);
        gridSizeSlider.position(uiStartX + (uiWidth - sliderWidth) / 2, currentY);
        currentY += itemHeight + itemMargin + 5;
    }
    if (resetButton) {
        resetButton.position(uiStartX + (uiWidth - resetButton.width) / 2, currentY);
        currentY += itemHeight + itemMargin + 10;
    }
    if (uploadLabel) {
        uploadLabel.style('width', `${uiWidth}px`); uploadLabel.position(uiStartX, currentY);
        currentY += itemHeight - 5;
    }
    if (fileInput) {
        fileInput.position(uiStartX + (uiWidth - 150) / 2, currentY); // Approx center
    }
}

// =============================================================================
// STATE TRANSITION AND INITIALIZATION
// =============================================================================

/**
 * @function useDefaultImage
 * @description Called by 'Use Default' button. Sets active image and starts game.
 */
function useDefaultImage() {
    if (!isDefaultImageLoaded || !defaultPuzzleImage) {
        alert("Default image is not available (load may have failed)."); return;
    }
    console.log("Starting game with default image.");
    puzzleImage = defaultPuzzleImage;
    startGame(); // Transition state and initialize
}

/**
 * @function triggerUpload
 * @description Called by 'Upload Image' buttons. Clicks the hidden file input.
 */
function triggerUpload() {
    console.log("Triggering file input click...");
    if (fileInput) fileInput.elt.click();
}

/**
 * @function startGame
 * @description Transitions from splash to loading then attempts to initialize the puzzle.
 *              Handles success/failure of initialization and sets final state.
 *              Assumes 'puzzleImage' is set correctly before calling.
 */
function startGame() {
    hideSplashUI();
    gameState = STATE_LOADING; // Show loading message
    isPuzzleReady = false; // Ensure puzzle isn't drawn during loading

    // Attempt to initialize the puzzle; handle success or failure
    if (initializePuzzle(gridSize)) {
        // Success: Show game UI. State (playing/solved) was set by checkWinCondition.
        showGameUI();
    } else {
        // Failure: Revert to splash screen and notify user.
        gameState = STATE_SPLASH;
        showSplashUI();
        hideGameUI();
        alert("Error: Failed to prepare the puzzle from the selected image.");
    }
}

// =============================================================================
// PUZZLE BOARD DRAWING (Direct Method)
// =============================================================================

/**
 * @function drawPuzzleBoard
 * @description Draws the puzzle using the direct source sampling method (9-argument image()).
 */
function drawPuzzleBoard() {
    // Guard clause: Only draw if puzzle is ready and source info is valid
    if (!isPuzzleReady || !puzzleImageSourceInfo.img) {
        console.error("drawPuzzleBoard called unexpectedly when puzzle not ready.");
        drawErrorState("Error: Puzzle Data Missing");
        return;
    }

    push(); // Isolate drawing state
    translate(puzzleX, puzzleY); // Move origin to puzzle area corner

    let blankValue = gridSize * gridSize - 1;
    let blankIndex = board.indexOf(blankValue);
    let blankCol = (blankIndex !== -1) ? blankIndex % gridSize : -1;
    let blankRow = (blankIndex !== -1) ? floor(blankIndex / gridSize) : -1;

    // Get pre-calculated source image info for efficient drawing
    let { img, offsetX, offsetY, srcTileW, srcTileH } = puzzleImageSourceInfo;

    // Loop through each position on the board
    for (let i = 0; i < board.length; i++) {
        let tileIndex = board[i]; // The piece index (0..n*n-1) currently at this board position
        if (tileIndex === blankValue) continue; // Skip drawing the empty space

        let boardCol = i % gridSize; let boardRow = floor(i / gridSize);

        // Calculate precise integer Destination rect (dx, dy, dw, dh) for gapless rendering
        let dx = round(boardCol * tileWidth); let dy = round(boardRow * tileHeight);
        let dNextX = round((boardCol + 1) * tileWidth); let dNextY = round((boardRow + 1) * tileHeight);
        let dw = dNextX - dx; let dh = dNextY - dy;

        // Calculate integer Source rect (sx, sy, sw, sh) from original image
        let srcTileCol = tileIndex % gridSize; let srcTileRow = floor(tileIndex / gridSize);
        let sx = floor(offsetX + srcTileCol * srcTileW); let sy = floor(offsetY + srcTileRow * srcTileH);
        let sw = floor(srcTileW); let sh = floor(srcTileH);

        // Validate source rect before drawing
        if (sx < 0 || sy < 0 || sw <= 0 || sh <= 0 || sx + sw > img.width + 1 || sy + sh > img.height + 1) {
             console.error(`Invalid source rect for tile ${tileIndex}: sx=${sx}, sy=${sy}, sw=${sw}, sh=${sh}`);
             fill(255, 0, 0); noStroke(); rect(dx, dy, dw, dh); continue; // Draw error indicator
        }

        // Draw the tile piece using direct source sampling
        image(img, dx, dy, dw, dh, sx, sy, sw, sh);
    }

    // --- Draw Final Tile and Solved Overlay (if solved) ---
    if (gameState === STATE_SOLVED && blankIndex !== -1) {
        // Calculate precise destination for the blank spot
        let dx = round(blankCol * tileWidth); let dy = round(blankRow * tileHeight);
        let dNextX = round((blankCol + 1) * tileWidth); let dNextY = round((blankRow + 1) * tileHeight);
        let dw = dNextX - dx; let dh = dNextY - dy;

        // Calculate source for the final piece (index = blankValue)
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
        fill(0, 200, 0, 80); noStroke(); rect(0, 0, puzzleAreaSize, puzzleAreaSize);
        // Draw "SOLVED!" text
        fill(255); textSize(puzzleAreaSize / 8); noStroke(); text("SOLVED!", puzzleAreaSize / 2, puzzleAreaSize / 2);
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
     fill(50); rect(0, 0, puzzleAreaSize, puzzleAreaSize); // Dark background for area
     fill(255, 50, 50); textSize(20); // Red text
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
    let timerY = puzzleY + puzzleAreaSize + 20; // Position below puzzle + padding
    let timerSize = 24; // Font size

    textSize(timerSize);
    textAlign(CENTER, TOP); // Align text by its top edge

    // Determine fill color based on game state (flashing if solved)
    if (gameState === STATE_SOLVED) {
        let now = millis();
        if (now - lastFlashToggle > TIMER_FLASH_INTERVAL) {
            timerFlashState = !timerFlashState; // Toggle visibility state
            lastFlashToggle = now; // Record toggle time
        }
        fill(0, 255, 0, timerFlashState ? 255 : 100); // Flash alpha
    } else {
        fill(0, 255, 0, 255); // Solid green when playing or loading
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
    // nf() pads with leading zeros: nf(number, [leftDigits], [rightDigits])
    return `${nf(mins, 1)}:${nf(secs, 2, 0)}.${nf(hund, 2, 0)}`;
}

// =============================================================================
// PUZZLE INITIALIZATION AND CORE LOGIC
// =============================================================================

/**
 * @function initializePuzzle
 * @description Sets up the core puzzle logic: calculates source image info,
 *              creates the board array, resets timer, shuffles the board.
 *              This version uses the direct drawing method (no tile slicing).
 * @param {number} size - The dimension of the grid (e.g., 4 for 4x4).
 * @returns {boolean} True if initialization successful, false otherwise.
 */
function initializePuzzle(size) {
    console.log(`Initializing puzzle core for size ${size}x${size}`);
    isPuzzleReady = false; isSolved = false; // Reset flags

    // 1. Validate Input Image
    if (!puzzleImage || !puzzleImage.width || puzzleImage.width <= 0) {
        console.error("InitializePuzzle Error: Invalid or missing puzzleImage.");
        return false;
    }
    // 2. Validate Grid Size
    if (size < MIN_GRID_SIZE || size > MAX_GRID_SIZE) {
         console.error(`InitializePuzzle Error: Invalid grid size ${size}.`);
         return false;
    }

    gridSize = size; // Set grid size globally
    if (gridSizeLabel) gridSizeLabel.html(`Grid Size: ${gridSize}x${gridSize}`);
    calculateLayout(); // Recalculate layout (essential for source info)

    // 3. Calculate and store source image parameters for direct drawing
    try {
        puzzleImageSourceInfo.img = puzzleImage;
        let imgSize = min(puzzleImage.width, puzzleImage.height);
        puzzleImageSourceInfo.size = imgSize;
        puzzleImageSourceInfo.offsetX = (puzzleImage.width - imgSize) / 2;
        puzzleImageSourceInfo.offsetY = (puzzleImage.height - imgSize) / 2;
        puzzleImageSourceInfo.srcTileW = imgSize / gridSize;
        puzzleImageSourceInfo.srcTileH = imgSize / gridSize;
        // Further validation
        if (puzzleImageSourceInfo.srcTileW <= 0 || puzzleImageSourceInfo.srcTileH <= 0) {
            throw new Error("Calculated source tile dimension is zero or negative.");
        }
        if (isNaN(puzzleImageSourceInfo.offsetX) || isNaN(puzzleImageSourceInfo.srcTileW)){
             throw new Error("NaN calculation for source info.");
        }
        console.log("Calculated source image info.");
    } catch (e) {
        console.error("Error calculating source image info:", e);
        puzzleImageSourceInfo.img = null; // Invalidate cache
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
    isPuzzleReady = true; // Mark the puzzle as ready for drawing
    console.log("Puzzle core initialized. Ready:", isPuzzleReady, "State:", gameState);
    return true; // Indicate successful initialization
}

/**
 * @function resetPuzzle
 * @description Resets and shuffles the puzzle using the current image and grid size settings.
 */
function resetPuzzle() {
     console.log("Resetting puzzle...");
     if (!puzzleImage) { alert("Cannot reset, no image is currently loaded."); return; }
     gameState = STATE_LOADING; // Show loading briefly
     // Re-initialize the puzzle. Handle success/failure.
     if (initializePuzzle(gridSize)) {
         showGameUI(); // Ensure game UI is visible
         // Game state is set by checkWinCondition within initializePuzzle
     } else {
         // If re-initialization fails, revert to splash screen
         gameState = STATE_SPLASH; showSplashUI(); hideGameUI();
         alert("Error re-initializing puzzle. Returning to start screen.");
     }
}

/**
 * @function calculateLayout
 * @description Calculates the centered puzzle position (puzzleX, puzzleY, puzzleAreaSize)
 *              and tile dimensions. Updates the cached source image info needed for drawing.
 */
function calculateLayout() {
    let safeMargin = 30; let uiSpace = 180; // Adjusted spacing

    let availableWidth = windowWidth - safeMargin * 2;
    let availableHeight = windowHeight - safeMargin * 2 - uiSpace;
    puzzleAreaSize = floor(min(availableWidth, availableHeight));
    puzzleX = floor((windowWidth - puzzleAreaSize) / 2);
    puzzleY = floor((windowHeight - puzzleAreaSize - uiSpace) / 2);

    // Calculate tile dimensions (can be fractional)
    if (gridSize > 0) {
        tileWidth = puzzleAreaSize / gridSize;
        tileHeight = puzzleAreaSize / gridSize;
    } else { tileWidth = 0; tileHeight = 0; }
    // console.log(`Layout Updated: Area=${puzzleAreaSize}px @ (${puzzleX},${puzzleY}), TileW=${tileWidth.toFixed(3)}px`); // Less verbose logging

    // Update cached source image info if possible
     if (puzzleImage && puzzleImage.width > 0 && gridSize > 0) {
         try {
            puzzleImageSourceInfo.img = puzzleImage;
            let imgSize = min(puzzleImage.width, puzzleImage.height);
            puzzleImageSourceInfo.size = imgSize;
            puzzleImageSourceInfo.offsetX = (puzzleImage.width - imgSize) / 2;
            puzzleImageSourceInfo.offsetY = (puzzleImage.height - imgSize) / 2;
            puzzleImageSourceInfo.srcTileW = imgSize / gridSize;
            puzzleImageSourceInfo.srcTileH = imgSize / gridSize;
            if (puzzleImageSourceInfo.srcTileW <= 0) throw new Error("Invalid src tile width.");
         } catch (e) {
              console.error("Error recalculating source info on layout:", e);
              isPuzzleReady=false; // Mark as not ready if calc fails
              puzzleImageSourceInfo.img=null;
         }
     } else {
          puzzleImageSourceInfo.img = null; // Invalidate cache if no image/grid
          if (gameState !== STATE_SPLASH && gameState !== STATE_LOADING) {
               isPuzzleReady = false; // Ensure puzzle isn't drawn if calc fails later
          }
     }
}

// Removed createImageTiles function

/**
 * @function shufflePuzzle
 * @description Randomizes the order of elements in the global `board` array
 *              using a series of valid swaps starting from the blank tile's position.
 */
function shufflePuzzle() {
    console.log("Shuffling board...");
    let blankValue = gridSize*gridSize - 1; let blankIndex = board.indexOf(blankValue);
    // Safety check/recovery for blank tile
    if (blankIndex === -1) { console.error("Shuffle Error: Blank!"); board=[]; let tt=gridSize*gridSize; for(let i=0;i<tt;i++) board.push(i); blankIndex=tt-1; if(board.length===0||board[blankIndex]!==blankValue){console.error("Cannot recover board!"); return;}}
    let shuffleMoves = 150 * gridSize * gridSize; let lastMoveSource = -1;
    // Perform many random valid moves
    for (let i=0; i<shuffleMoves; i++){let pm=[]; let a=blankIndex-gridSize, b=blankIndex+gridSize, l=blankIndex-1, r=blankIndex+1; if(blankIndex>=gridSize && a!==lastMoveSource) pm.push(a); if(blankIndex<gridSize*gridSize-gridSize && b!==lastMoveSource) pm.push(b); if(blankIndex%gridSize!==0 && l!==lastMoveSource) pm.push(l); if(blankIndex%gridSize!==gridSize-1 && r!==lastMoveSource) pm.push(r); if(pm.length > 0){let mi=random(pm); swap(board, blankIndex, mi); lastMoveSource=blankIndex; blankIndex=mi;} else {lastMoveSource=-1; i--;}}
    isSolved = false; // Ensure not marked solved
    console.log("Shuffle complete.");
}


// =============================================================================
// INPUT HANDLERS (Slider, File Upload, Keyboard)
// =============================================================================

/**
 * @function handleSliderChange
 * @description Callback for the grid size slider. Updates size and re-initializes puzzle if active.
 */
function handleSliderChange() {
    let newSize = gridSizeSlider.value();
    if (newSize !== gridSize && (gameState === STATE_PLAYING || gameState === STATE_SOLVED)) {
        console.log("Slider changed to:", newSize);
        gameState = STATE_LOADING;
        if (initializePuzzle(newSize)) { showGameUI(); } // Re-init and show UI
        else { gameState = STATE_SPLASH; showSplashUI(); hideGameUI(); alert("Error changing grid size."); } // Revert on failure
    } else if (newSize !== gridSize) { // If game inactive, just update var and label
         gridSize = newSize; if (gridSizeLabel) gridSizeLabel.html(`Grid Size: ${gridSize}x${gridSize}`);
         console.log("Slider changed while inactive. Size set to:", newSize);
    }
}

/**
 * @function handleFile
 * @description Callback for the file input. Loads selected image and re-initializes puzzle.
 * @param {p5.File} file - The file object from the input element.
 */
function handleFile(file) {
    console.log("File input changed:", file);
    console.log("Attempting to load image from file data...");
    hideSplashUI(); hideGameUI(); gameState = STATE_LOADING; // Hide UI, show loading

    loadImage(file.data,
        // Success Callback
        (newImg) => {
            console.log("Custom image loaded successfully.");
            puzzleImage = newImg; // Update the active image
            if (initializePuzzle(gridSize)) { // Initialize with the new image
                showGameUI(); // Show game UI if init succeeds
            } else { // Handle initialization failure
                gameState = STATE_SPLASH; showSplashUI(); hideGameUI();
                alert("Error preparing puzzle from uploaded image.");
            }
            if (fileInput) fileInput.value(''); // Clear the file input
        },
        // Error Callback
        (err) => {
            console.error("Error loading image data from file:", err);
            alert("Failed to load file as image. Use JPG, PNG, GIF, WebP etc.");
            if (fileInput) fileInput.value('');
            gameState = STATE_SPLASH; showSplashUI(); hideGameUI(); // Revert to splash
        }
    );
}

/**
 * @function keyPressed
 * @description p5 function called when a key is pressed. Handles arrow key movement,
 *              starts the timer on first move, and fixes slider focus issue.
 */
function keyPressed() {
    // Ignore input if not in the playing state
    if (gameState !== STATE_PLAYING) return;

    let blankValue = gridSize * gridSize - 1;
    let blankIndex = board.indexOf(blankValue);
    if (blankIndex === -1) return; // Exit if blank not found

    let targetIndex = -1; // Board index of the tile to swap with the blank

    // Determine target index based on arrow key pressed
    if (keyCode === UP_ARROW && blankIndex < gridSize*gridSize - gridSize) targetIndex = blankIndex + gridSize;
    else if (keyCode === DOWN_ARROW && blankIndex >= gridSize) targetIndex = blankIndex - gridSize;
    else if (keyCode === LEFT_ARROW && blankIndex % gridSize !== gridSize - 1) targetIndex = blankIndex + 1;
    else if (keyCode === RIGHT_ARROW && blankIndex % gridSize !== 0) targetIndex = blankIndex - 1;

    // If a valid move was identified
    if (targetIndex !== -1) {
        // Start Timer only on the very first valid move of the game
        if (!timerRunning && !isSolved) {
            timerRunning = true; startTime = millis(); elapsedTime = 0;
            console.log("Timer started!");
        }

        swap(board, blankIndex, targetIndex); // Perform the tile swap
        checkWinCondition(); // Check if this move solved the puzzle (stops timer)

        // --- Slider Focus Fix ---
        if (document.activeElement) document.activeElement.blur();
    }
}

/**
 * @function checkWinCondition
 * @description Checks if the global `board` array is in the solved state.
 *              Updates `isSolved` flag, `gameState`, and stops the timer if solved.
 */
function checkWinCondition() {
    let totalTiles = gridSize * gridSize;
    if (board.length !== totalTiles) { isSolved=false; if(gameState===STATE_SOLVED)gameState=STATE_PLAYING; return;} // Sanity check

    // Check each board position
    for (let i = 0; i < totalTiles; i++) {
        if (board[i] !== i) { // If any tile is out of order
            isSolved = false;
            if (gameState === STATE_SOLVED) gameState = STATE_PLAYING; // Revert if moved after solve
            return; // Not solved
        }
    }
    // If loop completes, it's solved
    if (!isSolved) { // Actions only on the transition to solved
        console.log(">>> PUZZLE SOLVED! <<<");
        timerRunning = false; // Stop timer
        lastFlashToggle = millis(); timerFlashState = true; // Init flash
    }
    isSolved = true; gameState = STATE_SOLVED; // Set flags/state
}

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * @function swap
 * @description Swaps two elements in an array in place.
 * @param {Array} arr - The array.
 * @param {number} i - Index of first element.
 * @param {number} j - Index of second element.
 */
function swap(arr, i, j) {
    [arr[i], arr[j]] = [arr[j], arr[i]]; // ES6 destructuring swap
}

/**
 * @function windowResized
 * @description p5 function called when the browser window is resized.
 *              Adjusts canvas size, recalculates layout, and repositions UI.
 */
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    console.log("Window resized.");
    calculateLayout(); // Recalculate positions, sizes, and source image info cache
    positionElements(); // Reposition UI elements based on current state
    console.log("Window resized processed.");
    // No need to explicitly recreate tiles with the direct drawing method
}