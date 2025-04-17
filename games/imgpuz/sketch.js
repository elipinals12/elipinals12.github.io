// Image Sliding Puzzle Game
// A p5.js implementation of a classic sliding puzzle with variable grid size and custom image support

// Global variables
let img; // Stores the current image
let defaultImages = []; // Array to store all default image options
let imageNames = ["realtree.jpg", "mc.png", "aiwinner.jpg", "adam.jpg", "randomawesome.jpg"]; // Array of image filenames - easily expandable
let imageLoaded = []; // Array to track if images loaded successfully
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
let timerAlpha = 255; // Alpha value for timer flashing effect
let solvedAlpha = 255; // Alpha value for solved text flashing effect
let alphaDirection = -1; // Direction of alpha change (-1 decreasing, 1 increasing)
let alphaChangeSpeed = 5; // Speed of alpha change for smooth flashing
let splashScreen = true; // Flag to show splash screen
let loadingScreen = false; // Flag to show loading screen
let uploadButton; // File input element for uploading custom images
let uploadButtonVisible; // Visible button for uploading
let resetButton; // Button to reset/shuffle the puzzle
let gridSizeInput; // Input field for grid size
let gridSizeLabel; // Label to display current grid size
let uploadImageButton; // Button to trigger file upload dialog
// Image loading flags tracked in the imageLoaded array
let numShuffleMoves = 40; // Number of shuffle moves, dynamically updated based on grid size
let galleryArea; // Area to display the image gallery
let showingGallery = true; // Flag to show gallery at all times

// p5.js preload function - runs before setup
function preload() {
 // Initialize the imageLoaded array with false values
 imageLoaded = new Array(imageNames.length).fill(false);
 
 // Load all default images from the imageNames array - using ref/ path
 for (let i = 0; i < imageNames.length; i++) {
   defaultImages[i] = loadImage('ref/' + imageNames[i], 
     // Success callback - using IIFE to capture the current index
     ((index) => {
       return () => {
         imageLoaded[index] = true;
         console.log(`Image ${imageNames[index]} loaded successfully`);
       };
     })(i),
     // Error callback
     ((index) => {
       return () => {
         console.log(`Failed to load image ${imageNames[index]}`);
       };
     })(i)
   );
 }
}

