// p5.js Sliding Puzzle Game

// Game state variables
let gameState = 'splash'; // 'splash', 'loading', 'playing', 'solved'
let sourceImage; // The original p5.Image object loaded
let defaultImage; // To store the preloaded default image
let defaultImageLoaded = false; // Flag to track if default image loaded successfully
let croppedImage; // The square cropped version of the source image
let tiles = []; // Array to hold data about each tile's correct position and image segment
let board = []; // 2D array representing the current state of the puzzle board
let gridSize = 4; // Default grid size (N x N)
let tileSize; // Calculated size of each square tile
let boardSize; // Calculated total size of the puzzle board area
let boardX, boardY; // Top-left corner coordinates of the board

// Blank space tracking
let blankRow, blankCol;

// UI Elements (p5.dom)
let gridSizeSlider;
let gridSizeLabel;
let resetButton;
let fileInput;
let uploadLabel;
let useDefaultButton;
let uploadButtonSplash;

// Timer variables
let timer = {
  startTime: 0,
  elapsedTime: 0,
  isRunning: false,
  intervalId: null // Although p5 uses draw loop, keeping concept for clarity
};
let firstMoveMade = false;

// Constants and Configuration
const DEFAULT_IMAGE_PATH = './../../ref/realtree.jpg'; // Relative path for the default image
const MIN_GRID_SIZE = 2;
const MAX_GRID_SIZE = 10;
const UI_PADDING = 20; // Vertical padding between UI elements
const BOARD_AREA_RATIO_V = 0.65; // Vertical portion of canvas for the board
const BOARD_AREA_RATIO_H = 0.9; // Horizontal portion of canvas for the board


// Preload the default image
function preload() {
  // Use a callback to check if the image loaded successfully
  defaultImage = loadImage(DEFAULT_IMAGE_PATH,
    () => { defaultImageLoaded = true; },
    () => { defaultImageLoaded = false; console.error("Failed to load default image:", DEFAULT_IMAGE_PATH); }
  );
}

// Setup the canvas and initialize elements
function setup() {
  // Create canvas to fill the window
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1); // Ensure consistent pixel mapping

  // Initialize UI elements (initially hidden or positioned for splash)
  createUIElements();

  // Start in the splash state
  setGameState('splash');
}

// Main draw loop - handles rendering based on game state
function draw() {
  background(50); // Dark background

  // Update timer if running
  if (timer.isRunning) {
    timer.elapsedTime = millis() - timer.startTime;
  }

  // --- State Machine ---
  switch (gameState) {
    case 'splash':
      drawSplashScreen();
      break;
    case 'loading':
      drawLoadingScreen();
      break;
    case 'playing':
      drawGame();
      break;
    case 'solved':
      drawSolvedScreen();
      break;
  }
}

// --- Game State Functions ---

function setGameState(newState) {
  gameState = newState;
  // Show/hide UI elements based on state
  if (gameState === 'splash') {
    hideGameUI();
    showSplashUI();
  } else if (gameState === 'loading') {
    hideSplashUI();
    hideGameUI(); // Hide game UI during loading text display
  } else if (gameState === 'playing' || gameState === 'solved') {
    hideSplashUI();
    showGameUI();
    // Calculate layout immediately when entering playable states
    calculateLayout();
    positionUIElements(); // Reposition UI for the game view
  }
}

function drawSplashScreen() {
  // Center content vertically and horizontally
  textAlign(CENTER, CENTER);
  fill(255);
  textSize(40);
  text("welcome to imgpzl", width / 2, height / 2 - 50);
  textSize(20);
  text("use the default image or upload your own?", width / 2, height / 2);

  // Buttons are positioned by positionUIElements() called in setGameState
}

function drawLoadingScreen() {
  textAlign(CENTER, CENTER);
  fill(255);
  textSize(30);
  text("loading puzzle...", width / 2, height / 2);
}

function drawGame() {
  // Draw the puzzle board and tiles
  drawBoard();
  // Draw the timer below the board
  drawTimer();
}

function drawSolvedScreen() {
  // Draw the final complete board state
  drawBoard(true); // Pass true to draw the final tile

  // Draw semi-transparent green overlay
  fill(0, 200, 0, 80);
  noStroke();
  rect(boardX, boardY, boardSize, boardSize);

  // Draw "SOLVED!" text overlay
  textAlign(CENTER, CENTER);
  fill(255);
  textSize(boardSize * 0.2); // Scale text size with board size
  text("SOLVED!", boardX + boardSize / 2, boardY + boardSize / 2);

  // Draw the flashing timer
  drawTimer(true); // Pass true to indicate solved state for flashing effect
}

