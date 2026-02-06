function setDopeCanvas() {
    cnv = createCanvas(windowWidth, windowHeight);
    cnvx = (windowWidth - width) / 2;
    cnvy = (windowHeight - height) / 2;
    cnv.position(cnvx, cnvy);
}

function setup() {
    setDopeCanvas();
    noStroke();
}

function draw() {
    background(0);
    translate(width / 2, height / 2);

    let h = hour() % 12;
    let m = minute();
    let s = second();

    drawClock(h * 30 + m / 2, min(width, height) * 0.4, 12, "hours", color(90, 50, 160)); // Deep purple

    push();
    rotate(radians(h * 30 + m / 2));
    translate(0, -min(width, height) * 0.2);
    drawClock(m * 6, min(width, height) * 0.2, 60, "minutes", color(30, 60, 200)); // Darker blue
    pop();

    push();
    rotate(radians(h * 30 + m / 2));
    translate(0, -min(width, height) * 0.2);
    rotate(radians(m * 6));
    translate(0, -min(width, height) * 0.1);
    drawClock(s * 6, min(width, height) * 0.1, 60, "seconds", color(200, 0, 0)); // Deep red
    pop();
}

function drawClock(angle, size, ticks, type, col) {
    noFill();
    stroke(col);
    strokeWeight(3);
    ellipse(0, 0, size * 2, size * 2);

    stroke(col);
    strokeWeight(1);
    for (let i = 0; i < ticks; i++) {
        let angleTick = radians(i * (360 / ticks));
        let x1 = size * cos(angleTick);
        let y1 = size * sin(angleTick);
        let x2, y2;

        if (type === "hours" && (i % 3 === 0 || i % 1 === 0)) {
            if (i % 3 === 0) {
                x2 = (size - 15) * cos(angleTick); // Longer for 12, 3, 6, 9
                y2 = (size - 15) * sin(angleTick);
            } else {
                x2 = (size - 10) * cos(angleTick); // Standard for all hours
                y2 = (size - 10) * sin(angleTick);
            }
        } else if (type !== "hours" && i % 5 === 0) {
            x2 = (size - 5) * cos(angleTick);
            y2 = (size - 5) * sin(angleTick);
        } else {
            x2 = (size - 2) * cos(angleTick);
            y2 = (size - 2) * sin(angleTick);
        }
        line(x1, y1, x2, y2);
    }

    textSize(size * 0.1);
    textAlign(CENTER, CENTER);
    fill(col);
    noStroke();
    for (let i = 0; i < ticks; i++) {
        if ((type === "hours" && i % 1 === 0) || (type === "minutes" && i % 5 === 0) || (type === "seconds" && i % 5 === 0)) {
            let angleNum = radians(i * (360 / ticks) - 90);
            let x = (size - size * 0.15) * cos(angleNum);
            let y = (size - size * 0.15) * sin(angleNum);
            text(i === 0 ? (type === "hours" ? 12 : ticks) : i, x, y);
        }
    }

    push();
    rotate(radians(angle));
    stroke(col.levels[0], col.levels[1], col.levels[2], 150); // Dimmed hands (alpha 150)
    strokeWeight(4);
    line(0, 0, 0, -size);
    pop();
}

function windowResized() {
    setDopeCanvas();
}