// p5.js setup function - runs once at the beginning
function setup() {
 // Create a full-window canvas
 let canvas = createCanvas(windowWidth, windowHeight);
 canvas.style('display', 'block');
 
 // Default to first image (will be replaced when user selects one)
 img = defaultImages[0];
 
 // Calculate appropriate puzzle size based on screen dimensions
 // Ensure puzzle doesn't take up too much vertical space to leave room for UI
 const maxPuzzleHeight = height * 0.5; // Reduced for more space
 const maxPuzzleWidth = width * 0.7;
 puzzleWidth = min(maxPuzzleWidth, maxPuzzleHeight);
 
 // Center the puzzle horizontally, position vertically with space for top elements
 puzzleX = width / 2 - puzzleWidth / 2;
 // Leave more space at the top for timer and "SOLVED!" text
 puzzleY = height * 0.15;
 
 // Initialize numShuffleMoves based on default grid size
 numShuffleMoves = 10 * (gridSize * gridSize);
 
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
 
 // Create grid size label with proper vertical spacing
 gridSizeLabel = createP(`grid size: ${gridSize}×${gridSize}`);
 gridSizeLabel.position(width/2 - 100, uiY);
 gridSizeLabel.style('text-align', 'center');
 gridSizeLabel.style('width', '200px');
 gridSizeLabel.style('color', '#ccc');
 gridSizeLabel.style('margin-bottom', '25px'); // Increased margin
 
 // Create number input for grid size with more vertical space
 gridSizeInput = createInput(gridSize.toString(), 'number');
 gridSizeInput.position(width/2 - 40, uiY + 50); // Increased vertical position
 gridSizeInput.size(80, 30);
 gridSizeInput.style('text-align', 'center');
 gridSizeInput.style('background-color', '#333');
 gridSizeInput.style('color', '#fff');
 gridSizeInput.style('border', '1px solid #555');
 gridSizeInput.style('border-radius', '4px');
 gridSizeInput.attribute('min', '2');
 gridSizeInput.attribute('max', '100');
 gridSizeInput.attribute('step', '1');
 
 // Remove any previous event listeners
 if (gridSizeInput.elt.onchange) {
   gridSizeInput.elt.onchange = null;
 }
 if (gridSizeInput.elt.oninput) {
   gridSizeInput.elt.oninput = null;
 }
 if (gridSizeInput.elt.onkeydown) {
   gridSizeInput.elt.onkeydown = null;
 }
 
 // Add normal HTML event listener for change - this allows normal input behavior
 gridSizeInput.elt.addEventListener('change', function() {
   let newValue = parseInt(this.value);
   if (!isNaN(newValue) && newValue >= 2 && newValue <= 100) {
     gridSize = newValue;
     gridSizeLabel.html(`grid size: ${gridSize}×${gridSize}`);
     numShuffleMoves = 10 * (gridSize * gridSize);
     if (img) {
       resetPuzzle(true);
     }
   }
 });
 
 // Create reset button (Shuffle) - position side by side with upload button
 resetButton = createButton('shuffle / reset');
 resetButton.position(width/2 - buttonWidth - 10, uiY + 100); // More space below input
 resetButton.size(buttonWidth, buttonHeight);
 resetButton.style('background-color', '#333'); // Darker color for shuffle button
 resetButton.style('color', '#fff');
 resetButton.style('border', '1px solid #555');
 resetButton.style('border-radius', '4px');
 resetButton.style('cursor', 'pointer');
 resetButton.mousePressed(resetPuzzle);
 
 // Method 1: Create a visible button that will trigger file input
 uploadButtonVisible = createButton('upload custom image');
 uploadButtonVisible.position(width/2 + 10, uiY + 100); // Aligned with reset button
 uploadButtonVisible.size(buttonWidth, buttonHeight);
 uploadButtonVisible.style('background-color', '#1c6e8c'); // Blueish color for upload button
 uploadButtonVisible.style('color', '#fff');
 uploadButtonVisible.style('border', '1px solid #555');
 uploadButtonVisible.style('border-radius', '4px');
 uploadButtonVisible.style('cursor', 'pointer');
 
 // Create file input element (hidden by default)
 uploadButton = createFileInput(handleImageUpload);
 uploadButton.position(-1000, -1000); // Position off-screen
 uploadButton.style('opacity', '0');
 uploadButton.style('position', 'absolute');
 uploadButton.style('pointer-events', 'none'); // Disable direct interaction
 
 // Make the visible button click trigger the file input
 uploadButtonVisible.mousePressed(() => {
   uploadButton.elt.click();
 });
 
 // Create splash screen upload button
 uploadImageButton = createButton('upload custom image');
 uploadImageButton.position(width/2 - buttonWidth/2, height * 0.7);
 uploadImageButton.size(buttonWidth, buttonHeight);
 uploadImageButton.style('background-color', '#1c6e8c'); // Match the main upload button color
 uploadImageButton.style('color', '#fff');
 uploadImageButton.style('border', '1px solid #555');
 uploadImageButton.style('border-radius', '4px');
 uploadImageButton.style('cursor', 'pointer');
 uploadImageButton.mousePressed(() => {
   useSplashOption('upload');
 });
 
 // Create gallery container div
 galleryArea = createDiv('');
 galleryArea.style('position', 'absolute');
 galleryArea.style('width', '100%');
 galleryArea.style('text-align', 'center');
 galleryArea.style('padding-top', '20px');
}

// Sets visibility of UI elements
function setUIVisibility(visible) {
 // Include uploadButtonVisible in the array of UI elements
 const elements = [gridSizeInput, gridSizeLabel, resetButton, uploadButtonVisible];
 for (let el of elements) {
   if (visible) {
     el.show();
   } else {
     el.hide();
   }
 }
 
 // Always ensure upload button is hidden properly
 if (!visible && uploadButton) {
   uploadButton.hide();
 }
 
 // Splash screen buttons
 if (splashScreen) {
   uploadImageButton.show();
   galleryArea.hide(); // Hide gallery in splash screen (we draw it manually there)
 } else {
   uploadImageButton.hide();
   galleryArea.show(); // Show gallery in all other screens
 }
}

