var outline = false;

function setup() {
	createCanvas(window.innerWidth - 20, window.innerHeight - 20);
	//background(random(0, 256), random(0, 256), random(0, 256));
	setbackground();

	// Get rid of that circle in corner
	mouseX = -1000
	mouseY = -1000
}

function draw() {
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