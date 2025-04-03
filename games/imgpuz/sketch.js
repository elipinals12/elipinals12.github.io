// --- Global Variables ---
let gridSize = 4; // Default grid size (4x4)
const MIN_GRID_SIZE = 2;
const MAX_GRID_SIZE = 10;

let puzzleImage; // Holds the *currently active* image (default or custom)
let defaultPuzzleImage; // Specifically holds the default loaded image
const defaultImagePath = './../../ref/realtree.jpg'; // Relative path to default image

let tiles = []; // Holds p5.Image objects for each tile piece
let board = []; // 1D array representing the board state (tile indices)
let tileWidth, tileHeight; // Dimensions of each tile on screen
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
            // If setup already ran, initialize now
            if (gridSize > 0 && windowWidth > 0 && windowHeight > 0) { // Check if layout likely calculated
                console.log("Preload success callback: Initializing puzzle.");
                calculateLayout(); // Ensure layout is up-to-date
                initializePuzzle(gridSize);
            }
        },
        (err) => { // Error callback
            console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
            console.error("Failed to load default image:", defaultImagePath, err);
            console.error("Ensure path is correct and server is running.");
            console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
            isDefaultImageLoaded = false;
            alert(`Failed to load default image: ${defaultImagePath}\nCheck path/server. Puzzle might not work.`);
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
    // Place UI below the puzzle area
    let uiStartX = puzzleX; // Align UI start with puzzle start X
    let uiWidth = puzzleAreaSize; // Make UI width same as puzzle width
    let uiStartY = puzzleY + puzzleAreaSize + 20;

    // Grid Size Slider
    let sliderWidth = uiWidth * 0.5; // Adjust as needed
    gridSizeSlider = createSlider(MIN_GRID_SIZE, MAX_GRID_SIZE, gridSize, 1);
    gridSizeSlider.style('width', `${sliderWidth}px`);
    // Center slider horizontally within the puzzle area width
    gridSizeSlider.position(uiStartX + (uiWidth - sliderWidth) / 2, uiStartY);
    gridSizeSlider.input(handleSliderChange);

    // Label for Slider (positioned above slider)
    gridSizeLabel = createDiv(`Grid Size: ${gridSize}x${gridSize}`);
    gridSizeLabel.style('color', 'white');
    gridSizeLabel.style('font-family', 'sans-serif');
    gridSizeLabel.style('text-align', 'center');
    gridSizeLabel.style('width', `${uiWidth}px`); // Span puzzle width
    gridSizeLabel.position(uiStartX, uiStartY - 20); // Position above slider

    // Reset Button (positioned below slider)
    resetButton = createButton('Shuffle / Reset');
    let buttonY = uiStartY + 30;
    resetButton.mousePressed(resetPuzzle);
    // Center button horizontally
    resetButton.position(uiStartX + (uiWidth - resetButton.width) / 2, buttonY);

    // File Input for Custom Image (positioned below reset button)
    fileInput = createFileInput(handleFile);
    let fileInputY = buttonY + 40;
    fileInput.style('color', 'white'); // Make the text visible
    // Center file input horizontally
    fileInput.position(uiStartX + (uiWidth - fileInput.width) / 2, fileInputY);

    // Label for file input
    uploadLabel = createDiv('Upload Custom Image:');
    uploadLabel.style('color', 'white');
    uploadLabel.style('font-family', 'sans-serif');
    uploadLabel.style('text-align', 'center');
    uploadLabel.style('width', `${uiWidth}px`);
    uploadLabel.position(uiStartX, fileInputY - 18); // Position above file input


    // Initialize puzzle state if default image loaded in preload
    if (isDefaultImageLoaded) {
        console.log("Setup: Default image was preloaded, initializing puzzle.");
        initializePuzzle(gridSize);
    } else {
        console.warn("Setup: Default image not loaded yet. Puzzle initialization deferred.");
        isPuzzleReady = false;
    }

    noStroke();
    imageMode(CORNER);
    textAlign(CENTER, CENTER); // Set default text alignment
}

