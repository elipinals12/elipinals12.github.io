// --- Global Variables ---
let gridSize = 4; // Default grid size (4x4)
const MIN_GRID_SIZE = 2;
const MAX_GRID_SIZE = 10;

let puzzleImage;
const imagePath = './../../ref/realtree.jpg'; // Relative path to your image

let tiles = []; // Will hold the p5.Image objects for each tile piece
let board = []; // 1D array representing the board state (tile indices)
let tileWidth, tileHeight; // Dimensions of each tile on screen
let puzzleAreaSize; // Size of the square puzzle area on screen

let isImageLoaded = false;
let isSolved = false;

// UI Elements
let gridSizeSlider;
let gridSizeLabel;
let resetButton;

let cnv; // Canvas variable

// --- Preload ---
function preload() {
    console.log("Preloading image from:", imagePath);
    puzzleImage = loadImage(imagePath,
        () => {
            console.log("Image loaded successfully.");
            isImageLoaded = true;
            // Attempt to initialize immediately if setup already ran (less likely)
            if (gridSize > 0 && puzzleAreaSize > 0) {
                console.log("Preload success callback: Initializing puzzle early.");
                initializePuzzle(gridSize);
            }
        },
        (err) => {
            console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
            console.error("Failed to load image:", imagePath, err);
            console.error("Ensure the path is correct relative to the HTML file");
            console.error("and the sketch is served via a web server (like GitHub Pages).");
            console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
            isImageLoaded = false;
            // Optionally display an error message on screen
            alert(`Failed to load image: ${imagePath}\nCheck path and ensure server hosting.`);
        }
    );
}

// --- Setup ---
function setup() {
    console.log("Setting up sketch...");
    // Full screen canvas logic
    cnv = createCanvas(windowWidth, windowHeight);
    cnv.style('display', 'block'); // Prevent default scrollbars

    calculateLayout(); // Calculate initial sizes

    // --- UI Elements ---
    let uiStartY = puzzleAreaSize + 20; // Start UI below puzzle

    // Grid Size Slider
    gridSizeSlider = createSlider(MIN_GRID_SIZE, MAX_GRID_SIZE, gridSize, 1); // Min, Max, Default, Step
    gridSizeSlider.position(20, uiStartY);
    gridSizeSlider.style('width', `${puzzleAreaSize * 0.4}px`); // Adjust width
    gridSizeSlider.input(handleSliderChange); // Call function when slider value changes interactively

    // Label for Slider
    gridSizeLabel = createDiv(`Grid Size: ${gridSize}x${gridSize}`);
    gridSizeLabel.position(gridSizeSlider.x + gridSizeSlider.width + 15, uiStartY + 2); // Position next to slider
    gridSizeLabel.style('color', 'white');
    gridSizeLabel.style('font-family', 'sans-serif');

    // Reset Button
    resetButton = createButton('Shuffle / Reset');
    resetButton.position(gridSizeLabel.x + gridSizeLabel.width + 30, uiStartY);
    resetButton.mousePressed(resetPuzzle);

    // Initialize puzzle state (tiles, board, shuffle)
    // This needs the image to be loaded first.
    if (isImageLoaded) {
        console.log("Setup: Image was preloaded, initializing puzzle.");
        initializePuzzle(gridSize);
    } else {
        console.warn("Setup: Image not loaded yet. Puzzle initialization deferred.");
        // Display a waiting message?
        background(20);
        fill(200);
        textAlign(CENTER, CENTER);
        textSize(20);
        text("Loading Image...", width / 2, height / 2);
    }

    noStroke(); // Default stroke off
    imageMode(CORNER); // Default image mode
}

