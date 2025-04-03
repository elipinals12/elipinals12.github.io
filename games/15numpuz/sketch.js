// ---- Global Variables ----
var wid, num, blank;
var pos = [];
var winstring = "1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,0";
var reversewinstring = "nope";
var fader = 255;
var timefader = 255;
var winfadeint = 5;
var posstring = ""; // Initialize empty
var time = 0;
var moveTimer = false; // Start paused until mixit runs
let timedecimal = 0;

var lead = true;
var playername = "anonymous";
let rankData = []; // Initialize empty
let scores = [];
let names = [];
let takingInput = false;
let input, button; // For name input
let showLeads = false;
let preloadIsRunning = false;
let hadjust;
let theyCheated = false; // Initialize
var pad = 20;
var widthExtraPad = 100; // Space for instructions/timer

var keydowntimer = 0;

// ---- Mode & Image Variables ----
let currentMode = 'number'; // 'number' or 'image'
let defaultPuzzleImage;
let puzzleImage; // The currently active image (default or custom)
let imageTiles = []; // Array to hold p5.Image objects for each tile
let imageLoaded = false; // Flag: Set true ONLY if image loads AND tiles are created
let modeButton;
let fileInput;

// *** USING THE DIRECT FILE PATH ***
// NOTE: This will likely FAIL to load if you open the HTML directly via file:///
//       You MUST use a local web server (e.g., VS Code Live Server) for this path to work.
const defaultImagePath = './../../ref/realtree.jpg';
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

let defaultImageLoadAttempted = false; // Track if load was tried
let defaultImageLoadSuccess = false;   // Track if load succeeded


//----\/\/\/\/---A VERY COMPLICATED SLIDE PUZZLE---\/\/\/\/----

