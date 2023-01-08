var yes = true;
var billcount = 0;
var billxs = [];
var billys = [];

let img;
function preload() {
	img = loadImage('burnbill.png');
}

function setup() {
	var cnv = createCanvas(windowWidth, windowHeight);
	var x = (windowWidth - width) / 2;
	var y = (windowHeight - height) / 2;
	cnv.position(x, y);
}

function draw() {
	background(255);
	textAlign(LEFT, TOP);
	noStroke();
	fill(0);
	textSize(15);
	textFont('Georgia');
	if (yes) {
		text("yes.", 5, 5);
	} else {
		text("no!", 5, 5);
	}
	//print(mouseX);
	//print(mouseY);

	//BILLS RAINING
	fill(255, 0, 0);
	for (var i = 0; i < billxs.length; i++) {
		if (billys[i] > height + 100) {
			//{ goAwayRedSquare(); }
		}
		//rect(billxs[i], billys[i], 30, 30);
		image(img, billxs[i], billys[i]);
		billys[i] = billys[i] + 1;
	}
}

function mousePressed() {
	if (mouseX < 20 && mouseY < 20) {
		yes = !yes;
	} else {
		print("shit my... pants?")
	}
}

function keyPressed() {
	if (keyIsDown(78) && keyIsDown(70) && keyIsDown(84)) {
		billcount++;
		rainMoney();
	}
}

function rainMoney() {
	for (var i = 0; i < pow(billcount, 2); i++) {
		append(billxs, random(0, width));
		append(billys, random(-50, -10));
	}
}