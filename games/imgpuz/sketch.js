/**
 * Variable-Size Image Puzzle using p5.js
 *
 * Features:
 * - Splash screen with image choice (Default or Upload).
 * - Loads a default image; allows custom image uploads.
 * - Variable grid size via slider (2x2 to 10x10).
 * - Centered puzzle display and UI elements.
 * - Efficient drawing directly from source image (no pre-slicing).
 * - Precise coordinate calculation for gapless tile rendering.
 * - Timer: Starts on first move, stops and flashes on solve.
 * - Slider focus fix: Prevents arrow keys from controlling slider after tile move.
 */

// --- Constants ---
const MIN_GRID_SIZE = 2;
const MAX_GRID_SIZE = 10;
const DEFAULT_GRID_SIZE = 4;
const DEFAULT_IMAGE_PATH = './../../ref/realtree.jpg'; // Ensure this path is correct relative to HTML

// Game States
const STATE_SPLASH = 'splash';
const STATE_LOADING = 'loading'; // State while image/puzzle data is prepared
const STATE_PLAYING = 'playing';
const STATE_SOLVED = 'solved';

// --- Global Variables ---

// Image Data
let puzzleImage; // Current p5.Image object for the puzzle
let defaultPuzzleImage; // Stores the loaded default image
let isDefaultImageLoaded = false; // Flag for successful default image load in preload
// Stores calculated info for direct drawing from the source image
let puzzleImageSourceInfo = {
    img: null, size: 0, offsetX: 0, offsetY: 0, srcTileW: 0, srcTileH: 0
};

// Board State & Layout
let gridSize = DEFAULT_GRID_SIZE;
let board = []; // 1D array storing tile indices (0 to n*n-1, where n*n-1 is blank)
let tileWidth = 0; // On-screen display width of a tile
let tileHeight = 0;
let puzzleAreaSize = 0; // Pixel dimension of the square puzzle area
let puzzleX = 0; // Top-left X coordinate of the puzzle area
let puzzleY = 0;

// Game Flow & State
let gameState = STATE_SPLASH; // Initial state
let isPuzzleReady = false; // True when image, source info, and board are ready
let isSolved = false;

// Timer
let timerRunning = false;
let startTime = 0;
let elapsedTime = 0;
let timerDisplayString = "0:00.00";
// Timer Flashing on Solve
let timerFlashState = true;
const TIMER_FLASH_INTERVAL = 400; // ms
let lastFlashToggle = 0;

// UI DOM Elements
let gridSizeSlider, gridSizeLabel, resetButton, fileInput, uploadLabel; // Game UI
let splashTitle, splashText, defaultButton, uploadButton; // Splash UI
let cnv;


// --- Preload ---
// Loads assets (like the default image) before setup() begins.
// NOTE: If the default image file is large, this step can take time,
// delaying the appearance of the splash screen.
function preload() {
    console.log("Preloading default image...");
    defaultPuzzleImage = loadImage(DEFAULT_IMAGE_PATH,
        // Success callback
        (img) => {
            console.log("Default image loaded successfully.");
            isDefaultImageLoaded = true;
            // If splash screen is already waiting, enable the button
            if (gameState === STATE_SPLASH && defaultButton) {
                defaultButton.removeAttribute('disabled');
            }
        },
        // Error callback
        (err) => {
            console.error(`!!! FAILED TO LOAD DEFAULT IMAGE: ${DEFAULT_IMAGE_PATH}`, err);
            isDefaultImageLoaded = false;
            // User will be alerted in setup if needed
        }
    );
}

// --- Setup ---
// Runs once after preload. Creates canvas, initial UI, sets initial state.
function setup() {
    console.log("Setting up sketch...");
    cnv = createCanvas(windowWidth, windowHeight);
    cnv.style('display', 'block'); // Prevent scrollbars

    calculateLayout(); // Calculate initial layout for element positioning

    // --- Create UI Elements (both splash and game) ---
    createSplashUI();
    createGameUI();

    // --- Initial UI State ---
    positionElements(); // Position based on initial state (splash)
    if (gameState === STATE_SPLASH) {
        showSplashUI();
        hideGameUI();
        // Disable default button immediately if preload failed
        if (!isDefaultImageLoaded && defaultButton) {
            defaultButton.attribute('disabled', '');
        }
    } else { // Should not normally happen
        hideSplashUI();
        showGameUI();
    }

    // Alert if default image failed (only once in setup during splash)
    if (!isDefaultImageLoaded && gameState === STATE_SPLASH) {
        alert(`Warning: Could not load default image "${DEFAULT_IMAGE_PATH}".\nCheck path/server. 'Use Default' disabled.`);
    }

    // p5 global settings
    noStroke();
    imageMode(CORNER);
    textAlign(CENTER, CENTER);
    console.log("Setup complete. Initial state:", gameState);
}