function preload() {
    console.log("Preload started...");
    preloadIsRunning = true;
    rankData = []; scores = []; names = []; // Reset leaderboard data
    const apiKey = "AIzaSyDiEtTNaLP4xCi30j1xYQS5bNYBwlXwJbA";
    const spreadSheetId = "1SnjG8pGZHTnr_9wv0wJ9IR71MAfAwbNzm7ywd5CO6aM";

    // --- Fetch Leaderboard Data ---
    fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadSheetId}/values/numberpuzzle!a2:b?key=${apiKey}`,
        { method: "GET" }
    )
        .then(r => r.ok ? r.json() : Promise.reject(`HTTP error ${r.status}`))
        .then(data => {
            if (data && data.values) {
                rankData = data.values.map(item => item);
                console.log("Leaderboard data potentially loaded.");
                sortLeads();
            } else { rankData = []; console.error("Failed to parse leaderboard data."); }
        }).catch(error => {
            console.error("Error fetching leaderboard:", error); rankData = [];
        }).finally(() => {
             preloadIsRunning = false; console.log("Leaderboard fetch finished.");
        });

    // --- Attempt to load the default image from PATH ---
    console.log("Attempting to load image from path:", defaultImagePath);
    defaultImageLoadAttempted = true; // Mark that we tried
    loadImage(defaultImagePath, img => {
        console.log("SUCCESS: Image loaded successfully from path:", defaultImagePath);
        defaultPuzzleImage = img;
        puzzleImage = img;
        defaultImageLoadSuccess = true; // Set flag on successful load
        if (wid > 0) { createImageTiles(puzzleImage); } // Create tiles if setup already ran
    }, err => {
        // THIS IS EXPECTED WHEN RUNNING FROM file:///
        console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        console.error("ERROR: Failed to load image from path:", defaultImagePath, err);
        console.error(">> This is EXPECTED if you opened the HTML file directly (file:///). <<");
        console.error(">> To load local images by path, run using a LOCAL WEB SERVER. <<");
        console.error(">> (e.g., VS Code 'Live Server' extension or 'python -m http.server') <<");
        console.error("Image mode will be unavailable.");
        console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        defaultImageLoadSuccess = false;
    });
     console.log("Preload finished.");
}

function setup() {
    console.log("Setup started...");
    // Calculate dimensions
    let gameHeight = window.innerHeight - 22;
    let puzzleAreaWidth = gameHeight;
    let totalWidth = puzzleAreaWidth + max(200, puzzleAreaWidth * 0.3);
    widthExtraPad = totalWidth - puzzleAreaWidth;

    var cnv = createCanvas(totalWidth, gameHeight);
    var x = (windowWidth - width) / 2;
    var y = ((windowHeight - height) / 2);
    cnv.position(x, y);

    wid = floor(puzzleAreaWidth / 4); // Tile width

    // Initial tile setup (1-15, 0) - always do this
    pos = [];
    for (var i = 1; i < 16; i++) { append(pos, i); }
    append(pos, 0);
    posstring = pos.toString(); // Initial state string

    textFont('Helvetica');

    // Attempt to create image tiles if image load succeeded AND wid is valid
    if (defaultImageLoadSuccess && wid > 0) {
        console.log("Setup: Image load succeeded, creating image tiles.");
        createImageTiles(puzzleImage); // This will set imageLoaded flag
    } else {
         console.log("Setup: Image load failed or wid invalid, skipping tile creation.");
         imageLoaded = false; // Ensure image mode isn't accidentally available
    }

    // --- Create DOM Elements ---
    input = createInput();
    button = createButton('submit');
    input.size(max(100, widthExtraPad * 0.4));
    let inputX = width / 2 - input.width / 2;
    input.position(x + inputX, y + height * 0.55); // Position relative to canvas
    let buttonXpos = width / 2 - button.width / 2;
    button.position(x + buttonXpos, y + input.y + input.height + 5); // Position relative to canvas
    input.hide(); button.hide();

    // Mode Switching Button
    modeButton = createButton('Switch to Image Mode');
    let uiStartX = puzzleAreaWidth + pad;
    let modeButtonY = height - pad * 5;
    modeButton.position(x + uiStartX, y + modeButtonY);
    modeButton.mousePressed(toggleMode);
    modeButton.size(widthExtraPad - pad * 2, 25);
    // Initially disable button - will be enabled only if image tiles are created
    modeButton.attribute('disabled', '');
    modeButton.html('Image Unavailable');


    // File Input (Optional, keep hidden for offline, enable if using server)
    fileInput = createFileInput(handleFile);
    fileInput.position(x + uiStartX, y + modeButtonY + 35);
    fileInput.attribute('accept', 'image/*');
    fileInput.size(widthExtraPad - pad * 2);
    fileInput.hide(); // Hide for offline use


    console.log("Setup complete. Mode:", currentMode, "Tile width:", wid, "Image Load Success:", defaultImageLoadSuccess, "Tiles Created:", imageLoaded);

    // Mix the puzzle *last*
    mixit();
}

function draw() {
    // Basic safety check
    if (!pos || pos.length !== 16) { background(255,0,0); noLoop(); return; }

    background(0);
    noStroke();
    let puzzleAreaWidth = width - widthExtraPad;

    // Update position string for win check
    posstring = pos.toString();

    // --- Draw Puzzle Grid Area ---
    push();
    textAlign(CENTER, CENTER);
    blank = pos.indexOf(0);
    let blankCol = (blank !== -1) ? blank % 4 : -1;
    let blankRow = (blank !== -1) ? floor(blank / 4) : -1;

    for (var row = 0; row < 4; row++) {
        for (var col = 0; col < 4; col++) {
            let tileIndexInPos = row * 4 + col;
            num = pos[tileIndexInPos];
            let drawX = col * wid; let drawY = row * wid;

            if (num == 0) { // Blank space
                fill(15); noStroke();
                if (wid > 0) rect(drawX, drawY, wid, wid);
                continue;
            }

            // --- Number Mode Drawing ---
            if (currentMode === 'number') {
                 let gap = 4; let shadowOffset = 3;
                 let tileW = wid - gap * 2; let tileH = wid - gap * 2;
                 if (tileW <= 0) continue;

                 fill(0, 0, 0, 100); // Shadow
                 rect(drawX + gap + shadowOffset, drawY + gap + shadowOffset, tileW, tileH, 3);
                 if (num % 2 != 0) { fill(240); } else { fill(200, 0, 0); } // Tile color
                 stroke(50); strokeWeight(1); rect(drawX + gap, drawY + gap, tileW, tileH, 3);
                 if (num % 2 != 0) { fill(200, 0, 0); } else { fill(240); } // Text color
                 noStroke(); textSize(wid * 0.55);
                 text(num, drawX + wid * 0.5, drawY + wid * 0.55);
            }
            // --- Image Mode Drawing ---
            else if (currentMode === 'image') {
                 if (wid <= 0) continue;
                 if (imageLoaded && imageTiles && imageTiles.length >= 15) { // Need at least 15
                    let tileImage = imageTiles[num - 1]; // Use index num-1
                    if (tileImage && tileImage.width > 0) {
                        image(tileImage, drawX, drawY, wid, wid); // Flush image
                    } else { fill(100); noStroke(); rect(drawX, drawY, wid, wid); } // Bad tile fallback
                 } else { // Image/tiles not ready fallback
                    fill(50); noStroke(); rect(drawX, drawY, wid, wid);
                    fill(200); textSize(wid / 4); text('IMG?', drawX + wid/2, drawY + wid/2);
                 }
            }
        }
    }
    pop(); // Restore drawing state

    // --- Draw Side Panel ---
    drawSidePanel(puzzleAreaWidth);

    // Handle key repeats
    handleKeyRepeat();

    // --- Cheat Message ---
    drawCheatMessage();

    // --- Win Condition Check & Display ---
    drawWinCondition(puzzleAreaWidth, blankCol, blankRow);

    // Show Leaderboard overlay if toggled
    if (showLeads) { showLeaderboard(); }
}

// ---- Helper Drawing Functions ----

function handleKeyRepeat() {
    // Same as before
    if ((keyIsDown(UP_ARROW) || keyIsDown(DOWN_ARROW) || keyIsDown(LEFT_ARROW) || keyIsDown(RIGHT_ARROW)) && !takingInput && !showLeads && moveTimer) { keydowntimer++; } else { keydowntimer = 0; }
    const repeattime = 8; if (keydowntimer > 10 && (keydowntimer % repeattime) === 0) { moveFromInput(); }
}

function drawCheatMessage() {
    // Same as before
    if (theyCheated) { fill(255, 0, 0); textAlign(CENTER, CENTER); stroke(0); strokeWeight(2); textSize(11); text("so you think you can get away with cheating", width / 2, height / 2 - 15); text("virus installing......", width / 2, height / 2); text("installed", width / 2, height / 2 + 15); if (moveTimer) moveTimer = false; }
}

function drawWinCondition(puzzleAreaWidth, blankCol, blankRow) {
    let isWin = (posstring === winstring);

    if (isWin && !theyCheated) {
        if (moveTimer) { moveTimer = false; console.log("Winner! Final time:", formatTime(time)); }

        // Fill blank spot in IMAGE mode on win
        if (currentMode === 'image' && imageLoaded && imageTiles.length >= 15 && blankCol !== -1 && wid > 0) { // Check length >= 15
             let finalTileIndex = 14; // Tile 15 is at index 14
             // Check if the 15th tile exists (might be 16th piece if code created extra)
             if (imageTiles.length > finalTileIndex && imageTiles[finalTileIndex] && imageTiles[finalTileIndex].width > 0) {
                 image(imageTiles[finalTileIndex], blankCol * wid, blankRow * wid, wid, wid);
             } else { console.warn("Could not find final tile (index 14) to fill blank space."); }
        }

        // Draw flashing "WINNER!" text
        let winnerTextSize = puzzleAreaWidth > 0 ? puzzleAreaWidth / 4.4 : 20;
        textSize(winnerTextSize); textAlign(LEFT); noStroke();
        fill(255, 150, 0, fader); text("WINNER!", pad, .55 * height / 4);
        fill(160, 255, 140, fader); text("WINNER!", pad, 1.55 * height / 4);
        fill(80, 60, 255, fader); text("WINNER!", pad, 2.55 * height / 4);
        fill(100, 160, 200, fader); text("WINNER!", pad, 3.55 * height / 4);
        fader -= winfadeint; if (fader < 0) { winfadeint = -5; } else if (fader > 260) { winfadeint = 5; }

        if (lead && !takingInput) { takeName(); }

    } else { // Not winning or cheated
        fader = 255;
        moveTimer = (!takingInput && !showLeads && !theyCheated && !isWin); // Determine if timer should run
    }
}


// ---- Other Helper Functions ----

function createImageTiles(img) {
    imageLoaded = false; imageTiles = []; // Reset
    if (!img || typeof img.get !== 'function' || !img.width || img.width <= 0) { console.error("CreateTiles: Invalid image."); return; }
    if (!wid || wid <= 0) { console.error("CreateTiles: Invalid tile width (wid)."); return; }
    console.log(`CreateTiles: Image ${img.width}x${img.height}, Tile width ${wid}`);

    let allTilesCreated = true;
    let size = min(img.width, img.height); let offsetX = (img.width - size) / 2; let offsetY = (img.height - size) / 2;
    let srcTileW = size / 4; let srcTileH = size / 4;
    if (srcTileW <= 0) { console.error("CreateTiles: Invalid source tile width."); return; }

    // Create 15 tiles (indices 0-14)
    for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
            let index = y * 4 + x;
            if (index === 15) break; // Stop after getting 15th tile (index 14)

            try {
                let sx = floor(offsetX + x * srcTileW); let sy = floor(offsetY + y * srcTileH);
                let sw = floor(srcTileW); let sh = floor(srcTileH);
                if (sx < 0 || sy < 0 || sw <= 0 || sh <= 0 || sx + sw > img.width || sy + sh > img.height) { throw new Error(`img.get params out of bounds for tile ${index}`); }
                let tile = img.get(sx, sy, sw, sh);
                imageTiles.push(tile);
            } catch (e) {
                console.error(`Error creating tile index ${index}:`, e);
                // Add placeholder graphics? For now, just mark failure.
                allTilesCreated = false;
                 // Optionally break loop on first error?
                 // break; // Uncomment to stop creating tiles after first error
            }
        }
         // if (!allTilesCreated) break; // Uncomment to stop outer loop on error
    }

    // Check if exactly 15 tiles were created without errors
    if (imageTiles.length === 15 && allTilesCreated) {
        imageLoaded = true; // Set flag: image IS ready for use
        console.log("Image tiles created successfully (15 tiles). imageLoaded = true");
        if (modeButton) { // Enable mode button
             modeButton.removeAttribute('disabled');
             modeButton.html('Switch to Image Mode');
        }
    } else {
        imageLoaded = false; // Set flag: image is NOT ready
        console.error(`Failed to create all image tiles successfully. Count: ${imageTiles.length}, Errors: ${!allTilesCreated}. imageLoaded = false`);
         if (modeButton) { // Keep button disabled
             modeButton.attribute('disabled', '');
             modeButton.html('Image Unavailable');
         }
    }
}

function drawSidePanel(panelStartX) {
    // Same as before
    push(); translate(panelStartX, 0); let panelWidth = width - panelStartX;
    fill(220); textAlign(CENTER, TOP); textSize(max(16, panelWidth * 0.1)); text("Instructions", panelWidth / 2, pad);
    textSize(max(12, panelWidth * 0.07)); let lineSpacing = max(18, panelWidth * 0.09); let textY = pad * 3;
    text("Arrange tiles", panelWidth / 2, textY); textY += lineSpacing; text("1 to 15 or", panelWidth / 2, textY); textY += lineSpacing; text("complete the image.", panelWidth / 2, textY); textY += lineSpacing * 1.5;
    fill(200, 200, 0); text("Arrows: Move Tile", panelWidth / 2, textY); textY += lineSpacing; text("Spacebar: Reset", panelWidth / 2, textY); textY += lineSpacing; text("L: Leaderboard", panelWidth / 2, textY); textY += lineSpacing; text("M: Toggle Mode", panelWidth / 2, textY);
    timer(0, textY + lineSpacing * 1.5, panelWidth);
    fill(100); textSize(max(9, panelWidth * 0.05)); textAlign(CENTER, TOP);
    // Adjusted y-position for the offline message text
    let offlineMsgY = height - pad * 3.5;
    text("(Custom image upload hidden/disabled)", panelWidth/2, offlineMsgY);
    text("(Run via local server to load image by path)", panelWidth/2, offlineMsgY + lineSpacing * 0.8);
    pop();
}

function timer(timerX, timerY, panelWidth) {
    // Same as before
    textSize(max(24, panelWidth * 0.15)); fill(0, 255, 0, timefader); textAlign(CENTER, TOP); noStroke();
    let totalSeconds = floor(time); let minutes = floor(totalSeconds / 60); let seconds = totalSeconds % 60; timedecimal = floor((time - totalSeconds) * 100);
    let timeString = nf(minutes, 1) + ":" + nf(seconds, 2, 0) + "." + nf(timedecimal, 2, 0);
    text(timeString, timerX + panelWidth / 2, timerY);
    if (moveTimer) { time = time + deltaTime / 1000.0; }
}

function takeName() {
    // Same as before, ensure elements exist
     if (!input || !button) { console.error("takeName: Input/button not defined."); return; }
    takingInput = true; moveTimer = false; console.log("Taking player name...");
    fill(0, 0, 0, 180); rect(0, 0, width, height); fill(220, 220, 255, 240); rectMode(CENTER);
    let boxW = max(250, width * 0.3); let boxH = max(150, height * 0.25); rect(width / 2, height / 2, boxW, boxH, 10); rectMode(CORNER);
    textAlign(CENTER, CENTER); textSize(max(20, boxW * 0.1)); noStroke(); fill(0); text("You Won! Name?", width / 2, height / 2 - boxH * 0.2);
    let inputX = width / 2 - input.width / 2; input.position(inputX, height / 2);
    let buttonXpos = width / 2 - button.width / 2; button.position(buttonXpos, input.y + input.height + 10);
    input.show(); button.show(); input.elt.focus();
    button.mousePressed(null); button.mousePressed(myInputEvent);
}

function swap(arr, a, b) {
    // Same as before
    if (a >= 0 && a < arr.length && b >= 0 && b < arr.length) { [arr[a], arr[b]] = [arr[b], arr[a]]; } else { console.error("Invalid swap indices:", a, b); }
}

function mixit() {
    // Same as before
    var b; var attempts = 0; const maxShuffleMoves = 1000; console.log("Mixing puzzle...");
    pos = []; for (var i = 1; i < 16; i++) { append(pos, i); } append(pos, 0); blank = 15; let lastMove = -1;
    for (var i = 0; i < maxShuffleMoves && attempts < maxShuffleMoves * 2; i++) { blank = pos.indexOf(0); let possibleMoves = []; let potential_b; potential_b = blank + 4; if (blank < 12 && potential_b !== lastMove) possibleMoves.push(potential_b); potential_b = blank - 4; if (blank > 3 && potential_b !== lastMove) possibleMoves.push(potential_b); potential_b = blank + 1; if (blank % 4 != 3 && potential_b !== lastMove) possibleMoves.push(potential_b); potential_b = blank - 1; if (blank % 4 != 0 && potential_b !== lastMove) possibleMoves.push(potential_b); if (possibleMoves.length > 0) { b = random(possibleMoves); swap(pos, blank, b); lastMove = blank; blank = b; } else { i--; } attempts++; }
    time = 0; timedecimal = 0; timefader = 255; fader = 255; lead = true; showLeads = false; takingInput = false; theyCheated = false;
    if (input) input.hide(); if (button) button.hide(); moveTimer = true; keydowntimer = 0;
    posstring = pos.toString(); console.log("Puzzle mixed and reset.");
}

function keyPressed() {
    // Same as before
    if (takingInput) { if (keyCode === ENTER || keyCode === RETURN) { myInputEvent(); } return; }
    if (keyCode === 76) { if (!showLeads) { preloadIsRunning = true; const apiKey="..."; const spreadSheetId="..."; fetch(`...`).then(r=>r.ok?r.json():Promise.reject(`HTTP error ${r.status}`)).then(d=>{rankData=d.values||[];sortLeads();}).catch(e=>{console.error("Err updating LB:", e);rankData=[];}).finally(()=>{preloadIsRunning=false;});} showLeads=!showLeads; moveTimer=!showLeads; console.log("Toggled LB. Show:", showLeads); return; }
    if (showLeads) { return; }
    if (keyIsDown(CONTROL) && keyCode === 81) { console.warn("Cheat!"); pos=[1,2,3,4,5,6,7,8,9,10,11,12,13,14,0,15]; posstring=pos.toString(); theyCheated=true; moveTimer=false; fader=255; return; }
    if (keyCode === 32) { mixit(); } else if (keyCode === 77) { toggleMode(); } else if (keyCode === UP_ARROW || keyCode === DOWN_ARROW || keyCode === LEFT_ARROW || keyCode === RIGHT_ARROW) { moveFromInput(); keydowntimer = 0; }
}

function moveFromInput() {
    // Same as before
    if (posstring == winstring || takingInput || showLeads || theyCheated) { return; } blank = pos.indexOf(0); if (blank === -1) { return; } var targetIndex = -1; if (keyCode == UP_ARROW && blank < 12) { targetIndex = blank + 4; } else if (keyCode == DOWN_ARROW && blank > 3) { targetIndex = blank - 4; } else if (keyCode == LEFT_ARROW && blank % 4 != 3) { targetIndex = blank + 1; } else if (keyCode == RIGHT_ARROW && blank % 4 != 0) { targetIndex = blank - 1; } if (targetIndex !== -1) { swap(pos, blank, targetIndex); }
}

function showLeaderboard() {
    // Same as before
    fill(10, 10, 40, 220); noStroke(); rect(0, 0, width, height); let lbWidth = constrain(width*0.7,300,600); let lbHeight=constrain(height*0.8,400,700); let lbX=(width-lbWidth)/2; let lbY=(height-lbHeight)/2; fill(240,240,255,250); stroke(80,80,180); strokeWeight(3); rect(lbX,lbY,lbWidth,lbHeight,15); fill(0,0,100); noStroke(); textSize(constrain(lbWidth/15,20,36)); textAlign(CENTER,TOP); text("Top 10 Leaderboard",width/2,lbY+pad*1.5); fill(100); textSize(constrain(lbWidth/35,10,14)); text("Press 'L' to close",width/2,lbY+lbHeight-pad); if(preloadIsRunning){fill(200,0,0); textSize(constrain(lbWidth/25,14,22)); textAlign(CENTER,CENTER); text("Loading...",width/2,height/2); return;} if(!rankData||rankData.length===0||!names||names.length===0){fill(100); textSize(constrain(lbWidth/25,14,22)); textAlign(CENTER,CENTER); text("No scores yet, or failed to load.",width/2,height/2); return;} stroke(50,50,150); strokeWeight(1); let titleY=lbY+pad*4; let rankX=lbX+lbWidth*0.15; let nameX=lbX+lbWidth*0.45; let timeX=lbX+lbWidth*0.80; textSize(constrain(lbWidth/22,16,24)); fill(0); textAlign(CENTER,CENTER); text("Rank",rankX,titleY); text("Name",nameX,titleY); text("Time",timeX,titleY); line(lbX+pad,titleY+pad*0.8,lbX+lbWidth-pad,titleY+pad*0.8); textSize(constrain(lbWidth/28,12,20)); let rowStartY=titleY+pad*1.5; let availableHeight=(lbY+lbHeight-pad*2)-rowStartY; let rowHeight=availableHeight/10; for(let i=0; i<min(10,names.length); i++){let currentY=rowStartY+i*rowHeight+rowHeight/2; fill(50); textAlign(CENTER,CENTER); text(i+1+".",rankX,currentY); fill(0); textAlign(LEFT,CENTER); let displayName=names[i]; if(displayName.length>20){displayName=displayName.substring(0,18)+"...";} text(displayName,lbX+lbWidth*0.28,currentY); textAlign(RIGHT,CENTER); let scoreSeconds=parseFloat(scores[i]); if(!isNaN(scoreSeconds)){text(formatTime(scoreSeconds),timeX+lbWidth*0.15,currentY);} else {text("N/A",timeX+lbWidth*0.15,currentY);}}
}

function formatTime(seconds) {
    // Same as before
     let min = floor(seconds / 60); let sec = floor(seconds) % 60; let dec = floor((seconds * 100) % 100); return nf(min, 1) + ":" + nf(sec, 2, 0) + "." + nf(dec, 2, 0);
}

function boardAppend() {
    // Same as before
    let timeFormatted = time.toFixed(2); console.log("Attempting to submit score:", playername, timeFormatted); if (parseFloat(timeFormatted) < 0.1 && playername !== 'test') { console.warn("Time too low, score not submitted."); return; } const scriptURL = "https://script.google.com/macros/s/AKfycbz9qCkxXs1JQz-hy2mFBxBmsMyNQDzGC8ufKpFSxB93NBaBTTs-uX26HCb0nQKGORNa/exec"; const encodedPlayerName = encodeURIComponent(playername); const urlWithParams = `${scriptURL}?name=${encodedPlayerName}&score=${timeFormatted}`; console.log("Submitting to URL:", urlWithParams); fetch(urlWithParams, { method: 'GET', mode: 'no-cors' }).then(() => console.log("Score submission request sent (no-cors).")).catch(error => console.error("Error sending score submission request:", error));
}

function sortLeads() {
    // Same as before
    scores = []; names = []; if (!rankData || rankData.length === 0) { return; } let dataToSort = [...rankData]; dataToSort.sort((a, b) => { if (!Array.isArray(a) || a.length < 2) return 1; if (!Array.isArray(b) || b.length < 2) return -1; let scoreA = parseFloat(a[1]); let scoreB = parseFloat(b[1]); if (isNaN(scoreA) && isNaN(scoreB)) return 0; if (isNaN(scoreA)) return 1; if (isNaN(scoreB)) return -1; return scoreA - scoreB; }); names = dataToSort.map(item => item[0] || "N/A"); scores = dataToSort.map(item => item[1]); console.log("Leaderboard data sorted.");
}

function myInputEvent() {
    // Same as before
     if (!input || !button) return; playername = input.value().trim(); if (playername.length > 20) { playername = playername.substring(0, 20); } else if (playername === "") { playername = "anonymous"; } if (!theyCheated) { boardAppend(); } else { console.log("Score not submitted (Cheated)."); } input.hide(); button.hide(); takingInput = false; lead = false;
}

function toggleMode() {
    // Same logic, relies on imageLoaded flag
    if (posstring === winstring || takingInput) return;
    if (!imageLoaded && currentMode === 'number') { // Check if image IS loaded before switching TO image mode
        console.warn("Cannot switch to Image Mode: Image not loaded or tiles failed.");
        if(modeButton) { modeButton.style('background-color', 'red'); setTimeout(() => { if(modeButton) modeButton.style('background-color', ''); }, 500); }
        return;
    }
    if (currentMode === 'number') { currentMode = 'image'; if (modeButton) modeButton.html('Switch to Numbers'); console.log("Switched to Image Mode"); }
    else { currentMode = 'number'; if (modeButton) modeButton.html('Switch to Image Mode'); console.log("Switched to Number Mode"); }
    mixit();
}

// handleFile remains dormant/unused for direct file opening
function handleFile(file) {
    console.warn("handleFile called, but custom image upload is disabled/hidden for offline use/direct file opening.");
    alert("Custom image upload requires running via a local web server.");
}

function windowResized() {
    // Same logic, relies on imageLoaded flag for button state
    console.log("Window resizing..."); let gameHeight = window.innerHeight - 22; let puzzleAreaWidth = gameHeight; let totalWidth = puzzleAreaWidth + max(200, puzzleAreaWidth*0.3); widthExtraPad = totalWidth - puzzleAreaWidth; resizeCanvas(totalWidth, gameHeight); var x = (windowWidth-width)/2; var y = ((windowHeight-height)/2); let cnv = select('canvas'); if (cnv) cnv.position(x,y); wid = floor(puzzleAreaWidth/4); let uiStartX = puzzleAreaWidth+pad; let modeButtonY = height-pad*5; if(modeButton){ modeButton.position(x+uiStartX, y+modeButtonY); modeButton.size(widthExtraPad-pad*2, 25); } if(fileInput){ fileInput.position(x+uiStartX, y+modeButtonY+35); fileInput.size(widthExtraPad-pad*2); } if(input&&button){ if(takingInput){ let inputX=width/2-input.width/2; input.position(x+inputX, y+height/2); let buttonXpos=width/2-button.width/2; button.position(x+buttonXpos, y+input.y+input.height+10); } else { let inputX=width/2-input.width/2; input.position(x+inputX, y+height*0.55); let buttonXpos=width/2-button.width/2; button.position(x+buttonXpos, y+input.y+input.height+5); input.hide(); button.hide(); } }
    // Recreate tiles if possible
    if (defaultImageLoadSuccess && puzzleImage && wid > 0) { console.log("Window resized, recreating image tiles..."); createImageTiles(puzzleImage); } else { console.log("Window resized, not recreating tiles."); }
    // Update button state after attempting tile recreation
    if(modeButton){ if(imageLoaded){ modeButton.removeAttribute('disabled'); modeButton.html(currentMode==='image'?'Switch to Numbers':'Switch to Image Mode'); } else { modeButton.attribute('disabled',''); modeButton.html('Image Unavailable'); } }
    console.log("Window resized processed.");
}