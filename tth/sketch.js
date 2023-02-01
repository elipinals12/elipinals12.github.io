var mss, secs, mins, hrs, dys, wks, mnts;
var now, heaven;
var prog;

function setup() {
    windowResized();

    // Apr 28, 2023 final exams done, lets say first min of Apr 29, =
    // 4/29/2023, 12am
    heaven = new Date(2023, 3, 29, 0, 0, 0, 0);
}

function draw() {
    background(0);

    setTotals();

    writeStuff();

    progBar();

    secTimer();
    minTimer();
    hrTimer();
    // dayTimer();
}

function setTotals() {
    now = new Date();

    mss = heaven.getTime() - now.getTime();
    secs = mss / 1000;
    mins = floor(secs / 60);
    hrs = floor(secs / 60 / 60);
    dys = floor(secs / 60 / 60 / 24);
    wks = floor(secs / 60 / 60 / 24 / 7);
    mnts = floor(secs / 60 / 60 / 24 / 31);
}

function writeStuff() {
    fill(0, 255, 0);
    noStroke();
    textSize(13);
    textAlign(LEFT, TOP);

    text("tth", 2, 2);

    text("totals", 2, 28);

    if (secs > 0) {
        text("seconds:", 2, 41);
        text(nfc(secs), 64, 41);
    }
    if (mins > 0) {
        text("minutes:", 2, 54);
        text(nfc(mins), 64, 54);
    }
    if (hrs > 0) {
        text("hours:", 2, 67);
        text(nfc(hrs), 64, 67);
    }
    if (dys > 0) {
        text("days:", 2, 80);
        text(nfc(dys), 64, 80);
    }
    if (wks > 0) {
        text("weeks:", 2, 93);
        text(nfc(wks), 64, 93);
    }
    if (mnts > 0) {
        text("months:", 2, 106);
        text(nfc(mnts), 64, 106);
    }
}

function progBar() {
    stroke(255, 0, 0);
    strokeWeight(1);
    line(0, 131, width, 131);

    fill(255,0,0);
    noStroke();
    textAlign(RIGHT, BOTTOM);
    text("once the blue crosses the red, its heaven time mate", width-2, 129);

    prog = map(secs, 7515500 + 2246400, 0, height, 130);

    noStroke();
    fill(0, 0, 185);
    rectMode(CORNERS);
    rect(0, height, width, prog);
}

function secTimer() {
    stroke(255);
    strokeWeight(2);
    fill(30, 13, 92);
    let circx = 210;
    circle(circx, 65, 85);
    circle(circx, 65, 5);
    stroke(0);
    strokeWeight(2);
    line(circx, 34, circx, 24);

    // hand
    angleMode(DEGREES);
    strokeWeight(4);
    stroke(255, 132, 0);
    let secang = map(now.getMilliseconds(), 0, 999, 0, 360);
    secang += 270;
    let handlen = 85 / 2 - 2;
    let handx = cos(secang) * handlen + circx;
    let handy = sin(secang) * handlen + 65;
    line(circx, 65, handx, handy);
}

function minTimer() {
    stroke(255);
    strokeWeight(2);
    fill(30, 13, 92);
    let circx = 310;
    circle(circx, 65, 85);
    circle(circx, 65, 5);
    stroke(0);
    strokeWeight(2);
    line(circx, 34, circx, 24);

    // hand
    angleMode(DEGREES);
    strokeWeight(4);
    stroke(255, 132, 0);
    let minthous = abs(secs / 60) - floor(secs / 60);
    let minang = map(minthous, 1, 0, 0, 360);
    print(minthous);
    minang += 270;
    let handlen = 85 / 2 - 2;
    let handx = cos(minang) * handlen + circx;
    let handy = sin(minang) * handlen + 65;
    line(circx, 65, handx, handy);
}

function hrTimer() {
    stroke(255);
    strokeWeight(2);
    fill(30, 13, 92);
    let circx = 410;
    circle(circx, 65, 85);
    circle(circx, 65, 5);
    stroke(0);
    strokeWeight(2);
    line(circx, 34, circx, 24);

    // hand
    angleMode(DEGREES);
    strokeWeight(4);
    stroke(255, 132, 0);
    let hrthous = abs(secs / 60 / 60) - floor(secs / 60 / 60);
    let secang = map(hrthous, 1, 0, 0, 360);
    secang += 270;
    let handlen = 85 / 2 - 2;
    let handx = cos(secang) * handlen + circx;
    let handy = sin(secang) * handlen + 65;
    line(circx, 65, handx, handy);
}

function dayTimer() {
    stroke(255);
    strokeWeight(2);
    fill(30, 13, 92);
    let circx = 510;
    circle(circx, 65, 85);
    circle(circx, 65, 5);
    stroke(0);
    strokeWeight(2);
    line(circx, 34, circx, 24);

    // hand
    angleMode(DEGREES);
    strokeWeight(4);
    stroke(255, 132, 0);
    let daythous = abs(secs / 60 / 60 / 24) - floor(secs / 60 / 60 / 24);
    let secang = map(daythous, 1, 0, 0, 360);
    secang += 270;
    let handlen = 85 / 2 - 2;
    let handx = cos(secang) * handlen + circx;
    let handy = sin(secang) * handlen + 65;
    line(circx, 65, handx, handy);
}

function mousePressed() {

}

function keyPressed() {

}

function windowResized() {
    var cnv = createCanvas(window.innerWidth - 2, window.innerHeight - 2);
    cnv.position((windowWidth - width) / 2, (windowHeight - height) / 2);
}