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
// *** Stores calculated info for direct drawing from the source image ***
let puzzleImageSourceInfo = {
    img: null,
    size: 0, // Size of the square crop area in original image pixels
    offsetX: 0, // Offset within original image
    offsetY: 0,
    srcTileW: 0, // Width of a single tile in original image pixels
    srcTileH: 0
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
let isPuzzleReady = false;    // Flag: True when image loaded, source info calculated, and board ready
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
 *              Can delay splash screen if image is large or network slow.
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

    // Alert if default image failed (only once during setup)
    if (!isDefaultImageLoaded && gameState === STATE_SPLASH) {
        alert(`Warning: Could not load default image "${DEFAULT_IMAGE_PATH}".\nCheck path/server. 'Use Default' disabled.`);
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
            // Splash UI is DOM elements, nothing drawn here
            break;
        case STATE_LOADING:
            // Show loading feedback
            fill(200); textSize(24);
            text("loading puzzle...", width / 2, height / 2); // Lowercase text
            break;
        case STATE_PLAYING:
        case STATE_SOLVED:
            // Draw puzzle board and timer if ready
            if (isPuzzleReady) {
                drawPuzzleBoard(); // Draws using direct source sampling
                drawTimer();     // Draws timer text
            } else {
                // Fallback error display
                fill(255, 0, 0); textSize(20);
                text("Error: Puzzle data not ready!", width / 2, height / 2);
                 if (!puzzleImage) text("No image loaded.", width/2, height/2 + 30);
                 else text("Check console for initialization errors.", width/2, height/2 + 30);
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
        .style('color', 'white') // Style browser's default button text
        .hide();
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
    if (fileInput) fileInput.show(); // Show file input in game UI for convenience
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
 * @description Positions UI elements based on the current game state and layout.
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
 * @description Positions game UI elements sequentially below the calculated puzzle area.
 */
function positionGameUI() {
    // Assumes calculateLayout() called recently
    let uiStartX = puzzleX; let uiWidth = puzzleAreaSize;
    let timerHeight = 30; // Reserved space for timer text
    let uiStartY = puzzleY + puzzleAreaSize + 10 + timerHeight + 10; // Start below puzzle & timer space
    let currentY = uiStartY;
    let itemHeight = 25; let itemMargin = 5;

    // Position Game UI elements vertically
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
    startGame();
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
 * @description Transitions from splash to loading to playing/solved state. Initializes the puzzle.
 */
function startGame() {
    hideSplashUI();
    gameState = STATE_LOADING;
    // Directly initialize puzzle - splash screen hides preload, loading state hides this init time.
    if (initializePuzzle(gridSize)) {
        showGameUI();
        // initializePuzzle calls checkWinCondition, which sets PLAYING or SOLVED state
    } else {
        // Handle initialization failure
        gameState = STATE_SPLASH; showSplashUI(); hideGameUI();
        alert("Error: Failed to prepare the puzzle from the selected image.");
    }
}

// =============================================================================
// PUZZLE BOARD DRAWING (Direct Method)
// =============================================================================

/**
 * @function drawPuzzleBoard
 * @description Draws the puzzle using the direct source sampling method (9-argument image()).
 *              Called repeatedly by draw() when game state is PLAYING or SOLVED.
 */
function drawPuzzleBoard() {
    // Guard clause: Ensure puzzle data is ready
    if (!isPuzzleReady || !puzzleImageSourceInfo.img) {
        console.error("drawPuzzleBoard called when puzzle not ready or source info missing.");
        drawErrorState("Error: Puzzle data missing"); // Helper to draw error message
        return;
    }

    push(); // Isolate drawing state
    translate(puzzleX, puzzleY); // Move origin to puzzle area corner

    let blankValue = gridSize * gridSize - 1;
    let blankIndex = board.indexOf(blankValue);
    let blankCol = (blankIndex !== -1) ? blankIndex % gridSize : -1;
    let blankRow = (blankIndex !== -1) ? floor(blankIndex / gridSize) : -1;

    // Get pre-calculated source image info
    let { img, offsetX, offsetY, srcTileW, srcTileH } = puzzleImageSourceInfo;

    // Loop through each position on the board
    for (let i = 0; i < board.length; i++) {
        let tileIndex = board[i]; // The piece index (0..n*n-1) at this position
        if (tileIndex === blankValue) continue; // Skip drawing the blank space

        let boardCol = i % gridSize; let boardRow = floor(i / gridSize);

        // Calculate precise integer Destination coordinates/dimensions for gapless drawing
        let dx = round(boardCol * tileWidth); let dy = round(boardRow * tileHeight);
        let dNextX = round((boardCol + 1) * tileWidth); let dNextY = round((boardRow + 1) * tileHeight);
        let dw = dNextX - dx; let dh = dNextY - dy;

        // Calculate integer Source coordinates/dimensions within the original image
        let srcTileCol = tileIndex % gridSize; let srcTileRow = floor(tileIndex / gridSize);
        let sx = floor(offsetX + srcTileCol * srcTileW); let sy = floor(offsetY + srcTileRow * srcTileH);
        let sw = floor(srcTileW); let sh = floor(srcTileH);

        // Validate source rectangle before attempting to draw
        if (sx < 0 || sy < 0 || sw <= 0 || sh <= 0 || sx + sw > img.width + 1 || sy + sh > img.height + 1) {
             console.error(`Invalid source rect for tile ${tileIndex}: sx=${sx}, sy=${sy}, sw=${sw}, sh=${sh}`);
             fill(255, 0, 0); noStroke(); rect(dx, dy, dw, dh); // Draw red error indicator
             continue; // Skip drawing this tile
        }

        // Draw the specific tile piece using direct source sampling
        image(img, dx, dy, dw, dh, sx, sy, sw, sh);
    }

    // --- Draw Final Tile and Solved Overlay (if solved) ---
    if (gameState === STATE_SOLVED && blankIndex !== -1) {
        // Calculate destination for the blank spot
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
             fill(0, 0, 255); noStroke(); rect(dx, dy, dw, dh); // Blue error indicator
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
 * @description Helper to draw an error message within the puzzle area.
 * @param {string} message - The error message to display.
 */
function drawErrorState(message = "Error: Puzzle Unavailable") {
     push();
     translate(puzzleX, puzzleY);
     fill(50); rect(0, 0, puzzleAreaSize, puzzleAreaSize); // Dark background
     fill(255, 50, 50); textSize(20);
     text(message, puzzleAreaSize / 2, puzzleAreaSize / 2);
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
    let timerX = puzzleX + puzzleAreaSize / 2; // Center horizontally
    let timerY = puzzleY + puzzleAreaSize + 20; // Position below puzzle + padding
    let timerSize = 24;

    textSize(timerSize);
    textAlign(CENTER, TOP); // Align text by its top edge

    // Handle flashing when solved
    if (gameState === STATE_SOLVED) {
        let now = millis();
        if (now - lastFlashToggle > TIMER_FLASH_INTERVAL) {
            timerFlashState = !timerFlashState; // Toggle visibility state
            lastFlashToggle = now; // Record toggle time
        }
        fill(0, 255, 0, timerFlashState ? 255 : 100); // Flash alpha
    } else {
        fill(0, 255, 0, 255); // Solid green when playing
    }
    text(timerDisplayString, timerX, timerY); // Display the time
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
    // Use p5.nf() for number formatting (padding with zeros)
    return `${nf(mins, 1)}:${nf(secs, 2, 0)}.${nf(hund, 2, 0)}`;
}

// =============================================================================
// PUZZLE INITIALIZATION AND CORE LOGIC
// =============================================================================

/**
 * @function initializePuzzle
 * @description Sets up the core puzzle logic: calculates source image info,
 *              creates the board array, resets timer, shuffles the board.
 *              This version relies on direct image drawing, so no tile slicing.
 * @param {number} size - The dimension of the grid (e.g., 4 for 4x4).
 * @returns {boolean} True if initialization successful, false otherwise.
 */
function initializePuzzle(size) {
    console.log(`Initializing puzzle core for size ${size}x${size}`);
    isPuzzleReady = false; isSolved = false; // Reset flags

    // Validate the currently set puzzleImage
    if (!puzzleImage || !puzzleImage.width || puzzleImage.width <= 0) {
        console.error("InitializePuzzle Error: Invalid or missing puzzleImage.");
        return false; // Cannot initialize without a valid image
    }

    gridSize = size;
    if (gridSizeLabel) gridSizeLabel.html(`Grid Size: ${gridSize}x${gridSize}`); // Update UI
    calculateLayout(); // Recalculate layout based on new grid size

    // --- Calculate and store source image parameters ---
    // This data is used by drawPuzzleBoard for direct drawing
    try {
        puzzleImageSourceInfo.img = puzzleImage; // Reference to the active image
        let imgSize = min(puzzleImage.width, puzzleImage.height); // Size of square crop area
        puzzleImageSourceInfo.size = imgSize;
        puzzleImageSourceInfo.offsetX = (puzzleImage.width - imgSize) / 2; // Top-left X of crop
        puzzleImageSourceInfo.offsetY = (puzzleImage.height - imgSize) / 2; // Top-left Y of crop
        puzzleImageSourceInfo.srcTileW = imgSize / gridSize; // Width of one tile in source
        puzzleImageSourceInfo.srcTileH = imgSize / gridSize; // Height of one tile in source
        // Validate results
        if (puzzleImageSourceInfo.srcTileW <= 0 || puzzleImageSourceInfo.srcTileH <= 0) {
            throw new Error("Calculated source tile dimension is zero or negative.");
        }
        console.log("Calculated source image info for direct drawing.");
    } catch (e) {
        console.error("Error calculating source image info:", e);
        puzzleImageSourceInfo.img = null; // Invalidate source info on error
        return false; // Indicate initialization failure
    }

    // Setup board array in the initial solved state (0, 1, 2, ..., n*n-1)
    board = [];
    let totalTiles = gridSize * gridSize;
    for (let i = 0; i < totalTiles; i++) {
        board.push(i);
    }

    // Reset Timer variables
    timerRunning = false; elapsedTime = 0; startTime = 0;
    timerDisplayString = formatTime(0); timerFlashState = true; lastFlashToggle = 0;

    // Shuffle the board into a random (solvable) state
    shufflePuzzle();
    // Set the initial solved state and game state based on the shuffled board
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
     if (!puzzleImage) { // Check if an image is loaded
         alert("Cannot reset, no image is currently loaded.");
         return;
     }
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
 * @description Calculates the centered position (puzzleX, puzzleY) and size (puzzleAreaSize)
 *              of the square puzzle area. Also calculates tile dimensions and updates the
 *              cached source image info used for direct drawing.
 */
function calculateLayout() {
    let safeMargin = 30; let uiSpace = 180; // Adjusted spacing below puzzle

    let availableWidth = windowWidth - safeMargin * 2;
    let availableHeight = windowHeight - safeMargin * 2 - uiSpace;
    puzzleAreaSize = floor(min(availableWidth, availableHeight)); // Integer size for area
    puzzleX = floor((windowWidth - puzzleAreaSize) / 2); // Center X
    puzzleY = floor((windowHeight - puzzleAreaSize - uiSpace) / 2); // Center Y in top area

    // Calculate tile display dimensions (can be fractional)
    if (gridSize > 0) {
        tileWidth = puzzleAreaSize / gridSize;
        tileHeight = puzzleAreaSize / gridSize;
    } else {
        tileWidth = 0; tileHeight = 0; // Avoid division by zero
    }
    console.log(`Layout Updated: Area=${puzzleAreaSize}px @ (${puzzleX},${puzzleY}), TileW=${tileWidth.toFixed(3)}px`);

    // Update cached source image info if possible (needed by draw loop)
     if (puzzleImage && puzzleImage.width > 0 && gridSize > 0) {
         try {
            puzzleImageSourceInfo.img = puzzleImage; // Ensure correct image reference
            let imgSize = min(puzzleImage.width, puzzleImage.height);
            puzzleImageSourceInfo.size = imgSize;
            puzzleImageSourceInfo.offsetX = (puzzleImage.width - imgSize) / 2;
            puzzleImageSourceInfo.offsetY = (puzzleImage.height - imgSize) / 2;
            puzzleImageSourceInfo.srcTileW = imgSize / gridSize;
            puzzleImageSourceInfo.srcTileH = imgSize / gridSize;
            if (puzzleImageSourceInfo.srcTileW <= 0) throw new Error("Invalid src tile width.");
         } catch (e) {
              console.error("Error recalculating source info:", e);
              isPuzzleReady=false; // Mark as not ready if calc fails
              puzzleImageSourceInfo.img=null; // Invalidate cache
         }
     } else {
          puzzleImageSourceInfo.img = null; // Invalidate cache if no image/grid
          isPuzzleReady = false; // Cannot be ready without valid source info
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
    // Safety check and recovery for blank tile
    if (blankIndex === -1) { console.error("Shuffle Error: Blank!"); board=[]; let tt=gridSize*gridSize; for(let i=0;i<tt;i++) board.push(i); blankIndex=tt-1; if(board.length===0||board[blankIndex]!==blankValue){console.error("Cannot recover board!"); return;}}
    let shuffleMoves = 150 * gridSize * gridSize; let lastMoveSource = -1;
    // Perform many random valid moves
    for (let i=0; i<shuffleMoves; i++){let pm=[]; let a=blankIndex-gridSize, b=blankIndex+gridSize, l=blankIndex-1, r=blankIndex+1; if(blankIndex>=gridSize && a!==lastMoveSource) pm.push(a); if(blankIndex<gridSize*gridSize-gridSize && b!==lastMoveSource) pm.push(b); if(blankIndex%gridSize!==0 && l!==lastMoveSource) pm.push(l); if(blankIndex%gridSize!==gridSize-1 && r!==lastMoveSource) pm.push(r); if(pm.length > 0){let mi=random(pm); swap(board, blankIndex, mi); lastMoveSource=blankIndex; blankIndex=mi;} else {lastMoveSource=-1; i--;}}
    isSolved = false; // Ensure puzzle isn't marked solved after shuffling
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
        if (initializePuzzle(newSize)) { showGameUI(); }
        else { gameState = STATE_SPLASH; showSplashUI(); hideGameUI(); alert("Error changing grid size."); }
    } else if (newSize !== gridSize) {
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
    hideSplashUI(); hideGameUI(); gameState = STATE_LOADING;

    loadImage(file.data,
        // Success Callback
        (newImg) => {
            console.log("Custom image loaded successfully.");
            puzzleImage = newImg; // Set as the current active image
            if (initializePuzzle(gridSize)) { // Initialize with the new image
                showGameUI(); // Show game if successful
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

    // Determine target based on arrow key and blank position
    if (keyCode === UP_ARROW && blankIndex < gridSize*gridSize - gridSize) targetIndex = blankIndex + gridSize;
    else if (keyCode === DOWN_ARROW && blankIndex >= gridSize) targetIndex = blankIndex - gridSize;
    else if (keyCode === LEFT_ARROW && blankIndex % gridSize !== gridSize - 1) targetIndex = blankIndex + 1;
    else if (keyCode === RIGHT_ARROW && blankIndex % gridSize !== 0) targetIndex = blankIndex - 1;

    // If a valid move was identified
    if (targetIndex !== -1) {
        // Start Timer only on the very first valid move of the game
        if (!timerRunning && !isSolved) {
            timerRunning = true;
            startTime = millis();
            elapsedTime = 0;
            console.log("Timer started!");
        }

        swap(board, blankIndex, targetIndex); // Perform the tile swap
        checkWinCondition(); // Check if this move solved the puzzle (stops timer)

        // --- Slider Focus Fix ---
        // Remove focus from any active DOM element (likely the slider if just used)
        if (document.activeElement) {
            document.activeElement.blur();
        }
    }
}

/**
 * @function checkWinCondition
 * @description Checks if the global `board` array is in the solved state.
 *              Updates `isSolved` flag, `gameState`, and stops the timer if solved.
 */
function checkWinCondition() {
    let totalTiles = gridSize * gridSize;
    if (board.length !== totalTiles) { // Basic sanity check
        isSolved=false; if(gameState===STATE_SOLVED) gameState=STATE_PLAYING; return;
    }

    // Check each tile position
    for (let i = 0; i < totalTiles; i++) {
        if (board[i] !== i) { // If any tile is out of order
            isSolved = false;
            // If state was SOLVED, revert to PLAYING (user moved after solving)
            if (gameState === STATE_SOLVED) gameState = STATE_PLAYING;
            return; // Not solved
        }
    }

    // If the loop completes, the puzzle IS solved
    if (!isSolved) { // Actions to perform only on the transition *to* solved
        console.log(">>> PUZZLE SOLVED! <<<");
        timerRunning = false; // Stop the timer
        lastFlashToggle = millis(); // Initialize flash timing
        timerFlashState = true; // Start flash visible
    }
    isSolved = true; // Set solved flag
    gameState = STATE_SOLVED; // Set game state
}

// --- Utilities ---

/**
 * @function swap
 * @description Swaps two elements in an array in place.
 * @param {Array} arr - The array.
 * @param {number} i - Index of first element.
 * @param {number} j - Index of second element.
 */
function swap(arr, i, j) {
    [arr[i], arr[j]] = [arr[j], arr[i]];
}

/**
 * @function windowResized
 * @description p5 function called when the browser window is resized.
 *              Adjusts canvas size, recalculates layout, and repositions UI.
 */
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    console.log("Window resized.");
    calculateLayout(); // Recalculate positions and sizes, updates source info cache
    positionElements(); // Reposition UI elements based on current state
    // No need to explicitly recreate tiles with the direct drawing method
    console.log("Window resized processed.");
}