// --- Main Draw Loop ---
function draw() {
    background(30); // Dark background

    // Wait until puzzle is ready (image loaded AND tiles/board created)
    if (!isPuzzleReady) {
        fill(200); textSize(20);
        text(isDefaultImageLoaded ? "Initializing Puzzle..." : "Loading Default Image...", width / 2, height / 2);
        return; // Don't draw puzzle yet
    }

    // --- Draw the Centered Puzzle Grid ---
    push(); // Isolate drawing to the puzzle area
    translate(puzzleX, puzzleY); // Move origin to top-left of puzzle area

    let blankValue = gridSize * gridSize - 1; // Value for blank space

    for (let i = 0; i < board.length; i++) {
        let tileIndex = board[i];
        let col = i % gridSize;
        let row = floor(i / gridSize);
        let x = col * tileWidth;
        let y = row * tileHeight;

        if (tileIndex === blankValue) continue; // Skip drawing blank

        // Draw the image tile piece
        if (tiles && tiles.length > tileIndex && tiles[tileIndex]) {
            image(tiles[tileIndex], x, y, tileWidth, tileHeight);
        } else { // Fallback for missing tile
            fill(100, 0, 0); rect(x, y, tileWidth, tileHeight);
        }
    }

    // --- Draw Final Tile and Solved Overlay ---
    if (isSolved) {
        let blankIndex = board.indexOf(blankValue);
        if (blankIndex !== -1 && tiles.length > blankValue && tiles[blankValue]) {
             let finalTile = tiles[blankValue];
             let col = blankIndex % gridSize; let row = floor(blankIndex / gridSize);
             image(finalTile, col * tileWidth, row * tileHeight, tileWidth, tileHeight);

             // --- More Transparent Green Overlay ---
             fill(0, 200, 0, 80); // Green with alpha 80
             rect(0, 0, puzzleAreaSize, puzzleAreaSize); // Cover puzzle area

             fill(255); textSize(puzzleAreaSize / 8);
             text("SOLVED!", puzzleAreaSize / 2, puzzleAreaSize / 2);
        }
    }
    pop(); // Restore original drawing origin
}

// --- Puzzle Initialization and Logic ---

function initializePuzzle(size) {
    console.log(`Initializing puzzle for size ${size}x${size}`);
    gridSize = size;
    isSolved = false;
    isPuzzleReady = false; // Not ready until tiles/board are done

    if (!puzzleImage) {
        console.error("InitializePuzzle: Cannot proceed, no puzzleImage loaded (default or custom).");
        // Maybe try reloading default? Or show error.
        if (isDefaultImageLoaded) puzzleImage = defaultPuzzleImage; // Fallback to default if it loaded
        else return; // Exit if no image source available
    }


    // Update UI Label
    if (gridSizeLabel) gridSizeLabel.html(`Grid Size: ${gridSize}x${gridSize}`);

    // Recalculate layout (essential if size changed)
    calculateLayout();

    // Create the ordered board state
    board = [];
    let totalTiles = gridSize * gridSize;
    for (let i = 0; i < totalTiles; i++) board.push(i);

    // Slice the *current* puzzleImage into tiles
    createImageTiles(puzzleImage); // This function now sets imageLoaded flag internally

    // Only proceed if tiles were created successfully
    if (imageLoaded) { // imageLoaded is set by createImageTiles
        shufflePuzzle();
        checkWinCondition();
        isPuzzleReady = true; // Puzzle is ready to be drawn!
        console.log("Puzzle initialized and ready.");
    } else {
        console.error("Puzzle initialization failed: Tiles could not be created.");
        isPuzzleReady = false;
        board = []; // Clear board on failure
    }
}

function resetPuzzle() {
     console.log("Resetting puzzle...");
     // Re-initialize using the *current* puzzle image and grid size
     initializePuzzle(gridSize);
}

function calculateLayout() {
    // Center puzzle area logic
    let safeMargin = 40; // Keep puzzle away from edges and UI space
    let availableWidth = windowWidth - safeMargin;
    let availableHeight = windowHeight - safeMargin - 150; // Leave ~150px space below for UI

    puzzleAreaSize = min(availableWidth, availableHeight); // Square based on smaller available dimension
    puzzleX = (windowWidth - puzzleAreaSize) / 2; // Center X
    puzzleY = (windowHeight - puzzleAreaSize - 150) / 2; // Center Y in the top part

    // Calculate tile dimensions
    tileWidth = puzzleAreaSize / gridSize;
    tileHeight = puzzleAreaSize / gridSize;

    console.log(`Layout: Area Size=${puzzleAreaSize.toFixed(1)}, X=${puzzleX.toFixed(1)}, Y=${puzzleY.toFixed(1)}, Tile W=${tileWidth.toFixed(1)}`);
}

