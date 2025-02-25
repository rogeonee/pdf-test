//const textPosts = require('./sample-posts');
 const oneImagePosts = require('./sample-posts');

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
  IMAGE_SIZE: { width: 200, height: 150 },
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

// Function to process and add post content to PDF (unused for now)
const processPostBody = (doc, body, hasImages) => {
  if (!body) return;

  const formattedText = convertHtmlToFormattedText(body);
  const charLimit = hasImages ? LAYOUT.CHAR_LIMIT_WITH_IMAGES : LAYOUT.CHAR_LIMIT_NO_IMAGES;
  const textChunks = splitTextIntoChunks(formattedText, charLimit);

  textChunks.forEach((chunk, index) => {
    doc.fontSize(13).text(chunk, { align: 'justify' });
    if (index < textChunks.length - 1) {
      doc.moveDown();
    }
  });
};

// Function to add images to PDF (unused for now)
const addImagesToPDF = (doc, images) => {
  if (!images.length) return;

  const imagesPerRow = 2;
  const imageSpacing = 20;
  const availableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const imageWidth = (availableWidth - (imageSpacing * (imagesPerRow - 1))) / imagesPerRow;
  const imageHeight = (imageWidth * LAYOUT.IMAGE_SIZE.height) / LAYOUT.IMAGE_SIZE.width;

  let imagesOnCurrentPage = 0;
  let row = 0;

  images.forEach((imagePath, index) => {
    if (imagesOnCurrentPage >= LAYOUT.MAX_IMAGES_PER_PAGE) {
      doc.addPage();
      imagesOnCurrentPage = 0;
      row = 0;
    }

    const col = imagesOnCurrentPage % imagesPerRow;
    const x = doc.page.margins.left + (col * (imageWidth + imageSpacing));
    const y = doc.y + (row === 0 ? 0 : imageSpacing);

    try {
      if (fs.existsSync(imagePath)) {
        doc.image(imagePath, x, y, { width: imageWidth, height: imageHeight });
      } else {
        console.error(`Image not found: ${imagePath}`);
      }
    } catch (error) {
      console.error(`Error loading image ${imagePath}:`, error);
    }

    imagesOnCurrentPage++;
    if (imagesOnCurrentPage % imagesPerRow === 0) {
      row++;
      doc.moveDown(2);
    }
  });

  doc.moveDown(2);
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
  const charLimit = LAYOUT.CHAR_LIMIT_WITH_IMAGES; // e.g., 1000
  const { textHeight, gapAfterDate, textChunks } = calculateTextHeights(doc, post, charLimit);

  // Image scaling (initially to maxWidth)
  const imagePath = post.pictures[0];
  let imageScaledWidth = 0;
  let imageScaledHeight = 0;
  if (fs.existsSync(imagePath)) {
    const { width: originalW, height: originalH } = sizeOf(imagePath);
    const maxWidth = 531;

    // Scale to maxWidth if necessary
    if (originalW > maxWidth) {
      const ratio = maxWidth / originalW;
      imageScaledWidth = maxWidth;
      imageScaledHeight = originalH * ratio;
    } else {
      imageScaledWidth = originalW;
      imageScaledHeight = originalH;
    }
  }

  // Calculate total content height for centering (initial estimate)
  const totalContentHeight = textHeight + gapAfterDate + imageScaledHeight;
  const startY = Math.max((doc.page.height - totalContentHeight) / 2, LAYOUT.MARGINS);
  doc.y = startY;

  // Render text
  renderTextElements(doc, post, textChunks);

  // Calculate actual remaining space after rendering text
  const remainingSpace = doc.page.height - LAYOUT.MARGINS - doc.y;

  // Scale image to fit within actual remaining space
  if (imageScaledHeight > remainingSpace && remainingSpace > 0) {
    const ratio = remainingSpace / imageScaledHeight;
    imageScaledHeight = remainingSpace;
    imageScaledWidth *= ratio;
  } else if (remainingSpace <= 0) {
    // If no space remains, don't render the image
    imageScaledHeight = 0;
    imageScaledWidth = 0;
  }

  // Render image
  if (imageScaledWidth > 0 && imageScaledHeight > 0) {
    const x = (doc.page.width - imageScaledWidth) / 2;
    doc.image(imagePath, x, doc.y, { width: imageScaledWidth, height: imageScaledHeight });
  }
};

