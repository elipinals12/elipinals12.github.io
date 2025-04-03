/**
 * Variable-Size Image Puzzle using p5.js
 *
 * Features:
 * - Splash screen with image choice (Default or Upload).
 * - Loads default image; allows custom uploads.
 * - Variable grid size via slider (2x2 to 10x10).
 * - Centered puzzle display and UI elements.
 * - *** Uses direct image drawing (9-argument image()) for performance. ***
 * - Precise coordinate calculation for gapless tile rendering.
 * - Timer: Starts on first move, stops and flashes on solve.
 * - Slider focus fix.
 */

// --- Constants ---
const MIN_GRID_SIZE = 2;
const MAX_GRID_SIZE = 10;
const DEFAULT_GRID_SIZE = 4;
const DEFAULT_IMAGE_PATH = './../../ref/realtree.jpg'; // Ensure this path is correct

// Game States
const STATE_SPLASH = 'splash';
const STATE_LOADING = 'loading';
const STATE_PLAYING = 'playing';
const STATE_SOLVED = 'solved';

// --- Global Variables ---

// Image Data
let puzzleImage; // Current p5.Image object
let defaultPuzzleImage;
let isDefaultImageLoaded = false;
// *** REINSTATED: Stores info for direct source image drawing ***
let puzzleImageSourceInfo = {
    img: null, size: 0, offsetX: 0, offsetY: 0, srcTileW: 0, srcTileH: 0
};

// Board State & Layout
let gridSize = DEFAULT_GRID_SIZE;
let board = [];
let tileWidth = 0;
let tileHeight = 0;
let puzzleAreaSize = 0;
let puzzleX = 0;
let puzzleY = 0;

// Game Flow & State
let gameState = STATE_SPLASH;
let isPuzzleReady = false; // True when image, source info, and board are ready
let isSolved = false;

// Timer
let timerRunning = false;
let startTime = 0;
let elapsedTime = 0;
let timerDisplayString = "0:00.00";
// Timer Flashing
let timerFlashState = true;
const TIMER_FLASH_INTERVAL = 400; // ms
let lastFlashToggle = 0;

// UI DOM Elements
let gridSizeSlider, gridSizeLabel, resetButton, fileInput, uploadLabel;
let splashTitle, splashText, defaultButton, uploadButton;
let cnv;

// --- Preload ---
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

// --- Setup ---
function setup() {
    console.log("Setting up sketch...");
    cnv = createCanvas(windowWidth, windowHeight);
    cnv.style('display', 'block');
    calculateLayout();

    createSplashUI();
    createGameUI();

    positionElements(); // Position based on initial state
    if (gameState === STATE_SPLASH) {
        showSplashUI(); hideGameUI();
        if (!isDefaultImageLoaded && defaultButton) defaultButton.attribute('disabled', '');
    } else { hideSplashUI(); showGameUI(); }

    if (!isDefaultImageLoaded && gameState === STATE_SPLASH) {
        alert(`Warning: Could not load default image "${DEFAULT_IMAGE_PATH}". Check path/server. 'Use Default' disabled.`);
    }

    noStroke(); imageMode(CORNER); textAlign(CENTER, CENTER);
    console.log("Setup complete. Initial state:", gameState);
}

// --- Main Draw Loop ---
function draw() {
    background(30);

    // Update Timer
    if (timerRunning) {
        elapsedTime = (millis() - startTime) / 1000.0;
        timerDisplayString = formatTime(elapsedTime);
    }

    // State Machine
    switch (gameState) {
        case STATE_SPLASH: break; // UI is DOM
        case STATE_LOADING:
            fill(200); textSize(24);
            text("loading puzzle...", width / 2, height / 2);
            break;
        case STATE_PLAYING:
        case STATE_SOLVED:
            if (isPuzzleReady) { // Check if initialization succeeded
                drawPuzzleBoard(); // Draw using direct method
                drawTimer();
            } else {
                fill(255, 0, 0); textSize(20);
                text("Error: Puzzle data not ready!", width / 2, height / 2);
                // Attempt re-initialization if possible? Or guide user?
                if (!puzzleImage) {
                     text("No image loaded.", width/2, height/2 + 30);
                } else {
                     text("Check console for initialization errors.", width/2, height/2 + 30);
                }
            }
            break;
    }
}

