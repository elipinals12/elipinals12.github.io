let hours;
let minutes;
let seconds;
let hourRotation;
let minuteRotation;
let secondRotation;
let minwh;
let hourcount;
let now;

// this is a 12 hour clock
let ampm = true;

function setup() {
    windowResized();
    angleMode(DEGREES);

    minwh = min(width, height);
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
    line(0, 0, 0, -minwh * 0.45);
    fill(0);
    circle(0, 0, 20);

    if (ampm) {
        textSize(minwh*.05);
        strokeWeight(1);
        if (hours > 12) {
            text("PM", 0, minwh * .075);
        } else {
            text("AM", 0, minwh * .075);
        }
    }
}

function windowResized() {
    var cnv = createCanvas(window.innerWidth - 2, window.innerHeight - 2);
    cnv.position((windowWidth - width) / 2, (windowHeight - height) / 2);

    minwh = min(width, height);
}

function drawDisks() {
    // Draw hour disk
    fill(255, 100, 150);
    circle(0, 0, minwh * 0.9);

    // Draw minute disk
    fill(100, 255, 150);
    circle(0, 0, minwh * 0.75);

    // Draw second disk
    fill(150, 100, 255);
    circle(0, 0, minwh * 0.6);
}

function drawTimeNumbers() {
    now = new Date();
    hours = now.getHours();
    minutes = now.getMinutes();
    seconds = now.getSeconds();

    minuteRotation = map(minutes, 0, 60, 0, 360);
    secondRotation = map(seconds, 0, 60, 0, 360);

    fill(0);
    if (ampm) {
        hourcount = 12;
        hourRotation = map(hours % 12, 0, 12, 0, 360);
    } else {
        hourcount = 24;
        hourRotation = map(hours % 24, 0, 24, 0, 360);
    }
    // Hour numbers
    textSize(minwh * 0.06);
    textAlign(CENTER, CENTER);
    for (let i = 0; i < hourcount; i++) {
        push();
        rotate(i * (360 / hourcount) - hourRotation);
        text(i, 0, -(minwh * 0.41));
        pop();
    }

    // Minute numbers
    textSize(minwh * 0.044);
    textAlign(CENTER, CENTER);
    for (let i = 0; i < 12; i++) {
        push();
        rotate((i * (360 / 12) - (minuteRotation - (360 / 60) * 5)));
        if ((i + 1) * 5 != 60) {
            text((i + 1) * 5, 0, -(minwh * 0.335));
        } else {
            text(0, 0, -(minwh * 0.335));
        }
        pop();
    }
    // minute tick marks
    strokeWeight(3);
    for (let i = 0; i < 60; i++) {
        push();
        rotate(i * (360 / 60) - (minuteRotation - (360 / 60)));
        line(0,-(minwh * 0.73)/2,0,-(minwh * 0.75)/2)
        pop();
    }
    strokeWeight(1);

    // Second numbers
    textSize(minwh * 0.02);
    textAlign(CENTER, CENTER);
    for (let i = 0; i < 60; i++) {
        push();
        rotate(i * (360 / 60) - secondRotation);
        text(i, 0, -(minwh * 0.275));
        pop();
    }
    // second tick marks
    for (let i = 0; i < 60; i++) {
        push();
        rotate(i * (360 / 60) - (minuteRotation - (360 / 60)));
        line(0,-(minwh * 0.58)/2,0,-(minwh * 0.6)/2)
        pop();
    }
}