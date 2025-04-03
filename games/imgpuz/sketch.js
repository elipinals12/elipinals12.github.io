/**
 * Variable-Size Image Puzzle using p5.js
 *
 * Features:
 * - Loads a default image from a relative path.
 * - Allows users to upload a custom image.
 * - Slider to control grid size (2x2 to 10x10).
 * - Centered puzzle display and UI elements.
 * - Uses direct image drawing (9-argument image()) for performance.
 * - Implements precise coordinate calculation for gapless tiles.
 * - Splash screen for initial user choice.
 * - Game state management.
 * - Timer: Starts on first move, stops and flashes on solve.
 * - Slider focus fix: Arrow keys control puzzle after moving a tile.
 */

// --- Constants ---
const MIN_GRID_SIZE = 2;
const MAX_GRID_SIZE = 10;
const DEFAULT_GRID_SIZE = 4;
const DEFAULT_IMAGE_PATH = './../../ref/realtree.jpg'; // Relative path to default image

// Game States
const STATE_SPLASH = 'splash';
const STATE_LOADING = 'loading';
const STATE_PLAYING = 'playing';
const STATE_SOLVED = 'solved';

// --- Global Variables ---

// Image Data
let puzzleImage; // Holds the p5.Image object currently used for the puzzle
let defaultPuzzleImage; // Stores the loaded default image for potential reuse
let isDefaultImageLoaded = false;
// Stores calculated info for direct drawing from the source image
let puzzleImageSourceInfo = {
    img: null,
    size: 0, // Size of the square crop area in original image pixels
    offsetX: 0, // Offset within original image
    offsetY: 0,
    srcTileW: 0, // Width of a single tile in original image pixels
    srcTileH: 0
};

// Board State
let gridSize = DEFAULT_GRID_SIZE;
let board = []; // 1D array holding tile indices (0 to n*n-1, where n*n-1 is blank)
let tileWidth = 0; // On-screen display width of a tile (can be fractional)
let tileHeight = 0; // On-screen display height of a tile

// Layout
let puzzleAreaSize = 0; // Pixel dimension of the square puzzle area
let puzzleX = 0; // Top-left X coordinate of the puzzle area
let puzzleY = 0; // Top-left Y coordinate of the puzzle area

// Game Flow & State
let gameState = STATE_SPLASH; // Initial state
let isPuzzleReady = false; // True when image is valid and board/source info is ready
let isSolved = false; // Tracks if the current board state is solved

// Timer
let timerRunning = false;
let startTime = 0; // Millis when timer started
let elapsedTime = 0; // Elapsed time in seconds
let timerDisplayString = "0:00.00"; // Formatted string for display
// Timer Flashing on Solve
let timerFlashState = true; // Controls visibility when flashing
const TIMER_FLASH_INTERVAL = 400; // Milliseconds between flash toggles
let lastFlashToggle = 0; // Millis when flash state last changed

// UI DOM Elements
let gridSizeSlider, gridSizeLabel, resetButton, fileInput, uploadLabel; // Game UI
let splashTitle, splashText, defaultButton, uploadButton; // Splash UI
let cnv; // Canvas reference


// --- Preload ---
// Loads assets that MUST be available before setup() runs.
function preload() {
    console.log("Preloading default image...");
    // Attempt to load the default image specified by the path
    defaultPuzzleImage = loadImage(DEFAULT_IMAGE_PATH,
        // Success callback
        (img) => {
            console.log("Default image loaded successfully.");
            isDefaultImageLoaded = true;
            // Enable the 'Use Default' button if the splash screen is still active
            if (gameState === STATE_SPLASH && defaultButton) {
                defaultButton.removeAttribute('disabled');
            }
        },
        // Error callback
        (err) => {
            console.error("!!! FAILED TO LOAD DEFAULT IMAGE:", DEFAULT_IMAGE_PATH, err);
            isDefaultImageLoaded = false;
            // User will be alerted in setup if needed
        }
    );
}

