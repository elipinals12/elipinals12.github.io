// TODO

var go = false;
var cols = [];
let img;


function setup() {
    var cnv = createCanvas(windowWidth - .5, windowHeight - .5);
    var cnvx = (windowWidth - width) / 2;
    var cnvy = (windowHeight - height) / 2;
    cnv.position(cnvx, cnvy);

    frameRate(20);

    img = loadImage("banana.png");
    backsound = loadSound("bananarave.mp3");
    //backsound.setVolume(1);
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
    image(img, width / 2, height / 2, width / 5, width / 5);
}

function touchStarted() {
    // old way, just a circle, TERRIBLE
    // if (abs(mouseX - width / 2) < 30 && abs(mouseY - height / 2) < 30) {
    // new way, use pixel value, no need to make or use or think boundaries

    let colAr = get(mouseX, mouseY);
    let totalrgbnum = 0;
    print(colAr);
    for (var rgbnum in colAr) {
        print(rgbnum);
        totalrgbnum += colAr[rgbnum];
    }
    print(totalrgbnum);

    if (totalrgbnum < 1020) {
        go = !go;
        if (go) {
            backsound.loop();
        } else {
            backsound.pause();
        }
    }
    totalrgbnum = 0;
}

function keyPressed() {

}

function windowResized() {
    setup();
}