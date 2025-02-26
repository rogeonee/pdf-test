//const textPosts = require('./sample-posts');
 const allPosts = require('./sample-posts');

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { htmlToText } = require('html-to-text');
const sizeOf = require('image-size');

// Constants for layout
const LAYOUT = {
  CHAR_LIMIT_NO_IMAGES: 2500,
  CHAR_LIMIT_WITH_IMAGES: 1000,
  MAX_IMAGES_PER_PAGE: 4,
  MARGINS: 32
};

// Convert HTML to formatted text
const convertHtmlToFormattedText = (html) => {
  return html ? htmlToText(html, { wordwrap: 130 }) : "";
};

// Function to split text into chunks for PDF
const splitTextIntoChunks = (text, limit) => {
  if (!text) return [];
  
  const paragraphs = text.split(/\n\n+/);
  const chunks = [];
  let currentChunk = '';

  paragraphs.forEach(paragraph => {
    const words = paragraph.split(/\s+/);
    
    words.forEach(word => {
      const potentialChunk = currentChunk ? `${currentChunk} ${word}` : word;
      if (potentialChunk.length <= limit) {
        currentChunk = potentialChunk;
      } else {
        if (currentChunk) chunks.push(currentChunk);
        currentChunk = word;
      }
    });

    if (currentChunk) {
      chunks.push(currentChunk);
      currentChunk = '';
    }
  });

  return chunks;
};

const formatDate = (date) => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });
};

const calculateTextHeights = (doc, post, charLimit) => {
  // Title height
  doc.font('Helvetica-Bold').fontSize(24);
  const titleHeight = doc.heightOfString(post.title, {
    width: doc.page.width - (LAYOUT.MARGINS * 2),
  });

  // Switch to body font
  doc.font('Helvetica').fontSize(13);
  const spacingAfterTitle = doc.currentLineHeight(); // Gap after title

  // Body chunks
  const formattedText = convertHtmlToFormattedText(post.body);
  const textChunks = splitTextIntoChunks(formattedText, charLimit);
  let bodyHeight = 0;
  textChunks.forEach((chunk) => {
    bodyHeight += doc.heightOfString(chunk, {
      width: doc.page.width - (LAYOUT.MARGINS * 2),
    });
  });
  const bodySpacing = textChunks.length > 1 ? (textChunks.length - 1) * spacingAfterTitle : 0;

  // Smaller gap before date if there is body text
  let smallerGapHeight = 0;
  if (textChunks.length > 0) {
    doc.font('Helvetica').fontSize(6);
    smallerGapHeight = doc.currentLineHeight(); // Gap before date
    doc.font('Helvetica').fontSize(13); // Reset
  }

  // Date height
  const dateHeight = doc.heightOfString(formatDate(post.createdAt), {
    width: doc.page.width - (LAYOUT.MARGINS * 2),
  });

  // Gap after date
  const gapAfterDate = doc.currentLineHeight(); // Gap after date

  // Total text height (excludes gapAfterDate for text-only posts)
  const textHeight = titleHeight + spacingAfterTitle + bodyHeight + bodySpacing + smallerGapHeight + dateHeight;

  return {
    textHeight,
    gapAfterDate,
    textChunks,
  };
};

const calculateDynamicLayout = (doc, post, charLimit) => {
  // Calculate text heights
  const { textHeight, gapAfterDate, textChunks } = calculateTextHeights(doc, post, charLimit);
  
  // Get image dimensions and calculate layout parameters based on number of images
  let totalImageHeight = 0;
  let imageGap = 8;
  const maxImageWidth = 531;
  const imageCount = post.pictures.length;
  
  if (imageCount > 0) {
    // Estimate the image heights based on layout patterns
    if (imageCount === 1) {
      // For single image: estimate max height as 60% of page height
      const maxSingleImageHeight = (doc.page.height - textHeight - gapAfterDate) * 0.6;
      
      // Get actual image dimensions to calculate proper aspect ratio
      let aspectRatio = 4/3; // Default aspect ratio if image not found
      const imagePath = post.pictures[0];
      if (fs.existsSync(imagePath)) {
        const { width, height } = sizeOf(imagePath);
        aspectRatio = width / height;
      }
      
      // Calculate the image height based on max width and aspect ratio
      const widthBasedHeight = maxImageWidth / aspectRatio;
      totalImageHeight = Math.min(widthBasedHeight, maxSingleImageHeight);
    } 
    else if (imageCount === 2) {
      // For two images stacked: two equal-sized images plus gap
      // Estimate max height as 50% of available space
      const availableSpace = doc.page.height - textHeight - gapAfterDate - (LAYOUT.MARGINS * 2);
      const maxImageHeight = availableSpace * 0.5;
      totalImageHeight = (maxImageHeight * 2) + imageGap;
    }
    else if (imageCount === 3) {
      // For three images: one large on top (60%), two smaller below (40%)
      // Estimate as 50% of available space
      const availableSpace = doc.page.height - textHeight - gapAfterDate - (LAYOUT.MARGINS * 2);
      const maxImageHeight = availableSpace * 0.5;
      totalImageHeight = maxImageHeight + imageGap;
    }
    else if (imageCount >= 4) {
      // For four images in 2x2 grid: estimate as 40% of available space
      const availableSpace = doc.page.height - textHeight - gapAfterDate - (LAYOUT.MARGINS * 2);
      const maxImageHeight = availableSpace * 0.4;
      totalImageHeight = (maxImageHeight * 2) + imageGap;
    }
  }
  
  // Calculate total content height (text + gap + images)
  const totalContentHeight = textHeight + gapAfterDate + totalImageHeight;
  
  // Calculate starting Y position to center content
  const startY = Math.max((doc.page.height - totalContentHeight) / 2, LAYOUT.MARGINS);
  
  return {
    startY,
    textHeight,
    gapAfterDate,
    textChunks,
    totalImageHeight,
    totalContentHeight
  };
};

