var spot = {
	x: 100,
	y: 50
};

var col = {
	r: 255,
	g: 0,
	b: 0
};

function setup() {
	var cnv = createCanvas(window.innerWidth - 22, window.innerHeight - 22);
	var cnvx = (windowWidth - width) / 2;
	var cnvy = (windowHeight - height) / 2;
	cnv.position(cnvx, cnvy);
	// Background
	background(0);
}

function draw() {
	noStroke();

	spot.x = random(0, width);
	spot.y = random(0, height);

	col.r = random(0, 255);
	col.g = map(spot.x, 0, width, 0, 255)
	col.b = map(spot.y, 0, height, 0, 255)
	//col.b = random(0, 200);

	fill(col.r, col.g, col.b, 150);
	ellipse(spot.x, spot.y, 20, 20);
}

function windowResized() {
    resizeCanvas(window.innerWidth - 22, window.innerHeight - 22);
}
