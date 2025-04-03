/**
 * @file sketch.js
 * @description A variable-size image sliding puzzle game built with p5.js.
 * Features a splash screen, default/custom image loading, grid size slider,
 * timer, slider focus fix, and gapless tile rendering using pre-sliced tiles.
 * --- VERSION: Pre-sliced Tiles (Fixed Loading Issue) ---
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
let tiles = [];             // Array to store pre-sliced p5.Image tile objects

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
let isPuzzleReady = false;    // Flag: True when image, tiles, and board are ready
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
            // Enable button if it exists already (might be created after preload in some race conditions)
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

    // Alert if default image failed during preload
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
            text("loading puzzle...", width / 2, height / 2); // Lowercase text
            break;
        case STATE_PLAYING:
        case STATE_SOLVED:
            // Draw puzzle board and timer ONLY if puzzle is ready
            if (isPuzzleReady) {
                drawPuzzleBoard(); // Draws using pre-sliced tiles array
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
    // Create the file input, but keep it visually minimal or hide it if triggered by another button
    fileInput = createFileInput(handleFile)
        .style('color', 'white'); // Basic styling, can be hidden/styled further with CSS
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
    if (fileInput) fileInput.show(); // Show the file input element
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
        // Center splash elements vertically and horizontally
        let currentY = height * 0.3;
        if (splashTitle) { splashTitle.position(0, currentY); currentY += 50; }
        if (splashText) { splashText.position(0, currentY); currentY += 50; }
        if (defaultButton) defaultButton.position(width / 2 - 110, currentY);
        if (uploadButton) uploadButton.position(width / 2 + 10, currentY);
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
    // Assumes calculateLayout() called recently to get puzzleX, puzzleY, puzzleAreaSize
    let uiStartX = puzzleX;
    let uiWidth = puzzleAreaSize;
    let timerHeight = 30; // Estimated space for timer text
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
 * @description Called by 'Use Default' button. Sets active image and starts game.
 */
function useDefaultImage() {
    if (!isDefaultImageLoaded || !defaultPuzzleImage) {
        alert("Default image is not available (load may have failed)."); return;
    }
    console.log("Starting game with default image.");
    puzzleImage = defaultPuzzleImage; // Assign the preloaded image
    startGame(); // Transition state and initialize
}

/**
 * @function triggerUpload
 * @description Called by 'Upload Image' button. Clicks the actual file input element.
 */
function triggerUpload() {
    console.log("Triggering file input click...");
    // The createFileInput element might itself be clickable.
    // If we wanted a custom button to trigger a *hidden* input:
    // uploadButton.mousePressed(() => fileInput.elt.click()); // Assuming fileInput was hidden
    // For now, assume the user clicks the p5-generated file input element or this button.
    // If the p5 element isn't visually prominent, clicking it programmatically is good.
    if (fileInput && fileInput.elt) {
        fileInput.elt.click(); // Clicks the underlying <input type="file">
    } else {
        console.warn("File input element not found to trigger click.");
    }
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
    redraw(); // Force a redraw to show "loading..." immediately

    // Use setTimeout to allow the loading message to render before blocking
    // the main thread with image processing (createImageTiles).
    setTimeout(() => {
        console.log("Attempting to initialize puzzle inside setTimeout...");
        // Attempt to initialize the puzzle; handle success or failure
        if (initializePuzzle(gridSize)) {
            // Success: Show game UI. State (playing/solved) was set by checkWinCondition.
            console.log("Initialization successful. Showing game UI.");
            showGameUI();
        } else {
            // Failure: Revert to splash screen and notify user.
            console.error("Initialization failed. Reverting to splash.");
            gameState = STATE_SPLASH;
            showSplashUI();
            hideGameUI(); // Ensure game UI is hidden on failure
            alert("Error: Failed to prepare the puzzle from the selected image.");
        }
        redraw(); // Redraw again after initialization attempt is complete
    }, 50); // Small delay (50ms) seems sufficient for loading text to appear
}

// =============================================================================
// PUZZLE BOARD DRAWING (Pre-Sliced Tile Method)
// =============================================================================

/**
 * @function drawPuzzleBoard
 * @description Draws the puzzle using the pre-sliced images stored in the `tiles` array.
 */