// --- Main Draw Loop ---
function draw() {
    background(30); // Dark background

    // Wait until image is loaded and puzzle initialized
    if (!isImageLoaded || board.length === 0) {
        // Keep showing loading message or handle error state
        fill(200); textAlign(CENTER, CENTER); textSize(20);
        text(isImageLoaded ? "Initializing..." : "Loading Image...", width / 2, puzzleAreaSize / 2);
        return; // Don't draw puzzle yet
    }

    // --- Draw the Puzzle Grid ---
    let blankValue = gridSize * gridSize - 1; // Value representing the blank space

    for (let i = 0; i < board.length; i++) {
        let tileIndex = board[i]; // The index of the *tile piece* at this board position
        let col = i % gridSize;
        let row = floor(i / gridSize);
        let x = col * tileWidth;
        let y = row * tileHeight;

        if (tileIndex === blankValue) {
            // Draw the empty slot (optional, could just leave background)
            // fill(15);
            // rect(x, y, tileWidth, tileHeight);
            continue; // Don't draw an image for the blank space
        }

        // Draw the correct image tile piece
        if (tiles && tiles.length > tileIndex && tiles[tileIndex]) {
            image(tiles[tileIndex], x, y, tileWidth, tileHeight);
        } else {
            // Fallback if tile is missing (shouldn't happen if initialized correctly)
            fill(100, 0, 0); // Error color
            rect(x, y, tileWidth, tileHeight);
        }
    }

    // --- Draw Final Tile on Solve ---
    if (isSolved) {
        let blankIndex = board.indexOf(blankValue); // Find where the blank slot *is*
        if (blankIndex !== -1 && tiles.length > blankValue && tiles[blankValue]) {
             let finalTile = tiles[blankValue]; // Get the image for the last piece
             let col = blankIndex % gridSize;
             let row = floor(blankIndex / gridSize);
             image(finalTile, col * tileWidth, row * tileHeight, tileWidth, tileHeight);

             // Optional: Draw "SOLVED!" overlay
             fill(0, 200, 0, 180);
             rect(0, 0, puzzleAreaSize, puzzleAreaSize);
             fill(255);
             textSize(puzzleAreaSize / 8);
             textAlign(CENTER, CENTER);
             text("SOLVED!", puzzleAreaSize / 2, puzzleAreaSize / 2);
        }
    }
}

// --- Puzzle Initialization and Logic ---

function initializePuzzle(size) {
    console.log(`Initializing puzzle for size ${size}x${size}`);
    gridSize = size;
    isSolved = false;

    // Update UI Label
    if (gridSizeLabel) {
        gridSizeLabel.html(`Grid Size: ${gridSize}x${gridSize}`);
    }

    // Recalculate layout based on new grid size (important for tile dimensions)
    calculateLayout();

    // Create the ordered board state (0, 1, 2, ..., size*size-1)
    board = [];
    let totalTiles = gridSize * gridSize;
    for (let i = 0; i < totalTiles; i++) {
        board.push(i);
    }

    // Slice the image into tiles if it's loaded
    if (isImageLoaded && puzzleImage) {
        createImageTiles(puzzleImage);
    } else {
        console.error("Cannot initialize puzzle: Image not loaded.");
        // Prevent further execution if image isn't ready?
        board = []; // Clear board to prevent drawing errors
        return;
    }

    // Shuffle the board
    shufflePuzzle();

    // Initial check if somehow solved after shuffle (unlikely but possible)
    checkWinCondition();
}

function resetPuzzle() {
     console.log("Resetting puzzle...");
     initializePuzzle(gridSize); // Re-initialize with current size
}

function calculateLayout() {
    // Make puzzle area a square based on the smaller window dimension
    puzzleAreaSize = min(windowWidth, windowHeight) * 0.9; // Use 90% of the smaller dimension
    // Center the puzzle area (optional, currently drawing from top-left)

    // Calculate tile dimensions based on the puzzle area and grid size
    tileWidth = puzzleAreaSize / gridSize;
    tileHeight = puzzleAreaSize / gridSize;

    console.log(`Layout calculated: Area Size=${puzzleAreaSize.toFixed(1)}, Tile W=${tileWidth.toFixed(1)}, Tile H=${tileHeight.toFixed(1)}`);
}