// --- Setup ---
// Runs once after preload is complete. Initializes canvas and UI elements.
function setup() {
    console.log("Setting up sketch...");
    cnv = createCanvas(windowWidth, windowHeight);
    cnv.style('display', 'block'); // Helps prevent minor layout issues/scrollbars

    calculateLayout(); // Calculate initial sizes for centering UI

    // --- Create UI Elements ---
    // Splash Screen Elements
    splashTitle = createDiv("Welcome to ImgPuz")
        .style('font-size', '32px').style('color', 'white')
        .style('text-align', 'center').style('width', '100%');
    splashText = createDiv("Use the default image or upload your own?")
        .style('font-size', '18px').style('color', 'lightgray')
        .style('text-align', 'center').style('width', '100%');
    defaultButton = createButton("Use Default")
        .size(100, 40).mousePressed(useDefaultImage);
    uploadButton = createButton("Upload Image")
        .size(100, 40).mousePressed(triggerUpload);

    // Game UI Elements
    gridSizeLabel = createDiv(`Grid Size: ${gridSize}x${gridSize}`)
        .style('color', 'white').style('font-family', 'sans-serif')
        .style('text-align', 'center');
    gridSizeSlider = createSlider(MIN_GRID_SIZE, MAX_GRID_SIZE, gridSize, 1)
        .input(handleSliderChange); // Call handler on interactive change
    resetButton = createButton('Shuffle / Reset')
        .mousePressed(resetPuzzle);
    uploadLabel = createDiv('Upload New Image:')
        .style('color', 'white').style('font-family', 'sans-serif')
        .style('text-align', 'center');
    // Hidden file input, triggered by buttons
    fileInput = createFileInput(handleFile)
        .style('color', 'white') // Style the browser's default text
        .hide();


    // --- Initial UI State and Positioning ---
    positionElements(); // Position based on initial state (splash)
    if (gameState === STATE_SPLASH) {
        showSplashUI();
        hideGameUI();
        // Immediately disable default button if preload already failed
        if (!isDefaultImageLoaded && defaultButton) {
            defaultButton.attribute('disabled', '');
        }
    } else {
        // Fallback: Should ideally start in splash, but ensure UI matches state
        hideSplashUI();
        showGameUI();
    }

    // Alert user if default image failed (only once in setup)
    if (!isDefaultImageLoaded && gameState === STATE_SPLASH) {
        alert(`Warning: Could not load the default image from "${DEFAULT_IMAGE_PATH}".\nCheck the path and ensure you are running from a web server.\nThe 'Use Default' option will be disabled.`);
    }

    // p5.js global settings
    noStroke(); // Disable outlines by default
    imageMode(CORNER); // Use CORNER mode for image drawing calculations
    textAlign(CENTER, CENTER); // Default text alignment
    console.log("Setup complete. Initial state:", gameState);
}

// --- Main Draw Loop ---
// Continuously executes. Handles drawing based on the current game state.
function draw() {
    background(30); // Clear background each frame

    // --- Update Timer ---
    // Calculate elapsed time if the timer is running
    if (timerRunning) {
        elapsedTime = (millis() - startTime) / 1000.0; // Seconds
        timerDisplayString = formatTime(elapsedTime);
    }

    // --- State Machine ---
    // Controls what is displayed based on the current game state
    switch (gameState) {
        case STATE_SPLASH:
            // Splash UI is composed of DOM elements, usually nothing to draw here
            break;

        case STATE_LOADING:
            // Display a simple loading message while preparing puzzle data
            fill(200); textSize(24);
            text("Loading / Preparing Puzzle...", width / 2, height / 2);
            break;

        case STATE_PLAYING:
        case STATE_SOLVED:
            // Draw the puzzle board if it's ready
            if (isPuzzleReady) {
                drawPuzzleBoard();
                drawTimer(); // Also draw the timer in these states
            } else {
                // Fallback error display if trying to draw when not ready
                fill(255, 0, 0); textSize(20);
                text("Error: Puzzle not ready!", width / 2, height / 2);
            }
            break;
    }
}

// --- UI Management Functions ---

function showSplashUI() {
    // Makes splash screen elements visible
    if (splashTitle) splashTitle.show();
    if (splashText) splashText.show();
    if (defaultButton) {
        defaultButton.show();
        // Ensure button state correctly reflects if the default image is loaded
        if (!isDefaultImageLoaded) defaultButton.attribute('disabled', '');
        else defaultButton.removeAttribute('disabled');
    }
    if (uploadButton) uploadButton.show();
}

function hideSplashUI() {
    // Hides splash screen elements
    if (splashTitle) splashTitle.hide();
    if (splashText) splashText.hide();
    if (defaultButton) defaultButton.hide();
    if (uploadButton) uploadButton.hide();
}