// --- Initialization and Setup ---

function createUIElements() {
  // Grid Size Slider
  gridSizeSlider = createSlider(MIN_GRID_SIZE, MAX_GRID_SIZE, gridSize, 1);
  gridSizeSlider.input(onGridSizeChange); // Call function when slider value changes

  // Grid Size Label
  gridSizeLabel = createP(`Grid Size: ${gridSize}x${gridSize}`);
  gridSizeLabel.style('color', 'white');
  gridSizeLabel.style('font-size', '16px');

  // Reset Button
  resetButton = createButton('Shuffle / Reset');
  resetButton.mousePressed(resetPuzzle);

  // Upload Label
  uploadLabel = createP('Upload Custom Image:');
  uploadLabel.style('color', 'white');
  uploadLabel.style('font-size', '16px');

  // File Input for image upload
  fileInput = createFileInput(handleFile);
  fileInput.attribute('accept', 'image/*'); // Accept only image files

  // --- Splash Screen Buttons ---
  useDefaultButton = createButton('Use Default');
  useDefaultButton.mousePressed(useDefaultImage);
  // Disable button immediately if the image didn't load
  if (!defaultImageLoaded) {
    useDefaultButton.attribute('disabled', '');
  }

  uploadButtonSplash = createButton('Upload Image');
  uploadButtonSplash.mousePressed(() => {
    fileInput.elt.click(); // Trigger the hidden file input
  });

  // Initially hide game UI elements
  hideGameUI();
}

// Hides UI elements specific to the game playing/solved states
function hideGameUI() {
  gridSizeSlider.hide();
  gridSizeLabel.hide();
  resetButton.hide();
  uploadLabel.hide();
  fileInput.hide(); // Hide the default browser input, trigger via splash button
}

// Shows UI elements specific to the game playing/solved states
function showGameUI() {
  gridSizeSlider.show();
  gridSizeLabel.show();
  resetButton.show();
  uploadLabel.show();
  fileInput.show(); // Show the input again for potential re-uploads
}

// Hides UI elements specific to the splash screen
function hideSplashUI() {
  useDefaultButton.hide();
  uploadButtonSplash.hide();
}

// Shows UI elements specific to the splash screen
function showSplashUI() {
  useDefaultButton.show();
  uploadButtonSplash.show();
  // Dynamically position splash buttons during splash screen drawing/setup
  positionSplashUI();
}

// Triggered when the default image button is clicked
function useDefaultImage() {
  if (defaultImageLoaded) {
    sourceImage = defaultImage;
    setGameState('loading');
    // Use setTimeout to allow the "loading" text to render for a frame
    setTimeout(initializePuzzle, 50);
  } else {
    console.error("Attempted to use default image, but it failed to load.");
    alert("Could not load the default image. Please try uploading an image.");
  }
}

// Triggered when a file is selected via the file input
function handleFile(file) {
  if (file.type.startsWith('image/')) {
    setGameState('loading');
    // Load the uploaded image
    loadImage(file.data, img => {
      sourceImage = img;
      // Use setTimeout to allow the "loading" text to render for a frame
      setTimeout(initializePuzzle, 50);
    }, () => {
      console.error("Error loading uploaded image.");
      alert("There was an error loading the image. Please try a different file.");
      setGameState('splash'); // Go back to splash on error
    });
  } else {
    console.warn("File selected is not an image:", file.type);
    alert("Please select a valid image file (jpg, png, gif, webp).");
  }
  // Clear the file input value so the same file can be re-selected
  fileInput.value('');
}


// Initializes the puzzle board, crops image, creates tiles, and shuffles
function initializePuzzle() {
  if (!sourceImage) {
    console.error("Cannot initialize puzzle without a source image.");
    setGameState('splash'); // Revert to splash if no image available
    return;
  }

  firstMoveMade = false; // Reset first move flag
  timer.isRunning = false; // Ensure timer is stopped
  timer.elapsedTime = 0; // Reset timer display

  // 1. Crop the source image to a square
  cropImageToSquare();

  // 2. Calculate sizes based on new grid size and canvas dimensions
  calculateLayout(); // Recalculates boardSize, tileSize, boardX, boardY

  // 3. Create the logical representation of tiles (no need to store image objects)
  createTiles();

  // 4. Create and shuffle the board
  createAndShuffleBoard();

  // 5. Transition to playing state
  setGameState('playing');
}