// --- Main Draw Loop ---
// Runs continuously. Handles drawing based on the current game state.
function draw() {
    background(30); // Clear background

    // --- Update Timer ---
    if (timerRunning) {
        elapsedTime = (millis() - startTime) / 1000.0; // Elapsed seconds
        timerDisplayString = formatTime(elapsedTime);
    }

    // --- State Machine ---
    switch (gameState) {
        case STATE_SPLASH:
            // UI is DOM, nothing to draw usually
            break;
        case STATE_LOADING:
            // Show loading feedback
            fill(200); textSize(24);
            text("Loading / Preparing Puzzle...", width / 2, height / 2);
            break;
        case STATE_PLAYING:
        case STATE_SOLVED:
            // Draw the puzzle board and timer if ready
            if (isPuzzleReady) {
                drawPuzzleBoard();
                drawTimer();
            } else {
                // Show error if state is playing/solved but puzzle isn't ready
                fill(255, 0, 0); textSize(20);
                text("Error: Puzzle data not ready!", width / 2, height / 2);
            }
            break;
    }
}

// --- UI Creation and Management ---

function createSplashUI() {
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
}

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
    fileInput = createFileInput(handleFile)
        .style('color', 'white') // Style browser's button/text
        .hide(); // Hidden until needed
}

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

function hideSplashUI() {
    if (splashTitle) splashTitle.hide();
    if (splashText) splashText.hide();
    if (defaultButton) defaultButton.hide();
    if (uploadButton) uploadButton.hide();
}

function showGameUI() {
    if (gridSizeLabel) gridSizeLabel.show();
    if (gridSizeSlider) gridSizeSlider.show();
    if (resetButton) resetButton.show();
    if (uploadLabel) uploadLabel.show();
    if (fileInput) fileInput.show();
    positionGameUI(); // Update positions when shown
}

function hideGameUI() {
    if (gridSizeLabel) gridSizeLabel.hide();
    if (gridSizeSlider) gridSizeSlider.hide();
    if (resetButton) resetButton.hide();
    if (uploadLabel) uploadLabel.hide();
    if (fileInput) fileInput.hide();
}

function positionElements() {
    // Central positioning based on state and layout
    calculateLayout(); // Recalculate positions first
    if (gameState === STATE_SPLASH) {
        // Center splash elements
        if (splashTitle) splashTitle.position(0, height * 0.3);
        if (splashText) splashText.position(0, height * 0.4);
        if (defaultButton) defaultButton.position(width / 2 - 110, height * 0.5);
        if (uploadButton) uploadButton.position(width / 2 + 10, height * 0.5);
    } else {
        // Position game UI below puzzle area
        positionGameUI();
    }
}

function positionGameUI() {
    // Positions game UI elements sequentially below the puzzle area
    let uiStartX = puzzleX; let uiWidth = puzzleAreaSize;
    // Start UI below puzzle, reserve space for timer first
    let timerHeight = 30; // Height reserved for drawing timer text
    let uiStartY = puzzleY + puzzleAreaSize + 10 + timerHeight + 10; // Start below timer area + padding
    let currentY = uiStartY; // Track vertical position for subsequent elements
    let itemHeight = 25; // Approx height for labels/buttons for spacing
    let itemMargin = 5;  // Vertical margin between items

    if (gridSizeLabel) {
        gridSizeLabel.style('width', `${uiWidth}px`);
        gridSizeLabel.position(uiStartX, currentY);
        currentY += itemHeight + itemMargin;
    }
    if (gridSizeSlider) {
        let sliderWidth = uiWidth * 0.5;
        gridSizeSlider.style('width', `${sliderWidth}px`);
        gridSizeSlider.position(uiStartX + (uiWidth - sliderWidth) / 2, currentY);
        currentY += itemHeight + itemMargin + 5; // Extra space after slider
    }
    if (resetButton) {
        resetButton.position(uiStartX + (uiWidth - resetButton.width) / 2, currentY);
        currentY += itemHeight + itemMargin + 10; // Extra space after button
    }
    if (uploadLabel) {
        uploadLabel.style('width', `${uiWidth}px`);
        uploadLabel.position(uiStartX, currentY);
        currentY += itemHeight - 5; // Less space before file input
    }
    if (fileInput) {
        // Center file input approximately
        fileInput.position(uiStartX + (uiWidth - 150) / 2, currentY);
    }
}

