/**
 * @file sketch.js
 * @description A variable-size image sliding puzzle game built with p5.js.
 * Features a splash screen, default/custom image loading (using pre-slicing),
 * grid size slider, timer, slider focus fix, and gapless tile rendering.
 */

// --- Constants ---
const MIN_GRID_SIZE = 2;        // Minimum selectable grid dimension
const MAX_GRID_SIZE = 10;       // Maximum selectable grid dimension
const DEFAULT_GRID_SIZE = 4;    // Initial grid dimension
const DEFAULT_IMAGE_PATH = './../../ref/realtree.jpg'; // Default image location relative to HTML

// Game States - Used to control program flow and UI visibility
const STATE_SPLASH = 'splash';      // Initial screen asking for image choice
const STATE_LOADING = 'loading';    // Intermediate state while preparing puzzle assets/data (tile slicing)
const STATE_PLAYING = 'playing';    // Main gameplay state
const STATE_SOLVED = 'solved';      // State when the puzzle is successfully solved

// --- Global Variables ---

// Image Data
let puzzleImage;            // p5.Image object currently used for the puzzle (default or custom)
let defaultPuzzleImage;     // Stores the preloaded default p5.Image object
let isDefaultImageLoaded = false; // Flag: True if default image loaded successfully in preload
// *** REINSTATED: Array to hold pre-sliced tile images ***
let tiles = [];

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
let isPuzzleReady = false;    // Flag: True when image loaded, tiles sliced, and board ready
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

    // Create all UI elements
    createSplashUI();
    createGameUI();

    // Position and show/hide UI based on initial state
    positionElements();
    if (gameState === STATE_SPLASH) {
        showSplashUI();
        hideGameUI();
        if (!isDefaultImageLoaded && defaultButton) {
            defaultButton.attribute('disabled', '');
        }
    } else { // Fallback
        hideSplashUI();
        showGameUI();
    }

    // Alert if default image failed during preload
    if (!isDefaultImageLoaded && gameState === STATE_SPLASH) {
        alert(`Warning: Could not load default image "${DEFAULT_IMAGE_PATH}". Check path/server. 'Use Default' disabled.`);
    }

    // Global p5 settings
    noStroke();
    imageMode(CORNER);
    textAlign(CENTER, CENTER);
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
            // Show loading feedback (tile slicing happens here)
            fill(200); textSize(24);
            text("loading puzzle...", width / 2, height / 2); // Lowercase text
            break;
        case STATE_PLAYING:
        case STATE_SOLVED:
            // Draw the puzzle board and timer if ready
            if (isPuzzleReady) {
                drawPuzzleBoard(); // Draws using pre-sliced tiles
                drawTimer();
            } else {
                // Display error if state is playing/solved but puzzle isn't ready
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
 * @description Positions all UI based on the current state and layout.
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
    let uiStartY = puzzleY + puzzleAreaSize + 10 + timerHeight + 10; // Start below puzzle & timer space
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
    isPuzzleReady = false; // Mark as not ready during loading

    // Attempt to initialize the puzzle; handle success or failure
    // Use setTimeout to allow the browser to redraw and show the "loading..." message
    // before the potentially blocking initializePuzzle() function runs.
    setTimeout(() => {
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
    }, 50); // 50ms delay allows loading message to render
}

// =============================================================================
// PUZZLE BOARD DRAWING (Pre-Sliced Method)
// =============================================================================

/**
 * @function drawPuzzleBoard
 * @description Draws the puzzle using the pre-sliced images stored in the 'tiles' array.
 *              Called repeatedly by draw() when game state is PLAYING or SOLVED.
 */
