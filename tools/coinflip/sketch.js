let angle = 0;
let coinsize;
let flipping = false;
let counter = 0;
let outcome;

function setup() {
    var cnv = createCanvas(windowWidth, windowHeight, WEBGL);
    var cnvx = (windowWidth - width) / 2;
    var cnvy = (windowHeight - height) / 2;
    cnv.position(cnvx, cnvy);

    coinsize = width / 10;

    /*textur = createGraphics(30, 30);
    //texture.background(255, 100);
    //textur.fill(255);
    textur.textAlign(CENTER);
    textur.textSize(20);
    textur.text('texture', 150, 150);*/
}

function draw() {
    let dx = mouseX - width / 2;
    let dy = mouseY - height / 2;
    let v = createVector(dx, dy, 0);
    v.div(100);
    background(85);
    ambientLight(0, 0, 150);
    //directionalLight(255, 55, 5, v);
    //directionalLight(55, 155, 5, v2);
    let locX = mouseX - width / 2;
    let locY = mouseY - height / 2;
    pointLight(250, 200, 200, locX, locY, 150);
    if (flipping) {
        rotateX(angle * .2);
        rotateZ(angle * 1);
        if (counter >= 180) {
            counter = 0;
            flipping = false;
        }
        counter++;
    } else {
        rotateX(angle * .06);
        rotateZ(angle * .06);
    }
    //texture(textur);
    rotateX(.05);
    rotateZ(.5);
    cylinder(coinsize, coinsize / 6, 100, 100);
    angle += 0.07;
}

function mousePressed() {
    flipping = !flipping;
    if (mouseY > height / 2) {
        outcome = "r";
        print("random");
    } else if (mouseX > width / 2) {
        outcome = "h";
        print("heads");
    } else {
        outcome = "t";
        print("tails");
    }
}


function windowResized() {
    setup();
}