// --- State Transition and Initialization ---

function useDefaultImage() {
    // Triggered by the 'Use Default' button
    if (!isDefaultImageLoaded || !defaultPuzzleImage) {
        alert("Default image is not available (load may have failed)."); return;
    }
    console.log("Starting game with default image.");
    puzzleImage = defaultPuzzleImage; // Set active image
    startGame(); // Transition state and initialize
}

function triggerUpload() {
    // Triggered by the 'Upload Image' button
    console.log("Triggering file input click...");
    if (fileInput) fileInput.elt.click(); // Click the hidden HTML input
}

function startGame() {
    // Central function to transition from splash/loading to playing
    // Assumes 'puzzleImage' is set correctly before this is called
    hideSplashUI();
    gameState = STATE_LOADING; // Show loading feedback
    setTimeout(() => { // Allow loading text to render
        if (initializePuzzle(gridSize)) { // Initialize board, calc source info, shuffle
            showGameUI();
            // State (playing/solved) is set inside initializePuzzle/checkWinCondition
        } else { // Handle initialization failure
            gameState = STATE_SPLASH; showSplashUI(); hideGameUI();
            alert("Error: Failed to prepare puzzle from image.");
        }
    }, 50);
}

// --- Puzzle Board Drawing ---

function drawPuzzleBoard() {
    // Draws puzzle using direct source sampling (9-arg image())
    if (!isPuzzleReady || !puzzleImageSourceInfo.img) return; // Guard clause

    push(); // Isolate drawing state
    translate(puzzleX, puzzleY); // Move to puzzle area origin

    let blankValue = gridSize * gridSize - 1;
    let blankIndex = board.indexOf(blankValue);
    let blankCol = (blankIndex !== -1) ? blankIndex % gridSize : -1;
    let blankRow = (blankIndex !== -1) ? floor(blankIndex / gridSize) : -1;

    let { img, offsetX, offsetY, srcTileW, srcTileH } = puzzleImageSourceInfo; // Get pre-calculated source info

    // Draw each tile based on the board state
    for (let i = 0; i < board.length; i++) {
        let tileIndex = board[i]; // The piece index (0..n*n-1)
        if (tileIndex === blankValue) continue; // Skip blank

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
             console.error(`Invalid source rect for tile ${tileIndex}`); fill(255,0,0); noStroke(); rect(dx,dy,dw,dh); continue;
        }
        // Draw the specific tile piece
        image(img, dx, dy, dw, dh, sx, sy, sw, sh);
    }

    // Draw final tile and overlay if solved
    if (gameState === STATE_SOLVED && blankIndex !== -1) {
        // Destination rect for blank spot
        let dx = round(blankCol * tileWidth); let dy = round(blankRow * tileHeight);
        let dNextX = round((blankCol + 1) * tileWidth); let dNextY = round((blankRow + 1) * tileHeight);
        let dw = dNextX - dx; let dh = dNextY - dy;
        // Source rect for the final piece
        let srcTileCol = blankValue % gridSize; let srcTileRow = floor(blankValue / gridSize);
        let sx = floor(offsetX + srcTileCol * srcTileW); let sy = floor(offsetY + srcTileRow * srcTileH);
        let sw = floor(srcTileW); let sh = floor(srcTileH);

        // Draw final piece if source is valid
        if (!(sx < 0 || sy < 0 || sw <= 0 || sh <= 0 || sx + sw > img.width + 1 || sy + sh > img.height + 1)) {
            image(img, dx, dy, dw, dh, sx, sy, sw, sh);
        } else { console.error("Invalid source rect for final tile."); fill(0,0,255); noStroke(); rect(dx,dy,dw,dh); }

        // Solved Overlay
        fill(0, 200, 0, 80); noStroke(); rect(0, 0, puzzleAreaSize, puzzleAreaSize);
        fill(255); textSize(puzzleAreaSize / 8); noStroke(); text("SOLVED!", puzzleAreaSize / 2, puzzleAreaSize / 2);
    }
    pop(); // Restore original drawing state
}

