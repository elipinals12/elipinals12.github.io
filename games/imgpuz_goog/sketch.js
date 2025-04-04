// p5.js Sliding Puzzle Game - Refined Version

// Game state variables
let gameState = 'splash'; // 'splash', 'loading', 'playing', 'solved'
let sourceImage; // The original p5.Image object loaded
let defaultImage; // To store the preloaded default image
let defaultImageLoaded = false; // Flag to track if default image loaded successfully
let croppedImage; // The square cropped version of the source image
let tiles = []; // Array to hold data about each tile's correct position
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
let uploadLabelText; // The <p> element for the label text
let useDefaultButton;
let uploadButtonSplash;
let uiElementsContainer; // A div to group game UI for easier positioning

// Timer variables
let timer = {
  startTime: 0,
  elapsedTime: 0,
  isRunning: false,
  // intervalId: null // Not needed with p5 draw loop
};
let firstMoveMade = false;

// Constants and Configuration
const DEFAULT_IMAGE_PATH = './../../ref/realtree.jpg'; // Relative path for the default image
const MIN_GRID_SIZE = 2;
const MAX_GRID_SIZE = 10;
const UI_VERTICAL_GAP = 15; // Consistent vertical gap between UI elements
const BOARD_AREA_RATIO_V = 0.65; // Max vertical portion of canvas for the board
const BOARD_AREA_RATIO_H = 0.9; // Max horizontal portion of canvas for the board
const SPLASH_BUTTON_STYLE = {
    'padding': '15px 30px',
    'font-size': '18px',
    'background-color': '#4CAF50', // Green
    'color': 'white',
    'border': 'none',
    'border-radius': '5px',
    'cursor': 'pointer',
    'margin': '10px' // Add some margin around buttons
};
const GAME_BUTTON_STYLE = {
    'padding': '10px 20px',
    'font-size': '16px',
    'background-color': '#008CBA', // Blue
    'color': 'white',
    'border': 'none',
    'border-radius': '4px',
    'cursor': 'pointer',
    'margin-top': `${UI_VERTICAL_GAP}px`
};
const LABEL_STYLE = {
    'color': 'white',
    'font-size': '16px',
    'margin-bottom': '5px', // Space below label
    'margin-top': `${UI_VERTICAL_GAP}px` // Space above label
};