function drawPuzzleBoard() {
    // Guard clause: Ensure puzzle data and tiles are ready before drawing
    if (!isPuzzleReady || tiles.length === 0) {
        console.error("drawPuzzleBoard called when puzzle not ready or tiles array is empty.");
        drawErrorState("Error: Puzzle Tiles Missing");
        return;
    }

    push(); // Isolate drawing state
    translate(puzzleX, puzzleY); // Move origin to puzzle area's top-left corner

    let blankValue = gridSize * gridSize - 1; // The value representing the empty space
    let blankIndex = board.indexOf(blankValue); // Find current position of the blank space
    let blankCol = (blankIndex !== -1) ? blankIndex % gridSize : -1;
    let blankRow = (blankIndex !== -1) ? floor(blankIndex / gridSize) : -1;

    // Loop through each position on the board (0 to n*n-1)
    for (let i = 0; i < board.length; i++) {
        let tileIndex = board[i]; // Get the index (0 to n*n-1) of the piece currently at this board spot
        if (tileIndex === blankValue) continue; // Skip drawing the blank spot itself

        // Ensure the tile index is valid before trying to access the tiles array
        if (tileIndex < 0 || tileIndex >= tiles.length) {
             console.error(`Invalid tileIndex ${tileIndex} found in board at position ${i}`);
             drawErrorTile(i); // Draw error indicator for this specific tile position
             continue; // Skip to the next board position
        }

        // Get the pre-sliced p5.Image object for this tile piece
        let tileImage = tiles[tileIndex];

        // Check if the retrieved tile object is valid
        if (tileImage && tileImage.width > 0) { // Check width as proxy for valid image
            let boardCol = i % gridSize; // Destination column on screen (0 to n-1)
            let boardRow = floor(i / gridSize); // Destination row on screen (0 to n-1)

            // Calculate precise integer Destination coordinates (dx, dy) and dimensions (dw, dh)
            let dx = round(boardCol * tileWidth);
            let dy = round(boardRow * tileHeight);
            let dNextX = round((boardCol + 1) * tileWidth);
            let dNextY = round((boardRow + 1) * tileHeight);
            let dw = dNextX - dx; // Use difference for exact width
            let dh = dNextY - dy; // Use difference for exact height

            // Draw the pre-sliced tile image using standard 5-argument image()
            image(tileImage, dx, dy, dw, dh);

        } else {
            // Fallback: Draw an error indicator if a specific tile image is missing or invalid
             console.error(`Missing or invalid tile image object found in tiles array at index ${tileIndex}`);
             drawErrorTile(i);
        }
    }

    // --- Draw Final Tile and Solved Overlay (if solved) ---
    if (gameState === STATE_SOLVED && blankIndex !== -1) {
        let finalTileIndex = blankValue; // The index of the piece that belongs in the blank spot

        // Check if the image for the final tile exists in the 'tiles' array
        if (tiles && tiles.length > finalTileIndex && tiles[finalTileIndex] && tiles[finalTileIndex].width > 0) {
            let finalTileImage = tiles[finalTileIndex];

            // Calculate precise destination coordinates for the blank spot
            let dx = round(blankCol * tileWidth); let dy = round(blankRow * tileHeight);
            let dNextX = round((blankCol + 1) * tileWidth); let dNextY = round((blankRow + 1) * tileHeight);
            let dw = dNextX - dx; let dh = dNextY - dy;

            // Draw the final piece into the blank space
            image(finalTileImage, dx, dy, dw, dh);
        } else {
             // Fallback if the final tile image is missing
             console.error("Missing final tile image for solved state (index " + finalTileIndex + ").");
             let dx = round(blankCol * tileWidth); let dy = round(blankRow * tileHeight);
             let dNextX = round((blankCol + 1) * tileWidth); let dNextY = round((blankRow + 1) * tileHeight);
             let dw = dNextX - dx; let dh = dNextY - dy;
             fill(0, 0, 255); noStroke(); rect(dx, dy, dw, dh); // Blue error indicator
        }

        // Draw transparent green overlay to indicate solved state
        fill(0, 200, 0, 80); // Green with alpha 80
        noStroke();
        rect(0, 0, puzzleAreaSize, puzzleAreaSize); // Cover the entire puzzle area

        // Draw "SOLVED!" text centered on top
        fill(255); // White text
        textSize(puzzleAreaSize / 8); // Scale text size with puzzle size
        noStroke();
        text("SOLVED!", puzzleAreaSize / 2, puzzleAreaSize / 2);
    }
    pop(); // Restore original drawing settings
}

