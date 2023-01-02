// ATLIB EATDOTS
// a beautiful (from the user side) app
// with pretty messy insides

// todo fix input box disappearing sometimes

var startminsize = 2;
var startmaxsize = 100;
var density = 6;
var playersize = 20;
var fastspeed = 4;
var slowspeed = 1;
var brokevalue = 2.5;

var liveresultstimer = 0;

var farout = 400;
var out = 100;
var minsize = startminsize;
var maxsize = startmaxsize;
var prox, touching;
var paused = false;
var lost = false;
var lostsound, munchsound, maxsound;
var mute = false;
var dotcount;
var frozedensity;
var densitydivider;
var dots = [];
var began = false;
var score = 0;
var blinker = 0;
var cheat = false;
var colorcheat = false;

let theyCheated;
let scores;
let names;
let levels;
let takingInput = false;
let input, button;
var lead = true;
var playername = "anonymous";
var pad = 20;
var widthExtraPad = 100;
let showLeads = false;



function preload() {
    preloadIsRunning = true;
    rankData = [];
    const apiKey = "AIzaSyDiEtTNaLP4xCi30j1xYQS5bNYBwlXwJbA";
    const spreadSheetId = "1SnjG8pGZHTnr_9wv0wJ9IR71MAfAwbNzm7ywd5CO6aM";
    fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadSheetId}/values/eatdots!a2:c?key=${apiKey}`,
        {
            method: "GET",
        }
    )
        .then((r) => r.json())
        .then((data) => {
            rankData = data.values.map((item) => item);
        });
    preloadIsRunning = false;
}

function setup() {
    var cnv = createCanvas(windowWidth, windowHeight - 2);
    var cnvx = (windowWidth - width) / 2;
    var cnvy = (windowHeight - height) / 2;
    cnv.position(cnvx, cnvy);

    noStroke();
    //frameRate(1);

    lostsound = loadSound("lost.mp3");
    munchsound = loadSound("munch.mp3");
    maxsound = loadSound("max.mp3");

    maxsound.setVolume(.4);
    munchsound.setVolume(.4);
    lostsound.setVolume(.3);

    densitydivider = map(density, 1, 10, 120, 5);
    print(width);
    dotcount = floor(width / densitydivider);
    print(dotcount);
    for (let i = 0; i < dotcount; i++) {
        newDot();
    }

    input = createInput();
    input.size(100);
    input.center();
    input.position(input.x - 10, height / 2);
    button = createButton('submit');
    button.position(input.x + input.width, height / 2);
    input.hide();
    button.hide();

    noCursor();
}

function draw() {
    
    if (liveresultstimer > 180) {
        loadLeads();
        liveresultstimer = 0;
    }
    liveresultstimer++;
    // nice, now leads need to not flash
    // needs to store and display stored num
    // update num dont preload each time


    background(8, 0, 28);
    densitydivider = map(density, 1, 10, 100, 8);
    dotcount = floor(width / densitydivider);

    minsize = startminsize + score;
    maxsize = startmaxsize + score;

    // show the leaderboard with tab key
    // if (keyIsDown(9)) {
    //     showLeaderboard();
    // }

    if (began) {
        if (lost) {
            maxsound.stop();

            fill(255, 0, 0);
            textSize(180);
            textAlign(CENTER, CENTER);
            text("GAME OVER", width / 2, (height / 2) - 100);

            for (let i = 0; i < dots.length; i++) {
                dots[i].show();
                dots[i].move();
            }

            fill(245, 173, 5);
            textSize(40);
            text("Level: " + frozedensity, width / 2, (height / 2) + 190);
            fill(255);
            textSize(150);
            text("Score: " + score, width / 2, (height / 2) + 100);
            textSize(50);
            text("Space to Restart", width / 2, (height / 2));
            fill(245, 173, 5);
            textSize(50);
            textAlign(RIGHT, CENTER);
            text("Change level with up/down arrows: " + density, width - 15, height - 35);

            // ask for name
            if (lead) takeName();
        } else {
            if (paused) {
                for (let i = 0; i < dots.length; i++) {
                    dots[i].show();
                }
                fill(255);
                textSize(100);
                textAlign(CENTER, CENTER);
                text("Click To Resume", width / 2, height / 2);
                fill(255);
                textSize(100);
                textAlign(LEFT, TOP);
                text(score, 35, 35);

                fill(245, 173, 5);
                textSize(50);
                textAlign(RIGHT, CENTER);
                text("Level: " + density, width - 15, height - 35);
            } else {
                for (let i = 0; i < dots.length; i++) {
                    prox = dist(mouseX, mouseY, dots[i].x, dots[i].y);
                    touching = (dots[i].size / 2) + ((score + playersize) / 2);
                    if (prox <= touching) {
                        if ((dots[i].size > score + playersize) && !cheat) {
                            //lostsound.play();
                            lost = true;
                        } else if (dots[i].size < score + playersize) {
                            score++;
                            //munchsound.play();
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

                fill(245, 173, 5);
                textSize(50);
                textAlign(RIGHT, CENTER);
                text(density, width - 15, height - 35);
            }
        }

    } else {
        fill(255);
        textSize(100);
        textAlign(CENTER, CENTER);
        text("Eat to grow", width / 2, (height / 2) - 150);
        text("Space to start", width / 2, (height / 2) + 145);
        //textSize(150);
        text("Click to pause", width / 2, (height / 2));
        fill(255);
        circle(mouseX, mouseY, score + playersize);

        fill(245, 173, 5);
        textSize(50);
        textAlign(RIGHT, CENTER);
        text("Up and Down arrows change level: " + density, width - 15, height - 35);
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
        theyCheated = true;
    }
    if (colorcheat) {
        fill(69, 230, 74);
        textSize(50);
        textAlign(RIGHT, TOP);
        text("Christmas Mode", width - 35, 80);
        theyCheated = true;
    }

    if (showLeads) { showLeaderboard(); }

    if (lost) {
        // fill(0);
        // stroke(255);
        // strokeWeight(1);
        // triangle(mouseX, mouseY, mouseX - 5, mouseY + 10, mouseX + 5, mouseY + 10);
        // noStroke();
        cursor(ARROW);
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
    input.hide();
    button.hide();

    noCursor();
    lead = true;
    theyCheated = false;
    showLeads = false;
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
    if (!lost) {
        paused = !paused;
    }
}

function keyPressed() {
    if (takingInput) {
        if (keyCode == ENTER) {
            myInputEvent();
        } else if (keyCode == 32) {
            myInputEvent();
            reset();
        }
    } else {
        if (keyCode == 76) {
            loadLeads();
            showLeads = !showLeads;
        } else if (keyCode == 77) {
            toggleMute();
        }

        if (!began || lost) {
            if (keyCode == 38 && density < 10) {
                density++;
            } else if (keyCode == 40 && density > 1) {
                density--;
            } else if (keyCode == 32) {
                reset();
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
}


function windowResized() {
    var cnv = createCanvas(windowWidth, windowHeight - 2);
    var cnvx = (windowWidth - width) / 2;
    var cnvy = (windowHeight - height) / 2;
    cnv.position(cnvx, cnvy);
}


//API append and board STUFF
function showLeaderboard() {
    sortLeads();
    fill(0, 0, 255, 160);
    if (preloadIsRunning) { fill(255); }
    noStroke();
    rectMode(CORNERS);
    let leadsLeftX = pad + widthExtraPad;
    rect(leadsLeftX, pad, width - pad - widthExtraPad, height - pad);

    fill(255, 0, 0);
    noStroke();
    textSize(15);
    textAlign(RIGHT, TOP)
    text("live results", width - pad - widthExtraPad - 5, pad + 5);

    stroke(0);
    strokeWeight(3);
    fill(255);
    textSize(width / 23);
    strokeWeight(1);

    hadjust = 12;
    let innerRectWid = (width - pad - widthExtraPad) - (20 + leadsLeftX);
    let nameX = leadsLeftX + innerRectWid / 4.2;
    let timeX = nameX * 2;
    let levelX = nameX * 3

    //col titles
    textAlign(CENTER, CENTER);
    text("name", nameX, 3 * pad);
    text("score", timeX, 3 * pad);
    text("level", levelX, 3 * pad);


    for (let i = 0; i < 10; i++) {
        // numbers
        textAlign(LEFT, CENTER);
        text(i + 1 + ".", 10 + leadsLeftX, rowHeight(i));
    }

    // names
    textAlign(CENTER, CENTER);
    names.forEach((s, i) => {
        text(s, nameX, rowHeight(i));
    });

    // scores
    scores.forEach((s, i) => {
        text(s, timeX, rowHeight(i));
    });

    // times
    levels.forEach((s, i) => {
        text(s, levelX, rowHeight(i));
    });

    rectMode(CORNER);
    noStroke();
}

function rowHeight(i) {
    return 4 * pad + ((height - 4 * pad) / 11) * (i + 1);
}

function boardAppend() {
    print(playername, score, density);
    const id = "eatdotsin";
    var url =
        "https://script.google.com/macros/s/AKfycbz9qCkxXs1JQz-hy2mFBxBmsMyNQDzGC8ufKpFSxB93NBaBTTs-uX26HCb0nQKGORNa/exec" +
        "?" +
        id +
        "&" +
        playername +
        "&" +
        score +
        "&" +
        density;
    httpDo(url);
}

function sortLeads() {
    scores = [];
    names = [];
    levels = [];
    for (var row = 0; row < rankData.length; row++) {
        for (var col = 0; col < rankData[0].length; col++) {
            if (col == 1) {
                const tempscore = rankData[row][col];
                append(scores, tempscore);
            } else if (col == 0) {
                const tempname = rankData[row][col];
                append(names, tempname);
            } else {
                const templevel = rankData[row][col];
                append(levels, templevel);
            }
        }
    }
}

function myInputEvent() {
    playername = input.value();
    if (playername.length > 20) {
        // bad long playername bad, so far no problem
    } else if (playername == "") {
        playername = "anonymous";
    }

    if (!theyCheated) { boardAppend(); }

    input.hide();
    button.hide();
    // }
    //if (a instanceof String && !(a.equals(""))) {
    //    playername = a;
    //}

    takingInput = false;
    lead = false;
}

function takeName() {
    takingInput = true;

    fill(255, 255, 255, 240);
    rectMode(CORNERS);
    rect(5 * width / 12, 5 * height / 12, 7.21 * width / 12, 6.5 * height / 12);

    textAlign(CENTER, CENTER);
    textSize(30);
    noStroke();
    fill(0);
    text("name?", width / 2, height / 2 - 25);

    input.show();
    button.show();

    // TODO may need an option for not asking for a name every time
    // must have record time button

    // mouse press or enter -> myInputEvent()
    button.mousePressed(myInputEvent);

    rectMode(CORNER);
}

function toggleMute() {
    // todo if you want, fader m toggle situation
    mute = !mute;

    if (mute) {
        maxsound.setVolume(0);
        // munchsound.setVolume(0);
        // lostsound.setVolume(0);
    } else {
        maxsound.setVolume(.4);
        munchsound.setVolume(.4);
        lostsound.setVolume(.3);
    }
}

// this exists for a very important reason
function loadLeads() {
    preload();
}