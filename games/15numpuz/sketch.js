// ---- Global Variables ----
var wid, num, blank;
var pos = [];
var winstring = "1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,0";
var reversewinstring = "nope";
var fader = 255;
var timefader = 255;
var winfadeint = 5;
var posstring;
var time = 0;
var moveTimer = true;
let timedecimal = 0;

var lead = true;
var playername = "anonymous";
let rankData;
let scores;
let names;
let takingInput = false;
let input, button; // For name input
let showLeads = false;
let preloadIsRunning = false;
let hadjust;
let theyCheated;
var pad = 20;
var widthExtraPad = 100; // Space for instructions/timer

var keydowntimer = 0;

// ---- Mode & Image Variables ----
let currentMode = 'number'; // 'number' or 'image'
let defaultPuzzleImage;
let puzzleImage; // The currently active image (default or custom)
let imageTiles = []; // Array to hold p5.Image objects for each tile
let imageLoaded = false;
let modeButton;
let fileInput;
// const defaultImageUrl = "https://www.aces.edu/wp-content/uploads/2024/08/GettyImages-1003787612-scaled.jpg"; // REMOVED URL
const defaultImagePath = "./../../ref/realtree.jpg"; // *** USING LOCAL PATH ***
let defaultImageLoaded = false; // Flag to ensure slicing happens after loading

//----\/\/\/\/---A VERY COMPLICATED SLIDE PUZZLE---\/\/\/\/----