// Handle splash screen option selection
function useSplashOption(option) {
 splashScreen = false;
 loadingScreen = true;
 
 if (option === 'upload') {
   // Trigger file input dialog
   uploadButton.elt.click();
   // The rest will be handled by handleImageUpload
 } else if (typeof option === 'number' && option >= 0 && option < defaultImages.length) {
   // If an image index was selected
   if (imageLoaded[option]) {
     img = defaultImages[option];
     
     // Make sure image is processed as a square before starting the puzzle
     processSquareImage(img);
     
     setTimeout(() => {
       initPuzzle();
       loadingScreen = false;
       setUIVisibility(true);
     }, 500); // Short delay for visual feedback
   }
 }
 
 // Hide splash buttons
 uploadImageButton.hide();
}

// Process image to ensure it's square (for thumbnail display and puzzle)
function processSquareImage(image) {
 // Nothing to do - the square cropping happens during display/tile creation
 // This function is a placeholder if more processing is needed later
 return image;
}

// Helper function to ensure upload button is visible
function showUploadButton() {
 if (uploadButtonVisible) {
   uploadButtonVisible.show();
 }
}

// Handle image upload
function handleImageUpload(file) {
 if (file.type === 'image') {
   loadingScreen = true;
   splashScreen = false;
   
   // Load the uploaded image
   loadImage(file.data, (loadedImg) => {
     img = loadedImg;
     
     // Make sure uploaded image is processed as a square 
     processSquareImage(img);
     
     initPuzzle();
     loadingScreen = false;
     setUIVisibility(true);
   }, 
   // Error callback for uploaded image
   () => {
     alert('error loading the image. please try a different format (jpg, png, gif, webp).');
     loadingScreen = false;
     if (splashScreen) {
       uploadImageButton.show();
     }
   });
 } else {
   alert('please upload an image file (jpg, png, gif, webp).');
   // If no valid file selected and we're on splash screen, show upload button again
   if (splashScreen) {
     uploadImageButton.show();
   }
 }
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
 
 // Reset alpha values
 timerAlpha = 255;
 solvedAlpha = 255;
 alphaDirection = -1;
 
 // Create and shuffle tiles
 createTiles();
 shuffleTiles(forceNewShuffle);
}

