// Image Sliding Puzzle Game
// A p5.js implementation of a classic sliding puzzle with variable grid size and custom image support

// Global variables
let img; // Stores the current image
let defaultImg; // Stores the default image
let tiles = []; // Array to store puzzle tiles
let gridSize = 4; // Default grid size (4x4)
let tileSize; // Size of each tile (calculated based on canvas size and grid size)
let blankPos; // Position of the blank tile
let puzzleWidth; // Width of the puzzle area
let puzzleX; // X position of the puzzle (for centering)
let puzzleY; // Y position of the puzzle (for spacing from top)
let isSolved = false; // Flag to track if puzzle is solved
let gameStarted = false; // Flag to track if game has started
let firstMove = false; // Flag to track if first move has been made
let startTime; // Time when the first move was made
let elapsedTime = 0; // Elapsed time in milliseconds
let timerFlashInterval; // Interval for flashing timer when solved
let timerAlpha = 255; // Alpha value for timer flashing effect
let splashScreen = true; // Flag to show splash screen
let loadingScreen = false; // Flag to show loading screen
let uploadButton; // File input element for uploading custom images
let uploadLabel; // Label for the file input
let resetButton; // Button to reset/shuffle the puzzle
let gridSizeSlider; // Slider to adjust grid size
let gridSizeLabel; // Label to display current grid size
let defaultButton; // Button to use default image
let uploadImageButton; // Button to trigger file upload dialog
let defaultImageLoaded = false; // Flag to track if default image loaded successfully

// p5.js preload function - runs before setup
function preload() {
  // Try to load the default image
  defaultImg = loadImage('./../../ref/realtree.jpg', 
    // Success callback
    () => { 
      defaultImageLoaded = true;
      console.log("Default image loaded successfully");
    },
    // Error callback
    () => {
      console.log("Failed to load default image");
    }
  );
}

// p5.js setup function - runs once at the beginning
function setup() {
  // Create a full-window canvas
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.style('display', 'block');
  
  // Set default values
  img = defaultImg;
  puzzleWidth = min(windowWidth * 0.8, windowHeight * 0.6);
  puzzleX = (windowWidth - puzzleWidth) / 2;
  puzzleY = windowHeight * 0.1;
  
  // Create UI elements
  createUIElements();
  
  // Initial UI visibility management
  setUIVisibility(false);
  
  // Ensure text is centered
  textAlign(CENTER, CENTER);
  imageMode(CENTER);
}

// Creates all UI elements
function createUIElements() {
  // Calculate positions
  let uiY = puzzleY + puzzleWidth + 30;
  let buttonWidth = 150;
  let buttonHeight = 40;
  let uiSpacing = 20;
  
  // Create slider for grid size
  gridSizeSlider = createSlider(2, 10, gridSize, 1);
  gridSizeSlider.position(width/2 - 100, uiY);
  gridSizeSlider.style('width', '200px');
  gridSizeSlider.input(handleSliderChange);
  
  // Create grid size label
  gridSizeLabel = createP(`Grid Size: ${gridSize}x${gridSize}`);
  gridSizeLabel.position(width/2 - 100, uiY - 30);
  gridSizeLabel.style('text-align', 'center');
  gridSizeLabel.style('width', '200px');
  
  // Create reset button
  resetButton = createButton('Shuffle / Reset');
  resetButton.position(width/2 - buttonWidth/2, uiY + 40);
  resetButton.size(buttonWidth, buttonHeight);
  resetButton.mousePressed(resetPuzzle);
  
  // Create file input for custom image upload
  uploadButton = createFileInput(handleImageUpload);
  uploadButton.position(width/2 - buttonWidth/2, uiY + 120);
  uploadButton.size(buttonWidth);
  
  // Create upload label
  uploadLabel = createP('Upload Custom Image:');
  uploadLabel.position(width/2 - 100, uiY + 80);
  uploadLabel.style('text-align', 'center');
  uploadLabel.style('width', '200px');
  
  // Create splash screen buttons
  defaultButton = createButton('Use Default');
  defaultButton.position(width/2 - buttonWidth - uiSpacing, height/2 + 50);
  defaultButton.size(buttonWidth, buttonHeight);
  defaultButton.mousePressed(() => {
    useSplashOption('default');
  });
  if (!defaultImageLoaded) {
    defaultButton.attribute('disabled', '');
  }
  
  uploadImageButton = createButton('Upload Image');
  uploadImageButton.position(width/2 + uiSpacing, height/2 + 50);
  uploadImageButton.size(buttonWidth, buttonHeight);
  uploadImageButton.mousePressed(() => {
    useSplashOption('upload');
  });
}

