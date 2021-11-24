var h = 180;
var ang;
var count = 0;
var instructions = true;
var treers = [];
var treegs = [];
var treebs = [];
var treeposx = [];
var treeposy = [];
var lens = [];
var time = 0;
var br = 0;
var bg = 0;
var bb = 0;

function setup() {
    var cnv = createCanvas(window.innerHeight - 22, window.innerHeight - 22);
    var x = (windowWidth - width) / 2;
    var y = (windowHeight - height) / 2;
    cnv.position(x, y);
}

function draw() {
    background(br, bg, bb);

    if (instructions) {
        noStroke();
        textSize(width / 12);
        fill(255);
        textAlign(CENTER, CENTER);
        text("Click", width / 2, 3 * height / 12);
        text("&", width / 2, 4.5 * height / 12);
        text("Arrows", width / 2, 6 * height / 12);
    }

    strokeWeight(2);

    // decide ang and time
    ang = radians(map(mouseX, 0, width, 0, 180));
    if (ang > PI) {
        ang = PI;
    } else if (ang < 0) {
        ang = 0;
    }

    time = map(mouseY, 0, height, 0, 24);


    for (var i = 0; i < treeposx.length; i++) {
        stroke(treers[i], treegs[i], treebs[i]);
        branch(lens[i], treeposx[i], treeposy[i]);
    }

    if (mouseIsPressed) {
        instructions = false;
        append(treeposx, mouseX);
        append(treeposy, mouseY);
        append(lens, random(50, 100));
        append(treers, random(0, 255));
        append(treegs, random(0, 255));
        append(treebs, random(190, 255));
        mouseIsPressed = false;
    }

    if (keyIsDown(76)) {

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
    }

}

function branch(len, x, y) {
    push();
    translate(x, y);
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
    }
    pop();
}


function canvasSquare() {
    var cnv = createCanvas(window.innerHeight - 22, window.innerHeight - 22);
    var x = (windowWidth - width) / 2;
    var y = (windowHeight - height) / 2;
    cnv.position(x, y);
}

function windowResized() {
    canvasSquare();
}