var yes = true;

function setup() {
	var cnv = createCanvas(windowWidth, windowHeight);
	var x = (windowWidth - width) / 2;
	var y = (windowHeight - height) / 2;
	cnv.position(x, y);
	background(255);
}

function draw() {
	textAlign(LEFT, TOP);
	noStroke();
	fill(0);
	textSize(12);
	textFont('Georgia');
	if (yes) {
		background(255);
		text("yes.", 5, 5);
	} else {
		background(255);
		text("no!", 5, 5);
	}
	//print(mouseX);
	//print(mouseY);
}

function mousePressed() {
	if (mouseX < 20 && mouseY < 20) {
		yes = !yes;
	} else {
		print("shit my... pants?")
	}
}