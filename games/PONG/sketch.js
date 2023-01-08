// TODO: 
// add sound
// make ball 3d

var posx, posy;
var xspeed = 0;
var yspeed = 0;
var ydir;
var xdir;
var timer = 5;
var stopped = true;
var p1y, p2y;
var p1score = 0;
var p2score = 0;
var speed = 3;
var f = 100;
var bounces = 0;
var first = true;
var playerselect = true;
var p1alph = 145;
var p2alph = 145;
var pracalph = 145;
var leftx1, lefty1, rightx1, righty1, leftx2, lexty2, rightx2, righty2;
var pracx1, pracy1, pracx1, pracy1;
var pcount;
var backr = 0;
var backg = 0;
var backb = 0;
var backa = 255;
var level = 1;
var templevel = 1;
var lossflash = false;
var lvlflash = false;
var flashcount = 0;
var frac;

function setup() {
    var cnv = createCanvas(window.innerHeight - 22, window.innerHeight - 22)
    var x = (windowWidth - width) / 2;
    var y = ((windowHeight - height) / 2);
    cnv.position(x, y);
    frameRate(f);

    posy = height / 2
    posx = height / 2

    p1y = height / 2 - height / 8;
    p2y = height / 2 - height / 8;

}

function draw() {
    if (lossflash) {
        backr = 45;
        flashcount++;
    } else if (lvlflash) {
        backg = 25;
        backb = 40;
        flashcount++;
    }
    if (flashcount > 20) {
        flashcount = 0;
        lossflash = false;
        lvlflash = false;
    }

    background(backr, backg, backb);
    backr = 0;
    backg = 0;
    backb = 0;

    if (playerselect) {
        // 1 or 2 player selection
        textAlign(CENTER, CENTER);
        noStroke();
        textSize(height / 5);
        fill(100, 5, 255);
        text("Players", width / 2, 2.5 * height / 9);

        textSize(height / 3);
        fill(0, 0, 255, p1alph - 50);
        text("1", 1 * width / 4, height / 1.8);

        fill(0, 0, 255, p2alph - 50);
        text("2", 3 * width / 4, height / 1.8);

        textSize(height / 6);
        fill(0, 0, 255, pracalph - 50);
        text("Practice", width / 2, (height / 1.09 + height / 1.35) / 2);

        p1alph = 145;
        p2alph = 145;
        pracalph = 145;


        pracx1 = height / 6.5;
        pracy1 = height / 1.35;
        pracx2 = height - height / 6.5;
        pracy2 = height / 1.12;

        leftx1 = height / 6.5;
        lefty1 = height / 2.62;
        leftx2 = height / 2.9;
        lefty2 = height / 1.47;

        rightx2 = height - height / 6.5;
        righty1 = height / 2.62;
        rightx1 = height - height / 2.9;
        righty2 = height / 1.47;

        if (mouseX > leftx1 && mouseX < leftx2 && mouseY > lefty1 && mouseY < lefty2) {
            p1alph = 255;
            if (mouseIsPressed) {
                pcount = 1;
                playerselect = false;
            }
        } else if (mouseX > rightx1 && mouseX < rightx2 && mouseY > righty1 && mouseY < righty2) {
            p2alph = 255;
            if (mouseIsPressed) {
                pcount = 2;
                playerselect = false;
            }
        } else if (mouseX > pracx1 && mouseX < pracx2 && mouseY > pracy1 && mouseY < pracy2) {
            pracalph = 255;
            if (mouseIsPressed) {
                pcount = 0;
                playerselect = false;
            }
        }

        strokeWeight(4);
        stroke(0, 0, 255, p1alph);
        rectMode(CORNERS);
        fill(0, 0, 0, 0);
        rect(leftx1, lefty1, leftx2, lefty2, 4);

        stroke(0, 0, 255, p2alph);
        rect(rightx1, righty1, rightx2, righty2, 4);

        stroke(0, 0, 255, pracalph);
        rect(pracx1, pracy1, pracx2, pracy2, 4);

        // mouse
        fill(255);
        noStroke();
        triangle(mouseX - 10, mouseY + 23, mouseX + 10, mouseY + 23, mouseX, mouseY);
    } else {
        movement();

        if (first) {
            // arrow
            stroke(191, 0, 188);
            fill(191, 0, 188);
            if (pcount == 2 || pcount == 1) {
                textSize(70);
                textAlign(CENTER, CENTER);
                text("Speed", width / 2, 8 * height / 9);

                strokeWeight(4);
                line(width / 2, height / 1.25, width / 2 + 12, height / 1.22);
                line(width / 2, height / 1.25, width / 2 - 12, height / 1.22);
                line(width / 2, height / 1.25, width / 2, height / 1.168);
            } else if (pcount == 0) {
                textSize(70);
                textAlign(CENTER, CENTER);
                text("Level", width / 2, 8 * height / 9);

                strokeWeight(4);
                line(width / 2, height / 1.6, width / 2 + 38, height / 1.42);
                line(width / 2, height / 1.6, width / 2 - 38, height / 1.42);
                line(width / 2, height / 1.6, width / 2, height / 1.168);
            }
            strokeWeight(1);
            textSize(width / 26.66);
            if (pcount == 2) {
                text("Up", width - width / 8.5, height / 2 - 50);
                text("Down", width - width / 8.5, height / 2 + 50);
                text("W", width / 8.5, height / 2 - 50);
                text("S", width / 8.5, height / 2 + 50);
            } else if (pcount == 0) {
                text("Up", width - width / 8.5, height / 2 - 50);
                text("Down", width - width / 8.5, height / 2 + 50);
                text("Up", width / 8.5, height / 2 - 50);
                text("Down", width / 8.5, height / 2 + 50);
            } else if (pcount == 1) {
                text("Up", width - width / 8.5, height / 2 - 50);
                text("Down", width - width / 8.5, height / 2 + 50);
            }
        }

        // SCORE COUNTER
        textAlign(RIGHT, CENTER);
        noStroke();
        if (pcount == 2 || pcount == 1) {
            fill(255, 255, 100, 50);
            textSize(height / 2.666);
            text(p1score, width / 2 - 50, height / 2);

            textAlign(LEFT, CENTER);
            text(p2score, width / 2 + 50, height / 2);
        } else if (pcount == 0) {
            fill(80, 80, 255, 80);
            textAlign(CENTER, CENTER);
            textSize(height / 2.666);
            text(level, width / 2, height / 2);
        }

        // SPEED
        templevel = level;
        level = int(1 + bounces / 4);
        if (level != templevel) {
            lvlflash = true;
        }

        if (pcount == 2 || pcount == 1) {
            noStroke();
            textAlign(CENTER, CENTER);
            fill(80, 80, 255, 80);
            textSize(height / 8);
            text(level, width / 2, height / 1.333);
        } else if (pcount == 0) {
            // NOTHING
        }



        // speed fraction
        frac = (bounces % 4);
        fill(100, 30, 65);
        textAlign(CENTER, CENTER);
        textSize(height / 10);
        text(frac + "/4", height * .8, height * .8);


        // BALL
        fill(255);
        noStroke();
        ellipse(posx, posy, 18, 18);

        // CHECKS FOR COLLISIONS
        if ((posx <= 8 + 9) && ((posy >= p1y) && (posy <= p1y + 220))) {
            xspeed = -xspeed;
            posx = 8 + 9;
            bounces++;
        } else if ((posx >= width - 8 - 9) && ((posy >= p2y) && (posy <= p2y + 220))) {
            xspeed = -xspeed;
            posx = width - 8 - 9;
            bounces++;
        }
        if (posx >= width + 9) {
            reset();
            p1score++;
            lossflash = true;
        } else if (posx <= -9) {
            reset();
            p2score++;
            lossflash = true;
        }

        if (posy >= width - 9 || posy <= 9) {
            yspeed = -yspeed;
        }


        // MOUSE RESET
        if ((keyIsDown(32)) && (stopped)) {
            setSpeeds();
            bounces = 0;
            mouseIsPressed = false;
            first = false;
        }
        if (stopped) {
            fill(255, 0, 0);
            textAlign(CENTER, CENTER);
            textSize(height / 12.3);
            text("Press Space to Start", width / 2, height / 4);
        }


        // MAKE PADDLE
        fill(255);
        noStroke();
        rectMode(CORNER);
        rect(0, p1y, 8, height / 4);
        rect(width - 8, p2y, 8, height / 4);


        // FIXING MISSING PADDLE
        if (p1y <= -220) {
            p1y = height - 1;
        } else if (p1y >= height) {
            p1y = -221;
        } else if (p2y <= -220) {
            p2y = height - 1;
        } else if (p2y >= height) {
            p2y = -221;
        }


        //timer = 5;

        // if (frameCount % 60 == 0 && timer > 0) { // if the frameCount is divisible by 60, then a second has passed. it will stop at 0
        //     timer --;
        // }
        // if (timer != 0) {
        //     stroke(255);
        //     fill(255);
        //     textAlign(CENTER, CENTER);
        //     textSize(100);
        //     text(timer, width/2, height/2);
        // }
    }
}



