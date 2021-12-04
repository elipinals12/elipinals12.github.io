// TODO
// !!!!!!! undo button !!!!!!!

var outline = false;
var instructions = true;
var diam = 100;
var colors = [];

function setup() {
    var cnv = createCanvas(windowWidth, windowHeight);
    var x = (windowWidth - width) / 2;
    var y = ((windowHeight - height) / 2);
    cnv.position(x, y);
    //background(random(0, 256), random(0, 256), random(0, 256));
    setbackground();

    // Get rid of that circle in corner
    mouseX = -1000;
    mouseY = -1000;
}

function draw() {
    if (instructions) {
        textSize(width / 8);
        textAlign(CENTER, CENTER);
        text("Hold H for help", width / 2, height / 2);
        instructions = false;
    }
    // White vs Black circles
    // vs erase

    if (keyIsDown(69)) {
        noStroke();
        fill(colors[0], colors[1], colors[2]);
    } else if (mouseIsPressed) {
        fill(255);
        if (outline) {
            stroke(0);
        } else {
            noStroke();
        }

    } else {
        fill(0);
        if (outline) {
            stroke(255);
        } else {
            noStroke();
        }
    }

    // Actually make the circles
    ellipse(mouseX, mouseY, diam, diam);

    var diamchange = 2;
    // Clear Screen
    if (keyIsDown(DOWN_ARROW)) {
        diam -= diamchange;
    } else if (keyIsDown(UP_ARROW)) {
        diam += diamchange;
    }
    if (keyIsPressed) {
        if (keyCode == 32) {
            outline = !outline;
        } else if (keyCode == 82) {
            clear();
            //background(random(0, 256), random(0, 256), random(0, 256));
            setbackground();
        }
        keyIsPressed = false;
    }
    if (diam < 1) {
        diam = 1;
    }

    if (keyIsDown(72)) {
        textSize(height / 8);
        textAlign(LEFT, CENTER);
        fill(0);
        rectMode(CORNERS);
        rect(width / 11.5, height / 10, width - width / 11.5, height - height / 10);
        fill(255);
        text("H", width / 9, 2 * height / 9);
        text("ARROWS", width / 9, 3 * height / 9);
        text("CLICK", width / 9, 4 * height / 9);
        text("SPACE", width / 9, 5 * height / 9);
        text("R", width / 9, 6 * height / 9);
        text("E", width / 9, 7 * height / 9);
        textAlign(RIGHT, CENTER);
        text("to get help", 8 * width / 9, 2 * height / 9);
        text("to change size", 8 * width / 9, 3 * height / 9);
        text("to Invert", 8 * width / 9, 4 * height / 9);
        text("to toggle borders", 8 * width / 9, 5 * height / 9);
        text("to reset", 8 * width / 9, 6 * height / 9);
        text("to erase", 8 * width / 9, 7 * height / 9);
    }
}

// Background chooser
function setbackground() {
    colors = [random(0, 256), random(0, 256), random(0, 256)];
    background(colors[0], colors[1], colors[2]);
}

function windowResized() {
    setup();
}
