var circleX = 0;
var circleY = 0;
var circleD = 0;
var n = 0;

function setup() {
	createCanvas(600, 400);
}

function draw() {
	// Background
	background(250, 250, 100);
	
	// Ellipse
	fill(250, 200, 200);
	stroke(0);
	strokeWeight(1);
	circle(circleX, circleY, circleD);
	//point(circleX, circleY);
	
	circleX = circleX + 1.5;
	circleY = circleY + 1;
	circleD = circleD + 1;
	
	// Number of repetitions
	textSize(300);
	noStroke();
	fill(0, 0, 0, 75);
	textAlign(CENTER);
	text(n, 300, 310);
	
	if (circleX === 600) {
		circleX = 0;
		circleY = 0;
		circleD = 0
		n = n + 1;
	}
}