function createImageTiles(img) {
    tiles = []; // Clear existing tiles
    imageLoaded = false; // Reset flag

    if (!img || typeof img.get !== 'function' || !img.width || img.width <= 0) { console.error("CreateTiles: Invalid image object."); return; }
    if (gridSize <= 1 || !puzzleAreaSize || puzzleAreaSize <=0) { console.error("CreateTiles: Invalid grid size or puzzle area."); return; }

    console.log(`Creating ${gridSize}x${gridSize} tiles...`);

    let size = min(img.width, img.height); let offsetX = (img.width - size) / 2; let offsetY = (img.height - size) / 2;
    let srcTileW = size / gridSize; let srcTileH = size / gridSize;
    if (srcTileW <= 0) { console.error("CreateTiles: Invalid source tile width."); return; }

    let allTilesCreated = true;
    let numTilesToCreate = gridSize * gridSize;

    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            let tileIndex = y * gridSize + x;
            try {
                let sx = floor(offsetX + x * srcTileW); let sy = floor(offsetY + y * srcTileH);
                let sw = floor(srcTileW); let sh = floor(srcTileH);
                 if (sx < 0 || sy < 0 || sw <= 0 || sh <= 0 || sx + sw > img.width + 1 || sy + sh > img.height + 1) { throw new Error(`img.get params out of bounds for tile ${tileIndex}`); }
                let tile = img.get(sx, sy, sw, sh);
                tiles.push(tile);
            } catch (e) {
                console.error(`Error creating tile index ${tileIndex}:`, e);
                tiles.push(null); allTilesCreated = false;
            }
        }
    }

    if (tiles.length === numTilesToCreate && allTilesCreated) {
        imageLoaded = true; // Set flag: TILE CREATION successful
        console.log(`Tiles created successfully (${tiles.length}). imageLoaded = true.`);
    } else {
        imageLoaded = false;
        console.error(`Failed to create all tiles. Count: ${tiles.length}, Needed: ${numTilesToCreate}, Errors: ${!allTilesCreated}. imageLoaded = false.`);
        // Display error?
        alert("Error: Could not create puzzle tiles from the image.");
    }
}

function shufflePuzzle() {
    // Same shuffling logic as before...
    console.log("Shuffling puzzle...");
    let blankValue = gridSize * gridSize - 1; let blankIndex = board.indexOf(blankValue);
    if (blankIndex === -1) { console.error("Shuffle error: Blank tile not found!"); board = []; for (let i=0; i<gridSize*gridSize; i++) board.push(i); blankIndex = gridSize*gridSize - 1;}
    let shuffleMoves = 100 * gridSize * gridSize; let lastMove = -1;
    for (let i = 0; i < shuffleMoves; i++) {
        let possibleMoves = [];
        if (blankIndex >= gridSize && blankIndex - gridSize !== lastMove) possibleMoves.push(blankIndex - gridSize); // Check Up
        if (blankIndex < gridSize * gridSize - gridSize && blankIndex + gridSize !== lastMove) possibleMoves.push(blankIndex + gridSize); // Check Down
        if (blankIndex % gridSize !== 0 && blankIndex - 1 !== lastMove) possibleMoves.push(blankIndex - 1); // Check Left
        if (blankIndex % gridSize !== gridSize - 1 && blankIndex + 1 !== lastMove) possibleMoves.push(blankIndex + 1); // Check Right
        if (possibleMoves.length > 0) { let moveIndex = random(possibleMoves); swap(board, blankIndex, moveIndex); lastMove = blankIndex; blankIndex = moveIndex; }
        else { lastMove = -1; i--; } // Allow reverse if stuck
    }
    isSolved = false; console.log("Shuffle complete.");
}


// --- Input Handlers ---

function handleSliderChange() {
    let newSize = gridSizeSlider.value();
    if (newSize !== gridSize && isPuzzleReady) { // Only re-init if ready
        console.log("Slider changed to:", newSize);
        initializePuzzle(newSize);
    } else if (newSize !== gridSize) {
         // Update size variable, but wait for puzzle to be ready to re-init
         gridSize = newSize;
         if (gridSizeLabel) gridSizeLabel.html(`Grid Size: ${gridSize}x${gridSize}`);
         console.log("Slider changed, but puzzle not ready. Size set to:", newSize);
    }
}

