// --- Global Variables ---
let gridSize = 4;
const MIN_GRID_SIZE = 2;
const MAX_GRID_SIZE = 10;

// Images
let puzzleImage; // Holds the *currently active* image (default or custom)
let defaultPuzzleImage;
const defaultImagePath = './../../ref/realtree.jpg';
let isDefaultImageLoaded = false;
let puzzleImageSourceInfo = { // To store dimensions needed for source rect calculations
    img: null,
    size: 0, // size of the square crop area in original image pixels
    offsetX: 0, // offset within original image
    offsetY: 0,
    srcTileW: 0, // width of a single tile in original image pixels
    srcTileH: 0
};

// Board State
let board = []; // 1D array holding tile indices (0 to n*n-1)
let tileWidth, tileHeight; // On-screen display dimensions of a tile
let puzzleAreaSize;
let puzzleX, puzzleY;

// Game State
const STATE_SPLASH = 'splash';
const STATE_LOADING = 'loading'; // Intermediate state while processing/shuffling
const STATE_PLAYING = 'playing';
const STATE_SOLVED = 'solved'; // Added for clarity
let gameState = STATE_SPLASH; // Start at splash screen
let isPuzzleReady = false; // Combined flag: Image is valid AND board is set up
let isSolved = false;

// UI Elements
let gridSizeSlider, gridSizeLabel, resetButton, fileInput, uploadLabel; // Game UI
let splashTitle, splashText, defaultButton, uploadButton; // Splash UI

let cnv;

// --- Preload ---
function preload() {
    console.log("Preloading default image...");
    defaultPuzzleImage = loadImage(defaultImagePath,
        (img) => {
            console.log("Default image loaded successfully.");
            // Don't assign to puzzleImage yet, wait for user choice
            isDefaultImageLoaded = true;
            // If splash already passed (unlikely but possible), update button state
            if (gameState !== STATE_SPLASH && defaultButton) {
                 defaultButton.removeAttribute('disabled');
            }
        },
        (err) => {
            console.error("!!! Failed to load default image:", defaultImagePath, err);
            isDefaultImageLoaded = false;
            // Error shown later if user tries to use it
        }
    );
}

// --- Setup ---
function setup() {
    console.log("Setting up sketch...");
    cnv = createCanvas(windowWidth, windowHeight);
    cnv.style('display', 'block');
    calculateLayout(); // Calculate initial sizes for potential background drawing

    // --- Create ALL UI Elements (initially hidden/shown based on state) ---

    // Splash Screen UI
    splashTitle = createDiv("Welcome to ImgPuz");
    splashTitle.style('font-size', '32px'); splashTitle.style('color', 'white');
    splashTitle.style('text-align', 'center'); splashTitle.style('width', '100%');
    splashTitle.position(0, height * 0.3);

    splashText = createDiv("Use the default image or upload your own?");
    splashText.style('font-size', '18px'); splashText.style('color', 'lightgray');
    splashText.style('text-align', 'center'); splashText.style('width', '100%');
    splashText.position(0, height * 0.4);

    defaultButton = createButton("Use Default");
    defaultButton.position(width / 2 - 110, height * 0.5);
    defaultButton.size(100, 40);
    defaultButton.mousePressed(useDefaultImage);
    if (!isDefaultImageLoaded) defaultButton.attribute('disabled', ''); // Disable if preload failed

    uploadButton = createButton("Upload Image");
    uploadButton.position(width / 2 + 10, height * 0.5);
    uploadButton.size(100, 40);
    uploadButton.mousePressed(triggerUpload);

    // Game UI (Slider, Reset) - Create but position later in windowResized/showGameUI
    gridSizeLabel = createDiv(`Grid Size: ${gridSize}x${gridSize}`);
    gridSizeLabel.style('color', 'white'); gridSizeLabel.style('font-family', 'sans-serif');
    gridSizeLabel.style('text-align', 'center');

    gridSizeSlider = createSlider(MIN_GRID_SIZE, MAX_GRID_SIZE, gridSize, 1);
    gridSizeSlider.input(handleSliderChange);

    resetButton = createButton('Shuffle / Reset');
    resetButton.mousePressed(resetPuzzle);

    // File Input (always exists but usually hidden)
    uploadLabel = createDiv('Upload Custom Image:'); // This is part of Game UI now
    uploadLabel.style('color', 'white'); uploadLabel.style('font-family', 'sans-serif');
    uploadLabel.style('text-align', 'center');

    fileInput = createFileInput(handleFile);
    fileInput.style('color', 'white'); // Make browser's "Choose File" text visible
    fileInput.hide(); // Initially hidden, triggered by upload buttons


    // --- Initial UI State ---
    if (gameState === STATE_SPLASH) {
        showSplashUI();
        hideGameUI();
    } else { // Should not happen, but just in case
        hideSplashUI();
        showGameUI();
    }

    noStroke();
    imageMode(CORNER);
    textAlign(CENTER, CENTER);
    console.log("Setup complete. Initial state:", gameState);
}