function showGameUI() {
    // Makes main game UI elements (slider, buttons etc.) visible
    if (gridSizeLabel) gridSizeLabel.show();
    if (gridSizeSlider) gridSizeSlider.show();
    if (resetButton) resetButton.show();
    if (uploadLabel) uploadLabel.show();
    if (fileInput) fileInput.show(); // Show the file input in the game UI area
    positionGameUI(); // Reposition elements after showing them
}

function hideGameUI() {
    // Hides main game UI elements
    if (gridSizeLabel) gridSizeLabel.hide();
    if (gridSizeSlider) gridSizeSlider.hide();
    if (resetButton) resetButton.hide();
    if (uploadLabel) uploadLabel.hide();
    if (fileInput) fileInput.hide();
}

function positionElements() {
    // Central function to position all UI based on the current state and layout
    calculateLayout(); // Ensure layout variables are up-to-date

    if (gameState === STATE_SPLASH) {
        // Center splash elements vertically and horizontally
        if (splashTitle) splashTitle.position(0, height * 0.3);
        if (splashText) splashText.position(0, height * 0.4);
        if (defaultButton) defaultButton.position(width / 2 - 110, height * 0.5);
        if (uploadButton) uploadButton.position(width / 2 + 10, height * 0.5);
    } else {
        // Position game elements relative to the puzzle area
        positionGameUI();
    }
}

function positionGameUI() {
    // Positions slider, labels, buttons below the centered puzzle area
    // Assumes calculateLayout() has been called recently
    let uiStartX = puzzleX; // Align with puzzle's left edge
    let uiWidth = puzzleAreaSize; // Match puzzle width
    let uiStartY = puzzleY + puzzleAreaSize + 20; // Start below puzzle + padding
    let currentY = uiStartY; // Use this to track vertical placement
    let itemHeight = 25; // Approximate height for vertical spacing

    // Reserve space for Timer (drawn via p5, not DOM)
    let timerHeight = 30;
    currentY += timerHeight + 10; // Timer Y-pos is uiStartY + 10, add height + padding

    // Position Game UI DOM elements sequentially downwards
    if (gridSizeLabel) {
        gridSizeLabel.style('width', `${uiWidth}px`); // Center text
        gridSizeLabel.position(uiStartX, currentY);
        currentY += itemHeight;
    }
    if (gridSizeSlider) {
        let sliderWidth = uiWidth * 0.5; // Slider width relative to puzzle width
        gridSizeSlider.style('width', `${sliderWidth}px`);
        // Center slider horizontally within the puzzle width
        gridSizeSlider.position(uiStartX + (uiWidth - sliderWidth) / 2, currentY);
        currentY += itemHeight + 5; // Add extra space below slider
    }
    if (resetButton) {
        // Center reset button horizontally
        resetButton.position(uiStartX + (uiWidth - resetButton.width) / 2, currentY);
        currentY += itemHeight + 15; // Add extra space below button
    }
    if (uploadLabel) {
        uploadLabel.style('width', `${uiWidth}px`); // Center text
        uploadLabel.position(uiStartX, currentY);
        currentY += itemHeight - 5; // Space before file input
    }
    if (fileInput) {
        // Approximate centering for the file input element
        fileInput.position(uiStartX + (uiWidth - 150) / 2, currentY);
    }
}

// --- State Transition and Initialization ---

function useDefaultImage() {
    // Triggered by the 'Use Default' button on the splash screen
    if (!isDefaultImageLoaded || !defaultPuzzleImage) {
        alert("Default image is not available (load may have failed).");
        return;
    }
    console.log("Starting game with default image.");
    puzzleImage = defaultPuzzleImage; // Set the active image source
    startGame(); // Transition to loading/playing state
}

function triggerUpload() {
    // Triggered by the 'Upload Image' button (splash or game UI)
    console.log("Triggering file input click...");
    if (fileInput) {
        fileInput.elt.click(); // Programmatically click the hidden HTML file input
    }
}

function startGame() {
    // Central function to transition from splash/loading to playing state
    // Assumes 'puzzleImage' has been set (to default or custom) before calling
    hideSplashUI();
    gameState = STATE_LOADING; // Show loading message briefly
    // Short delay allows the "Loading..." message to render before initialization
    setTimeout(() => {
        if (initializePuzzle(gridSize)) { // Setup board, calculate src info, shuffle
            showGameUI(); // Show slider/reset etc. if successful
            // Game state (playing/solved) is set by checkWinCondition inside initializePuzzle
        } else {
            // Handle initialization failure (e.g., invalid image dimensions for grid)
            gameState = STATE_SPLASH; // Revert to splash screen
            showSplashUI();
            hideGameUI();
            alert("Error: Failed to prepare the puzzle from the selected image.");
        }
    }, 50); // 50ms delay
}

