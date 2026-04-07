var go = false;
var cols = [255, 255, 255];
var pause = false;
var img;
var backsound;
var cnv, cnvx, cnvy;

function preload() {
  img = loadImage("banana.png");
  backsound = loadSound("bananarave.mp3");
}

function setup() {
  windowResized();
  frameRate(20);
}

function draw() {
  background(255);

  if (frameCount % 60 === 0 && !pause) {
    frameRate(random(5, 25));
  }

  if (go && !pause) {
    cols[0] = random(0, 255);
    cols[1] = random(0, 255);
    cols[2] = random(0, 255);
  }

  if (go) {
    background(cols[0], cols[1], cols[2]);
  }

  imageMode(CENTER);
  image(img, width / 2, height / 2, width / 5, width / 5);
}

function hitBanana(x, y) {
  // banana is drawn centered at (width/2, height/2) with size (width/5, width/5)
  var bw = width / 5;
  var bh = width / 5;
  var bx = width / 2;
  var by = height / 2;
  return abs(x - bx) < bw / 2 && abs(y - by) < bh / 2;
}

function handleClick(x, y) {
  if (!hitBanana(x, y)) return;

  go = !go;
  if (go) {
    backsound.loop();
  } else {
    backsound.pause();
  }
}

// desktop clicks
function mousePressed() {
  handleClick(mouseX, mouseY);
}

// mobile taps
function touchStarted() {
  if (touches.length > 0) {
    handleClick(touches[0].x, touches[0].y);
  } else {
    handleClick(mouseX, mouseY);
  }
  return false;
}

function keyPressed() {
  if (keyCode === 32) {
    pause = !pause;
  }
}

function windowResized() {
  cnv = createCanvas(windowWidth, windowHeight - 0.1);
  cnvx = (windowWidth - width) / 2;
  cnvy = (windowHeight - 0.1 - height) / 2;
  cnv.position(cnvx, cnvy);
}