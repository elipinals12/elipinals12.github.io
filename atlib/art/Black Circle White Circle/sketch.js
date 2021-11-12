var outline = false;
var instructions = true;
var diam = 80;

function setup() {
	createCanvas(window.innerWidth - 20, window.innerHeight - 20);
	//background(random(0, 256), random(0, 256), random(0, 256));
	setbackground();

	// Get rid of that circle in corner
	mouseX = -1000;
	mouseY = -1000;
}

function draw() {
	if (instructions) {
		textSize(width / 8);
		textAlign(CENTER, CENTER);
		text("Hold H for help", width / 2, height / 2);
		instructions = false;
	}
	// White vs Black circles
	if (mouseIsPressed) {
		fill(255);
		if (outline) {
			stroke(0);
		} else {
			noStroke();
		}

	} else {
		fill(0);
		if (outline) {
			stroke(255);
		} else {
			noStroke();
		}
	}

	// Actually make the circles
	ellipse(mouseX, mouseY, diam, diam);

	var diamchange = 2;
	// Clear Screen
	if (keyIsDown(DOWN_ARROW)) {
		diam -= diamchange;
	} else if (keyIsDown(UP_ARROW)) {
		diam += diamchange;
	}
	if (keyIsPressed) {
		if (keyCode == 32) {
			outline = !outline;
		} else if (keyCode == 82) {
			clear();
			//background(random(0, 256), random(0, 256), random(0, 256));
			setbackground();
		}
		keyIsPressed = false;
	}
	if (diam < 1) {
		diam = 1;
	}

	if (keyIsDown(72)) {
		textSize(width / 15);
		textAlign(CENTER, CENTER);
		fill(0);
		rectMode(CORNERS);
		rect(width / 15, height / 11, width - width / 15, 10 * height / 11);
		fill(255);
		text("H to get help", width / 2, 1 * height / 6);
		text("ARROWS to change size", width / 2, 2 * height / 6);
		text("CLICK to Invert", width / 2, 3 * height / 6);
		text("SPACE to toggle borders", width / 2, 4 * height / 6);
		text("R to reset", width / 2, 5 * height / 6);
	}
}

// Background chooser
function setbackground() {
	background(random(0, 256), random(0, 256), random(0, 256));
}

function windowResized() {
    resizeCanvas(window.innerWidth - 22, window.innerHeight - 22);
}