function preload() {
    preloadIsRunning = true; // Set true mainly for leaderboard fetch indication
    rankData = [];
    const apiKey = "AIzaSyDiEtTNaLP4xCi30j1xYQS5bNYBwlXwJbA"; // Consider hiding API keys if deploying publicly
    const spreadSheetId = "1SnjG8pGZHTnr_9wv0wJ9IR71MAfAwbNzm7ywd5CO6aM";

    // --- Fetch Leaderboard Data ---
    // NOTE: If the "Loading..." message persists when you press 'L',
    // the issue is likely with this fetch request. Check the developer console (F12).
    fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadSheetId}/values/numberpuzzle!a2:b?key=${apiKey}`,
        { method: "GET" }
    )
        .then((r) => {
            if (!r.ok) {
                // Log error if response status is not OK (e.g., 400, 403, 404)
                console.error(`Leaderboard fetch failed with status: ${r.status} ${r.statusText}`);
                return r.text().then(text => { // Try to get error text from response
                     console.error("Response body:", text);
                     throw new Error(`HTTP error ${r.status}`);
                });
            }
            return r.json();
        })
        .then((data) => {
            if (data && data.values) {
                rankData = data.values.map((item) => item);
                console.log("Leaderboard data loaded.");
            } else {
                console.error("Failed to parse leaderboard data or 'values' array missing:", data);
                rankData = []; // Ensure it's an empty array on failure
            }
        }).catch(error => {
            console.error("Error fetching or processing leaderboard:", error);
            rankData = []; // Ensure it's an empty array on error
        }).finally(() => {
             preloadIsRunning = false; // *** Crucial: Set to false after fetch attempt (success or fail) ***
             console.log("Leaderboard fetch finished. preloadIsRunning:", preloadIsRunning);
        });

    // --- Load the default image from LOCAL PATH ---
    loadImage(defaultImagePath, img => {
        console.log("Default local image loaded successfully.");
        defaultPuzzleImage = img;
        puzzleImage = img; // Start with the default image
        defaultImageLoaded = true; // Set flag when loaded
        // Slice image tiles *after* it's loaded (might happen after setup, so we check in setup)
        if (wid) { // Check if wid is already calculated in setup
             createImageTiles(puzzleImage);
        }
    }, err => {
        console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        console.error(`Failed to load default image from local path: ${defaultImagePath}`, err);
        console.error("Ensure the path is correct relative to your HTML file AND you are using a local web server.");
        console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        // Optionally, disable image mode or use a placeholder if loading fails
        // imageLoaded = false; // Ensure image mode is not accidentally entered
    });

    // preloadIsRunning is set to false by the fetch's finally block.
}

function setup() {
    // Calculate dimensions based on window height
    let gameHeight = window.innerHeight - 22;
    // Make puzzle area square based on height, calculate extra width
    let puzzleAreaWidth = gameHeight;
    let totalWidth = puzzleAreaWidth + max(200, puzzleAreaWidth * 0.3); // Ensure minimum side panel width
    widthExtraPad = totalWidth - puzzleAreaWidth; // Calculate extra space dynamically

    var cnv = createCanvas(totalWidth, gameHeight);
    var x = (windowWidth - width) / 2;
    var y = ((windowHeight - height) / 2);
    cnv.position(x, y);

    wid = floor(puzzleAreaWidth / 4); // Tile width based on puzzle area

    // Initial tile setup (1-15, 0)
    pos = [];
    for (var i = 1; i < 16; i++) {
        append(pos, i);
    }
    append(pos, 0);

    textFont('Helvetica');

    // Slice image if it loaded during preload AND wid is now set
    if (defaultImageLoaded && !imageLoaded && wid > 0) {
        console.log("Image was loaded in preload, creating tiles in setup.");
        createImageTiles(puzzleImage);
    } else if (defaultImageLoaded && wid <= 0) {
        console.warn("Image loaded but wid is not valid in setup yet.");
    } else if (!defaultImageLoaded) {
         console.warn("Default image not yet loaded when setup finished.");
    }


    // Name input setup
    input = createInput();
    input.size(max(100, widthExtraPad * 0.4)); // Adjust size based on side panel
    button = createButton('submit');
    // Position name input centrally (will be shown later)
    input.center(HORIZONTAL);
    input.position(input.x, height * 0.55); // Adjust vertical pos slightly
    button.center(HORIZONTAL);
    button.position(button.x, input.y + input.height + 5);
    input.hide();
    button.hide();

    // --- Mode Switching Button ---
    modeButton = createButton('Switch to Image Mode');
    // Position it relative to the canvas, in the side panel
    let buttonX = puzzleAreaWidth + pad; // Start of the extra space area
    let buttonY = height - pad * 5; // Near the bottom, leaving space for file input
    modeButton.position(x + buttonX, y + buttonY); // Use canvas x, y offsets
    modeButton.mousePressed(toggleMode);
    modeButton.size(widthExtraPad - pad * 2, 25); // Make button fit side panel

    // --- File Input for Custom Image ---
    fileInput = createFileInput(handleFile);
    fileInput.position(x + buttonX, y + buttonY + 35); // Place below mode button
    fileInput.attribute('accept', 'image/*'); // Suggest only image files
    fileInput.size(widthExtraPad - pad * 2); // Make input fit side panel

    console.log("Setup complete. Mode:", currentMode, "Tile width (wid):", wid);

    mixit(); // Scramble the tiles AFTER setup is complete
}

function draw() {
    background(0);
    noStroke();

    // --- Draw Puzzle Grid Area (Left Side) ---
    let puzzleAreaWidth = width - widthExtraPad;
    push(); // Isolate puzzle drawing transformations/styles
    // translate(0, 0); // Not needed if drawing from top-left

    textAlign(CENTER, CENTER);
    posstring = pos.toString(); // Check win condition later

    for (var row = 0; row < 4; row++) { // Iterate through grid rows (visual top to bottom)
        for (var col = 0; col < 4; col++) { // Iterate through grid columns (visual left to right)
            // Calculate index in the 1D 'pos' array based on visual row/col
            let tileIndexInPos = row * 4 + col;
            num = pos[tileIndexInPos];
            let drawX = col * wid; // X position based on visual column
            let drawY = row * wid; // Y position based on visual row

            if (num == 0) {
                // Draw nothing for the blank tile in either mode
                fill(15); // Subtle indication of the empty slot
                noStroke();
                rect(drawX, drawY, wid, wid);
                continue; // Skip drawing for blank tile
            }

            // --- Number Mode Drawing ---
            if (currentMode === 'number') {
                 // Original number drawing logic with gaps
                let gap = max(1, floor(wid * 0.02)); // Small dynamic gap
                let tileDrawWid = wid - gap * 2;
                let tileDrawHei = wid - gap * 2;

                if (num % 2 != 0) { fill(220); } // Light gray
                else { fill(200, 0, 0); } // Red
                rect(drawX + gap, drawY + gap, tileDrawWid, tileDrawHei, 3); // Background with gap, slightly rounded

                // // Optional overlay removed for simplicity
                // if (num % 2 != 0) { fill(255, 80); }
                // else { fill(255, 0, 0, 80); }
                // rect(drawX, drawY, wid - 1, wid - 1); // Overlay with smaller gap

                // Draw Number Text
                if (num % 2 != 0) { fill(200, 0, 0); } // Red text on gray
                else { fill(220); } // Light gray text on red
                noStroke();
                textSize(wid * 0.6); // Adjust text size relative to tile
                text(num, drawX + .5 * wid, drawY + .55 * wid); // Adjust text baseline slightly
            }
            // --- Image Mode Drawing ---
            else if (currentMode === 'image') {
                if (imageLoaded && imageTiles && imageTiles.length === 15) { // Ensure tiles are ready
                    let tileImage = imageTiles[num - 1]; // imageTiles[0] is for piece '1'
                    if (tileImage) {
                        // Draw image tile *without gaps*
                        image(tileImage, drawX, drawY, wid, wid);
                    } else {
                         // Fallback if specific tile image is missing (shouldn't happen)
                        fill(100); // Grey fallback
                        rect(drawX, drawY, wid, wid);
                        console.error("Missing image tile for number:", num);
                    }
                } else {
                    // Image loading or slicing not finished, draw placeholder
                    fill(50); // Dark grey placeholder
                    rect(drawX, drawY, wid, wid);
                    fill(200);
                    textSize(wid / 4);
                    text('IMG', drawX + wid/2, drawY + wid/2); // Indicate image tile
                }
            }
        }
    }
    pop(); // Restore drawing state

    // --- Draw Side Panel (Right Side) ---
    drawSidePanel(puzzleAreaWidth); // Pass the starting x-coordinate

    // Handle key repeats for movement
    if ((keyIsDown(UP_ARROW) || keyIsDown(DOWN_ARROW) || keyIsDown(LEFT_ARROW) || keyIsDown(RIGHT_ARROW)) && !takingInput && !showLeads) {
        keydowntimer++;
    } else {
        keydowntimer = 0;
    }
    const repeattime = 8; // Faster repeat for smoother holding
    // Start repeating slightly after initial press
    if (keydowntimer > 10 && (keydowntimer % repeattime) === 0) {
        moveFromInput(); // Call move logic on repeat
    }

    // --- Cheat Message ---
    if (theyCheated) {
        fill(255, 0, 0); textAlign(CENTER, CENTER); stroke(0); strokeWeight(2); textSize(11);
        text("so you think you can get away with cheating", width / 2, height / 2 - 15);
        text("virus installing......", width / 2, height / 2);
        text("installed", width / 2, height / 2 + 15);
        moveTimer = false; // Stop timer if cheating
        // return; // Optional: Stop drawing puzzle if cheating
    }

    // --- Win Condition Check & Display ---
    textSize(puzzleAreaWidth / 4.4); // Size relative to puzzle area
    textAlign(LEFT); // For WINNER text alignment
    noStroke();
    if (posstring === winstring && !theyCheated) { // Check win condition
        if (moveTimer) { // Stop timer only once on win
             moveTimer = false;
             console.log("Winner detected! Final time:", time);
        }
        // Flashing WINNER text (drawn over puzzle area)
        fill(255, 150, 0, fader); text("WINNER!", pad, .55 * height / 4);
        fill(160, 255, 140, fader); text("WINNER!", pad, 1.55 * height / 4);
        fill(80, 60, 255, fader); text("WINNER!", pad, 2.55 * height / 4);
        fill(100, 160, 200, fader); text("WINNER!", pad, 3.55 * height / 4);
        fader -= winfadeint;
        if (fader < 0) { winfadeint = -5; }
        else if (fader > 260) { winfadeint = 5; }

        if (lead && !takingInput) { // Ask for name only once per win state
            takeName();
        }
    } else {
        // Reset fade effect if not winning or if cheated
        fader = 255;
        // Only run timer if game is active (not won, not inputting, not showing leads, not cheated)
        if (!takingInput && !showLeads && !theyCheated && posstring !== winstring) {
            moveTimer = true;
        } else {
             moveTimer = false; // Ensure timer stops otherwise
        }
    }

    // Show Leaderboard overlay if toggled
    if (showLeads) {
        showLeaderboard(); // No need to pass puzzle width if it covers screen
    }
}

// ---- Helper Functions ----

function createImageTiles(img) {
    if (!img || !img.width || !img.height || !wid || wid <= 0) {
        console.error("Cannot create image tiles: Image not loaded OR tile width (wid) is invalid:", wid);
        imageLoaded = false;
        imageTiles = []; // Ensure tiles array is empty
        return;
    }
     console.log(`Creating image tiles with image ${img.width}x${img.height} and tile width ${wid}...`);

    imageTiles = []; // Clear existing tiles

    // --- Crop image to square from center ---
    let size = min(img.width, img.height); // Size of square area
    let offsetX = (img.width - size) / 2;
    let offsetY = (img.height - size) / 2;

    // Calculate the source tile width/height in the *original image's* coordinates
    let srcTileW = size / 4;
    let srcTileH = size / 4;

    // Create tiles 1 through 15 (index 0 to 14)
    for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
            let index = y * 4 + x;
            if (index === 15) break; // Only need 15 tiles (0-14), the 16th spot is blank

            try {
                 // Get subsection of the *original* image, considering the offset and source tile size
                let tile = img.get(
                    floor(offsetX + x * srcTileW),
                    floor(offsetY + y * srcTileH),
                    floor(srcTileW),
                    floor(srcTileH)
                );
                imageTiles.push(tile);
            } catch (e) {
                console.error(`Error using img.get() for tile ${index+1} at (${x},${y}):`, e);
                console.error(`Calculated params: x=${floor(offsetX + x * srcTileW)}, y=${floor(offsetY + y * srcTileH)}, w=${floor(srcTileW)}, h=${floor(srcTileH)}`);
                console.error(`Image dimensions: ${img.width}x${img.height}, Crop size: ${size}, Offset: ${offsetX}, ${offsetY}`);
                // Push a placeholder or stop? Pushing placeholder allows partial display.
                let placeholder = createGraphics(floor(srcTileW), floor(srcTileH));
                placeholder.background(128);
                placeholder.fill(255);
                placeholder.textAlign(CENTER,CENTER);
                placeholder.text('ERR', placeholder.width/2, placeholder.height/2);
                imageTiles.push(placeholder);
            }
        }
    }

    if (imageTiles.length === 15) {
        imageLoaded = true;
        console.log("Image tiles created successfully (15 tiles).");
    } else {
        console.error("Failed to create the correct number of image tiles. Created:", imageTiles.length);
        imageLoaded = false;
    }
}

function drawSidePanel(panelStartX) {
    push();
    translate(panelStartX, 0); // Move origin to start of side panel

    let panelWidth = width - panelStartX; // = widthExtraPad

    // Instructions
    fill(220); // Lighter text
    textAlign(CENTER, TOP);
    textSize(max(16, panelWidth * 0.1)); // Responsive title size
    text("Instructions", panelWidth / 2, pad);

    textSize(max(12, panelWidth * 0.07)); // Responsive text size
    let lineSpacing = max(18, panelWidth * 0.09);
    let textY = pad * 3;
    text("Arrange tiles", panelWidth / 2, textY); textY += lineSpacing;
    text("1 to 15 or", panelWidth / 2, textY); textY += lineSpacing;
    text("complete the image.", panelWidth / 2, textY); textY += lineSpacing * 1.5;

    fill(200, 200, 0); // Yellow for controls
    text("Arrows: Move Tile", panelWidth / 2, textY); textY += lineSpacing;
    text("Spacebar: Reset", panelWidth / 2, textY); textY += lineSpacing;
    text("L: Leaderboard", panelWidth / 2, textY); textY += lineSpacing;
    text("M: Toggle Mode", panelWidth / 2, textY); // Added M for mode toggle

    // Timer - Draw below instructions, before buttons
    timer(0, textY + lineSpacing * 1.5, panelWidth); // Pass position (relative to panel) & width

    // Button labels (buttons are DOM elements positioned in setup/resize)
    fill(180);
    textSize(max(10, panelWidth * 0.06));
    textAlign(CENTER, BOTTOM);
    // text("Toggle Mode", panelWidth / 2, height - pad * 5 - 5);
    // text("Load Custom Image", panelWidth/2, height - pad * 5 + 30);


    pop(); // Restore origin
}


function timer(timerX, timerY, panelWidth) {
    textSize(max(24, panelWidth * 0.15)); // Adjusted size for side panel
    fill(0, 255, 0, timefader); // Green timer text
    textAlign(CENTER, TOP);
    noStroke();

    let totalSeconds = floor(time);
    let minutes = floor(totalSeconds / 60);
    let seconds = totalSeconds % 60;
    // Ensure timedecimal is calculated correctly as 0-99
    timedecimal = floor((time - totalSeconds) * 100);

    let timeString = nf(minutes, 1) + ":" + nf(seconds, 2, 0) + "." + nf(timedecimal, 2, 0);

    text(timeString, timerX + panelWidth / 2, timerY);

    if (moveTimer) {
        // Increment time based on frame delta time for accuracy
        time = time + deltaTime / 1000.0; // deltaTime is in milliseconds
    }

    // Fade out effect logic moved to draw() where win condition is checked
}


function takeName() {
    takingInput = true;
    moveTimer = false; // Pause timer while taking name
    console.log("Taking player name...");

    // Draw background for input (semi-transparent overlay)
    fill(0, 0, 0, 180);
    rect(0, 0, width, height); // Cover whole screen

    fill(220, 220, 255, 240);
    rectMode(CENTER);
    let boxW = max(250, width * 0.3);
    let boxH = max(150, height * 0.25);
    rect(width / 2, height / 2, boxW, boxH, 10); // Centered rectangle
    rectMode(CORNER); // Reset rectMode

    textAlign(CENTER, CENTER);
    textSize(max(20, boxW * 0.1));
    noStroke();
    fill(0);
    text("You Won! Name?", width / 2, height / 2 - boxH * 0.2);

    // Show and position input elements relative to canvas center
    input.center(HORIZONTAL);
    input.position(input.x, height / 2); // Vertically center input box
    button.center(HORIZONTAL);
    button.position(button.x, input.y + input.height + 10); // Position button below input

    input.show();
    button.show();
    input.elt.focus(); // Focus the input field

    // Remove previous listeners to avoid duplicates if takeName is called again
    button.mousePressed(null);
    button.mousePressed(myInputEvent); // Add the listener
}

function swap(arr, a, b) {
    // Basic swap, assumes a and b are valid indices
    if (a >= 0 && a < arr.length && b >= 0 && b < arr.length) {
        [arr[a], arr[b]] = [arr[b], arr[a]];
    } else {
        console.error("Invalid swap indices:", a, b);
    }
}

function mixit() {
    var b; // Index to swap with blank
    var attempts = 0; // Prevent infinite loops
    const maxShuffleMoves = 1000; // Number of random moves

    console.log("Mixing puzzle...");

    // Ensure puzzle starts in a known state (solved) before shuffling
    pos = [];
    for (var i = 1; i < 16; i++) { append(pos, i); }
    append(pos, 0);
    blank = 15; // Blank starts at the end

    let lastMove = -1; // Avoid immediately undoing the last move

    // Perform a large number of valid random moves to shuffle
    for (var i = 0; i < maxShuffleMoves && attempts < maxShuffleMoves * 2; i++) {
        blank = pos.indexOf(0); // Find blank space (should be fast enough)
        let possibleMoves = [];
        // Get indices of tiles that *can* move into the blank space
        let potential_b;

        // Tile below blank can move UP? (index blank + 4)
        potential_b = blank + 4;
        if (blank < 12 && potential_b !== lastMove) possibleMoves.push(potential_b);
        // Tile above blank can move DOWN? (index blank - 4)
        potential_b = blank - 4;
        if (blank > 3 && potential_b !== lastMove) possibleMoves.push(potential_b);
        // Tile right of blank can move LEFT? (index blank + 1)
        potential_b = blank + 1;
        if (blank % 4 != 3 && potential_b !== lastMove) possibleMoves.push(potential_b);
        // Tile left of blank can move RIGHT? (index blank - 1)
        potential_b = blank - 1;
        if (blank % 4 != 0 && potential_b !== lastMove) possibleMoves.push(potential_b);

        if (possibleMoves.length > 0) {
             b = random(possibleMoves); // Choose a random *valid* target tile index
             swap(pos, blank, b);
             lastMove = blank; // The position the blank just moved FROM (was 'b' before swap)
             blank = b; // Update blank position for next iteration (optional, will be found anyway)
        } else {
            // Should not happen in a 15 puzzle unless blank is somehow isolated
             console.warn("No possible moves for blank at index", blank);
             i--; // Decrement i so we still get maxShuffleMoves successful moves
        }
        attempts++;
    }

    // TODO: Check solvability using inversion count - skipped for now.
    // Random valid moves from solved state *should* always result in a solvable puzzle.

    // Reset game state
    time = 0;
    timedecimal = 0;
    timefader = 255;
    fader = 255;
    lead = true; // Allow submitting score again for a new game
    showLeads = false;
    takingInput = false;
    theyCheated = false;
    input.hide();
    button.hide();
    moveTimer = true; // Start timer now that puzzle is ready
    keydowntimer = 0; // Reset key repeat timer
    console.log("Puzzle mixed and reset.");
}

function keyPressed() {
    if (takingInput) {
        if (keyCode === ENTER || keyCode === RETURN) {
            myInputEvent();
        }
        return; // Ignore game controls while typing name
    }

    // Allow actions even if leaderboard is shown (like closing it)
    if (keyCode === 76) { // 'L' key for Leaderboard
        if (!showLeads) {
            // Re-fetch leaderboard data when opening, only if needed
            if (!rankData || rankData.length === 0 || preloadIsRunning) {
                 console.log("Fetching leaderboard data on 'L' press.");
                 preloadIsRunning = true; // Show loading message
                 // Re-run the fetch logic from preload() - abstract this to a function?
                 const apiKey = "AIzaSyDiEtTNaLP4xCi30j1xYQS5bNYBwlXwJbA";
                 const spreadSheetId = "1SnjG8pGZHTnr_9wv0wJ9IR71MAfAwbNzm7ywd5CO6aM";
                 fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadSheetId}/values/numberpuzzle!a2:b?key=${apiKey}`, { method: "GET" })
                    .then(r => r.ok ? r.json() : Promise.reject(`HTTP error ${r.status}`))
                    .then(data => { rankData = data.values || []; console.log("Leaderboard updated."); })
                    .catch(error => { console.error("Error updating leaderboard:", error); rankData = []; })
                    .finally(() => { preloadIsRunning = false; });
            }
        }
        showLeads = !showLeads;
        moveTimer = !showLeads; // Pause timer when showing leaderboard
        console.log("Toggled leaderboard. Show:", showLeads);
        return; // Prevent other actions if toggling leaderboard
    }

    // If leaderboard is shown, only allow 'L' to close it
    if (showLeads) {
        return;
    }

     // --- Game actions (only if not inputting name and not showing leaderboard) ---

    // Cheat detection (Ctrl + Q)
    if (keyIsDown(CONTROL) && keyCode === 81) { // Ctrl + Q
        console.warn("Cheat detected!");
        // Set to almost solved state to make cheat obvious
        pos = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 0, 15];
        posstring = pos.toString(); // Update string immediately
        theyCheated = true;
        moveTimer = false;
        fader = 255; // Ensure WINNER text doesn't flash if they cheat to win
        return; // Prevent further key processing
    }


    if (keyCode === 32) { // Spacebar
         mixit(); // Reset the puzzle
    } else if (keyCode === 77) { // 'M' key for Mode Toggle
        toggleMode();
    } else if (keyCode === UP_ARROW || keyCode === DOWN_ARROW || keyCode === LEFT_ARROW || keyCode === RIGHT_ARROW) {
        // Allow instant move on key press, don't wait for repeat timer in draw()
        moveFromInput();
        keydowntimer = 0; // Reset repeat timer after initial press
    }
}


