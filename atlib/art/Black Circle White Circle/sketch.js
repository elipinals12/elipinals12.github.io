function setup() {
	createCanvas(window.innerWidth-20, window.innerHeight-20);
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
		stroke(255);
	} else {
		fill(255);
		stroke(0);
	}
	
	// Actually make the circles
	ellipse(mouseX, mouseY, 80, 80);
	
	// Clear Screen
	if (keyIsPressed) {
		clear();
		//background(random(0, 256), random(0, 256), random(0, 256));
		setbackground();
		keyIsPressed = false;
	}
}

// Background chooser
function setbackground() {
	background(random(0, 256), random(0, 256), random(0, 256));
}