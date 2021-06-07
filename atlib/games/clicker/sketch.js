// TODO

var clicks = 0;
var sampletime = 0;
var samplecount = 0;
var samplesave1 = 0;
var samplesave2 = 0;
var samplesave3 = 0;

function setup() {
    var cnv = createCanvas(window.innerWidth, window.innerHeight);
    var cnvx = (windowWidth - width) / 2;
    var cnvy = (windowHeight - height) / 2;
    cnv.position(cnvx, cnvy);

    pixelDensity(1)

    noStroke();
    frameRate(60);

    textAlign(CENTER, CENTER);
}

function draw() {
    background(47, 50, 58);

    fill(119, 86, 122);
    circle(width / 13, width / 13, width / 10);

    textSize(width / 10);
    fill(227, 158, 193);
    text(clicks, width / 2, height / 6)

    if (clicks >= 50) {
        rect(20, height - 120, width-40, 100);
    }

    sampletime += 1 / 60;
    if (sampletime >= 1) {
        sampletime = 0;
        samplesave3 = samplesave2;
        samplesave2 = samplesave1;
        samplesave1 = samplecount;
        samplecount = 0;
    }
    textSize(width / 19);
    fill(227, 158, 193);
    text(ceil((samplecount + samplesave1) / 2) + " clicks a second", width / 2, height / 15)
}




function mousePressed() {
    if ((sqrt(sq(mouseY - width / 13) + sq(mouseX - width / 13))) <= width / 20) {
        clicks++;
        samplecount++;
    }
}

function keyPressed() {

}


function reset() {

}

function completeSet() {
    setrest = true;
    time = 0;
}



function windowResized() {
    resizeCanvas(window.innerWidth, window.innerHeight);
}