const renderTextElements = (doc, post, textChunks) => {
  // Title
  doc.font('Helvetica-Bold').fontSize(24).text(post.title, { align: 'left' });

  // Switch to body font before moving down
  if (textChunks.length > 0) {
    doc.font('Helvetica').fontSize(13);
    doc.moveDown(); // Gap after title uses font size 13 line height
  }

  // Body
  textChunks.forEach((chunk, idx) => {
    doc.text(chunk, { align: 'justify' });
    if (idx < textChunks.length - 1) {
      doc.moveDown(); // Gap between chunks uses font size 13 line height
    }
  });

  // Date with smaller gap, only if there is body text
  
    doc.font('Helvetica').fontSize(6);
    doc.moveDown(); // Smaller gap before date uses font size 6 line height

  doc.font('Helvetica').fontSize(13);
  doc.fillColor('#808080').text(formatDate(post.createdAt), { align: 'left' }).fillColor('black');
  doc.moveDown(); // Gap after date uses font size 13 line height
};

const renderCroppedImage = (doc, imagePath, x, y, targetWidth, targetHeight) => {
  if (!fs.existsSync(imagePath)) {
    console.error(`Image not found: ${imagePath}`);
    return;
  }

  try {
    // Get original dimensions
    const { width: origWidth, height: origHeight } = sizeOf(imagePath);
    
    // Calculate scale ratios
    const widthRatio = targetWidth / origWidth;
    const heightRatio = targetHeight / origHeight;
    
    // Use the larger ratio to ensure the image covers the target area
    const ratio = Math.max(widthRatio, heightRatio);
    
    // Calculate scaled dimensions
    const scaledWidth = origWidth * ratio;
    const scaledHeight = origHeight * ratio;
    
    // Calculate positioning to center the image
    const offsetX = (targetWidth - scaledWidth) / 2;
    const offsetY = (targetHeight - scaledHeight) / 2;
    
    // Draw the image with clipping
    doc.save();
    doc.rect(x, y, targetWidth, targetHeight).clip();
    doc.image(imagePath, x + offsetX, y + offsetY, { 
      width: scaledWidth, 
      height: scaledHeight 
    });
    doc.restore();
  } catch (error) {
    console.error(`Error processing image ${imagePath}:`, error);
  }
};

const renderTextOnlyPost = (doc, post) => {
  const charLimit = LAYOUT.CHAR_LIMIT_NO_IMAGES; // e.g., 2500
  const { textHeight, textChunks } = calculateTextHeights(doc, post, charLimit);

  // Center vertically
  const startY = Math.max((doc.page.height - textHeight) / 2, LAYOUT.MARGINS);
  doc.y = startY;

  renderTextElements(doc, post, textChunks);
};