function setSpeeds() {
    stopped = false;

    xspeed = random(3.5, 4.5);
    yspeed = random(.5, 5);

    xdir = random(-1, 1);
    ydir = random(-1, 1);

    if (xdir === 0) {
        xdir = random(-1, 1);
    }
    if (ydir === 0) {
        ydir = random(-1, 1);
    }
    if (xdir < 0) {
        xspeed = -xspeed;
    }
    if (ydir < 0) {
        yspeed = -yspeed;
    }
}

function reset() {
    stopped = true;
    posx = width / 2;
    posy = height / 2;
    xspeed = 0;
    yspeed = 0;
    //tiimer();
}

function keyPressed() {

}

function movement() {
    // MOVE PADDLE

    if (pcount == 2) {
        if (keyIsDown(83)) {
            p1y = p1y + 2 * speed;
        } else if (keyIsDown(87)) {
            p1y = p1y - 2 * speed;
        }

        if (keyIsDown(DOWN_ARROW)) {
            p2y = p2y + 2 * speed;
        } else if (keyIsDown(UP_ARROW)) {
            p2y = p2y - 2 * speed;
        }
    } else if (pcount == 1) {
        if (keyIsDown(DOWN_ARROW)) {
            p2y = p2y + 2 * speed;
        } else if (keyIsDown(UP_ARROW)) {
            p2y = p2y - 2 * speed;
        }

        // BOT
        if (posy > (p1y + height / 8)) {
            p1y = p1y + 2 * speed;
        } else if (posy < (p1y + height / 8)) {
            p1y = p1y - 2 * speed;
        }
    } else if (pcount == 0) {
        if (keyIsDown(DOWN_ARROW)) {
            p2y = p2y + 2 * speed;
            p1y = p1y + 2 * speed;

        } else if (keyIsDown(UP_ARROW)) {
            p2y = p2y - 2 * speed;
            p1y = p1y - 2 * speed;
        }
    }
    for (let i = 0; i <= bounces; i += 4) {
        posx = posx + xspeed;
        posy = posy + yspeed;
    }
}