// Updated moveFromInput - logic is based on which TILE moves into the blank space
function moveFromInput() {
    // Check game state: Don't move if won, inputting, showing leads, or cheated
    if (posstring == winstring || takingInput || showLeads || theyCheated) {
        // console.log("Move ignored due to game state."); // Debug log
        return;
    }

    blank = pos.indexOf(0);
    if (blank === -1) {
        console.error("Cannot find blank space (0) in pos array!");
        return; // Should not happen
    }

    var targetIndex = -1; // Index in 'pos' array of the TILE TO MOVE

    // Determine which tile (relative to blank) should move based on arrow key
    if (keyCode == UP_ARROW && blank < 12) { // Move tile BELOW blank UP
        targetIndex = blank + 4;
    } else if (keyCode == DOWN_ARROW && blank > 3) { // Move tile ABOVE blank DOWN
        targetIndex = blank - 4;
    } else if (keyCode == LEFT_ARROW && blank % 4 != 3) { // Move tile RIGHT of blank LEFT
        targetIndex = blank + 1;
    } else if (keyCode == RIGHT_ARROW && blank % 4 != 0) { // Move tile LEFT of blank RIGHT
        targetIndex = blank - 1;
    }

    // If a valid target tile index was determined, swap it with the blank space
    if (targetIndex !== -1) {
        // console.log(`Moving tile at index ${targetIndex} (${pos[targetIndex]}) into blank at ${blank}`); // Debug
        swap(pos, blank, targetIndex);
        // Update posstring immediately after swap for win check in draw()
        posstring = pos.toString();
    } else {
        // console.log("Invalid move attempted or edge blocked."); // Debug log for invalid moves
    }
}