function drawPuzzleBoard() {
    // Guard clause: Only draw if puzzle is ready and tiles array is populated correctly
    if (!isPuzzleReady || tiles.length !== gridSize * gridSize) {
        console.error(`drawPuzzleBoard called unexpectedly. Ready: ${isPuzzleReady}, Tiles: ${tiles.length}, Expected: ${gridSize*gridSize}`);
        drawErrorState("Error: Tile Data Missing");
        return;
    }

    push(); // Isolate drawing state
    translate(puzzleX, puzzleY); // Move origin to puzzle area corner

    let blankValue = gridSize * gridSize - 1; // Value representing the empty space
    let blankIndex = board.indexOf(blankValue); // Current board position of the blank space

    // Loop through each position on the board (0 to n*n-1)
    for (let i = 0; i < board.length; i++) {
        let tileValue = board[i]; // The piece value (0..n*n-1) currently at this board position 'i'
        if (tileValue === blankValue) continue; // Skip drawing the empty space

        let boardCol = i % gridSize; // Column on the display board
        let boardRow = floor(i / gridSize); // Row on the display board

        // Calculate precise integer Destination rect (dx, dy, dw, dh) for gapless rendering
        // Use floor/round on calculated positions to avoid subpixel rendering issues
        let dx = round(boardCol * tileWidth);
        let dy = round(boardRow * tileHeight);
        // Calculate width/height based on the *next* tile's starting position for precision
        let dNextX = round((boardCol + 1) * tileWidth);
        let dNextY = round((boardRow + 1) * tileHeight);
        let dw = dNextX - dx; // Precise width for this tile
        let dh = dNextY - dy; // Precise height for this tile

        // Draw the pre-sliced tile image using the tileValue as index into the tiles array
        if (tiles[tileValue]) {
            image(tiles[tileValue], dx, dy, dw, dh);
        } else {
            // Draw an error indicator if a tile is unexpectedly missing from the array
            console.warn(`Tile value ${tileValue} missing from tiles array at board index ${i}!`);
            fill(255, 0, 0, 150); noStroke(); // Red error indicator
            rect(dx, dy, dw, dh);
            fill(255); textSize(max(10, dw / 3)); text('?', dx + dw/2, dy + dh/2);
        }
    }

    // --- Draw Final Tile and Solved Overlay (if solved) ---
    if (gameState === STATE_SOLVED && blankIndex !== -1) {
        let blankCol = blankIndex % gridSize;
        let blankRow = floor(blankIndex / gridSize);

        // Calculate precise destination for the final piece (where the blank was)
        let dx = round(blankCol * tileWidth);
        let dy = round(blankRow * tileHeight);
        let dNextX = round((blankCol + 1) * tileWidth);
        let dNextY = round((blankRow + 1) * tileHeight);
        let dw = dNextX - dx;
        let dh = dNextY - dy;

        // Draw the final (missing) piece using the blankValue as index
        if (tiles[blankValue]) {
            image(tiles[blankValue], dx, dy, dw, dh);
        } else {
             console.warn(`Final tile (value ${blankValue}) missing from tiles array!`);
             fill(0, 0, 255, 150); noStroke(); // Blue error indicator
             rect(dx, dy, dw, dh);
        }

        // Draw transparent green solved overlay covering the entire puzzle area
        fill(0, 200, 0, 80); // Semi-transparent green
        noStroke();
        rect(0, 0, puzzleAreaSize, puzzleAreaSize); // Cover the whole translated area

        // Draw "SOLVED!" text centered on the puzzle
        fill(255); // White text
        textSize(max(20, puzzleAreaSize / 8)); // Scale text size with puzzle size
        noStroke(); // Ensure text has no outline
        textAlign(CENTER, CENTER);
        text("SOLVED!", puzzleAreaSize / 2, puzzleAreaSize / 2);
    }
    pop(); // Restore original drawing settings (translation, text align etc.)
}

/**
 * @function drawErrorState
 * @description Helper function to draw an error message within the puzzle area.
 * @param {string} [message="Error: Puzzle Unavailable"] - The error message to display.
 */