// Sets visibility of UI elements
function setUIVisibility(visible) {
  const elements = [gridSizeSlider, gridSizeLabel, resetButton, uploadButton, uploadLabel];
  for (let el of elements) {
    if (visible) {
      el.show();
    } else {
      el.hide();
    }
  }
  
  // Splash screen buttons
  if (splashScreen) {
    defaultButton.show();
    uploadImageButton.show();
  } else {
    defaultButton.hide();
    uploadImageButton.hide();
  }
}

// Handle splash screen option selection
function useSplashOption(option) {
  splashScreen = false;
  loadingScreen = true;
  
  if (option === 'default') {
    if (defaultImageLoaded) {
      img = defaultImg;
      setTimeout(() => {
        initPuzzle();
        loadingScreen = false;
        setUIVisibility(true);
      }, 500); // Short delay for visual feedback
    }
  } else if (option === 'upload') {
    // Trigger file input dialog
    uploadButton.elt.click();
    // The rest will be handled by handleImageUpload
  }
  
  // Hide splash buttons
  defaultButton.hide();
  uploadImageButton.hide();
}

// Handle image upload
function handleImageUpload(file) {
  if (file.type === 'image') {
    loadingScreen = true;
    splashScreen = false;
    
    // Load the uploaded image
    loadImage(file.data, (loadedImg) => {
      img = loadedImg;
      initPuzzle();
      loadingScreen = false;
      setUIVisibility(true);
    });
  } else {
    alert('Please upload an image file (JPG, PNG, GIF, WebP).');
    // If no valid file selected and we're on splash screen, show buttons again
    if (splashScreen) {
      defaultButton.show();
      uploadImageButton.show();
    }
  }
}

// Handle slider change for grid size
function handleSliderChange() {
  // Get new grid size from slider
  gridSize = gridSizeSlider.value();
  gridSizeLabel.html(`Grid Size: ${gridSize}x${gridSize}`);
  
  // Reset puzzle with new grid size
  if (img) {
    resetPuzzle();
  }
  
  // Ensure slider doesn't keep focus (to avoid arrow key issues)
  gridSizeSlider.elt.blur();
}

// Initialize or reset the puzzle
function initPuzzle() {
  // Calculate tile size based on puzzle width and grid size
  tileSize = puzzleWidth / gridSize;
  
  // Reset game state
  tiles = [];
  isSolved = false;
  gameStarted = true;
  firstMove = false;
  elapsedTime = 0;
  
  // Clear any existing timer flash interval
  if (timerFlashInterval) {
    clearInterval(timerFlashInterval);
  }
  
  // Create and shuffle tiles
  createTiles();
  shuffleTiles();
}

// Create tiles from the image
function createTiles() {
  // Create a temporary graphics buffer to process the image
  let cropSize = min(img.width, img.height);
  let cropX = (img.width - cropSize) / 2;
  let cropY = (img.height - cropSize) / 2;
  
  // Create tiles array
  tiles = [];
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      // Last tile is the blank space
      if (i === gridSize - 1 && j === gridSize - 1) {
        blankPos = { i, j };
        tiles.push({
          i, j,
          correctI: i,
          correctJ: j,
          isBlank: true
        });
      } else {
        // Calculate source coordinates in the original image
        let sx = cropX + (j * cropSize / gridSize);
        let sy = cropY + (i * cropSize / gridSize);
        let sw = cropSize / gridSize;
        let sh = cropSize / gridSize;
        
        // Create tile object
        tiles.push({
          i, j,
          correctI: i,
          correctJ: j,
          sx, sy, sw, sh,
          isBlank: false
        });
      }
    }
  }
}

