var outline = false;
var instructions = true;

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
		text("MOVE MOUSE to draw", width / 2, 1 * height / 5);
		text("CLICK to Invert", width / 2, 2 * height / 5);
		text("SPACE to toggle borders", width / 2, 3 * height / 5);
		text("ANY KEY to reset", width / 2, 4 * height / 5);
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
	ellipse(mouseX, mouseY, 80, 80);

	// Clear Screen
	if (keyIsPressed) {
		if (keyCode == 32) {
			outline = !outline;
		} else {
			clear();
			//background(random(0, 256), random(0, 256), random(0, 256));
			setbackground();
		}
		keyIsPressed = false;
	}
}

// Background chooser
function setbackground() {
	background(random(0, 256), random(0, 256), random(0, 256));
}