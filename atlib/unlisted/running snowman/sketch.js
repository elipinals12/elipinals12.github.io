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

function setup() {
    var cnv = createCanvas(window.innerWidth - 22, window.innerHeight - 22);
    var cnvx = (windowWidth - width) / 2;
    var cnvy = (windowHeight - height) / 2;
    cnv.position(cnvx, cnvy);

    noStroke();
    //frameRate(1);

    startheight = -height - 100;

    groundcount = int(height / 130);

    for (let i = 0; i < groundcount; i++) {
        newGround();
    }

    smalltext = height / 9;
}

function draw() {
    background(2, 2, 10);


    if (moused > 0) {
        for (let i = 0; i < grounds.length; i++) {
            if (grounds[i].y1 > height + 100) {
                grounds.splice(i, 1);
                newGround();
                if (moverate < 35) {
                    //moverate += .01;
                }
            }

            var xd1 = abs(mouseX - grounds[i].x1);
            var xd2 = abs(mouseX - (grounds[i].x1 + grounds[i].edge));
            var yd1 = abs(mouseY - grounds[i].y1);
            var yd2 = abs(mouseY - (grounds[i].y1 + grounds[i].edge));

            if () {
                moused -= .5;
                print("-------------------------");
                print(xd1);
                print(xd2);
                print(yd1);
                print(yd2);
                print("------------------------");
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
            stroke(255, 0, 40);
            strokeWeight(2);
            text("LOSER", width / 2, height / 2)
            grounds[i].show();
            grounds[i].move();
        }
    }

    // BALL
    fill(255, 0, 0);
    noStroke();
    circle(mouseX, mouseY, moused);

    // score
    textSize(smalltext);
    textAlign(CENTER, TOP);
    fill(225, 110, 13);
    text(int(moused), width / 8, height / 25);

    timer();
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
        stroke(255);
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
    if (moused <= 0) {
        reset();
    }
}

function keyPressed() {

}

function timer() {
    textSize(smalltext);
    fill(250, 215, 50);
    textAlign(CENTER, TOP);
    noStroke();

    var timex = 7 * width / 8;
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

    if (moused > 0) {
        time = time + (1 / 60);
    }
    // } else {
    //     timefader -= 10;
    // }
    // if (timefader < -70) {
    //     timefader = 255;
    // }
}