/**
 * @function drawErrorState
 * @description Helper function to draw an error message within the puzzle area.
 * @param {string} [message="Error: Puzzle Unavailable"] - The error message.
 */
function drawErrorState(message = "Error: Puzzle Unavailable") {
     push();
     translate(puzzleX, puzzleY);
     fill(50); rect(0, 0, puzzleAreaSize, puzzleAreaSize);
     fill(255, 50, 50); textSize(20);
     text(message, puzzleAreaSize / 2, puzzleAreaSize / 2);
     pop();
}

/**
* @function drawErrorTile
* @description Helper function to draw an error indicator for a specific tile position.
* @param {number} boardIndex - The linear index (0 to n*n-1) of the tile on the board.
*/
function drawErrorTile(boardIndex) {
    let boardCol = boardIndex % gridSize; let boardRow = floor(boardIndex / gridSize);
    let dx = round(boardCol * tileWidth); let dy = round(boardRow * tileHeight);
    let dNextX = round((boardCol + 1) * tileWidth); let dNextY = round((boardRow + 1) * tileHeight);
    let dw = dNextX - dx; let dh = dNextY - dy;
    fill(255, 0, 0); noStroke(); rect(dx, dy, dw, dh); // Draw red error tile
}


// =============================================================================
// TIMER LOGIC AND DRAWING
// =============================================================================

/**
 * @function drawTimer
 * @description Draws the formatted timer string below the puzzle area, handling flashing when solved.
 */
function drawTimer() {
    let timerX = puzzleX + puzzleAreaSize / 2; // Center horizontally
    let timerY = puzzleY + puzzleAreaSize + 20; // Position below puzzle + padding
    let timerSize = 24;

    textSize(timerSize);
    textAlign(CENTER, TOP);

    // Handle flashing when solved
    if (gameState === STATE_SOLVED) {
        let now = millis();
        if (now - lastFlashToggle > TIMER_FLASH_INTERVAL) {
            timerFlashState = !timerFlashState; // Toggle
            lastFlashToggle = now;
        }
        fill(0, 255, 0, timerFlashState ? 255 : 100); // Flash alpha
    } else {
        fill(0, 255, 0, 255); // Solid green
    }
    text(timerDisplayString, timerX, timerY); // Display the time
}

/**
 * @function formatTime
 * @description Formats a time given in seconds into a "M:SS.ss" string.
 * @param {number} seconds - The time duration in seconds.
 * @returns {string} The formatted time string.
 */
function formatTime(seconds) {
    let mins = floor(seconds / 60);
    let secs = floor(seconds) % 60;
    let hund = floor((seconds * 100) % 100);
    return `${nf(mins, 1)}:${nf(secs, 2, 0)}.${nf(hund, 2, 0)}`;
}

// =============================================================================
// PUZZLE INITIALIZATION AND CORE LOGIC
// =============================================================================

/**
 * @function initializePuzzle
 * @description Sets up the core puzzle logic: slices tiles, creates board, resets timer, shuffles.
 *              This version uses the pre-slicing method (`createImageTiles`).
 * @param {number} size - The dimension of the grid (e.g., 4 for 4x4).
 * @returns {boolean} True if initialization was successful, false otherwise.
 */