// --- UI Creation and Management ---
// (Functions createSplashUI, createGameUI, showSplashUI, hideSplashUI,
// showGameUI, hideGameUI, positionElements, positionGameUI remain the same
// - keeping code concise here)
function createSplashUI() { /* ... Creates splash title, text, buttons ... */ splashTitle=createDiv("welcome to imgpzl").style('font-size','32px').style('color','white').style('text-align','center').style('width','100%'); splashText=createDiv("use the default image or upload your own?").style('font-size','18px').style('color','lightgray').style('text-align','center').style('width','100%'); defaultButton=createButton("Use Default").size(100,40).mousePressed(useDefaultImage); uploadButton=createButton("Upload Image").size(100,40).mousePressed(triggerUpload); }
function createGameUI() { /* ... Creates slider, labels, reset, file input ... */ gridSizeLabel=createDiv(`Grid Size: ${gridSize}x${gridSize}`).style('color','white').style('font-family','sans-serif').style('text-align','center'); gridSizeSlider=createSlider(MIN_GRID_SIZE,MAX_GRID_SIZE,gridSize,1).input(handleSliderChange); resetButton=createButton('Shuffle / Reset').mousePressed(resetPuzzle); uploadLabel=createDiv('Upload New Image:').style('color','white').style('font-family','sans-serif').style('text-align','center'); fileInput=createFileInput(handleFile).style('color','white').hide(); }
function showSplashUI() { /* ... Shows splash elements, enables/disables default btn ... */ if(splashTitle)splashTitle.show(); if(splashText)splashText.show(); if(defaultButton){defaultButton.show(); if(!isDefaultImageLoaded)defaultButton.attribute('disabled',''); else defaultButton.removeAttribute('disabled');} if(uploadButton)uploadButton.show(); }
function hideSplashUI() { /* ... Hides splash elements ... */ if(splashTitle)splashTitle.hide(); if(splashText)splashText.hide(); if(defaultButton)defaultButton.hide(); if(uploadButton)uploadButton.hide(); }
function showGameUI() { /* ... Shows game elements, calls positionGameUI ... */ if(gridSizeLabel)gridSizeLabel.show(); if(gridSizeSlider)gridSizeSlider.show(); if(resetButton)resetButton.show(); if(uploadLabel)uploadLabel.show(); if(fileInput)fileInput.show(); positionGameUI(); }
function hideGameUI() { /* ... Hides game elements ... */ if(gridSizeLabel)gridSizeLabel.hide(); if(gridSizeSlider)gridSizeSlider.hide(); if(resetButton)resetButton.hide(); if(uploadLabel)uploadLabel.hide(); if(fileInput)fileInput.hide(); }
function positionElements() { /* ... Positions UI based on state ... */ calculateLayout(); if(gameState===STATE_SPLASH){if(splashTitle)splashTitle.position(0,height*0.3); if(splashText)splashText.position(0,height*0.4); if(defaultButton)defaultButton.position(width/2-110,height*0.5); if(uploadButton)uploadButton.position(width/2+10,height*0.5);}else{positionGameUI();} }
function positionGameUI() { /* ... Positions game elements below puzzle area ... */ let uiStartX=puzzleX; let uiWidth=puzzleAreaSize; let timerHeight=30; let uiStartY=puzzleY+puzzleAreaSize+10+timerHeight+10; let currentY=uiStartY; let itemHeight=25; let itemMargin=5; if(gridSizeLabel){gridSizeLabel.style('width',`${uiWidth}px`); gridSizeLabel.position(uiStartX,currentY); currentY+=itemHeight+itemMargin;} if(gridSizeSlider){let sliderWidth=uiWidth*0.5; gridSizeSlider.style('width',`${sliderWidth}px`); gridSizeSlider.position(uiStartX+(uiWidth-sliderWidth)/2,currentY); currentY+=itemHeight+itemMargin+5;} if(resetButton){resetButton.position(uiStartX+(uiWidth-resetButton.width)/2,currentY); currentY+=itemHeight+itemMargin+10;} if(uploadLabel){uploadLabel.style('width',`${uiWidth}px`); uploadLabel.position(uiStartX,currentY); currentY+=itemHeight-5;} if(fileInput){fileInput.position(uiStartX+(uiWidth-150)/2,currentY);} }