function showLeaderboard() {
    // Ensure data is sorted before displaying (consider sorting only when data changes)
    // sortLeads(); // Sorting is done when data is loaded/updated now

    // Semi-transparent background overlay
    fill(10, 10, 40, 220); // Darker blue/purple, more opaque
    noStroke();
    rect(0, 0, width, height); // Cover the whole canvas for focus

    // --- Leaderboard Box ---
    let lbWidth = constrain(width * 0.7, 300, 600); // Responsive width with min/max
    let lbHeight = constrain(height * 0.8, 400, 700); // Responsive height
    let lbX = (width - lbWidth) / 2;
    let lbY = (height - lbHeight) / 2;

    fill(240, 240, 255, 250); // Light background for the board
    stroke(80, 80, 180); // Purpleish stroke
    strokeWeight(3);
    rect(lbX, lbY, lbWidth, lbHeight, 15); // Rounded corners

    // Title
    fill(0, 0, 100);
    noStroke();
    textSize(constrain(lbWidth / 15, 20, 36)); // Responsive title size
    textAlign(CENTER, TOP);
    text("Top 10 Leaderboard", width / 2, lbY + pad * 1.5);

    // Close instruction
    fill(100);
    textSize(constrain(lbWidth / 35, 10, 14));
    text("Press 'L' to close", width / 2, lbY + lbHeight - pad);


    // Loading indicator
    if (preloadIsRunning) {
        fill(200, 0, 0);
        textSize(constrain(lbWidth / 25, 14, 22));
        textAlign(CENTER, CENTER);
        text("Loading...", width / 2, height / 2);
        return; // Don't draw scores if loading
    }

    // Check if data exists
    if (!rankData || rankData.length === 0 || !names || names.length === 0) {
        fill(100);
        textSize(constrain(lbWidth / 25, 14, 22));
        textAlign(CENTER, CENTER);
        text("No scores yet, or failed to load.", width / 2, height/2);
        // Attempt to fetch again? Or just inform user.
        return;
    }


    // Column Titles
    stroke(50, 50, 150);
    strokeWeight(1);
    let titleY = lbY + pad * 4;
    let rankX = lbX + lbWidth * 0.15;
    let nameX = lbX + lbWidth * 0.45; // Center of name column
    let timeX = lbX + lbWidth * 0.80; // Center of time column
    textSize(constrain(lbWidth / 22, 16, 24));
    fill(0);
    textAlign(CENTER, CENTER);
    text("Rank", rankX, titleY);
    text("Name", nameX, titleY);
    text("Time", timeX, titleY); // Simplified title
    // Draw line below titles
    line(lbX + pad, titleY + pad * 0.8, lbX + lbWidth - pad, titleY + pad * 0.8);


    // Display Scores
    textSize(constrain(lbWidth / 28, 12, 20));
    let rowStartY = titleY + pad * 1.5; // Start Y for the first row content
    // Calculate available height for rows
    let availableHeight = (lbY + lbHeight - pad * 2) - rowStartY;
    let rowHeight = availableHeight / 10; // Calculate height per row for top 10

    for (let i = 0; i < min(10, names.length); i++) { // Show top 10 or fewer if less data
        let currentY = rowStartY + i * rowHeight + rowHeight / 2; // Center text vertically in row

        // Rank
        fill(50);
        textAlign(CENTER, CENTER);
        text(i + 1 + ".", rankX, currentY);

        // Name (Truncate if too long)
        fill(0);
        textAlign(LEFT, CENTER); // Align names left
        let maxNameWidth = lbWidth * 0.4; // Max width for name column
        let displayName = names[i];
        // Crude truncation based on char length (better: textWidth())
        if (displayName.length > 20) {
             displayName = displayName.substring(0, 18) + "...";
        }
        text(displayName, lbX + lbWidth * 0.28, currentY); // Adjusted X for left alignment

        // Time
        textAlign(RIGHT, CENTER); // Align times right
        // Format time from seconds (assuming stored as seconds)
         let scoreSeconds = parseFloat(scores[i]);
         if (!isNaN(scoreSeconds)) {
            text(formatTime(scoreSeconds), timeX + lbWidth * 0.15, currentY); // Use formatting function
         } else {
             text("N/A", timeX + lbWidth * 0.15, currentY);
         }
    }
}

