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
var lenmax = 100;
var time = 0;
var br = 0;
var bg = 0;
var bb = 0;
var groundcolor = 90;

function setup() {
    var cnv = createCanvas(windowWidth, windowHeight);
    var x = (windowWidth - width) / 2;
    var y = (windowHeight - height) / 2;
    cnv.position(x, y);

    for (var i = 0; i < width / 4; i++) {
        append(starposx, random(0, width))
        append(starposy, random(0, height))
    }
}

function draw() {
    // BACKGROUND DUN DUN DUNNNNNNNNNN
    //print(time);
    if (time < 7 && time > 6) {
        // sunrise time
        c1 = color(122, 135, 152);
        c2 = color(238, 141, 75);
        for (let y = 0; y < height; y++) {
            n = map(y, 0, height, 0, 1);
            let newc = lerpColor(c1, c2, n);
            stroke(newc);
            line(0, y, width, y);
        }
    } else {
        background(br, bg, bb);
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

    // decide ang and time
    ang = radians(map(mouseX, 0, width, 0, 180));
    if (ang > PI) {
        ang = PI;
    } else if (ang < 0) {
        ang = 0;
    }

    time = map(mouseY, height, 0, 0, 24);


    for (var i = 0; i < treeposx.length; i++) {
        stroke(treers[i], treegs[i], treebs[i]);
        branch(lens[i], treeposx[i], treeposy[i]);
    }

    if (mouseIsPressed) {
        if (mouseButton == RIGHT) {
            append(groundposx, mouseX);
            append(groundposy, mouseY);
        } else {
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

    if (keyIsDown(83)) {
        showStars();
    }

    // draw ground
    stroke(groundcolor);
    fill(groundcolor);
    for (var i = 0; i < groundposx.length; i++) {
        circle(groundposx[i], groundposy[i], 10);
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
    }

}

function branch(len, x, y) {
    push();
    translate(x, y);
    strokeWeight(map(len, 1, lenmax, 2, 10));
    line(0, 0, 0, -len);
    translate(0, -len);
    if (len > h) {
        push();
        rotate(ang);
        branch(len * .67, 0, 0);
        pop();
        push();
        rotate(-ang);
        branch(len * .67, 0, 0);
        pop();
    } else if (count > 5) {
        fill(0, 255, 0);
        stroke(0, 255, 0);
        circle(x, y, 4);
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