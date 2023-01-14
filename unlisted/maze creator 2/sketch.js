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

    //frameRate(10);

    current = grid[0];
    background(35, 5, 255);
    pixelDensity(1);
}

function draw() {
    loadPixels();

    updatePixels();

    strokeCap(SQUARE);

    strokeWeight(1);

    wikiSteps();


    if (grid[0].dead == true) {
        moveGuy();
    }


    //clear
    if (keyIsPressed && keyCode == 82) {
        resetMarker()
    }

    // you


    let colAr = get(mouseX, mouseY);
    //print(colAr)
    if (colAr[0] != 115 || colAr[1] != 15 || colAr[2] != 215) resetMarker();

    //if (mouseIsPressed) {
    append(mx, mouseX);
    append(my, mouseY);
    //}
    noStroke();
    fill(255, 0, 0);
    for (var k = 0; k < mx.length; k++) {
        ellipse(mx[k], my[k], 6, 6);
    }

    // make outer walls
    stroke(0);
    strokeWeight(15);
    line(wid, 0, width, 0);
    line(width, 0, width, height);
    line(width - wid, height, 0, height);
    line(0, 0, 0, height);
}

function moveGuy() {
    // TODO:
    // reading the pixels, set the maze as background and 
}

function resetMarker() {
    mx = [];
    my = [];
}