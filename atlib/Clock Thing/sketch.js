var sc = 0;
var mini = 0;
var hr = 0;
var da = 0;
var mont = 0;
var yer = 0;

var gap = 16;
var cthic = 45;
var lthic = 6;

var csizes = [];
var times = [];
var cangles = [];

function setup() {
    var cnv = createCanvas(800, 800);
    var x = (windowWidth - width) / 2;
    var y = (windowHeight - height) / 2;
    cnv.position(x, y);
    angleMode(DEGREES);
    for (var i = 0; i < 6; i++) {
        csizes.push(210 + ((2 * cthic + gap) * (i + 1)));
    }
}

function draw() {
    background(0);
    cangles = [];
    times = [];
    translate(width/2, height/2);
    rotate(-90);
    
    strokeWeight(1);
    noFill();
    //ellipse(0, 0, width);

    times.push(second());
    times.push(minute());
    times.push(hour());
    times.push(day());
    times.push(month());

    
    cangles.push(map(times[0], 0, 60, 0.01, 360)); // seconds
    cangles.push(map(times[1], 0, 60, 0.01, 360)); // minutes
    cangles.push(map(times[2], 0, 24, 0.01, 360)); // hours

    if (times[4] == 2) {
        cangles.push(map(times[3], 1, 29, 0.01, 360)); // days feb
    } else if (times[4] == 1 || times[4] == 3 || times[4] == 5 || times[4] == 7 || times[4] == 8 || times[4] == 10 || times[4] == 12) {
        cangles.push(map(times[3], 1, 32, 0.01, 360)); // days high
    } else {
        cangles.push(map(times[3], 1, 31, 0.01, 360)); // days low
    }

    cangles.push(map(times[4], 1, 13, 0.01, 360)); // months

    push();
    rotate(90);
    textLeading(gap + cthic);
    textSize(cthic - 2);
    stroke(255);
    fill(255);
    strokeWeight(1);
    textAlign(LEFT);
    text(year(), 0, 16);
    pop();

    for (var i = 0; i < times.length; i++) {
        stroke(50 * i, 4 * i, 250);
        strokeWeight(cthic);
        strokeCap(SQUARE);
        arc(0, 0, csizes[i], csizes[i], 0, cangles[i]);

        push();
        rotate(cangles[i]);
        strokeCap(ROUND);
        strokeWeight(lthic);
        line(0, 0, map(i, 0, times.length, 110, 25), 0);
        pop();

        push();
        rotate(90);
        textLeading(gap + cthic);
        textSize(cthic - 2);
        stroke(255);
        fill(255);
        strokeWeight(1);
        textAlign(LEFT);
        text(times[i], 0, -((2 * cthic + gap) * (i + 1)) / 2 - 90);
        pop();
    }


    strokeWeight(lthic);
    stroke(150);
    point(0, 0);
}

function mousePressed() {
    print(times);
    print(cangles);
    //print(csizes);
    print(month());
}