function initializePuzzle(size) {
    console.log(`Initializing puzzle core size ${size}x${size}`);
    isPuzzleReady = false; isSolved = false; // Reset flags

    // 1. Validate Input Image
    if (!puzzleImage || !puzzleImage.width || puzzleImage.width <= 0) {
        console.error("InitializePuzzle Error: Invalid or missing puzzleImage."); return false;
    }
    // 2. Validate Grid Size
    if (size < MIN_GRID_SIZE || size > MAX_GRID_SIZE) {
         console.error(`InitializePuzzle Error: Invalid grid size ${size}.`); return false;
    }

    gridSize = size;
    if (gridSizeLabel) gridSizeLabel.html(`Grid Size: ${gridSize}x${gridSize}`);
    calculateLayout(); // Recalculate layout (essential for tile slicing dimensions)

    // --- 3. Slice image into tiles ---
    // This calls the potentially slow function that populates the global 'tiles' array
    if (!createImageTiles(puzzleImage)) {
        console.error("InitializePuzzle Error: Failed to create image tiles.");
        tiles = []; // Ensure tiles array is empty on failure
        return false; // Indicate failure
    }
    // If successful, the global 'tiles' array now holds p5.Image objects

    // 4. Setup board array in solved state
    board = []; let totalTiles = gridSize * gridSize;
    for (let i = 0; i < totalTiles; i++) { board.push(i); }

    // 5. Reset Timer
    timerRunning = false; elapsedTime = 0; startTime = 0;
    timerDisplayString = formatTime(0); timerFlashState = true; lastFlashToggle = 0;

    // 6. Shuffle the board
    shufflePuzzle();

    // 7. Final Checks and State Setting
    checkWinCondition(); // Sets isSolved and gameState
    isPuzzleReady = true; // Mark as ready (tiles sliced, board shuffled)
    console.log("Puzzle core initialized. Ready:", isPuzzleReady, "State:", gameState);
    return true; // Indicate success
}

/**
 * @function resetPuzzle
 * @description Resets and shuffles the puzzle using the current image and grid size settings.
 */
function resetPuzzle() {
     console.log("Resetting puzzle...");
     if (!puzzleImage) { alert("Cannot reset, no image is loaded."); return; }
     gameState = STATE_LOADING; // Show loading briefly
     if (initializePuzzle(gridSize)) { // Re-initialize
         showGameUI();
     } else { // Handle init failure
         gameState = STATE_SPLASH; showSplashUI(); hideGameUI();
         alert("Error re-initializing puzzle.");
     }
}

/**
 * @function calculateLayout
 * @description Calculates the centered puzzle position and tile dimensions.
 */
function calculateLayout() {
    let safeMargin = 30; let uiSpace = 180; // Adjusted spacing

    let availableWidth = windowWidth - safeMargin * 2;
    let availableHeight = windowHeight - safeMargin * 2 - uiSpace;
    puzzleAreaSize = floor(min(availableWidth, availableHeight));
    puzzleX = floor((windowWidth - puzzleAreaSize) / 2);
    puzzleY = floor((windowHeight - puzzleAreaSize - uiSpace) / 2);
    if (gridSize > 0) { tileWidth = puzzleAreaSize / gridSize; tileHeight = puzzleAreaSize / gridSize; }
    else { tileWidth = 0; tileHeight = 0; }
    console.log(`Layout Updated: Area=${puzzleAreaSize}px @ (${puzzleX},${puzzleY}), TileW=${tileWidth.toFixed(3)}px`);
    // No source info cache needed in this version
}

/**
 * @function createImageTiles
 * @description Slices the input p5.Image into `gridSize * gridSize` smaller
 *              p5.Image objects using `img.get()`. Stores these in the global
 *              `tiles` array. Can be slow.
 * @param {p5.Image} img - The source image to slice.
 * @returns {boolean} True if slicing was successful, false otherwise.
 */