function handleFile(file) {
    console.log("File input changed. Type:", file.type);
    if (file.type && file.type.startsWith('image/')) {
        loadImage(file.data, (newImg) => {
            console.log("Custom image loaded successfully.");
            puzzleImage = newImg; // Set the *current* image to the new one
            // Re-initialize the puzzle with the new image and current grid size
            initializePuzzle(gridSize);
            fileInput.value(''); // Clear the file input
        }, (err) => {
            console.error("Error loading custom image data:", err);
            alert("Failed to load the selected image file. Please try again.");
            fileInput.value('');
        });
    } else {
        console.warn("Invalid file type selected:", file.type);
        alert('Please select a valid image file (e.g., jpg, png, webp).');
        fileInput.value(''); // Clear the input
    }
}


function keyPressed() {
     if (isSolved || !isPuzzleReady) return; // Ignore input if solved or not ready

    let blankValue = gridSize * gridSize - 1;
    let blankIndex = board.indexOf(blankValue);
    if (blankIndex === -1) return;

    let targetIndex = -1;
    if (keyCode === UP_ARROW && blankIndex < gridSize * gridSize - gridSize) targetIndex = blankIndex + gridSize;
    else if (keyCode === DOWN_ARROW && blankIndex >= gridSize) targetIndex = blankIndex - gridSize;
    else if (keyCode === LEFT_ARROW && blankIndex % gridSize !== gridSize - 1) targetIndex = blankIndex + 1;
    else if (keyCode === RIGHT_ARROW && blankIndex % gridSize !== 0) targetIndex = blankIndex - 1;

    if (targetIndex !== -1) {
        swap(board, blankIndex, targetIndex);
        checkWinCondition();
    }
}

function checkWinCondition() {
    // Same logic as before...
    let totalTiles = gridSize * gridSize; if(board.length !== totalTiles) return; // Safety check
    for (let i = 0; i < totalTiles; i++) { if (board[i] !== i) { isSolved = false; return; } }
    console.log(">>> PUZZLE SOLVED! <<<"); isSolved = true;
}

// --- Utilities ---

function swap(arr, i, j) { [arr[i], arr[j]] = [arr[j], arr[i]]; }

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    console.log("Window resized.");

    // Recalculate layout for puzzle centering
    calculateLayout();

    // --- Reposition UI Elements ---
    // Check if elements exist before positioning
    let uiStartX = puzzleX; let uiWidth = puzzleAreaSize;
    let uiStartY = puzzleY + puzzleAreaSize + 20;
    let buttonY = uiStartY + 30; let fileInputY = buttonY + 40;

    if (gridSizeSlider) {
        let sliderWidth = uiWidth * 0.5;
        gridSizeSlider.style('width', `${sliderWidth}px`);
        gridSizeSlider.position(uiStartX + (uiWidth - sliderWidth) / 2, uiStartY);
    }
    if (gridSizeLabel) {
         gridSizeLabel.style('width', `${uiWidth}px`);
         gridSizeLabel.position(uiStartX, uiStartY - 20);
    }
    if (resetButton) {
         resetButton.position(uiStartX + (uiWidth - resetButton.width) / 2, buttonY);
    }
     if (uploadLabel) {
         uploadLabel.style('width', `${uiWidth}px`);
         uploadLabel.position(uiStartX, fileInputY - 18);
     }
    if (fileInput) {
         fileInput.position(uiStartX + (uiWidth - fileInput.width) / 2, fileInputY);
    }


    // Re-create tiles only if an image source exists
    // Need to use the *current* puzzleImage
    if (puzzleImage && isDefaultImageLoaded) { // Check if default *ever* loaded ok, or custom was loaded
         console.log("Window resized: Re-creating image tiles.");
         createImageTiles(puzzleImage); // Re-slice based on current image
         // Re-check if puzzle should be marked as ready
         isPuzzleReady = imageLoaded && board.length > 0;
    } else {
        console.log("Window resized: Not recreating tiles (no valid image source).");
        isPuzzleReady = false; // Ensure puzzle isn't drawn if tiles fail
    }
}