// Preload the default image
function preload() {
  // Use a callback to check if the image loaded successfully
  defaultImage = loadImage(DEFAULT_IMAGE_PATH,
    () => { defaultImageLoaded = true; console.log("Default image loaded successfully."); },
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
  background(30, 30, 40); // Darker, slightly blue background

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
  console.log(`Changing state from ${gameState} to ${newState}`);
  let oldState = gameState;
  gameState = newState;

  // Show/hide UI elements based on state
  if (newState === 'splash') {
    hideGameUI();
    showSplashUI();
    // Ensure layout is calculated and UI positioned for splash
    calculateLayout();
    positionSplashUI();
  } else if (newState === 'loading') {
    hideSplashUI();
    hideGameUI(); // Hide game UI during loading text display
    // No specific layout needed for loading text, draw handles it
  } else if (newState === 'playing' || newState === 'solved') {
    hideSplashUI();
    // Only show game UI *after* layout is calculated and image potentially processed
    if (oldState === 'loading' || oldState === 'splash') {
       // Calculate layout immediately when entering playable states from loading/splash
       calculateLayout();
       // Position UI elements after layout is known
       positionGameUI();
    }
     // Ensure UI is visible
    showGameUI();
  }

   // Special case: If going from solved back to playing (e.g., reset), re-position UI
   if(oldState === 'solved' && newState === 'playing') {
        calculateLayout(); // Recalculate just in case
        positionGameUI();
   }
}

function drawSplashScreen() {
  // Center content vertically and horizontally
  textAlign(CENTER, CENTER);
  fill(240); // Slightly off-white
  textSize(max(30, width * 0.05)); // Responsive text size
  text("welcome to imgpuz", width / 2, height * 0.4); // Position title higher
  textSize(max(18, width * 0.02));
  fill(200); // Dimmer subtitle
  text("use default img or upload your own!", width / 2, height * 0.4 + max(40, width*0.06));

  // Buttons are positioned by positionSplashUI() called in setGameState/windowResized
}

function drawLoadingScreen() {
  textAlign(CENTER, CENTER);
  fill(220);
  textSize(30);
  text("loading puzzle...", width / 2, height / 2);
}

function drawGame() {
  // Draw the puzzle board and tiles
  drawBoard();
  // Draw the timer (position handled within the function relative to board)
  drawTimer();
}

function drawSolvedScreen() {
  // Draw the final complete board state
  drawBoard(true); // Pass true to draw the final tile

  // Draw semi-transparent green overlay
  fill(0, 200, 0, 100); // Slightly increased opacity
  noStroke();
  rect(boardX, boardY, boardSize, boardSize);

  // Draw "SOLVED!" text overlay
  textAlign(CENTER, CENTER);
  fill(255);
  // Ensure text size is reasonable, not too large or small
  let solvedTextSize = constrain(boardSize * 0.2, 24, 150);
  textSize(solvedTextSize);
  stroke(0); // Black outline for better visibility
  strokeWeight(2);
  text("SOLVED!", boardX + boardSize / 2, boardY + boardSize / 2);
  noStroke(); // Reset stroke

  // Draw the flashing timer
  drawTimer(true); // Pass true to indicate solved state for flashing effect
}

// --- Initialization and Setup ---

function createUIElements() {
    // --- Container for Game UI ---
    // This helps group elements for easier collective positioning.
    uiElementsContainer = createDiv('');
    uiElementsContainer.style('display', 'flex');
    uiElementsContainer.style('flex-direction', 'column');
    uiElementsContainer.style('align-items': 'center'); // Center items horizontally within the div
    uiElementsContainer.style('width', '80%'); // Take up most of the width below board


    // --- Game UI Elements (children of container) ---

    // Grid Size Label
    gridSizeLabel = createP(`Grid Size: ${gridSize}x${gridSize}`);
    gridSizeLabel.style('color', LABEL_STYLE.color);
    gridSizeLabel.style('font-size', LABEL_STYLE['font-size']);
    gridSizeLabel.style('margin-top', '0'); // No top margin for the first element
    gridSizeLabel.style('margin-bottom', LABEL_STYLE['margin-bottom']);
    gridSizeLabel.parent(uiElementsContainer); // Add to container

    // Grid Size Slider
    gridSizeSlider = createSlider(MIN_GRID_SIZE, MAX_GRID_SIZE, gridSize, 1);
    gridSizeSlider.style('width', '200px'); // Fixed width for slider
    gridSizeSlider.style('margin-bottom', `${UI_VERTICAL_GAP}px`);
    // Use input for live update, but manage focus carefully
    gridSizeSlider.input(onGridSizeChange);
    gridSizeSlider.parent(uiElementsContainer); // Add to container


    // Reset Button
    resetButton = createButton('Shuffle / Reset');
    // Apply button styles defined in constants
    Object.entries(GAME_BUTTON_STYLE).forEach(([key, value]) => {
        resetButton.style(key, value);
    });
    resetButton.mousePressed(resetPuzzle);
    resetButton.parent(uiElementsContainer); // Add to container

    // Upload Label Text
    uploadLabelText = createP('Upload Custom Image:');
    uploadLabelText.style('color', LABEL_STYLE.color);
    uploadLabelText.style('font-size', LABEL_STYLE['font-size']);
    uploadLabelText.style('margin-bottom', LABEL_STYLE['margin-bottom']);
    uploadLabelText.style('margin-top', LABEL_STYLE['margin-top']); // Add top margin
    uploadLabelText.parent(uiElementsContainer); // Add to container

    // File Input for image upload (keep default appearance for now)
    fileInput = createFileInput(handleFile);
    fileInput.attribute('accept', 'image/*'); // Accept only image files
    fileInput.style('font-size', '14px');
    fileInput.style('color', 'white'); // Basic styling
    fileInput.parent(uiElementsContainer); // Add to container


    // --- Splash Screen Buttons (positioned absolutely) ---
    useDefaultButton = createButton('Use Default');
    useDefaultButton.mousePressed(useDefaultImage);
    // Apply styles defined in constants
    Object.entries(SPLASH_BUTTON_STYLE).forEach(([key, value]) => {
        useDefaultButton.style(key, value);
    });
    // Disable button immediately if the image didn't load
    if (!defaultImageLoaded) {
        useDefaultButton.attribute('disabled', '');
        useDefaultButton.style('background-color', '#cccccc'); // Grey out disabled button
        useDefaultButton.style('cursor', 'not-allowed');
    }

    uploadButtonSplash = createButton('Upload Image');
    uploadButtonSplash.mousePressed(() => {
        fileInput.elt.click(); // Trigger the hidden file input
    });
     // Apply styles defined in constants
    Object.entries(SPLASH_BUTTON_STYLE).forEach(([key, value]) => {
        uploadButtonSplash.style(key, value);
    });

    // Initially hide game UI elements container
    hideGameUI();
}

// Hides UI elements specific to the game playing/solved states
function hideGameUI() {
    uiElementsContainer.hide();
}

// Shows UI elements specific to the game playing/solved states
function showGameUI() {
    uiElementsContainer.show();
    // Ensure file input is visible when game UI is shown
    fileInput.show(); // This might be redundant if parent div is shown, but safe
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
    positionSplashUI(); // Needs to be called after showing
}

// Triggered when the default image button is clicked
function useDefaultImage() {
  if (defaultImageLoaded && defaultImage.width > 0) {
    sourceImage = defaultImage;
    setGameState('loading');
    // Initialize puzzle directly after setting state, no timeout needed
    // The loading screen will show for the duration of initializePuzzle
    initializePuzzle();
  } else {
    console.error("Attempted to use default image, but it's not loaded or invalid.");
    alert("Could not load the default image. Please try uploading an image.");
    // Reset button state if needed
    if (!defaultImageLoaded) {
        useDefaultButton.attribute('disabled', '');
        useDefaultButton.style('background-color', '#cccccc');
        useDefaultButton.style('cursor', 'not-allowed');
    }
  }
}

// Triggered when a file is selected via the file input
function handleFile(file) {
  if (file.type.startsWith('image/')) {
    setGameState('loading');
    // Load the uploaded image
    loadImage(file.data, img => {
      if (img.width > 0) {
          sourceImage = img;
          console.log("Custom image loaded successfully.");
          // Initialize puzzle directly from the callback
          initializePuzzle();
      } else {
          console.error("Uploaded image data seems invalid (width=0).");
          alert("The selected image could not be processed. Please try a different file.");
          setGameState('splash'); // Go back to splash on error
      }
    }, () => {
      console.error("Error loading uploaded image via loadImage.");
      alert("There was an error loading the image. Please try a different file.");
      setGameState('splash'); // Go back to splash on error
    });
  } else {
    console.warn("File selected is not an image:", file.type);
    alert("Please select a valid image file (jpg, png, gif, webp).");
  }
  // Clear the file input value so the same file can be re-selected if needed
  // This is important for the 'change' event to fire again for the same filename.
  fileInput.value('');
}


// Initializes the puzzle board, crops image, creates tiles, and shuffles
function initializePuzzle() {
  if (!sourceImage || sourceImage.width <= 0) {
    console.error("Cannot initialize puzzle - source image is missing or invalid.");
    setGameState('splash'); // Revert to splash if no valid image
    return;
  }
  console.log("Initializing puzzle...");

  firstMoveMade = false; // Reset first move flag
  timer.isRunning = false; // Ensure timer is stopped
  timer.elapsedTime = 0; // Reset timer display

  // 1. Crop the source image to a square
  cropImageToSquare();
  if (!croppedImage || croppedImage.width <= 0) {
      console.error("Failed to create a valid cropped image.");
      alert("There was an error processing the image. Please try again.");
      setGameState('splash');
      return;
  }

  // 2. Calculate sizes based on new grid size and canvas dimensions
  calculateLayout(); // Recalculates boardSize, tileSize, boardX, boardY

  // 3. Create the logical representation of tiles
  createTiles();

  // 4. Create and shuffle the board
  createAndShuffleBoard();

  // 5. Position the game UI elements now that layout is known
  positionGameUI();

  // 6. Transition to playing state (UI elements are positioned and ready)
  setGameState('playing');
  console.log("Puzzle initialized. State set to playing.");
}


// Resets (re-shuffles) the current puzzle
function resetPuzzle() {
  if ((gameState === 'playing' || gameState === 'solved') && sourceImage) {
    setGameState('loading');
    // Use requestAnimationFrame to ensure 'loading' state renders before heavy work
    requestAnimationFrame(() => {
        // Re-shuffle the existing board configuration
        createAndShuffleBoard();
        firstMoveMade = false; // Reset first move flag
        timer.isRunning = false; // Stop timer
        timer.elapsedTime = 0; // Reset timer display
        // Ensure layout and UI are repositioned correctly
        calculateLayout();
        positionGameUI();
        setGameState('playing');
    });
  } else {
      console.warn("Reset called in inappropriate state or without image.");
  }
}

// Called when the grid size slider changes value
function onGridSizeChange() {
  let newSize = gridSizeSlider.value();
  // Update label immediately for responsiveness
  gridSizeLabel.html(`Grid Size: ${newSize}x${newSize}`);

  // Check if the size actually changed to avoid unnecessary re-init
  if (newSize !== gridSize) {
      gridSize = newSize;
      console.log("Grid size changed to:", gridSize);
      if (sourceImage && (gameState === 'playing' || gameState === 'solved')) { // Only re-initialize if an image is loaded and game is active/solved
          setGameState('loading');
          // Use requestAnimationFrame for smoother transition
          requestAnimationFrame(() => {
              initializePuzzle();
          });
      }
  }
   // Try to blur the slider after interaction to help with keyboard focus
   if (document.activeElement === gridSizeSlider.elt) {
       gridSizeSlider.elt.blur();
   }
}

// --- Layout and Positioning ---

// Calculates the board size and position based on canvas dimensions
function calculateLayout() {
    // Determine max possible board size based on available space
    // Leave more space at the bottom for UI elements
    let availableHeight = height * BOARD_AREA_RATIO_V;
    let availableWidth = width * BOARD_AREA_RATIO_H;
    boardSize = floor(min(availableWidth, availableHeight)); // Use floor to avoid float issues

    // Ensure minimum board size to prevent visual glitches
    boardSize = max(boardSize, 100); // Example minimum size

    // Calculate tile size
    tileSize = boardSize / gridSize;

    // Center the board horizontally
    boardX = (width - boardSize) / 2;
    // Position the board vertically near the top, leaving a small margin
    boardY = max(UI_VERTICAL_GAP * 2, height * 0.05); // Ensure some top margin

    // Recalculate tile size precisely after boardSize is finalized
    tileSize = boardSize / gridSize;

    console.log(`Layout calculated: boardSize=${boardSize}, tileSize=${tileSize}, boardX=${boardX}, boardY=${boardY}`);
}

// Positions the container for game UI elements below the puzzle board
function positionGameUI() {
    if (gameState === 'playing' || gameState === 'solved') {
        // Calculate the top position for the container div
        let containerY = boardY + boardSize + UI_VERTICAL_GAP * 2; // Start below board + padding

        // Position the container div itself
        // Centering is done via CSS ('align-items: center' for content) and setting x-position here
        let containerWidth = uiElementsContainer.elt.offsetWidth; // Get actual width
        // Use width property if offsetWidth is 0 initially
         if (containerWidth === 0) containerWidth = width * 0.8; // Fallback based on CSS width
        uiElementsContainer.position( (width - containerWidth) / 2 , containerY);

        // Individual elements within the container are laid out by flexbox (column)
        // We just need to make sure the container is placed correctly.
    }
}

// Positions the splash screen buttons dynamically
function positionSplashUI() {
    // Position buttons below the subtitle text area
    const buttonY = height * 0.4 + max(40, width*0.06) + UI_VERTICAL_GAP * 3; // Below subtitle + spacing
    const buttonSpacing = 20;

    // Calculate total width needed for buttons + spacing
    // Use elt.offsetWidth for more accurate width including padding/borders
    const defaultBtnWidth = useDefaultButton.elt.offsetWidth || 150; // Fallback width
    const uploadBtnWidth = uploadButtonSplash.elt.offsetWidth || 150; // Fallback width
    const totalButtonWidth = defaultBtnWidth + uploadBtnWidth + buttonSpacing;

    // Calculate starting X to center the group
    const startX = (width - totalButtonWidth) / 2;

    useDefaultButton.position(startX, buttonY);
    uploadButtonSplash.position(startX + defaultBtnWidth + buttonSpacing, buttonY);

    // Ensure the default button's disabled state and style are correct
    if (!defaultImageLoaded) {
        useDefaultButton.attribute('disabled', '');
        useDefaultButton.style('background-color', '#cccccc');
        useDefaultButton.style('cursor', 'not-allowed');
    } else {
        useDefaultButton.removeAttribute('disabled');
        useDefaultButton.style('background-color', SPLASH_BUTTON_STYLE['background-color']); // Restore style
        useDefaultButton.style('cursor', 'pointer');
    }
}


// --- Image Processing ---

// Crops the source image to the largest possible square from the center
function cropImageToSquare() {
  if (!sourceImage || sourceImage.width <= 0 || sourceImage.height <= 0) {
      console.error("Cannot crop: Invalid source image.");
      croppedImage = null; // Ensure it's null if failed
      return;
  };

  let originalWidth = sourceImage.width;
  let originalHeight = sourceImage.height;
  let cropSize = min(originalWidth, originalHeight);
  let cropX = (originalWidth - cropSize) / 2;
  let cropY = (originalHeight - cropSize) / 2;

  // Ensure crop dimensions are valid integers
  cropX = floor(cropX);
  cropY = floor(cropY);
  cropSize = floor(cropSize);

  if (cropSize <= 0) {
      console.error("Cannot crop: Calculated crop size is zero or negative.");
       croppedImage = null;
       return;
  }

  // Create a new p5.Image object for the cropped version using get()
  // Use try-catch as get() might fail with certain image states
  try {
      croppedImage = sourceImage.get(cropX, cropY, cropSize, cropSize);
      // Verify the cropped image has dimensions
      if (!croppedImage || croppedImage.width <= 0) {
          throw new Error("Cropped image result has invalid dimensions.");
      }
      console.log(`Image cropped to ${croppedImage.width}x${croppedImage.height}`);
  } catch (error) {
      console.error("Error during image cropping:", error);
      croppedImage = null;
      // Optionally, try creating a graphics buffer as an alternative?
      // For now, just log error and prevent proceeding.
  }
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
  // The last tile (index N*N-1) conceptually represents the blank space in solved state
}

// --- Board Logic ---

// Creates the board array and shuffles it into a solvable state
function createAndShuffleBoard() {
  board = Array(gridSize).fill(null).map(() => Array(gridSize).fill(null));

  // Start with the solved state board
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
        board[r][c] = r * gridSize + c; // Tile ID (0 to N*N-2)
    }
  }
  // Set the last position as the blank space (-1)
  blankRow = gridSize - 1;
  blankCol = gridSize - 1;
  board[blankRow][blankCol] = -1;

  // Perform a large number of random valid moves from the solved state
  // This guarantees a solvable puzzle configuration.
  let shuffles = gridSize * gridSize * gridSize * 5; // More shuffles for larger grids
  // Increase shuffles significantly for better randomness
  shuffles = max(shuffles, 100); // Ensure at least 100 shuffles

  for (let i = 0; i < shuffles; i++) {
    let neighbors = [];
    // Find valid tiles that can slide into the blank space
    if (blankRow > 0) neighbors.push({ r: blankRow - 1, c: blankCol }); // Tile Above
    if (blankRow < gridSize - 1) neighbors.push({ r: blankRow + 1, c: blankCol }); // Tile Below
    if (blankCol > 0) neighbors.push({ r: blankRow, c: blankCol - 1 }); // Tile Left
    if (blankCol < gridSize - 1) neighbors.push({ r: blankRow, c: blankCol + 1 }); // Tile Right

    // Pick a random valid neighbor tile to swap with the blank space
    if (neighbors.length > 0) {
      let moveTile = random(neighbors);
      // Swap the chosen tile with the blank space
      swapTiles(blankRow, blankCol, moveTile.r, moveTile.c);
      // blankRow and blankCol are updated inside swapTiles
    }
  }

  // Very rare edge case: if shuffling somehow results in the solved state again
  if (checkSolved()) {
      console.log("Shuffled back to solved state, performing one more swap.");
      // Perform one guaranteed swap (e.g., swap blank with tile to its left if possible)
      if (blankCol > 0) {
          swapTiles(blankRow, blankCol, blankRow, blankCol - 1);
      } else if (blankCol < gridSize - 1) { // Otherwise swap right
          swapTiles(blankRow, blankCol, blankRow, blankCol + 1);
      }
      // If somehow still solved (e.g., 2x2), maybe swap up/down? Highly unlikely needed.
  }
  console.log("Board created and shuffled.");
}


