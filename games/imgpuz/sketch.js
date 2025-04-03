// --- Global Variables ---
let gridSize = 4; // Default grid size (4x4)
const MIN_GRID_SIZE = 2;
const MAX_GRID_SIZE = 10;

let puzzleImage; // Holds the *currently active* image (default or custom)
let defaultPuzzleImage; // Specifically holds the default loaded image
const defaultImagePath = './../../ref/realtree.jpg'; // Relative path to default image

let tiles = []; // Holds p5.Image objects for each tile piece
let board = []; // 1D array representing the board state (tile indices)
let tileWidth, tileHeight; // Calculated dimensions of each tile on screen (can be fractional)
let puzzleAreaSize; // Size of the square puzzle area on screen
let puzzleX, puzzleY; // Top-left corner coordinates for centering

let isDefaultImageLoaded = false;
let isPuzzleReady = false; // True when an image is loaded AND tiles/board are ready
let isSolved = false;

// UI Elements
let gridSizeSlider;
let gridSizeLabel;
let resetButton;
let fileInput; // For custom image upload
let uploadLabel; // Label for file input

let cnv; // Canvas variable

// --- Preload ---
function preload() {
    console.log("Preloading default image from:", defaultImagePath);
    defaultPuzzleImage = loadImage(defaultImagePath,
        (img) => { // Success callback
            console.log("Default image loaded successfully.");
            puzzleImage = img; // Start with the default image
            isDefaultImageLoaded = true;
            if (gridSize > 0 && windowWidth > 0 && windowHeight > 0) {
                console.log("Preload success callback: Initializing puzzle.");
                calculateLayout();
                initializePuzzle(gridSize);
            }
        },
        (err) => { // Error callback
            console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
            console.error("Failed to load default image:", defaultImagePath, err);
            console.error("Ensure path is correct and server is running.");
            console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
            isDefaultImageLoaded = false;
            // Alert moved to setup if still not loaded
        }
    );
}

// --- Setup ---
function setup() {
    console.log("Setting up sketch...");
    cnv = createCanvas(windowWidth, windowHeight);
    cnv.style('display', 'block');

    calculateLayout(); // Calculate initial sizes and centering position

    // --- Create UI Elements ---
    let uiStartX = puzzleX; let uiWidth = puzzleAreaSize;
    let uiStartY = puzzleY + puzzleAreaSize + 20;

    gridSizeLabel = createDiv(`Grid Size: ${gridSize}x${gridSize}`);
    gridSizeLabel.style('color', 'white'); gridSizeLabel.style('font-family', 'sans-serif');
    gridSizeLabel.style('text-align', 'center'); gridSizeLabel.style('width', `${uiWidth}px`);
    gridSizeLabel.position(uiStartX, uiStartY - 20);

    let sliderWidth = uiWidth * 0.5;
    gridSizeSlider = createSlider(MIN_GRID_SIZE, MAX_GRID_SIZE, gridSize, 1);
    gridSizeSlider.style('width', `${sliderWidth}px`);
    gridSizeSlider.position(uiStartX + (uiWidth - sliderWidth) / 2, uiStartY);
    gridSizeSlider.input(handleSliderChange);

    resetButton = createButton('Shuffle / Reset');
    let buttonY = uiStartY + 30;
    resetButton.mousePressed(resetPuzzle);
    resetButton.position(uiStartX + (uiWidth - resetButton.width) / 2, buttonY);

    uploadLabel = createDiv('Upload Custom Image:');
    let fileInputY = buttonY + 40;
    uploadLabel.style('color', 'white'); uploadLabel.style('font-family', 'sans-serif');
    uploadLabel.style('text-align', 'center'); uploadLabel.style('width', `${uiWidth}px`);
    uploadLabel.position(uiStartX, fileInputY - 18);

    fileInput = createFileInput(handleFile);
    fileInput.style('color', 'white');
    // Center file input - this might be tricky as width varies
    fileInput.position(uiStartX + (uiWidth - 150) / 2, fileInputY); // Approx centering assuming default width


    // Initialize puzzle state if default image loaded in preload
    if (isDefaultImageLoaded) {
        console.log("Setup: Default image was preloaded, initializing puzzle.");
        initializePuzzle(gridSize);
    } else {
        console.warn("Setup: Default image not loaded yet. Puzzle initialization deferred.");
        isPuzzleReady = false;
        // Display persistent error if default load failed
        if (!isDefaultImageLoaded && defaultImagePath) { // Check if path was set
             alert(`Failed to load default image: ${defaultImagePath}\nCheck path/server. Puzzle might not work.`);
        }
    }

    noStroke();
    imageMode(CORNER);
    textAlign(CENTER, CENTER);
}

