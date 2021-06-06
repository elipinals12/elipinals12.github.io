// TODO

var f, asharp;
var started = false;

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
    background(150, 142, 133);

    if (!started) {
        stroke(255, 161, 155);
        fill(255, 161, 155);
        textSize(width/10);
        textAlign(CENTER, CENTER);
        text("CLICK TO START", width / 2, height / 2);
    }

}




function mousePressed() {
    if (!started) {
        started = true;
    }
    reset();
}

function keyPressed() {

    f.setVolume(.5);
    f.play();
}

function reset() {
    print("hi");
}




function windowResized() {
    resizeCanvas(window.innerWidth, window.innerHeight);
}

