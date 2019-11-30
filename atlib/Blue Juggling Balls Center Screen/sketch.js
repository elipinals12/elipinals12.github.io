var col = 0;
var col1 = 0;
var col2 = 0;
var a1 = 0;
var a2 = 0;
var a3 = 0;
var a4 = 0;
var grower = 0;

//var w = displayWidth-20;
//var h = displayHeight-160;

function setup() {
	createCanvas(window.innerWidth-20, window.innerHeight-20);
}

function draw() {
	// Background
	col = map(mouseX, 0, width, 0, 255);
	background(col);
	
	// Path
	pathcol = map(col, 0, 255, 255, 0)
	fill(col);
	stroke(pathcol);
	ellipse(width/2, height/2, width-100, height-100);
	
	
	// Moving Ellipses
	noStroke();
	fill(0, 0, 255, a1);
	ellipse(mouseX, height/2, 64, 64);
	
	fill(0, 0, 255, a2);
	ellipse(width/2, mouseY, 64, 64);
	
	reversemousex = map(mouseX, 0, width, width, 0);
	fill(0, 0, 255, a3);
	ellipse(reversemousex, height/2, 64, 64);
	
	reveresmousey = map(mouseY, 0, height, height, 0);
	fill(0, 0, 255, a4);
	ellipse(width/2, reveresmousey, 64, 64);
	
	
	// Making the moving ellipses appear
	if ((mouseIsPressed) && (a3 === 255)) {
		a4 = 255;
	}
	if ((mouseIsPressed) && (a2 === 255)) {
		a3 = 255;
	}
	if ((mouseIsPressed) && (a1 === 255)) {
		a2 = 255;
	}
	if (mouseIsPressed) {
		a1 = 255;
		mouseIsPressed = false;
	}
	
	// Growing Center
	if ((mouseX == floor(width/2)) && (mouseY == floor(height/2))) {
		fill(0, 0, 255);
		noStroke();
		circle(floor(width/2), floor(height/2), grower)
		grower = grower + 1;
	} else {
		grower = 0;
	}
	
	// Optional Aiming Cross
	stroke(255, 0, 0);
	line((width/2)+10, height/2, (width/2)-10, height/2);
	line((width/2), height/2+10, (width/2), height/2-10);
	
	// Reset Switch
	if (keyIsPressed) {
		col1 = 0;
		col2 = 0;
		a1 = 0;
		a2 = 0;
		a3 = 0;
		a4 = 0;
		grower = 0;
	}
}