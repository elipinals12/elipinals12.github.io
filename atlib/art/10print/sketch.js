let x = 0;
let y = 0;
let space = 50;
let color = 0;
let slider;
let prob = 50;

function setup() {

    slider = createSlider(5, 200, 50);
    slider.position(10,10);
    slider.style('width', '100px');
    
    createCanvas(window.innerWidth-20, window.innerHeight-20);
    background(0);
}

function draw() {
    if (slider.value() != space) {
        space = slider.value();
        reset();
        
    }
    makelines();
}


function reset() {
    background(0);
    x=0;
    y=0;
}

function makelines() {
    
    color = map(y, 0, height, 255, 0);
    stroke(255, color, color);

    if (random(0, 100) > prob) {
        line(x+space, y, x, y+space);
    } else {
        line(x, y, x+space ,y+space);
    }

    x = x+space;
    if (x > width) {
        y = y + space;
        x = 0;
    }
}