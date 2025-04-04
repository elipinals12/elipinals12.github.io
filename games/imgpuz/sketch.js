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
let uploadButtonVisible; // Visible button for uploading
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
  
  // Calculate appropriate puzzle size based on screen dimensions
  // Ensure puzzle doesn't take up too much vertical space to leave room for UI
  const maxPuzzleHeight = windowHeight * 0.6;
  const maxPuzzleWidth = windowWidth * 0.8;
  puzzleWidth = min(maxPuzzleWidth, maxPuzzleHeight);
  
  // Center the puzzle
  puzzleX = (windowWidth - puzzleWidth) / 2;
  puzzleY = windowHeight * 0.1;
  
  // Create UI elements
  createUIElements();
  
  // Initial UI visibility management
  setUIVisibility(false);
  
  // Run window resize calculations immediately to set proper layout
  windowResized();
  
  // Ensure text is centered
  textAlign(CENTER, CENTER);
  // Default to CENTER image mode, but will switch to CORNER when needed
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
  gridSizeSlider.style('background-color', '#444');
  gridSizeSlider.style('accent-color', '#0c9');
  gridSizeSlider.input(handleSliderChange);
  
  // Create grid size label
  gridSizeLabel = createP(`Grid Size: ${gridSize}x${gridSize}`);
  gridSizeLabel.position(width/2 - 100, uiY - 30);
  gridSizeLabel.style('text-align', 'center');
  gridSizeLabel.style('width', '200px');
  gridSizeLabel.style('color', '#ccc');
  
  // Create reset button
  resetButton = createButton('Shuffle / Reset');
  resetButton.position(width/2 - buttonWidth/2, uiY + 40);
  resetButton.size(buttonWidth, buttonHeight);
  resetButton.style('background-color', '#333');
  resetButton.style('color', '#fff');
  resetButton.style('border', '1px solid #555');
  resetButton.style('border-radius', '4px');
  resetButton.style('cursor', 'pointer');
  resetButton.mousePressed(resetPuzzle);
  
  // Create a real button for "Upload Custom Image" that will trigger file selection
  // This button is identical to the other buttons visually
  let uploadButtonContainer = createDiv();
  uploadButtonContainer.position(width/2 - buttonWidth/2, uiY + 100);
  uploadButtonContainer.size(buttonWidth, buttonHeight);
  uploadButtonContainer.style('position', 'relative');
  
  // Create visible button
  uploadButtonVisible = createButton('Upload Custom Image');
  uploadButtonVisible.parent(uploadButtonContainer);
  uploadButtonVisible.size(buttonWidth, buttonHeight);
  uploadButtonVisible.style('background-color', '#333');
  uploadButtonVisible.style('color', '#fff');
  uploadButtonVisible.style('border', '1px solid #555');
  uploadButtonVisible.style('border-radius', '4px');
  uploadButtonVisible.style('cursor', 'pointer');
  uploadButtonVisible.style('width', '100%');
  uploadButtonVisible.style('height', '100%');
  uploadButtonVisible.style('position', 'absolute');
  uploadButtonVisible.style('top', '0');
  uploadButtonVisible.style('left', '0');
  uploadButtonVisible.style('z-index', '1');
  
  // Hidden file input behind the visible button
  uploadButton = createFileInput(handleImageUpload);
  uploadButton.parent(uploadButtonContainer);
  uploadButton.size(buttonWidth, buttonHeight);
  uploadButton.style('opacity', '0');
  uploadButton.style('position', 'absolute');
  uploadButton.style('top', '0');
  uploadButton.style('left', '0');
  uploadButton.style('width', '100%');
  uploadButton.style('height', '100%');
  uploadButton.style('cursor', 'pointer');
  uploadButton.style('z-index', '2'); // Place above the visible button to receive clicks
  
  // Make the visible button click trigger the file input
  uploadButtonVisible.mousePressed(() => {
    uploadButton.elt.click();
  });
  
  // Create splash screen buttons
  defaultButton = createButton('Use Default');
  defaultButton.position(width/2 - buttonWidth - uiSpacing, height/2 + 50);
  defaultButton.size(buttonWidth, buttonHeight);
  defaultButton.style('background-color', '#333');
  defaultButton.style('color', '#fff');
  defaultButton.style('border', '1px solid #555');
  defaultButton.style('border-radius', '4px');
  defaultButton.style('cursor', 'pointer');
  defaultButton.mousePressed(() => {
    useSplashOption('default');
  });
  if (!defaultImageLoaded) {
    defaultButton.attribute('disabled', '');
    defaultButton.style('background-color', '#222');
    defaultButton.style('color', '#777');
    defaultButton.style('cursor', 'not-allowed');
  }
  
  uploadImageButton = createButton('Upload Image');
  uploadImageButton.position(width/2 + uiSpacing, height/2 + 50);
  uploadImageButton.size(buttonWidth, buttonHeight);
  uploadImageButton.style('background-color', '#333');
  uploadImageButton.style('color', '#fff');
  uploadImageButton.style('border', '1px solid #555');
  uploadImageButton.style('border-radius', '4px');
  uploadImageButton.style('cursor', 'pointer');
  uploadImageButton.mousePressed(() => {
    useSplashOption('upload');
  });
}

