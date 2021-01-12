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
		textSize(width / 15);
		textAlign(CENTER, CENTER);
		text("ARROWS to change size", width / 2, 1 * height / 5);
		text("CLICK to Invert", width / 2, 2 * height / 5);
		text("SPACE to toggle borders", width / 2, 3 * height / 5);
		text("R KEY to reset", width / 2, 4 * height / 5);
		instructions = false;
	}

	// White vs Black circles
	if (mouseIsPressed) {
		fill(0);
		if (outline) {
			stroke(255);
		} else {
			noStroke();
		}

	} else {
		fill(255);
		if (outline) {
			stroke(0);
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
}

// Background chooser
function setbackground() {
	background(random(0, 256), random(0, 256), random(0, 256));
}