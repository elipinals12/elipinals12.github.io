var wid, num, blank;
var pos = [];
var winstring = "1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,0";
var fader = 255;
var timefader = 255;
var winfadeint = 5;
var posstring;
var time = 0;

function setup() {
    var cnv = createCanvas(1200, 800);
    var x = (windowWidth - width) / 2;
    var y = ((windowHeight - height) / 2);
    cnv.position(x, y);

    wid = floor(height / 4);
    for (var i = 1; i < 16; i++) {
        append(pos, i);
    }
    append(pos, 0);
    mixit();
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
            textSize(90);
            text(num, row * wid + .5 * wid, col * wid + .5 * wid);
        }
    }

    if (keyIsPressed) {
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
            mixit();
        }

        if (b >= 0 && b < 16) {
            swap(pos, blank, b);
        }

        keyIsPressed = false;
    }

    textSize(180);
    noStroke();
    if (posstring == winstring) {
        fill(255, 150, 0, fader);
        text("WINNER!", (width - 400) / 2, .55 * height / 4)
        fill(160, 255, 140, fader);
        text("WINNER!", (width - 400) / 2, 1.55 * height / 4)
        fill(80, 60, 255, fader);
        text("WINNER!", (width - 400) / 2, 2.55 * height / 4)
        fill(100, 160, 200, fader);
        text("WINNER!", (width - 400) / 2, 3.55 * height / 4)
        fader -= winfadeint;
        if (fader < 0) {
            winfadeint = -5;
        } else if (fader > 260) {
            winfadeint = 5;
        }
    } else {
        fader = 255;
    }
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
    textSize(70);
    fill(255);
    textAlign(CENTER, TOP);
    text("Instructions:", (width - 800) / 2 + 800, 215);
    textSize(40);
    text("The goals is to", (width - 800) / 2 + 800, 325);
    text("arrange the numbers", (width - 800) / 2 + 800, 375);
    text("in a consecutive order", (width - 800) / 2 + 800, 425);
    text("as fast as you can", (width - 800) / 2 + 800, 475);

    text("Arrows: Move Piece", (width - 800) / 2 + 800, 575);
    text("to Open Space", (width - 800) / 2 + 800, 625);

    text("Space Bar: Reset", (width - 800) / 2 + 800, 725);
}

function timer() {
    textSize(100);
    fill(0, 255, 0, timefader);
    textAlign(CENTER, TOP);
    noStroke();
    if (floor(time) < 10) {
        text("0:" + "0" + floor(time), (width - 800) / 2 + 800, 50);
    } else if (floor(time) < 60) {
        text("0:" + floor(time), (width - 800) / 2 + 800, 50);
    } else if (floor(time) % 60 < 10) {
        text(floor(time / 60) + ":" + "0" + floor(time) % 60, (width - 800) / 2 + 800, 50);
    } else {
        text(floor(time / 60) + ":" + floor(time) % 60, (width - 800) / 2 + 800, 50);
    }

    if (posstring != winstring) {
        time = time + (1 / 60);
    } else {
        timefader -= 10;
    }
    if (timefader < -70) {
        timefader = 255;
    }

}