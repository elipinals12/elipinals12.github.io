// Global variables for game state and UI elements
let defaultImg;           // Default image loaded in preload
let currentImg;           // Current image in use (default or uploaded)
let gridSize;             // Size of the puzzle grid (e.g., 4 for 4x4)
let tiles;                // Array of tile objects with image and correct position
let currentOrder;         // Array representing current tile positions
let blankPos;             // Index of the blank tile's current position
let timerStarted = false; // Whether the timer has started
let startTime;            // Timestamp when timer starts
let finalTime;            // Final time when puzzle is solved
let gameState;            // Current state: 'splash', 'loading', 'playing', 'solved'
// UI elements
let slider, gridSizeLabel, resetButton, uploadButton, timerDisplay, fileInput;
// Splash screen elements
let welcomeText, instructionText, useDefaultButton, uploadImageButton;

// Load the default image before setup
function preload() {
  // Attempt to load the default image; set to null if it fails
  defaultImg = loadImage('./../../ref/realtree.jpg', () => {}, () => { defaultImg = null; });
}

// Initialize the canvas and splash screen
function setup() {
  createCanvas(windowWidth, windowHeight);

  // Create splash screen elements
  welcomeText = createP('welcome to imgpzl');
  welcomeText.style('font-size', '24px');
  instructionText = createP('use the default image or upload your own?');
  useDefaultButton = createButton('Use Default');
  useDefaultButton.mousePressed(useDefaultImage);
  // Disable 'Use Default' if default image failed to load
  if (!defaultImg) useDefaultButton.attribute('disabled', true);
  uploadImageButton = createButton('Upload Image');
  uploadImageButton.mousePressed(() => fileInput.elt.click());

  // Create hidden file input for custom image uploads
  fileInput = createFileInput(handleFile);
  fileInput.hide();

  // Set initial game state
  gameState = 'splash';
}

// Main rendering loop
function draw() {
  background(220); // Light gray background

  if (gameState === 'splash') {
    // Center splash screen elements
    let cx = width / 2;
    let cy = height / 2;
    welcomeText.position(cx - welcomeText.width / 2, cy - 50);
    instructionText.position(cx - instructionText.width / 2, cy - 20);
    useDefaultButton.position(cx - useDefaultButton.width - 10, cy + 10);
    uploadImageButton.position(cx + 10, cy + 10);
  } else if (gameState === 'loading') {
    // Display loading message centered
    textAlign(CENTER, CENTER);
    fill(0);
    textSize(24);
    text('loading puzzle...', width / 2, height / 2);
  } else {
    // Calculate puzzle area dimensions and position
    let uiHeight = 100; // Space for UI elements below puzzle
    let puzzleSize = min(width - 40, height - uiHeight - 40); // Leave margins
    let puzzleX = (width - puzzleSize) / 2; // Center horizontally
    let puzzleY = (height - uiHeight - puzzleSize) / 2; // Center in top portion
    let tileDrawSize = puzzleSize / gridSize; // Size of each tile on canvas

    // Render puzzle tiles
    if (gameState === 'playing') {
      // Draw all tiles except the blank one during gameplay
      for (let i = 0; i < gridSize * gridSize; i++) {
        let tile = currentOrder[i];
        if (tile !== gridSize * gridSize - 1) { // Skip blank tile
          let row = floor(i / gridSize);
          let col = i % gridSize;
          let x = puzzleX + col * tileDrawSize;
          let y = puzzleY + row * tileDrawSize;
          image(tiles[tile].img, x, y, tileDrawSize, tileDrawSize);
        }
      }
    } else if (gameState === 'solved') {
      // Draw all tiles, including the blank one, when solved
      for (let i = 0; i < gridSize * gridSize; i++) {
        let tile = currentOrder[i];
        let row = floor(i / gridSize);
        let col = i % gridSize;
        let x = puzzleX + col * tileDrawSize;
        let y = puzzleY + row * tileDrawSize;
        image(tiles[tile].img, x, y, tileDrawSize, tileDrawSize);
      }
      // Add green overlay and 'SOLVED!' text
      fill(0, 200, 0, 80);
      rect(puzzleX, puzzleY, puzzleSize, puzzleSize);
      textSize(48);
      fill(255);
      textAlign(CENTER, CENTER);
      text('SOLVED!', puzzleX + puzzleSize / 2, puzzleY + puzzleSize / 2);
    }

    // Position UI elements below puzzle
    let uiY = puzzleY + puzzleSize + 20;
    let uiX = (width - 500) / 2; // Approximate total width of UI elements
    timerDisplay.position(uiX, uiY);
    uiX += 100 + 20; // Width + spacing
    gridSizeLabel.position(uiX, uiY);
    uiX += 100 + 20;
    slider.position(uiX, uiY);
    uiX += 100 + 20;
    resetButton.position(uiX, uiY);
    uiX += 100 + 20;
    uploadButton.position(uiX, uiY);

    // Update timer display
    if (gameState === 'playing' && timerStarted) {
      let elapsed = (millis() - startTime) / 1000;
      timerDisplay.html(formatTime(elapsed));
    } else if (gameState === 'solved') {
      // Flash timer by varying alpha
      let alpha = 128 + 127 * sin(frameCount * 0.1);
      timerDisplay.style('color', `rgba(0, 200, 0, ${alpha / 255})`);
      timerDisplay.html(formatTime(finalTime));
    }
  }
}

// Use the default image when button is clicked
function useDefaultImage() {
  if (defaultImg) {
    currentImg = defaultImg;
    if (gameState === 'splash') {
      removeSplashScreen();
      createGameUI();
    }
    gameState = 'loading';
    initializePuzzle();
  }
}

