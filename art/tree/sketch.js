var h = 180;
var ang;
var count = 0;
var instructions = true;

function setup() {
    var cnv = createCanvas(600, 600);
    var x = (windowWidth - width) / 2;
    var y = ((windowHeight - height) / 2) - 50;
    cnv.position(x, y);
}

function draw() {
    background(0);

    if (instructions) {
        textSize(width / 12);
        fill(255);
		textAlign(CENTER, CENTER);
		text("CLICK", width / 2, 3 * height / 12);
		text("&", width / 2, 4.5 * height / 12);
		text("RIGHT CLICK", width / 2, 6 * height / 12);
	}
    
    translate(width/2, height);

    stroke(255);
    strokeWeight(2);

    push();
    translate(-width/2, -height)
    ang = radians(map(mouseX, 0, 600, 0, 180));
    if (ang > PI) {
        ang = PI;
    } else if (ang < 0) {
        ang = 0;
    }
    pop();

    branch(176);
}

function mousePressed() {
    instructions = false;
    if (mouseButton == RIGHT) {
        if (h < 180) {
            h = h / .67;
            count--;
        }
    } else {
        if (h > 3) {
            h = h * .67;
            count++;
        }
        print(count);
    }
}

function keyPressed() {
    count = 0;
    h = 180;
}

function branch(len) {
    line(0, 0, 0, -len);
    translate(0, -len);
    if (len > h) {
        push();
        rotate(ang);
        branch(len * .67);
        pop();
        push();
        rotate(-ang);
        branch(len * .67);
        pop();
    }
}