// --- Puzzle Board Drawing ---

function drawPuzzleBoard() {
    // Draws the current state of the puzzle using direct source sampling (9-arg image())
    // This is called repeatedly by draw() when gameState is PLAYING or SOLVED
    if (!isPuzzleReady || !puzzleImageSourceInfo.img) {
        console.error("drawPuzzleBoard called when puzzle not ready or source info missing.");
        return; // Don't attempt to draw if data isn't ready
    }

    push(); // Isolate transformations and styles for the puzzle area
    translate(puzzleX, puzzleY); // Move the origin to the top-left corner of the puzzle area

    let blankValue = gridSize * gridSize - 1; // The value representing the empty space
    let blankIndex = board.indexOf(blankValue); // Find current position of blank space
    let blankCol = (blankIndex !== -1) ? blankIndex % gridSize : -1;
    let blankRow = (blankIndex !== -1) ? floor(blankIndex / gridSize) : -1;

    // Destructure source image info for easier access in the loop
    let { img, size, offsetX, offsetY, srcTileW, srcTileH } = puzzleImageSourceInfo;

    // Loop through each position on the board (0 to n*n-1)
    for (let i = 0; i < board.length; i++) {
        let tileIndex = board[i]; // Get the index (0 to n*n-1) of the piece at this board spot
        if (tileIndex === blankValue) continue; // Skip drawing the blank spot itself

        let boardCol = i % gridSize; // Destination column on screen (0 to n-1)
        let boardRow = floor(i / gridSize); // Destination row on screen (0 to n-1)

        // Calculate precise integer Destination coordinates (dx, dy) and dimensions (dw, dh)
        // This method ensures tiles abut perfectly without gaps or overlaps due to float rounding
        let dx = round(boardCol * tileWidth);
        let dy = round(boardRow * tileHeight);
        let dNextX = round((boardCol + 1) * tileWidth);
        let dNextY = round((boardRow + 1) * tileHeight);
        let dw = dNextX - dx; // Width is the difference between start of next column and start of this one
        let dh = dNextY - dy; // Height is difference between start of next row and start of this one

        // Calculate Source coordinates (sx, sy) and dimensions (sw, sh) from the original image
        let srcTileCol = tileIndex % gridSize; // Column of this piece in the source grid
        let srcTileRow = floor(tileIndex / gridSize); // Row of this piece in the source grid
        let sx = floor(offsetX + srcTileCol * srcTileW); // Use floor for starting pixel
        let sy = floor(offsetY + srcTileRow * srcTileH);
        let sw = floor(srcTileW); // Use floor for width/height (image() needs integer source size)
        let sh = floor(srcTileH);

        // Validate calculated source rectangle before attempting to draw
        if (sx < 0 || sy < 0 || sw <= 0 || sh <= 0 || sx + sw > img.width + 1 || sy + sh > img.height + 1) {
             console.error(`Invalid source rect calculated for tileIndex ${tileIndex}: sx=${sx}, sy=${sy}, sw=${sw}, sh=${sh}`);
             fill(255, 0, 0); noStroke(); rect(dx, dy, dw, dh); // Draw red error indicator
             continue; // Skip drawing this tile
        }

        // Draw the tile using the 9-argument image() function
        // image(sourceImage, destX, destY, destW, destH, sourceX, sourceY, sourceW, sourceH)
        image(img, dx, dy, dw, dh, sx, sy, sw, sh);
    }

    // --- Draw Final Tile and Solved Overlay (if solved) ---
    if (gameState === STATE_SOLVED) {
        if (blankIndex !== -1) { // Ensure blank spot exists
             // Calculate precise destination coordinates for the blank spot
             let dx = round(blankCol * tileWidth);
             let dy = round(blankRow * tileHeight);
             let dNextX = round((blankCol + 1) * tileWidth);
             let dNextY = round((blankRow + 1) * tileHeight);
             let dw = dNextX - dx;
             let dh = dNextY - dy;

             // Calculate source coordinates for the final piece (the one belonging in the blank spot)
             let finalTileIndex = blankValue;
             let srcTileCol = finalTileIndex % gridSize;
             let srcTileRow = floor(finalTileIndex / gridSize);
             let sx = floor(offsetX + srcTileCol * srcTileW);
             let sy = floor(offsetY + srcTileRow * srcTileH);
             let sw = floor(srcTileW);
             let sh = floor(srcTileH);

             // Draw the final piece into the blank spot if the source rectangle is valid
             if (!(sx < 0 || sy < 0 || sw <= 0 || sh <= 0 || sx + sw > img.width + 1 || sy + sh > img.height + 1)) {
                 image(img, dx, dy, dw, dh, sx, sy, sw, sh);
             } else {
                  console.error("Invalid source rectangle calculated for the final solved tile.");
                  fill(0, 0, 255); noStroke(); rect(dx, dy, dw, dh); // Draw blue error indicator
             }

             // Draw transparent green overlay indicating solved state
             fill(0, 200, 0, 80); // Green with alpha 80
             noStroke(); // Ensure no border on the overlay
             rect(0, 0, puzzleAreaSize, puzzleAreaSize); // Cover the entire puzzle area

             // Draw "SOLVED!" text on top
             fill(255); // White text
             textSize(puzzleAreaSize / 8); // Scale text size with puzzle size
             noStroke();
             text("SOLVED!", puzzleAreaSize / 2, puzzleAreaSize / 2); // Centered
        }
    }
    pop(); // Restore original drawing settings (origin, etc.)
}

