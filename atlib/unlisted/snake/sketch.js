// SNAKE
// started 8-18-20

var bgcolor = 0;
var cellsize = 19;

var L, headx, heady;
var headxs = [];
var headys = [];
var cellxs = [];
var cellys = [];
var snakes = [];
var rows, cols;
var xdir = 0;
var ydir = 0;
var fr = 10;

var xoff, yoff;

function setup() {
    var cnv = createCanvas(window.innerWidth - 22, window.innerHeight - 22);
    var cnvx = (windowWidth - width) / 2;
    var cnvy = (windowHeight - height) / 2;
    cnv.position(cnvx, cnvy);

    frameRate(fr);

    newSnake();

    rows = floor(height / (cellsize) - 4);
    cols = floor(width / (cellsize) - 2);

    yoff = 3 * (height - (rows * cellsize)) / 4;
    xoff = (width - (cols * cellsize)) / 2;

    for (let j = 0; j < cols; j++) {
        for (let i = 0; i < rows; i++) {
            append(cellys, i * cellsize + yoff);
            append(cellxs, j * cellsize + xoff);
        }
    }

    //noStroke();
}

function draw() {
    background(bgcolor);

    rows = floor(height / (cellsize + 2));
    cols = floor(width / (cellsize + 2));

    for (let i = 0; i < cellxs.length; i++) {
        fill(155, 20, 70);
        rect(cellxs[i], cellys[i], cellsize, cellsize);
    }

    for (var i = 0; i < snakes.length; i++) {
        snakes[i].show();
        snakes[i].move();
    }



    // CONTROLS
    if (keyIsDown(38)) {
        ydir = -1;
        xdir = 0;
    } else if (keyIsDown(39)) {
        xdir = 1;
        ydir = 0;
    } else if (keyIsDown(40)) {
        ydir = 1;
        xdir = 0;
    } else if (keyIsDown(37)) {
        xdir = -1;
        ydir = 0;
    }
}

class Snake {
    constructor(L, headx, heady) {
        this.L = L;
        this.headx = headx;
        this.heady = heady;
        append(headxs, this.headx);
        append(headys, this.heady);
    }

    move() {
        for (var i = 0; i < L; i++) {
            if (xdir == 1) {
                headxs[i] += cellsize;
            } else if (xdir == -1) {
                headxs[i] -= cellsize;
            }
            if (ydir == 1) {
                headys[i] += cellsize;
            } else if (ydir == -1) {
                headys[i] -= cellsize;
            }
        }
    }

    show() {
        for (var i = 0; i < L; i++) {
            fill(255);
            rect(headxs[i]+xoff, headys[i]+yoff, cellsize, cellsize);
        }
    }
}

function newSnake() {
    L = 1;

    for (var i = 0; i < 1; i++) {
        headx = cellsize;
        heady = cellsize;
        var s = new Snake(L, headx, heady);
        snakes.push(s);
    }
}

function reset() {
    xdir = 0;
    ydir = 0;

    headxs = [19];
    headys = [19];
    snakes = [];
    newSnake();
}

function keyPressed() {

}