// Format time to string M:SS.dd
function formatTime(seconds) {
     let min = floor(seconds / 60);
     let sec = floor(seconds) % 60;
     let dec = floor((seconds * 100) % 100); // Use floor for decimals
     return nf(min, 1) + ":" + nf(sec, 2, 0) + "." + nf(dec, 2, 0);
}


// API append STUFF - Kept as is from previous version
function boardAppend() {
    // Format time to ensure consistent decimal places for leaderboard
    let timeFormatted = time.toFixed(2);
    console.log("Submitting score:", playername, timeFormatted);

    // Check for invalid time (e.g., 0.00 if submitted instantly) - Optional
    if (parseFloat(timeFormatted) < 0.1 && playername !== 'test') { // Allow test submissions
        console.warn("Time seems too low, potential issue. Score not submitted.");
        return;
    }


    const scriptURL = "https://script.google.com/macros/s/AKfycbz9qCkxXs1JQz-hy2mFBxBmsMyNQDzGC8ufKpFSxB93NBaBTTs-uX26HCb0nQKGORNa/exec"; // Base URL

    // Encode playername to handle spaces or special characters in URL
    const encodedPlayerName = encodeURIComponent(playername);

    // Construct URL with query parameters
    // *** IMPORTANT: Ensure your Google Apps Script expects parameters named 'name' and 'score' ***
    // The original URL structure used '?numberpuzzlein&...' which is unusual.
    // Standard practice is ?param1=value1¶m2=value2
    const urlWithParams = `${scriptURL}?name=${encodedPlayerName}&score=${timeFormatted}`;

    // Using fetch instead of httpDo for better error handling and modern practice
    fetch(urlWithParams, { method: 'GET', mode: 'no-cors' }) // Use 'no-cors' if necessary, but proper CORS setup on script is better
      .then(response => {
          // Note: With 'no-cors', you can't read the response status or body.
          // The request is sent "fire and forget". Success/failure needs checking in the Google Sheet.
          console.log("Score submission request sent.");
      })
      .catch(error => {
          // This catch block might not be triggered for network errors with 'no-cors'.
          console.error("Error sending score submission request:", error);
      });
}