// --- Main Draw Loop ---
function draw() {
    background(30);

    if (!isPuzzleReady) {
        fill(200); textSize(20);
        text(isDefaultImageLoaded ? "Initializing Puzzle..." : "Loading Default Image...", width / 2, height / 2);
        return;
    }

    // --- Draw the Centered Puzzle Grid ---
    push();
    translate(puzzleX, puzzleY);

    let blankValue = gridSize * gridSize - 1;
    blank = board.indexOf(blankValue); // Keep track of blank index
    let blankCol = (blank !== -1) ? blank % gridSize : -1;
    let blankRow = (blank !== -1) ? floor(blank / gridSize) : -1;


    for (let i = 0; i < board.length; i++) {
        let tileIndex = board[i];
        if (tileIndex === blankValue) continue; // Skip blank

        let col = i % gridSize;
        let row = floor(i / gridSize);

        // --- Precise Coordinate Calculation for NO GAPS ---
        let startX = round(col * tileWidth);
        let startY = round(row * tileHeight);
        // Calculate end based on the START of the NEXT tile to ensure abutting
        let endX = round((col + 1) * tileWidth);
        let endY = round((row + 1) * tileHeight);
        // Calculate draw width/height based on the difference
        let drawW = endX - startX;
        let drawH = endY - startY;
        // --- End of Precise Calculation ---

        if (tiles && tiles.length > tileIndex && tiles[tileIndex]) {
            // Use calculated integer coordinates and dimensions
            image(tiles[tileIndex], startX, startY, drawW, drawH);
        } else { // Fallback
            fill(100, 0, 0); noStroke(); // Added noStroke here
            rect(startX, startY, drawW, drawH);
        }
    }

    // --- Draw Final Tile and Solved Overlay ---
    if (isSolved) {
        if (blankIndex !== -1 && tiles.length > blankValue && tiles[blankValue]) {
             let finalTile = tiles[blankValue];
             // Use the same precise calculation for the final tile placement
             let startX = round(blankCol * tileWidth);
             let startY = round(blankRow * tileHeight);
             let endX = round((blankCol + 1) * tileWidth);
             let endY = round((blankRow + 1) * tileHeight);
             let drawW = endX - startX;
             let drawH = endY - startY;
             image(finalTile, startX, startY, drawW, drawH);

             fill(0, 200, 0, 80); // Transparent Green Overlay
             noStroke(); // Ensure no stroke on overlay
             rect(0, 0, puzzleAreaSize, puzzleAreaSize); // Cover puzzle area exactly

             fill(255); textSize(puzzleAreaSize / 8); noStroke();
             text("SOLVED!", puzzleAreaSize / 2, puzzleAreaSize / 2);
        }
    }
    pop(); // Restore origin
}

// --- Puzzle Initialization and Logic ---

function initializePuzzle(size) {
    console.log(`Initializing puzzle for size ${size}x${size}`);
    gridSize = size; isSolved = false; isPuzzleReady = false;

    if (!puzzleImage) {
        console.error("InitializePuzzle: No puzzleImage available.");
        if (isDefaultImageLoaded) {
             console.log("Falling back to default image.");
             puzzleImage = defaultPuzzleImage;
        } else {
            alert("Error: Cannot initialize puzzle - no image loaded."); return;
        }
    }

    if (gridSizeLabel) gridSizeLabel.html(`Grid Size: ${gridSize}x${gridSize}`);
    calculateLayout(); // Recalculate layout FIRST

    board = []; let totalTiles = gridSize * gridSize;
    for (let i = 0; i < totalTiles; i++) board.push(i);

    createImageTiles(puzzleImage); // Slice current image, sets imageLoaded

    if (imageLoaded) { // Check if tile creation succeeded
        shufflePuzzle();
        checkWinCondition();
        isPuzzleReady = true; // Ready to draw!
        console.log("Puzzle initialized and ready.");
    } else {
        console.error("Puzzle initialization failed: Tiles could not be created.");
        isPuzzleReady = false; board = []; // Clear board on failure
    }
}

function resetPuzzle() {
     console.log("Resetting puzzle...");
     initializePuzzle(gridSize);
}

