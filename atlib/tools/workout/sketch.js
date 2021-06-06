// TODO

var startsound, restsound;
var started = false;
var time;
var represt = false;
var setrest = false;

var reptime = 35;
var reps = 10;
var represttime = 10;
var setresttime = 90;
var repcount = 1;

function setup() {
    var cnv = createCanvas(window.innerWidth, window.innerHeight);
    var cnvx = (windowWidth - width) / 2;
    var cnvy = (windowHeight - height) / 2;
    cnv.position(cnvx, cnvy);

    noStroke();
    //frameRate(1);

    startsound = loadSound("start.mp3");
    restsound = loadSound("rest.mp3");
    startsound.setVolume(.5);
    restsound.setVolume(.5);

    textAlign(CENTER, CENTER);
}

function draw() {
    background(50, 41, 47);




    if (!started) {
        stroke(112, 171, 175);
        fill(112, 171, 175);
        textSize(width / 10);
        text("CLICK TO START", width / 2, height / 2);
    } else {
        if (!represt) {
            fill(112, 93, 86);
            noStroke();
            rectMode(CORNERS);
            rect(0, 0, map(time, reptime, 0, 0, width), height);
            stroke(112, 171, 175);
            fill(112, 171, 175);

            if (time <= 0) {
                represt = true;
                restsound.play();

                time = represttime;
                if (repcount > reps) {
                    started = false;
                }
            }
        } else {
            fill(142, 93, 86);
            noStroke();
            rectMode(CORNERS);
            rect(0, 0, map(time, represttime, 0, 0, width), height);
            stroke(212, 197, 199);
            fill(212, 197, 199);

            stroke(219, 111, 116);
            fill(219, 111, 116);
            textSize(width / 15);
            text("REST", width / 2, 7 * height / 8);

            if (time <= 0) {
                start();
            }
        }

        stroke(219, 211, 216);
        fill(219, 211, 216);
        textSize(width / 15);
        text("REP: " + repcount + "/" + reps, width / 2, height / 8);

        time = time - (1 / 60);
        stroke(112, 171, 175);
        fill(112, 171, 175);
        textSize(width / 3);
        text(ceil(time), width / 2, height / 2);


    }
}




function mousePressed() {
    start();
}

function keyPressed() {

}

function start() {
    startsound.play();
    repcount++;
    reset();

    if (!started) {
        started = true;
    }
}


function reset() {
    time = reptime;
    represt = false;
    setrest = false;
    if (repcount == 10) {
        repcount = 0;
    }
}




function windowResized() {
    resizeCanvas(window.innerWidth, window.innerHeight);
}