// Draws the current state of the puzzle board
function drawBoard(showFinalTile = false) {
  // Critical check: Ensure we have a valid, loaded croppedImage
  if (!croppedImage || croppedImage.width <= 0) {
      // Optionally draw a placeholder if image is missing/invalid
      // fill(100);
      // stroke(255);
      // rect(boardX, boardY, boardSize, boardSize);
      // textAlign(CENTER, CENTER);
      // fill(255);
      // text("Image Error", boardX + boardSize / 2, boardY + boardSize / 2);
      // console.log("drawBoard: skipped drawing, croppedImage is invalid.");
      return;
  }

  push(); // Isolate drawing styles
  translate(boardX, boardY); // Move origin to board's top-left
  noStroke(); // Ensure gapless rendering

  // Calculate image source tile size (based on the cropped image dimensions)
  // Ensure source image dimensions are valid before division
   if (croppedImage.width === 0 || gridSize === 0) {
        console.error("drawBoard: Invalid croppedImage width or gridsize for sxTileSize calc.");
        pop();
        return;
    }
  let sxTileSize = croppedImage.width / gridSize;

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      let tileId = board[r][c];
      // Calculate drawing position relative to the translated origin
      let drawX = c * tileSize;
      let drawY = r * tileSize;

      if (tileId !== -1) {
        // This tile is not the blank space
        // Find the original position (source rect) of this tile ID
        let originalRow = floor(tileId / gridSize);
        let originalCol = tileId % gridSize;

        let sx = originalCol * sxTileSize;
        let sy = originalRow * sxTileSize;

        // Check for potential calculation errors leading to NaN or invalid values
         if (isNaN(drawX) || isNaN(drawY) || isNaN(tileSize) || isNaN(sx) || isNaN(sy) || isNaN(sxTileSize)) {
            console.error("drawBoard: NaN value detected in drawing parameters.", {drawX, drawY, tileSize, sx, sy, sxTileSize});
            continue; // Skip drawing this tile if calculation failed
         }


        // Draw the corresponding part of the cropped image
        // Using precise float values for source and destination should work with noStroke()
        // Avoid ceil() as it can cause slight overlaps or gaps if tileSize is not integer
        image(
          croppedImage,
          drawX, drawY, tileSize, tileSize, // Destination rect (on canvas, relative)
          sx, sy, sxTileSize, sxTileSize    // Source rect (from croppedImage)
        );
      } else if (showFinalTile && tileId === -1) {
        // If in solved state and drawing the final tile
        let finalTileId = gridSize * gridSize - 1;
        let originalRow = floor(finalTileId / gridSize);
        let originalCol = finalTileId % gridSize;
        let sx = originalCol * sxTileSize;
        let sy = originalRow * sxTileSize;

        if (!isNaN(drawX) && !isNaN(drawY) && !isNaN(tileSize) && !isNaN(sx) && !isNaN(sy) && !isNaN(sxTileSize)) {
            image(
              croppedImage,
              drawX, drawY, tileSize, tileSize,
              sx, sy, sxTileSize, sxTileSize
            );
        } else {
             console.error("drawBoard (solved): NaN value detected.", {drawX, drawY, tileSize, sx, sy, sxTileSize});
        }
      }
      // Do nothing for the blank space when not in solved state (it remains empty/background)
    }
  }
    // Optional: Draw a subtle border around the board (after translation)
    noFill();
    stroke(200, 200, 220, 150); // Lighter, semi-transparent border
    strokeWeight(1);
    rect(-1, -1, boardSize + 2, boardSize + 2); // Draw around the 0,0 relative origin

    pop(); // Restore original drawing context
}