function createImageTiles(img) {
    tiles = []; // Clear existing tiles
    imageLoaded = false; // Assume failure until success

    if (!img || !img.width || img.width <= 0) {
        console.error("CreateTiles: Invalid image object."); return;
    }
    if (gridSize <= 1) {
         console.error("CreateTiles: Invalid grid size."); return;
    }

    console.log(`Creating ${gridSize}x${gridSize} tiles...`);

    // Crop image to square from center
    let size = min(img.width, img.height);
    let offsetX = (img.width - size) / 2;
    let offsetY = (img.height - size) / 2;

    // Calculate source tile dimensions in the *original image*
    let srcTileW = size / gridSize;
    let srcTileH = size / gridSize;

    if (srcTileW <= 0 || srcTileH <= 0) {
        console.error("CreateTiles: Calculated source tile size is invalid."); return;
    }

    let allTilesCreated = true;
    let numTilesToCreate = gridSize * gridSize; // Create all pieces including the last one

    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
             let tileIndex = y * gridSize + x;

            try {
                let sx = floor(offsetX + x * srcTileW);
                let sy = floor(offsetY + y * srcTileH);
                let sw = floor(srcTileW);
                let sh = floor(srcTileH);

                // Basic boundary check
                 if (sx < 0 || sy < 0 || sw <= 0 || sh <= 0 || sx + sw > img.width + 1 || sy + sh > img.height + 1) { // Allow slight overreach due to floor
                    throw new Error(`img.get params out of bounds for tile ${tileIndex}`);
                }

                let tile = img.get(sx, sy, sw, sh);
                tiles.push(tile);
            } catch (e) {
                console.error(`Error creating tile index ${tileIndex}:`, e);
                // Add a placeholder or mark failure
                tiles.push(null); // Push null for missing tile
                allTilesCreated = false;
            }
        }
    }

    // Check if we got the right number of tiles (even if some are null/failed)
    if (tiles.length === numTilesToCreate && allTilesCreated) {
         // Only consider loaded if *all* tiles were created successfully
        imageLoaded = true;
        console.log(`Tiles created successfully (${tiles.length}). imageLoaded = true.`);
    } else {
        imageLoaded = false;
        console.error(`Failed to create all tiles successfully. Count: ${tiles.length}, Needed: ${numTilesToCreate}, Errors: ${!allTilesCreated}. imageLoaded = false.`);
        // Keep button disabled (handled elsewhere)
    }
}


function shufflePuzzle() {
    console.log("Shuffling puzzle...");
    let blankValue = gridSize * gridSize - 1;
    let blankIndex = board.indexOf(blankValue);
    if (blankIndex === -1) {
        console.error("Cannot shuffle: Blank tile not found!");
        // Attempt to fix board state?
        board = []; for (let i=0; i<gridSize*gridSize; i++) board.push(i);
        blankIndex = gridSize*gridSize - 1;
        //return;
    }


    let shuffleMoves = 100 * gridSize * gridSize; // More moves for larger grids
    let lastMove = -1; // Avoid swapping back immediately

    for (let i = 0; i < shuffleMoves; i++) {
        let possibleMoves = []; // Indices *on the board* that can be swapped with blank

        // Check possible moves based on blankIndex
        // Move UP (tile below moves into blank) - possible if blank is not on top row
        if (blankIndex >= gridSize && blankIndex - gridSize !== lastMove) possibleMoves.push(blankIndex - gridSize);
        // Move DOWN (tile above moves into blank) - possible if blank is not on bottom row
        if (blankIndex < gridSize * gridSize - gridSize && blankIndex + gridSize !== lastMove) possibleMoves.push(blankIndex + gridSize);
        // Move LEFT (tile right moves into blank) - possible if blank is not on left edge
        if (blankIndex % gridSize !== 0 && blankIndex - 1 !== lastMove) possibleMoves.push(blankIndex - 1);
        // Move RIGHT (tile left moves into blank) - possible if blank is not on right edge
        if (blankIndex % gridSize !== gridSize - 1 && blankIndex + 1 !== lastMove) possibleMoves.push(blankIndex + 1);

        if (possibleMoves.length > 0) {
            let moveIndex = random(possibleMoves); // Choose a random valid adjacent index
            swap(board, blankIndex, moveIndex); // Swap blank with the chosen tile
            lastMove = blankIndex; // Remember where the blank *was*
            blankIndex = moveIndex; // Update blank's current index
        } else {
            // If stuck (shouldn't happen in standard puzzle), maybe force a different move?
            console.warn("Shuffle stuck? No valid non-reverse moves.");
            lastMove = -1; // Allow reverse move if stuck
             i--; // Don't count this as a successful shuffle move
        }
    }
     isSolved = false; // Ensure not marked as solved after shuffle
    console.log("Shuffle complete.");
}