// --- Timer Drawing ---
function drawTimer() {
    // Draws the timer text below the puzzle area
    let timerX = puzzleX + puzzleAreaSize / 2; // Center horizontally
    let timerY = puzzleY + puzzleAreaSize + 20; // Position below puzzle + padding
    let timerSize = 24;

    textSize(timerSize);
    textAlign(CENTER, TOP); // Align text by its top edge

    // Handle flashing when solved
    if (gameState === STATE_SOLVED) {
        let now = millis();
        if (now - lastFlashToggle > TIMER_FLASH_INTERVAL) {
            timerFlashState = !timerFlashState; // Toggle visibility
            lastFlashToggle = now;
        }
        fill(0, 255, 0, timerFlashState ? 255 : 100); // Flash alpha
    } else {
        fill(0, 255, 0, 255); // Solid green when playing/loading
    }

    // Display the formatted time string
    text(timerDisplayString, timerX, timerY);
}


// --- Puzzle Initialization and Core Logic ---

function initializePuzzle(size) {
    // Prepares the puzzle board, calculates source image info, resets timer, shuffles.
    // Returns true on success, false on failure.
    console.log(`Initializing puzzle core for size ${size}x${size}`);
    isPuzzleReady = false; isSolved = false; // Reset flags
    // gameState remains STATE_LOADING during this process

    if (!puzzleImage || !puzzleImage.width || puzzleImage.width <= 0) {
        console.error("InitializePuzzle Error: Invalid puzzleImage."); return false;
    }

    gridSize = size;
    if (gridSizeLabel) gridSizeLabel.html(`Grid Size: ${gridSize}x${gridSize}`);
    calculateLayout(); // Recalculate layout for the new grid size

    // Calculate and cache source image parameters
    try {
        puzzleImageSourceInfo.img = puzzleImage;
        let imgSize = min(puzzleImage.width, puzzleImage.height);
        puzzleImageSourceInfo.size = imgSize;
        puzzleImageSourceInfo.offsetX = (puzzleImage.width - imgSize) / 2;
        puzzleImageSourceInfo.offsetY = (puzzleImage.height - imgSize) / 2;
        puzzleImageSourceInfo.srcTileW = imgSize / gridSize;
        puzzleImageSourceInfo.srcTileH = imgSize / gridSize;
        if (puzzleImageSourceInfo.srcTileW <= 0) { throw new Error("Src tile width <= 0."); }
        console.log("Calculated source image info.");
    } catch (e) { console.error("Error calculating source image info:", e); return false; }

    // Setup board in solved state
    board = []; let totalTiles = gridSize * gridSize;
    for (let i = 0; i < totalTiles; i++) { board.push(i); }

    // Reset Timer
    timerRunning = false; elapsedTime = 0; startTime = 0;
    timerDisplayString = formatTime(0);
    timerFlashState = true; lastFlashToggle = 0;

    // Shuffle and finalize state
    shufflePuzzle();
    checkWinCondition(); // Sets isSolved and gameState (playing or solved)
    isPuzzleReady = true; // Mark as ready
    console.log("Puzzle core initialized. Ready:", isPuzzleReady, "State:", gameState);
    return true; // Success
}

function resetPuzzle() {
     // Resets and shuffles the puzzle using the current image and grid size
     console.log("Resetting puzzle...");
     if (!puzzleImage) { alert("Cannot reset, no image is loaded."); return; }
     gameState = STATE_LOADING;
     setTimeout(() => {
         if (initializePuzzle(gridSize)) { showGameUI(); } // Re-initialize and show UI
         else { gameState = STATE_SPLASH; showSplashUI(); hideGameUI(); alert("Error re-initializing puzzle.");} // Revert on failure
     }, 50);
}

