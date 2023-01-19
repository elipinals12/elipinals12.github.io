let hours;
let minutes;
let seconds;
let hourRotation;
let minuteRotation;
let secondRotation;

function setup() {
    windowResized();
    angleMode(DEGREES);
}

function draw() {
    background(0);
    strokeWeight(1);
    stroke(0);
    translate(width / 2, height / 2);

    drawDisks();
    drawTimeNumbers();

    // LINE
    strokeWeight(2);
    stroke(255, 0, 0);
    strokeCap(SQUARE);
    line(0, 0, 0, -height * 0.4);
    fill(0);
    circle(0, 0, 20);
}

function windowResized() {
    var cnv = createCanvas(window.innerWidth - 2, window.innerHeight - 2);
    cnv.position((windowWidth - width) / 2, (windowHeight - height) / 2);
}

function drawDisks() {
    // Draw hour disk
    fill(255, 100, 150);
    ellipse(0, 0, height * 0.8, height * 0.8);

    // Draw minute disk
    fill(100, 255, 150);
    ellipse(0, 0, height * 0.7, height * 0.7);

    // Draw second disk
    fill(150, 100, 255);
    ellipse(0, 0, height * 0.6, height * 0.6);
}

function drawTimeNumbers() {
    let now = new Date();
    hours = now.getHours();
    minutes = now.getMinutes();
    seconds = now.getSeconds();

    hourRotation = map(hours % 24, 0, 24, 0, 360);
    minuteRotation = map(minutes - 1, 0, 59, 0, 360);
    secondRotation = map(seconds, 0, 60, 0, 360);

    fill(0);
    // Hour numbers
    textSize(height * 0.041);
    textAlign(CENTER,CENTER);
    for (let i = 0; i <= 23; i++) {
        push();
        rotate(i * (360 / 24) - hourRotation);
        text(i, 0, -(height * 0.37));
        pop();
    }

    // Minute numbers
    textSize(height * 0.035);
    textAlign(CENTER,CENTER);
    for (let i = 0; i < 12; i++) {
        push();
        rotate((i * (360 / 12) - (minuteRotation - (360/60)*5)));
        if ((i + 1) * 5 != 60) {
            text((i + 1) * 5, 0, -(height * 0.32));
        } else {
            text(0, 0, -(height * 0.32));
        }
        pop();
    }

    // Second numbers
    textSize(height * 0.017);
    textAlign(CENTER,CENTER);
    for (let i = 0; i < 60; i++) {
        push();
        rotate(i * (360 / 60) - secondRotation);
        text(i, 0, -(height * 0.275));
        pop();
    }
}