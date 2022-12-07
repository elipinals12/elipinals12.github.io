var grounds = [];
var minlength = 3;
var maxlength = 30;
var groundcount;
var moverate = 3;
var startheight;
var moused = 100;
var time = 0;
var smalltext;
var edge;
var first = true;
var r = 255;
var g = 255;
var b = 255;
var redFont = false;
var pause = false;
var xmindist;
var xmaxdist;
var ymindist;
var ymaxdist;
var edgex1;
var edgex2;
var edgey1;
var edgey2;

function setup() {
    var cnv = createCanvas(window.innerWidth - 22, window.innerHeight - 22);
    var cnvx = (windowWidth - width) / 2;
    var cnvy = (windowHeight - height) / 2;
    cnv.position(cnvx, cnvy);

    noStroke();
    // frameRate(1);

    startheight = -height;

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
        if (redFont) { fill(255, 0, 0); }
        textAlign(CENTER, CENTER);
        text("SURVIVE", width / 2, height / 2);
        textSize(width / 14);
        fill(200, 60, 200);
        if (redFont) { fill(255, 0, 0); }
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
                        moverate += .028;
                    }
                }

                if (grounds[i].isPurple()) {
                    redFont = true;
                    moused -= .65;
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
                if (redFont) { fill(255, 0, 0); }
                textSize(width / 4);
                textAlign(CENTER, CENTER);
                noStroke();
                text("LOSER", width / 2, height / 2)
                textSize(width / 14);
                fill(200, 60, 200);
                if (redFont) { fill(255, 0, 0); }
                text("Click to Go", width / 2, 3 * height / 4);

                grounds[i].show();
                grounds[i].move();
            }
        }

        // BALL
        fill(255, 0, 0);
        if (redFont) { fill(255, 0, 0); }
        noStroke();

        if (int(moused) <= 0) {
            circle(mouseX, mouseY, moused + .5);
        }

        // score
        textSize(smalltext);
        textAlign(CENTER, TOP);
        fill(225, 110, 13);
        if (redFont) { fill(255, 0, 0); }
        text(int(moused), width / 10, height / 25);

        timer();
    }
    redFont = false;
}


class Ground {
    constructor(x1, y1, edge) {
        this.x1 = x1;
        this.y1 = y1;
        this.edge = edge;

        //edges stored as each's 4 corners
        // this code has been tested and works perfectly
        this.edges = [[this.x1 - 2, this.y1 - 2, this.x1 + this.edge + 2, this.y1 + 2],
        [this.x1 + this.edge + 2, this.y1 - 2, this.x1 + this.edge - 2, this.y1 + this.edge + 2],
        [this.x1 - 2, this.y1 + this.edge + 2, this.x1 + this.edge + 2, this.y1 + this.edge - 2],
        [this.x1 + 2, this.y1 + this.edge + 2, this.x1 - 2, this.y1 - 2]];
    }
    show() {
        //fill(255);
        noFill();
        stroke(r, g, b);
        strokeWeight(4);
        square(this.x1, this.y1, this.edge);

        // test the edges, usually edges are invis
        // noStroke();
        // rectMode(CORNERS);
        // fill(0,255,0);
        // rect(this.edges[0][0], this.edges[0][1], this.edges[0][2], this.edges[0][3]);
        // fill(100,35,0);
        // rect(this.edges[1][0], this.edges[1][1], this.edges[1][2], this.edges[1][3]);
        // fill(100,0,100);
        // rect(this.edges[2][0], this.edges[2][1], this.edges[2][2], this.edges[2][3]);
        // fill(1,205,200);
        // rect(this.edges[3][0], this.edges[3][1], this.edges[3][2], this.edges[3][3]);
        // rectMode(CORNER);
    }

    move() {
        if (!pause) {
            this.y1 += moverate;

            //edges stored as corners of edges
            for (var i = 0; i < this.edges.length; i++) {
                //add moverate to just y coords, doesnt need more than a line :)
                this.edges[i] = [this.edges[i][0], this.edges[i][1] += moverate, this.edges[i][2], this.edges[i][3] += moverate];
            }
        }
    }