// --- State Transition and Initialization ---

function useDefaultImage() {
    // Triggered by the 'Use Default' button
    if (!isDefaultImageLoaded || !defaultPuzzleImage) {
        alert("Default image is not available (load may have failed)."); return;
    }
    console.log("Starting game with default image.");
    puzzleImage = defaultPuzzleImage; // Set active image
    startGame();
}

function triggerUpload() {
    // Triggered by the 'Upload Image' button
    console.log("Triggering file input click...");
    if (fileInput) fileInput.elt.click();
}

function startGame() {
    // Central function to transition from splash to playing
    // Assumes 'puzzleImage' is set correctly before calling
    hideSplashUI();
    gameState = STATE_LOADING; // Show loading message
    // Directly initialize - no artificial delay needed
    if (initializePuzzle(gridSize)) {
        showGameUI();
        // State (playing/solved) is set inside initializePuzzle/checkWinCondition
    } else {
        // Handle initialization failure
        gameState = STATE_SPLASH; showSplashUI(); hideGameUI();
        alert("Error: Failed to prepare puzzle from the selected image.");
    }
}

// --- Puzzle Board Drawing ---

function drawPuzzleBoard() {
    // Draws the puzzle using direct source sampling (9-arg image())
    // *** This is the reinstated direct drawing method ***
    if (!isPuzzleReady || !puzzleImageSourceInfo.img) {
        console.error("drawPuzzleBoard called when puzzle not ready or source info missing.");
        // Draw an error message on the canvas might be helpful
        push();
        translate(puzzleX, puzzleY);
        fill(100); rect(0, 0, puzzleAreaSize, puzzleAreaSize);
        fill(255, 0, 0); textSize(20);
        text("Error: Cannot draw puzzle", puzzleAreaSize / 2, puzzleAreaSize / 2);
        pop();
        return;
    }

    push(); // Isolate transformations
    translate(puzzleX, puzzleY); // Move origin

    let blankValue = gridSize * gridSize - 1;
    let blankIndex = board.indexOf(blankValue);
    let blankCol = (blankIndex !== -1) ? blankIndex % gridSize : -1;
    let blankRow = (blankIndex !== -1) ? floor(blankIndex / gridSize) : -1;

    // Get source info calculated during initializePuzzle
    let { img, size, offsetX, offsetY, srcTileW, srcTileH } = puzzleImageSourceInfo;

    // Loop through each board position
    for (let i = 0; i < board.length; i++) {
        let tileIndex = board[i]; // The piece index (0..n*n-1) at this board spot
        if (tileIndex === blankValue) continue; // Skip blank

        let boardCol = i % gridSize; let boardRow = floor(i / gridSize);

        // Calculate precise Destination rect (dx, dy, dw, dh)
        let dx = round(boardCol * tileWidth); let dy = round(boardRow * tileHeight);
        let dNextX = round((boardCol + 1) * tileWidth); let dNextY = round((boardRow + 1) * tileHeight);
        let dw = dNextX - dx; let dh = dNextY - dy;

        // Calculate Source rect (sx, sy, sw, sh)
        let srcTileCol = tileIndex % gridSize; let srcTileRow = floor(tileIndex / gridSize);
        let sx = floor(offsetX + srcTileCol * srcTileW); let sy = floor(offsetY + srcTileRow * srcTileH);
        let sw = floor(srcTileW); let sh = floor(srcTileH);

        // Validate source rect
        if (sx < 0 || sy < 0 || sw <= 0 || sh <= 0 || sx + sw > img.width + 1 || sy + sh > img.height + 1) {
             console.error(`Invalid source rect for tile ${tileIndex}`); fill(255,0,0); noStroke(); rect(dx,dy,dw,dh); continue;
        }
        // Draw the tile using 9-argument image()
        image(img, dx, dy, dw, dh, sx, sy, sw, sh);
    }

    // Draw final tile and overlay if solved
    if (gameState === STATE_SOLVED && blankIndex !== -1) {
        let dx = round(blankCol * tileWidth); let dy = round(blankRow * tileHeight);
        let dNextX = round((blankCol + 1) * tileWidth); let dNextY = round((blankRow + 1) * tileHeight);
        let dw = dNextX - dx; let dh = dNextY - dy;
        let srcTileCol = blankValue % gridSize; let srcTileRow = floor(blankValue / gridSize);
        let sx = floor(offsetX + srcTileCol * srcTileW); let sy = floor(offsetY + srcTileRow * srcTileH);
        let sw = floor(srcTileW); let sh = floor(srcTileH);

        if (!(sx < 0 || sy < 0 || sw <= 0 || sh <= 0 || sx + sw > img.width + 1 || sy + sh > img.height + 1)) {
            image(img, dx, dy, dw, dh, sx, sy, sw, sh); // Draw final piece
        } else { console.error("Invalid source rect for final tile."); fill(0,0,255); noStroke(); rect(dx,dy,dw,dh); }

        // Solved Overlay
        fill(0, 200, 0, 80); noStroke(); rect(0, 0, puzzleAreaSize, puzzleAreaSize);
        fill(255); textSize(puzzleAreaSize / 8); noStroke(); text("SOLVED!", puzzleAreaSize / 2, puzzleAreaSize / 2);
    }
    pop(); // Restore origin
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
            timerFlashState = !timerFlashState; // Toggle
            lastFlashToggle = now;
        }
        fill(0, 255, 0, timerFlashState ? 255 : 100); // Flash alpha
    } else {
        fill(0, 255, 0, 255); // Solid green
    }
    text(timerDisplayString, timerX, timerY); // Display the time
}


