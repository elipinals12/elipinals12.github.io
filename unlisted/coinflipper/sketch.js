var heads = true;
function setup() {
    var cnv = createCanvas(windowWidth, windowHeight);
    var cnvx = (windowWidth - width) / 2;
    var cnvy = (windowHeight - height) / 2;
    cnv.position(cnvx, cnvy);
}

function draw() {
    background(255, 255, 255);

    if (heads == true) {
        fill(255, 225, 0);
        strokeWeight(2);
        circle(width / 2, height / 2, 80);
        textSize(19);
        fill(0);
        textAlign(CENTER, CENTER);
        text("H", width / 2, height / 2);
    } else {
        fill(255, 225, 0);
        strokeWeight(2);
        circle(width / 2, height / 2, 80);
        textSize(19);
        fill(0);
        textAlign(CENTER, CENTER);
        text("T", width / 2, height / 2);
    }
}

function mousePressed() {
    if (mouseX > width / 2) {
        heads = true;
    } else {
        heads = false;
    }
}

function keyPressed() {
    if (keyCode == 72) {
        heads = true;
    } else if (keyCode == 84) {
        heads = false;
    }
}

function windowResized() {
    setup();
}