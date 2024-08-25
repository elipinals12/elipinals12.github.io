var x, y;
var fader = 115;
var grow = 2 / 7;
var before = true;

function setup() {
    var cnv = createCanvas(window.innerWidth - 22, window.innerHeight - 22);
    var cnvx = (windowWidth - width) / 2;
    var cnvy = (windowHeight - height) / 2;
    cnv.position(cnvx, cnvy);

    background(0);

    fill(0, 255, 255);
}

function draw() {
    if (before) {
        textSize(32);           // Set the text size
        textAlign(CENTER, CENTER); // Align text to the center of the canvas
        text('try to color in the screen', width / 2, height / 2);
    }
    else {
        x = mouseX;
        y = mouseY;
        noStroke();
        fill(0, 255, 255, fader);
        rect(x, y, grow * x, grow * y);
    }
}

function reset() {
    background(0);
}

function keyPressed() {
    if (keyIsPressed) {
        reset();
    }
}