// Create tiles from the image
function createTiles() {
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
       // Calculate crop dimensions to get a square from the center of the image
       let cropSize = min(img.width, img.height);
       let cropX = (img.width - cropSize) / 2;
       let cropY = (img.height - cropSize) / 2;
       
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
 // For very large puzzles (over 15x15), use the optimized shuffling approach
 if (gridSize > 15) {
   shuffleLargePuzzle();
   return;
 }
 
 // For smaller puzzles, use the random move approach
 // Reset tiles to their initial positions first
 resetTilePositions();
 
 // Ensure isSolved is false when starting to shuffle
 isSolved = false;
 
 // Perform random valid moves from the solved state
 // This guarantees a solvable puzzle because we start from solved
 // and only make valid moves
 
 // Calculate number of moves based on grid size if not already set
 if (numShuffleMoves <= 0) {
   numShuffleMoves = 10 * (gridSize * gridSize);
 }
 
 console.log(`Shuffling with ${numShuffleMoves} moves for ${gridSize}×${gridSize} grid`);
 
 let lastDir = null;
 
 // Execute random moves
 for (let move = 0; move < numShuffleMoves; move++) {
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

// Optimized shuffle algorithm for very large puzzles
// This uses a different approach that's much faster
function shuffleLargePuzzle() {
 console.log(`Using optimized shuffle for large ${gridSize}×${gridSize} puzzle`);
 
 // First create tiles in solved position
 createTiles();
 
 // Create a copy of the tiles array to work with
 let tilesCopy = JSON.parse(JSON.stringify(tiles));
 
 // Determine number of shuffle operations (fewer than full random moves)
 // For large puzzles, we don't need as many random swaps to get good randomization
 const swapCount = gridSize * gridSize * 3;
 
 console.log(`Performing ${swapCount} random swaps`);
 
 // Perform random valid swaps
 for (let swap = 0; swap < swapCount; swap++) {
   // Pick two random non-blank tiles
   let idx1, idx2;
   do {
     idx1 = floor(random(tilesCopy.length));
   } while (tilesCopy[idx1].isBlank);
   
   do {
     idx2 = floor(random(tilesCopy.length));
   } while (tilesCopy[idx2].isBlank || idx1 === idx2);
   
   // Swap their positions
   [tilesCopy[idx1].i, tilesCopy[idx2].i] = [tilesCopy[idx2].i, tilesCopy[idx1].i];
   [tilesCopy[idx1].j, tilesCopy[idx2].j] = [tilesCopy[idx2].j, tilesCopy[idx1].j];
 }
 
 // Now we need to ensure the puzzle is solvable
 // For a sliding puzzle, we need to make sure the parity is correct
 
 // Calculate the number of inversions
 let inversions = 0;
 for (let i = 0; i < tilesCopy.length - 1; i++) {
   if (tilesCopy[i].isBlank) continue;
   
   for (let j = i + 1; j < tilesCopy.length; j++) {
     if (tilesCopy[j].isBlank) continue;
     
     // Calculate the linear indices of the tiles
     const tileIdx1 = tilesCopy[i].correctI * gridSize + tilesCopy[i].correctJ;
     const tileIdx2 = tilesCopy[j].correctI * gridSize + tilesCopy[j].correctJ;
     
     // Calculate the current positions
     const posIdx1 = tilesCopy[i].i * gridSize + tilesCopy[i].j;
     const posIdx2 = tilesCopy[j].i * gridSize + tilesCopy[j].j;
     
     // Count inversions (where tiles are out of natural order)
     if (tileIdx1 > tileIdx2 && posIdx1 < posIdx2) {
       inversions++;
     }
   }
 }
 
 // For odd-sized grids, the puzzle is solvable if inversions is even
 // For even-sized grids, we also need to consider the blank position
 let blankRow = 0;
 for (let tile of tilesCopy) {
   if (tile.isBlank) {
     blankRow = tile.i;
     break;
   }
 }
 
 let solvable;
 if (gridSize % 2 === 1) {
   // Odd grid size
   solvable = inversions % 2 === 0;
 } else {
   // Even grid size
   solvable = (inversions + blankRow) % 2 === 0;
 }
 
 // If not solvable, swap any two non-blank tiles to make it solvable
 if (!solvable) {
   console.log("Adjusting puzzle to make it solvable");
   // Find two non-blank tiles
   let idx1 = -1, idx2 = -1;
   for (let i = 0; i < tilesCopy.length; i++) {
     if (!tilesCopy[i].isBlank) {
       if (idx1 === -1) {
         idx1 = i;
       } else {
         idx2 = i;
         break;
       }
     }
   }
   
   // Swap them
   if (idx1 !== -1 && idx2 !== -1) {
     [tilesCopy[idx1].i, tilesCopy[idx2].i] = [tilesCopy[idx2].i, tilesCopy[idx1].i];
     [tilesCopy[idx1].j, tilesCopy[idx2].j] = [tilesCopy[idx2].j, tilesCopy[idx1].j];
   }
 }
 
 // Apply the shuffled positions to the actual tiles array
 tiles = tilesCopy;
 
 // Update blank position
 for (let tile of tiles) {
   if (tile.isBlank) {
     blankPos = { i: tile.i, j: tile.j };
     break;
   }
 }
 
 // Ensure we're not in solved state
 checkSolution();
 if (isSolved) {
   console.log("Still solved after shuffle, making one more swap");
   // Find two adjacent non-blank tiles
   for (let i = 0; i < tiles.length; i++) {
     if (!tiles[i].isBlank) {
       for (let j = i + 1; j < tiles.length; j++) {
         if (!tiles[j].isBlank) {
           // Swap them
           [tiles[i].i, tiles[j].i] = [tiles[j].i, tiles[i].i];
           [tiles[i].j, tiles[j].j] = [tiles[j].j, tiles[i].j];
           break;
         }
       }
       break;
     }
   }
   // Force not solved
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
   
   // Stop timer
   if (firstMove) {
     elapsedTime = millis() - startTime;
   }
   
   // Initialize alpha values for smooth flashing
   timerAlpha = 255;
   solvedAlpha = 255;
   alphaDirection = -1;
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
 // Don't handle keyboard navigation when user is typing in the input field
 if (document.activeElement === gridSizeInput.elt) {
   return true; // Let the browser handle the key event
 }
 
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
 
 return false; // Prevent default behavior for game controls
}

// Update UI positioning for window resize
function updateUIPositions() {
 let buttonWidth = 150;
 let buttonHeight = 40;
 
 // Position grid size label
 let gridLabelY = puzzleY + puzzleWidth + 30;
 gridSizeLabel.position(width/2 - 100, gridLabelY);
 
 // Position number input below label with more space
 let inputY = gridLabelY + 50; // Increased space
 gridSizeInput.position(width/2 - 40, inputY);
 
 // Position buttons with more space below input
 let buttonsY = inputY + 60; // Increased space
 resetButton.position(width/2 - buttonWidth - 10, buttonsY);
 
 // Position upload button directly
 uploadButtonVisible.position(width/2 + 10, buttonsY);
 
 // Position gallery area at the bottom of the screen
 galleryArea.position(0, puzzleY + puzzleWidth + 170);
 
 // Update splash screen upload button
 uploadImageButton.position(width/2 - buttonWidth/2, height * 0.7);
 
 // Update gallery in the gallery area
 updateGallery();
}

// Update gallery of images
function updateGallery() {
 // Clear previous gallery
 galleryArea.html('');
 
 // Skip during splash screen as we draw gallery differently there
 if (splashScreen) return;
 
 // Add title
 let galleryTitle = createP('select image:');
 galleryTitle.style('color', '#ccc');
 galleryTitle.style('margin', '0 0 10px 0');
 galleryTitle.parent(galleryArea);
 
 // Create flexbox container for thumbnails
 let thumbContainer = createDiv('');
 thumbContainer.style('display', 'flex');
 thumbContainer.style('flex-wrap', 'wrap');
 thumbContainer.style('justify-content', 'center');
 thumbContainer.style('gap', '15px');
 thumbContainer.style('margin', '0 auto');
 thumbContainer.style('max-width', '80%');
 thumbContainer.parent(galleryArea);
 
 // Determine thumbnail size based on screen width
 const thumbnailSize = min(width * 0.08, 80); // Smaller thumbnails
 
 // Add each default image as a thumbnail
 for (let i = 0; i < defaultImages.length; i++) {
   if (!imageLoaded[i]) continue;
   
   let thumbDiv = createDiv('');
   thumbDiv.style('width', thumbnailSize + 'px');
   thumbDiv.style('height', thumbnailSize + 'px');
   thumbDiv.style('position', 'relative');
   thumbDiv.style('cursor', 'pointer');
   thumbDiv.style('border', '2px solid ' + (img === defaultImages[i] ? '#0f0' : '#555'));
   thumbDiv.style('border-radius', '4px');
   thumbDiv.style('overflow', 'hidden');
   thumbDiv.parent(thumbContainer);
   
   // Create canvas for thumbnail
   let thumbCanvas = createGraphics(thumbnailSize, thumbnailSize);
   
   // Draw image centered and cropped to square
   const imgWidth = defaultImages[i].width;
   const imgHeight = defaultImages[i].height;
   const cropSize = min(imgWidth, imgHeight);
   const cropX = (imgWidth - cropSize) / 2;
   const cropY = (imgHeight - cropSize) / 2;
   
   thumbCanvas.image(
     defaultImages[i], 
     0, 
     0, 
     thumbnailSize, 
     thumbnailSize, 
     cropX, 
     cropY, 
     cropSize, 
     cropSize
   );
   
   // Convert canvas to img element and add to div
   let canvasURL = thumbCanvas.canvas.toDataURL();
   let thumbImg = createImg(canvasURL, 'thumbnail');
   thumbImg.style('width', '100%');
   thumbImg.style('height', '100%');
   thumbImg.style('object-fit', 'cover');
   thumbImg.parent(thumbDiv);
   
   // Add click handler
   thumbDiv.mousePressed(() => {
     img = defaultImages[i];
     // Update UI to show which image is selected
     updateGallery();
     // Reset/init puzzle with new image
     resetPuzzle(true);
   });
   
   // Clean up canvas to prevent memory leak
   thumbCanvas.remove();
 }
 
 // If custom image is loaded and isn't one of the defaults
 if (img && !defaultImages.includes(img)) {
   let customThumbDiv = createDiv('');
   customThumbDiv.style('width', thumbnailSize + 'px');
   customThumbDiv.style('height', thumbnailSize + 'px');
   customThumbDiv.style('position', 'relative');
   customThumbDiv.style('cursor', 'pointer');
   customThumbDiv.style('border', '2px solid #0f0'); // Green border for selected
   customThumbDiv.style('border-radius', '4px');
   customThumbDiv.style('overflow', 'hidden');
   customThumbDiv.parent(thumbContainer);
   
   // Create canvas for thumbnail
   let thumbCanvas = createGraphics(thumbnailSize, thumbnailSize);
   
   // Draw image centered and cropped to square
   const imgWidth = img.width;
   const imgHeight = img.height;
   const cropSize = min(imgWidth, imgHeight);
   const cropX = (imgWidth - cropSize) / 2;
   const cropY = (imgHeight - cropSize) / 2;
   
   thumbCanvas.image(
     img, 
     0, 
     0, 
     thumbnailSize, 
     thumbnailSize, 
     cropX, 
     cropY, 
     cropSize, 
     cropSize
   );
   
   // Convert canvas to img element and add to div
   let canvasURL = thumbCanvas.canvas.toDataURL();
   let thumbImg = createImg(canvasURL, 'custom image');
   thumbImg.style('width', '100%');
   thumbImg.style('height', '100%');
   thumbImg.style('object-fit', 'cover');
   thumbImg.parent(customThumbDiv);
   
   // Add label for custom
   let customLabel = createDiv('custom');
   customLabel.style('position', 'absolute');
   customLabel.style('bottom', '0');
   customLabel.style('width', '100%');
   customLabel.style('background', 'rgba(0,0,0,0.7)');
   customLabel.style('color', 'white');
   customLabel.style('font-size', '10px');
   customLabel.style('text-align', 'center');
   customLabel.parent(customThumbDiv);
   
   // Clean up canvas to prevent memory leak
   thumbCanvas.remove();
 }
}

// Handle window resize
function windowResized() {
 resizeCanvas(windowWidth, windowHeight);
 
 // Recalculate puzzle dimensions
 const maxPuzzleHeight = height * 0.5; // Reduced for gallery at bottom
 const maxPuzzleWidth = width * 0.7;
 puzzleWidth = min(maxPuzzleWidth, maxPuzzleHeight);
 
 // Center the puzzle horizontally, position vertically with space for top elements
 puzzleX = width / 2 - puzzleWidth / 2;
 puzzleY = height * 0.15; // Fixed position with room for top elements
 
 // Update tile size
 if (gameStarted) {
   tileSize = puzzleWidth / gridSize;
 }
 
 // Update UI positions
 updateUIPositions();
 
 // Make sure upload button is visible after resize if we're not on splash screen
 if (!splashScreen) {
   showUploadButton();
 }
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
   drawSolvedText(); // Draw "SOLVED!" text first if solved
   drawTimer(); // Draw timer at the top
   drawPuzzle(); // Draw the puzzle below
   
   // Try to ensure upload button is visible in each frame
   // This addresses some browser-specific issues
   if (frameCount % 60 === 0) { // Check every second
     showUploadButton();
   }
 }
}

// Draw splash screen
function drawSplashScreen() {
 textSize(40);
 fill(200); // Light text for dark mode
 text("welcome to imgpuz", width/2, height/4);
 
 textSize(20);
 fill(180); // Light text for dark mode
 text("select an image or upload your own", width/2, height/4 + 40);
 
 // Better thumbnail size calculation based on screen width
 const maxThumbnailWidth = width * 0.18; // Reduced from 0.2
 const thumbnailSize = min(maxThumbnailWidth, 160); // Smaller max size
 const padding = thumbnailSize * 0.3; // Increased padding
 
 // Allow more images per row on wider screens
 const availableWidth = width * 0.8; // Use 80% of screen width
 const maxImagesPerRow = floor(availableWidth / (thumbnailSize + padding));
 const imagesPerRow = min(maxImagesPerRow, defaultImages.length);
 const rows = Math.ceil(defaultImages.length / imagesPerRow);
 
 // Draw each image thumbnail
 for (let i = 0; i < defaultImages.length; i++) {
   const row = Math.floor(i / imagesPerRow);
   const col = i % imagesPerRow;
   
   const rowImages = min(imagesPerRow, defaultImages.length - (row * imagesPerRow));
   const rowWidth = (thumbnailSize * rowImages) + (padding * (rowImages - 1));
   const startX = width/2 - rowWidth/2;
   
   const x = startX + (col * (thumbnailSize + padding)) + thumbnailSize/2;
   const y = height/2 - (rows * (thumbnailSize + padding + 20))/2 + row * (thumbnailSize + padding + 20) + thumbnailSize/2;
   
   // Draw border
   stroke(imageLoaded[i] ? 200 : 100);
   strokeWeight(3);
   fill(20);
   rect(x - thumbnailSize/2, y - thumbnailSize/2, thumbnailSize, thumbnailSize);
   
   if (imageLoaded[i]) {
     imageMode(CENTER);
     
     // Properly crop images to square from center
     const img = defaultImages[i];
     const cropSize = min(img.width, img.height);
     const cropX = (img.width - cropSize) / 2;
     const cropY = (img.height - cropSize) / 2;
     
     // Draw image centered in thumbnail box, cropped to square
     image(
       img, 
       x, 
       y, 
       thumbnailSize, 
       thumbnailSize, 
       cropX, 
       cropY, 
       cropSize, 
       cropSize
     );
     
     // Hover effect
     if (
       mouseX > x - thumbnailSize/2 && 
       mouseX < x + thumbnailSize/2 && 
       mouseY > y - thumbnailSize/2 && 
       mouseY < y + thumbnailSize/2
     ) {
       noFill();
       stroke(0, 255, 150, 200);
       strokeWeight(5);
       rect(x - thumbnailSize/2, y - thumbnailSize/2, thumbnailSize, thumbnailSize);
       
       if (mouseIsPressed) {
         useSplashOption(i);
       }
     }
   } else {
     fill(150);
     noStroke();
     textSize(14);
     text("not loaded", x, y);
   }
 }
 
 noStroke();
}

// Draw loading screen
function drawLoadingScreen() {
 textSize(24);
 fill(200); // Light text for dark mode
 text("loading puzzle...", width/2, height/2);
}

// Draw the "SOLVED!" text at the top
function drawSolvedText() {
 if (isSolved) {
   textSize(min(40, puzzleWidth/10));
   
   // Use smooth alpha transition for flashing effect
   fill(0, 255, 150, solvedAlpha); // Brighter green for dark mode with alpha
   
   // Update alpha value for smooth flashing
   updateFlashingAlpha();
   
   text("solved!", width/2, puzzleY - 80); // Higher position with more gap from timer
 }
}

// Draw the timer at the top
function drawTimer() {
 textSize(24);
 
 if (isSolved) {
   // Flashing green timer for solved state with smooth alpha transition
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
 
 // Position timer at the top, below "SOLVED!" text if present
 let timerY = puzzleY - 30;
 
 // Display timer text at the top
 text(displayTime, width/2, timerY);
}

// Update alpha values for smooth flashing effect
function updateFlashingAlpha() {
 if (isSolved) {
   // Change alpha value based on direction
   timerAlpha += alphaDirection * alphaChangeSpeed;
   solvedAlpha += alphaDirection * alphaChangeSpeed;
   
   // Reverse direction when reaching limits
   if (timerAlpha <= 100 || timerAlpha >= 255) {
     alphaDirection *= -1;
   }
   
   // Ensure alpha stays within bounds
   timerAlpha = constrain(timerAlpha, 100, 255);
   solvedAlpha = constrain(solvedAlpha, 100, 255);
 }
}

// Draw the puzzle
function drawPuzzle() {
 // Draw background for puzzle area - completely black
 fill(0); // Pure black background for puzzle area
 stroke(100); // Subtle border
 strokeWeight(3);
 rect(puzzleX, puzzleY, puzzleWidth, puzzleWidth);
 strokeWeight(0);
 
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
       
       // Get crop dimensions for the centered square portion of the image
       let cropSize = min(img.width, img.height);
       let cropX = (img.width - cropSize) / 2;
       let cropY = (img.height - cropSize) / 2;
       
       // Calculate source coordinates in the original image based on centered crop
       let sx = cropX + (tile.correctJ * cropSize / gridSize);
       let sy = cropY + (tile.correctI * cropSize / gridSize);
       let sw = cropSize / gridSize;
       let sh = cropSize / gridSize;
       
       // Draw image tile
       image(
         img,
         x,                // X position in CORNER mode
         y,                // Y position in CORNER mode
         tileSize,         // Width of the target rectangle
         tileSize,         // Height of the target rectangle
         sx,               // Source x position in the original image
         sy,               // Source y position in the original image
         sw,               // Source width in the original image
         sh                // Source height in the original image
       );
       
       pop();
     }
   }
 }
}