// Handle file upload for custom images
function handleFile(file) {
  if (file.type === 'image') {
    loadImage(file.data, img => {
      currentImg = img;
      if (gameState === 'splash') {
        removeSplashScreen();
        createGameUI();
      }
      gameState = 'loading';
      initializePuzzle();
    });
  } else {
    console.log('Not an image file');
  }
}

// Remove splash screen elements
function removeSplashScreen() {
  welcomeText.remove();
  instructionText.remove();
  useDefaultButton.remove();
  uploadImageButton.remove();
}

// Create game UI elements
function createGameUI() {
  slider = createSlider(2, 10, 4, 1); // Range 2x2 to 10x10, default 4
  slider.input(() => {
    gridSize = slider.value();
    gridSizeLabel.html('Grid Size: ' + gridSize + 'x' + gridSize);
    initializePuzzle();
  });
  gridSizeLabel = createP('Grid Size: 4x4');
  resetButton = createButton('Shuffle / Reset');
  resetButton.mousePressed(initializePuzzle);
  uploadButton = createButton('Upload Image');
  uploadButton.mousePressed(() => fileInput.elt.click());
  timerDisplay = createP('0:00.00');
}

// Initialize or re-initialize the puzzle
function initializePuzzle() {
  gridSize = slider.value();

  // Crop image to square from center
  let minDim = min(currentImg.width, currentImg.height);
  let cropX = (currentImg.width - minDim) / 2;
  let cropY = (currentImg.height - minDim) / 2;
  let croppedImg = currentImg.get(cropX, cropY, minDim, minDim);

  // Divide image into tiles
  tiles = [];
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      let left = floor(j * minDim / gridSize);
      let top = floor(i * minDim / gridSize);
      let right = floor((j + 1) * minDim / gridSize);
      let bottom = floor((i + 1) * minDim / gridSize);
      let tileWidth = right - left;
      let tileHeight = bottom - top;
      let tileImg = croppedImg.get(left, top, tileWidth, tileHeight);
      tiles.push({ img: tileImg, correctPos: i * gridSize + j });
    }
  }

  // Initialize tile order and shuffle
  currentOrder = Array.from({ length: gridSize * gridSize }, (_, i) => i);
  shuffleTiles();
  blankPos = currentOrder.indexOf(gridSize * gridSize - 1);

  // Reset game state
  timerStarted = false;
  gameState = 'playing';
}

// Shuffle tiles into a solvable configuration
function shuffleTiles() {
  let N = gridSize * gridSize;
  let blankIndex = N - 1; // Start with blank at bottom-right
  // Perform random moves to shuffle
  for (let m = 0; m < 100 * N; m++) {
    let row = floor(blankIndex / gridSize);
    let col = blankIndex % gridSize;
    let possibleMoves = [];
    if (col > 0) possibleMoves.push('left');
    if (col < gridSize - 1) possibleMoves.push('right');
    if (row > 0) possibleMoves.push('up');
    if (row < gridSize - 1) possibleMoves.push('down');
    let move = random(possibleMoves);
    let adjacentIndex;
    if (move === 'left') adjacentIndex = blankIndex - 1;
    else if (move === 'right') adjacentIndex = blankIndex + 1;
    else if (move === 'up') adjacentIndex = blankIndex - gridSize;
    else if (move === 'down') adjacentIndex = blankIndex + gridSize;
    // Swap blank tile with adjacent tile
    [currentOrder[blankIndex], currentOrder[adjacentIndex]] = 
      [currentOrder[adjacentIndex], currentOrder[blankIndex]];
    blankIndex = adjacentIndex;
  }
}

// Move a tile based on arrow key direction
function moveTile(direction) {
  let row = floor(blankPos / gridSize);
  let col = blankPos % gridSize;
  let adjacentIndex;
  if (direction === 'left' && col > 0) adjacentIndex = blankPos - 1;
  else if (direction === 'right' && col < gridSize - 1) adjacentIndex = blankPos + 1;
  else if (direction === 'up' && row > 0) adjacentIndex = blankPos - gridSize;
  else if (direction === 'down' && row < gridSize - 1) adjacentIndex = blankPos + gridSize;
  if (adjacentIndex !== undefined) {
    // Swap blank tile with adjacent tile
    [currentOrder[blankPos], currentOrder[adjacentIndex]] = 
      [currentOrder[adjacentIndex], currentOrder[blankPos]];
    blankPos = adjacentIndex;
  }
}

// Check if the puzzle is solved
function checkSolved() {
  for (let i = 0; i < gridSize * gridSize; i++) {
    if (currentOrder[i] !== i) return false;
  }
  return true;
}

// Format time as M:SS.ss
function formatTime(seconds) {
  let minutes = floor(seconds / 60);
  let secs = seconds % 60;
  let secStr = nf(secs, 2, 2); // Two digits before and after decimal
  return `${minutes}:${secStr}`;
}

// Handle arrow key presses for tile movement
function keyPressed() {
  if (gameState === 'playing') {
    let move;
    if (keyCode === LEFT_ARROW) move = 'left';
    else if (keyCode === RIGHT_ARROW) move = 'right';
    else if (keyCode === UP_ARROW) move = 'up';
    else if (keyCode === DOWN_ARROW) move = 'down';
    if (move) {
      moveTile(move);
      // Start timer on first move
      if (!timerStarted) {
        timerStarted = true;
        startTime = millis();
      }
      // Check if puzzle is solved
      if (checkSolved()) {
        gameState = 'solved';
        finalTime = (millis() - startTime) / 1000;
      }
    }
  }
}

// Adjust canvas and elements on window resize
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}