// Resets (re-shuffles) the current puzzle
function resetPuzzle() {
  if (gameState === 'playing' || gameState === 'solved') {
    setGameState('loading');
    // Use setTimeout for loading screen visibility
    setTimeout(() => {
      // Re-shuffle the existing board configuration
      createAndShuffleBoard();
      firstMoveMade = false; // Reset first move flag
      timer.isRunning = false; // Stop timer
      timer.elapsedTime = 0; // Reset timer display
      setGameState('playing');
    }, 50);
  }
}

// Called when the grid size slider changes
function onGridSizeChange() {
  let newSize = gridSizeSlider.value();
  if (newSize !== gridSize) {
    gridSize = newSize;
    gridSizeLabel.html(`Grid Size: ${gridSize}x${gridSize}`); // Update label immediately
    if (sourceImage) { // Only re-initialize if an image is loaded
       setGameState('loading');
       // Use setTimeout for loading screen visibility
       setTimeout(initializePuzzle, 50);
    }
  }
}

// --- Layout and Positioning ---

// Calculates the board size and position based on canvas dimensions
function calculateLayout() {
  // Determine max possible board size based on available space, leaving room for UI
  let availableHeight = height * BOARD_AREA_RATIO_V;
  let availableWidth = width * BOARD_AREA_RATIO_H;
  boardSize = floor(min(availableWidth, availableHeight)); // Use floor to avoid float issues

  // Calculate tile size (integer division might be safer but float usually works)
  tileSize = boardSize / gridSize;

  // Center the board horizontally
  boardX = (width - boardSize) / 2;
  // Position the board vertically near the top
  boardY = height * 0.05; // Small margin from the top

  // Ensure tile size is recalculated precisely
  tileSize = boardSize / gridSize;
}

// Positions all UI elements below the puzzle board
function positionUIElements() {
    if (gameState === 'playing' || gameState === 'solved') {
        let currentY = boardY + boardSize + UI_PADDING * 2; // Start below board + padding

        // Timer display (drawn in draw loop, but reserve space)
        // Placeholder text for measuring height approximately
        let timerHeight = 20; // Approximate height of timer text
        currentY += timerHeight + UI_PADDING;

        // Grid Size Label & Slider
        gridSizeLabel.position(width / 2 - gridSizeSlider.width / 2, currentY);
        gridSizeSlider.position(width / 2 - gridSizeSlider.width / 2, currentY + 20);
        currentY += gridSizeSlider.height + 30; // Label height + slider height + padding

        // Reset Button
        resetButton.position(width / 2 - resetButton.width / 2, currentY);
        currentY += resetButton.height + UI_PADDING;

        // Upload Label & Input
        uploadLabel.position(width / 2 - 100, currentY); // Adjust label x-pos slightly
        fileInput.position(width / 2 - fileInput.width / 2, currentY + 20);
        //currentY += fileInput.height + 30; // Label height + input height + padding
    }
}

// Positions the splash screen buttons
function positionSplashUI() {
    // Center buttons horizontally, below the welcome text
    const buttonY = height / 2 + 50;
    const buttonSpacing = 20;
    const totalButtonWidth = useDefaultButton.width + uploadButtonSplash.width + buttonSpacing;

    useDefaultButton.position(width/2 - totalButtonWidth/2, buttonY);
    uploadButtonSplash.position(useDefaultButton.x + useDefaultButton.width + buttonSpacing, buttonY);

    // Ensure the default button's disabled state is correct
    if (!defaultImageLoaded) {
        useDefaultButton.attribute('disabled', '');
    } else {
        useDefaultButton.removeAttribute('disabled');
    }
}


// --- Image Processing ---

// Crops the source image to the largest possible square from the center
function cropImageToSquare() {
  if (!sourceImage) return;

  let originalWidth = sourceImage.width;
  let originalHeight = sourceImage.height;
  let cropSize = min(originalWidth, originalHeight);
  let cropX = (originalWidth - cropSize) / 2;
  let cropY = (originalHeight - cropSize) / 2;

  // Create a new p5.Image object for the cropped version
  // Using get() is reliable for this
  croppedImage = sourceImage.get(cropX, cropY, cropSize, cropSize);
}

// Creates the logical tile data (correct positions)
function createTiles() {
  tiles = []; // Clear previous tiles
  let tileCount = gridSize * gridSize;
  for (let i = 0; i < tileCount; i++) {
    let row = floor(i / gridSize);
    let col = i % gridSize;
    // Store the original row/col for checking solved state and drawing
    tiles.push({ originalRow: row, originalCol: col, id: i });
  }
  // The last tile (index N*N-1) conceptually represents the blank space
}

// --- Board Logic ---

