let boardSize = 8;
let coinValues = [];
let coinSize;
let xOffset;
let yOffset;

function setup() {
  
    var cnv = createCanvas(windowWidth, windowHeight - 2);
    var cnvx = (windowWidth - width) / 2;
    var cnvy = (windowHeight - height) / 2;
    cnv.position(cnvx, cnvy);
  background(0);
  createBoard();
}

function draw() {
  drawBoard();
}

function keyPressed() {
  if (key == 'r') {
    randomizeCoins();
  }
}

function mousePressed() {
  let xIndex = floor((mouseX - xOffset) / coinSize);
  let yIndex = floor((mouseY - yOffset) / coinSize);
  if (xIndex >= 0 && xIndex < boardSize && yIndex >= 0 && yIndex < boardSize) {
    coinValues[yIndex][xIndex] = (coinValues[yIndex][xIndex] + 1) % 2;
  }
}

function createBoard() {
  for (let i = 0; i < boardSize; i++) {
    coinValues[i] = [];
    for (let j = 0; j < boardSize; j++) {
      coinValues[i][j] = Math.round(Math.random());
    }
  }
}

function drawBoard() {
  coinSize = min(width, height) / (boardSize + 2);
  xOffset = (width - (boardSize * coinSize)) / 2;
  yOffset = (height - (boardSize * coinSize)) / 2;
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      fill((i + j) % 2 == 0 ? '#CCCCCC' : '#999999');
      let x = j * coinSize + xOffset;
      let y = i * coinSize + yOffset;
      rect(x, y, coinSize, coinSize);
      noStroke();
      fill(coinValues[i][j] == 0 ? 'white' : 'black');
      ellipse(x + coinSize / 2, y + coinSize / 2, coinSize * 0.9);
      fill(coinValues[i][j] == 0 ? 'black' : 'white');
      textAlign(CENTER, CENTER);
      textSize(coinSize * 0.5);
      text(coinValues[i][j], x + coinSize / 2, y + coinSize / 2);
    }
  }
}

function randomizeCoins() {
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      coinValues[i][j] = Math.round(Math.random());
    }
  }
}

function windowResized() {
  
    var cnv = createCanvas(windowWidth, windowHeight - 2);
    var cnvx = (windowWidth - width) / 2;
    var cnvy = (windowHeight - height) / 2;
    cnv.position(cnvx, cnvy);
}