function sortLeads() {
    scores = [];
    names = [];
    if (!rankData || rankData.length === 0) {
        console.log("No rank data to sort.");
        return; // Exit if no data
    }

    // Create a copy to sort, leaving original rankData untouched if needed elsewhere
    let dataToSort = [...rankData];

    // Assuming rankData is [[name1, score1], [name2, score2], ...]
    // Sort by score (column index 1), ascending
    dataToSort.sort((a, b) => {
        // Ensure both elements are arrays with at least 2 items
        if (!Array.isArray(a) || a.length < 2) return 1;
        if (!Array.isArray(b) || b.length < 2) return -1;

        let scoreA = parseFloat(a[1]);
        let scoreB = parseFloat(b[1]);

        // Handle non-numeric scores gracefully (put them at the end)
        if (isNaN(scoreA) && isNaN(scoreB)) return 0; // Keep relative order if both NaN
        if (isNaN(scoreA)) return 1; // Put NaN scores after numbers
        if (isNaN(scoreB)) return -1; // Put NaN scores after numbers

        return scoreA - scoreB; // Sort ascending (lowest time first)
    });

    // Populate sorted names and scores arrays
    names = dataToSort.map(item => item[0]);
    scores = dataToSort.map(item => item[1]);

    console.log("Leaderboard data sorted.");
    // console.log("Sorted names:", names); // Debug
    // console.log("Sorted scores:", scores); // Debug
}

