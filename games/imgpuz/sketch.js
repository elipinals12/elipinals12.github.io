/**
 * @file sketch.js
 * @description A variable-size image sliding puzzle game built with p5.js.
 * Features a splash screen, default/custom image loading, grid size slider,
 * timer, slider focus fix, and gapless tile rendering using pre-sliced tiles.
 */

// --- Constants ---
const MIN_GRID_SIZE = 2;        // Minimum selectable grid dimension
const MAX_GRID_SIZE = 10;       // Maximum selectable grid dimension
const DEFAULT_GRID_SIZE = 4;    // Initial grid dimension
const DEFAULT_IMAGE_PATH = './realtree.jpg'; // Default image location relative to HTML (adjust if needed)

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
let tiles = [];             // <<<--- Array to store pre-sliced p5.Image tile objects

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
                drawPuzzleBoard(); // <<<--- Draws using pre-sliced tiles array
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
    if (fileInput) fileInput.show(); // Show file input (it's styled to be less obtrusive)
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
        // Try to center the file input roughly
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
    puzzleImage = defaultPuzzleImage;
    startGame(); // Transition state and initialize
}

/**
 * @function triggerUpload
 * @description Called by 'Upload Image' buttons. Clicks the hidden file input.
 */
function triggerUpload() {
    console.log("Triggering file input click...");
    // Using createFileInput automatically creates a visible label/button.
    // If we wanted a custom button to trigger a hidden input:
    // fileInput = createFileInput(handleFile).hide();
    // uploadButton.mousePressed(() => fileInput.elt.click());
    // Since createFileInput is used, this direct trigger might not be needed
    // if the user clicks the default p5 file input element.
    // Let's keep it in case the CSS hides the default one and relies on our button.
    if (fileInput) {
        fileInput.elt.click(); // Clicks the hidden <input type="file"> element
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
        redraw(); // Redraw again after initialization attempt
    }, 50); // Small delay (50ms) seems sufficient
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
        console.error("drawPuzzleBoard called unexpectedly when puzzle not ready or tiles missing.");
        drawErrorState("Error: Tile Data Missing");
        return;
    }

    push(); // Isolate drawing state
    translate(puzzleX, puzzleY); // Move origin to puzzle area corner

    let blankValue = gridSize * gridSize - 1;
    let blankIndex = board.indexOf(blankValue);

    // Loop through each position on the board
    for (let i = 0; i < board.length; i++) {
        let tileIndex = board[i]; // The piece index (0..n*n-1) currently at this board position
        if (tileIndex === blankValue) continue; // Skip drawing the empty space

        let boardCol = i % gridSize; let boardRow = floor(i / gridSize);

        // Calculate precise integer Destination rect (dx, dy, dw, dh) for gapless rendering
        let dx = round(boardCol * tileWidth);
        let dy = round(boardRow * tileHeight);
        // Calculate width/height based on the *next* tile's starting position for precision
        let dNextX = round((boardCol + 1) * tileWidth);
        let dNextY = round((boardRow + 1) * tileHeight);
        let dw = dNextX - dx;
        let dh = dNextY - dy;

        // Draw the pre-sliced tile image
        if (tiles[tileIndex]) {
            image(tiles[tileIndex], dx, dy, dw, dh);
        } else {
            // Draw an error indicator if a tile is unexpectedly missing
            console.warn(`Tile index ${tileIndex} missing from tiles array!`);
            fill(255, 0, 0, 150); noStroke();
            rect(dx, dy, dw, dh);
            fill(255); textSize(10); text('?', dx + dw/2, dy + dh/2);
        }
    }

    // --- Draw Final Tile and Solved Overlay (if solved) ---
    if (gameState === STATE_SOLVED && blankIndex !== -1) {
        let blankCol = blankIndex % gridSize;
        let blankRow = floor(blankIndex / gridSize);

        // Calculate precise destination for the blank spot
        let dx = round(blankCol * tileWidth);
        let dy = round(blankRow * tileHeight);
        let dNextX = round((blankCol + 1) * tileWidth);
        let dNextY = round((blankRow + 1) * tileHeight);
        let dw = dNextX - dx;
        let dh = dNextY - dy;

        // Draw the final (missing) piece
        if (tiles[blankValue]) {
            image(tiles[blankValue], dx, dy, dw, dh);
        } else {
             console.warn(`Final tile index ${blankValue} missing from tiles array!`);
             fill(0, 0, 255, 150); noStroke(); // Blue error indicator
             rect(dx, dy, dw, dh);
        }

        // Draw transparent green solved overlay
        fill(0, 200, 0, 80); noStroke();
        rect(0, 0, puzzleAreaSize, puzzleAreaSize);
        // Draw "SOLVED!" text
        fill(255); textSize(puzzleAreaSize / 8); noStroke();
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
     fill(50); rect(0, 0, puzzleAreaSize, puzzleAreaSize); // Dark background for area
     fill(255, 50, 50); textSize(20); // Red text
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
 * @description Sets up the core puzzle logic: calculates layout, creates image tiles,
 *              creates the board array, resets timer, shuffles the board.
 *              This version uses the pre-slicing method (createImageTiles).
 * @param {number} size - The dimension of the grid (e.g., 4 for 4x4).
 * @returns {boolean} True if initialization successful, false otherwise.
 */
function initializePuzzle(size) {
    console.log(`Initializing puzzle core for size ${size}x${size}`);
    isPuzzleReady = false; isSolved = false; // Reset flags
    tiles = []; // Clear previous tiles

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
    calculateLayout(); // Recalculate layout (essential for tile dimensions)

    // 3. Create Pre-Sliced Image Tiles
    if (!createImageTiles()) { // <<<--- Call the tile slicing function
        console.error("Failed to create image tiles.");
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
 * @function createImageTiles
 * @description Slices the main puzzleImage into smaller p5.Image objects
 *              and stores them in the global `tiles` array.
 * @returns {boolean} True if slicing was successful, false otherwise.
 */
function createImageTiles() {
    console.log("Creating image tiles...");
    tiles = []; // Ensure array is empty

    if (!puzzleImage || !puzzleImage.isLoaded() || puzzleImage.width <= 0 || gridSize <= 0) {
        console.error("Cannot create tiles: Invalid image or grid size.");
        return false;
    }

    // Determine the square area to slice from (centered in the original image)
    let imgSize = min(puzzleImage.width, puzzleImage.height);
    let offsetX = floor((puzzleImage.width - imgSize) / 2);
    let offsetY = floor((puzzleImage.height - imgSize) / 2);

    // Calculate the dimensions of each tile in the source image
    // Use floating point for calculation, but floor/round when getting pixels
    let srcTileW_float = imgSize / gridSize;
    let srcTileH_float = imgSize / gridSize;

    if (srcTileW_float <= 0 || srcTileH_float <= 0) {
        console.error("Calculated source tile dimension is zero or negative.");
        return false;
    }

    let totalTiles = gridSize * gridSize;
    for (let i = 0; i < totalTiles; i++) {
        let col = i % gridSize;
        let row = floor(i / gridSize);

        // Calculate source (sx, sy) using floats for accuracy, then floor
        let sx_float = offsetX + col * srcTileW_float;
        let sy_float = offsetY + row * srcTileH_float;
        let sx = floor(sx_float);
        let sy = floor(sy_float);

        // Calculate source (sw, sh) based on the start of the *next* tile, then floor difference
        let sNextX_float = offsetX + (col + 1) * srcTileW_float;
        let sNextY_float = offsetY + (row + 1) * srcTileH_float;
        let sw = floor(sNextX_float) - sx;
        let sh = floor(sNextY_float) - sy;

        // Clamp dimensions to image bounds and ensure they are positive
        sx = max(0, sx);
        sy = max(0, sy);
        sw = max(1, sw); // Ensure width is at least 1
        sh = max(1, sh); // Ensure height is at least 1

        // Adjust if calculated size exceeds image boundaries
        if (sx + sw > puzzleImage.width) { sw = puzzleImage.width - sx; }
        if (sy + sh > puzzleImage.height) { sh = puzzleImage.height - sy; }

        // Final check for valid dimensions before calling get()
        if (sx >= puzzleImage.width || sy >= puzzleImage.height || sw <= 0 || sh <= 0) {
            console.error(`Invalid source rect calculated for tile ${i}: sx=${sx}, sy=${sy}, sw=${sw}, sh=${sh}. Skipping.`);
            // Push a placeholder or handle error? Pushing null might be problematic.
            // For now, let's log error and continue, hoping draw board handles missing tiles.
            // It might be better to return false here.
            return false; // Hard fail if any tile calculation is invalid
        }

        try {
            let tileImg = puzzleImage.get(sx, sy, sw, sh);
            tiles.push(tileImg);
        } catch (e) {
            console.error(`Error using get() for tile ${i} with params: sx=${sx}, sy=${sy}, sw=${sw}, sh=${sh}`, e);
            return false; // Fail if get() throws an error
        }
    }

    // Verify the correct number of tiles were created
    if (tiles.length !== totalTiles) {
         console.error(`Tile creation failed: Expected ${totalTiles}, got ${tiles.length}`);
         tiles = []; // Clear potentially incomplete array
         return false;
    }

    console.log(`Tiles created successfully: ${tiles.length}`);
    return true;
}


/**
 * @function resetPuzzle
 * @description Resets and shuffles the puzzle using the current image and grid size settings.
 */
function resetPuzzle() {
     console.log("Resetting puzzle...");
     if (!puzzleImage) { alert("Cannot reset, no image is currently loaded."); return; }

     // Need to hide game UI immediately to avoid drawing errors if init fails
     hideGameUI();
     gameState = STATE_LOADING; // Show loading briefly
     isPuzzleReady = false; // Ensure it's not ready while loading
     redraw(); // Show loading message

    // Use setTimeout to allow loading message to show before potential blocking call
     setTimeout(() => {
        // Re-initialize the puzzle. Handle success/failure.
        if (initializePuzzle(gridSize)) {
            showGameUI(); // Ensure game UI is visible
            // Game state is set by checkWinCondition within initializePuzzle
        } else {
            // If re-initialization fails, revert to splash screen
            gameState = STATE_SPLASH;
            showSplashUI();
            // hideGameUI(); // Already hidden
            alert("Error re-initializing puzzle. Returning to start screen.");
        }
        redraw(); // Redraw after reset attempt
     }, 50);
}

/**
 * @function calculateLayout
 * @description Calculates the centered puzzle position (puzzleX, puzzleY, puzzleAreaSize)
 *              and tile dimensions (tileWidth, tileHeight).
 */
function calculateLayout() {
    let safeMargin = 30; let uiSpace = 180; // Adjusted spacing

    // Calculate available space, leaving room for margins and UI below
    let availableWidth = windowWidth - safeMargin * 2;
    let availableHeight = windowHeight - safeMargin * 2 - uiSpace;

    // Puzzle area is the largest square that fits
    puzzleAreaSize = floor(min(availableWidth, availableHeight));
    if (puzzleAreaSize < 50) puzzleAreaSize = 50; // Minimum size safeguard

    // Center the puzzle area horizontally, position vertically considering UI space
    puzzleX = floor((windowWidth - puzzleAreaSize) / 2);
    // Try to center the puzzle+UI block vertically
    let totalContentHeight = puzzleAreaSize + uiSpace;
    puzzleY = floor((windowHeight - totalContentHeight) / 2) + safeMargin / 2; // Adjust vertical centering
    puzzleY = max(safeMargin, puzzleY); // Ensure top margin

    // Calculate display tile dimensions (can be fractional)
    if (gridSize > 0) {
        tileWidth = puzzleAreaSize / gridSize;
        tileHeight = puzzleAreaSize / gridSize;
    } else {
        tileWidth = 0; tileHeight = 0;
    }
    // console.log(`Layout Updated: Area=${puzzleAreaSize}px @ (${puzzleX},${puzzleY}), TileW=${tileWidth.toFixed(3)}px`); // Less verbose logging
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
    let blankIndex = board.indexOf(blankValue);

    // Safety check/recovery for blank tile (shouldn't happen with current init logic)
    if (blankIndex === -1) {
        console.error("Shuffle Error: Blank tile index not found in board!");
        // Attempt to recover by finding the blank value or resetting board (less ideal)
        board = []; let tt=gridSize*gridSize; for(let i=0;i<tt;i++) board.push(i); blankIndex=tt-1;
        if (board.length === 0 || blankIndex >= board.length || board[blankIndex] !== blankValue) {
             console.error("Cannot recover board for shuffling!");
             return; // Abort shuffle if recovery fails
        }
        console.warn("Recovered blank index for shuffling.");
    }

    // Perform a large number of random, valid moves to shuffle
    // More moves generally lead to better shuffling, scale with grid size
    let shuffleMoves = 100 * (gridSize * gridSize); // Increased multiplier
    let lastMoveSource = -1; // Prevent immediately moving back

    for (let i = 0; i < shuffleMoves; i++) {
        let possibleMoves = [];
        let blankRow = floor(blankIndex / gridSize);
        let blankCol = blankIndex % gridSize;

        // Check potential moves (tile index to swap with blank)
        let above = blankIndex - gridSize;
        let below = blankIndex + gridSize;
        let left = blankIndex - 1;
        let right = blankIndex + 1;

        // Check UP (if not in top row and not the last moved tile)
        if (blankRow > 0 && above !== lastMoveSource) possibleMoves.push(above);
        // Check DOWN (if not in bottom row and not the last moved tile)
        if (blankRow < gridSize - 1 && below !== lastMoveSource) possibleMoves.push(below);
        // Check LEFT (if not in first column and not the last moved tile)
        if (blankCol > 0 && left !== lastMoveSource) possibleMoves.push(left);
        // Check RIGHT (if not in last column and not the last moved tile)
        if (blankCol < gridSize - 1 && right !== lastMoveSource) possibleMoves.push(right);

        if (possibleMoves.length > 0) {
            // Pick a random valid move
            let moveIndex = floor(random(possibleMoves.length));
            let targetIndex = possibleMoves[moveIndex];

            // Swap the blank tile with the chosen tile
            swap(board, blankIndex, targetIndex);

            // Update blank position and record the source of this move
            lastMoveSource = blankIndex; // Record where the blank *was*
            blankIndex = targetIndex;   // Update where the blank *is now*
        } else {
            // If no moves possible (shouldn't happen unless stuck, maybe reset lastMoveSource?)
             lastMoveSource = -1; // Allow moving back if stuck somehow
             i--; // Don't count this as a move
             // console.warn("Shuffle temporary stuck? Resetting last move constraint.");
        }
    }
    isSolved = false; // Ensure puzzle is marked as not solved after shuffling
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
        // Hide UI, show loading, then re-init
        hideGameUI();
        gameState = STATE_LOADING;
        isPuzzleReady = false;
        redraw(); // Show loading message

        setTimeout(() => {
            if (initializePuzzle(newSize)) {
                showGameUI(); // Re-init succeeded, show game UI
            } else {
                // Re-init failed, revert to splash
                gameState = STATE_SPLASH;
                showSplashUI();
                alert("Error changing grid size.");
            }
            redraw(); // Redraw after attempt
        }, 50);
    } else if (newSize !== gridSize) { // If game inactive, just update var and label
         gridSize = newSize;
         if (gridSizeLabel) gridSizeLabel.html(`Grid Size: ${gridSize}x${gridSize}`);
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
    if (!file || !file.type || !file.data) {
        console.warn("Invalid file object received.");
        alert("Could not process the selected file.");
        return;
    }

    // Check file type (basic check)
    if (file.type === 'image') {
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

                // Use setTimeout for initialization to allow loading screen
                setTimeout(() => {
                    if (initializePuzzle(gridSize)) { // Initialize with the new image
                        showGameUI(); // Show game UI if init succeeds
                    } else { // Handle initialization failure
                        gameState = STATE_SPLASH; showSplashUI(); // hideGameUI(); // already hidden
                        alert("Error preparing puzzle from uploaded image.");
                    }
                    redraw(); // Update after init attempt
                }, 50);

                // Clear the file input value for potential re-uploads
                if (fileInput) fileInput.value('');

            },
            // Error Callback for loadImage
            (err) => {
                console.error("Error loading image data from file:", err);
                alert("Failed to load file as image. Please use JPG, PNG, GIF, or WebP format.");
                if (fileInput) fileInput.value(''); // Clear input on error too
                // Revert to splash screen on image load failure
                gameState = STATE_SPLASH; showSplashUI(); hideGameUI();
                redraw();
            }
        );
    } else {
        console.warn("File type is not 'image':", file.type);
        alert(`File is not recognized as an image (${file.type}). Please upload an image file.`);
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
        console.error("Keypress error: Blank index not found!");
        return; // Exit if blank not found
    }

    let targetIndex = -1; // Board index of the tile to swap with the blank
    let blankRow = floor(blankIndex / gridSize);
    let blankCol = blankIndex % gridSize;

    // Determine target index based on arrow key pressed and boundaries
    // Remember: UP arrow moves the tile BELOW the blank UP into the blank space.
    if (keyCode === UP_ARROW && blankRow < gridSize - 1) { // Can move tile below blank up?
        targetIndex = blankIndex + gridSize;
    } else if (keyCode === DOWN_ARROW && blankRow > 0) { // Can move tile above blank down?
        targetIndex = blankIndex - gridSize;
    } else if (keyCode === LEFT_ARROW && blankCol < gridSize - 1) { // Can move tile right of blank left?
        targetIndex = blankIndex + 1;
    } else if (keyCode === RIGHT_ARROW && blankCol > 0) { // Can move tile left of blank right?
        targetIndex = blankIndex - 1;
    }

    // If a valid move was identified (targetIndex is a valid board index)
    if (targetIndex !== -1 && targetIndex >= 0 && targetIndex < board.length) {
        // Start Timer only on the very first valid move of the game
        if (!timerRunning && !isSolved) {
            timerRunning = true; startTime = millis(); elapsedTime = 0;
            console.log("Timer started!");
        }

        swap(board, blankIndex, targetIndex); // Perform the tile swap
        checkWinCondition(); // Check if this move solved the puzzle (stops timer)

        // --- Slider Focus Fix ---
        // If the slider (or any other DOM element) has focus, arrow keys might
        // control that element instead of the puzzle. Blurring removes focus.
        if (document.activeElement) {
            document.activeElement.blur();
        }

        return false; // Prevent default browser behavior for arrow keys (scrolling)
    }
}

/**
 * @function checkWinCondition
 * @description Checks if the global `board` array is in the solved state (0, 1, 2,... n*n-1).
 *              Updates `isSolved` flag, `gameState`, and stops the timer if solved.
 */
function checkWinCondition() {
    let totalTiles = gridSize * gridSize;
    // Basic sanity check for board length
    if (board.length !== totalTiles) {
        console.error("Win check failed: Board length mismatch!");
        isSolved = false;
        if (gameState === STATE_SOLVED) gameState = STATE_PLAYING; // Revert state if mismatch occurs
        return;
    }

    // Check each board position against its expected value
    for (let i = 0; i < totalTiles; i++) {
        if (board[i] !== i) { // If any tile is out of its solved position
            isSolved = false;
            // If it was previously solved, switch back to playing state
            if (gameState === STATE_SOLVED) {
                gameState = STATE_PLAYING;
                timerFlashState = true; // Reset flashing just in case
            }
            return; // Not solved, exit early
        }
    }

    // If the loop completes without returning, the puzzle is solved
    if (!isSolved) { // Actions only on the transition *to* the solved state
        console.log(">>> PUZZLE SOLVED! <<<");
        timerRunning = false; // Stop the timer
        lastFlashToggle = millis(); timerFlashState = true; // Initialize timer flashing
    }
    isSolved = true;
    gameState = STATE_SOLVED; // Set state to solved
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
    // Ensure indices are valid before swapping
    if (i >= 0 && i < arr.length && j >= 0 && j < arr.length) {
        [arr[i], arr[j]] = [arr[j], arr[i]]; // ES6 destructuring swap
    } else {
        console.warn(`Swap attempt with invalid indices: ${i}, ${j}`);
    }
}

/**
 * @function windowResized
 * @description p5 function called when the browser window is resized.
 *              Adjusts canvas size, recalculates layout, and repositions UI.
 *              Does NOT automatically re-slice tiles, relies on scaling in draw loop.
 */
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    console.log("Window resized.");
    calculateLayout(); // Recalculate positions and sizes (including tileWidth/Height)
    positionElements(); // Reposition UI elements based on current state and new layout
    console.log("Window resized processed.");
    // Note: Re-slicing tiles (calling createImageTiles) on resize is not done here.
    // The existing tiles will be drawn scaled to the new tileWidth/tileHeight.
    // This is generally fine unless extreme aspect ratio changes cause distortion.
}