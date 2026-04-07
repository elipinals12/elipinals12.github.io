var bottomBars;
var topBars;
var barwid;

var time, speed;
let barStartHeight;

var pause;

function setup() {
	var cnv = createCanvas(windowWidth, windowHeight - 2)
	var cnvx = (windowWidth - width) / 2;
	var cnvy = (windowHeight - height) / 2;
	cnv.position(cnvx, cnvy);

	bottomBars = [];
	topBars = [];
	pause = false
	time = 20;
	speed = 3;
	barwid = height / 24;
	barStartHeight = height/2;

	for (var i = 0; i < 100; i++) {
		append(topBars, barStartHeight - i * barwid);
	}

	for (var i = 0; i < 100; i++) {
		append(bottomBars, barStartHeight + i * barwid);
	}	
}

function draw() {
	background(0);

	noStroke();


	for (var i = 0; i < bottomBars.length; i++) {
		fill(255);
		rectMode(CENTER);
		rect(width/2, bottomBars[i], width, barwid / 2);

		// Move bars
		if (!pause) bottomBars[i] += speed;

		if (bottomBars[i] > height + barwid) {
			bottomBars[i] = barStartHeight;
		}
	}

	for (var i = 0; i < topBars.length; i++) {
		fill(255);
		rect(width/2, topBars[i], width, barwid / 2);

		// Move bars
		if (!pause) topBars[i] -= speed;

		if (topBars[i] < -barwid) {
			topBars[i] = barStartHeight;
		}
	}



	// time in the center
	textAlign(CENTER, CENTER);
	fill(255, 0, 0);
	textSize(30);
	let textHeight = height / 2;
	if (time > 0) {
		text(Math.ceil(time), width / 2, textHeight);
		if (!pause) time -= 1 / 60;
	} else {
		text("look around", width / 2, textHeight);
	}

	// centerline measurement, not for user
	// strokeWeight(1);
	// stroke(255, 255, 0);
	// line(0, textHeight, width, textHeight);
}

function keyPressed() {
	if (keyCode == 32) {
		pause = !pause;
	} else if (keyCode == 82) reset();
}

function reset() {
	time = 20;
	pause = false;
}

function windowResized() {
	setup();
}