// --- Puzzle Initialization and Core Logic ---

function initializePuzzle(size) {
    // Prepares board, calculates source image info, resets timer, shuffles.
    // *** This version calculates source info but DOES NOT pre-slice tiles ***
    // Returns true on success, false on failure.
    console.log(`Initializing puzzle core size ${size}x${size}`);
    isPuzzleReady = false; isSolved = false; // Reset flags

    if (!puzzleImage || !puzzleImage.width || puzzleImage.width <= 0) {
        console.error("InitializePuzzle Error: Invalid puzzleImage."); return false;
    }

    gridSize = size;
    if (gridSizeLabel) gridSizeLabel.html(`Grid Size: ${gridSize}x${gridSize}`);
    calculateLayout(); // Recalculate layout first

    // --- Calculate and store source image parameters ---
    // This replaces the need for createImageTiles
    try {
        puzzleImageSourceInfo.img = puzzleImage; // Store ref to current image
        let imgSize = min(puzzleImage.width, puzzleImage.height); // Size of square crop area
        puzzleImageSourceInfo.size = imgSize;
        puzzleImageSourceInfo.offsetX = (puzzleImage.width - imgSize) / 2; // Top-left X of crop
        puzzleImageSourceInfo.offsetY = (puzzleImage.height - imgSize) / 2; // Top-left Y of crop
        puzzleImageSourceInfo.srcTileW = imgSize / gridSize; // Width of one tile in source img
        puzzleImageSourceInfo.srcTileH = imgSize / gridSize; // Height of one tile in source img
        // Basic validation
        if (puzzleImageSourceInfo.srcTileW <= 0 || puzzleImageSourceInfo.srcTileH <= 0) {
            throw new Error("Calculated source tile dimension is zero or negative.");
        }
        console.log("Calculated source image info for direct drawing.");
    } catch (e) {
        console.error("Error calculating source image info:", e);
        puzzleImageSourceInfo.img = null; // Invalidate source info on error
        return false; // Indicate initialization failure
    }

    // Setup board array in solved state
    board = []; let totalTiles = gridSize * gridSize;
    for (let i = 0; i < totalTiles; i++) { board.push(i); }

    // Reset Timer
    timerRunning = false; elapsedTime = 0; startTime = 0;
    timerDisplayString = formatTime(0); timerFlashState = true; lastFlashToggle = 0;

    // Shuffle the board
    shufflePuzzle();
    // Set initial solved state and game state
    checkWinCondition();
    isPuzzleReady = true; // Mark as ready (source info is calc'd, board shuffled)
    console.log("Puzzle core initialized. Ready:", isPuzzleReady, "State:", gameState);
    return true; // Indicate success
}