// --- Input Handlers ---

function handleSliderChange() {
    let newSize = gridSizeSlider.value();
    if (newSize !== gridSize) {
        console.log("Slider changed to:", newSize);
        initializePuzzle(newSize);
    }
}

function keyPressed() {
     // Prevent moving if solved
    if (isSolved) return;

    let blankValue = gridSize * gridSize - 1;
    let blankIndex = board.indexOf(blankValue);
    if (blankIndex === -1) return; // Should not happen

    let targetIndex = -1; // The index on the board to swap with blank

    // Determine target based on key press relative to blank space
    if (keyCode === UP_ARROW && blankIndex < gridSize * gridSize - gridSize) { // Can move tile below UP?
        targetIndex = blankIndex + gridSize;
    } else if (keyCode === DOWN_ARROW && blankIndex >= gridSize) { // Can move tile above DOWN?
        targetIndex = blankIndex - gridSize;
    } else if (keyCode === LEFT_ARROW && blankIndex % gridSize !== gridSize - 1) { // Can move tile right LEFT?
        targetIndex = blankIndex + 1;
    } else if (keyCode === RIGHT_ARROW && blankIndex % gridSize !== 0) { // Can move tile left RIGHT?
        targetIndex = blankIndex - 1;
    }

    // If a valid move target was identified, swap and check for win
    if (targetIndex !== -1) {
        swap(board, blankIndex, targetIndex);
        checkWinCondition();
    }
}

function checkWinCondition() {
    let totalTiles = gridSize * gridSize;
    for (let i = 0; i < totalTiles; i++) {
        if (board[i] !== i) { // If any tile is out of place
            isSolved = false;
            return;
        }
    }
    // If loop completes, all tiles are in order
    console.log(">>> PUZZLE SOLVED! <<<");
    isSolved = true;
}

// --- Utilities ---

function swap(arr, i, j) {
    // Simple array element swap
    [arr[i], arr[j]] = [arr[j], arr[i]];
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    console.log("Window resized.");

    // Recalculate layout and potentially re-slice image
    calculateLayout();

    // Reposition UI Elements
     let uiStartY = puzzleAreaSize + 20;
     if (gridSizeSlider) gridSizeSlider.position(20, uiStartY);
     if (gridSizeLabel) gridSizeLabel.position(gridSizeSlider.x + gridSizeSlider.width + 15, uiStartY + 2);
     if (resetButton) resetButton.position(gridSizeLabel.x + gridSizeLabel.width + 30, uiStartY);

    // Re-create tiles if necessary (size changed) - only if image originally loaded
    // Note: Re-slicing might not be strictly needed if only display size changed,
    // but it's safer if aspect ratio could change drastically. Tile display size update is essential.
    if (isImageLoaded && puzzleImage) {
         console.log("Window resized: Re-creating image tiles.");
         createImageTiles(puzzleImage); // Re-slice based on new potential aspect ratio
    }
}