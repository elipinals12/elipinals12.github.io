// TODO: 
// add sound
// make ball 3d
// make 1player mode

var posx = 400;
var xspeed = 0;
var posy = 400;
var yspeed = 0;
var ydir;
var xdir;
var timer = 5;
var stopped = true;
var p1y = 290;
var p2y = 290;
var p1score = 0;
var p2score = 0;
var speed = 3;
var f = 100;
var bounces = 0;
var first = true;

function setup() {
    var cnv = createCanvas(800, 800);
    var x = (windowWidth - width) / 2;
    var y = ((windowHeight - height) / 2);
    cnv.position(x, y);
    frameRate(f);
}

function draw() {
    background(0);

    movement();

    if (first) {
        fill(255);
        textSize(70);
        textAlign(CENTER, CENTER);
        text("Speed", 400, 730);
        stroke(255);
        strokeWeight(4);
        line(400, 690, 400, 650);
        line(400, 650, 390, 660);
        line(400, 650, 410, 660);

        strokeWeight(1);
        textSize(30);
        text("Up", 730, 350);
        text("Down", 730, 450);
        text("W", 70, 350);
        text("S", 70, 450);
    }

    // SCORE COUNTER
    fill(255, 255, 100, 50);
    textAlign(RIGHT, CENTER);
    noStroke();
    textSize(300);
    text(p1score, 350, 412);

    textAlign(LEFT, CENTER);
    text(p2score, 450, 412);

    // SPEED
    textAlign(CENTER, CENTER);
    fill(80, 80, 255, 80);
    textSize(100);
    text(int(1 + bounces / 4), 400, 600);

    // BALL
    fill(255);
    noStroke();
    ellipse(posx, posy, 18, 18);




    // CHECKS FOR COLLISIONS
    if ((posx <= 8 + 9) && ((posy >= p1y) && (posy <= p1y + 220))) {
        xspeed = -xspeed;
        posx = 8 + 9;
        bounces++;
    } else if ((posx >= 792 - 9) && ((posy >= p2y) && (posy <= p2y + 220))) {
        xspeed = -xspeed;
        posx = 792 - 9;
        bounces++;
    }
    if (posx >= 809) {
        reset();
        p1score++;
    } else if (posx <= -9) {
        reset();
        p2score++;
    }

    if (posy >= 791 || posy <= 9) {
        yspeed = -yspeed;
    }


    // MOUSE RESET
    if ((keyIsDown(32)) && (stopped)) {
        setSpeeds();
        mouseIsPressed = false;
        first = false;
    }
    if (stopped) {
        fill(255, 0, 0);
        textAlign(CENTER, CENTER);
        textSize(65);
        text("Press Space to Start", 400, 200)
    }


    // MAKE PADDLE
    fill(255);
    noStroke();
    rect(0, p1y, 8, 220);
    rect(792, p2y, 8, 220);


    // FIXING MISSING PADDLE
    if (p1y <= -220) {
        p1y = 799;
    } else if (p1y >= 800) {
        p1y = -221;
    } else if (p2y <= -220) {
        p2y = 799;
    } else if (p2y >= 800) {
        p2y = -221;
    }


    /* SWITCHED TO keyIsDown, can take multiple inputs
    // IF SAME TIME INPUT
      if ((keyCode === 83) && (keyCode === DOWN_ARROW) && (keyIsPressed)) {
          p1y = p1y + 2;
          p2y = p2y + 2;
      } else if ((keyCode === 87) && (keyCode === UP_ARROW) && (keyIsPressed)) {
          p1y = p1y - 2;
          p2y = p2y - 2;
      } else if ((keyCode === 83) && (keyCode === UP_ARROW) && (keyIsPressed)) {
          p2y = p2y - 2;
          p1y = p1y + 2;
      } else if ((keyCode === 87) && (keyCode === DOWN_ARROW) && (keyIsPressed)) {
          p2y = p2y + 2;
          p1y = p1y - 2;
      }*/



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



function setSpeeds() {
    stopped = false;

    xspeed = random(3, 4);
    yspeed = random(.5, 4);

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
    posx = 400;
    posy = 400;
    xspeed = 0;
    yspeed = 0;
    bounces = 0;
    //tiimer();
}

function keyPressed() {

}

function movement() {
    // MOVE PADDLE
    if (keyIsDown(DOWN_ARROW)) {
        p2y = p2y + 2 * speed;
    } else if (keyIsDown(UP_ARROW)) {
        p2y = p2y - 2 * speed;
    }

    if (keyIsDown(83)) {
        p1y = p1y + 2 * speed;
    } else if (keyIsDown(87)) {
        p1y = p1y - 2 * speed;
    }
    for (let i = 0; i <= bounces; i += 4) {
        posx = posx + xspeed;
        posy = posy + yspeed;
    }
}