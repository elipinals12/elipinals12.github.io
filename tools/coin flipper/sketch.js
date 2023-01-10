var heads = 0;
var flipcount = 0;
let slider, currentflip, winration, linewidth;
var go = false;
var redcornerY, bluecornerY;

var headx = 165;
var tailx = 165;

var simcount = 1;

var cnv,x,y;


function setup() {
    slider = createSlider(0.5, 60.5, 10);
    slider.position(10, 10);
    slider.style('width', '200px');

    cnv = createCanvas(600, 600);
    x = (windowWidth - width) / 2;
    y = ((windowHeight - height) / 2);
    cnv.position(x, y);
}

function draw() {
    frameRate(slider.value());
    background(0);

    if (go) {
        // map simcount to slider, keep it int
        simcount = int(map(slider.value(), 0.5, 60.5, 1, 100));
        fill(255, 255, 0);
        textSize(15);
        textAlign(RIGHT, TOP);
        noStroke();
        let frameval = floor(slider.value());
        if (frameval == 0) frameval = slider.value();

        text("Flipping " + simcount + " Coins per Frame", width - 25, 25);
        text("Showing " + frameval + " Frames per Second", width - 25, 50);

        // flip the coin SIMCOUNT TIMES
        for (let i = 0; i < simcount; i++) {
            currentflip = random(["Heads", "Tails"]);
            if (currentflip == "Heads") {
                // add to heads total
                heads++;
            }
            // add to flips total
            flipcount++
        }

        // make the coins
        textAlign(CENTER, CENTER)
        if (currentflip == "Heads") {
            fill(255, 0, 0);
            stroke(50);
            strokeWeight(5);
            circle(headx, 120, 160);

            fill(255);
            noStroke();
            textSize(50);
            text(currentflip, headx, 120)
        } else {
            fill(0, 0, 255);
            stroke(30);
            strokeWeight(5);
            circle(tailx, 120, 160);

            fill(255);
            noStroke();
            textSize(50);
            text(currentflip, tailx, 120)
        }

        // pink/red totals
        fill(255, 0, 0);
        noStroke();
        text(heads, width / 2 - 120, 290);
        fill(255, 0, 255);
        text(flipcount, width / 2 - 120, 350);

        // little fraction line
        stroke(255, 0, 255);
        strokeWeight(3);
        if (flipcount < 10) {
            linewidth = 24;
        } else if (flipcount < 100) {
            linewidth = 44;
        } else if (flipcount < 1000) {
            linewidth = 60;
        } else if (flipcount < 10000) {
            linewidth = 72;
        } else if (flipcount < 100000) {
            linewidth = 84;
        } else if (flipcount < 1000000) {
            linewidth = 94;
        } else if (flipcount < 10000000) {
            linewidth = 106;
        } else if (flipcount < 100000000) {
            linewidth = 122;
        } else { linewidth = width * 3 }

        line(180 - linewidth, 318, 180 + linewidth, 318)

        // win percent
        fill(255, 0, 0);
        noStroke();
        textAlign(LEFT, BOTTOM);
        winratio = round(100 * heads / flipcount, 7);
        text(winratio + "%", 50, 560);

        // bar graph
        redcornerY = map((heads / flipcount), 0, 1, 550, 50);

        stroke(255);
        strokeWeight(1);
        line(390, 300, 590, 300);
        textSize(14);
        fill(255);
        textAlign(LEFT, CENTER);
        text("50%", 360, 300);

        noStroke();
        fill(255, 0, 0);
        rectMode(CORNERS);
        rect(400, 550, 485, redcornerY);

        bluecornerY = map((heads / flipcount), 0, 1, 50, 550);
        fill(0, 0, 255);
        rect(495, bluecornerY, 580, 550);
    } else {
        fill(255);
        textSize(40);
        textAlign(CENTER, CENTER);
        text("PRESS ANYWHERE TO GO", width / 2, height / 2 + 30);
        textSize(28);
        text("Use the slider in the top left to adjust speed", width / 2, height / 2 - 30);
    }
}

function mouseClicked() {
    if (mouseX > 0 && mouseX < width) {
        go = true;
    }
}

function windowResized() {
    cnv = createCanvas(600, 600);
    x = (windowWidth - width) / 2;
    y = ((windowHeight - height) / 2);
    cnv.position(x, y);
}