// Creates the board array and shuffles it into a solvable state
function createAndShuffleBoard() {
  board = Array(gridSize).fill(null).map(() => Array(gridSize).fill(null));
  let tileIds = [];
  for (let i = 0; i < gridSize * gridSize - 1; i++) {
    tileIds.push(i); // IDs 0 to N*N-2
  }
  tileIds.push(-1); // Use -1 to represent the blank space internally

  // Start with the solved state (temporarily)
  let currentIdIndex = 0;
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
        // Place tiles in order, with blank at the end
        if (r === gridSize - 1 && c === gridSize - 1) {
            board[r][c] = -1; // Blank space
            blankRow = r;
            blankCol = c;
        } else {
            board[r][c] = r * gridSize + c; // Solved state ID
        }
    }
  }

  // Perform a large number of random valid moves to shuffle
  let shuffles = gridSize * gridSize * gridSize * 5; // More shuffles for larger grids
  for (let i = 0; i < shuffles; i++) {
    let neighbors = [];
    // Check potential moves (Up, Down, Left, Right)
    if (blankRow > 0) neighbors.push({ r: blankRow - 1, c: blankCol }); // Up
    if (blankRow < gridSize - 1) neighbors.push({ r: blankRow + 1, c: blankCol }); // Down
    if (blankCol > 0) neighbors.push({ r: blankRow, c: blankCol - 1 }); // Left
    if (blankCol < gridSize - 1) neighbors.push({ r: blankRow, c: blankCol + 1 }); // Right

    // Pick a random valid neighbor to swap with
    if (neighbors.length > 0) {
      let move = random(neighbors);
      swapTiles(blankRow, blankCol, move.r, move.c);
    }
  }

  // Ensure it's not accidentally solved after shuffling (rare, but possible)
  if (checkSolved()) {
      // Perform one more valid swap if solved
      let neighbors = [];
      if (blankRow > 0) neighbors.push({ r: blankRow - 1, c: blankCol });
      if (blankCol > 0) neighbors.push({ r: blankRow, c: blankCol - 1 });
       if (neighbors.length > 0) { // Prefer up/left swap if possible
           let move = random(neighbors);
           swapTiles(blankRow, blankCol, move.r, move.c);
       } else { // If blank is top-left, swap down/right
           if (blankRow < gridSize - 1) swapTiles(blankRow, blankCol, blankRow + 1, blankCol);
           else if (blankCol < gridSize - 1) swapTiles(blankRow, blankCol, blankRow, blankCol + 1);
       }
  }
}


// Draws the current state of the puzzle board
function drawBoard(showFinalTile = false) {
  if (!croppedImage) return; // Don't draw if no image is ready

  noStroke(); // Ensure gapless rendering

  // Calculate image source tile size (based on the cropped image dimensions)
  let sxTileSize = croppedImage.width / gridSize;

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      let tileId = board[r][c];
      let drawX = boardX + c * tileSize;
      let drawY = boardY + r * tileSize;

      if (tileId !== -1) {
        // This tile is not the blank space
        // Find the original position (source rect) of this tile ID
        let originalRow = floor(tileId / gridSize);
        let originalCol = tileId % gridSize;

        let sx = originalCol * sxTileSize;
        let sy = originalRow * sxTileSize;

        // Draw the corresponding part of the cropped image
        // Use the version of image() specifying source and destination rectangles
        // Use ceil on draw size to prevent potential 1px gaps from float inaccuracies
        image(
          croppedImage,
          drawX, drawY, ceil(tileSize), ceil(tileSize), // Destination rect (on canvas)
          sx, sy, sxTileSize, sxTileSize               // Source rect (from croppedImage)
        );
      } else if (showFinalTile && tileId === -1) {
        // If in solved state and drawing the final tile
        let finalTileId = gridSize * gridSize - 1;
        let originalRow = floor(finalTileId / gridSize);
        let originalCol = finalTileId % gridSize;
        let sx = originalCol * sxTileSize;
        let sy = originalRow * sxTileSize;

        image(
          croppedImage,
          drawX, drawY, ceil(tileSize), ceil(tileSize),
          sx, sy, sxTileSize, sxTileSize
        );
      }
      // Do nothing for the blank space when not in solved state (it remains empty)
    }
  }
    // Optional: Draw a subtle border around the board
    noFill();
    stroke(200); // Light gray border
    strokeWeight(1);
    rect(boardX - 1, boardY - 1, boardSize + 2, boardSize + 2); // Slightly outside
}


// Swaps the tile at (r1, c1) with the tile at (r2, c2) on the board
// Also updates the blankRow/blankCol if one of them is the blank space
function swapTiles(r1, c1, r2, c2) {
  let temp = board[r1][c1];
  board[r1][c1] = board[r2][c2];
  board[r2][c2] = temp;

  // Update blank position tracker if the blank space moved
  if (board[r1][c1] === -1) {
    blankRow = r1;
    blankCol = c1;
  } else if (board[r2][c2] === -1) {
    blankRow = r2;
    blankCol = c2;
  }
}

