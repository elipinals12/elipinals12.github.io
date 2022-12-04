var wid, num, blank;
var pos = [];
var winstring = "1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,0";
var fader = 255;
var timefader = 255;
var winfadeint = 5;
var posstring;
var time = 0;
var moveTimer = true;
var lead = true;
var playername = "anonymous";
let rankData;
let scores;
let names;
let takingInput = false;
let input, button;
let showLeads = false;
let preloadIsRunning = false;
let hadjust;

var pad = 20;
var widthExtraPad = 100;


//----\/\/\/\/---A VERY COMPLICATED SLIDE PUZZLE---\/\/\/\/----

function preload() {
    preloadIsRunning = true;
    rankData = [];
    const apiKey = "AIzaSyDiEtTNaLP4xCi30j1xYQS5bNYBwlXwJbA";
    const spreadSheetId = "1SnjG8pGZHTnr_9wv0wJ9IR71MAfAwbNzm7ywd5CO6aM";
    fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadSheetId}/values/numberpuzzle!a2:b?key=${apiKey}`,
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
    var cnv = createCanvas((window.innerHeight - 22) / 8 * 12, window.innerHeight - 22);
    var x = (windowWidth - width) / 2;
    var y = ((windowHeight - height) / 2);
    cnv.position(x, y);

    wid = floor(height / 4);
    for (var i = 1; i < 16; i++) {
        append(pos, i);
    }

    textFont('Helvetica');

    append(pos, 0);

    mixit();

    input = createInput();
    input.size(100);
    input.center();
    input.position(input.x-10, height / 2);
    button = createButton('submit');
    button.position(input.x + input.width, height / 2);
    input.hide();
    button.hide();
}

function draw() {
    background(0);
    noStroke();
    instructions()
    timer();
    textAlign(CENTER, CENTER);

    posstring = pos.toString();

    for (var row = 0; row < 4; row++) {
        for (var col = 0; col < 4; col++) {
            num = pos[row + col * 4];
            if (num == 0) {
                fill(0);
            } else if (num % 2 != 0) {
                fill(255);
            } else if (num % 2 == 0) {
                fill(255, 0, 0);
            }

            rect(row * wid, col * wid, wid - 6, wid - 10);

            if (num == 0) {
                fill(0, 100);
            } else if (num % 2 != 0) {
                fill(255, 80);
            } else if (num % 2 == 0) {
                fill(255, 0, 0, 80);
            }
            rect(row * wid, col * wid, wid - 1, wid - 1);

            if (num == 0) {
                fill(0);
            } else if (num % 2 != 0) {
                fill(255, 0, 0);
            } else if (num % 2 == 0) {
                fill(255);
            }

            noStroke();
            textSize(height / 6);
            text(num, row * wid + .5 * wid, col * wid + .5 * wid);
        }
    }

    textSize(height / 4.4);
    textAlign(LEFT);
    noStroke();
    if (posstring == winstring) {
        fill(255, 150, 0, fader);
        text("WINNER!", 0, .55 * height / 4);
        fill(160, 255, 140, fader);
        text("WINNER!", 0, 1.55 * height / 4);
        fill(80, 60, 255, fader);
        text("WINNER!", 0, 2.55 * height / 4);
        fill(100, 160, 200, fader);
        text("WINNER!", 0, 3.55 * height / 4);
        fader -= winfadeint;
        if (fader < 0) {
            winfadeint = -5;
        } else if (fader > 260) {
            winfadeint = 5;
        }

        // ask for name
        if (lead) {
            takeName();
        } else {
            //they cheated

            // legit works lol
            //window.close();

            fill(255, 0, 0);
            textAlign(CENTER, CENTER);
            stroke(0);
            strokeWeight(2);
            textSize(11);
            text("so you think you can get away with cheating", width / 2, height / 2 - 15);
            text("virus installing......", width / 2, height / 2);
            text("installed", width / 2, height / 2 + 15);
        }
    } else {
        fader = 255;
        timefader = 255;
    }

    if (keyIsPressed && !takingInput) {
        blank = pos.indexOf(0);
        var b;

        if (keyCode == UP_ARROW) {
            b = blank + 4;
        } else if (keyCode == DOWN_ARROW) {
            b = blank - 4;
        } else if (keyCode == LEFT_ARROW && blank % 4 != 3) {
            b = blank + 1;
        } else if (keyCode == RIGHT_ARROW && blank % 4 != 0) {
            b = blank - 1;
        } else if (keyCode == 32) {
            time = 0;
            timefader = 255;
            lead = true;
            mixit();
        } else if (keyCode == 76) {
            preload();
            showLeads = !showLeads;
        }

        if (b >= 0 && b < 16) {
            swap(pos, blank, b);
        }

        keyIsPressed = false;
    }
    if (showLeads) { showLeaderboard(); }
}

function takeName() {
    takingInput = true;

    fill(255,255,255, 240);
    rectMode(CORNERS);
    rect(5*width / 12, 5*height / 12, 7 * width / 12, 6.5 * height / 12);

    textAlign(CENTER,CENTER);
    textSize(30);
    noStroke();
    fill(0);
    text("name?", width/2, height/2-25);

    input.show();
    button.show();

    // TODO may need an option for not asking for a name every time
    // must have record time button

    // mouse press or enter -> myInputEvent()
    button.mousePressed(myInputEvent);
    
    rectMode(CORNER);
}

function swap(arr, a, b) {
    [arr[a], arr[b]] = [arr[b], arr[a]];
}

function mixit() {
    var b;
    var rand;
    for (var i = 0; i < 9999; i++) {
        blank = pos.indexOf(0);
        rand = floor(random(4));
        if (rand == 0) {
            b = blank + 4;
        } else if (rand == 1) {
            b = blank - 4;
        } else if (rand == 2 && blank % 4 != 3) {
            b = blank + 1;
        } else if (rand == 3 && blank % 4 != 0) {
            b = blank - 1;
        }

        if (b >= 0 && b < 16) {
            swap(pos, blank, b);
        }
    }
}

function instructions() {
    textSize(height / 15.616);
    fill(255);
    textAlign(CENTER, TOP);
    text("Instructions:", width - (width - 4 * wid) / 2, height / 4);
    textSize(height / 23.425);
    text("The goals is to", width - (width - 4 * wid) / 2, 1.8 * height / 5);
    text("arrange the", width - (width - 4 * wid) / 2, 1.8 * height / 5 + 50);
    text("numbers in order", width - (width - 4 * wid) / 2, 1.8 * height / 5 + 100);
    text("as fast as you can", width - (width - 4 * wid) / 2, 1.8 * height / 5 + 150);

    text("Arrows:", width - (width - 4 * wid) / 2, 3.2 * height / 5);
    text("Move Piece", width - (width - 4 * wid) / 2, 3.2 * height / 5 + 50);

    text("Space Bar: Reset", width - (width - 4 * wid) / 2, 4 * height / 5);
}

function timer() {
    textSize(height / 6);
    fill(0, 255, 0, timefader);
    textAlign(CENTER, TOP);
    noStroke();
    if (floor(time) < 10) {
        text("0:" + "0" + floor(time), width - (width - 4 * wid) / 2, 50);
    } else if (floor(time) < 60) {
        text("0:" + floor(time), width - (width - 4 * wid) / 2, 50);
    } else if (floor(time) % 60 < 10) {
        text(floor(time / 60) + ":" + "0" + floor(time) % 60, width - (width - 4 * wid) / 2, 50);
    } else {
        text(floor(time / 60) + ":" + floor(time) % 60, width - (width - 4 * wid) / 2, 50);
    }

    if (posstring != winstring) {
        if (moveTimer) time = time + (1 / 60);
    } else {
        timefader -= 10;
    }
    if (timefader < -70) {
        timefader = 255;
    }
}

function keyPressed() {
    if (keyIsDown(17) && keyIsDown(67) && !takingInput) {
        print("cheater! no lead");
        moveTimer = !moveTimer;
        //pos = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 0, 15];
        lead = false;
    } else if (keyCode == ENTER && takingInput) {
        myInputEvent();
    }
}

function showLeaderboard() {
    sortLeads();
    fill(0, 0, 255, 160);
    if (preloadIsRunning) { fill(255); }
    noStroke();
    rectMode(CORNERS);
    let leadsLeftX = pad + widthExtraPad;
    rect(leadsLeftX, pad, width - pad - widthExtraPad, height - pad);

    stroke(0);
    strokeWeight(3);
    fill(255);
    textSize(width / 23);

    hadjust = 12;
    let innerRectWid = (width - pad - widthExtraPad) - (20 + leadsLeftX);
    let nameX = leadsLeftX + innerRectWid / 3;
    let timeX = nameX * 2;

    //col titles
    textAlign(CENTER, CENTER);
    text("name", nameX, 3 * pad);
    text("time", timeX, 3 * pad);

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

    // times
    scores.forEach((s, i) => {
        text(s, timeX, rowHeight(i));
    });

    rectMode(CORNER);
}

function rowHeight(i) {
    return 4 * pad + ((height - 4 * pad) / 11) * (i + 1);
}

//API append STUFF

function boardAppend() {
    print(playername, time);
    var url =
        "https://script.google.com/macros/s/AKfycbz9qCkxXs1JQz-hy2mFBxBmsMyNQDzGC8ufKpFSxB93NBaBTTs-uX26HCb0nQKGORNa/exec" +
        "?" +
        playername +
        "&" +
        time;
    httpDo(url);
}

function sortLeads() {
    scores = [];
    names = [];
    for (var row = 0; row < rankData.length; row++) {
        for (var col = 0; col < rankData[0].length; col++) {
            if (col % 2 != 0) {
                const tempscore = rankData[row][col];
                append(scores, tempscore);
            } else {
                const tempname = rankData[row][col];
                append(names, tempname);
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

    boardAppend();

    input.hide();
    button.hide();
    // }
    //if (a instanceof String && !(a.equals(""))) {
    //    playername = a;
    //}


    //dont want to enter same time twice
    lead = false;
    takingInput = false;
}

function windowResized() {
    //setup();
}