// Sets visibility of UI elements
function setUIVisibility(visible) {
  const elements = [gridSizeSlider, gridSizeLabel, resetButton, uploadButton, uploadButtonVisible];
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
  let newGridSize = gridSizeSlider.value();
  
  // Only reset if grid size actually changed
  if (newGridSize !== gridSize) {
    gridSize = newGridSize;
    gridSizeLabel.html(`Grid Size: ${gridSize}x${gridSize}`);
    
    // Reset puzzle with new grid size
    if (img) {
      resetPuzzle(true); // Force shuffle for small grid sizes
    }
  }
  
  // Ensure slider doesn't keep focus (to avoid arrow key issues)
  gridSizeSlider.elt.blur();
}

// Initialize or reset the puzzle
function initPuzzle(forceNewShuffle = false) {
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
  shuffleTiles(forceNewShuffle);
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
function shuffleTiles(forceNewShuffle = false) {
  // Reset tiles to their initial positions first
  resetTilePositions();
  
  // Ensure isSolved is false when starting to shuffle
  isSolved = false;
  
  // Perform a large number of random valid moves from the solved state
  // This guarantees a solvable puzzle because we start from solved
  // and only make valid moves
  const numMoves = 1000; // Large number of random moves
  let lastDir = null;
  
  // Execute random moves
  for (let move = 0; move < numMoves; move++) {
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
  
  // After all the moves, check if we accidentally ended up solved again
  // (can happen with small grids or by random chance)
  checkSolution();
  
  // If we ended up solved again, make one more move to ensure it's not solved
  if (isSolved) {
    let moveMade = false;
    
    // Try each direction until a valid move is made
    if (blankPos.i > 0 && !moveMade) {
      moveTile(blankPos.i - 1, blankPos.j, false);
      moveMade = true;
    }
    if (blankPos.i < gridSize - 1 && !moveMade) {
      moveTile(blankPos.i + 1, blankPos.j, false);
      moveMade = true;
    }
    if (blankPos.j > 0 && !moveMade) {
      moveTile(blankPos.i, blankPos.j - 1, false);
      moveMade = true;
    }
    if (blankPos.j < gridSize - 1 && !moveMade) {
      moveTile(blankPos.i, blankPos.j + 1, false);
      moveMade = true;
    }
    
    // Force isSolved to false
    isSolved = false;
  }
  
  // Reset the game start time flag
  firstMove = false;
}

// Reset tiles to their starting positions
function resetTilePositions() {
  for (let tile of tiles) {
    tile.i = tile.correctI;
    tile.j = tile.correctJ;
    
    // Update blank position
    if (tile.isBlank) {
      blankPos = { i: tile.i, j: tile.j };
    }
  }
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
  
  // Check each tile's position to see if it matches its correct position
  let allCorrect = true;
  for (let tile of tiles) {
    if (tile.i !== tile.correctI || tile.j !== tile.correctJ) {
      allCorrect = false;
      break; // At least one tile is out of place
    }
  }
  
  // If all tiles are in correct position, puzzle is solved
  if (allCorrect) {
    isSolved = true;
    
    // Stop timer and start flashing effect
    if (firstMove) {
      elapsedTime = millis() - startTime;
      
      // Set up timer flashing
      timerFlashInterval = setInterval(() => {
        timerAlpha = timerAlpha === 255 ? 128 : 255;
      }, 500);
    }
  } else {
    // Make sure it's not solved if tiles are not in correct position
    isSolved = false;
  }
}

// Reset/Shuffle the puzzle
function resetPuzzle(forceNewShuffle = false) {
  if (img) {
    initPuzzle(forceNewShuffle);
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
  // Calculate minimum spacing from bottom of puzzle to first UI element
  const timerSpace = 35; // Space for timer text
  const minSpacingAfterTimer = 40; // Space between timer and first UI control
  
  // First calculate where the UI should start (after puzzle + timer + spacing)
  let uiY = puzzleY + puzzleWidth + timerSpace + minSpacingAfterTimer;
  
  let buttonWidth = 150;
  let buttonHeight = 40;
  let uiSpacing = 20;
  let elementGap = 40; // Space between UI elements
  
  // Position slider at the calculated position
  gridSizeSlider.position(width/2 - 100, uiY);
  
  // Position grid size label with adequate spacing above slider
  gridSizeLabel.position(width/2 - 100, uiY - 30);
  
  // Position reset button with spacing below slider
  let resetY = uiY + elementGap;
  resetButton.position(width/2 - buttonWidth/2, resetY);
  
  // Position upload button (container) with spacing below reset button
  let uploadButtonY = resetY + buttonHeight + elementGap;
  try {
    // This may fail initially before uploadButtonVisible is defined
    let uploadContainer = uploadButtonVisible.parent();
    uploadContainer.position(width/2 - buttonWidth/2, uploadButtonY);
  } catch (e) {
    // If error, try direct positioning (fallback)
    if (uploadButton) {
      uploadButton.position(width/2 - buttonWidth/2, uploadButtonY);
    }
  }
  
  // Update splash screen buttons if visible
  defaultButton.position(width/2 - buttonWidth - uiSpacing, height/2 + 50);
  uploadImageButton.position(width/2 + uiSpacing, height/2 + 50);
  
  // Check if UI extends beyond window height and adjust puzzle size if needed
  const lastElementBottom = uploadButtonY + buttonHeight + 20; // Bottom of the last UI element + margin
  if (lastElementBottom > height - 20) {
    // Calculate how much we need to reduce puzzle size
    const reduction = lastElementBottom - (height - 20);
    puzzleWidth = max(200, puzzleWidth - reduction);
    tileSize = puzzleWidth / gridSize;
    
    // Recalculate positions with new puzzle size
    uiY = puzzleY + puzzleWidth + timerSpace + minSpacingAfterTimer;
    
    // Update all positions
    gridSizeSlider.position(width/2 - 100, uiY);
    gridSizeLabel.position(width/2 - 100, uiY - 30);
    resetY = uiY + elementGap;
    resetButton.position(width/2 - buttonWidth/2, resetY);
    uploadButtonY = resetY + buttonHeight + elementGap;
    
    try {
      let uploadContainer = uploadButtonVisible.parent();
      uploadContainer.position(width/2 - buttonWidth/2, uploadButtonY);
    } catch (e) {
      if (uploadButton) {
        uploadButton.position(width/2 - buttonWidth/2, uploadButtonY);
      }
    }
  }
}

// Handle window resize
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  
  // Recalculate puzzle dimensions
  // Leave adequate space for UI elements (approx 250px)
  const availableHeight = windowHeight - 250;
  puzzleWidth = min(windowWidth * 0.8, availableHeight * 0.8);
  
  // Ensure puzzle is not too small
  puzzleWidth = max(puzzleWidth, 200);
  
  // Center the puzzle
  puzzleX = (windowWidth - puzzleWidth) / 2;
  puzzleY = max(windowHeight * 0.05, 20); // Ensure some minimum top margin
  
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
  background(30); // Dark background
  
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
  fill(200); // Light text for dark mode
  text("welcome to imgpzl", width/2, height/2 - 50);
  
  textSize(20);
  fill(180); // Light text for dark mode
  text("use the default image or upload your own?", width/2, height/2);
}

// Draw loading screen
function drawLoadingScreen() {
  textSize(24);
  fill(200); // Light text for dark mode
  text("loading puzzle...", width/2, height/2);
}

// Draw the puzzle
function drawPuzzle() {
  // Draw background for puzzle area
  fill(50); // Darker background for puzzle area
  stroke(100); // Subtle border
  strokeWeight(1);
  rect(puzzleX, puzzleY, puzzleWidth, puzzleWidth);
  
  if (isSolved) {
    // If solved, draw the complete image rather than tiles
    push();
    imageMode(CORNER);
    
    // Calculate crop dimensions to get a square from the center of the image
    let cropSize = min(img.width, img.height);
    let cropX = (img.width - cropSize) / 2;
    let cropY = (img.height - cropSize) / 2;
    
    // Draw the complete image in the puzzle area
    image(
      img,
      puzzleX,           // X position of puzzle area
      puzzleY,           // Y position of puzzle area
      puzzleWidth,       // Width of puzzle area
      puzzleWidth,       // Height of puzzle area
      cropX,             // Source x position in the original image
      cropY,             // Source y position in the original image
      cropSize,          // Source width in the original image
      cropSize           // Source height in the original image
    );
    pop();
    
    // "SOLVED!" text above the puzzle with dark mode friendly color
    textSize(min(40, puzzleWidth/10));
    fill(0, 255, 150); // Brighter green for dark mode
    text("SOLVED!", puzzleX + puzzleWidth/2, puzzleY - 30); // Increased spacing
  } else {
    // Draw tiles when not solved
    for (let tile of tiles) {
      if (!tile.isBlank) { // Don't draw the blank tile
        // Calculate position on canvas
        let x = puzzleX + tile.j * tileSize;
        let y = puzzleY + tile.i * tileSize;
        
        // For Firefox compatibility, ensure we're using CORNER mode for image drawing
        push();
        imageMode(CORNER);
        
        // Draw image tile
        image(
          img,
          x,                // X position in CORNER mode
          y,                // Y position in CORNER mode
          tileSize,         // Width of the target rectangle
          tileSize,         // Height of the target rectangle
          tile.sx,          // Source x position in the original image
          tile.sy,          // Source y position in the original image
          tile.sw,          // Source width in the original image
          tile.sh           // Source height in the original image
        );
        
        pop();
      }
    }
  }
}

// Draw the timer
function drawTimer() {
  textSize(24);
  
  if (isSolved) {
    // Flashing green timer for solved state - brighter for dark mode
    fill(0, 255, 100, timerAlpha);
  } else if (firstMove) {
    // Regular timer during play
    fill(220); // Light color for dark mode
  } else {
    // Timer not started yet
    fill(150); // Medium light color for dark mode
  }
  
  // Calculate current elapsed time
  let displayTime;
  if (firstMove && !isSolved) {
    displayTime = formatTime(millis() - startTime);
  } else {
    displayTime = formatTime(elapsedTime);
  }
  
  // FIXED POSITIONING: Place timer at a fixed offset below the puzzle
  // regardless of other UI elements - this ensures it never overlaps
  let fixedTimerY = puzzleY + puzzleWidth + 30;
  
  // Calculate bottom edge of puzzle
  let puzzleBottom = puzzleY + puzzleWidth;
  
  // Display timer text at a FIXED distance from the puzzle
  text(displayTime, width/2, puzzleBottom + 30);
}