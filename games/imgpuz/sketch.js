/**
 * Variable-Size Image Puzzle using p5.js
 *
 * Features:
 * - Loads a default image from a relative path.
 * - Allows users to upload a custom image.
 * - Slider to control grid size (2x2 to 10x10).
 * - Centered puzzle display and UI elements.
 * - Uses direct image drawing (9-argument image()) for performance.
 * - Implements precise coordinate calculation to eliminate gaps between tiles.
 * - Splash screen for initial user choice.
 * - Game state management.
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
let puzzleImageSourceInfo = { // Stores calculated info for direct drawing from the source image
    img: null,
    size: 0,
    offsetX: 0,
    offsetY: 0,
    srcTileW: 0,
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

// Game Flow
let gameState = STATE_SPLASH; // Initial state
let isPuzzleReady = false; // True when image is valid and board/source info is ready
let isSolved = false; // Tracks if the current board state is solved

// UI DOM Elements
let gridSizeSlider, gridSizeLabel, resetButton, fileInput, uploadLabel; // Game UI
let splashTitle, splashText, defaultButton, uploadButton; // Splash UI
let cnv; // Canvas


// --- Preload ---
// Loads assets that MUST be available before setup() runs.
function preload() {
    console.log("Preloading default image...");
    defaultPuzzleImage = loadImage(DEFAULT_IMAGE_PATH,
        (img) => { // Success callback
            console.log("Default image loaded successfully.");
            isDefaultImageLoaded = true;
            if (gameState === STATE_SPLASH && defaultButton) {
                defaultButton.removeAttribute('disabled');
            }
        },
        (err) => { // Error callback
            console.error("!!! FAILED TO LOAD DEFAULT IMAGE:", DEFAULT_IMAGE_PATH, err);
            isDefaultImageLoaded = false;
        }
    );
}

// --- Setup ---
// Runs once after preload is complete. Initializes canvas and UI.
function setup() {
    console.log("Setting up sketch...");
    cnv = createCanvas(windowWidth, windowHeight);
    cnv.style('display', 'block');

    calculateLayout(); // Calculate initial sizes for centering

    // --- Create UI Elements ---
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
        .style('color', 'white').hide(); // Hidden until triggered

    // --- Initial UI State ---
    positionElements(); // Position based on initial state (splash)
    if (gameState === STATE_SPLASH) {
        showSplashUI();
        hideGameUI();
        if (!isDefaultImageLoaded && defaultButton) {
            defaultButton.attribute('disabled', '');
        }
    } else {
        hideSplashUI(); showGameUI();
    }

    // Alert if default failed (only once in setup)
    if (!isDefaultImageLoaded && gameState === STATE_SPLASH) {
        alert(`Warning: Could not load the default image from "${DEFAULT_IMAGE_PATH}".\nCheck the path and ensure you are running from a web server.\nThe 'Use Default' option will be disabled.`);
    }

    // p5 settings
    noStroke();
    imageMode(CORNER);
    textAlign(CENTER, CENTER);
    console.log("Setup complete. Initial state:", gameState);
}

// --- Main Draw Loop ---
// Continuously executes. Handles drawing based on the current game state.
function draw() {
    background(30); // Clear background each frame

    // --- State Machine ---
    switch (gameState) {
        case STATE_SPLASH:
            // Splash UI is DOM, nothing to draw typically
            break;
        case STATE_LOADING:
            fill(200); textSize(24);
            text("Loading / Preparing Puzzle...", width / 2, height / 2);
            break;
        case STATE_PLAYING:
        case STATE_SOLVED: // Draw board for both states
            if (isPuzzleReady) {
                drawPuzzleBoard();
            } else {
                // Show error if trying to draw when not ready
                fill(255, 0, 0); textSize(20);
                text("Error: Puzzle not ready!", width / 2, height / 2);
            }
            break;
    }
}

// --- UI Management Functions ---

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
    positionGameUI(); // Reposition after showing
}

function hideGameUI() {
    if (gridSizeLabel) gridSizeLabel.hide();
    if (gridSizeSlider) gridSizeSlider.hide();
    if (resetButton) resetButton.hide();
    if (uploadLabel) uploadLabel.hide();
    if (fileInput) fileInput.hide();
}

function positionElements() {
    // Positions UI based on current state and calculated layout
    calculateLayout();

    if (gameState === STATE_SPLASH) {
        if(splashTitle) splashTitle.position(0, height * 0.3);
        if(splashText) splashText.position(0, height * 0.4);
        if(defaultButton) defaultButton.position(width / 2 - 110, height * 0.5);
        if(uploadButton) uploadButton.position(width / 2 + 10, height * 0.5);
    } else {
        positionGameUI(); // Position game elements if not splash
    }
}

function positionGameUI() {
    // Positions slider, labels, buttons relative to the centered puzzle area
    // Assumes calculateLayout() has been called recently
    let uiStartX = puzzleX; let uiWidth = puzzleAreaSize;
    let uiStartY = puzzleY + puzzleAreaSize + 20;
    let currentY = uiStartY;

    if (gridSizeLabel) {
        gridSizeLabel.style('width', `${uiWidth}px`);
        gridSizeLabel.position(uiStartX, currentY);
        currentY += 25;
    }
    if (gridSizeSlider) {
        let sliderWidth = uiWidth * 0.5;
        gridSizeSlider.style('width', `${sliderWidth}px`);
        gridSizeSlider.position(uiStartX + (uiWidth - sliderWidth) / 2, currentY);
        currentY += 30;
    }
    if (resetButton) {
        resetButton.position(uiStartX + (uiWidth - resetButton.width) / 2, currentY);
        currentY += 40;
    }
    if (uploadLabel) {
        uploadLabel.style('width', `${uiWidth}px`);
        uploadLabel.position(uiStartX, currentY);
        currentY += 20;
    }
    if (fileInput) {
        // Approximate centering for file input
        fileInput.position(uiStartX + (uiWidth - 150) / 2, currentY);
    }
}

// --- State Transition and Initialization ---

function useDefaultImage() {
    // Triggered by the 'Use Default' button
    if (!isDefaultImageLoaded || !defaultPuzzleImage) {
        alert("Default image is not available. Load failed.");
        return;
    }
    console.log("Starting game with default image.");
    puzzleImage = defaultPuzzleImage; // Set the active image source
    startGame(); // Transition to loading/playing state
}

function triggerUpload() {
    // Triggered by the 'Upload Image' button
    console.log("Triggering file input click...");
    if (fileInput) {
        fileInput.elt.click(); // Click the hidden HTML file input element
    }
}

function startGame() {
    // Central function to transition from splash/loading to playing
    // Assumes 'puzzleImage' has been set (to default or custom)
    hideSplashUI();
    gameState = STATE_LOADING;
    // Short delay allows the "Loading..." message to render before initialization
    setTimeout(() => {
        if (initializePuzzle(gridSize)) { // Initialize board, calculate source info, shuffle
            showGameUI();
            // State (playing/solved) is set by checkWinCondition inside initializePuzzle
        } else {
            // Handle initialization failure
            gameState = STATE_SPLASH; showSplashUI(); hideGameUI();
            alert("Error: Failed to prepare the puzzle from the selected image.");
        }
    }, 50);
}

// --- Puzzle Board Drawing ---

function drawPuzzleBoard() {
    // Draws the current state using direct source sampling
    if (!isPuzzleReady || !puzzleImageSourceInfo.img) return; // Safety check

    push();
    translate(puzzleX, puzzleY); // Move origin to puzzle area corner

    let blankValue = gridSize * gridSize - 1;
    // *** FIX: Declare blankIndex consistently ***
    let blankIndex = board.indexOf(blankValue);
    let blankCol = (blankIndex !== -1) ? blankIndex % gridSize : -1;
    let blankRow = (blankIndex !== -1) ? floor(blankIndex / gridSize) : -1;

    let { img, size, offsetX, offsetY, srcTileW, srcTileH } = puzzleImageSourceInfo;

    // Loop through each position on the board
    for (let i = 0; i < board.length; i++) {
        let tileIndex = board[i]; // The piece index (0..n*n-1) at this board spot
        if (tileIndex === blankValue) continue; // Don't draw the blank spot

        let boardCol = i % gridSize; let boardRow = floor(i / gridSize);

        // Calculate precise integer Destination coordinates/dimensions
        let dx = round(boardCol * tileWidth); let dy = round(boardRow * tileHeight);
        let dNextX = round((boardCol + 1) * tileWidth); let dNextY = round((boardRow + 1) * tileHeight);
        let dw = dNextX - dx; let dh = dNextY - dy;

        // Calculate Source coordinates/dimensions
        let srcTileCol = tileIndex % gridSize; let srcTileRow = floor(tileIndex / gridSize);
        let sx = floor(offsetX + srcTileCol * srcTileW); let sy = floor(offsetY + srcTileRow * srcTileH);
        let sw = floor(srcTileW); let sh = floor(srcTileH);

        // Validate source rect before drawing
        if (sx < 0 || sy < 0 || sw <= 0 || sh <= 0 || sx + sw > img.width + 1 || sy + sh > img.height + 1) {
             console.error(`Invalid source rect for tileIndex ${tileIndex}`);
             fill(255, 0, 0); noStroke(); rect(dx, dy, dw, dh); continue;
        }

        // Draw the tile from source image to destination canvas
        image(img, dx, dy, dw, dh, sx, sy, sw, sh);
    }

    // --- Draw Final Tile and Solved Overlay (if solved) ---
    if (gameState === STATE_SOLVED) {
        // *** FIX: Use blankIndex, remove check for removed `tiles` array ***
        if (blankIndex !== -1) {
             // Calculate destination for the blank spot precisely
             let dx = round(blankCol * tileWidth); let dy = round(blankRow * tileHeight);
             let dNextX = round((blankCol + 1) * tileWidth); let dNextY = round((blankRow + 1) * tileHeight);
             let dw = dNextX - dx; let dh = dNextY - dy;

             // Calculate source for the final piece (index blankValue)
             let srcTileCol = blankValue % gridSize; let srcTileRow = floor(blankValue / gridSize);
             let sx = floor(offsetX + srcTileCol * srcTileW); let sy = floor(offsetY + srcTileRow * srcTileH);
             let sw = floor(srcTileW); let sh = floor(srcTileH);

             // Draw final piece if source is valid
             if (!(sx < 0 || sy < 0 || sw <= 0 || sh <= 0 || sx + sw > img.width + 1 || sy + sh > img.height + 1)) {
                 image(img, dx, dy, dw, dh, sx, sy, sw, sh);
             } else {
                  console.error("Invalid source rect for final solved tile.");
                  fill(0, 0, 255); noStroke(); rect(dx, dy, dw, dh); // Error indicator
             }

             // Draw transparent green solved overlay
             fill(0, 200, 0, 80); noStroke();
             rect(0, 0, puzzleAreaSize, puzzleAreaSize);

             // Draw "SOLVED!" text
             fill(255); textSize(puzzleAreaSize / 8); noStroke();
             text("SOLVED!", puzzleAreaSize / 2, puzzleAreaSize / 2);
        }
    }
    pop(); // Restore origin
}


// --- Puzzle Initialization and Core Logic ---

function initializePuzzle(size) {
    // Prepares the puzzle board and source image info for a given size
    console.log(`Initializing puzzle core for size ${size}x${size}`);
    isPuzzleReady = false; isSolved = false; // Reset flags

    if (!puzzleImage || !puzzleImage.width || puzzleImage.width <= 0) {
        console.error("InitializePuzzle Error: Invalid puzzleImage."); return false;
    }

    gridSize = size;
    if (gridSizeLabel) gridSizeLabel.html(`Grid Size: ${gridSize}x${gridSize}`);
    calculateLayout(); // Recalculate layout for the new grid size

    // Calculate and store source image parameters for direct drawing
    try {
        puzzleImageSourceInfo.img = puzzleImage;
        let imgSize = min(puzzleImage.width, puzzleImage.height);
        puzzleImageSourceInfo.size = imgSize;
        puzzleImageSourceInfo.offsetX = (puzzleImage.width - imgSize) / 2;
        puzzleImageSourceInfo.offsetY = (puzzleImage.height - imgSize) / 2;
        puzzleImageSourceInfo.srcTileW = imgSize / gridSize;
        puzzleImageSourceInfo.srcTileH = imgSize / gridSize;
        if (puzzleImageSourceInfo.srcTileW <= 0 || puzzleImageSourceInfo.srcTileH <= 0) { throw new Error("Src tile dim <= 0."); }
        console.log("Calculated source image info.");
    } catch (e) {
        console.error("Error calculating source image info:", e); return false; // Indicate failure
    }

    // Setup board array in solved state (0 to n*n-1)
    board = []; let totalTiles = gridSize * gridSize;
    for (let i = 0; i < totalTiles; i++) { board.push(i); }

    // Shuffle the board
    shufflePuzzle();
    // Set initial solved state and overall readiness
    checkWinCondition(); // This sets isSolved and gameState (playing or solved)
    isPuzzleReady = true;
    console.log("Puzzle core initialized. Ready:", isPuzzleReady, "State:", gameState);
    return true; // Indicate success
}

function resetPuzzle() {
     // Resets and shuffles the puzzle using the current image and grid size
     console.log("Resetting puzzle...");
     if (!puzzleImage) { alert("Cannot reset, no image is loaded."); return; }
     gameState = STATE_LOADING; // Show loading briefly
     setTimeout(() => {
         if (initializePuzzle(gridSize)) { // Re-initialize
             showGameUI(); // Ensure game UI is visible
         } else { // Handle potential init failure
             gameState = STATE_SPLASH; showSplashUI(); hideGameUI();
         }
     }, 50);
}

function calculateLayout() {
    // Calculates centered puzzle position (puzzleX, puzzleY, puzzleAreaSize)
    // and potentially fractional tile sizes (tileWidth, tileHeight)
    let safeMargin = 40; let uiSpace = 150;
    let availableWidth = windowWidth - safeMargin; let availableHeight = windowHeight - safeMargin - uiSpace;
    puzzleAreaSize = floor(min(availableWidth, availableHeight));
    puzzleX = floor((windowWidth - puzzleAreaSize) / 2);
    puzzleY = floor((windowHeight - puzzleAreaSize - uiSpace) / 2);
    if (gridSize > 0) { // Avoid division by zero if called early
        tileWidth = puzzleAreaSize / gridSize;
        tileHeight = puzzleAreaSize / gridSize;
    } else { tileWidth = 0; tileHeight = 0; }
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
            if (puzzleImageSourceInfo.srcTileW <= 0) { throw new Error("Invalid src tile width."); }
            puzzleImageSourceInfo.img = puzzleImage;
         } catch (e) { console.error("Error recalculating source info:", e); isPuzzleReady=false; puzzleImageSourceInfo.img=null;}
     } else { puzzleImageSourceInfo.img = null; }
}

// Removed createImageTiles function

function shufflePuzzle() {
    // Shuffles the 'board' array using random valid moves
    console.log("Shuffling board...");
    let blankValue = gridSize*gridSize - 1; let blankIndex = board.indexOf(blankValue);
    if (blankIndex === -1) { console.error("Shuffle Error: Blank tile not found!"); board=[]; let tt=gridSize*gridSize; for(let i=0;i<tt;i++) board.push(i); blankIndex=tt-1; if(board.length===0 || board[blankIndex]!==blankValue) { console.error("Cannot recover board state!"); return; }}
    let shuffleMoves = 150 * gridSize * gridSize; let lastMove = -1;
    for (let i=0; i<shuffleMoves; i++){let possibleMoves=[]; let a=blankIndex-gridSize, b=blankIndex+gridSize, l=blankIndex-1, r=blankIndex+1; if(blankIndex>=gridSize && a!==lastMove) possibleMoves.push(a); if(blankIndex<gridSize*gridSize-gridSize && b!==lastMove) possibleMoves.push(b); if(blankIndex%gridSize!==0 && l!==lastMove) possibleMoves.push(l); if(blankIndex%gridSize!==gridSize-1 && r!==lastMove) possibleMoves.push(r); if(possibleMoves.length > 0){let moveIndex=random(possibleMoves); swap(board, blankIndex, moveIndex); lastMove=blankIndex; blankIndex=moveIndex;} else {lastMove=-1; i--;}}
    isSolved = false; // Ensure not solved after shuffle
    console.log("Shuffle complete.");
}


// --- Input Handlers ---

function handleSliderChange() {
    let newSize = gridSizeSlider.value();
    // Only re-initialize if size changed AND game is active
    if (newSize !== gridSize && (gameState === STATE_PLAYING || gameState === STATE_SOLVED)) {
        console.log("Slider changed to:", newSize);
        gameState = STATE_LOADING;
        setTimeout(() => {
            if (initializePuzzle(newSize)) { showGameUI(); }
            else { gameState = STATE_SPLASH; showSplashUI(); hideGameUI(); }
        }, 50);
    } else if (newSize !== gridSize) { // Update size var if game not active
         gridSize = newSize; if (gridSizeLabel) gridSizeLabel.html(`Grid Size: ${gridSize}x${gridSize}`);
         console.log("Slider changed while inactive. Size set to:", newSize);
    }
}

function handleFile(file) {
    // Triggered by the createFileInput element
    console.log("File input changed. File info:", file);
    console.log("Attempting to load image from file data...");
    hideSplashUI(); hideGameUI(); gameState = STATE_LOADING;

    loadImage(file.data,
        (newImg) => { // Success
            console.log("Custom image loaded successfully.");
            puzzleImage = newImg; // Set as current image
            setTimeout(() => { // Brief delay for loading msg
                if (initializePuzzle(gridSize)) { // Init with new image
                    showGameUI(); // Show game UI if successful
                } else { // Handle init failure
                    gameState = STATE_SPLASH; showSplashUI(); hideGameUI();
                }
                if (fileInput) fileInput.value(''); // Clear input
            }, 50);
        },
        (err) => { // Error
            console.error("Error loading image data from file:", err);
            alert("Failed to load file as image. Use JPG, PNG, GIF, WebP etc.");
            if (fileInput) fileInput.value('');
            gameState = STATE_SPLASH; showSplashUI(); hideGameUI(); // Revert to splash
        }
    );
}

function keyPressed() {
    // Handles tile movement via arrow keys
    if (gameState !== STATE_PLAYING) return; // Ignore if not playing

    let blankValue = gridSize*gridSize - 1; let blankIndex = board.indexOf(blankValue); if (blankIndex === -1) return;
    let targetIndex = -1; // Index of tile to swap with blank

    if (keyCode === UP_ARROW && blankIndex < gridSize*gridSize - gridSize) targetIndex = blankIndex + gridSize;
    else if (keyCode === DOWN_ARROW && blankIndex >= gridSize) targetIndex = blankIndex - gridSize;
    else if (keyCode === LEFT_ARROW && blankIndex % gridSize !== gridSize - 1) targetIndex = blankIndex + 1;
    else if (keyCode === RIGHT_ARROW && blankIndex % gridSize !== 0) targetIndex = blankIndex - 1;

    if (targetIndex !== -1) {
        swap(board, blankIndex, targetIndex);
        checkWinCondition(); // Check if move resulted in win
    }
}

function checkWinCondition() {
    // Checks if the 'board' array matches the solved state (0, 1, 2, ...)
    let totalTiles = gridSize * gridSize;
    if (board.length !== totalTiles) { isSolved=false; if(gameState===STATE_SOLVED)gameState=STATE_PLAYING; return; } // Safety check
    for (let i = 0; i < totalTiles; i++) { if (board[i] !== i) { isSolved=false; if(gameState===STATE_SOLVED)gameState=STATE_PLAYING; return; } } // Check each position
    // If loop finished, it's solved
    if (!isSolved) { console.log(">>> PUZZLE SOLVED! <<<"); } // Log only on transition
    isSolved = true; gameState = STATE_SOLVED; // Set flags/state
}

// --- Utilities ---
function swap(arr, i, j) { [arr[i], arr[j]] = [arr[j], arr[i]]; } // Simple array swap

function windowResized() {
    // Adjusts canvas and repositions elements on window resize
    resizeCanvas(windowWidth, windowHeight);
    console.log("Window resized.");
    calculateLayout(); // Recalculate positions/sizes
    positionElements(); // Reposition UI based on current state
    // No need to explicitly recreate tiles, drawing uses calculated sizes
    console.log("Window resized processed.");
}