    isPurple() {
        // for each edge
        for (var i = 0; i < this.edges.length; i++) {
            // do
            edgex1 = min(this.edges[i][0], this.edges[i][2]);
            edgex2 = max(this.edges[i][0], this.edges[i][2]);
            edgey1 = min(this.edges[i][1], this.edges[i][3]);
            edgey2 = max(this.edges[i][1], this.edges[i][3]);
            // print(edgex1, edgey1, edgex2, edgey2);
            // print(mouseX, mouseY);
            // geeksforgeeks gave me godly written checkOverlap (appreciate), gonna use that now
            if (checkOverlap(moused / 2, mouseX, mouseY, edgex1, edgey1, edgex2, edgey2)) {
                return true;
            }

            // TODO something below doesnt work no clue what cause its not outputting anything
            // below distance from each wall of each edge to relevant mouse x/y
            // if mouseX within left and right wall of edge, xmindist < mouseX < xmaxdist
            // what about if mouseX is not a point but a circle
            // if xmindist < mouseX +- r < xmaxdist collides?
            // xmindist = abs(mouseX - min(this.edges[i][0], this.edges[i][2]));
            // xmaxdist = abs(mouseX - max(this.edges[i][0], this.edges[i][2]));

            // ymindist = abs(mouseY - min(this.edges[i][1], this.edges[i][3]));
            // ymaxdist = abs(mouseY - max(this.edges[i][1], this.edges[i][3]));

            // //print(xmindist, ymindist, xmaxdist, ymaxdist);
            // if (xmindist <= moused &&
            //     xmaxdist <= moused &&
            //     ymindist <= moused &&
            //     ymaxdist <= moused) {
            //     print("collision");
            //     print(xmindist, ymindist, xmaxdist, ymaxdist);
            //     return true;
            // }
        }

        return false;
    }
}

function newGround() {
    x1 = random(-100, width + 50);
    y1 = random(startheight, -50);
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
    if (keyCode == 32) {
        pause = !pause;
        // ----pause must pause----
        //  DONE - circle drawing ==== AFTER TESTING, this should still be drawn
        //        to clarify this feature could be fully used to cheat, dont care, cheating is trivial in multiple ways to knowledgable party, just game for fun
        //        this isn't a bank this is atlib, jesus
        //  DONE - timer
        //  DONE - square movement
        // forgot collisions, but i wanna test
        // wait didnt forget, paused should still take collisions why not
    }
}

function timer() {
    textSize(smalltext);
    fill(250, 215, 50);
    if (redFont) { fill(255, 0, 0); }
    textAlign(CENTER, TOP);
    noStroke();

    var timex = 9 * width / 10;
    var timey = height / 25;

    if (moused < 0) moused = 0;

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
        if (!pause) time = time + (1 / 60);
    }
    // } else {
    //     timefader -= 10;
    // }
    // if (timefader < -70) {
    //     timefader = 255;
    // }
}

function windowResized() {
    var cnv = createCanvas(window.innerWidth - 22, window.innerHeight - 22);
    var cnvx = (windowWidth - width) / 2;
    var cnvy = (windowHeight - height) / 2;
    cnv.position(cnvx, cnvy);
}

// STOLEN, thank you geeksforgeeks
function checkOverlap(R, Xc, Yc, X1, Y1, X2, Y2) {
    // Find the nearest point on the
    // rectangle to the center of
    // the circle
    let Xn = max(X1, min(Xc, X2));
    let Yn = max(Y1, min(Yc, Y2));

    // Find the distance between the
    // nearest point and the center
    // of the circle
    // Distance between 2 points,
    // (x1, y1) & (x2, y2) in
    // 2D Euclidean space is
    // ((x1-x2)**2 + (y1-y2)**2)**0.5
    let Dx = Xn - Xc;
    let Dy = Yn - Yc;
    return (Dx * Dx + Dy * Dy) <= R * R;
}