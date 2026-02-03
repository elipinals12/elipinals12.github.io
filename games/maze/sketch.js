// COOL MAZE - NOT MY DESIGN AT ALL, JUST ADDING (hecka) FEATURES

var ver, hor;
var tcols, trows;
var wid = 40;
var grid = [];
var current;
var stack = [];
var mx = [];
var my = [];
var x, y;
var mecells = [];

// Timer variables
var timerStart = 0;
var timerElapsed = 0;
var timerRunning = false;
var mazeGenerated = false;
var solved = false;
var timerStarted = false;

function setup() {
    var cnv = createCanvas(600, 600);
    var x = (windowWidth - width) / 2;
    var y = ((windowHeight - height) / 2);
    cnv.position(x, y);

    tcols = floor(width / wid);
    trows = floor(height / wid);

    for (j = 0; j < trows; j++) {
        for (i = 0; i < tcols; i++) {
            var cell = new Cell(i, j);
            append(grid, cell);
        }
    }

    current = grid[0];
    background(35, 5, 255);
    pixelDensity(1);
}

function formatTime(ms) {
    var mins = Math.floor(ms / 60000);
    var secs = Math.floor((ms % 60000) / 1000);
    var millis = ms % 1000;
    return String(mins).padStart(2, '0') + ':' + 
           String(secs).padStart(2, '0') + '.' + 
           String(millis).padStart(3, '0');
}

function updateTimer() {
    var timerEl = document.getElementById('timer');
    if (timerRunning) {
        timerElapsed = millis() - timerStart;
    }
    timerEl.textContent = formatTime(timerElapsed);
}

function isOnStartGreen() {
    // Start line: top-left green line from (0,0) to (wid,0)
    return mouseY >= 0 && mouseY <= 8 && mouseX >= 0 && mouseX <= wid;
}

function isOnEndGreen() {
    // End line: bottom-right green line from (width-wid, height) to (width, height)
    return mouseY >= height - 8 && mouseX >= width - wid && mouseX <= width;
}

function draw() {
    loadPixels();
    updatePixels();

    strokeCap(SQUARE);
    strokeWeight(1);

    wikiSteps();

    // Clear with R key
    if (keyIsPressed && keyCode == 82) {
        resetMarker();
    }

    // Entrance and exit (green)
    stroke(0, 255, 0);
    strokeWeight(5);
    line(0, 0, wid, 0);
    line(width - wid, height, width, height);

    // Big walls (black)
    stroke(0);
    strokeWeight(15);
    line(wid, 0, width, 0);
    line(width, 0, width, height);
    line(width - wid, height, 0, height);
    line(0, 0, 0, height);

    // Timer and game logic (only after maze is generated)
    if (mazeGenerated && !solved) {
        // Check for start
        if (!timerStarted && isOnStartGreen()) {
            timerStarted = true;
            timerRunning = true;
            timerStart = millis();
            timerElapsed = 0;
            document.getElementById('status').textContent = 'Go! Reach the green exit!';
        }

        // Check for finish
        if (timerStarted && isOnEndGreen()) {
            solved = true;
            timerRunning = false;
            document.getElementById('timer').classList.add('flash');
            document.getElementById('status').textContent = '🎉 SOLVED! Press R to restart';
        }

        // Check for wall hit (black pixels)
        if (timerStarted) {
            let colAr = get(mouseX, mouseY);
            if (colAr[1] < 30 && colAr[2] < 215) {
                resetMarker();
            }
        }
    }

    // Draw path (only after timer started)
    if (timerStarted) {
        append(mx, mouseX);
        append(my, mouseY);
    }

    noStroke();
    fill(255, 0, 0);
    for (var k = 0; k < mx.length; k++) {
        ellipse(mx[k], my[k], 6, 6);
    }

    updateTimer();
}

function resetMarker() {
    mx = [];
    my = [];
    
    if (!solved) {
        timerRunning = false;
        timerStarted = false;
        timerElapsed = 0;
        document.getElementById('timer').classList.remove('flash');
        if (mazeGenerated) {
            document.getElementById('status').textContent = 'Cross the green line to start!';
        }
    } else {
        // Full reset after solving
        solved = false;
        timerRunning = false;
        timerStarted = false;
        timerElapsed = 0;
        document.getElementById('timer').classList.remove('flash');
        document.getElementById('status').textContent = 'Cross the green line to start!';
    }
}