function resetPuzzle() {
     // Resets and shuffles using current settings
     console.log("Resetting puzzle...");
     if (!puzzleImage) { alert("Cannot reset, no image loaded."); return; }
     gameState = STATE_LOADING;
     // No timeout needed
     if (initializePuzzle(gridSize)) { showGameUI(); }
     else { gameState = STATE_SPLASH; showSplashUI(); hideGameUI(); alert("Error re-initializing puzzle.");}
}

function calculateLayout() {
    // Calculates centered puzzle position and tile dimensions
    let safeMargin = 30; let uiSpace = 180; // Adjusted spacing
    let availableWidth = windowWidth - safeMargin; let availableHeight = windowHeight - safeMargin - uiSpace;
    puzzleAreaSize = floor(min(availableWidth, availableHeight));
    puzzleX = floor((windowWidth - puzzleAreaSize) / 2);
    puzzleY = floor((windowHeight - puzzleAreaSize - uiSpace) / 2);
    if (gridSize > 0) { tileWidth = puzzleAreaSize / gridSize; tileHeight = puzzleAreaSize / gridSize; }
    else { tileWidth = 0; tileHeight = 0; }
    console.log(`Layout Updated: Area=${puzzleAreaSize}px @ (${puzzleX},${puzzleY}), TileW=${tileWidth.toFixed(3)}px`);

    // Update cached source info if possible (needed by draw loop)
     if (puzzleImage && puzzleImage.width > 0 && gridSize > 0) {
         try {
             puzzleImageSourceInfo.img = puzzleImage; // Ensure correct ref
             let imgSize = min(puzzleImage.width, puzzleImage.height);
             puzzleImageSourceInfo.size = imgSize;
             puzzleImageSourceInfo.offsetX = (puzzleImage.width - imgSize) / 2;
             puzzleImageSourceInfo.offsetY = (puzzleImage.height - imgSize) / 2;
             puzzleImageSourceInfo.srcTileW = imgSize / gridSize;
             puzzleImageSourceInfo.srcTileH = imgSize / gridSize;
             if (puzzleImageSourceInfo.srcTileW <= 0) { throw new Error("Invalid src tile width on layout calc."); }
         } catch (e) { console.error("Error recalculating source info on layout:", e); isPuzzleReady=false; puzzleImageSourceInfo.img=null; }
     } else { puzzleImageSourceInfo.img = null; } // Invalidate if no image/grid
}

// --- Removed createImageTiles function ---

function shufflePuzzle() {
    // Shuffles the 'board' array using random valid moves
    console.log("Shuffling board...");
    let blankValue = gridSize*gridSize - 1; let blankIndex = board.indexOf(blankValue);
    if (blankIndex === -1) { console.error("Shuffle Err: Blank!"); board=[]; let tt=gridSize*gridSize; for(let i=0;i<tt;i++) board.push(i); blankIndex = tt-1; if (board.length===0 || board[blankIndex]!==blankValue) { console.error("Cannot recover board state!"); return; } }
    let shuffleMoves = 150 * gridSize * gridSize; let lastMoveSource = -1;
    for (let i=0; i<shuffleMoves; i++){let pm=[]; let a=blankIndex-gridSize, b=blankIndex+gridSize, l=blankIndex-1, r=blankIndex+1; if(blankIndex>=gridSize && a!==lastMoveSource) pm.push(a); if(blankIndex<gridSize*gridSize-gridSize && b!==lastMoveSource) pm.push(b); if(blankIndex%gridSize!==0 && l!==lastMoveSource) pm.push(l); if(blankIndex%gridSize!==gridSize-1 && r!==lastMoveSource) pm.push(r); if(pm.length > 0){let mi=random(pm); swap(board, blankIndex, mi); lastMoveSource=blankIndex; blankIndex=mi;} else {lastMoveSource=-1; i--;}}
    isSolved = false; console.log("Shuffle complete.");
}


// --- Input Handlers ---

