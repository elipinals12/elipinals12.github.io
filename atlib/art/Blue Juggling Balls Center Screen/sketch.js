var col = 0;
var col1 = 0;
var col2 = 0;
var a1 = 0;
var a2 = 0;
var a3 = 0;
var a4 = 0;
var grower = 0;
var hyp = 10;


//var w = displayWidth-20;
//var h = displayHeight-160;

function setup() {
	createCanvas(displayWidth-20, displayHeight-165);
	hyp = (sq(displayHeight-165))+(sq(displayWidth-20));
}

function draw() {
	// Background
	col = map(mouseX, 0, displayWidth-20, 0, 255);
	background(col);
	
	// Path
	pathcol = map(col, 0, 255, 255, 0)
	fill(col);
	stroke(pathcol);
	ellipse((displayWidth-20)/2, (displayHeight-165)/2, displayWidth-20-100, displayHeight-165-100);
	
	
	// Moving Ellipses
	noStroke();
	fill(0, 0, 255, a1);
	ellipse(mouseX, (displayHeight-165)/2, 64, 64);
	
	fill(0, 0, 255, a2);
	ellipse((displayWidth-20)/2, mouseY, 64, 64);
	
	reversemousex = map(mouseX, 0, (displayWidth-20), (displayWidth-20), 0);
	fill(0, 0, 255, a3);
	ellipse(reversemousex, (displayHeight-165)/2, 64, 64);
	
	reveresmousey = map(mouseY, 0, (displayHeight-165), (displayHeight-165), 0);
	fill(0, 0, 255, a4);
	ellipse((displayWidth-20)/2, reveresmousey, 64, 64);
	
	
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
		fill(100, 0, 255);
	if ((mouseX === (displayWidth-20)/2) && (mouseY = (displayHeight-165)/2)) {
		if (grower > (displayHeight-165)) {
			fill(0, 255, 255);
		}
		if (grower > (displayWidth-20)) {
			fill(240, 255, 25);
		}
		if (grower > sqrt(hyp)) {
			fill(255, 100, 2);
		}
		noStroke();
		circle((displayWidth-20)/2, (displayHeight-165)/2, grower)
		grower = grower + 1;
	} else {
		grower = 0;
	}
	
	// Optional Aiming Cross
	stroke(255, 0, 0);
	line(((displayWidth-20)/2)+10, (displayHeight-165)/2, ((displayWidth-20)/2)-10, (displayHeight-165)/2);
	line(((displayWidth-20)/2), (displayHeight-165)/2+10, ((displayWidth-20)/2), (displayHeight-165)/2-10);
	
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