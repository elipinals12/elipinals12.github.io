// TODO

var go = false;
var cols = [];
let img;
var cnv, cnvx, cnvy;
var pause = false;

function setup() {
    windowResized();

    frameRate(20);

    img = loadImage("banana.png");
    backsound = loadSound("bananarave.mp3");
    //backsound.setVolume(1);
}

function draw() {
    background(255);
    if (frameCount % 60 == 0 && !pause) {
        frameRate(random(5, 25));
    }

    if (go) {
        if (!pause) {
            cols[0] = random(0, 255);
            cols[1] = random(0, 255);
            cols[2] = random(0, 255);
        }
        background(cols[0], cols[1], cols[2]);
    } else {
        // if you need an offline (non banana) switch
        // fill(0);
        // rect(100, 100, 100, 100);
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
    // print(colAr);
    for (var rgbnum in colAr) {
        print(rgbnum);
        totalrgbnum += colAr[rgbnum];
    }
    // print(totalrgbnum);

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
    if (keyCode == 32) pause = !pause;
}

function windowResized() {
    cnv = createCanvas(windowWidth, windowHeight - .1);
    cnvx = (windowWidth - width) / 2;
    cnvy = (windowHeight - .1 - height) / 2;
    cnv.position(cnvx, cnvy);
}