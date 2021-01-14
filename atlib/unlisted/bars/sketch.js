var rxs = [];
var lxs = [];
var barwid;

var time = 20;
var speed = 6;

function setup() {
	var cnv = createCanvas(window.innerWidth - 22, window.innerHeight - 22);
	var cnvx = (windowWidth - width) / 2;
	var cnvy = (windowHeight - height) / 2;
	cnv.position(cnvx, cnvy);

	barwid = height / 24;
	for (var i = 0; i < 465; i++) {
		append(lxs, (height / 2) - i * barwid);
	}

	for (var i = 0; i < 465; i++) {
		append(rxs, (height / 2) + i * barwid);
	}
}

function draw() {
	background(0);

	noStroke();
	for (var i = 0; i < rxs.length; i++) {
		fill(255);
		rect(0, rxs[i], width, barwid / 2);

		// Move bars
		rxs[i] += speed;

		if (rxs[i] > height) {
			rxs[i] = height / 2;
		}
	}
	for (var i = 0; i < lxs.length; i++) {
		fill(255);
		rect(0, lxs[i], width, barwid / 2);

		// Move bars
		lxs[i] -= speed;

		if (lxs[i] < -barwid) {
			lxs[i] = height / 2;
		}
	}


	// X in the center
	textAlign(CENTER, CENTER);
	fill(255, 0, 0);
	textSize(30);
	if (time > 0) {
		text(Math.ceil(time), width / 2, height / 2);
		time -= 1 / 60;
	} else {
		text("look around", width / 2, height / 2);
	}

}