function createImageTiles(img) {
    tiles = []; // Clear previous tiles

    // Validate inputs
    if (!img || typeof img.get !== 'function' || !img.width || img.width <= 0) { console.error("CreateTiles Error: Invalid image."); return false; }
    if (gridSize <= 1 || !puzzleAreaSize || puzzleAreaSize <= 0) { console.error("CreateTiles Error: Invalid grid/area size."); return false; }
    console.log(`Slicing image into ${gridSize}x${gridSize} tiles... (using img.get())`);

    let allTilesCreatedSuccessfully = true;
    // Calculate source rect for centered square crop
    let sourceCropSize = min(img.width, img.height);
    let offsetX = (img.width - sourceCropSize) / 2; let offsetY = (img.height - sourceCropSize) / 2;
    let srcTileW = sourceCropSize / gridSize; let srcTileH = sourceCropSize / gridSize;

    if (srcTileW <= 0 || srcTileH <= 0) { console.error("CreateTiles Error: Invalid source tile size."); return false; }

    let numTilesToCreate = gridSize * gridSize;

    // Loop and extract each tile
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            let tileIndex = y * gridSize + x;
            try {
                let sx = floor(offsetX + x * srcTileW); let sy = floor(offsetY + y * srcTileH);
                let sw = floor(srcTileW); let sh = floor(srcTileH);
                if (sx < 0 || sy < 0 || sw <= 0 || sh <= 0 || sx + sw > img.width + 1 || sy + sh > img.height + 1) { throw new Error(`Bounds error for tile ${tileIndex}`); }
                let tile = img.get(sx, sy, sw, sh); // The potentially slow step
                tiles.push(tile);
            } catch (e) { console.error(`Error slicing tile index ${tileIndex}:`, e); tiles.push(null); allTilesCreatedSuccessfully = false; }
        }
    }

    // Check results
    if (tiles.length === numTilesToCreate && allTilesCreatedSuccessfully) {
        console.log(`Tiles sliced successfully (${tiles.length}).`); return true;
    } else {
        console.error(`Failed to slice all tiles. Count: ${tiles.length}, Errors: ${!allTilesCreatedSuccessfully}.`); tiles = []; return false;
    }
}

/**
 * @function shufflePuzzle
 * @description Randomizes the `board` array using valid tile swaps.
 */
function shufflePuzzle() {
    console.log("Shuffling board...");
    let blankValue = gridSize*gridSize - 1; let blankIndex = board.indexOf(blankValue);
    if (blankIndex === -1) { console.error("Shuffle Err: Blank!"); board=[]; let tt=gridSize*gridSize; for(let i=0;i<tt;i++) board.push(i); blankIndex = tt-1; if (board.length===0 || board[blankIndex]!==blankValue) { console.error("Cannot recover board!"); return; } }
    let shuffleMoves = 150 * gridSize * gridSize; let lastMoveSource = -1;
    for (let i=0; i<shuffleMoves; i++){let pm=[]; let a=blankIndex-gridSize, b=blankIndex+gridSize, l=blankIndex-1, r=blankIndex+1; if(blankIndex>=gridSize && a!==lastMoveSource) pm.push(a); if(blankIndex<gridSize*gridSize-gridSize && b!==lastMoveSource) pm.push(b); if(blankIndex%gridSize!==0 && l!==lastMoveSource) pm.push(l); if(blankIndex%gridSize!==gridSize-1 && r!==lastMoveSource) pm.push(r); if(pm.length > 0){let mi=random(pm); swap(board, blankIndex, mi); lastMoveSource=blankIndex; blankIndex=mi;} else {lastMoveSource=-1; i--;}}
    isSolved = false; console.log("Shuffle complete.");
}


// =============================================================================
// INPUT HANDLERS (Slider, File Upload, Keyboard)
// =============================================================================

/**
 * @function handleSliderChange
 * @description Callback for the grid size slider. Updates size and re-initializes puzzle.
 */
function handleSliderChange() {
    let newSize = gridSizeSlider.value();
    if (newSize !== gridSize && (gameState === STATE_PLAYING || gameState === STATE_SOLVED)) {
        console.log("Slider changed to:", newSize);
        gameState = STATE_LOADING;
        if (initializePuzzle(newSize)) { showGameUI(); }
        else { gameState = STATE_SPLASH; showSplashUI(); hideGameUI(); alert("Error changing grid size."); }
    } else if (newSize !== gridSize) {
         gridSize = newSize; if (gridSizeLabel) gridSizeLabel.html(`Grid Size: ${gridSize}x${gridSize}`);
         console.log("Slider changed while inactive. Size set to:", newSize);
    }
}

/**
 * @function handleFile
 * @description Callback for the file input. Loads image and re-initializes puzzle.
 * @param {p5.File} file - The file object from the input element.
 */
