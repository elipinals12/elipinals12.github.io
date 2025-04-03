// ---- Global Variables ----
var wid, num, blank;
var pos = [];
var winstring = "1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,0";
// var reversewinstring = "0,15,14,13,12,11,10,9,8,7,6,5,4,3,2,1"; // Kept for reference
var reversewinstring = "nope"; // Disabled as per original code
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
const defaultImageUrl = "https://www.aces.edu/wp-content/uploads/2024/08/GettyImages-1003787612-scaled.jpg";
let defaultImageLoaded = false; // Flag to ensure slicing happens after loading

//----\/\/\/\/---A VERY COMPLICATED SLIDE PUZZLE---\/\/\/\/----

function preload() {
    preloadIsRunning = true;
    rankData = [];
    const apiKey = "AIzaSyDiEtTNaLP4xCi30j1xYQS5bNYBwlXwJbA"; // Consider hiding API keys if deploying publicly
    const spreadSheetId = "1SnjG8pGZHTnr_9wv0wJ9IR71MAfAwbNzm7ywd5CO6aM";
    fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadSheetId}/values/numberpuzzle!a2:b?key=${apiKey}`,
        { method: "GET" }
    )
        .then((r) => r.json())
        .then((data) => {
            if (data && data.values) {
                rankData = data.values.map((item) => item);
            } else {
                console.error("Failed to fetch or parse leaderboard data:", data);
                rankData = []; // Ensure it's an empty array on failure
            }
        }).catch(error => {
            console.error("Error fetching leaderboard:", error);
            rankData = []; // Ensure it's an empty array on error
        }).finally(() => {
             preloadIsRunning = false;
        });

    // Load the default image
    loadImage(defaultImageUrl, img => {
        defaultPuzzleImage = img;
        puzzleImage = img; // Start with the default image
        defaultImageLoaded = true; // Set flag when loaded
        console.log("Default image loaded.");
        // Slice image tiles *after* it's loaded (might happen after setup, so we check in setup)
        if (wid) { // Check if wid is already calculated in setup
             createImageTiles(puzzleImage);
        }
    }, err => {
        console.error("Failed to load default image:", err);
        // Maybe load a fallback placeholder or disable image mode?
    });

    // Note: preloadIsRunning will be set to false by the fetch's finally block.
}

function setup() {
    // Calculate dimensions based on window height
    let gameHeight = window.innerHeight - 22;
    let gameWidth = gameHeight / 8 * 12; // Keep aspect ratio
    // Adjust width to leave space for instructions/timer etc.
    let puzzleAreaWidth = gameHeight; // Puzzle area is square
    widthExtraPad = gameWidth - puzzleAreaWidth; // Calculate extra space dynamically

    var cnv = createCanvas(gameWidth, gameHeight);
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

    // Slice image if it loaded during preload
    if (defaultImageLoaded && !imageLoaded) {
        createImageTiles(puzzleImage);
    }

    mixit(); // Scramble the tiles

    // Name input setup
    input = createInput();
    input.size(100);
    input.center(); // p5 centers relative to canvas
    input.position(input.x - 10, height / 2); // Adjust position slightly
    button = createButton('submit');
    button.position(input.x + input.width, height / 2);
    input.hide();
    button.hide();

    // --- Mode Switching Button ---
    modeButton = createButton('Switch to Image Mode');
    // Position it relative to the canvas, e.g., near instructions
    let buttonX = puzzleAreaWidth + pad; // Start of the extra space area
    let buttonY = height - pad * 3; // Near the bottom
    modeButton.position(x + buttonX, y + buttonY); // Use canvas x, y offsets
    modeButton.mousePressed(toggleMode);

    // --- File Input for Custom Image ---
    fileInput = createFileInput(handleFile);
    fileInput.position(x + buttonX, y + buttonY + 30); // Place below mode button
    fileInput.attribute('accept', 'image/*'); // Suggest only image files

    console.log("Setup complete. Mode:", currentMode);
}

function draw() {
    background(0);
    noStroke();

    // Draw Instructions & Timer in the extra space
    drawSidePanel(width - widthExtraPad); // Pass the starting x-coordinate

    // Handle key repeats for movement
    if (keyIsDown(32) && !takingInput) { keydowntimer++; }
    else { keydowntimer = 0; }
    const repeattime = 10; // Faster repeat for smoother holding
    if (keydowntimer > 15 && (keydowntimer % repeattime) == repeattime - 1) { moveFromInput(true); } // Pass repeat=true

    // --- Cheat Message ---
    if (theyCheated) {
        fill(255, 0, 0); textAlign(CENTER, CENTER); stroke(0); strokeWeight(2); textSize(11);
        text("so you think you can get away with cheating", width / 2, height / 2 - 15);
        text("virus installing......", width / 2, height / 2);
        text("installed", width / 2, height / 2 + 15);
        return; // Stop drawing puzzle if cheating
    }

    // --- Draw Puzzle Grid ---
    textAlign(CENTER, CENTER);
    posstring = pos.toString(); // Check win condition later

    for (var row = 0; row < 4; row++) {
        for (var col = 0; col < 4; col++) {
            let tileIndexInPos = col * 4 + row; // Correct index calculation (col determines outer loop in your pos structure)
            num = pos[tileIndexInPos];
            let drawX = row * wid;
            let drawY = col * wid;

            if (num == 0) {
                // Draw nothing for the blank tile in either mode
                // Optionally, draw a subtle background for the empty slot:
                // fill(30); // Dark grey
                // noStroke();
                // rect(drawX, drawY, wid, wid);
                continue; // Skip drawing for blank tile
            }

            // --- Number Mode Drawing ---
            if (currentMode === 'number') {
                 // Original number drawing logic with gaps
                if (num % 2 != 0) { fill(255); }
                else { fill(255, 0, 0); }
                rect(drawX, drawY, wid - 6, wid - 10); // Background with gap

                if (num % 2 != 0) { fill(255, 80); }
                else { fill(255, 0, 0, 80); }
                rect(drawX, drawY, wid - 1, wid - 1); // Overlay with smaller gap

                if (num % 2 != 0) { fill(255, 0, 0); }
                else { fill(255); }
                noStroke();
                textSize(height / 6); // Adjust text size if needed
                text(num, drawX + .5 * wid, drawY + .5 * wid);
            }
            // --- Image Mode Drawing ---
            else if (currentMode === 'image') {
                if (imageLoaded && imageTiles.length === 15) { // Ensure tiles are ready
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
                    text('...', drawX + wid/2, drawY + wid/2);
                }
            }
        }
    }

    // --- Win Condition Check & Display ---
    textSize(height / 4.4);
    textAlign(LEFT); // For WINNER text alignment
    noStroke();
    if (posstring == winstring) {
        moveTimer = false; // Stop timer on win
        // Flashing WINNER text (same as original)
        fill(255, 150, 0, fader); text("WINNER!", pad, .55 * height / 4);
        fill(160, 255, 140, fader); text("WINNER!", pad, 1.55 * height / 4);
        fill(80, 60, 255, fader); text("WINNER!", pad, 2.55 * height / 4);
        fill(100, 160, 200, fader); text("WINNER!", pad, 3.55 * height / 4);
        fader -= winfadeint;
        if (fader < 0) { winfadeint = -5; }
        else if (fader > 260) { winfadeint = 5; }

        if (lead && !takingInput) { // Ask for name only once
            takeName();
        }
    } else if (posstring == reversewinstring && false) { // Reverse win (disabled)
        // ... (original reverse win code) ...
    } else {
        // Reset fade effect if not winning
        fader = 255;
        timefader = 255;
        if (!takingInput && !showLeads && !theyCheated) { // Only run timer if game is active
            moveTimer = true;
        }
    }

    // Show Leaderboard overlay if toggled
    if (showLeads) { showLeaderboard(width - widthExtraPad); } // Pass puzzle area width
}

// ---- Helper Functions ----

function createImageTiles(img) {
    if (!img || !img.width || !img.height || !wid) {
        console.error("Cannot create image tiles: Image not loaded or wid not set.");
        imageLoaded = false;
        return;
    }
     console.log("Creating image tiles...");

    imageTiles = []; // Clear existing tiles

    // --- Crop image to square from center ---
    let size = min(img.width, img.height);
    let offsetX = (img.width - size) / 2;
    let offsetY = (img.height - size) / 2;

    let tileW = size / 4;
    let tileH = size / 4;

    // Create tiles 1 through 15 (index 0 to 14)
    for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
            let index = y * 4 + x;
            if (index === 15) break; // Only need 15 tiles (0-14), the 16th spot is blank

            // Get subsection of the *original* image, considering the offset and tile size
            let tile = img.get(offsetX + x * tileW, offsetY + y * tileH, tileW, tileH);
            imageTiles.push(tile);
        }
    }

    if (imageTiles.length === 15) {
        imageLoaded = true;
        console.log("Image tiles created successfully.");
    } else {
        console.error("Failed to create the correct number of image tiles:", imageTiles.length);
        imageLoaded = false;
    }
}

function drawSidePanel(panelStartX) {
    // Instructions
    fill(255);
    textAlign(CENTER, TOP);
    textSize(height / 15.616);
    text("Instructions:", panelStartX + widthExtraPad / 2, pad);
    textSize(height / 23.425);
    let lineSpacing = height / 18;
    let textY = pad + lineSpacing * 1.5;
    text("Arrange tiles", panelStartX + widthExtraPad / 2, textY); textY += lineSpacing;
    text("1 to 15 or", panelStartX + widthExtraPad / 2, textY); textY += lineSpacing;
    text("complete the image.", panelStartX + widthExtraPad / 2, textY); textY += lineSpacing * 1.5;

    text("Arrows: Move Tile", panelStartX + widthExtraPad / 2, textY); textY += lineSpacing;
    text("Spacebar: Reset", panelStartX + widthExtraPad / 2, textY); textY += lineSpacing;
    text("L: Leaderboard", panelStartX + widthExtraPad / 2, textY); textY += lineSpacing;

    // Timer
    timer(panelStartX, textY + lineSpacing); // Pass position for timer
}


function timer(panelStartX, timerY) {
    textSize(height / 12); // Adjusted size for side panel
    fill(0, 255, 0, timefader);
    textAlign(CENTER, TOP);
    noStroke();

    let totalSeconds = floor(time);
    let minutes = floor(totalSeconds / 60);
    let seconds = totalSeconds % 60;
    let dec = round(timedecimal);

    let timeString = nf(minutes, 1) + ":" + nf(seconds, 2) + "." + nf(dec, 2);

    text(timeString, panelStartX + widthExtraPad / 2, timerY);

    if (moveTimer) {
        time = time + (1 / frameRate()); // Use frameRate() for more accuracy
        timedecimal = round(time * 100) % 100; // Calculate decimals correctly
    }

    // Fade out effect (if not winning, handled in draw)
    // if (posstring == winstring || posstring == reversewinstring) {
    //     timefader -= 10;
    //     if (timefader < -70) { timefader = 255; }
    // } else {
    //      timefader = 255; // Reset fade if not winning state (handled better in draw)
    // }
}


function takeName() {
    takingInput = true;
    moveTimer = false; // Pause timer while taking name

    // Draw background for input
    fill(255, 255, 255, 240);
    rectMode(CENTER);
    rect(width / 2, height / 2, 220, 110, 10); // Centered rectangle
    rectMode(CORNER); // Reset rectMode

    textAlign(CENTER, CENTER);
    textSize(30);
    noStroke();
    fill(0);
    text("You Won! Name?", width / 2, height / 2 - 25);

    // Show and position input elements relative to canvas center
    input.position(width / 2 - input.width / 2 - 5, height / 2 + 10);
    button.position(input.x + input.width, input.y);
    input.show();
    button.show();
    input.elt.focus(); // Focus the input field

    button.mousePressed(myInputEvent);
}

function swap(arr, a, b) {
    [arr[a], arr[b]] = [arr[b], arr[a]];
}

function mixit() {
    var b;
    var rand;
    // Perform a large number of valid random moves to shuffle
    for (var i = 0; i < 1000; i++) { // Increased iterations for better shuffle
        blank = pos.indexOf(0);
        let possibleMoves = [];
        // Check valid moves (avoid moving off-grid)
        if (blank < 12) possibleMoves.push(blank + 4); // Down
        if (blank > 3) possibleMoves.push(blank - 4); // Up
        if (blank % 4 != 3) possibleMoves.push(blank + 1); // Right
        if (blank % 4 != 0) possibleMoves.push(blank - 1); // Left

        if (possibleMoves.length > 0) {
             b = random(possibleMoves); // Choose a random *valid* move
             swap(pos, blank, b);
        }
    }
     // Ensure the puzzle is solvable (check inversions - complex, skipping for now, random moves usually work)

    // Reset game state
    time = 0;
    timedecimal = 0;
    timefader = 255;
    fader = 255;
    lead = true; // Allow submitting score again
    showLeads = false;
    takingInput = false;
    theyCheated = false;
    input.hide();
    button.hide();
    moveTimer = true; // Start timer only when mixit is called
    console.log("Puzzle mixed and reset.");
}

function keyPressed() {
    if (takingInput) {
        if (keyCode === ENTER || keyCode === RETURN) {
            myInputEvent();
        }
        return; // Ignore game controls while typing name
    }

    // Cheat detection (Ctrl+C might vary across OS/browsers, using a simpler one)
    // Using Ctrl + Q as an example (less likely accidental press)
    if (keyIsDown(CONTROL) && keyCode === 81) { // Ctrl + Q
        console.warn("Cheat detected!");
        pos = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 0, 15]; // Almost solved state
        theyCheated = true;
        moveTimer = false;
        return; // Prevent further key processing
    }

    if (keyCode === 76) { // 'L' key
        if (!showLeads) {
            preload(); // Re-fetch leaderboard data when opening
        }
        showLeads = !showLeads;
        moveTimer = !showLeads; // Pause timer when showing leaderboard
    } else if (keyCode === 32) { // Spacebar
         mixit(); // Reset the puzzle
         keydowntimer = 0; // Reset hold timer
    }
     else {
        // Allow instant move on key press, don't wait for repeat timer
        moveFromInput(false); // Pass repeat=false
    }
}

// Separated move logic
function moveTile(targetIndex) {
    blank = pos.indexOf(0);
     if (targetIndex >= 0 && targetIndex < 16) {
         // Check if the targetIndex is adjacent (orthogonally) to the blank space
         let blankRow = floor(blank / 4);
         let blankCol = blank % 4;
         let targetRow = floor(targetIndex / 4);
         let targetCol = targetIndex % 4;

         if ((abs(blankRow - targetRow) == 1 && blankCol == targetCol) || // Vertical move
             (abs(blankCol - targetCol) == 1 && blankRow == targetRow))   // Horizontal move
         {
             swap(pos, blank, targetIndex);
             return true; // Move was successful
         }
    }
    return false; // Move was not valid/successful
}


// Updated moveFromInput to handle both key press and key repeat
function moveFromInput(isRepeating) {
    if (takingInput || showLeads || theyCheated || posstring == winstring) return; // Don't move if inputting, showing leads, cheated, or won

    blank = pos.indexOf(0);
    var target = -1; // Index of the tile to swap with blank

    if (keyCode == UP_ARROW)    target = blank + 4; // Tile below blank moves up
    else if (keyCode == DOWN_ARROW)  target = blank - 4; // Tile above blank moves down
    else if (keyCode == LEFT_ARROW)  target = blank + 1; // Tile right of blank moves left
    else if (keyCode == RIGHT_ARROW) target = blank - 1; // Tile left of blank moves right

    // Spacebar handled in keyPressed directly
    // else if (keyCode == 32 && !isRepeating) { // Only allow reset on initial press, not repeat
    //     mixit();
    //     return; // Don't try to swap after reset
    // }

    if (target >= 0 && target < 16) {
        // Check if the move is valid (tile exists and is adjacent)
        // The calculation logic is implicitly based on moving the *tile* into the blank space
        // E.g., pressing UP means the tile *below* the blank space moves *up* into it.
        let blankCol = blank % 4;
        let targetCol = target % 4;

        // Prevent wrap-around moves implicitly handled by the target index check,
        // but add explicit checks for left/right arrow consistency.
        if (keyCode == LEFT_ARROW && blankCol == 3) return; // Can't move tile from right if blank is on right edge
        if (keyCode == RIGHT_ARROW && blankCol == 0) return; // Can't move tile from left if blank is on left edge

        swap(pos, blank, target);
    }
}

// Removed keyReleased - not needed with current key repeat logic

function showLeaderboard(puzzleAreaWidth) {
    sortLeads(); // Ensure data is sorted before displaying

    // Semi-transparent background overlay
    fill(0, 0, 150, 200); // Darker blue, more opaque
    noStroke();
    // Cover the whole canvas for focus
    rect(0, 0, width, height);

    // --- Leaderboard Box ---
    let lbWidth = width * 0.6;
    let lbHeight = height * 0.7;
    let lbX = (width - lbWidth) / 2;
    let lbY = (height - lbHeight) / 2;

    fill(230, 230, 255, 245); // Light background for the board
    stroke(50, 50, 150);
    strokeWeight(3);
    rect(lbX, lbY, lbWidth, lbHeight, 15); // Rounded corners

    // Title
    fill(0, 0, 100);
    noStroke();
    textSize(lbWidth / 15);
    textAlign(CENTER, TOP);
    text("Top 10 Leaderboard", width / 2, lbY + pad);

    // Loading indicator
    if (preloadIsRunning) {
        fill(255, 0, 0);
        textSize(lbWidth / 25);
        text("Loading...", width / 2, lbY + pad * 3);
        return; // Don't draw scores if loading
    }

    if (!rankData || rankData.length === 0) {
        fill(100);
        textSize(lbWidth / 25);
        text("No scores yet, or failed to load.", width / 2, height/2);
        return;
    }


    // Column Titles
    stroke(50, 50, 150);
    strokeWeight(1);
    let titleY = lbY + pad * 3.5;
    let rankX = lbX + lbWidth * 0.15;
    let nameX = lbX + lbWidth * 0.45;
    let timeX = lbX + lbWidth * 0.80;
    textSize(lbWidth / 22);
    fill(0);
    textAlign(CENTER, CENTER);
    text("Rank", rankX, titleY);
    text("Name", nameX, titleY);
    text("Time (s)", timeX, titleY);
    line(lbX + pad, titleY + pad, lbX + lbWidth - pad, titleY + pad); // Underline titles


    // Display Scores
    textSize(lbWidth / 28);
    let rowStartY = titleY + pad * 2;
    let rowHeight = (lbHeight - (rowStartY - lbY) - pad) / 10; // Calculate height per row

    for (let i = 0; i < min(10, names.length); i++) { // Show top 10 or fewer if less data
        let currentY = rowStartY + i * rowHeight + rowHeight / 2; // Center text vertically in row
        // Rank
        textAlign(CENTER, CENTER);
        text(i + 1 + ".", rankX, currentY);
        // Name
        textAlign(LEFT, CENTER); // Align names left for readability
        text(names[i], lbX + lbWidth * 0.3, currentY); // Adjusted X for left alignment
        // Time
        textAlign(RIGHT, CENTER); // Align times right
        // Format time from seconds (assuming stored as seconds)
         let scoreSeconds = parseFloat(scores[i]);
         if (!isNaN(scoreSeconds)) {
             let scoreMinutes = floor(scoreSeconds / 60);
             let scoreSecs = (scoreSeconds % 60).toFixed(2); // Keep 2 decimal places
             text(nf(scoreMinutes,1) + ":" + nf(scoreSecs,2,2), timeX + lbWidth * 0.1, currentY); // Adjusted X for right alignment
         } else {
             text("N/A", timeX + lbWidth * 0.1, currentY);
         }
    }
}

// Format time to string M:SS.dd
function formatTime(seconds) {
     let min = floor(seconds / 60);
     let sec = floor(seconds) % 60;
     let dec = round((seconds * 100) % 100);
     return nf(min, 1) + ":" + nf(sec, 2) + "." + nf(dec, 2);
}


function rowHeight(i) { // This seems unused now, replaced by dynamic calculation in showLeaderboard
    // return 4 * pad + ((height - 4 * pad) / 11) * (i + 1);
    return 0; // Placeholder
}

//API append STUFF - Kept as is
function boardAppend() {
    // Format time to ensure consistent decimal places for leaderboard
    let timeFormatted = time.toFixed(2);
    console.log("Submitting score:", playername, timeFormatted);

    const id = "numberpuzzlein"; // Make sure this matches your Google Apps Script parameter
    // Encode playername to handle spaces or special characters in URL
    const encodedPlayerName = encodeURIComponent(playername);
    var url =
        "https://script.google.com/macros/s/AKfycbz9qCkxXs1JQz-hy2mFBxBmsMyNQDzGC8ufKpFSxB93NBaBTTs-uX26HCb0nQKGORNa/exec" +
        "?" + id + // Using 'id' as the first parameter name based on your example URL structure
        "&name=" + encodedPlayerName + // Parameter name for player name
        "&score=" + timeFormatted;     // Parameter name for time/score

    // Using fetch instead of httpDo for better error handling and modern practice
    fetch(url, { method: 'GET', mode: 'no-cors' }) // Use 'no-cors' if necessary, but proper CORS setup on script is better
      .then(response => {
          console.log("Score submission attempted.");
          // Note: With 'no-cors', you can't read the response, but the request is sent.
          // If you control the Apps Script, setting CORS headers allows reading the response.
      })
      .catch(error => {
          console.error("Error submitting score:", error);
      });
}

function sortLeads() {
    scores = [];
    names = [];
    if (!rankData || rankData.length === 0) {
        console.log("No rank data to sort.");
        return; // Exit if no data
    }

    // Assuming rankData is [[name1, score1], [name2, score2], ...]
    // Sort by score (column index 1), ascending
    rankData.sort((a, b) => {
        let scoreA = parseFloat(a[1]);
        let scoreB = parseFloat(b[1]);
        if (isNaN(scoreA)) return 1; // Put invalid scores last
        if (isNaN(scoreB)) return -1;
        return scoreA - scoreB; // Sort ascending (lowest time first)
    });

    // Populate sorted names and scores arrays
    for (var i = 0; i < rankData.length; i++) {
         if (rankData[i] && rankData[i].length >= 2) {
            append(names, rankData[i][0]); // Name is at index 0
            append(scores, rankData[i][1]); // Score is at index 1
         }
    }
     // console.log("Sorted names:", names);
     // console.log("Sorted scores:", scores);
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
    lead = false; // Prevent multiple submissions for the same win
    moveTimer = true; // Resume timer logic (though it should be stopped by win condition)

    // Optionally, reset the puzzle automatically after submission
    // mixit();
}

// --- New Mode and File Handling Functions ---

function toggleMode() {
    if (currentMode === 'number') {
        if (imageLoaded) {
            currentMode = 'image';
            modeButton.html('Switch to Numbers');
            console.log("Switched to Image Mode");
        } else {
            alert("Image is still loading or failed to load. Please wait or try uploading a custom image.");
            return; // Don't switch if image isn't ready
        }
    } else {
        currentMode = 'number';
        modeButton.html('Switch to Image Mode');
        console.log("Switched to Number Mode");
    }
    // Reset the puzzle when switching modes
    mixit();
}

function handleFile(file) {
    if (file.type === 'image') {
        console.log("Custom image selected:", file.name);
        // Load the user's image
        loadImage(file.data, img => {
            puzzleImage = img; // Update the active puzzle image
            createImageTiles(puzzleImage); // Create tiles from the new image
            if (imageLoaded) {
                 currentMode = 'image'; // Switch to image mode automatically
                 modeButton.html('Switch to Numbers');
                 mixit(); // Reset with the new image
                 console.log("Custom image loaded and applied.");
            } else {
                 alert("There was an issue processing the custom image.");
                 puzzleImage = defaultPuzzleImage; // Revert to default
                 createImageTiles(puzzleImage); // Recreate default tiles
            }
        }, err => {
            console.error("Error loading custom image:", err);
            alert("Failed to load the selected image file.");
            puzzleImage = defaultPuzzleImage; // Revert to default on error
            createImageTiles(puzzleImage);
        });
    } else {
        alert('Please select an image file (jpg, png, gif).');
        fileInput.value(''); // Clear the input
    }
}


function windowResized() {
    // Recalculate dimensions and reposition elements if window is resized
    let gameHeight = window.innerHeight - 22;
    let gameWidth = gameHeight / 8 * 12;
    let puzzleAreaWidth = gameHeight;
    widthExtraPad = gameWidth - puzzleAreaWidth;

    resizeCanvas(gameWidth, gameHeight);

    // Recalculate canvas position
    var x = (windowWidth - width) / 2;
    var y = ((windowHeight - height) / 2);
    let cnv = select('canvas'); // Get the canvas element
    if (cnv) cnv.position(x,y);

    wid = floor(puzzleAreaWidth / 4); // Recalculate tile width

    // Recalculate positions for UI elements
    let buttonX = puzzleAreaWidth + pad;
    let buttonY = height - pad * 3;
    modeButton.position(x + buttonX, y + buttonY);
    fileInput.position(x + buttonX, y + buttonY + 30);

    // Reposition name input if visible
    if (takingInput) {
         input.position(width / 2 - input.width / 2 - 5, height / 2 + 10);
         button.position(input.x + input.width, input.y);
    } else {
         // Ensure they are centered correctly if setup logic relied on initial center()
         input.center();
         input.position(input.x - 10, height / 2);
         button.position(input.x + input.width, height / 2);
         if (!takingInput) { // Hide again if not currently taking input
            input.hide();
            button.hide();
         }
    }


    // Recreate image tiles if in image mode, as 'wid' might have changed
    if (puzzleImage) { // Check if an image exists
        createImageTiles(puzzleImage);
    } else if (defaultImageLoaded) { // Fallback to default if custom wasn't loaded but default was
        createImageTiles(defaultPuzzleImage);
    }

    console.log("Window resized, elements repositioned and image tiles potentially recreated.");
}