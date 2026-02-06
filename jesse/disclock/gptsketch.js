let hours;
let minutes;
let seconds;
let hourRotation;
let minuteRotation;
let secondRotation;

function setup() {
  createCanvas(400*6, 400*6);
  angleMode(DEGREES);
}

function draw() {
  background(255);
  noStroke(); 
  translate(width/2, height/2); 

  hours = hour();
  minutes = minute();
  seconds = second();

  hourRotation = map(hours % 24, 0, 24, 0, 360);
  minuteRotation = map(minutes, 0, 60, 0, 360);
  secondRotation = map(seconds, 0, 60, 0, 360);

  // Draw hour disk
  push();
  rotate(hourRotation);
  fill(255, 100, 150);
  ellipse(0, 0, width*0.8, width*0.8);
  for (let i = 1; i <= 24; i++) { 
    push();
    fill(0);
    textSize(width*0.06);
    text(i, -width*0.06, -width*0.4);
    rotate(360/24);
    pop();
  }
  pop();

  // Draw minute disk
  push();
  rotate(minuteRotation);
  fill(100, 255, 150);
  ellipse(0, 0, width*0.6, width*0.6);
  for (let i = 0; i < 12; i++) { 
    push();
    fill(0);
    textSize(width*0.06);
    text((i+1)*5, -width*0.06, -width*0.2);
    rotate(360/12);
    pop();
  }
  pop();

  // Draw second disk
  push();
  rotate(secondRotation);
  fill(150, 100, 255);
  ellipse(0, 0, width*0.4, width*0.4);
  for (let i = 0; i < 60; i++) {
    push();
   
    fill(0);
    textSize(width*0.04);
    text(i+1, -width*0.04, -width*0.1);
    rotate(360/60);
    pop();
  }
  pop();

  strokeWeight(2);
  stroke(255, 0, 0);
  line(0,0,0,-width*0.35);
}