// --- Timer Drawing ---
function drawTimer() {
    // Draws the formatted timer string below the puzzle area
    // Handles flashing effect when the puzzle is solved
    let timerX = puzzleX + puzzleAreaSize / 2; // Center horizontally with puzzle
    let timerY = puzzleY + puzzleAreaSize + 20; // Position just below puzzle area + padding
    let timerSize = 24; // Font size for the timer

    textSize(timerSize);
    textAlign(CENTER, TOP); // Align text top to make Y coordinate the top edge

    // --- Flashing Logic ---
    if (gameState === STATE_SOLVED) {
        let now = millis();
        // Check if enough time has passed to toggle the flash state
        if (now - lastFlashToggle > TIMER_FLASH_INTERVAL) {
            timerFlashState = !timerFlashState; // Invert the flash state
            lastFlashToggle = now; // Record the time of this toggle
        }
        // Set fill color based on the current flash state
        fill(0, 255, 0, timerFlashState ? 255 : 100); // Full green or dimmer green
    } else {
        // Regular non-flashing green when playing or loading
        fill(0, 255, 0, 255); // Opaque green
    }

    // Draw the formatted time string
    text(timerDisplayString, timerX, timerY);
}


// --- Puzzle Initialization and Core Logic ---

function initializePuzzle(size) {
    // Prepares the puzzle board, calculates source image info, resets the timer, and shuffles
    // Returns true on success, false on failure
    console.log(`Initializing puzzle core for size ${size}x${size}`);
    isPuzzleReady = false; // Mark as not ready during setup
    isSolved = false;
    // gameState = STATE_LOADING; // Set loading state (already set before calling this typically)

    // Validate that a usable image is loaded
    if (!puzzleImage || !puzzleImage.width || puzzleImage.width <= 0) {
        console.error("InitializePuzzle Error: Invalid or missing puzzleImage.");
        return false; // Indicate initialization failure
    }

    gridSize = size;
    if (gridSizeLabel) gridSizeLabel.html(`Grid Size: ${gridSize}x${gridSize}`);
    calculateLayout(); // Recalculate layout based on potentially new grid size

    // Calculate and store source image parameters needed for efficient drawing
    try {
        puzzleImageSourceInfo.img = puzzleImage;
        let imgSize = min(puzzleImage.width, puzzleImage.height);
        puzzleImageSourceInfo.size = imgSize;
        puzzleImageSourceInfo.offsetX = (puzzleImage.width - imgSize) / 2;
        puzzleImageSourceInfo.offsetY = (puzzleImage.height - imgSize) / 2;
        puzzleImageSourceInfo.srcTileW = imgSize / gridSize;
        puzzleImageSourceInfo.srcTileH = imgSize / gridSize;
        // Validate calculated source tile dimensions
        if (puzzleImageSourceInfo.srcTileW <= 0 || puzzleImageSourceInfo.srcTileH <= 0) {
            throw new Error("Calculated source tile dimension is zero or negative.");
        }
        console.log("Calculated source image info for direct drawing.");
    } catch (e) {
        console.error("Error calculating source image info:", e);
        return false; // Indicate initialization failure
    }

    // Setup board array in the initial solved state (0, 1, 2, ..., n*n-1)
    board = [];
    let totalTiles = gridSize * gridSize;
    for (let i = 0; i < totalTiles; i++) {
        board.push(i);
    }

    // Reset Timer variables
    timerRunning = false;
    elapsedTime = 0;
    startTime = 0;
    timerDisplayString = formatTime(0); // Reset display string to 0:00.00
    timerFlashState = true; // Reset flash state for next solve
    lastFlashToggle = 0;

    // Shuffle the board into a random (solvable) state
    shufflePuzzle();
    // Set the initial solved state and game state based on the shuffled board
    checkWinCondition(); // This sets isSolved and gameState (playing or solved)
    isPuzzleReady = true; // Mark the puzzle as ready for drawing
    console.log("Puzzle core initialized. Ready:", isPuzzleReady, "State:", gameState);
    return true; // Indicate successful initialization
}