function handleSliderChange() {
    // Triggered by the grid size slider
    let newSize = gridSizeSlider.value();
    if (newSize !== gridSize && (gameState === STATE_PLAYING || gameState === STATE_SOLVED)) {
        console.log("Slider changed to:", newSize);
        gameState = STATE_LOADING;
        // No timeout needed
        if (initializePuzzle(newSize)) { showGameUI(); }
        else { gameState = STATE_SPLASH; showSplashUI(); hideGameUI(); alert("Error changing grid size."); }
    } else if (newSize !== gridSize) { // If game inactive, just update var and label
         gridSize = newSize; if (gridSizeLabel) gridSizeLabel.html(`Grid Size: ${gridSize}x${gridSize}`);
         console.log("Slider changed while inactive. Size set to:", newSize);
    }
}

function handleFile(file) {
    // Triggered when file selected via createFileInput
    console.log("File input changed:", file);
    console.log("Attempting to load image from file data...");
    hideSplashUI(); hideGameUI(); gameState = STATE_LOADING;

    loadImage(file.data,
        (newImg) => { // Success
            console.log("Custom image loaded.");
            puzzleImage = newImg; // Set as current image
            // No timeout needed
            if (initializePuzzle(gridSize)) { // Initialize with new image
                showGameUI();
            } else { // Handle init failure
                gameState = STATE_SPLASH; showSplashUI(); hideGameUI();
                alert("Error preparing puzzle from uploaded image.");
            }
            if (fileInput) fileInput.value(''); // Clear input
        },
        (err) => { // Error
            console.error("Error loading file as image:", err);
            alert("Failed to load file. Use JPG, PNG, GIF, WebP etc.");
            if (fileInput) fileInput.value('');
            gameState = STATE_SPLASH; showSplashUI(); hideGameUI(); // Revert on failure
        }
    );
}

function keyPressed() {
    // Handles tile movement via arrow keys and starts timer
    if (gameState !== STATE_PLAYING) return;

    let blankValue = gridSize * gridSize - 1;
    let blankIndex = board.indexOf(blankValue);
    if (blankIndex === -1) return;

    let targetIndex = -1; // Index of tile to swap with blank
    if (keyCode === UP_ARROW && blankIndex < gridSize*gridSize - gridSize) targetIndex = blankIndex + gridSize;
    else if (keyCode === DOWN_ARROW && blankIndex >= gridSize) targetIndex = blankIndex - gridSize;
    else if (keyCode === LEFT_ARROW && blankIndex % gridSize !== gridSize - 1) targetIndex = blankIndex + 1;
    else if (keyCode === RIGHT_ARROW && blankIndex % gridSize !== 0) targetIndex = blankIndex - 1;

    // If a valid move was identified
    if (targetIndex !== -1) {
        // Start Timer only on the very first valid move
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

function checkWinCondition() {
    // Checks if solved, updates state, stops timer
    let totalTiles = gridSize * gridSize; if(board.length !== totalTiles) { isSolved=false; if(gameState===STATE_SOLVED)gameState=STATE_PLAYING; return; }
    for (let i = 0; i < totalTiles; i++) { if (board[i] !== i) { isSolved=false; if(gameState===STATE_SOLVED)gameState=STATE_PLAYING; return; } }
    // If solved:
    if (!isSolved) { console.log(">>> PUZZLE SOLVED! <<<"); timerRunning = false; lastFlashToggle = millis(); timerFlashState = true; } // Stop timer, init flash
    isSolved = true; gameState = STATE_SOLVED;
}

// --- Utilities ---

function formatTime(seconds) {
    // Formats seconds into M:SS.ss
    let mins = floor(seconds / 60);
    let secs = floor(seconds) % 60;
    let hund = floor((seconds * 100) % 100);
    return `${nf(mins, 1)}:${nf(secs, 2, 0)}.${nf(hund, 2, 0)}`;
}

function swap(arr, i, j) {
    // Swaps array elements
    [arr[i], arr[j]] = [arr[j], arr[i]];
}

function windowResized() {
    // Handles window resize event
    resizeCanvas(windowWidth, windowHeight);
    console.log("Window resized.");
    calculateLayout(); // Recalculate layout (updates puzzleImageSourceInfo too)
    positionElements(); // Reposition UI based on state
    // No need to explicitly recreate tiles with direct drawing method
    console.log("Window resized processed.");
}