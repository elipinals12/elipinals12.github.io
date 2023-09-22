// TTH
// TIME TO HEAVEN/HELL depends on what its for

// TODO
// maybe have something to sense if the browser is slowing down, then remove dots 
//      maybe the dots shouldnt even fall if ^ works. 

let desc = "!!!semester ends!!!";
let hyear = 2023;
let hmonth = 11; // 0-11 !!!
let hday = 6;
let hhour = 13; // 0-23 !!!

let redHeight = 140;
var mss, secs, mins, hrs, dys, wks, mnts;
var now, heaven;
var prog;
let timeHeights = [];
let textX = 2;
let numsX = 74;
let timerXs = [];
let timerY = 80;
let barrior;
var moveEm = 0;
var secflat = false;
var phone;
let circSize = 110;
let dustSize = 18;
let dusts = [];


function setup() {
    windowResized();

    // Apr 28, 2023 final exams done, lets say first min of Apr 29, =
    // 4/29/2023, 12am
    heaven = new Date(hyear, hmonth, hday, hhour);
    hmonth++;
}

function draw() {
    background(0);

    setTotals();

    writeStuff();

    // OLDprogBar();
    progBar();

    noStroke();
    fill(255);

    textAlign(RIGHT, TOP);
    textSize(12);
    text("press any key to kill 'em all", width - 2, barrior + 5);

    textAlign(LEFT, TOP);
    textSize(20);
    text(dusts.length + " particles alive", 2, barrior + 5);

    for (var i in dusts) {        
        // if (dusts[i].y > height) dusts.splice(i, 1);
        if (dusts[i].y > height + 2) makeThisOneRed(i);

        strokeWeight(1);
        dusts[i].show();

        dusts[i].move();
        // if (dusts[i].y > height + 10) { dusts[i].y = barrior - 10; } // LOOP
    }

    // secflat = secs - floor(secs) < .02;

    if (mouseIsPressed) {
        // for (let i = 0; i<100; i++) {
        dusts.push(new Particulate());
        // }
    }
    
    secTimer();
    minTimer();
    hrTimer();
    // dayTimer(); // dont even think it works but whatevs, dont want
    // time goes last
}

function progBar() {

}

function setTotals() {
    now = new Date();

    mss = heaven.getTime() - now.getTime();
    secs = mss / 1000;
    mins = floor(secs / 60);
    hrs = floor(secs / 60 / 60);
    dys = floor(secs / 60 / 60 / 24);
    wks = floor(secs / 60 / 60 / 24 / 7);
    mnts = floor(secs / 60 / 60 / 24 / 30);
}

function writeStuff() {
    noStroke();
    textSize(17);
    textAlign(LEFT, TOP);

    fill(255);
    text("tth  (" + hmonth + "/" + hday + "/" + hyear + " " + desc + ")", 2, 2);

    textSize(20);
    text("totals", 2, timeHeights[0] - 18);

    textSize(17);

    writeNiceText();

    writeFullTimeLeft();
}

function writeFullTimeLeft() {
    let fullDateString =
    mnts + " months, " +
    dys % 30 + " days, " +
        hrs % 24 + " hours, " +
        mins % 60 + " minutes, " +
        floor(secs % 60) + " seconds"
    text(fullDateString + " left", 2, timeHeights[5] + 20);

    stroke(255);
    strokeWeight(2);
    barrior = timeHeights[5] + 40;
    line(0, barrior, width, barrior);
}

function OLDprogBar() {
    stroke(255, 0, 0);
    strokeWeight(1);
    line(0, redHeight + 1, width, redHeight + 1);

    fill(255, 0, 0);
    noStroke();
    textAlign(RIGHT, BOTTOM);
    text("once the blue crosses the red, its heaven time mate", width - 2, redHeight - 1);

    prog = map(secs, 7515500 + 2246400, 0, height, redHeight);

    noStroke();
    fill(0, 0, 185);
    rectMode(CORNERS);
    rect(0, height, width, prog);
}

function secTimer() {
    stroke(255);
    strokeWeight(2);
    fill(30, 13, 92);
    let circx = timerXs[0];
    circle(circx, timerY, circSize);
    circle(circx, timerY, 5);
    stroke(99);
    strokeWeight(2);
    line(circx, timerY - circSize / 2 + 8, circx, timerY - circSize / 2 + 1);

    // hand
    angleMode(DEGREES);
    strokeWeight(5);
    stroke(255, 132, 0);
    let secang = map(now.getMilliseconds(), 0, 999, 0, 360);
    secang += 270;
    let handlen = circSize / 2 - 2;
    let handx = cos(secang) * handlen + circx;
    let handy = sin(secang) * handlen + timerY;
    line(circx, timerY, handx, handy);
}