// Swaps the tile at (r1, c1) with the tile at (r2, c2) on the board
// Also updates the blankRow/blankCol if one of them is the blank space
function swapTiles(r1, c1, r2, c2) {
  // console.log(`Swapping (${r1},${c1}) with (${r2},${c2})`);
  let temp = board[r1][c1];
  board[r1][c1] = board[r2][c2];
  board[r2][c2] = temp;

  // Update blank position tracker *after* the swap
  if (board[r1][c1] === -1) {
    blankRow = r1;
    blankCol = c1;
    // console.log(`Blank is now at (${blankRow},${blankCol})`);
  } else if (board[r2][c2] === -1) {
    blankRow = r2;
    blankCol = c2;
    // console.log(`Blank is now at (${blankRow},${blankCol})`);
  }
}

// Checks if the current board configuration matches the solved state
function checkSolved() {
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      let expectedId;
      // The last spot should be the blank space (-1) in the solved state
      if (r === gridSize - 1 && c === gridSize - 1) {
        expectedId = -1; // Expect blank space here
      } else {
        expectedId = r * gridSize + c; // Expect tile ID
      }
      // Check if the tile ID matches the expected ID for this position
      if (board[r][c] !== expectedId) {
          // console.log(`Not solved: mismatch at (${r},${c}). Found ${board[r][c]}, expected ${expectedId}`);
          return false;
      }
    }
  }
  console.log("Puzzle Solved!");
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
  let targetRow = -1; // Tile to move INTO the blank space
  let targetCol = -1;

  // Determine which adjacent tile to move based on key press
  if (keyCode === UP_ARROW && blankRow < gridSize - 1) {
    // Move tile BELOW blank UP into the blank space
    targetRow = blankRow + 1;
    targetCol = blankCol;
    moved = true;
  } else if (keyCode === DOWN_ARROW && blankRow > 0) {
    // Move tile ABOVE blank DOWN into the blank space
    targetRow = blankRow - 1;
    targetCol = blankCol;
    moved = true;
  } else if (keyCode === LEFT_ARROW && blankCol < gridSize - 1) {
    // Move tile RIGHT of blank LEFT into the blank space
    targetRow = blankRow;
    targetCol = blankCol + 1;
    moved = true;
  } else if (keyCode === RIGHT_ARROW && blankCol > 0) {
    // Move tile LEFT of blank RIGHT into the blank space
    targetRow = blankRow;
    targetCol = blankCol - 1;
    moved = true;
  }

  if (moved && targetRow !== -1) {
    // A valid move direction was pressed

    // Swap the target tile with the current blank space
    swapTiles(blankRow, blankCol, targetRow, targetCol);

    // Start timer on the very first valid move
    if (!firstMoveMade) {
      firstMoveMade = true;
      startTimer();
      console.log("Timer started on first move.");
    }

    // Check if the puzzle is solved after the move
    if (checkSolved()) {
      setGameState('solved');
      stopTimer();
    }

    // Attempt to remove focus from any focused UI element (like slider)
    // This allows subsequent arrow key presses to control the puzzle, not the UI.
    if (document.activeElement && document.activeElement !== document.body) {
        document.activeElement.blur();
    }
  }

  // Return false to try and prevent default browser behavior (scrolling)
  // for the arrow keys when the game is active.
  if ([UP_ARROW, DOWN_ARROW, LEFT_ARROW, RIGHT_ARROW].includes(keyCode) && gameState === 'playing') {
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
    if (timer.isRunning) {
        timer.isRunning = false;
        // Capture final elapsed time precisely
        timer.elapsedTime = millis() - timer.startTime;
        console.log(`Timer stopped. Final time: ${timer.elapsedTime} ms`);
    }
}

