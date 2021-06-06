// TODO

var f, asharp;
var started = false;
var time = 0;
var represt = false;
var setrest = false;

var reptime = 35;
var sets = 10;
var represttime = 10;
var setresttime = 90;

function setup() {
    var cnv = createCanvas(window.innerWidth, window.innerHeight);
    var cnvx = (windowWidth - width) / 2;
    var cnvy = (windowHeight - height) / 2;
    cnv.position(cnvx, cnvy);

    noStroke();
    //frameRate(1);

    f = loadSound("F4.mp3");
    asharp = loadSound("A#4.mp3");
}

function draw() {
    background(50, 41, 47);
    fill(0, 255, 0, 100);
    noStroke();
    rectMode(CORNERS);
    rect(0, 0, map(time, 0, 35, 0, width), height);


    if (!started) {
        stroke(112, 171, 175);
        fill(112, 171, 175);
        textSize(width / 10);
        textAlign(CENTER, CENTER);
        text("CLICK TO START", width / 2, height / 2);
    } else {
        time = time + (1 / 60);

        // TIME
        stroke(112, 171, 175);
        fill(112, 171, 175);
        textSize(width / 3);
        textAlign(CENTER, CENTER);
        text(int(time), width / 2, height / 2);
    }

    if (time == represttime) {
        represt = true;
        reset();
    }
}




function mousePressed() {
    start();
    reset();
}

function keyPressed() {
    start();
}

function start() {
    f.setVolume(.5);
    //f.play();
    asharp.setVolume(.5);
    //asharp.play();
    

    if (!started) {
        started = true;
    }
}


function reset() {
    time = 0;
    represt = false;
    setrest = false;
}




function windowResized() {
    resizeCanvas(window.innerWidth, window.innerHeight);
}