function handleFile(file) {
    console.log("File input changed:", file);
    console.log("Attempting to load image from file data...");
    hideSplashUI(); hideGameUI(); gameState = STATE_LOADING;

    loadImage(file.data,
        (newImg) => { // Success
            console.log("Custom image loaded.");
            puzzleImage = newImg;
            if (initializePuzzle(gridSize)) { showGameUI(); }
            else { gameState = STATE_SPLASH; showSplashUI(); hideGameUI(); alert("Error preparing puzzle from upload."); }
            if (fileInput) fileInput.value('');
        },
        (err) => { // Error
            console.error("Error loading file as image:", err);
            alert("Failed to load file. Use JPG, PNG, GIF, WebP etc.");
            if (fileInput) fileInput.value('');
            gameState = STATE_SPLASH; showSplashUI(); hideGameUI();
        }
    );
}

/**
 * @function keyPressed
 * @description Handles arrow key movement, starts timer, fixes slider focus.
 */
function keyPressed() {
    if (gameState !== STATE_PLAYING) return; // Ignore if not playing

    let blankValue = gridSize * gridSize - 1;
    let blankIndex = board.indexOf(blankValue);
    if (blankIndex === -1) return;

    let targetIndex = -1;
    if (keyCode === UP_ARROW && blankIndex < gridSize*gridSize - gridSize) targetIndex = blankIndex + gridSize;
    else if (keyCode === DOWN_ARROW && blankIndex >= gridSize) targetIndex = blankIndex - gridSize;
    else if (keyCode === LEFT_ARROW && blankIndex % gridSize !== gridSize - 1) targetIndex = blankIndex + 1;
    else if (keyCode === RIGHT_ARROW && blankIndex % gridSize !== 0) targetIndex = blankIndex - 1;

    if (targetIndex !== -1) {
        // Start Timer on first valid move
        if (!timerRunning && !isSolved) {
            timerRunning = true; startTime = millis(); elapsedTime = 0;
            console.log("Timer started!");
        }

        swap(board, blankIndex, targetIndex); // Perform move
        checkWinCondition(); // Check if solved (stops timer)

        // Slider Focus Fix
        if (document.activeElement) document.activeElement.blur();
    }
}

/**
 * @function checkWinCondition
 * @description Checks if solved, updates state, stops timer.
 */
function checkWinCondition() {
    let totalTiles = gridSize * gridSize; if(board.length !== totalTiles) { isSolved=false; if(gameState===STATE_SOLVED)gameState=STATE_PLAYING; return; }
    for (let i = 0; i < totalTiles; i++) { if (board[i] !== i) { isSolved=false; if(gameState===STATE_SOLVED)gameState=STATE_PLAYING; return; } }
    // Solved:
    if (!isSolved) { console.log(">>> PUZZLE SOLVED! <<<"); timerRunning = false; lastFlashToggle = millis(); timerFlashState = true; }
    isSolved = true; gameState = STATE_SOLVED;
}

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * @function swap
 * @description Swaps two elements in an array in place.
 */
function swap(arr, i, j) {
    [arr[i], arr[j]] = [arr[j], arr[i]];
}

/**
 * @function windowResized
 * @description Adjusts canvas, recalculates layout, repositions UI, and re-slices tiles if necessary.
 */
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    console.log("Window resized.");
    calculateLayout(); // Recalculate positions and sizes
    positionElements(); // Reposition UI

    // Re-slice tiles if puzzle is active, as dimensions have changed
    if (puzzleImage && (gameState === STATE_PLAYING || gameState === STATE_SOLVED)) {
         console.log("Window resize: Re-slicing tiles...");
         if (!createImageTiles(puzzleImage)) { // Re-run slicing
              console.error("Failed to re-slice tiles after resize!");
              isPuzzleReady = false; // Mark as not ready
              gameState = STATE_SPLASH; showSplashUI(); hideGameUI(); // Revert to splash on error
              alert("Error resizing puzzle tiles.");
         } else {
             isPuzzleReady = true; // Ensure ready if slicing succeeded
         }
    }
    console.log("Window resized processed.");
}