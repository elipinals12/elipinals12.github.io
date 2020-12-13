var heads = 0;
var flipcount = 0;
let slider, currentflip, winration;
var go = false;
var currentflip2;
var redcornerY, bluecornerY;

var headx = 100;
var tailx = 290;



function setup() {
    slider = createSlider(.5, 60.5, 20);
    slider.position(10, 10);
    slider.style('width', '100px');

    var cnv = createCanvas(600, 600);
    var x = (windowWidth - width) / 2;
    var y = ((windowHeight - height) / 2);
    cnv.position(x, y);
}

function draw() {
    frameRate(slider.value());
    background(0);

    if (go) {
        // flip the coin
        currentflip = random(["Heads", "Tails"]);
        if (slider.value() > 45) {
            currentflip2 = random(["Heads", "Tails"]);
            // add up heads and total
            if (currentflip == "Heads") {
                heads++;
            }
            print("hu");
            flipcount += 2;
            if (currentflip2 == "Heads") {
                heads++;
            }
        } else {
            // add up heads and total
            if (currentflip == "Heads") {
                heads++;
            }
            flipcount++;
        }

        // make the coins
        textAlign(CENTER, CENTER)
        if (currentflip == "Heads") {
            fill(255, 0, 0);
            stroke(50);
            strokeWeight(5);
            circle(headx, 100, 160);

            fill(255);
            noStroke();
            textSize(50);
            text(currentflip, headx, 100)
        } else {
            fill(0, 0, 255);
            stroke(30);
            strokeWeight(5);
            circle(tailx, 100, 160);

            fill(255);
            noStroke();
            textSize(50);
            text(currentflip, tailx, 100)
        }

        // pink totals
        fill(255, 0, 255);
        strokeWeight(10);
        stroke(255, 0, 255);
        noStroke();
        text(heads, width / 2 - 120, 290);
        text(flipcount, width / 2 - 120, 350);

        // win percent
        fill(255, 0, 0);
        noStroke();
        textAlign(LEFT, CENTER);
        winratio = round(100 * heads / flipcount, 7);
        text(winratio + "%", 50, 500);

        // bar graph
        redcornerY = map((heads / flipcount), 0, 1, 500, 100);

        noStroke();
        rectMode(CORNERS);
        rect(400, 500, 485, redcornerY);

        bluecornerY = map((heads / flipcount), 0, 1, 100, 500);
        fill(0, 0, 255);
        rect(495, bluecornerY, 580, 500);

        stroke(255);
        strokeWeight(1);
        line(400, 300, 580, 300);
    } else {
        fill(255);
        textSize(40);
        textAlign(CENTER, CENTER);
        text("PRESS ANYWHERE TO GO", width / 2, height / 2);
    }
}

function mouseClicked() {
    if (mouseX > 0 && mouseX < width) {
        go = true;
    }
}