function calculateLayout() {
    // Calculates centered puzzle position and tile dimensions, updates source info cache.
    // *** ADJUSTED LAYOUT CONSTANTS ***
    let safeMargin = 30; // Slightly smaller margin
    let uiSpace = 180;   // Increased space below puzzle for timer and all UI elements

    let availableWidth = windowWidth - safeMargin;
    let availableHeight = windowHeight - safeMargin - uiSpace; // Available height for puzzle itself
    puzzleAreaSize = floor(min(availableWidth, availableHeight)); // Ensure integer size
    puzzleX = floor((windowWidth - puzzleAreaSize) / 2);
    puzzleY = floor((windowHeight - puzzleAreaSize - uiSpace) / 2); // Center vertically in available top space

    // Calculate tile dimensions (can be fractional)
    if (gridSize > 0) { tileWidth = puzzleAreaSize / gridSize; tileHeight = puzzleAreaSize / gridSize; }
    else { tileWidth = 0; tileHeight = 0; }
    console.log(`Layout Updated: Area=${puzzleAreaSize}px @ (${puzzleX},${puzzleY}), TileW=${tileWidth.toFixed(3)}px`);

    // Update source info cache if possible
     if (puzzleImage && puzzleImage.width > 0 && gridSize > 0) {
         try {
            let imgSize = min(puzzleImage.width, puzzleImage.height);
            puzzleImageSourceInfo.size = imgSize;
            puzzleImageSourceInfo.offsetX = (puzzleImage.width - imgSize) / 2;
            puzzleImageSourceInfo.offsetY = (puzzleImage.height - imgSize) / 2;
            puzzleImageSourceInfo.srcTileW = imgSize / gridSize;
            puzzleImageSourceInfo.srcTileH = imgSize / gridSize;
            if (puzzleImageSourceInfo.srcTileW <= 0) { throw new Error("Invalid src tile width on layout calc."); }
            puzzleImageSourceInfo.img = puzzleImage;
         } catch (e) { console.error("Error recalculating source info:", e); isPuzzleReady=false; puzzleImageSourceInfo.img=null; }
     } else { puzzleImageSourceInfo.img = null; }
}

// Removed createImageTiles function

function shufflePuzzle() {
    // Shuffles the 'board' array using random valid moves from the blank space
    console.log("Shuffling board...");
    let blankValue = gridSize*gridSize - 1; let blankIndex = board.indexOf(blankValue);
    if (blankIndex === -1) { console.error("Shuffle Error: Blank tile not found!"); board=[]; let tt=gridSize*gridSize; for(let i=0;i<tt;i++) board.push(i); blankIndex = tt-1; if (board.length===0 || board[blankIndex]!==blankValue) { console.error("Cannot recover board state!"); return; } }
    let shuffleMoves = 150 * gridSize * gridSize; let lastMoveSource = -1;
    for (let i=0; i<shuffleMoves; i++){let possibleMoves=[]; let a=blankIndex-gridSize, b=blankIndex+gridSize, l=blankIndex-1, r=blankIndex+1; if(blankIndex>=gridSize && a!==lastMoveSource) possibleMoves.push(a); if(blankIndex<gridSize*gridSize-gridSize && b!==lastMoveSource) possibleMoves.push(b); if(blankIndex%gridSize!==0 && l!==lastMoveSource) possibleMoves.push(l); if(blankIndex%gridSize!==gridSize-1 && r!==lastMoveSource) possibleMoves.push(r); if(possibleMoves.length > 0){let moveIndex=random(possibleMoves); swap(board, blankIndex, moveIndex); lastMoveSource=blankIndex; blankIndex=moveIndex;} else {lastMoveSource=-1; i--;}}
    isSolved = false; // Ensure not marked as solved
    console.log("Shuffle complete.");
}


// --- Input Handlers ---

function handleSliderChange() {
    // Triggered by the grid size slider
    let newSize = gridSizeSlider.value();
    // Only re-initialize if size changed AND game is currently active
    if (newSize !== gridSize && (gameState === STATE_PLAYING || gameState === STATE_SOLVED)) {
        console.log("Slider changed to:", newSize);
        gameState = STATE_LOADING;
        setTimeout(() => {
            if (initializePuzzle(newSize)) { showGameUI(); } // Re-init and show UI
            else { gameState = STATE_SPLASH; showSplashUI(); hideGameUI(); } // Revert on failure
        }, 50);
    } else if (newSize !== gridSize) { // If game inactive, just update var and label
         gridSize = newSize; if (gridSizeLabel) gridSizeLabel.html(`Grid Size: ${gridSize}x${gridSize}`);
         console.log("Slider changed while inactive. Grid size set to:", newSize);
    }
}

