// COOL MAZE - NOT MY DESIGN AT ALL, JUST ADDING (hecka) FEATURES
// ..............................................................
// TODO
// add smooth line code magic (fill in between far gaps automatically, even draw lines hmmmmmmmmm from points that may(would) be easy af)
// sart/attaboy msg on get(mousepos) = green
// finish border reach

var ver, hor;
var tcols, trows;
var wid = 40;
var grid = [];
var current;
var stack = [];
var mx = [];
var my = [];
var x, y;

var mecells=[];

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

    //clear
    if (keyIsPressed && keyCode == 82) {
        resetMarker()
    }

    // make outer walls
    // entrance and exit
    stroke(0,255,0);
    strokeWeight(5);
    line(0, 0, wid, 0);
    line(width - wid, height, width, height);
    // bigwalls
    stroke(0);
    strokeWeight(15);
    line(wid, 0, width, 0);
    line(width, 0, width, height);
    line(width - wid, height, 0, height);
    line(0, 0, 0, height);

    
    // youR COLOR
    let colAr = get(mouseX, mouseY);
    // for (all of me)
    // mecells.    append(maybe mecells, new mecell(colr, colg, colb));
    // NEED TO FIGURE OUT HOW TO FOR LOOP IN A CIRCLE AROUND A Point
    // maybe for all points in < x distance from mouse do ...

    // if (colAr[0] != 115 || colAr[1] != 15 || colAr[2] != 215) resetMarker();
    // smarter:
    if (colAr[1] < 30 && colAr[2] < 215) resetMarker();

    // if (mouseIsPressed) {
    append(mx, mouseX);
    append(my, mouseY);
    // }
    noStroke();
    fill(255, 0, 0);
    for (var k = 0; k < mx.length; k++) {
        ellipse(mx[k], my[k], 6, 6);
    }
}

function resetMarker() {
    mx = [];
    my = []; // northeastern: should use like a struct something less vague
}