function resetPuzzle() {
     // Resets and shuffles the puzzle using the current image and grid size
     console.log("Resetting puzzle...");
     if (!puzzleImage) {
         alert("Cannot reset, no image is loaded.");
         return;
     }
     gameState = STATE_LOADING; // Show loading briefly
     setTimeout(() => {
         if (initializePuzzle(gridSize)) { // Re-initialize
             showGameUI(); // Ensure game UI is visible
         } else {
             // Handle potential init failure (e.g., revert to splash)
             gameState = STATE_SPLASH; showSplashUI(); hideGameUI();
             alert("Error re-initializing puzzle.");
         }
     }, 50);
}

function calculateLayout() {
    // Calculates centered puzzle position (puzzleX, puzzleY, puzzleAreaSize)
    // and potentially fractional tile sizes (tileWidth, tileHeight).
    // Also updates the cached source image info.
    let safeMargin = 40; let uiSpace = 150; // Space below puzzle for UI
    let availableWidth = windowWidth - safeMargin;
    let availableHeight = windowHeight - safeMargin - uiSpace;
    // Ensure puzzle area size is an integer for potentially cleaner boundaries
    puzzleAreaSize = floor(min(availableWidth, availableHeight));
    // Ensure centered coordinates are integers
    puzzleX = floor((windowWidth - puzzleAreaSize) / 2);
    puzzleY = floor((windowHeight - puzzleAreaSize - uiSpace) / 2);

    // Calculate tile dimensions (can be fractional)
    if (gridSize > 0) {
        tileWidth = puzzleAreaSize / gridSize;
        tileHeight = puzzleAreaSize / gridSize;
    } else {
        tileWidth = 0; tileHeight = 0; // Avoid division by zero
    }
    console.log(`Layout Updated: Area=${puzzleAreaSize}px @ (${puzzleX},${puzzleY}), TileW=${tileWidth.toFixed(3)}px`);

    // Update cached source image info if possible
     if (puzzleImage && puzzleImage.width > 0 && gridSize > 0) {
         try {
            let imgSize = min(puzzleImage.width, puzzleImage.height);
            puzzleImageSourceInfo.size = imgSize;
            puzzleImageSourceInfo.offsetX = (puzzleImage.width - imgSize) / 2;
            puzzleImageSourceInfo.offsetY = (puzzleImage.height - imgSize) / 2;
            puzzleImageSourceInfo.srcTileW = imgSize / gridSize;
            puzzleImageSourceInfo.srcTileH = imgSize / gridSize;
            if (puzzleImageSourceInfo.srcTileW <= 0) { throw new Error("Invalid src tile width on layout calc."); }
            puzzleImageSourceInfo.img = puzzleImage; // Ensure correct image ref
         } catch (e) {
              console.error("Error recalculating source info on layout:", e);
              isPuzzleReady = false; // Mark as not ready if source calc fails
              puzzleImageSourceInfo.img = null;
         }
     } else {
          puzzleImageSourceInfo.img = null; // No valid image or grid size
     }
}

// Removed createImageTiles function