// Shuffle tiles ensuring puzzle is solvable
function shuffleTiles() {
  // First, perform a large number of random moves
  // This ensures the puzzle is always solvable
  let lastDir = null;
  const moves = gridSize * gridSize * 20; // Number of random moves
  
  for (let move = 0; move < moves; move++) {
    let possibleDirs = [];
    
    // Check which directions are valid
    if (blankPos.i > 0) possibleDirs.push('UP');
    if (blankPos.i < gridSize - 1) possibleDirs.push('DOWN');
    if (blankPos.j > 0) possibleDirs.push('LEFT');
    if (blankPos.j < gridSize - 1) possibleDirs.push('RIGHT');
    
    // Filter out the opposite of the last direction to avoid undoing moves
    if (lastDir) {
      if (lastDir === 'UP') possibleDirs = possibleDirs.filter(dir => dir !== 'DOWN');
      if (lastDir === 'DOWN') possibleDirs = possibleDirs.filter(dir => dir !== 'UP');
      if (lastDir === 'LEFT') possibleDirs = possibleDirs.filter(dir => dir !== 'RIGHT');
      if (lastDir === 'RIGHT') possibleDirs = possibleDirs.filter(dir => dir !== 'LEFT');
    }
    
    // Choose a random direction
    const dir = possibleDirs[floor(random(possibleDirs.length))];
    
    // Move the blank tile
    if (dir === 'UP') moveTile(blankPos.i - 1, blankPos.j, false);
    if (dir === 'DOWN') moveTile(blankPos.i + 1, blankPos.j, false);
    if (dir === 'LEFT') moveTile(blankPos.i, blankPos.j - 1, false);
    if (dir === 'RIGHT') moveTile(blankPos.i, blankPos.j + 1, false);
    
    lastDir = dir;
  }
  
  // Reset the game start time flag
  firstMove = false;
}

// Move a tile to the blank space
function moveTile(i, j, isUserMove = true) {
  // Find the tile at the given position
  let tileIndex = -1;
  for (let idx = 0; idx < tiles.length; idx++) {
    if (tiles[idx].i === i && tiles[idx].j === j) {
      tileIndex = idx;
      break;
    }
  }
  
  // If no tile found or not adjacent to blank, return
  if (tileIndex === -1) return false;
  
  const tile = tiles[tileIndex];
  
  // Check if the tile is adjacent to the blank space
  const isAdjacent = (
    (Math.abs(tile.i - blankPos.i) === 1 && tile.j === blankPos.j) ||
    (Math.abs(tile.j - blankPos.j) === 1 && tile.i === blankPos.i)
  );
  
  if (!isAdjacent) return false;
  
  // If this is the first move by the user, start the timer
  if (isUserMove && !firstMove && !isSolved) {
    firstMove = true;
    startTime = millis();
  }
  
  // Swap positions with blank tile
  [tile.i, blankPos.i] = [blankPos.i, tile.i];
  [tile.j, blankPos.j] = [blankPos.j, tile.j];
  
  // Check if puzzle is solved after the move
  checkSolution();
  
  return true;
}

// Check if the puzzle is solved
function checkSolution() {
  if (isSolved) return; // Already solved
  
  for (let tile of tiles) {
    if (tile.i !== tile.correctI || tile.j !== tile.correctJ) {
      return; // At least one tile is out of place
    }
  }
  
  // If we get here, puzzle is solved
  isSolved = true;
  
  // Stop timer and start flashing effect
  if (firstMove) {
    elapsedTime = millis() - startTime;
    
    // Set up timer flashing
    timerFlashInterval = setInterval(() => {
      timerAlpha = timerAlpha === 255 ? 128 : 255;
    }, 500);
  }
}

// Reset/Shuffle the puzzle
function resetPuzzle() {
  if (img) {
    initPuzzle();
  }
}

// Handle keyboard input
function keyPressed() {
  if (!gameStarted || isSolved || loadingScreen || splashScreen) return;
  
  if (keyCode === UP_ARROW && blankPos.i < gridSize - 1) {
    moveTile(blankPos.i + 1, blankPos.j);
  } else if (keyCode === DOWN_ARROW && blankPos.i > 0) {
    moveTile(blankPos.i - 1, blankPos.j);
  } else if (keyCode === LEFT_ARROW && blankPos.j < gridSize - 1) {
    moveTile(blankPos.i, blankPos.j + 1);
  } else if (keyCode === RIGHT_ARROW && blankPos.j > 0) {
    moveTile(blankPos.i, blankPos.j - 1);
  }
  
  // Ensure focus is not on any UI element to prevent arrow keys from affecting them
  document.activeElement.blur();
  return false; // Prevent default behavior
}