function handleFile(file) {
    // Triggered when a file is selected via the createFileInput element
    console.log("File input changed. File info:", file);
    console.log("Attempting to load image from file data...");
    hideSplashUI(); hideGameUI(); gameState = STATE_LOADING; // Hide UI, show loading

    // Load image data using p5's loadImage
    loadImage(file.data,
        // Success Callback
        (newImg) => {
            console.log("Custom image loaded successfully from file.");
            puzzleImage = newImg; // Update the active puzzle image
            setTimeout(() => { // Brief delay for loading message render
                if (initializePuzzle(gridSize)) { // Initialize puzzle with the new image
                    showGameUI(); // Show game UI if init succeeds
                } else { // Handle initialization failure
                    gameState = STATE_SPLASH; showSplashUI(); hideGameUI();
                }
                if (fileInput) fileInput.value(''); // Clear file input field
            }, 50);
        },
        // Error Callback
        (err) => {
            console.error("Error loading image data from file:", err);
            alert("Failed to load file as image. Use JPG, PNG, GIF, WebP etc.");
            if (fileInput) fileInput.value(''); // Clear file input field
            gameState = STATE_SPLASH; showSplashUI(); hideGameUI(); // Revert to splash on error
        }
    );
}

function keyPressed() {
    // Handles tile movement via arrow keys and starts the timer
    if (gameState !== STATE_PLAYING) return; // Only allow moves when playing

    let blankValue = gridSize * gridSize - 1;
    let blankIndex = board.indexOf(blankValue);
    if (blankIndex === -1) return; // Exit if blank not found

    let targetIndex = -1; // Index of tile to swap with blank

    // Determine target index based on key pressed
    if (keyCode === UP_ARROW && blankIndex < gridSize*gridSize - gridSize) targetIndex = blankIndex + gridSize;
    else if (keyCode === DOWN_ARROW && blankIndex >= gridSize) targetIndex = blankIndex - gridSize;
    else if (keyCode === LEFT_ARROW && blankIndex % gridSize !== gridSize - 1) targetIndex = blankIndex + 1;
    else if (keyCode === RIGHT_ARROW && blankIndex % gridSize !== 0) targetIndex = blankIndex - 1;

    // If a valid move was identified
    if (targetIndex !== -1) {
        // Start Timer only on the very first valid move
        if (!timerRunning && !isSolved) { // Second condition prevents restart if keys hit after solve
            timerRunning = true;
            startTime = millis(); // Record start time
            elapsedTime = 0; // Ensure elapsed starts at 0
            console.log("Timer started!");
        }

        swap(board, blankIndex, targetIndex); // Perform the move
        checkWinCondition(); // Check if the puzzle is now solved (stops timer if true)

        // --- Slider Focus Fix ---
        // Remove focus from any active DOM element (like the slider)
        // so subsequent arrow presses control the puzzle, not the slider.
        if (document.activeElement) {
            document.activeElement.blur();
        }
    }
}

function checkWinCondition() {
    // Checks if the 'board' array is in the solved state (0, 1, 2, ...)
    // Updates game state (PLAYING or SOLVED) and timer status.
    let totalTiles = gridSize * gridSize;
    if (board.length !== totalTiles) { isSolved=false; if(gameState===STATE_SOLVED) gameState=STATE_PLAYING; return; } // Safety check

    for (let i = 0; i < totalTiles; i++) {
        if (board[i] !== i) { // If any tile is out of order
            isSolved = false;
            // If state was SOLVED (e.g., user made a move after solving), revert to PLAYING
            if (gameState === STATE_SOLVED) gameState = STATE_PLAYING;
            return; // Not solved
        }
    }

    // If the loop completes, the puzzle is solved
    if (!isSolved) { // Only log/stop timer on the transition to solved
        console.log(">>> PUZZLE SOLVED! <<<");
        timerRunning = false; // Stop the timer
        lastFlashToggle = millis(); // Initialize flash timing
        timerFlashState = true; // Start flash visible
    }
    isSolved = true;
    gameState = STATE_SOLVED; // Set state
}

// --- Utilities ---

function formatTime(seconds) {
    // Formats time in seconds to a M:SS.ss string using p5.nf() for padding
    let mins = floor(seconds / 60);
    let secs = floor(seconds) % 60;
    let hund = floor((seconds * 100) % 100);
    // nf(number, [digitsLeft], [digitsRight])
    return `${nf(mins, 1)}:${nf(secs, 2, 0)}.${nf(hund, 2, 0)}`;
}

function swap(arr, i, j) {
    // Swaps two elements in an array efficiently
    [arr[i], arr[j]] = [arr[j], arr[i]];
}

function windowResized() {
    // Handles window resize event
    resizeCanvas(windowWidth, windowHeight);
    console.log("Window resized.");
    calculateLayout(); // Recalculate all positions and sizes
    positionElements(); // Reposition UI elements based on current state
    console.log("Window resized processed.");
}