function calculateLayout() {
    // Centering logic (same as before)
    let safeMargin = 40; let uiSpace = 150;
    let availableWidth = windowWidth - safeMargin;
    let availableHeight = windowHeight - safeMargin - uiSpace;
    puzzleAreaSize = floor(min(availableWidth, availableHeight)); // Use floor for integer size
    puzzleX = floor((windowWidth - puzzleAreaSize) / 2);
    puzzleY = floor((windowHeight - puzzleAreaSize - uiSpace) / 2);
    // Calculate potentially fractional tile sizes
    tileWidth = puzzleAreaSize / gridSize;
    tileHeight = puzzleAreaSize / gridSize;
    console.log(`Layout: Area Size=${puzzleAreaSize}, X=${puzzleX}, Y=${puzzleY}, Tile W=${tileWidth.toFixed(3)}`);
}

function createImageTiles(img) {
    tiles = []; imageLoaded = false; // Reset

    if (!img || typeof img.get !== 'function' || !img.width || img.width <= 0) { console.error("CreateTiles: Invalid image."); return; }
    if (gridSize <= 1 || !puzzleAreaSize || puzzleAreaSize <=0) { console.error("CreateTiles: Invalid grid/area size."); return; }
    console.log(`Creating ${gridSize}x${gridSize} tiles...`);

    let allTilesCreated = true;
    let size = min(img.width, img.height); let offsetX = (img.width - size) / 2; let offsetY = (img.height - size) / 2;
    let srcTileW = size / gridSize; let srcTileH = size / gridSize;
    if (srcTileW <= 0) { console.error("CreateTiles: Invalid source tile width."); return; }

    let numTilesToCreate = gridSize * gridSize;

    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            let tileIndex = y * gridSize + x;
            try {
                let sx = floor(offsetX + x * srcTileW); let sy = floor(offsetY + y * srcTileH);
                let sw = floor(srcTileW); let sh = floor(srcTileH);
                 if (sx < 0 || sy < 0 || sw <= 0 || sh <= 0 || sx + sw > img.width + 1 || sy + sh > img.height + 1) { throw new Error(`img.get bounds error for tile ${tileIndex}`); }
                let tile = img.get(sx, sy, sw, sh);
                tiles.push(tile);
            } catch (e) {
                console.error(`Error creating tile index ${tileIndex}:`, e);
                tiles.push(null); allTilesCreated = false;
            }
        }
    }

    // We need ALL tiles for the final piece display
    if (tiles.length === numTilesToCreate && allTilesCreated) {
        imageLoaded = true; // Tile creation successful
        console.log(`Tiles created successfully (${tiles.length}). imageLoaded = true.`);
    } else {
        imageLoaded = false; // Tile creation failed
        console.error(`Failed Tiles. Count: ${tiles.length}, Needed: ${numTilesToCreate}, Errors: ${!allTilesCreated}. imageLoaded = false.`);
        alert("Error: Could not create puzzle tiles from the image.");
    }
}

function shufflePuzzle() {
    // Same shuffling logic...
    console.log("Shuffling puzzle..."); let blankValue = gridSize*gridSize - 1; let blankIndex = board.indexOf(blankValue); if (blankIndex === -1) { console.error("Shuffle err: Blank not found!"); board=[]; for(let i=0;i<gridSize*gridSize;i++) board.push(i); blankIndex = gridSize*gridSize-1;} let shuffleMoves = 100*gridSize*gridSize; let lastMove=-1; for(let i=0; i<shuffleMoves; i++){let possibleMoves=[]; if(blankIndex>=gridSize && blankIndex-gridSize!==lastMove) possibleMoves.push(blankIndex-gridSize); if(blankIndex<gridSize*gridSize-gridSize && blankIndex+gridSize!==lastMove) possibleMoves.push(blankIndex+gridSize); if(blankIndex%gridSize!==0 && blankIndex-1!==lastMove) possibleMoves.push(blankIndex-1); if(blankIndex%gridSize!==gridSize-1 && blankIndex+1!==lastMove) possibleMoves.push(blankIndex+1); if(possibleMoves.length>0){let moveIndex=random(possibleMoves); swap(board,blankIndex,moveIndex); lastMove=blankIndex; blankIndex=moveIndex;} else {lastMove=-1; i--;}} isSolved = false; console.log("Shuffle complete.");
}


// --- Input Handlers ---