// Checks if the current board configuration matches the solved state
function checkSolved() {
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      let expectedId = r * gridSize + c;
      // The last spot should be the blank space (-1) in the solved state
      if (r === gridSize - 1 && c === gridSize - 1) {
        if (board[r][c] !== -1) return false;
      } else {
        if (board[r][c] !== expectedId) return false;
      }
    }
  }
  return true; // All tiles are in the correct place
}

// --- Controls ---

// Handles arrow key presses for moving tiles
function keyPressed() {
  // Only allow moves if in the 'playing' state
  if (gameState !== 'playing') {
    return;
  }

  let moved = false; // Flag to check if a valid move was made
  let targetRow = blankRow;
  let targetCol = blankCol;

  // Determine which tile to potentially swap with the blank space
  if (keyCode === UP_ARROW && blankRow < gridSize - 1) {
    targetRow = blankRow + 1; // Move tile below blank UP
    moved = true;
  } else if (keyCode === DOWN_ARROW && blankRow > 0) {
    targetRow = blankRow - 1; // Move tile above blank DOWN
    moved = true;
  } else if (keyCode === LEFT_ARROW && blankCol < gridSize - 1) {
    targetCol = blankCol + 1; // Move tile right of blank LEFT
    moved = true;
  } else if (keyCode === RIGHT_ARROW && blankCol > 0) {
    targetCol = blankCol - 1; // Move tile left of blank RIGHT
    moved = true;
  }

  if (moved) {
    // Prevent default browser behavior for arrow keys (scrolling)
    // Note: This might not always work perfectly depending on browser/context.
    // A more robust solution might involve event listeners on the document.
    // preventDefault(); // p5 doesn't have a global preventDefault easily accessible here

    swapTiles(blankRow, blankCol, targetRow, targetCol); // Perform the swap

    // Start timer on the very first valid move
    if (!firstMoveMade) {
      firstMoveMade = true;
      startTimer();
    }

    // Check if the puzzle is solved after the move
    if (checkSolved()) {
      setGameState('solved');
      stopTimer();
    }

    // Attempt to remove focus from UI elements like the slider
    if (document.activeElement) {
        document.activeElement.blur();
    }
  }

  // Return false to prevent default browser behavior for keys used by the game
  if ([UP_ARROW, DOWN_ARROW, LEFT_ARROW, RIGHT_ARROW].includes(keyCode)) {
      return false;
  }
}

// --- Timer ---

// Starts the game timer
function startTimer() {
  if (!timer.isRunning) {
    timer.startTime = millis();
    timer.elapsedTime = 0;
    timer.isRunning = true;
  }
}

// Stops the game timer
function stopTimer() {
  timer.isRunning = false;
}

// Draws the timer display below the board
function drawTimer(isSolved = false) {
    // Position timer centrally below the board area reserved during layout
    let timerY = boardY + boardSize + UI_PADDING + 15; // Position based on layout calculation

    // Format time as M:SS.ss
    let totalSeconds = timer.elapsedTime / 1000;
    let minutes = floor(totalSeconds / 60);
    let seconds = totalSeconds % 60;
    // Use nf() (number format) to pad with leading zeros
    let formattedTime = `${minutes}:${nf(seconds, 2, 2)}`;

    textAlign(CENTER, TOP);
    textSize(20);

    // Flashing effect when solved
    if (isSolved) {
        // Flash alpha based on time (e.g., blink every second)
        let alpha = map(sin(millis() / 150), -1, 1, 100, 255); // Smooth sine wave blink
        fill(0, 255, 0, alpha); // Green flashing text
    } else {
        fill(255); // White text when running or stopped normally
    }

    text(formattedTime, width / 2, timerY);
}


// --- Window Resizing ---

// Handles window resize events
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);

  // Recalculate layout based on new dimensions
  calculateLayout();

  // Reposition UI elements based on the new layout
  if (gameState === 'splash') {
      positionSplashUI();
  } else if (gameState === 'playing' || gameState === 'solved') {
      positionUIElements();
  }

  // Re-crop and re-initialize necessary parts if image exists
  // (though re-cropping is often not needed unless aspect ratio changes drastically)
  // The drawing function uses the current boardSize/tileSize, so tiles will redraw correctly.
  // If performance becomes an issue on resize, optimization might be needed.
  // For now, simply recalculating layout and letting draw() handle it is sufficient.
}