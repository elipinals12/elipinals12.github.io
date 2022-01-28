// TODO

var startminsize = 2;
var startmaxsize = 100;
var density = 6;
var playersize = 20;
var fastspeed = 4;
var slowspeed = 1;
var brokevalue = 2.5;

var farout = 400;
var out = 100;
var minsize = startminsize;
var maxsize = startmaxsize;
var prox, touching;
var paused = false;
var lost = false;
var lostsound, munchsound, maxsound;
var dotcount;
var frozedensity;
var densitydivider;
var dots = [];
var began = false;
var score = 0;
var blinker = 0;
var cheat = false;
var colorcheat = false;


function setup() {
    var cnv = createCanvas(windowWidth, windowHeight);
    var cnvx = (windowWidth - width) / 2;
    var cnvy = (windowHeight - height) / 2;
    cnv.position(cnvx, cnvy);

    noStroke();
    //frameRate(1);

    lostsound = loadSound("lost.mp3");
    munchsound = loadSound("munch.mp3");
    maxsound = loadSound("max.mp3");
    
    maxsound.setVolume(.4);
    munchsound.setVolume(.5);
    lostsound.setVolume(.3);

    densitydivider = map(density, 1, 10, 120, 5);
    print(width);
    dotcount = floor(width / densitydivider);
    print(dotcount);
    for (let i = 0; i < dotcount; i++) {
        newDot();
    }
}

function draw() {
    background(8, 0, 28);
    densitydivider = map(density, 1, 10, 100, 8);
    dotcount = floor(width / densitydivider);

    minsize = startminsize + score;
    maxsize = startmaxsize + score;

    if (began) {
        if (lost) {
            maxsound.stop();
            for (let i = 0; i < dots.length; i++) {
                dots[i].show();
                dots[i].move();
            }
            fill(255, 0, 0);
            textSize(180);
            textAlign(CENTER, CENTER);
            text("GAME OVER", width / 2, (height / 2) - 100);
            textSize(40);
            text("Density: " + frozedensity, width / 2, (height / 2) + 190);
            fill(255);
            textSize(150);
            text("Score: " + score, width / 2, (height / 2) + 100);
            textSize(50);
            text("Click to Restart", width / 2, (height / 2));
            fill(255, 0, 0);
            textSize(50);
            textAlign(RIGHT, CENTER);
            text(density, width - 15, height - 35);
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

                fill(255, 0, 0);
                textSize(50);
                textAlign(RIGHT, CENTER);
                text(density, width - 15, height - 35);
            } else {
                for (let i = 0; i < dots.length; i++) {
                    prox = dist(mouseX, mouseY, dots[i].x, dots[i].y);
                    touching = (dots[i].size / 2) + ((score + playersize) / 2);
                    if (prox <= touching) {
                        if ((dots[i].size > score + playersize) && !cheat) {
                            lostsound.play();
                            lost = true;
                        } else if (dots[i].size < score + playersize) {
                            score++;
                            munchsound.play();
                            dots.splice(i, 1);
                            newDot();
                        } else if (dots[i].size == score + playersize) {
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

                fill(255, 0, 0);
                textSize(50);
                textAlign(RIGHT, CENTER);
                text(density, width - 15, height - 35);
            }
        }

    } else {
        fill(255);
        textSize(100);
        textAlign(CENTER, CENTER);
        text("Eat smaller dots to grow", width / 2, (height / 2) - 150);
        text("Click to start", width / 2, (height / 2) + 145);
        //textSize(150);
        text("Space to pause", width / 2, (height / 2));
        fill(255);
        circle(mouseX, mouseY, score + playersize);

        fill(255, 0, 0);
        textSize(50);
        textAlign(RIGHT, CENTER);
        text("Up and Down arrows to change difficulty: " + density, width - 15, height - 35);
    }
    if (minsize / height > brokevalue) {
        lost = true;
        if (blinker < 10) {
            stroke(1);
            strokeWeight(2);
            fill(255, 255, 0);
            textSize(200);
            textAlign(CENTER, CENTER);
            text("You broke it!", (width / 2), (height / 2))
            noStroke();
            blinker++;
        } else if (blinker < 20) {
            blinker++;
        } else if (blinker >= 20) {
            blinker = 0;
        }
    }

    if (cheat) {
        fill(31, 102, 255);
        textSize(50);
        textAlign(RIGHT, TOP);
        text("Immortal Mode", width - 35, 30);
    }
    if (colorcheat) {
        fill(69, 230, 74);
        textSize(50);
        textAlign(RIGHT, TOP);
        text("Christmas Mode", width - 35, 80);
    }
}

class Dot {
    constructor(x, y, xspeed, yspeed) {
        this.x = x;
        this.y = y;
        this.size = random(minsize, maxsize);
        if (!colorcheat) {
            this.r = random(30, 255);
            this.g = random(30, 255);
            this.b = random(30, 255);
        }
        this.xspeed = xspeed;
        this.yspeed = yspeed;
    }
    move() {
        this.x += this.xspeed;
        this.y += this.yspeed;
    }
    show() {
        if (colorcheat) {
            if (this.size > score + playersize) {
                this.r = 255;
                this.g = 0;
                this.b = 0;
            } else {
                this.r = 0;
                this.g = 255;
                this.b = 0;
            }
        }

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
    frozedensity = density;
    for (let i = 0; i < dotcount; i++) {
        newDot();
    }
    maxsound.loop();
}

function mousePressed() {
    if (lost || !began) {
        reset();
    }
}

function keyPressed() {
    if (keyCode == 32 && !lost) {
        paused = !paused;
    } else if (keyCode == 32) {
        reset();
    }
    if (!began || lost) {
        if (keyCode == 38 && density < 10) {
            density++;
        } else if (keyCode == 40 && density > 1) {
            density--;
        }
    }

    if (keyIsDown(17) && keyIsDown(67)) {
        cheat = !cheat;
        print(cheat);
    }
    if (keyIsDown(17) && keyIsDown(86)) {
        colorcheat = !colorcheat;
        print(colorcheat);
    }
}

function windowResized() {
    setup();
}