var posx;
var posy;
var backFill;
var xposs = [];
var yposs = [];
var step;
var level = {
    displaynum: 1,
    lvlnum: 0,
    time: 150
};
var times = [150, 110, 85, 70, 55, 40, 35, 30, 25, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
var score = 0;
//TODO: Dim each square slowly like every click

function setup() {
	createCanvas(window.innerWidth-20, window.innerHeight-20);
	backFill = createGraphics(width, height);
	backFill.clear();
	print(times[level.lvlnum]);
}

function draw() {
	// Background
    background(0); 
	image(backFill, 0, 0);
	
    if (level.lvlnum >= times.length) {
        keyPressed();
    }
    
    // Rectangle
	if (level.time == times[level.lvlnum]) {
		posx = random(-25, width-75);
		posy = random(-25, height-75);
        level.time = 0;
	}
	
    for (let step = 0; step < xposs.length; step++) {		
		backFill.noStroke();
		backFill.fill(57, 2, 153);
		backFill.rect(xposs[step], yposs[step], 100, 100);
	}
	
	// Moving Rectangle
	noStroke();
	fill(212, 84, 4);
    rect(posx, posy, 100, 100); 
	level.time++;
	
    if (score == 10) {
        score = 0
        level.displaynum++
        level.lvlnum++
		print(times[level.lvlnum]);
    }
    
    // Onscreen Text
    fill(255);
    
    textSize(45);
    text(score+"/10", 50, 80);
    
    textSize(55);
    text(level.displaynum, width-90, 80);
}

// On click
function mousePressed() {
	if ((mouseX >= posx) && (mouseX < (posx+100)) && (mouseY >= posy) && (mouseY < (posy+100))) {
		xposs.push(posx);
		yposs.push(posy);
		level.time = times[level.lvlnum];
        score++
	}
}

// On key press
function keyPressed() {
	xposs = [];
	yposs = [];
    level = {
        displaynum: 1,
        lvlnum: 0,
        time: 150
    };
    score = 0;
	backFill.clear();
}