const renderSingleImagePost = (doc, post) => {
  const charLimit = LAYOUT.CHAR_LIMIT_WITH_IMAGES;
  
  // 1) Render text content at the top (title, body, date)
  const formattedText = convertHtmlToFormattedText(post.body);
  const textChunks = splitTextIntoChunks(formattedText, charLimit);

  doc.font('Helvetica-Bold')
     .fontSize(24)
     .text(post.title, { align: 'left' });

  if (textChunks.length > 0) {
    doc.font('Helvetica').fontSize(13);
    doc.moveDown();
  }

  textChunks.forEach((chunk, i) => {
    doc.text(chunk, { align: 'justify' });
    if (i < textChunks.length - 1) {
      doc.moveDown();
    }
  });

  doc.font('Helvetica')
     .fontSize(6);
  doc.moveDown(); // Gap before date
  doc.font('Helvetica')
     .fontSize(13)
     .fillColor('#808080')
     .text(formatDate(post.createdAt), { align: 'left' })
     .fillColor('black');
  doc.moveDown();

  // 2) Calculate leftover space after text
  const leftoverSpace = doc.page.height - doc.y - LAYOUT.MARGINS;
  if (leftoverSpace <= 0) {
    console.log("No space left for image");
    return;
  }

  // 3) Prepare to render the image in the leftover space, preserving aspect ratio
  const imagePath = post.pictures[0];
  if (!fs.existsSync(imagePath)) {
    console.error(`Image not found: ${imagePath}`);
    return;
  }
  
  const { width: origW, height: origH } = sizeOf(imagePath);
  const aspectRatio = origW / origH;

  // Assume image will fill the leftover space vertically
  let imageHeight = leftoverSpace;
  let imageWidth = imageHeight * aspectRatio;

  const maxWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  if (imageWidth > maxWidth) {
    // Clamp to maxWidth and recalc height
    imageWidth = maxWidth;
    imageHeight = imageWidth / aspectRatio;
  }

  // 4) If the image height is less than leftover space, center it vertically
  let verticalOffset = 0;
  if (imageHeight < leftoverSpace) {
    verticalOffset = (leftoverSpace - imageHeight) / 2;
  }
  
  // 5) Center the image horizontally
  const imageX = (doc.page.width - imageWidth) / 2;

  // Render the image with the calculated offsets
  doc.image(imagePath, imageX, doc.y + verticalOffset, { width: imageWidth, height: imageHeight });
};

const renderTwoImagePost = (doc, post) => {
  const charLimit = LAYOUT.CHAR_LIMIT_WITH_IMAGES;
  
  // FIX: Render text content from the top margin, instead of using calculateDynamicLayout
  const formattedText = convertHtmlToFormattedText(post.body);
  const textChunks = splitTextIntoChunks(formattedText, charLimit);
  
  doc.y = LAYOUT.MARGINS;
  renderTextElements(doc, post, textChunks);
  
  // Calculate leftover space for images after text is rendered
  const leftoverSpace = doc.page.height - doc.y - LAYOUT.MARGINS;
  if (leftoverSpace <= 0) {
    console.log("No space left for images");
    return;
  }
  
  const imageGap = 8;
  // Use available width, up to a maximum of 531
  const maxImageWidth = Math.min(531, doc.page.width - (LAYOUT.MARGINS * 2));
  
  // Divide the leftover space equally for two images (accounting for the gap)
  const imageHeight = (leftoverSpace - imageGap) / 2;
  const imageWidth = maxImageWidth;
  
  // Center the images horizontally
  const imageX = (doc.page.width - imageWidth) / 2;
  const imagePaths = post.pictures.slice(0, 2);
  
  // Render first image centered
  if (imagePaths[0]) {
    renderCroppedImage(doc, imagePaths[0], imageX, doc.y, imageWidth, imageHeight);
  }
  
  // Move down for second image (accounting for the gap)
  doc.y += imageHeight + imageGap;
  
  // Render second image centered
  if (imagePaths[1]) {
    renderCroppedImage(doc, imagePaths[1], imageX, doc.y, imageWidth, imageHeight);
  }
};

