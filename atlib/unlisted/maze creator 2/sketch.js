var ver, hor;
var tcols, trows;
var wid = 40;
var grid = [];
var current;
var stack = [];
var mx = [];
var my = [];
var x, y;

function setup() {
    var cnv = createCanvas(800, 800);
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

    //frameRate(10);

    current = grid[0];
    background(35, 5, 255);
}

function draw() {
    strokeCap(SQUARE);

    strokeWeight(1);

    wikiSteps();


    // make outer walls
    stroke(0);
    strokeWeight(15);
    line(wid, 0, width, 0);
    line(width, 0, width, height);
    line(width - wid, height, 0, height);
    line(0, 0, 0, height);

    if (grid[0].dead == true) {
        moveGuy();
    }

    // you
    if (mouseIsPressed) {
        noStroke();
        fill(255, 0, 0);
        append(mx, mouseX);
        append(my, mouseY);
        for (var k = 0; k < mx.length; k++) {
            ellipse(mouseX, mouseY, 4, 4);
        }
    }
}

function moveGuy() {
    // TODO:
    // reading the pixels, set the maze as background and 
}