function shufflePuzzle() {
    // Shuffles the 'board' array using random valid moves from the blank space
    console.log("Shuffling board...");
    let blankValue = gridSize*gridSize - 1; // Value of the blank tile
    let blankIndex = board.indexOf(blankValue); // Current position of the blank

    // Safety check in case board is invalid
    if (blankIndex === -1) {
        console.error("Shuffle Error: Blank tile not found!");
        // Attempt recovery by resetting board
        board=[]; let totalTiles=gridSize*gridSize; for(let i=0;i<totalTiles;i++) board.push(i);
        blankIndex = totalTiles - 1;
        // Final check after recovery attempt
        if (board.length === 0 || board[blankIndex] !== blankValue) {
             console.error("Cannot recover board state for shuffle!"); return;
        }
    }

    let shuffleMoves = 150 * gridSize * gridSize; // Number of random moves proportional to grid size
    let lastMoveSource = -1; // Track the index the blank tile *came from* to prevent immediate reversal

    for (let i = 0; i < shuffleMoves; i++) {
        let possibleMoves = []; // Stores board indices that can swap with the blank

        // Calculate indices of potential neighbors
        let above = blankIndex - gridSize; let below = blankIndex + gridSize;
        let left = blankIndex - 1; let right = blankIndex + 1;

        // Check if moving tile from ABOVE (into blank) is valid
        if (blankIndex >= gridSize && above !== lastMoveSource) possibleMoves.push(above);
        // Check if moving tile from BELOW (into blank) is valid
        if (blankIndex < gridSize * gridSize - gridSize && below !== lastMoveSource) possibleMoves.push(below);
        // Check if moving tile from LEFT (into blank) is valid
        if (blankIndex % gridSize !== 0 && left !== lastMoveSource) possibleMoves.push(left);
        // Check if moving tile from RIGHT (into blank) is valid
        if (blankIndex % gridSize !== gridSize - 1 && right !== lastMoveSource) possibleMoves.push(right);

        if (possibleMoves.length > 0) {
            // Choose a random valid neighbor index to swap with
            let moveIndex = random(possibleMoves);
            swap(board, blankIndex, moveIndex); // Perform the swap
            lastMoveSource = blankIndex; // The blank's old position is the source of the last move
            blankIndex = moveIndex; // Update the blank's current position
        } else {
            // If no valid non-reverse moves, allow moving back
            lastMoveSource = -1;
            i--; // Don't count this as a full shuffle step
        }
    }
    isSolved = false; // Ensure puzzle is marked as unsolved after shuffling
    console.log("Shuffle complete.");
}


// --- Input Handlers ---

function handleSliderChange() {
    // Triggered when the grid size slider value changes interactively
    let newSize = gridSizeSlider.value();
    // Only re-initialize if the size actually changed AND the game is currently active
    if (newSize !== gridSize && (gameState === STATE_PLAYING || gameState === STATE_SOLVED)) {
        console.log("Slider changed to:", newSize);
        gameState = STATE_LOADING; // Show loading state briefly
        setTimeout(() => {
            if (initializePuzzle(newSize)) { // Re-initialize with the new size
                showGameUI(); // Ensure game UI is visible
            } else {
                // If init fails, revert to splash
                gameState = STATE_SPLASH; showSplashUI(); hideGameUI();
            }
        }, 50);
    } else if (newSize !== gridSize) {
         // If game isn't active, just update the size variable and label for the next time initializePuzzle is called
         gridSize = newSize;
         if (gridSizeLabel) gridSizeLabel.html(`Grid Size: ${gridSize}x${gridSize}`);
         console.log("Slider changed while inactive. Grid size set to:", newSize);
    }
}

function handleFile(file) {
    // Triggered by the createFileInput element when a file is selected
    console.log("File input changed. File info:", file); // Contains name, size, type, etc.

    console.log("Attempting to load image from file data...");
    hideSplashUI(); hideGameUI(); // Hide UI during loading process
    gameState = STATE_LOADING; // Set loading state

    // Use loadImage to process the file data
    loadImage(file.data,
        // Success Callback
        (newImg) => {
            console.log("Custom image loaded successfully from file.");
            puzzleImage = newImg; // Set this as the new active image
            // Use setTimeout for a brief delay, allowing loading message to display
            setTimeout(() => {
                if (initializePuzzle(gridSize)) { // Initialize puzzle with the new image
                    showGameUI(); // Show game UI if successful
                } else {
                    // If initialization fails, revert to splash screen
                    gameState = STATE_SPLASH; showSplashUI(); hideGameUI();
                }
                if (fileInput) fileInput.value(''); // Clear the file input element
            }, 50);
        },
        // Error Callback
        (err) => {
            console.error("Error loading image data from file:", err);
            alert("Failed to load file as image. Please use common formats like JPG, PNG, GIF, WebP.");
            if (fileInput) fileInput.value(''); // Clear the file input element
            // Revert to splash screen on load failure
            gameState = STATE_SPLASH; showSplashUI(); hideGameUI();
        }
    );
}