function drawErrorState(message = "Error: Puzzle Unavailable") {
     push();
     translate(puzzleX, puzzleY); // Position correctly relative to puzzle area
     fill(50); // Dark background for the area
     noStroke();
     rect(0, 0, puzzleAreaSize, puzzleAreaSize);
     fill(255, 50, 50); // Red text for error
     textSize(max(16, puzzleAreaSize / 15)); // Scale text size
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
 * @description Sets up the core puzzle logic: calculates layout, creates image tiles,
 *              creates the board array, resets timer, shuffles the board.
 *              This version uses the pre-slicing method (createImageTiles).
 * @param {number} size - The dimension of the grid (e.g., 4 for 4x4).
 * @returns {boolean} True if initialization successful, false otherwise.
 */
function initializePuzzle(size) {
    console.log(`Initializing puzzle core for size ${size}x${size}`);
    isPuzzleReady = false; isSolved = false; // Reset flags
    tiles = []; // Clear previous tiles array

    // 1. Validate Input Image - Check if it's assigned and seems like a loaded p5.Image
    if (!puzzleImage || puzzleImage.width <= 0 || puzzleImage.height <= 0) {
        console.error("InitializePuzzle Error: Invalid or not fully loaded puzzleImage.", puzzleImage);
        // Attempt to fall back to default if possible and if current isn't default
        if (isDefaultImageLoaded && puzzleImage !== defaultPuzzleImage) {
             console.warn("Falling back to default image due to invalid puzzleImage.");
             puzzleImage = defaultPuzzleImage;
        } else {
             return false; // Cannot proceed without a valid image
        }
    }

    // 2. Validate Grid Size
    if (size < MIN_GRID_SIZE || size > MAX_GRID_SIZE) {
         console.error(`InitializePuzzle Error: Invalid grid size ${size}.`);
         return false;
    }

    gridSize = size; // Set grid size globally
    // Update UI label immediately if it exists
    if (gridSizeLabel) gridSizeLabel.html(`Grid Size: ${gridSize}x${gridSize}`);
    calculateLayout(); // Recalculate layout (essential for tile dimensions and drawing coords)

    // 3. Create Pre-Sliced Image Tiles
    console.log("Calling createImageTiles...");
    if (!createImageTiles()) { // Call the tile slicing function
        console.error("Failed to create image tiles during initialization.");
        tiles = []; // Ensure tiles array is empty on failure
        return false; // Indicate initialization failure
    }
    console.log("createImageTiles finished successfully.");

    // 4. Setup board array in solved state
    board = [];
    let totalTiles = gridSize * gridSize;
    for (let i = 0; i < totalTiles; i++) {
        board.push(i); // Represents solved state: board[0]=0, board[1]=1, ...
    }

    // 5. Reset Timer state
    timerRunning = false; elapsedTime = 0; startTime = 0;
    timerDisplayString = formatTime(0); // Reset display string
    timerFlashState = true; lastFlashToggle = 0; // Reset flashing state

    // 6. Shuffle the board (modifies 'board' array in place)
    shufflePuzzle();

    // 7. Final Checks and State Setting
    checkWinCondition(); // Sets isSolved flag and adjusts gameState (PLAYING or SOLVED if shuffled to solved)
    isPuzzleReady = true; // Mark the puzzle as ready for drawing NOW
    console.log("Puzzle core initialized successfully. Ready:", isPuzzleReady, "State:", gameState);
    return true; // Indicate successful initialization
}

/**
 * @function createImageTiles
 * @description Slices the main puzzleImage into smaller p5.Image objects
 *              and stores them in the global `tiles` array.
 * @returns {boolean} True if slicing was successful, false otherwise.
 */
function createImageTiles() {
    console.log("Starting createImageTiles...");
    tiles = []; // Ensure array is empty before starting

    // <<<--- Fixed Check: Use width/height instead of isLoaded() ---<<<
    if (!puzzleImage || puzzleImage.width <= 0 || puzzleImage.height <= 0 || gridSize <= 0) {
        console.error(`Cannot create tiles: Invalid image (w:${puzzleImage?.width}, h:${puzzleImage?.height}) or grid size (${gridSize}).`);
        return false;
    }
    console.log(`Image dimensions for tiling: ${puzzleImage.width}x${puzzleImage.height}`);

    // Determine the square area to slice from (centered in the original image)
    let imgSize = min(puzzleImage.width, puzzleImage.height);
    let offsetX = floor((puzzleImage.width - imgSize) / 2);
    let offsetY = floor((puzzleImage.height - imgSize) / 2);
    console.log(`Using source area size: ${imgSize}x${imgSize} with offset (${offsetX}, ${offsetY})`);

    // Calculate the dimensions of each tile *in the source image*
    // Use floating point for calculation accuracy before flooring/rounding for get()
    let srcTileW_float = imgSize / gridSize;
    let srcTileH_float = imgSize / gridSize;

    if (srcTileW_float <= 0 || srcTileH_float <= 0) {
        console.error("Calculated source tile dimension is zero or negative.");
        return false;
    }
    console.log(`Calculated source tile float size: ${srcTileW_float.toFixed(3)} x ${srcTileH_float.toFixed(3)}`);

    let totalTiles = gridSize * gridSize;
    for (let i = 0; i < totalTiles; i++) {
        let col = i % gridSize;
        let row = floor(i / gridSize);

        // Calculate source rectangle (sx, sy, sw, sh) using precise float calculations
        // then floor/round appropriately for the integer-based get() function.

        // Calculate top-left corner (sx, sy) using floats, then floor
        let sx_float = offsetX + col * srcTileW_float;
        let sy_float = offsetY + row * srcTileH_float;
        let sx = floor(sx_float);
        let sy = floor(sy_float);

        // Calculate bottom-right corner using floats, then floor
        let sNextX_float = offsetX + (col + 1) * srcTileW_float;
        let sNextY_float = offsetY + (row + 1) * srcTileH_float;
        // Width/Height is the difference between the floored start of the next tile and the floored start of this one
        let sw = floor(sNextX_float) - sx;
        let sh = floor(sNextY_float) - sy;

        // Clamp coordinates and dimensions to be within the source image bounds and positive
        sx = max(0, sx);
        sy = max(0, sy);
        sw = max(1, sw); // Ensure width is at least 1 pixel
        sh = max(1, sh); // Ensure height is at least 1 pixel

        // Adjust if calculated coordinates + dimensions exceed image boundaries
        if (sx + sw > puzzleImage.width) {
            // console.warn(`Tile ${i}: Clamping sw (${sw}) to fit image width (${puzzleImage.width}) at sx=${sx}`);
            sw = puzzleImage.width - sx;
        }
        if (sy + sh > puzzleImage.height) {
            // console.warn(`Tile ${i}: Clamping sh (${sh}) to fit image height (${puzzleImage.height}) at sy=${sy}`);
            sh = puzzleImage.height - sy;
        }

        // Final check for valid dimensions before calling get()
        if (sx >= puzzleImage.width || sy >= puzzleImage.height || sw <= 0 || sh <= 0) {
            console.error(`FATAL: Invalid source rect calculated for tile ${i}: sx=${sx}, sy=${sy}, sw=${sw}, sh=${sh}. Aborting tile creation.`);
            tiles = []; // Clear partial array
            return false; // Hard fail if any tile calculation is definitively invalid
        }

        // Use p5.Image.get() to extract the tile sub-image
        try {
            // console.log(`Tile ${i}: get(${sx}, ${sy}, ${sw}, ${sh})`);
            let tileImg = puzzleImage.get(sx, sy, sw, sh);
            if (tileImg && tileImg.width > 0 && tileImg.height > 0) {
                tiles.push(tileImg);
            } else {
                throw new Error(`get() returned invalid image for tile ${i}`);
            }
        } catch (e) {
            console.error(`Error using get() for tile ${i} with params: sx=${sx}, sy=${sy}, sw=${sw}, sh=${sh}`, e);
            tiles = []; // Clear partial array on error
            return false; // Fail if p5.Image.get() throws an error
        }
    }

    // Verify the correct number of tiles were created
    if (tiles.length !== totalTiles) {
         console.error(`Tile creation finished, but count mismatch: Expected ${totalTiles}, got ${tiles.length}`);
         tiles = []; // Clear potentially incomplete array
         return false;
    }

    console.log(`Tiles created successfully: ${tiles.length}`);
    return true; // Success!
}


/**
 * @function resetPuzzle
 * @description Resets and shuffles the puzzle using the current image and grid size settings.
 */
function resetPuzzle() {
     console.log("Resetting puzzle...");
     if (!puzzleImage) {
         alert("Cannot reset, no image is currently loaded.");
         console.warn("Reset attempt failed: puzzleImage is null.");
         return;
     }

     // Immediately hide game UI and show loading state
     hideGameUI();
     gameState = STATE_LOADING;
     isPuzzleReady = false; // Mark as not ready while loading/initializing
     redraw(); // Force redraw to show "loading..."

    // Use setTimeout to allow loading message to show before potentially blocking re-initialization
     setTimeout(() => {
        console.log("Attempting to re-initialize puzzle inside setTimeout (reset)...");
        // Re-initialize the puzzle. Handle success/failure.
        if (initializePuzzle(gridSize)) {
            console.log("Re-initialization successful. Showing game UI.");
            showGameUI(); // Ensure game UI is visible after successful reset
            // Game state (PLAYING/SOLVED) is set by checkWinCondition within initializePuzzle
        } else {
            // If re-initialization fails, revert to splash screen
            console.error("Re-initialization failed during reset. Reverting to splash.");
            gameState = STATE_SPLASH;
            showSplashUI();
            // hideGameUI(); // Already hidden
            alert("Error re-initializing puzzle. Returning to start screen.");
        }
        redraw(); // Redraw after reset attempt is complete
     }, 50); // Short delay
}

/**
 * @function calculateLayout
 * @description Calculates the centered puzzle position (puzzleX, puzzleY, puzzleAreaSize)
 *              and tile dimensions (tileWidth, tileHeight) based on window size.
 */
function calculateLayout() {
    let safeMargin = 30; // Minimum margin around canvas edges
    let uiSpace = 180; // Estimated vertical space needed for UI elements below puzzle

    // Calculate available space, leaving room for margins and UI below
    let availableWidth = windowWidth - safeMargin * 2;
    let availableHeight = windowHeight - safeMargin * 2 - uiSpace;

    // Puzzle area is the largest square that fits in the available space
    puzzleAreaSize = floor(min(availableWidth, availableHeight));
    // Ensure puzzle area has a minimum size if window is very small
    puzzleAreaSize = max(100, puzzleAreaSize); // e.g., Minimum 100x100 pixels

    // Center the puzzle area horizontally
    puzzleX = floor((windowWidth - puzzleAreaSize) / 2);

    // Position the puzzle area vertically, trying to center the puzzle+UI block
    let totalContentHeight = puzzleAreaSize + uiSpace;
    puzzleY = floor((windowHeight - totalContentHeight) / 2) + safeMargin / 2; // Adjust vertical centering slightly
    // Ensure puzzle stays within top margin
    puzzleY = max(safeMargin, puzzleY);

    // Calculate display tile dimensions (can be fractional, drawing handles rounding)
    if (gridSize > 0) {
        tileWidth = puzzleAreaSize / gridSize;
        tileHeight = puzzleAreaSize / gridSize;
    } else {
        // Avoid division by zero if gridSize is somehow invalid
        tileWidth = 0;
        tileHeight = 0;
    }
    // Optional: Log layout updates (can be noisy)
    // console.log(`Layout Updated: Area=${puzzleAreaSize}px @ (${puzzleX},${puzzleY}), TileW=${tileWidth.toFixed(3)}px`);
}

/**
 * @function shufflePuzzle
 * @description Randomizes the order of elements in the global `board` array
 *              using a series of valid swaps starting from the blank tile's position.
 *              Ensures the resulting puzzle is solvable (by only using swaps).
 */
function shufflePuzzle() {
    console.log("Shuffling board...");
    let blankValue = gridSize * gridSize - 1;
    let blankIndex = board.indexOf(blankValue); // Find current position of blank

    // Safety check/recovery for blank tile (should not be needed if init is correct)
    if (blankIndex === -1) {
        console.error("Shuffle Error: Blank tile index (-1) not found in board!", board);
        // Attempt recovery: reset board to solved state and find blank
        board = Array.from({ length: gridSize * gridSize }, (_, i) => i);
        blankIndex = board.indexOf(blankValue);
        if (blankIndex === -1) {
             console.error("FATAL: Cannot recover board for shuffling!");
             return; // Abort shuffle if recovery fails
        }
        console.warn("Recovered blank index for shuffling by resetting board.");
    }

    // Perform a large number of random, valid moves to shuffle
    // More moves generally lead to better shuffling, scale with grid size complexity
    let shuffleMoves = 150 * (gridSize * gridSize); // Increased multiplier for thoroughness
    let lastMoveSourceIndex = -1; // Prevent immediately swapping back

    for (let i = 0; i < shuffleMoves; i++) {
        let possibleMoveTargetIndices = []; // Indices of tiles that *can* be swapped into the blank space
        let blankRow = floor(blankIndex / gridSize);
        let blankCol = blankIndex % gridSize;

        // Check potential moves (tile index to swap with blank)
        let tileAboveIndex = blankIndex - gridSize;
        let tileBelowIndex = blankIndex + gridSize;
        let tileLeftIndex = blankIndex - 1;
        let tileRightIndex = blankIndex + 1;

        // Check UP (can tile below move up? Is it not the one just moved?)
        if (blankRow < gridSize - 1 && tileBelowIndex !== lastMoveSourceIndex) possibleMoveTargetIndices.push(tileBelowIndex);
        // Check DOWN (can tile above move down? Is it not the one just moved?)
        if (blankRow > 0 && tileAboveIndex !== lastMoveSourceIndex) possibleMoveTargetIndices.push(tileAboveIndex);
        // Check LEFT (can tile right move left? Is it not the one just moved?)
        if (blankCol < gridSize - 1 && tileRightIndex !== lastMoveSourceIndex) possibleMoveTargetIndices.push(tileRightIndex);
        // Check RIGHT (can tile left move right? Is it not the one just moved?)
        if (blankCol > 0 && tileLeftIndex !== lastMoveSourceIndex) possibleMoveTargetIndices.push(tileLeftIndex);

        if (possibleMoveTargetIndices.length > 0) {
            // Pick a random valid move target index
            let moveTargetIndex = random(possibleMoveTargetIndices);

            // Swap the blank tile with the chosen adjacent tile
            swap(board, blankIndex, moveTargetIndex);

            // Update blank position and record where the blank *used to be* to prevent immediate reversal
            lastMoveSourceIndex = blankIndex; // The position the blank just moved FROM
            blankIndex = moveTargetIndex;     // The new position the blank moved TO
        } else {
            // If no moves possible (e.g., only possible move is reversing the last), reset the constraint
             lastMoveSourceIndex = -1; // Allow moving back if temporarily stuck
             // i--; // Optionally don't count this as a move if stuck, or just proceed
             // console.warn("Shuffle temporary stuck? Resetting last move constraint.");
        }
    }
    isSolved = checkWinCondition(); // Check if somehow shuffled back to solved state
    if (!isSolved) {
        console.log("Shuffle complete. Board is randomized.");
    } else {
        console.warn("Shuffle resulted in a solved state (rare but possible).");
    }
    // Ensure game state reflects shuffled status (unless solved)
    if (!isSolved && gameState === STATE_SOLVED) gameState = STATE_PLAYING;
}


// =============================================================================
// INPUT HANDLERS (Slider, File Upload, Keyboard)
// =============================================================================

/**
 * @function handleSliderChange
 * @description Callback for the grid size slider. Updates size and re-initializes puzzle if game is active.
 */
function handleSliderChange() {
    let newSize = gridSizeSlider.value();
    if (newSize !== gridSize) {
        console.log("Slider changed to:", newSize);
        // If game is currently active (playing or solved), need to re-initialize
        if (gameState === STATE_PLAYING || gameState === STATE_SOLVED) {
            // Hide UI, show loading, then re-init
            hideGameUI();
            gameState = STATE_LOADING;
            isPuzzleReady = false;
            redraw(); // Show loading message

            setTimeout(() => {
                console.log("Attempting re-initialization due to slider change...");
                if (initializePuzzle(newSize)) { // Calls initialize with NEW size
                    console.log("Re-initialization from slider successful.");
                    showGameUI(); // Re-show game UI
                } else {
                    // Re-init failed, revert to splash
                    console.error("Re-initialization from slider failed.");
                    gameState = STATE_SPLASH;
                    showSplashUI();
                    alert("Error changing grid size. Returning to start.");
                }
                redraw(); // Update display after attempt
            }, 50);
        } else {
             // If game is not active (e.g., on splash screen), just update the variable and label
             gridSize = newSize;
             if (gridSizeLabel) gridSizeLabel.html(`Grid Size: ${gridSize}x${gridSize}`);
             console.log("Slider changed while inactive. Size set to:", newSize);
        }
    }
}

/**
 * @function handleFile
 * @description Callback for the file input. Loads selected image and re-initializes puzzle.
 * @param {p5.File} file - The file object from the input element (contains data, type, etc.).
 */
function handleFile(file) {
    console.log("File input changed:", file);
    // Basic validation of the file object
    if (!file || !file.type || !file.data) {
        console.warn("Invalid file object received from input.");
        alert("Could not process the selected file. Please try again.");
        if (fileInput) fileInput.value(''); // Clear the input
        return;
    }

    // Check if the file type indicates an image
    if (file.type.startsWith('image')) {
        console.log(`Attempting to load image from file data (type: ${file.type})...`);
        // Hide all UI elements and show loading state
        hideSplashUI(); hideGameUI();
        gameState = STATE_LOADING;
        isPuzzleReady = false;
        redraw(); // Update display to show "loading..."

        // Load the image from the file's data URL
        loadImage(file.data,
            // Success Callback for loadImage
            (newImg) => {
                console.log("Custom image loaded successfully from file.");
                puzzleImage = newImg; // Update the active puzzle image

                // Use setTimeout for initialization to allow loading screen update
                setTimeout(() => {
                    console.log("Attempting initialization with uploaded image...");
                    if (initializePuzzle(gridSize)) { // Initialize with the new image and current grid size
                        console.log("Initialization with upload successful.");
                        showGameUI(); // Show game UI if init succeeds
                    } else { // Handle initialization failure
                        console.error("Initialization with upload failed.");
                        gameState = STATE_SPLASH; // Revert to splash
                        showSplashUI();
                        alert("Error preparing puzzle from the uploaded image. Please try another image or check console for errors.");
                    }
                    redraw(); // Update display after init attempt
                }, 50);

                // Clear the file input value so the same file can be selected again if needed
                if (fileInput) fileInput.value('');

            },
            // Error Callback for loadImage
            (err) => {
                console.error("Error loading image data from file using loadImage:", err);
                alert("Failed to load the file as an image. Please ensure it's a supported format (JPG, PNG, GIF, WebP) and not corrupted.");
                if (fileInput) fileInput.value(''); // Clear input on error too
                // Revert to splash screen on image load failure
                gameState = STATE_SPLASH; showSplashUI(); // hideGameUI(); implicitly done earlier
                redraw();
            }
        );
    } else {
        // File type is not recognized as an image
        console.warn("Uploaded file type is not 'image':", file.type);
        alert(`The selected file (${file.name || 'unknown'}) does not appear to be an image (type: ${file.type}). Please upload an image file.`);
        if (fileInput) fileInput.value(''); // Clear the input
    }
}

/**
 * @function keyPressed
 * @description p5 function called when a key is pressed. Handles arrow key movement for the puzzle,
 *              starts the timer on the first valid move, and fixes slider focus issue.
 */
function keyPressed() {
    // Ignore input if not in the playing state or if the puzzle isn't ready yet
    if (gameState !== STATE_PLAYING || !isPuzzleReady) {
        // Allow arrow keys if slider is focused, maybe? No, let's keep it simple.
        return;
    }

    let blankValue = gridSize * gridSize - 1;
    let blankIndex = board.indexOf(blankValue); // Find where the blank space is

    // Should always find the blank in a valid puzzle state
    if (blankIndex === -1) {
        console.error("Keypress error: Blank index not found in board during PLAYING state!");
        return; // Exit if blank somehow missing
    }

    let targetIndex = -1; // Board index of the tile to swap with the blank
    let blankRow = floor(blankIndex / gridSize);
    let blankCol = blankIndex % gridSize;

    // Determine which tile (targetIndex) should move into the blank space based on arrow key
    // Note: UP_ARROW means the tile *below* the blank moves up.
    if (keyCode === UP_ARROW && blankRow < gridSize - 1) { // Check if blank is not in the bottom row
        targetIndex = blankIndex + gridSize; // Tile below the blank
    } else if (keyCode === DOWN_ARROW && blankRow > 0) { // Check if blank is not in the top row
        targetIndex = blankIndex - gridSize; // Tile above the blank
    } else if (keyCode === LEFT_ARROW && blankCol < gridSize - 1) { // Check if blank is not in the rightmost column
        targetIndex = blankIndex + 1; // Tile to the right of the blank
    } else if (keyCode === RIGHT_ARROW && blankCol > 0) { // Check if blank is not in the leftmost column
        targetIndex = blankIndex - 1; // Tile to the left of the blank
    }

    // If a valid move target was identified
    if (targetIndex !== -1 && targetIndex >= 0 && targetIndex < board.length) {

        // Start Timer only on the very first valid move of the game
        if (!timerRunning && !isSolved) { // Check !isSolved too, though unlikely here
            timerRunning = true;
            startTime = millis(); // Record start time
            elapsedTime = 0;      // Reset elapsed time
            console.log("Timer started!");
        }

        // Perform the tile swap in the board array
        swap(board, blankIndex, targetIndex);

        // Check if this move resulted in solving the puzzle
        checkWinCondition(); // This updates isSolved, gameState, and stops timer if solved

        // --- Slider Focus Fix ---
        // If a DOM element like the slider has focus, arrow keys might control it.
        // Blurring the active element returns focus to the sketch/body, allowing keys for puzzle.
        if (document.activeElement && document.activeElement !== document.body) {
           // console.log("Blurring active element:", document.activeElement.tagName);
           document.activeElement.blur();
        }

        // Prevent default browser behavior for arrow keys (like scrolling the page)
        return false;
    }
}

/**
 * @function checkWinCondition
 * @description Checks if the global `board` array is in the solved state (0, 1, 2,... n*n-1).
 *              Updates `isSolved` flag, `gameState`, stops timer, and initializes flashing if solved.
 * @returns {boolean} True if the puzzle is solved, false otherwise.
 */
function checkWinCondition() {
    let totalTiles = gridSize * gridSize;
    // Basic sanity check for board length (should always pass if init is correct)
    if (!board || board.length !== totalTiles) {
        console.error("Win check failed: Board is null or length mismatch!", board);
        isSolved = false;
        // If state was solved, revert it, as the board is inconsistent
        if (gameState === STATE_SOLVED) gameState = STATE_PLAYING;
        return false; // Cannot be solved if board is invalid
    }

    // Check each board position against its expected value in the solved state
    for (let i = 0; i < totalTiles; i++) {
        if (board[i] !== i) { // If any tile is out of its solved position (board[i] should equal i)
            const previouslySolved = isSolved; // Store previous state
            isSolved = false; // Mark as not solved

            // If it *was* solved just before this check (e.g., user moved a tile after solving),
            // revert the game state back to PLAYING.
            if (previouslySolved) {
                console.log("Puzzle moved out of solved state.");
                gameState = STATE_PLAYING;
                timerFlashState = true; // Reset flashing state
                // Optionally restart timer? Current logic keeps timer stopped.
            }
            return false; // Not solved, exit check early
        }
    }

    // If the loop completes without returning false, the puzzle is solved!
    if (!isSolved) { // Check if this is the moment it *became* solved
        console.log(">>> PUZZLE SOLVED! <<<");
        timerRunning = false; // Stop the timer
        // Initialize timer flashing effect
        lastFlashToggle = millis(); // Record time for first flash cycle
        timerFlashState = true;     // Start with timer visible
    }
    isSolved = true; // Mark as solved
    gameState = STATE_SOLVED; // Set game state to solved
    return true; // Is solved
}

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * @function swap
 * @description Swaps two elements in an array in place. Includes index validation.
 * @param {Array} arr - The array.
 * @param {number} i - Index of first element.
 * @param {number} j - Index of second element.
 */
function swap(arr, i, j) {
    // Ensure array exists and indices are valid before attempting swap
    if (arr && i >= 0 && i < arr.length && j >= 0 && j < arr.length) {
        // ES6 destructuring assignment for a concise swap
        [arr[i], arr[j]] = [arr[j], arr[i]];
    } else {
        console.warn(`Swap attempt with invalid array or indices: arr length=${arr?.length}, i=${i}, j=${j}`);
    }
}

/**
 * @function windowResized
 * @description p5 function called automatically when the browser window is resized.
 *              Adjusts canvas size, recalculates layout (puzzle size/pos, tile size),
 *              and repositions UI elements. Does NOT re-slice tiles.
 */
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    console.log(`Window resized to ${windowWidth}x${windowHeight}. Recalculating layout.`);

    // Recalculate positions, puzzle size, and display tile dimensions
    calculateLayout();

    // Reposition UI elements based on the current game state and the new layout
    positionElements(); // This calls calculateLayout again internally, but ok

    console.log("Layout and UI repositioned after resize.");
    // Note: Re-slicing tiles (calling createImageTiles) on resize is generally not
    // necessary or desirable, as it's computationally expensive. The existing
    // pre-sliced tiles will simply be drawn scaled to the new tileWidth/tileHeight
    // calculated by calculateLayout.
}