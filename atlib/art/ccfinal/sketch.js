var h = 180;
var ang;
var count = 0;
var instructions = true;
var treers = [];
var treegs = [];
var treebs = [];
var treeposx = [];
var treeposy = [];
var groundposx = [];
var groundposy = [];
var starposx = [];
var starposy = [];
var lens = [];
var lr = [];
var lg = [];
var lb = [];
var times = [24, 20, 18, 16, 14, 12, 10, 8, 6, 4, 2, 0];
var stars = false;
var freeze = false;
var stara = 0;
var sky = false;
var lenmax = 90;
var time = 0;
var midy;
var help = false;
var sunsize = 45;
var newc;
var boxh;
var sc1 = [2, 0, 2];
var sc2 = [6, 2, 13];
var sc3 = [3, 7, 28];
var sc4 = [27, 64, 95];
var sc5 = [248, 74, 47];
var sc5_2 = [232, 205, 134];
var sc6 = [91, 171, 212];
var sc7 = [91, 171, 212];
var sc9 = [232, 205, 134];
var sc10 = [232, 205, 134];
var sc11 = [247, 152, 70];
var sc12 = [247, 152, 70];
//var sc6 = [248, 74, 47]; deep red
//;var sc5 = [247, 152, 70];
//

function setup() {
    var cnv = createCanvas(windowWidth, windowHeight);
    var x = (windowWidth - width) / 2;
    var y = (windowHeight - height) / 2;
    cnv.position(x, y);

    for (var i = 0; i < width / 1.5; i++) {
        append(starposx, random(0, width))
        append(starposy, random(0, height))
    }

    // make the leave colors
    for (var i = 0; i < 1000; i++) {
        append(lr, 55 + random(-20, 20));
        append(lg, 100 + random(-20, 20));
        append(lb, 49 + random(-20, 20));
    }

    background(0);
}

function draw() {
    // time
    if (!freeze) {
        time = map(mouseY, height, 0, 0, 24);
    }
    // BACKGROUND DUN DUN DUNNNNNNNNNN
    if (sky) {
        //night
        if (time <= times[0] && time > times[1]) {
            midy = map(time, times[1], times[0], 0, height);
            doubleGrad(sc1, sc2, sc3, midy);
            stara = 255;
        } else if (time <= times[1] && time > times[2]) {
            midy = map(time, times[2], times[1], 0, height);
            doubleGrad(sc2, sc3, sc4, midy);
            stara = 255;
        } else if (time <= times[2] && time > times[3]) {
            midy = map(time, times[3], times[2], 0, height);
            doubleGrad(sc3, sc4, sc5, midy);
            stara = map(midy, 0, height, 0, 255);
        } else if (time <= times[3] && time > times[4]) {
            midy = map(time, times[4], times[3], 0, height);
            doubleGrad(sc4, sc5, sc6, midy);
            stara = 0;
        } else if (time <= times[4] && time > times[5]) {
            midy = map(time, times[5], times[4], 0, height);
            doubleGrad(sc5, sc6, sc7, midy);
            stara = 0;
            //reverse reverse
        } else if (time <= times[5] && time > times[6]) {
            midy = map(time, times[6], times[5], 0, height);
            doubleGrad(sc7, sc6, sc5_2, midy);
            stara = 0;
        } else if (time <= times[6] && time > times[7]) {
            midy = map(time, times[7], times[6], 0, height);
            doubleGrad(sc6, sc5_2, sc4, midy);
            stara = 0;
        } else if (time <= times[7] && time > times[8]) {
            midy = map(time, times[8], times[7], 0, height);
            doubleGrad(sc5_2, sc4, sc3, midy);
            stara = map(midy, 0, height, 255, 0);
        } else if (time <= times[8] && time > times[9]) {
            midy = map(time, times[9], times[8], 0, height);
            doubleGrad(sc4, sc3, sc2, midy);
            stara = 255;
        } else if (time <= times[9] && time > times[10]) {
            midy = map(time, times[10], times[9], 0, height);
            doubleGrad(sc3, sc2, sc1, midy);
            stara = 255;
        } else {
            background(0);
        }
    } else {
        background(0);

        if (instructions) {
            textSize(width / 8);
            textAlign(CENTER, CENTER);
            fill(255);
            text("Press H for help", width / 2, height / 2);
        }
    }

    showStars();

    //clock
    if (false) {
        stroke(0);
        fill(255);
        textSize(30);
        textAlign(LEFT, TOP);
        text(int(time) + ":00", 15, 15);
    }

    //sun
    if (false) {
        var sunx = mouseX;
        var suny = mouseY;
        noStroke();
        for (i = 0; i < 100; i++) {
            fill(255, 255, 150, map(i, 0, 100, 105, 0));
            circle(sunx, suny, sunsize + i * 2);
        }
        fill(253, 220, 5);
        circle(sunx, suny, sunsize + 3)
        fill(245, 251, 53);
        circle(sunx, suny, sunsize);
        fill(255, 255, 255);
        circle(sunx, suny, sunsize - 5);
        var a = map(mouseY, 0, height, 255, 0);
        fill(255, 255, 255, a);
        circle(sunx, suny, sunsize + 3);
    }

    // decide ang
    ang = radians(map(mouseX, 0, width, 0, 180));
    if (ang > PI) {
        ang = PI;
    } else if (ang < 0) {
        ang = 0;
    }

    if (keyIsDown(71)) {
        append(groundposx, mouseX);
        append(groundposy, mouseY);
    }

    // draw ground
    stroke(45, 90, 39);
    strokeWeight(30);
    for (var i = 0; i < groundposx.length; i++) {
        line(groundposx[i], groundposy[i], groundposx[i], height + 7);
    }
    strokeWeight(1);

    // sort trees
    /*treeposx.sort(function (a, b) {
        return a - b;
    })*/
    // draw trees  
    for (var i = 0; i < treeposx.length; i++) {
        stroke(treers[i], treegs[i], treebs[i]);
        branch(lens[i], treeposx[i], treeposy[i], i);
    }

    if (mouseIsPressed) {
        instructions = false;
        append(treeposx, mouseX);
        append(treeposy, mouseY);
        append(lens, random(50, lenmax));
        append(treers, 82 + random(-20, 10));
        append(treegs, 59 + random(-20, 10));
        append(treebs, 33 + random(-20, 10));
        mouseIsPressed = false;
    }

    // help menu
    if (help) {
        instructions=false;
        rectMode(CENTER);
        fill(85);
        noStroke();
        if (width < height) {
            boxh = width;
        } else {
            boxh = height;
        }
        rect(width / 2, height / 2, boxh + 90, boxh - 50);
        //textSize(boxh / 13);
        fill(255);
        textSize(boxh/23);
        textAlign(LEFT, CENTER);
        var margin=(width/2)-(boxh/2);
        text("1. Hold G and move the mouse to draw the ground", margin, 1 * boxh / 9);
        text("2. Click to grow a tree from where your mouse is", margin, 2 * boxh / 9);
        text("3. Grow the trees by pressing the up arrow repeatedly", margin, 3 * boxh / 9);
        text("4. Press S to toggle the sky", margin, 4 * boxh / 9);
        text("    control it by moving the mouse vertically", margin, 5 * boxh / 9);
        text("F - freeze the sky", margin, 6 * boxh / 9);
        text("R - reset the trees and ground", margin, 7 * boxh / 9);
        text("H - toggle this menu", margin, 8 * boxh / 9);
    }
}

