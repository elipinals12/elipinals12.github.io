/**
 * Variable-Size Image Puzzle using p5.js
 *
 * Features:
 * - Splash screen with image choice (Default or Upload).
 * - Loads a default image; allows custom image uploads.
 * - Variable grid size via slider (2x2 to 10x10).
 * - Centered puzzle display and UI elements.
 * - *** Uses pre-slicing (img.get) stored in 'tiles' array for reliable rendering. ***
 * - Precise coordinate calculation for gapless tile rendering (destination).
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
// *** REINSTATED: Array to hold pre-sliced tile images ***
let tiles = [];

// Board State & Layout
let gridSize = DEFAULT_GRID_SIZE;
let board = []; // 1D array storing tile indices (0 to n*n-1, where n*n-1 is blank)
let tileWidth = 0; // On-screen display width of a tile (can be fractional)
let tileHeight = 0;
let puzzleAreaSize = 0; // Pixel dimension of the square puzzle area
let puzzleX = 0; // Top-left X coordinate of the puzzle area
let puzzleY = 0;

// Game Flow & State
let gameState = STATE_SPLASH; // Initial state
let isPuzzleReady = false; // True when image is loaded AND tiles/board are ready
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
            console.log("Default image loaded.");
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
            text("loading puzzle...", width / 2, height / 2); // Lowercase text
            break;
        case STATE_PLAYING:
        case STATE_SOLVED:
            if (isPuzzleReady) {
                drawPuzzleBoard(); // Draw the board using pre-sliced tiles
                drawTimer();     // Draw the timer
            } else {
                fill(255, 0, 0); textSize(20);
                text("Error: Puzzle data not ready!", width / 2, height / 2);
            }
            break;
    }
}

// --- UI Creation and Management ---
// (Functions createSplashUI, createGameUI, showSplashUI, hideSplashUI,
// showGameUI, hideGameUI, positionElements, positionGameUI remain the same
// as the previous correctly formatted version - keeping code concise here)
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
    puzzleImage = defaultPuzzleImage;
    startGame();
}

function triggerUpload() {
    // Triggered by the 'Upload Image' button
    console.log("Triggering file input click...");
    if (fileInput) fileInput.elt.click();
}

function startGame() {
    // Central function to transition from splash to playing
    hideSplashUI();
    gameState = STATE_LOADING; // Show loading message
    // Directly initialize - the splash screen hides this process
    if (initializePuzzle(gridSize)) {
        showGameUI();
        // State (playing/solved) is set within initializePuzzle/checkWinCondition
    } else {
        // Handle initialization failure
        gameState = STATE_SPLASH; showSplashUI(); hideGameUI();
        alert("Error: Failed to prepare puzzle from the selected image.");
    }
}

// --- Puzzle Board Drawing ---

function drawPuzzleBoard() {
    // Draws the puzzle using the pre-sliced images in the 'tiles' array
    // *** This is the reinstated pre-slicing drawing method ***
    if (!isPuzzleReady || tiles.length === 0) { // Check if tiles array is populated
        console.error("drawPuzzleBoard called when puzzle not ready or tiles missing.");
        push(); translate(puzzleX, puzzleY); fill(100); rect(0,0,puzzleAreaSize,puzzleAreaSize);
        fill(255,0,0); textSize(20); text("Error drawing puzzle (tiles missing)", puzzleAreaSize/2, puzzleAreaSize/2); pop();
        return;
    }

    push(); // Isolate transformations
    translate(puzzleX, puzzleY); // Move to puzzle area origin

    let blankValue = gridSize * gridSize - 1;
    let blankIndex = board.indexOf(blankValue);
    let blankCol = (blankIndex !== -1) ? blankIndex % gridSize : -1;
    let blankRow = (blankIndex !== -1) ? floor(blankIndex / gridSize) : -1;

    // Loop through each position on the board
    for (let i = 0; i < board.length; i++) {
        let tileIndex = board[i]; // The index (0..n*n-1) of the piece at this board spot
        if (tileIndex === blankValue) continue; // Skip drawing the blank spot

        // Get the pre-sliced image for this tile index
        // Ensure tileIndex is valid before accessing tiles array
        if (tileIndex < 0 || tileIndex >= tiles.length) {
             console.error(`Invalid tileIndex ${tileIndex} found in board at position ${i}`);
             continue;
        }
        let tileImage = tiles[tileIndex];

        if (tileImage) { // Check if the tile image exists and is valid
            let boardCol = i % gridSize; let boardRow = floor(i / gridSize);

            // Calculate precise integer Destination coordinates/dimensions
            let dx = round(boardCol * tileWidth); let dy = round(boardRow * tileHeight);
            let dNextX = round((boardCol + 1) * tileWidth); let dNextY = round((boardRow + 1) * tileHeight);
            let dw = dNextX - dx; let dh = dNextY - dy;

            // Draw the pre-sliced tile image using 5-argument image()
            image(tileImage, dx, dy, dw, dh);
        } else {
            // Draw error indicator if a tile is missing/null
             let boardCol = i % gridSize; let boardRow = floor(i / gridSize);
             let dx = round(boardCol * tileWidth); let dy = round(boardRow * tileHeight);
             let dNextX = round((boardCol + 1) * tileWidth); let dNextY = round((boardRow + 1) * tileHeight);
             let dw = dNextX - dx; let dh = dNextY - dy;
            console.error(`Missing or invalid tile image object for index ${tileIndex}`);
            fill(255, 0, 0); noStroke(); rect(dx, dy, dw, dh);
        }
    }

    // --- Draw Final Tile and Solved Overlay (if solved) ---
    if (gameState === STATE_SOLVED && blankIndex !== -1) {
        let finalTileIndex = blankValue; // The index of the last piece
        // Check if the final tile image exists in the array
        if (tiles && tiles.length > finalTileIndex && tiles[finalTileIndex]) {
            let finalTileImage = tiles[finalTileIndex];
            // Calculate precise destination for the blank spot
            let dx = round(blankCol * tileWidth); let dy = round(blankRow * tileHeight);
            let dNextX = round((blankCol + 1) * tileWidth); let dNextY = round((blankRow + 1) * tileHeight);
            let dw = dNextX - dx; let dh = dNextY - dy;

            // Draw the final piece
            image(finalTileImage, dx, dy, dw, dh);
        } else {
             console.error("Missing final tile image for solved state (index " + finalTileIndex + ").");
             let dx = round(blankCol * tileWidth); let dy = round(blankRow * tileHeight);
             let dNextX = round((blankCol + 1) * tileWidth); let dNextY = round((blankRow + 1) * tileHeight);
             let dw = dNextX - dx; let dh = dNextY - dy;
             fill(0,0,255); noStroke(); rect(dx,dy,dw,dh); // Error indicator
        }

        // Draw transparent green solved overlay
        fill(0, 200, 0, 80); noStroke();
        rect(0, 0, puzzleAreaSize, puzzleAreaSize);

        // Draw "SOLVED!" text
        fill(255); textSize(puzzleAreaSize / 8); noStroke();
        text("SOLVED!", puzzleAreaSize / 2, puzzleAreaSize / 2);
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
    // Prepares board, slices tiles using get(), resets timer, shuffles. Returns T/F.
    // *** This version uses createImageTiles (pre-slicing) ***
    console.log(`Initializing puzzle core size ${size}x${size}`);
    isPuzzleReady = false; isSolved = false; // Reset flags

    if (!puzzleImage || !puzzleImage.width || puzzleImage.width <= 0) {
        console.error("InitializePuzzle Error: Invalid puzzleImage."); return false;
    }

    gridSize = size;
    if (gridSizeLabel) gridSizeLabel.html(`Grid Size: ${gridSize}x${gridSize}`);
    calculateLayout(); // Recalculate layout for current grid size

    // --- Slice image into tiles ---
    // This calls the function which populates the global 'tiles' array
    if (!createImageTiles(puzzleImage)) { // Check return value
        console.error("InitializePuzzle Error: Failed to create image tiles.");
        tiles = []; // Ensure tiles array is empty on failure
        return false; // Indicate failure
    }
    // If createImageTiles succeeded, the global 'tiles' array is ready

    // Setup board in solved state
    board = []; let totalTiles = gridSize * gridSize;
    for (let i = 0; i < totalTiles; i++) { board.push(i); }

    // Reset Timer
    timerRunning = false; elapsedTime = 0; startTime = 0;
    timerDisplayString = formatTime(0); timerFlashState = true; lastFlashToggle = 0;

    // Shuffle and finalize state
    shufflePuzzle();
    checkWinCondition(); // Sets isSolved and gameState
    isPuzzleReady = true; // Mark as ready (tiles sliced, board shuffled)
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
    // No need to calculate source info cache in this version
}

// *** REINSTATED createImageTiles function ***
function createImageTiles(img) {
    // Slices the input image into gridSize * gridSize tiles stored in the global 'tiles' array.
    // Uses img.get(), which can be slow for large images/grids.
    // Returns true on success, false on failure.
    tiles = []; // Clear existing tiles

    if (!img || typeof img.get !== 'function' || !img.width || img.width <= 0) {
        console.error("CreateTiles Error: Invalid image object."); return false;
    }
    if (gridSize <= 1 || !puzzleAreaSize || puzzleAreaSize <= 0) {
        console.error("CreateTiles Error: Invalid grid size or puzzle area."); return false;
    }
    console.log(`Slicing image into ${gridSize}x${gridSize} tiles... (This may take time)`);

    let allTilesCreated = true;
    // Calculate source rect based on centered square crop of the image
    let size = min(img.width, img.height);
    let offsetX = (img.width - size) / 2;
    let offsetY = (img.height - size) / 2;
    let srcTileW = size / gridSize;
    let srcTileH = size / gridSize;

    if (srcTileW <= 0 || srcTileH <= 0) {
        console.error("CreateTiles Error: Calculated source tile size is invalid."); return false;
    }

    let numTilesToCreate = gridSize * gridSize; // Need all pieces

    // Loop through grid and extract each tile using get()
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            let tileIndex = y * gridSize + x;

            try {
                let sx = floor(offsetX + x * srcTileW);
                let sy = floor(offsetY + y * srcTileH);
                let sw = floor(srcTileW);
                let sh = floor(srcTileH);

                // Validate source rect coordinates
                if (sx < 0 || sy < 0 || sw <= 0 || sh <= 0 || sx + sw > img.width + 1 || sy + sh > img.height + 1) {
                    throw new Error(`img.get() parameters out of bounds for tile ${tileIndex}`);
                }

                let tile = img.get(sx, sy, sw, sh); // The potentially slow operation
                tiles.push(tile); // Add the new p5.Image object to the array
            } catch (e) {
                console.error(`Error using img.get() for tile index ${tileIndex}:`, e);
                tiles.push(null); // Add null placeholder on error
                allTilesCreated = false; // Mark that slicing failed for at least one tile
            }
        }
    }

    // Check if the correct number of tiles were generated AND no errors occurred
    if (tiles.length === numTilesToCreate && allTilesCreated) {
        console.log(`Tiles sliced successfully (${tiles.length}).`);
        return true; // Slicing succeeded
    } else {
        console.error(`Failed to slice all tiles successfully. Count: ${tiles.length}, Needed: ${numTilesToCreate}, Errors: ${!allTilesCreated}.`);
        tiles = []; // Clear partial/failed tiles
        return false; // Slicing failed
    }
}


function shufflePuzzle() {
    // Shuffles the 'board' array using random valid moves
    console.log("Shuffling board...");
    let blankValue = gridSize*gridSize - 1; let blankIndex = board.indexOf(blankValue);
    if (blankIndex === -1) { console.error("Shuffle Err: Blank!"); board=[]; let tt=gridSize*gridSize; for(let i=0;i<tt;i++) board.push(i); blankIndex = tt-1; if (board.length===0 || board[blankIndex]!==blankValue) { console.error("Cannot recover board!"); return; } }
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
    } else if (newSize !== gridSize) {
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
            if (initializePuzzle(gridSize)) { showGameUI(); } // Initialize with new image
            else { gameState = STATE_SPLASH; showSplashUI(); hideGameUI(); alert("Error preparing puzzle from uploaded image."); }
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
    // Handles window resize
    resizeCanvas(windowWidth, windowHeight);
    console.log("Window resized.");
    calculateLayout(); // Recalculate layout
    positionElements(); // Reposition UI

    // --- Re-slice tiles on resize if puzzle is active ---
    if (puzzleImage && (gameState === STATE_PLAYING || gameState === STATE_SOLVED)) {
         console.log("Window resize: Re-slicing tiles for new dimensions...");
         // Re-run the tile slicing process
         if (!createImageTiles(puzzleImage)) {
              console.error("Failed to re-slice tiles after resize!");
              // Handle error: Mark as not ready, maybe revert to splash?
              isPuzzleReady = false;
              gameState = STATE_SPLASH;
              showSplashUI(); hideGameUI();
              alert("Error resizing puzzle tiles.");
         } else {
             // If slicing succeeded, ensure puzzle is marked ready
             isPuzzleReady = true;
         }
    }
    console.log("Window resized processed.");
}