// Update UI positioning for window resize
function updateUIPositions() {
  let uiY = puzzleY + puzzleWidth + 30;
  let buttonWidth = 150;
  let buttonHeight = 40;
  let uiSpacing = 20;
  
  // Update UI positions
  gridSizeSlider.position(width/2 - 100, uiY);
  gridSizeLabel.position(width/2 - 100, uiY - 30);
  resetButton.position(width/2 - buttonWidth/2, uiY + 40);
  uploadButton.position(width/2 - buttonWidth/2, uiY + 120);
  uploadLabel.position(width/2 - 100, uiY + 80);
  
  // Update splash screen buttons if visible
  defaultButton.position(width/2 - buttonWidth - uiSpacing, height/2 + 50);
  uploadImageButton.position(width/2 + uiSpacing, height/2 + 50);
}

// Handle window resize
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  
  // Recalculate puzzle dimensions
  puzzleWidth = min(windowWidth * 0.8, windowHeight * 0.6);
  puzzleX = (windowWidth - puzzleWidth) / 2;
  puzzleY = windowHeight * 0.1;
  
  // Update tile size
  if (gameStarted) {
    tileSize = puzzleWidth / gridSize;
  }
  
  // Update UI positions
  updateUIPositions();
}

// Format time as M:SS.ss
function formatTime(ms) {
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(2);
  return `${minutes}:${seconds.padStart(5, '0')}`;
}

// p5.js draw function - runs continuously
function draw() {
  background(240);
  
  // Handle different screens
  if (splashScreen) {
    drawSplashScreen();
  } else if (loadingScreen) {
    drawLoadingScreen();
  } else if (gameStarted) {
    drawPuzzle();
    drawTimer();
  }
}

// Draw splash screen
function drawSplashScreen() {
  textSize(40);
  fill(0);
  text("welcome to imgpzl", width/2, height/2 - 50);
  
  textSize(20);
  text("use the default image or upload your own?", width/2, height/2);
}

// Draw loading screen
function drawLoadingScreen() {
  textSize(24);
  fill(0);
  text("loading puzzle...", width/2, height/2);
}

// Draw the puzzle
function drawPuzzle() {
  // Draw background for puzzle area
  fill(200);
  noStroke();
  rect(puzzleX, puzzleY, puzzleWidth, puzzleWidth);
  
  // Draw tiles
  for (let tile of tiles) {
    if (!tile.isBlank || isSolved) { // Show the blank tile if puzzle is solved
      // Calculate position on canvas
      let x = puzzleX + tile.j * tileSize;
      let y = puzzleY + tile.i * tileSize;
      
      // Draw image tile
      image(
        img,
        x + tileSize/2,  // Center x position of the target rectangle
        y + tileSize/2,  // Center y position of the target rectangle
        tileSize,        // Width of the target rectangle
        tileSize,        // Height of the target rectangle
        tile.sx,         // Source x position in the original image
        tile.sy,         // Source y position in the original image
        tile.sw,         // Source width in the original image
        tile.sh          // Source height in the original image
      );
    }
  }
  
  // If solved, draw overlay and text
  if (isSolved) {
    // Semi-transparent green overlay
    fill(0, 200, 0, 80);
    noStroke();
    rect(puzzleX, puzzleY, puzzleWidth, puzzleWidth);
    
    // "SOLVED!" text
    textSize(min(80, puzzleWidth/6));
    fill(255);
    text("SOLVED!", puzzleX + puzzleWidth/2, puzzleY + puzzleWidth/2);
  }
}

// Draw the timer
function drawTimer() {
  textSize(24);
  
  if (isSolved) {
    // Flashing green timer for solved state
    fill(0, 150, 0, timerAlpha);
  } else if (firstMove) {
    // Regular timer during play
    fill(0);
  } else {
    // Timer not started yet
    fill(100);
  }
  
  // Calculate current elapsed time
  let displayTime;
  if (firstMove && !isSolved) {
    displayTime = formatTime(millis() - startTime);
  } else {
    displayTime = formatTime(elapsedTime);
  }
  
  // Display timer text
  text(displayTime, width/2, puzzleY + puzzleWidth + 15);
}