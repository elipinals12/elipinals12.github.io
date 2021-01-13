var grounds = [];
var minlength = 3;
var maxlength = 30;
var groundcount = 40;
var moverate = 1.5;
var startheight;
let m, mousem;
var moused = 100;

function setup() {
    var cnv = createCanvas(window.innerWidth - 22, window.innerHeight - 22);
    var cnvx = (windowWidth - width) / 2;
    var cnvy = (windowHeight - height) / 2;
    cnv.position(cnvx, cnvy);

    noStroke();
    //frameRate(1);

    startheight = -height - 100;

    for (let i = 0; i < groundcount; i++) {
        newGround();
    }
}

function draw() {
    background(2, 2, 10);


    if (moused > 0) {
        for (let i = 0; i < grounds.length; i++) {
            if (grounds[i].y1 > height + 100 || grounds[i].y2 > height + 100) {
                grounds.splice(i, 1);
                newGround();
                if (moverate < 35) {
                    moverate += .01;
                }
            }

            m = (grounds[i].y2 - grounds[i].y1) / (grounds[i].x2 - grounds[i].x1);
            mousem = (mouseY - grounds[i].y1) / (mouseX - grounds[i].x1);
            if (int(mousem) - int(m) <= abs(moused) && mouseX < grounds[i].x2 && mouseX > grounds[i].x1 && mouseY < grounds[i].y2 && mouseY > grounds[i].y1) {
                moused -= .5;
            }

            grounds[i].show();
            grounds[i].move();
        }
    } else {
        for (let i = 0; i < grounds.length; i++) {
            if (grounds[i].y1 > height + 100 || grounds[i].y2 > height + 100) {
                grounds.splice(i, 1);
                newGround();
            }

            fill(255, 0, 40);
            textSize(height / 2);
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
}


class Ground {
    constructor(x1, y1, x2, y2) {
        this.x1 = x1;
        this.x2 = x2;
        this.y1 = y1;
        this.y2 = y2;
    }
    show() {
        fill(255);
        stroke(255);
        strokeWeight(4);
        line(this.x1, this.y1, this.x2, this.y2);
    }
    move() {
        this.y1 += moverate;
        this.y2 += moverate;
    }
}

function newGround() {
    x1 = random(0, width);
    y1 = random(startheight, 0);
    x2 = x1 + random(20, 100);
    y2 = y1 + random(20, 100);

    var g = new Ground(x1, y1, x2, y2);
    grounds.push(g);
}


function reset() {

}

function mousePressed() {

}

function keyPressed() {

}