function keyPressed() {
    instructions=false;
    if (keyIsDown(40)) {
        if (h < 180) {
            h = h / .67;
            count--;
        }
    } else if (keyIsDown(38)) {
        if (h > 3) {
            h = h * .67;
            count++;
        }
        print(count);
    } else if (keyIsDown(82)) {
        count = 0;
        h = 180;
        treers = [];
        treegs = [];
        treebs = [];
        treeposx = [];
        treeposy = [];
        lens = [];
        starposx = [];
        starposy = [];
        groundposx = [];
        groundposy = [];
        setup();
    } else if (keyIsDown(83)) {
        sky = !sky;
    } else if (keyIsDown(70)) {
        freeze = !freeze;
    } else if (keyIsDown(72)) {
        help = !help;
    }

}

function branch(len, x, y, lcol) {
    lcol = lcol % 1000;
    push();
    translate(x, y);
    strokeWeight(map(len, 1, lenmax, 2, 8));
    line(0, 0, 0, -len);
    translate(0, -len);
    if (len > h) {
        push();
        rotate(ang);
        branch(len * .67, 0, 0, lcol + 13);
        pop();
        push();
        rotate(-ang);
        branch(len * .67, 0, 0, lcol + 19);
        pop();
    } else if (count > 5) {
        // leaves/fruit
        noStroke();
        fill(lr[lcol], lg[lcol], lb[lcol]);
        circle(x, y, 8);
    }
    pop();
}

function showStars() {
    for (var i = 0; i < starposx.length; i++) {
        stroke(255, stara);
        fill(255, stara);
        circle(starposx[i], starposy[i], random(1, 3));
    }
}

function doubleGrad(c1, c2, c3, midy) {
    c1 = color(c1[0], c1[1], c1[2]);
    c2 = color(c2[0], c2[1], c2[2]);
    c3 = color(c3[0], c3[1], c3[2]);
    for (let y = -50; y < midy; y++) {
        n = map(y, -50, midy, 0, 1);
        newc = lerpColor(c1, c2, n);
        stroke(newc);
        line(0, y, width, y);
    }
    for (let y = midy; y < height + 50; y++) {
        n = map(y, midy, height + 50, 0, 1);
        newc = lerpColor(c2, c3, n);
        stroke(newc);
        line(0, y, width, y);
    }
}

function halfGrad(c1, c2, c3, midy) {
    c1 = color(c1[0], c1[1], c1[2]);
    c2 = color(c2[0], c2[1], c2[2]);
    c3 = color(c3[0], c3[1], c3[2]);
    for (let y = height / 2; y < midy; y++) {
        n = map(y, height / 2, midy, 0, 1);
        newc = lerpColor(c1, c2, n);
        stroke(newc);
        line(0, y, width, y);
    }
    for (let y = midy; y < height + 50; y++) {
        n = map(y, midy, height + 50, 0, 1);
        newc = lerpColor(c2, c3, n);
        stroke(newc);
        line(0, y, width, y);
    }
}

function canvasSquare() {
    var cnv = createCanvas(window.innerHeight - 22, window.innerHeight - 22);
    var x = (windowWidth - width) / 2;
    var y = (windowHeight - height) / 2;
    cnv.position(x, y);
}

function windowResized() {
    //canvasSquare();
    setup();
}