function keyPressed() {
    // Handles tile movement via arrow keys and starts timer on first move
    if (gameState !== STATE_PLAYING) return; // Ignore key presses if not in playing state

    let blankValue = gridSize * gridSize - 1; // Value representing the blank tile
    let blankIndex = board.indexOf(blankValue); // Find the current position of the blank
    if (blankIndex === -1) return; // Should not happen, but safety check

    let targetIndex = -1; // Will hold the board index of the tile to swap with the blank

    // Determine target index based on arrow key and blank position, ensuring move is valid
    if (keyCode === UP_ARROW && blankIndex < gridSize * gridSize - gridSize) targetIndex = blankIndex + gridSize; // Tile below moves up
    else if (keyCode === DOWN_ARROW && blankIndex >= gridSize) targetIndex = blankIndex - gridSize; // Tile above moves down
    else if (keyCode === LEFT_ARROW && blankIndex % gridSize !== gridSize - 1) targetIndex = blankIndex + 1; // Tile right moves left
    else if (keyCode === RIGHT_ARROW && blankIndex % gridSize !== 0) targetIndex = blankIndex - 1; // Tile left moves right

    // If a valid move was identified (targetIndex is not -1)
    if (targetIndex !== -1) {
        // --- Start Timer on First Valid Move ---
        if (!timerRunning) {
            timerRunning = true;
            startTime = millis(); // Record the starting time in milliseconds
            elapsedTime = 0; // Reset elapsed time just in case
            console.log("Timer started!");
        }

        swap(board, blankIndex, targetIndex); // Perform the tile swap
        checkWinCondition(); // Check if this move solved the puzzle (also stops timer if solved)

        // --- Remove focus from any active DOM element (like slider) ---
        // This prevents arrow keys controlling the slider after moving a piece
        if (document.activeElement) {
            document.activeElement.blur();
        }
    }
}

function checkWinCondition() {
    // Checks if the 'board' array matches the solved state (0, 1, 2, ...)
    // Updates game state and timer status accordingly
    let totalTiles = gridSize * gridSize;
    // Basic sanity check for board length
    if (board.length !== totalTiles) {
        isSolved = false;
        if (gameState === STATE_SOLVED) gameState = STATE_PLAYING; // Correct state if somehow invalid
        return;
    }

    // Check each position on the board
    for (let i = 0; i < totalTiles; i++) {
        if (board[i] !== i) { // If any tile is out of order
            isSolved = false;
            // If state was SOLVED, revert it to PLAYING
            if (gameState === STATE_SOLVED) gameState = STATE_PLAYING;
            return; // Not solved, exit check
        }
    }

    // If the loop completes without returning, the puzzle is solved
    if (!isSolved) { // Only log the message on the transition to solved
        console.log(">>> PUZZLE SOLVED! <<<");
    }
    isSolved = true;
    gameState = STATE_SOLVED; // Set the game state
    timerRunning = false; // Stop the timer
    lastFlashToggle = millis(); // Initialize flashing state timing
    timerFlashState = true; // Start with timer visible
}

// --- Utilities ---

function formatTime(seconds) {
    // Formats time in seconds to a M:SS.ss string
    let mins = floor(seconds / 60);
    let secs = floor(seconds) % 60;
    let hund = floor((seconds * 100) % 100); // Hundredths of a second
    // nf() is p5's number formatting function: nf(number, [left], [right])
    // Ensures leading zeros (e.g., 0 becomes 00 for seconds/hundredths)
    return `${nf(mins, 1)}:${nf(secs, 2, 0)}.${nf(hund, 2, 0)}`;
}

function swap(arr, i, j) {
    // Simple and efficient array element swap using destructuring assignment
    [arr[i], arr[j]] = [arr[j], arr[i]];
}

function windowResized() {
    // Adjusts canvas and repositions elements on window resize
    resizeCanvas(windowWidth, windowHeight);
    console.log("Window resized.");
    calculateLayout(); // Recalculate all positions and sizes
    positionElements(); // Reposition UI elements based on current game state
    console.log("Window resized processed.");
    // Note: No need to explicitly recreate tiles; drawing uses updated layout vars
}