// Draws the timer display below the board
function drawTimer(isSolved = false) {
    // Position timer centrally below the board area, slightly above the UI container
    let timerY = boardY + boardSize + UI_VERTICAL_GAP + 5; // Adjusted position

    // Format time as M:SS.ss
    let totalSeconds = timer.elapsedTime / 1000;
    let minutes = floor(totalSeconds / 60);
    let seconds = totalSeconds % 60;
    // Use nf() (number format) to pad with leading zeros for seconds and specify decimal places
    let formattedTime = `${minutes}:${nf(seconds, 2, 2)}`;

    push(); // Isolate text styles
    textAlign(CENTER, TOP);
    textSize(24); // Slightly larger timer text

    // Flashing effect when solved
    if (isSolved) {
        // Flash alpha using a sine wave for smooth blinking
        let alpha = map(sin(millis() / 150.0), -1, 1, 100, 255); // Adjust speed with divisor
        fill(50, 255, 50, alpha); // Bright Green flashing text
        stroke(0, 100); // Subtle dark outline for flashing text
        strokeWeight(1);
    } else {
        fill(240); // White text when running or stopped normally
        noStroke();
    }

    text(formattedTime, width / 2, timerY);
    pop(); // Restore styles
}


// --- Window Resizing ---

// Handles window resize events
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  console.log(`Window resized to ${windowWidth}x${windowHeight}`);

  // Recalculate layout based on new dimensions
  calculateLayout();

  // Reposition UI elements based on the current game state and new layout
  if (gameState === 'splash') {
      positionSplashUI();
  } else if (gameState === 'playing' || gameState === 'solved') {
      // Reposition the main UI container
      positionGameUI();
      // Child elements within the container should adjust due to flexbox/centering
  }

  // The draw loop will automatically handle redrawing the board
  // with the new dimensions (boardX, boardY, boardSize, tileSize)
  // No need to explicitly re-crop or re-initialize tiles unless image source changes.
}