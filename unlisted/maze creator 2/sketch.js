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
    check4collisions();

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

function check4collisions() {
    // check for wall collision
    for (c in grid) {
        print(c.walls[1]);

        //check each wall for each cell
        for (var i = 0; i < 3; i++) {
            mouseIsOnBorder = false;
            // if (cell.walls[i] && mouseIsOnBorder) resetMarker();
        }
    }

}