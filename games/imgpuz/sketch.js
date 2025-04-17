// Add the new image to array
let imageNames = ["realtree.jpg", "mc.png", "aiwinner.jpg", "adam.jpg", "randomawesome.jpg"];

// Update drawSplashScreen function to handle different image sizes better
function drawSplashScreen() {
  textSize(40);
  fill(200);
  text("welcome to imgpuz", width/2, height/4);
  
  textSize(20);
  fill(180);
  text("select an image or upload your own", width/2, height/4 + 40);
  
  // Better thumbnail size calculation based on screen width
  const maxThumbnailWidth = width * 0.18; // Reduced from 0.2
  const thumbnailSize = min(maxThumbnailWidth, 160); // Smaller max size
  const padding = thumbnailSize * 0.3; // Increased padding
  
  // Allow more images per row on wider screens
  const availableWidth = width * 0.8; // Use 80% of screen width
  const maxImagesPerRow = floor(availableWidth / (thumbnailSize + padding));
  const imagesPerRow = min(maxImagesPerRow, defaultImages.length);
  const rows = Math.ceil(defaultImages.length / imagesPerRow);
  
  // Draw each image thumbnail
  for (let i = 0; i < defaultImages.length; i++) {
    const row = Math.floor(i / imagesPerRow);
    const col = i % imagesPerRow;
    
    const rowImages = min(imagesPerRow, defaultImages.length - (row * imagesPerRow));
    const rowWidth = (thumbnailSize * rowImages) + (padding * (rowImages - 1));
    const startX = width/2 - rowWidth/2;
    
    const x = startX + (col * (thumbnailSize + padding)) + thumbnailSize/2;
    const y = height/2 - (rows * (thumbnailSize + padding + 20))/2 + row * (thumbnailSize + padding + 20) + thumbnailSize/2;
    
    // Draw border
    stroke(imageLoaded[i] ? 200 : 100);
    strokeWeight(3);
    fill(20);
    rect(x - thumbnailSize/2, y - thumbnailSize/2, thumbnailSize, thumbnailSize);
    
    if (imageLoaded[i]) {
      imageMode(CENTER);
      
      // Better square cropping
      const imgWidth = defaultImages[i].width;
      const imgHeight = defaultImages[i].height;
      const imgRatio = min(thumbnailSize / imgWidth, thumbnailSize / imgHeight);
      
      // Calculate dimensions to maintain aspect ratio within square
      const displayWidth = imgWidth * imgRatio;
      const displayHeight = imgHeight * imgRatio;
      
      // Draw image centered in thumbnail box
      image(defaultImages[i], x, y, displayWidth, displayHeight);
      
      // Hover effect
      if (
        mouseX > x - thumbnailSize/2 && 
        mouseX < x + thumbnailSize/2 && 
        mouseY > y - thumbnailSize/2 && 
        mouseY < y + thumbnailSize/2
      ) {
        noFill();
        stroke(0, 255, 150, 200);
        strokeWeight(5);
        rect(x - thumbnailSize/2, y - thumbnailSize/2, thumbnailSize, thumbnailSize);
        
        if (mouseIsPressed) {
          useSplashOption(i);
        }
      }
    } else {
      fill(150);
      noStroke();
      textSize(14);
      text("Not loaded", x, y);
    }
  }
  
  noStroke();
}