function handleSliderChange() {
    let newSize = gridSizeSlider.value();
    // Only re-initialize if the size actually changed *and* we have a valid image loaded
    if (newSize !== gridSize && (isDefaultImageLoaded || puzzleImage != defaultPuzzleImage)) {
        console.log("Slider changed to:", newSize);
        initializePuzzle(newSize);
    } else if (newSize !== gridSize) {
         // Update size variable for next init, update label
         gridSize = newSize;
         if (gridSizeLabel) gridSizeLabel.html(`Grid Size: ${gridSize}x${gridSize}`);
         console.log("Slider changed, but puzzle not ready/image invalid. Size set to:", newSize);
    }
}

function handleFile(file) {
    console.log("File input changed. File info:", file); // Log the whole file object

    // --- REMOVED FAULTY TYPE CHECK ---
    // Now relies on loadImage success/failure callbacks

    console.log("Attempting to load image from file data...");
    loadImage(file.data, (newImg) => { // Success Callback
        console.log("Custom image loaded successfully from file.");
        puzzleImage = newImg; // Set the *current* image
        initializePuzzle(gridSize); // Re-initialize with new image
        if (fileInput) fileInput.value(''); // Clear the file input
    }, (err) => { // Error Callback
        console.error("Error loading image data from file:", err);
        alert("Failed to load the selected file as an image. Please try again with a valid image format (jpg, png, webp, etc.).");
        if (fileInput) fileInput.value('');
    });
}


function keyPressed() {
    // Same key logic...
     if (isSolved || !isPuzzleReady) return; let blankValue = gridSize*gridSize - 1; let blankIndex = board.indexOf(blankValue); if (blankIndex === -1) return; let targetIndex = -1; if (keyCode === UP_ARROW && blankIndex < gridSize*gridSize - gridSize) targetIndex = blankIndex + gridSize; else if (keyCode === DOWN_ARROW && blankIndex >= gridSize) targetIndex = blankIndex - gridSize; else if (keyCode === LEFT_ARROW && blankIndex % gridSize !== gridSize - 1) targetIndex = blankIndex + 1; else if (keyCode === RIGHT_ARROW && blankIndex % gridSize !== 0) targetIndex = blankIndex - 1; if (targetIndex !== -1) { swap(board, blankIndex, targetIndex); checkWinCondition(); }
}

function checkWinCondition() {
    // Same win check logic...
    let totalTiles = gridSize * gridSize; if(board.length !== totalTiles) {isSolved = false; return;} for (let i = 0; i < totalTiles; i++) { if (board[i] !== i) { isSolved = false; return; } } console.log(">>> PUZZLE SOLVED! <<<"); isSolved = true;
}

// --- Utilities ---

function swap(arr, i, j) { [arr[i], arr[j]] = [arr[j], arr[i]]; }

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    console.log("Window resized.");

    calculateLayout(); // Recalculate centering and sizes

    // --- Reposition UI Elements (checking existence) ---
    let uiStartX = puzzleX; let uiWidth = puzzleAreaSize;
    let uiStartY = puzzleY + puzzleAreaSize + 20;
    let buttonY = uiStartY + 30; let fileInputY = buttonY + 40;

    if (gridSizeLabel) { gridSizeLabel.style('width', `${uiWidth}px`); gridSizeLabel.position(uiStartX, uiStartY - 20); }
    if (gridSizeSlider) { let sliderWidth = uiWidth * 0.5; gridSizeSlider.style('width', `${sliderWidth}px`); gridSizeSlider.position(uiStartX + (uiWidth - sliderWidth) / 2, uiStartY); }
    if (resetButton) { resetButton.position(uiStartX + (uiWidth - resetButton.width) / 2, buttonY); }
    if (uploadLabel) { uploadLabel.style('width', `${uiWidth}px`); uploadLabel.position(uiStartX, fileInputY - 18); }
    if (fileInput) { fileInput.position(uiStartX + (uiWidth - 150) / 2, fileInputY); } // Approx center

    // Re-create tiles using the *current* puzzleImage if possible
    if (puzzleImage) { // Check if we have any image loaded (default or custom)
         console.log("Window resized: Re-creating image tiles from current puzzleImage.");
         createImageTiles(puzzleImage); // This sets imageLoaded
         isPuzzleReady = imageLoaded && board.length > 0; // Update ready state
    } else {
        console.log("Window resized: Not recreating tiles (no puzzleImage source).");
        isPuzzleReady = false; // Can't be ready without an image
    }
}