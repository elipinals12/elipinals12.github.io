// TODO



function setup() {
    var cnv = createCanvas(window.innerWidth - 22, window.innerHeight - 22);
    var cnvx = (windowWidth - width) / 2;
    var cnvy = (windowHeight - height) / 2;
    cnv.position(cnvx, cnvy);


}

function draw() {
    background(15, 134, 0);
}

function mousePressed() {

}

function keyPressed() {

}


function windowResized() {
    resizeCanvas(window.innerWidth - 22, window.innerHeight - 22);
}