// TODO

var go = false;
var cols = [];
let img;


function setup() {
    var cnv = createCanvas(windowWidth, windowHeight);
    var cnvx = (windowWidth - width) / 2;
    var cnvy = (windowHeight - height) / 2;
    cnv.position(cnvx, cnvy);

    frameRate(20);

    img = loadImage("banana.png");
    backsound = loadSound("bananarave.mp3");
    backsound.setVolume(1);
}

function draw() {
    background(255);    

    if (go) {
        cols[0] = random(0, 255);
        cols[1] = random(0, 255);
        cols[2] = random(0, 255);
        background(cols[0], cols[1], cols[2]);
    } else {

    }
    
    imageMode(CENTER);
    image(img, width/2, width/2, width/4, height/4);
}

function mousePressed() {
    go = !go;
}

function keyPressed() {

}

function windowResized() {
    setup();
}