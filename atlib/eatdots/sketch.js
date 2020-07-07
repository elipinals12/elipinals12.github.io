// TODO

var lostsound, munchsound;
var startdotcount;
var density = 20;
var playersize = 20;
var score = 0;
var began = false;
var dots = [];
var farout = 400;
var out = 100;
var fastspeed = 4;
var slowspeed = 1;
var startminsize = 3;
var startmaxsize = 100;
var minsize = startminsize;
var maxsize = startmaxsize;
var prox, touching;
var paused = false;
var lost = false;

function setup() {
    createCanvas(window.innerWidth - 20, window.innerHeight - 20);
    noStroke();
    //frameRate(1);

    lostsound = loadSound("lost.mp3");
    munchsound = loadSound("munch.mp3");

    print(width);
    startdotcount = floor(width / density);
    print(startdotcount);
    for (let i = 0; i < startdotcount; i++) {
        newDot();
    }
}

function draw() {
    background(8, 0, 28);

    minsize = startminsize + score;
    maxsize = startmaxsize + score;

    if (began) {
        if (lost) {
            fill(255, 0, 0);
            textSize(150);
            textAlign(CENTER, CENTER);
            text("GAME OVER", width / 2, (height / 2) - 100);
            fill(255);
            text("Score: " + score, width / 2, (height / 2) + 100);
            for (let i = 0; i < dots.length; i++) {
                dots[i].show();
                dots[i].move();
            }
        } else {
            if (paused) {
                for (let i = 0; i < dots.length; i++) {
                    dots[i].show();
                }
                fill(255);
                textSize(100);
                textAlign(CENTER, CENTER);
                text("Press Space To Resume", width / 2, height / 2);
                fill(255);
                textSize(100);
                textAlign(LEFT, TOP);
                text(score, 35, 35);
            } else {
                for (let i = 0; i < dots.length; i++) {
                    prox = dist(mouseX, mouseY, dots[i].x, dots[i].y);
                    touching = (dots[i].size / 2) + ((score + playersize) / 2);
                    if (prox <= touching) {
                        if (dots[i].size > score + playersize) {
                            lostsound.play();
                            lost = true;
                        } else if (dots[i].size < score + playersize) {
                            score++;
                            munchsound.play();
                            dots.splice(i, 1);
                            newDot();
                        } else {
                            print("A RARE SAME-SIZE DOT!!");
                        }

                    }

                    if (dots[i].x < -farout || dots[i].x > width + farout || dots[i].y < -farout || dots[i].y > height + farout) {
                        dots.splice(i, 1);
                        newDot();
                    }

                    dots[i].move();
                    dots[i].show();
                    fill(255);
                    circle(mouseX, mouseY, score + playersize);
                }

                fill(255);
                textSize(100);
                textAlign(LEFT, TOP);
                text(score, 35, 35);
            }
        }
    } else {
        fill(255);
        textSize(100);
        textAlign(CENTER, CENTER);
        text("Eat smaller dots to grow", width / 2, (height / 2) - 200);
        text("Space to pause", width / 2, (height / 2) - 50);
        //textSize(150);
        text("Click to start", width / 2, (height / 2) + 50);
    }
}

class Dot {
    constructor(x, y, xspeed, yspeed) {
        this.x = x;
        this.y = y;
        this.size = random(minsize, maxsize);
        this.r = random(0, 255);
        this.g = random(0, 255);
        this.b = random(0, 255);
        this.xspeed = xspeed;
        this.yspeed = yspeed;
    }
    move() {
        this.x += this.xspeed;
        this.y += this.yspeed;
    }
    show() {
        fill(this.r, this.g, this.b);
        circle(this.x, this.y, this.size);
    }
}

function newDot() {
    let wallnum = random(0, 4);
    if (wallnum <= 1) {
        // top
        x = random(-farout, width + farout);
        y = random(-farout, -out);
        xspeed = random(-fastspeed, fastspeed);
        yspeed = random(slowspeed, fastspeed);
    } else if (wallnum <= 2) {
        // right
        x = random(width + out, width + farout);
        y = random(-farout, height + farout);
        xspeed = random(-slowspeed, -fastspeed);
        yspeed = random(-fastspeed, fastspeed);
    } else if (wallnum <= 3) {
        // bottom
        x = random(-farout, width + farout);
        y = random(height + out, height + farout);
        xspeed = random(-fastspeed, fastspeed);
        yspeed = random(-slowspeed, -fastspeed);
    } else if (wallnum <= 4) {
        // left
        x = random(-farout, -out);
        y = random(-farout, height + farout);
        xspeed = random(slowspeed, fastspeed);
        yspeed = random(-fastspeed, fastspeed);
    }

    var d = new Dot(x, y, xspeed, yspeed);
    dots.push(d);
}

function reset() {
    dots = [];
    score = 0;
    began = true;
    lost = false;
    paused = false;
    for (let i = 0; i < startdotcount; i++) {
        newDot();
    }
}

function mousePressed() {
    reset();
}

function keyPressed() {
    if (keyCode == 32) {
        paused = !paused;
    }
}