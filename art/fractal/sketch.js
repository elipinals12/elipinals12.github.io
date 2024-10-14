let maxDepth = 2; // Initial depth
let numBranches = 6; // Initial number of branches
let alpha = 0.8; // Scaling factor (alpha)
let layers = []; // Array to store multiple fractal layers

function setup() {
  setDopeCanvas();
  colorMode(HSB, 360, 100, 100, 1);
  background(0);
  angleMode(DEGREES); // Use degrees for easier calculations
  noFill();
}

function draw() {
  // Handle key presses for continuous adjustment of alpha
  handleKeyPresses();

  // Fade the background slightly to create a trailing effect
  background(0, 0, 0, 0.1);

  // Move the origin to the center of the canvas for symmetry
  translate(width / 2, height / 2);

  // Add a new layer periodically to keep the center busy
  if (frameCount % 30 === 0) {
    layers.push({
      growth: 0,
      hueOffset: random(360),
    });
  }

  // Update and draw each layer
  for (let i = layers.length - 1; i >= 0; i--) {
    let layer = layers[i];

    // Update the growth of the layer
    layer.growth += 2; // Adjust growth speed as needed

    // Remove the layer if it grows beyond a certain size
    if (layer.growth > width * 1.5) {
      layers.splice(i, 1);
      continue;
    }

    // Draw the fractal with the updated growth
    let initialRadius = 10 + layer.growth; // Smaller initial radius for a smaller center hexagon
    drawHexFractal(0, 0, initialRadius, 0, maxDepth, layer.hueOffset);
  }

  // Optionally display current alpha and maxDepth values
  displayParameters();
}

function drawHexFractal(x, y, radius, angle, depth, hueOffset) {
  if (depth <= 0 || radius < 1 || radius > width * 2) return;

  // Set dynamic color for each component based on position and depth
  let hue = (abs(x) + abs(y) + depth * 50 + frameCount * 2 + hueOffset) % 360;
  stroke(hue, 80, 100, 0.7);
  strokeWeight(map(depth, 0, maxDepth, 0.5, 3));

  // Draw a hexagon centered at (x, y)
  beginShape();
  for (let i = 0; i < 6; i++) {
    let a = angle + i * 60;
    let x1 = x + radius * cos(a);
    let y1 = y + radius * sin(a);
    vertex(x1, y1);
  }
  endShape(CLOSE);

  // Recursive calls at each vertex to make the fractal symmetrical
  let newRadius = radius * alpha; // Use alpha as the scaling factor
  let newDepth = depth - 1;

  // Adjust the number of branches per depth
  let branches = numBranches;
  let angleIncrement = 360 / branches;

  for (let i = 0; i < branches; i++) {
    let a = angle + i * angleIncrement;
    let x1 = x + radius * cos(a);
    let y1 = y + radius * sin(a);
    // Pass 'a' as the new angle to maintain symmetry
    drawHexFractal(x1, y1, newRadius, a, newDepth, hueOffset);
  }
}

function handleKeyPresses() {
  if (keyIsDown(LEFT_ARROW)) {
    alpha = max(0, alpha - 0.01); // Decrease alpha, minimum 0.001
  }
  if (keyIsDown(RIGHT_ARROW)) {
    alpha = min(6, alpha + 0.01); // Increase alpha, maximum 0.999
  }
}

function keyPressed() {
  if (keyCode === UP_ARROW) {
    maxDepth = min(5, maxDepth + 1); // Increase depth
  } else if (keyCode === DOWN_ARROW) {
    maxDepth = max(1, maxDepth - 1); // Decrease depth down to 1
  }
}

function windowResized() {
  setDopeCanvas();
}

// The throne
function setDopeCanvas() {
  cnv = createCanvas(windowWidth - 2, windowHeight - 2);
  cnvx = (windowWidth - width) / 2;
  cnvy = (windowHeight - height) / 2;
  cnv.position(cnvx, cnvy);
}

// Optional: Display the current values of alpha and maxDepth
function displayParameters() {
  push();
  resetMatrix();
  fill(255);
  noStroke();
  textSize(16);
  textAlign(LEFT, TOP);
  text(
    `Alpha (Left/Right): ${alpha.toFixed(3)}\nDepth (Up/Down): ${maxDepth}`,
    10,
    10
  );
  pop();
}
