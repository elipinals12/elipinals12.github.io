var headsfs = true;

function setup() {
    windowResized();
}

function draw() {
    background(5, 0, 36);

    if (headsfs == true) {
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
        headsfs = true;
    } else {
        headsfs = false;
    }
}

function keyPressed() {
    if (keyCode == 72) {
        headsfs = true;
    } else if (keyCode == 84) {
        headsfs = false;
    }
}

function windowResized() {
    var cnv = createCanvas(windowWidth, windowHeight, WEBGL);
    cnv.position((windowWidth - width) / 2, (windowHeight - height) / 2);
}