const renderThreeImagePost = (doc, post) => {
  const charLimit = LAYOUT.CHAR_LIMIT_WITH_IMAGES;
  
  // Render text content at the top
  const formattedText = convertHtmlToFormattedText(post.body);
  const textChunks = splitTextIntoChunks(formattedText, charLimit);
  
  // Set starting position to the top margin
  doc.y = LAYOUT.MARGINS;
  renderTextElements(doc, post, textChunks);
  
  // Calculate leftover space for images after text is rendered
  const leftoverSpace = doc.page.height - doc.y - LAYOUT.MARGINS;
  if (leftoverSpace <= 0) {
    console.log("No space left for images");
    return;
  }
  
  // Define gap between images
  const imageGap = 8;
  
  // Allocate 60% of leftover space (minus gap) to the top image,
  // and 40% to the bottom row of two images
  const topImageHeight = (leftoverSpace - imageGap) * 0.6;
  const bottomImageHeight = (leftoverSpace - imageGap) * 0.4;
  
  // Determine maximum available width for images
  const maxImageWidth = Math.min(531, doc.page.width - LAYOUT.MARGINS * 2);
  
  // Top image takes full available width
  const topImageWidth = maxImageWidth;
  // Each bottom image gets half of the available width (minus the gap)
  const bottomImageWidth = (maxImageWidth - imageGap) / 2;
  
  // Center the top image horizontally
  const topImageX = (doc.page.width - topImageWidth) / 2;
  const topImageY = doc.y; // Position immediately after text
  
  // Image paths for first three images
  const imagePaths = post.pictures.slice(0, 3);
  
  // Render top image in its allocated area
  if (imagePaths[0]) {
    renderCroppedImage(doc, imagePaths[0], topImageX, topImageY, topImageWidth, topImageHeight);
  }
  
  // Position bottom row: move down after top image and gap
  const bottomRowY = topImageY + topImageHeight + imageGap;
  
  // Compute horizontal starting point for bottom images to center them together
  const combinedBottomWidth = bottomImageWidth * 2 + imageGap;
  const bottomLeftX = (doc.page.width - combinedBottomWidth) / 2;
  
  // Render bottom left image
  if (imagePaths[1]) {
    renderCroppedImage(doc, imagePaths[1], bottomLeftX, bottomRowY, bottomImageWidth, bottomImageHeight);
  }
  
  // Render bottom right image
  const bottomRightX = bottomLeftX + bottomImageWidth + imageGap;
  if (imagePaths[2]) {
    renderCroppedImage(doc, imagePaths[2], bottomRightX, bottomRowY, bottomImageWidth, bottomImageHeight);
  }
};

const renderFourImagePost = (doc, post) => {
  const charLimit = LAYOUT.CHAR_LIMIT_WITH_IMAGES;
  
  // Render text content at the top
  const formattedText = convertHtmlToFormattedText(post.body);
  const textChunks = splitTextIntoChunks(formattedText, charLimit);
  
  // Set starting position to the top margin and render text
  doc.y = LAYOUT.MARGINS;
  renderTextElements(doc, post, textChunks);
  
  // Calculate remaining space for images after text is rendered
  const leftoverSpace = doc.page.height - doc.y - LAYOUT.MARGINS;
  if (leftoverSpace <= 0) {
    console.log("No space left for images");
    return;
  }
  
  // FIX: Use a maximum grid width based on LAYOUT or available page width
  const maxGridWidth = Math.min(531, doc.page.width - LAYOUT.MARGINS * 2);
  
  // FIX: Calculate cell dimensions for a 2x2 grid filling the leftover space
  const imageGap = 8;
  const cellWidth = (maxGridWidth - imageGap) / 2;
  const cellHeight = (leftoverSpace - imageGap) / 2;
  
  // Center the grid horizontally
  const gridX = (doc.page.width - maxGridWidth) / 2;
  const gridY = doc.y;
  
  // Image paths for the first four images
  const imagePaths = post.pictures.slice(0, 4);
  
  // Render the 2x2 grid:
  // Top left image
  if (imagePaths[0]) {
    renderCroppedImage(doc, imagePaths[0], gridX, gridY, cellWidth, cellHeight);
  }
  
  // Top right image
  if (imagePaths[1]) {
    renderCroppedImage(doc, imagePaths[1], gridX + cellWidth + imageGap, gridY, cellWidth, cellHeight);
  }
  
  // Bottom left image
  if (imagePaths[2]) {
    renderCroppedImage(doc, imagePaths[2], gridX, gridY + cellHeight + imageGap, cellWidth, cellHeight);
  }
  
  // Bottom right image
  if (imagePaths[3]) {
    renderCroppedImage(doc, imagePaths[3], gridX + cellWidth + imageGap, gridY + cellHeight + imageGap, cellWidth, cellHeight);
  }
};
 
// Main function to generate PDF
const createStoryPDF = () => {
  const doc = new PDFDocument({
    margins: { top: LAYOUT.MARGINS, bottom: LAYOUT.MARGINS, left: LAYOUT.MARGINS, right: LAYOUT.MARGINS }
  });

  const pdfPath = path.join(__dirname, 'res/output.pdf');
  const stream = fs.createWriteStream(pdfPath);
  doc.pipe(stream);

  allPosts.forEach((post, index) => {
    if (index > 0) doc.addPage();

    const hasImages = post.pictures.length > 0;

    if (hasImages) {
      if (post.pictures.length === 1) {
        renderSingleImagePost(doc, post);
      } else if (post.pictures.length === 2) {
        renderTwoImagePost(doc, post);
      } else if (post.pictures.length === 3) {
        renderThreeImagePost(doc, post);
      } else if (post.pictures.length >= 4) {
        renderFourImagePost(doc, post);
      }
    } else {
      renderTextOnlyPost(doc, post);
    }
  });

  doc.end();
  console.log(`PDF generated at: ${pdfPath}`);
};

createStoryPDF();
