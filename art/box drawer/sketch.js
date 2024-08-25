var x, y;
var fader = 115;
var grow = 2 / 7;
function setup() {
    var cnv = createCanvas(window.innerWidth - 22, window.innerHeight - 22);
    var cnvx = (windowWidth - width) / 2;
    var cnvy = (windowHeight - height) / 2;
    cnv.position(cnvx, cnvy);

    background(0);
}

function draw() {
    x = mouseX;
    y = mouseY;
    noStroke();
    fill(0, 255, 255, fader);
    if (/*mouseIsPressed*/True) {
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