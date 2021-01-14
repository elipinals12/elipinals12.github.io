var grounds = [];
var minlength = 3;
var maxlength = 30;
var groundcount;
var moverate = 1.5;
var startheight;
var moused = 100;
var time = 0;
var smalltext;
var edge;
var first = true;
var r = 255;
var g = 255;
var b = 255;

var xd1;
var xd2;
var yd1;
var yd2;

function setup() {
    var cnv = createCanvas(window.innerWidth - 22, window.innerHeight - 22);
    var cnvx = (windowWidth - width) / 2;
    var cnvy = (windowHeight - height) / 2;
    cnv.position(cnvx, cnvy);

    noStroke();
    //frameRate(1);

    startheight = -height - 100;

    groundcount = int(width / 140);

    for (let i = 0; i < groundcount; i++) {
        newGround();
    }

    smalltext = height / 9;
}

function draw() {
    background(2, 2, 10);

    if (first) {
        textSize(width / 7);
        fill(255, 0, 0);
        textAlign(CENTER, CENTER);
        text("SURVIVE", width / 2, height / 2);
        textSize(width / 14);
        fill(200, 60, 200);
        text("Click to Go", width / 2, 3 * height / 4);
    } else {

        if (int(moused) > 0) {
            for (let i = 0; i < grounds.length; i++) {
                r = 255;
                g = 255;
                b = 255;
                if (grounds[i].y1 > height + 100) {
                    grounds.splice(i, 1);
                    newGround();
                    if (moverate < 35) {
                        moverate += .025;
                    }
                }

                xd1 = abs(mouseX - grounds[i].x1);
                xd2 = abs(mouseX - (grounds[i].x1 + grounds[i].edge));
                yd1 = abs(mouseY - grounds[i].y1);
                yd2 = abs(mouseY - (grounds[i].y1 + grounds[i].edge));

                if (((yd1 <= moused / 2 || yd2 <= moused / 2) && mouseX < grounds[i].x1 + grounds[i].edge && mouseX > grounds[i].x1) || ((xd1 <= moused / 2 || xd2 <= moused / 2) && mouseY < grounds[i].y1 + grounds[i].edge && mouseY > grounds[i].y1)) {
                    moused -= .65;
                    print("-------------------------");
                    print(xd1);
                    print(xd2);
                    print(yd1);
                    print(yd2);
                    print("------------------------");
                    r = 180;
                    g = 100;
                    b = 200;
                }

                //if (int(mousem) - int(m) <= abs(moused) && mouseX < grounds[i].x2 && mouseX > grounds[i].x1 && mouseY < grounds[i].y2 && mouseY > grounds[i].y1) {
                //  moused -= .5;
                //   }

                grounds[i].show();
                grounds[i].move();
            }
        } else {
            for (let i = 0; i < grounds.length; i++) {
                if (grounds[i].y1 > height + 100) {
                    grounds.splice(i, 1);
                    newGround();
                }

                fill(255, 0, 40);
                textSize(width / 4);
                textAlign(CENTER, CENTER);
                noStroke();
                text("LOSER", width / 2, height / 2)
                textSize(width / 14);
                fill(200, 60, 200);
                text("Click to Go", width / 2, 3 * height / 4);

                grounds[i].show();
                grounds[i].move();
            }
        }

        // BALL
        fill(255, 0, 0);
        noStroke();
        circle(mouseX, mouseY, moused + .5);

        // score
        textSize(smalltext);
        textAlign(CENTER, TOP);
        fill(225, 110, 13);
        text(int(moused), width / 10, height / 25);

        timer();
    }
}


class Ground {
    constructor(x1, y1, edge) {
        this.x1 = x1;
        this.y1 = y1;
        this.edge = edge;
    }
    show() {
        //fill(255);
        noFill();
        stroke(r, g, b);
        strokeWeight(4);
        square(this.x1, this.y1, this.edge);
    }
    move() {
        this.y1 += moverate;
    }
}

function newGround() {
    x1 = random(-50, width + 50);
    y1 = random(startheight, 0);
    edge = random(height / 15, height / 5);

    var g = new Ground(x1, y1, edge);
    grounds.push(g);
}


function reset() {
    grounds = [];
    groundcount = 40;
    moverate = 1.5;
    moused = 100;
    time = 0;
    for (let i = 0; i < groundcount; i++) {
        newGround();
    }
}

function mousePressed() {
    if (int(moused) <= 0) {
        reset();
    } else {
        first = false;
    }
}

function keyPressed() {

}

function timer() {
    textSize(smalltext);
    fill(250, 215, 50);
    textAlign(CENTER, TOP);
    noStroke();

    var timex = 9 * width / 10;
    var timey = height / 25;

    if (floor(time) < 10) {
        text("0:" + "0" + floor(time), timex, timey);
    } else if (floor(time) < 60) {
        text("0:" + floor(time), timex, timey);
    } else if (floor(time) % 60 < 10) {
        text(floor(time / 60) + ":" + "0" + floor(time) % 60, timex, timey);
    } else {
        text(floor(time / 60) + ":" + floor(time) % 60, timex, timey);
    }

    if (int(moused) > 0) {
        time = time + (1 / 60);
    }
    // } else {
    //     timefader -= 10;
    // }
    // if (timefader < -70) {
    //     timefader = 255;
    // }
}