function myInputEvent() {
    playername = input.value().trim(); // Trim whitespace
    if (playername.length > 20) {
        playername = playername.substring(0, 20); // Truncate long names
        console.warn("Player name truncated to 20 characters.");
    } else if (playername === "") {
        playername = "anonymous";
    }

    if (!theyCheated) { boardAppend(); }
    else { console.log("Score not submitted because CHEATER!"); }

    input.hide();
    button.hide();
    takingInput = false;
    lead = false; // Prevent multiple submissions for the same win instance
    // Don't automatically restart timer here, draw loop handles it based on state

    // Optionally, reset the puzzle automatically after submission
    // mixit();
}

// --- New Mode and File Handling Functions ---

function toggleMode() {
    // Don't toggle if won or inputting name
    if (posstring === winstring || takingInput) return;

    if (currentMode === 'number') {
        // Only switch TO image mode if image is actually loaded
        if (imageLoaded) {
            currentMode = 'image';
            modeButton.html('Switch to Numbers'); // Update button text
            console.log("Switched to Image Mode");
        } else {
            console.warn("Cannot switch to Image Mode: Image not loaded.");
            // Optionally provide user feedback (e.g., flash button red, alert)
            // alert("Default image not loaded. Please wait or upload a custom image.");
            return; // Don't switch if image isn't ready
        }
    } else {
        currentMode = 'number';
        modeButton.html('Switch to Image Mode'); // Update button text
        console.log("Switched to Number Mode");
    }
    // Reset the puzzle state when switching modes to avoid confusion
    mixit();
}

