var miss = 0;
var posx;
var posy;
var points = 0;
var backFill;
var xposs = [];
var yposs = [];
var step;
var level = {
    displaynum: 1,
    lvlnum: 0,
    time: 85
};
var times = [85, 70, 65, 55, 45, 40, 35, 30, 25, 22, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
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
    
    points = (level.displaynum*100) + (score*10);

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
    textAlign(LEFT);
    textSize(55)
    text("Score: " + points, 50, 80)

    textSize(38)
    text("Level: " + level.displaynum, 50, 130);

    fill(255, 0, 0);
    textAlign(RIGHT);
    text("Misses: " + miss + "/10", width - 50, 75)

    // Game over
    if (miss >= 10) {
        background(0);
        image(backFill, 0, 0);
        for (let step = 0; step < xposs.length; step++) {		
            backFill.noStroke();
            backFill.fill(57, 2, 153);
            backFill.rect(xposs[step], yposs[step], 100, 100);
        }
        fill(255, 0, 0);
        textAlign(CENTER, CENTER);
        textStyle(BOLD);
        textSize(125);
        text("Game Over", width/2, (height/2));

        textStyle(NORMAL);
        fill(255);
        textSize(70);
        text("Score: " + points, width/2, (height/2) + 85)

        textSize(25);
        text("Press any key to reset", width/2, (height/2) + 140)
    }
}

// On click
function mousePressed() {
	if ((mouseX >= posx) && (mouseX < (posx+100)) && (mouseY >= posy) && (mouseY < (posy+100))) {
		xposs.push(posx);
		yposs.push(posy);
		level.time = times[level.lvlnum];
        score++
	} else {
        miss++;
        fill(255, 0, 0);
        rect(0, 0, width, height);
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
    miss = 0;
    points = 0;
	backFill.clear();
}