const renderTwoImagePost = (doc, post) => {
  const charLimit = LAYOUT.CHAR_LIMIT_WITH_IMAGES;
  const { textHeight, gapAfterDate, textChunks } = calculateTextHeights(doc, post, charLimit);
  
  // Image paths
  const imagePaths = post.pictures.slice(0, 2);
  
  // Gap between images
  const imageGap = 8;
  
  // Max width for images
  const maxImageWidth = 531;
  
  // First, render the text to calculate remaining space
  // Using your optimized value for better space distribution
  const startY = Math.max((doc.page.height - textHeight - gapAfterDate - 700) / 2, LAYOUT.MARGINS);
  doc.y = startY;
  
  renderTextElements(doc, post, textChunks);
  
  // Calculate remaining space for images
  const remainingSpace = doc.page.height - LAYOUT.MARGINS - doc.y;
  
  if (remainingSpace <= 0) {
    console.log("No space left for images");
    return;
  }
  
  // Two equal-sized images stacked vertically
  // Divide the remaining space equally between them (minus the gap)
  const imageHeight = (remainingSpace - imageGap) / 2;
  const imageWidth = maxImageWidth;
  
  // Render first image centered
  const imageX = (doc.page.width - imageWidth) / 2;
  if (imagePaths[0]) {
    renderCroppedImage(doc, imagePaths[0], imageX, doc.y, imageWidth, imageHeight);
  }
  
  // Move down for second image
  doc.y += imageHeight + imageGap;
  
  // Render second image centered
  if (imagePaths[1]) {
    renderCroppedImage(doc, imagePaths[1], imageX, doc.y, imageWidth, imageHeight);
  }
};

const renderThreeImagePost = (doc, post) => {
  const charLimit = LAYOUT.CHAR_LIMIT_WITH_IMAGES;
  const { textHeight, gapAfterDate, textChunks } = calculateTextHeights(doc, post, charLimit);
  
  // Image paths
  const imagePaths = post.pictures.slice(0, 3);
  
  // Gap between images
  const imageGap = 8;
  
  // Max width for images
  const maxImageWidth = 531;
  
  // First, render the text to calculate remaining space
  const startY = Math.max((doc.page.height - textHeight - gapAfterDate - 700) / 2, LAYOUT.MARGINS);
  doc.y = startY;
  
  renderTextElements(doc, post, textChunks);
  
  // Calculate remaining space for images
  const remainingSpace = doc.page.height - LAYOUT.MARGINS - doc.y;
  
  if (remainingSpace <= 0) {
    console.log("No space left for images");
    return;
  }
  
  // Layout: 1 large image on top, 2 equal-sized images below
  // Allocate 60% of space to top image, 40% to bottom row (minus the gap)
  const topImageHeight = (remainingSpace - imageGap) * 0.6;
  const bottomImageHeight = (remainingSpace - imageGap) * 0.4;
  
  // Top image takes full width
  const topImageWidth = maxImageWidth;
  // Bottom images each take (fullWidth - gap) / 2
  const bottomImageWidth = (maxImageWidth - imageGap) / 2;
  
  // Render top image centered
  const topImageX = (doc.page.width - topImageWidth) / 2;
  if (imagePaths[0]) {
    renderCroppedImage(doc, imagePaths[0], topImageX, doc.y, topImageWidth, topImageHeight);
  }
  
  // Move down for bottom row
  doc.y += topImageHeight + imageGap;
  
  // Render bottom left image
  const bottomLeftX = (doc.page.width - maxImageWidth) / 2;
  if (imagePaths[1]) {
    renderCroppedImage(doc, imagePaths[1], bottomLeftX, doc.y, bottomImageWidth, bottomImageHeight);
  }
  
  // Render bottom right image
  const bottomRightX = bottomLeftX + bottomImageWidth + imageGap;
  if (imagePaths[2]) {
    renderCroppedImage(doc, imagePaths[2], bottomRightX, doc.y, bottomImageWidth, bottomImageHeight);
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

  oneImagePosts.forEach((post, index) => {
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
        // renderFourImagePost(doc, post);
        console.log(`Post with ${post.pictures.length} images not fully supported yet`);
      }
    } else {
      renderTextOnlyPost(doc, post);
    }
  });

  doc.end();
  console.log(`PDF generated at: ${pdfPath}`);
};

createStoryPDF();
