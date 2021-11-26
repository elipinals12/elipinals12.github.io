var sunmax;

function setup() {
	createCanvas(windowWidth, windowHeight);

	background(55, 0, 0);
	sunmax = 6 * height / 7;
}

function draw() {
	c1 = color(122, 135, 152);
	c2 = color(238, 141, 75);
	for (let y = 0; y < sunmax; y++) {
		n = map(y, 0, height, 0, 1);
		let newc = lerpColor(c1, c2, n);
		stroke(newc);
		line(0, y, width, y);
	}
}