function handleFile(file) {
     // Don't allow upload if won or inputting name
    if (posstring === winstring || takingInput) return;

    if (file.type && file.type.startsWith('image/')) { // More robust type checking
        console.log("Custom image selected:", file.name, file.type, file.size);
        // Load the user's image
        loadImage(file.data, img => {
            console.log("Custom image loaded in handleFile.");
            puzzleImage = img; // Update the active puzzle image
            createImageTiles(puzzleImage); // Create tiles from the new image
            if (imageLoaded) {
                 currentMode = 'image'; // Switch to image mode automatically
                 modeButton.html('Switch to Numbers'); // Update button text
                 mixit(); // Reset with the new image
                 console.log("Custom image loaded and applied successfully.");
            } else {
                 console.error("Failed to create tiles from custom image, reverting.");
                 alert("There was an issue processing the custom image. Reverting to default.");
                 puzzleImage = defaultPuzzleImage; // Revert to default
                 if (puzzleImage) { // Check if default exists
                    createImageTiles(puzzleImage); // Recreate default tiles
                 } else {
                    console.error("Default image missing, cannot revert.");
                    currentMode = 'number'; // Force number mode if no image available
                 }

            }
            fileInput.value(''); // Clear the file input
        }, err => {
            console.error("Error loading custom image data:", err);
            alert("Failed to load the selected image file. Please try a different file (jpg, png, webp).");
            puzzleImage = defaultPuzzleImage; // Revert to default on error
             if (puzzleImage) { createImageTiles(puzzleImage); }
            fileInput.value(''); // Clear the file input
        });
    } else {
        console.warn("Invalid file type selected:", file.type);
        alert('Please select a valid image file (e.g., jpg, png, webp).');
        fileInput.value(''); // Clear the input
    }
}


function windowResized() {
    // Recalculate dimensions and reposition elements if window is resized
    let gameHeight = window.innerHeight - 22;
    let puzzleAreaWidth = gameHeight;
    let totalWidth = puzzleAreaWidth + max(200, puzzleAreaWidth * 0.3);
    widthExtraPad = totalWidth - puzzleAreaWidth;

    resizeCanvas(totalWidth, gameHeight);

    // Recalculate canvas position
    var x = (windowWidth - width) / 2;
    var y = ((windowHeight - height) / 2);
    let cnv = select('canvas'); // Get the canvas element
    if (cnv) cnv.position(x,y);

    wid = floor(puzzleAreaWidth / 4); // Recalculate tile width

    // --- Reposition DOM Elements ---
    // Mode Button
    let buttonX = puzzleAreaWidth + pad;
    let buttonY = height - pad * 5;
    modeButton.position(x + buttonX, y + buttonY);
    modeButton.size(widthExtraPad - pad * 2, 25);

    // File Input
    fileInput.position(x + buttonX, y + buttonY + 35);
    fileInput.size(widthExtraPad - pad * 2);

    // Name input (only reposition if it exists and might be visible)
    if (input && button) {
        if (takingInput) {
            // Keep centered if taking input
             input.center(HORIZONTAL);
             input.position(input.x, height / 2);
             button.center(HORIZONTAL);
             button.position(button.x, input.y + input.height + 10);
        } else {
             // Reset to default hidden position if needed (or just let setup handle initial pos)
             input.center(HORIZONTAL);
             input.position(input.x, height * 0.55);
             button.center(HORIZONTAL);
             button.position(button.x, input.y + input.height + 5);
             input.hide();
             button.hide();
        }
    }

    // Recreate image tiles ONLY if an image exists and is loaded, as 'wid' changed
    if (puzzleImage && imageLoaded && wid > 0) {
        console.log("Window resized, recreating image tiles with new wid:", wid);
        createImageTiles(puzzleImage);
    } else {
         console.log("Window resized, but not recreating image tiles (no image/not loaded/invalid wid).");
    }

    console.log("Window resized processed.");
}