// --- Main Draw Loop ---
function draw() {
    background(30);

    // --- State Machine ---
    switch (gameState) {
        case STATE_SPLASH:
            // Splash UI is handled by DOM elements
            // Optional: Add background animation?
            break;

        case STATE_LOADING:
            fill(200); textSize(24);
            text("Loading / Preparing Puzzle...", width / 2, height / 2);
            break;

        case STATE_PLAYING:
        case STATE_SOLVED: // Draw the board for both playing and solved states
            drawPuzzleBoard();
            break;
    }
}

// --- Splash Screen Logic ---

function showSplashUI() {
    if (splashTitle) splashTitle.show();
    if (splashText) splashText.show();
    if (defaultButton) {
        defaultButton.show();
        // Re-check if default image loaded by now
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

function useDefaultImage() {
    if (!isDefaultImageLoaded || !defaultPuzzleImage) {
        alert("Default image failed to load. Cannot continue.");
        return;
    }
    console.log("Using default image.");
    puzzleImage = defaultPuzzleImage; // Set the active image
    hideSplashUI();
    gameState = STATE_LOADING; // Show loading message briefly
    // Use setTimeout to allow the "Loading..." message to render for one frame
    setTimeout(() => {
        initializePuzzle(gridSize); // Setup board, calculate src info, shuffle
        showGameUI(); // Show slider/reset etc.
        // State transition happens inside initializePuzzle based on success
    }, 50); // Small delay
}

function triggerUpload() {
    console.log("Triggering file input click...");
    if (fileInput) {
        fileInput.elt.click(); // Programmatically click the hidden file input
    }
}

// --- Game UI Logic ---

function showGameUI() {
    if (gridSizeLabel) gridSizeLabel.show();
    if (gridSizeSlider) gridSizeSlider.show();
    if (resetButton) resetButton.show();
    if (uploadLabel) uploadLabel.show(); // Show upload label in game UI too
    if (fileInput) fileInput.show(); // Show file input in game UI
    positionGameUI(); // Ensure correct position
}

function hideGameUI() {
    if (gridSizeLabel) gridSizeLabel.hide();
    if (gridSizeSlider) gridSizeSlider.hide();
    if (resetButton) resetButton.hide();
    if (uploadLabel) uploadLabel.hide();
    if (fileInput) fileInput.hide();
}

function positionGameUI() {
    // Reposition game UI elements based on current layout
    let uiStartX = puzzleX; let uiWidth = puzzleAreaSize;
    let uiStartY = puzzleY + puzzleAreaSize + 20;
    let buttonY = uiStartY + 30; let fileInputY = buttonY + 40;

    if (gridSizeLabel) { gridSizeLabel.style('width', `${uiWidth}px`); gridSizeLabel.position(uiStartX, uiStartY - 20); }
    if (gridSizeSlider) { let sliderWidth = uiWidth * 0.5; gridSizeSlider.style('width', `${sliderWidth}px`); gridSizeSlider.position(uiStartX + (uiWidth - sliderWidth) / 2, uiStartY); }
    if (resetButton) { resetButton.position(uiStartX + (uiWidth - resetButton.width) / 2, buttonY); }
    if (uploadLabel) { uploadLabel.style('width', `${uiWidth}px`); uploadLabel.position(uiStartX, fileInputY - 18); }
    if (fileInput) { fileInput.position(uiStartX + (uiWidth - 150) / 2, fileInputY); } // Approx center file input
}


// --- Drawing the Puzzle Board --- (Called from draw() when playing/solved)
function drawPuzzleBoard() {
    if (!isPuzzleReady || !puzzleImageSourceInfo.img) return; // Need source info

    push();
    translate(puzzleX, puzzleY); // Center the drawing area

    let blankValue = gridSize * gridSize - 1;
    blank = board.indexOf(blankValue);
    let blankCol = (blank !== -1) ? blank % gridSize : -1;
    let blankRow = (blank !== -1) ? floor(blank / gridSize) : -1;

    let { img, size, offsetX, offsetY, srcTileW, srcTileH } = puzzleImageSourceInfo;

    for (let i = 0; i < board.length; i++) {
        let tileIndex = board[i]; // Which piece (0 to n*n-2) is at this board spot
        if (tileIndex === blankValue) continue;

        let boardCol = i % gridSize; // Destination column on screen
        let boardRow = floor(i / gridSize); // Destination row on screen

        // Calculate Destination coordinates (on canvas, relative to puzzleX, puzzleY)
        // Use the precise rounding method
        let dx = round(boardCol * tileWidth);
        let dy = round(boardRow * tileHeight);
        let dNextX = round((boardCol + 1) * tileWidth);
        let dNextY = round((boardRow + 1) * tileHeight);
        let dw = dNextX - dx;
        let dh = dNextY - dy;

        // Calculate Source coordinates (in the original puzzleImage)
        let srcTileCol = tileIndex % gridSize; // Which column the piece comes from
        let srcTileRow = floor(tileIndex / gridSize); // Which row the piece comes from
        let sx = floor(offsetX + srcTileCol * srcTileW);
        let sy = floor(offsetY + srcTileRow * srcTileH);
        let sw = floor(srcTileW); // Use floor, source rect can be non-integer
        let sh = floor(srcTileH);

        // Boundary checks for source rect (important!)
        if (sx < 0 || sy < 0 || sw <= 0 || sh <= 0 || sx + sw > img.width + 1 || sy + sh > img.height + 1) {
             console.error(`Source calculation error for tileIndex ${tileIndex}: sx=${sx}, sy=${sy}, sw=${sw}, sh=${sh}`);
             // Draw error rect instead
             fill(255, 0, 0); noStroke(); rect(dx, dy, dw, dh);
             continue; // Skip drawing image if source is bad
        }

        // Draw the tile using 9-argument image()
        image(img, dx, dy, dw, dh, sx, sy, sw, sh);
    }

    // --- Draw Final Tile and Solved Overlay (if solved) ---
    if (gameState === STATE_SOLVED) { // Check state explicitly
        if (blankIndex !== -1 && tiles.length >= blankValue + 1 && tiles[blankValue]) { // Check if final tile exists

             // Use the precise calculation method for the final tile placement
             let dx = round(blankCol * tileWidth);
             let dy = round(blankRow * tileHeight);
             let dNextX = round((blankCol + 1) * tileWidth);
             let dNextY = round((blankRow + 1) * tileHeight);
             let dw = dNextX - dx;
             let dh = dNextY - dy;

             // Source rect for the final piece (index blankValue)
             let srcTileCol = blankValue % gridSize;
             let srcTileRow = floor(blankValue / gridSize);
             let sx = floor(offsetX + srcTileCol * srcTileW);
             let sy = floor(offsetY + srcTileRow * srcTileH);
             let sw = floor(srcTileW);
             let sh = floor(srcTileH);

             if (!(sx < 0 || sy < 0 || sw <= 0 || sh <= 0 || sx + sw > img.width + 1 || sy + sh > img.height + 1)) {
                 image(img, dx, dy, dw, dh, sx, sy, sw, sh);
             } else {
                  console.error("Source calculation error for final tile.");
                  fill(0,0,255); noStroke(); rect(dx, dy, dw, dh); // Draw blue error tile
             }


             // Solved Overlay
             fill(0, 200, 0, 80); noStroke();
             rect(0, 0, puzzleAreaSize, puzzleAreaSize);
             fill(255); textSize(puzzleAreaSize / 8); noStroke();
             text("SOLVED!", puzzleAreaSize / 2, puzzleAreaSize / 2);
        }
    }
    pop(); // Restore origin
}

// --- Puzzle Initialization and Logic ---

function initializePuzzle(size) {
    console.log(`Initializing puzzle for size ${size}x${size}`);
    gameState = STATE_LOADING; // Set loading state during init
    isPuzzleReady = false; isSolved = false;

    if (!puzzleImage || !puzzleImage.width || puzzleImage.width <= 0) {
        console.error("InitializePuzzle: Invalid puzzleImage.");
        alert("Error: Cannot initialize puzzle - invalid image provided.");
        gameState = STATE_SPLASH; // Go back to splash on error
        showSplashUI(); hideGameUI(); return;
    }

    gridSize = size; // Ensure grid size is updated
    if (gridSizeLabel) gridSizeLabel.html(`Grid Size: ${gridSize}x${gridSize}`);
    calculateLayout(); // Recalculate layout for current size

    // Calculate source image info needed for drawing tiles directly
    // This replaces createImageTiles
    try {
        puzzleImageSourceInfo.img = puzzleImage;
        let imgSize = min(puzzleImage.width, puzzleImage.height);
        puzzleImageSourceInfo.size = imgSize;
        puzzleImageSourceInfo.offsetX = (puzzleImage.width - imgSize) / 2;
        puzzleImageSourceInfo.offsetY = (puzzleImage.height - imgSize) / 2;
        puzzleImageSourceInfo.srcTileW = imgSize / gridSize;
        puzzleImageSourceInfo.srcTileH = imgSize / gridSize;

        if (puzzleImageSourceInfo.srcTileW <= 0 || puzzleImageSourceInfo.srcTileH <= 0) {
            throw new Error("Calculated source tile dimension is zero or negative.");
        }
        console.log("Calculated source image info for direct drawing.");
    } catch (e) {
        console.error("Error calculating source image info:", e);
        alert("Error preparing image for puzzle. Cannot continue.");
        gameState = STATE_SPLASH; showSplashUI(); hideGameUI(); return;
    }


    // Setup board array
    board = []; let totalTiles = gridSize * gridSize;
    for (let i = 0; i < totalTiles; i++) board.push(i);

    // Shuffle and finalize state
    shufflePuzzle();
    checkWinCondition(); // Initial check (unlikely solved)
    isPuzzleReady = true; // Puzzle is ready
    gameState = isSolved ? STATE_SOLVED : STATE_PLAYING; // Set state based on initial check
    console.log("Puzzle initialized. Ready state:", isPuzzleReady, "Initial Game State:", gameState);
}

function resetPuzzle() {
     console.log("Resetting puzzle...");
     if (!puzzleImage) {
        alert("Cannot reset, no image is loaded."); return;
     }
     // Re-initialize using the *current* puzzle image and grid size
     // Set loading state briefly
     gameState = STATE_LOADING;
     setTimeout(() => {
         initializePuzzle(gridSize);
         // Ensure game UI is visible after reset
         if (gameState === STATE_PLAYING || gameState === STATE_SOLVED) {
             showGameUI();
         }
     }, 50);
}

function calculateLayout() {
    // Centering logic (same as before)
    let safeMargin = 40; let uiSpace = 150;
    let availableWidth = windowWidth - safeMargin; let availableHeight = windowHeight - safeMargin - uiSpace;
    puzzleAreaSize = floor(min(availableWidth, availableHeight));
    puzzleX = floor((windowWidth - puzzleAreaSize) / 2);
    puzzleY = floor((windowHeight - puzzleAreaSize - uiSpace) / 2);
    tileWidth = puzzleAreaSize / gridSize; // Keep fractional for precision
    tileHeight = puzzleAreaSize / gridSize;
    console.log(`Layout: Area Size=${puzzleAreaSize}, X=${puzzleX}, Y=${puzzleY}, Tile W=${tileWidth.toFixed(3)}`);

    // Update source info if puzzle image exists
     if (puzzleImage && puzzleImage.width > 0) {
        let imgSize = min(puzzleImage.width, puzzleImage.height);
        puzzleImageSourceInfo.size = imgSize;
        puzzleImageSourceInfo.offsetX = (puzzleImage.width - imgSize) / 2;
        puzzleImageSourceInfo.offsetY = (puzzleImage.height - imgSize) / 2;
        puzzleImageSourceInfo.srcTileW = imgSize / gridSize;
        puzzleImageSourceInfo.srcTileH = imgSize / gridSize;
     }
}

// createImageTiles function is REMOVED

function shufflePuzzle() {
    // Same shuffling logic...
    console.log("Shuffling..."); let blankValue = gridSize*gridSize - 1; let blankIndex = board.indexOf(blankValue); if (blankIndex === -1) { console.error("Shuffle err: Blank missing!"); board=[]; for(let i=0;i<gridSize*gridSize;i++) board.push(i); blankIndex = gridSize*gridSize-1;} let shuffleMoves = 100*gridSize*gridSize; let lastMove=-1; for(let i=0; i<shuffleMoves; i++){let possibleMoves=[]; if(blankIndex>=gridSize && blankIndex-gridSize!==lastMove) possibleMoves.push(blankIndex-gridSize); if(blankIndex<gridSize*gridSize-gridSize && blankIndex+gridSize!==lastMove) possibleMoves.push(blankIndex+gridSize); if(blankIndex%gridSize!==0 && blankIndex-1!==lastMove) possibleMoves.push(blankIndex-1); if(blankIndex%gridSize!==gridSize-1 && blankIndex+1!==lastMove) possibleMoves.push(blankIndex+1); if(possibleMoves.length>0){let moveIndex=random(possibleMoves); swap(board,blankIndex,moveIndex); lastMove=blankIndex; blankIndex=moveIndex;} else {lastMove=-1; i--;}} isSolved = false; console.log("Shuffle done.");
}


// --- Input Handlers ---

function handleSliderChange() {
    let newSize = gridSizeSlider.value();
    if (newSize !== gridSize && (gameState === STATE_PLAYING || gameState === STATE_SOLVED)) { // Only re-init if playing/solved
        console.log("Slider changed to:", newSize);
        // Set loading state briefly
        gameState = STATE_LOADING;
         setTimeout(() => {
             initializePuzzle(newSize);
             // Ensure game UI is visible after change
             if (gameState === STATE_PLAYING || gameState === STATE_SOLVED) {
                 showGameUI();
             }
         }, 50);
    } else if (newSize !== gridSize) {
         gridSize = newSize; // Update size for next time
         if (gridSizeLabel) gridSizeLabel.html(`Grid Size: ${gridSize}x${gridSize}`);
         console.log("Slider changed, game not active. Size set to:", newSize);
    }
}

function handleFile(file) {
    console.log("File input changed. File info:", file);

    // --- FIXED: No strict type check, rely on loadImage ---
    console.log("Attempting to load image from file data...");
    hideSplashUI(); // Hide splash if visible
    hideGameUI();   // Hide game UI during load
    gameState = STATE_LOADING; // Show loading message

    loadImage(file.data, (newImg) => { // Success Callback
        console.log("Custom image loaded successfully from file.");
        puzzleImage = newImg; // Set the *current* image
         // Use setTimeout to allow "Loading..." to render
         setTimeout(() => {
            initializePuzzle(gridSize); // Re-initialize with new image
            if (fileInput) fileInput.value(''); // Clear the file input
            // Show game UI only if initialization succeeded
            if (isPuzzleReady) {
                showGameUI();
            } else {
                // Handle case where init failed even after load success? Revert to splash?
                 gameState = STATE_SPLASH;
                 showSplashUI();
            }
        }, 50);
    }, (err) => { // Error Callback
        console.error("Error loading image data from file:", err);
        alert("Failed to load the selected file as an image. Please try again.");
        if (fileInput) fileInput.value('');
        // Go back to splash screen on error
        gameState = STATE_SPLASH;
        showSplashUI();
        hideGameUI();
    });
}


function keyPressed() {
     if (gameState !== STATE_PLAYING) return; // Only allow moves when playing

    let blankValue = gridSize*gridSize - 1; let blankIndex = board.indexOf(blankValue); if (blankIndex === -1) return;
    let targetIndex = -1;
    // Same move logic...
    if (keyCode === UP_ARROW && blankIndex < gridSize*gridSize - gridSize) targetIndex = blankIndex + gridSize;
    else if (keyCode === DOWN_ARROW && blankIndex >= gridSize) targetIndex = blankIndex - gridSize;
    else if (keyCode === LEFT_ARROW && blankIndex % gridSize !== gridSize - 1) targetIndex = blankIndex + 1;
    else if (keyCode === RIGHT_ARROW && blankIndex % gridSize !== 0) targetIndex = blankIndex - 1;
    if (targetIndex !== -1) { swap(board, blankIndex, targetIndex); checkWinCondition(); }
}

function checkWinCondition() {
    let totalTiles = gridSize * gridSize; if(board.length !== totalTiles) { isSolved = false; return; }
    for (let i = 0; i < totalTiles; i++) { if (board[i] !== i) { isSolved = false; gameState = STATE_PLAYING; return; } } // If not solved, ensure state is playing
    // If loop completes, it's solved
    if (!isSolved) { // Only log once on transition to solved
        console.log(">>> PUZZLE SOLVED! <<<");
        isSolved = true;
        gameState = STATE_SOLVED; // Set solved state
    }
}

// --- Utilities ---
function swap(arr, i, j) { [arr[i], arr[j]] = [arr[j], arr[i]]; }

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    console.log("Window resized.");
    calculateLayout(); // Recalculate centering and sizes

    // Reposition UI Elements based on state
    if (gameState === STATE_SPLASH) {
        // Reposition splash elements
        if(splashTitle) splashTitle.position(0, height * 0.3);
        if(splashText) splashText.position(0, height * 0.4);
        if(defaultButton) defaultButton.position(width / 2 - 110, height * 0.5);
        if(uploadButton) uploadButton.position(width / 2 + 10, height * 0.5);
    } else if (gameState === STATE_PLAYING || gameState === STATE_SOLVED || gameState === STATE_LOADING) {
        // Reposition game elements
        positionGameUI();
    }

    // Source info needs recalculating if image exists
     if (puzzleImage && puzzleImage.width > 0) {
         let imgSize = min(puzzleImage.width, puzzleImage.height);
         puzzleImageSourceInfo.size = imgSize;
         puzzleImageSourceInfo.offsetX = (puzzleImage.width - imgSize) / 2;
         puzzleImageSourceInfo.offsetY = (puzzleImage.height - imgSize) / 2;
         puzzleImageSourceInfo.srcTileW = imgSize / gridSize;
         puzzleImageSourceInfo.srcTileH = imgSize / gridSize;
         console.log("Window resize: Recalculated source info.");
     }

    // No need to re-create tiles anymore!
    console.log("Window resized processed.");
}