var h = 180;
var ang;
var count = 0;

function setup() {
    createCanvas(600, 600);
}

function draw() {
    background(0);
    translate(width/2, height);

    stroke(255);
    strokeWeight(2);

    push();
    translate(-width/2, -height)
    ang = radians(map(mouseX, 0, 600, 0, 180));
    if (ang > PI) {
        ang = PI;
    } else if (ang < 0) {
        ang = 0;
    }
    pop();

    branch(176);
}

function mousePressed() {
    if (h > 3) {
        h = h * .67;
        count++;
    }
    print(count);
}

function keyPressed() {
    count = 0;
    h = 180;
}

function branch(len) {
    line(0, 0, 0, -len);
    translate(0, -len);
    if (len > h) {
        push();
        rotate(ang);
        branch(len * .67);
        pop();
        push();
        rotate(-ang);
        branch(len * .67);
        pop();
    }
}