function minTimer() {
    stroke(255);
    strokeWeight(2);
    fill(30, 13, 92);
    let circx = timerXs[1];
    circle(circx, timerY, circSize);
    circle(circx, timerY, 5);
    stroke(99);
    strokeWeight(2);
    line(circx, timerY - circSize / 2 + 8, circx, timerY - circSize / 2 + 1);

    // hand
    angleMode(DEGREES);
    strokeWeight(5);
    stroke(255, 132, 0);
    let minthous = abs(secs / 60) - floor(secs / 60);
    let minang = map(minthous, 1, 0, 0, 360);
    minang += 270;
    let handlen = circSize / 2 - 2;
    let handx = cos(minang) * handlen + circx;
    let handy = sin(minang) * handlen + timerY;
    line(circx, timerY, handx, handy);
}

function hrTimer() {
    stroke(255);
    strokeWeight(2);
    fill(30, 13, 92);
    let circx = timerXs[2];
    circle(circx, timerY, circSize);
    circle(circx, timerY, 5);
    stroke(99);
    strokeWeight(2);
    line(circx, timerY - circSize / 2 + 8, circx, timerY - circSize / 2 + 1);

    // hand
    angleMode(DEGREES);
    strokeWeight(5);
    stroke(255, 132, 0);
    let hrthous = abs(secs / 60 / 60) - floor(secs / 60 / 60);
    let secang = map(hrthous, 1, 0, 0, 360);
    secang += 270;
    let handlen = circSize / 2 - 2;
    let handx = cos(secang) * handlen + circx;
    let handy = sin(secang) * handlen + timerY;
    line(circx, timerY, handx, handy);
}

function dayTimer() {
    stroke(255);
    strokeWeight(2);
    fill(30, 13, 92);
    let circx = 510;
    circle(circx, timerY, circSize);
    circle(circx, timerY, 5);
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
    let handlen = circSize / 2 - 2;
    let handx = cos(secang) * handlen + circx;
    let handy = sin(secang) * handlen + timerY;
    line(circx, timerY, handx, handy);
}

function mousePressed() {
    if (!secflat) dusts.push(new Particulate());
}

function keyPressed() {
    dusts = [];
}

class Particulate {
    constructor() {
        this.x = mouseX;
        this.y = mouseY;
        this.speed = 0; // gravity will change this
        this.r = random(50, 255);
        this.g = random(50, 255);
        this.b = random(50, 255);
    }

    show() {
        stroke(this.r, this.g, this.b);
        fill(this.r, this.g, this.b);
        //if (this.y-dustSize/2 > barrior) { 
        circle(this.x, this.y, dustSize); //}
    }

    move() {
        this.y += 1; // must apply gravity, for now just fall 1 per frame

        avoidHydrogenBomb();

        // enforce borders
        // if (this.y >= height) this.y--;
        // if (this.y <= 0) this.y++;
        // if (this.x >= width) this.x--;
        // if (this.x <= 0) this.x++;
    }
}
function avoidHydrogenBomb() {
    let fusionDistance = 2;
    // pop off existing cell, else nuclear fusion
    for (var pi in dusts) {
        if (abs(this.x - dusts[pi].x) < fusionDistance && abs(this.y - dusts[pi].y) < fusionDistance) {
            let directionChoice = ceil(random(4));
            if (directionChoice == 1) {
                this.y++;
            } else if (directionChoice == 2) {
                this.y--;
            } else if (directionChoice == 3) {
                this.x++;
            } else {
                this.x--;
            }
        }
    }
}

function windowResized() {
    var cnv = createCanvas(window.innerWidth - 2, window.innerHeight - 2);
    cnv.position((windowWidth - width) / 2, (windowHeight - height) / 2);

    for (let i = 0; i < 6; i++) {
        timeHeights.push(41 + 17 * i);
    }
    timeHeights.push(123);

    let w2 = width / 2;
    timerXs = [w2 - 120, w2, w2 + 120];
    if (w2 - 120 <= numsX + 180) timerXs = [numsX + 180, numsX + 300, numsX + 420];

    if (width > 680) { phone = false; } else { phone = true; }
}

// flip flop
function writeNiceText() {
    fill(0, 255, 0);
    if (secs > 0) {
        text("seconds:", textX, timeHeights[0]);
    }
    if (mins > 0) {
        text("minutes:", textX, timeHeights[1]);
    }
    if (hrs > 0) {
        text("hours:", textX, timeHeights[2]);
    }
    if (dys > 0) {
        text("days:", textX, timeHeights[3]);
    }
    if (wks > 0) {
        text("weeks:", textX, timeHeights[4]);
    }
    if (mnts > 0) {
        text("months:", textX, timeHeights[5]);
    }

    fill(0, 200, 255);    
    if (secs > 0) {
        text(nfc(secs), numsX, timeHeights[0]);
    }
    if (mins > 0) {
        text(nfc(mins), numsX, timeHeights[1]);
    }
    if (hrs > 0) {
        text(nfc(hrs), numsX, timeHeights[2]);
    }
    if (dys > 0) {
        text(nfc(dys), numsX, timeHeights[3]);
    }
    if (wks > 0) {
        text(nfc(wks), numsX, timeHeights[4]);
    }
    if (mnts > 0) {
        text(nfc(mnts), numsX, timeHeights[5]);
    }
}


function makeThisOneRed(i) {
    dusts[i].r=255;
    dusts[i].g=0;
    dusts[i].b=0;
}
