var h = 180;
var ang;
var count = 0;
var instructions = false;
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
var stars = false
var lenmax = 90;
var time = 0;
var br = 0;
var bg = 0;
var bb = 0;
var midy = 0;
var sunsize = 25;
let newc;

function setup() {
    var cnv = createCanvas(windowWidth, windowHeight);
    var x = (windowWidth - width) / 2;
    var y = (windowHeight - height) / 2;
    cnv.position(x, y);

    for (var i = 0; i < width / 2; i++) {
        append(starposx, random(0, width))
        append(starposy, random(0, height))
    }

    // make the leave colors
    for (var i = 0; i < 1000; i++) {
        append(lr, 45 + random(-20, 20));
        append(lg, 90 + random(-20, 20));
        append(lb, 39 + random(-20, 20));
    }
}

function draw() {
    // clock
    time = map(mouseY, height, 0, 0, 24);


    // BACKGROUND DUN DUN DUNNNNNNNNNN

    if (time <= 24 && time > 20) {
        // sunrise -> night time
        midy = map(time, 20, 24, 0, height);
        c1 = [6, 2, 13];
        c2 = [71, 121, 144];
        c3 = [159, 194, 187];
        doubleGrad(c1, c2, c3, midy);
    } else if (time <= 20 && time > 14) {
        // sunrise time
        midy = map(time, 14, 20, 0, height);
        c1 = [71, 121, 144];
        c2 = [159, 194, 187];
        c3 = [249, 166, 0];
        doubleGrad(c1, c2, c3, midy);
    } else {
        background(br, bg, bb);
    }

    //sun
    if (false) {
        noStroke();
        fill(253, 220, 5);
        circle(width / 2, height / 2, sunsize + 3)
        fill(245, 251, 53);
        circle(width / 2, height / 2, sunsize);
        fill(251, 255, 245);
        circle(width / 2, height / 2, sunsize - 5);
    }

    if (instructions) {
        noStroke();
        textSize(width / 15);
        fill(255);
        textAlign(CENTER, CENTER);
        text("Click", width / 2, 3 * height / 12);
        text("&", width / 2, 5 * height / 12);
        text("Arrows", width / 2, 7 * height / 12);
    }

    // decide ang
    ang = radians(map(mouseX, 0, width, 0, 180));
    if (ang > PI) {
        ang = PI;
    } else if (ang < 0) {
        ang = 0;
    }

    if (stars) {
        showStars();
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
        append(treers, random(0, 255));
        append(treegs, random(0, 255));
        append(treebs, random(190, 255));
        mouseIsPressed = false;
    }


}

function keyPressed() {
    instructions = false;
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
        stars = !stars;
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
        stroke(255);
        fill(255);
        circle(starposx[i], starposy[i], random(1, 3));
    }
}

function doubleGrad(c1, c2, c3, midy) {
    c1 = color(c1[0], c1[1], c1[2]);
    c2 = color(c2[0], c2[1], c2[2]);
    c3 = color(c3[0], c3[1], c3[2]);
    for (let y = 0; y < midy; y++) {
        n = map(y, 0, midy, 0, 1);
        newc = lerpColor(c1, c2, n);
        stroke(newc);
        line(0, y, width, y);
    }
    for (let y = midy; y < height; y++) {
        n = map(y, midy, height, 0, 1);
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