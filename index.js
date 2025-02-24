// const textPosts = require('./sample-posts');
oneImagePosts = require('./sample-posts');

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

// Function to process and add post content to PDF
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

const renderTextOnlyPost = (doc, post) => {
  // Split body into chunks first
  const formattedText = convertHtmlToFormattedText(post.body);
  const charLimit = LAYOUT.CHAR_LIMIT_NO_IMAGES; // For text-only
  const textChunks = splitTextIntoChunks(formattedText, charLimit);

  // --- Calculate heights (Title, Body, Date) ---
  // Title
  doc.font('Helvetica-Bold').fontSize(24);
  const titleHeight = doc.heightOfString(post.title, {
    width: doc.page.width - (LAYOUT.MARGINS * 2),
  });

  // Switch to body font
  doc.font('Helvetica').fontSize(13);

  // Body chunks
  let bodyHeight = 0;
  let spacingBetweenChunks = 0;
  textChunks.forEach((chunk, chunkIndex) => {
    const chunkHeight = doc.heightOfString(chunk, {
      width: doc.page.width - (LAYOUT.MARGINS * 2),
    });
    bodyHeight += chunkHeight;
    if (chunkIndex < textChunks.length - 1) {
      spacingBetweenChunks += doc.currentLineHeight();
    }
  });

  // Date
  const dateString = formatDate(post.createdAt); // e.g. "January 24, 2025"
  const dateHeight = doc.heightOfString(dateString, {
    width: doc.page.width - (LAYOUT.MARGINS * 2),
  });

  // Spacing after title
  const spacingAfterTitle = doc.currentLineHeight();

  // Total height calculation
  const totalContentHeight =
    titleHeight + spacingAfterTitle + (bodyHeight + spacingBetweenChunks) + dateHeight;

  // Center content vertically, but don't go above top margin
  const startY = Math.max((doc.page.height - totalContentHeight) / 2, LAYOUT.MARGINS);
  doc.y = startY;

  // --- Render ---
  // Title
  doc.font('Helvetica-Bold').fontSize(24).text(post.title, { align: 'left' });
  doc.moveDown(); // spacing after title

  // Body
  doc.font('Helvetica').fontSize(13);
  textChunks.forEach((chunk, chunkIndex) => {
    doc.text(chunk, { align: 'justify' });
    if (chunkIndex < textChunks.length - 1) {
      doc.moveDown();
    }
  });

  // Date
  doc.font('Helvetica').fontSize(10)
  doc.moveDown();
  doc.font('Helvetica').fontSize(13);
  doc.fillColor('#808080')
    .text(dateString, { align: 'left' })
    .fillColor('black');
}

const renderSingleImagePost = (doc, post) => {
  // --- 1) Prepare Title ---
  doc.font('Helvetica-Bold').fontSize(24);
  const titleHeight = doc.heightOfString(post.title, {
    width: doc.page.width - (LAYOUT.MARGINS * 2),
  });

  // --- 2) Prepare Body ---
  doc.font('Helvetica').fontSize(13);
  const charLimit = LAYOUT.CHAR_LIMIT_WITH_IMAGES; // For posts w/ images
  const formattedText = convertHtmlToFormattedText(post.body);
  const textChunks = splitTextIntoChunks(formattedText, charLimit);

  // Measure body text height + line spacing
  let bodyHeight = 0;
  let bodySpacing = 0;
  textChunks.forEach((chunk, idx) => {
    const chunkHeight = doc.heightOfString(chunk, {
      width: doc.page.width - (LAYOUT.MARGINS * 2),
    });
    bodyHeight += chunkHeight;
    // Add spacing including after the last chunk
    if (idx < textChunks.length) {
      bodySpacing += doc.currentLineHeight();
    }
  });

  // --- 3) Prepare Image Dimensions ---
  const imagePath = post.pictures[0]; // single image
  const maxWidth = 531; // your stated limit

  let imageScaledWidth = 0;
  let imageScaledHeight = 0;

  if (fs.existsSync(imagePath)) {
    // 3a) Get real dimensions
    const { width: originalW, height: originalH } = sizeOf(imagePath);

    // 3b) First, scale by maxWidth if needed (maintain aspect ratio)
    if (originalW > maxWidth) {
      const ratio = maxWidth / originalW;
      imageScaledWidth = maxWidth;
      imageScaledHeight = originalH * ratio;
    } else {
      // If image is already smaller than maxWidth, use original size
      imageScaledWidth = originalW;
      imageScaledHeight = originalH;
    }
  } else {
    console.error(`Image not found: ${imagePath}`);
    // If not found, treat it as no image
  }

  // --- 4) Prepare Date ---
  const dateString = formatDate(post.createdAt); // ex: "January 20, 2025"
  const dateHeight = doc.heightOfString(dateString, {
    width: doc.page.width - (LAYOUT.MARGINS * 2),
  });

  // --- 5) Calculate Content Height WITHOUT image (we'll scale image next) ---
  // Title + spacing after title + body + body spacing + date
  const spacingAfterTitle = doc.currentLineHeight();
  const partialContentHeight =
    titleHeight + spacingAfterTitle + bodyHeight + bodySpacing + 3 * dateHeight;

  // --- 6) Figure Out Remaining Space for the Image ---
  const leftoverHeight =
    doc.page.height - (LAYOUT.MARGINS * 2) - partialContentHeight;

  // If the image is taller than leftover space, scale it down
  if (imageScaledHeight > leftoverHeight && leftoverHeight > 0) {
    const ratio = leftoverHeight / imageScaledHeight;
    imageScaledHeight = leftoverHeight;
    imageScaledWidth = imageScaledWidth * ratio;
  }

  // --- 7) Now add the scaled image height to get totalContentHeight ---
  let totalContentHeight = partialContentHeight;
  if (imageScaledHeight > 0) {
    totalContentHeight += imageScaledHeight;
  }

  // --- 8) Center content vertically (avoid going above top margin) ---
  const startY = Math.max((doc.page.height - totalContentHeight) / 2, LAYOUT.MARGINS);
  doc.y = startY;

  // --- 9) Render Title ---
  doc.font('Helvetica-Bold').fontSize(24).text(post.title, { align: 'left' });
  doc.font('Helvetica').fontSize(13); // spacing after title

  if (post.body.length !== 0) doc.moveDown();
  // --- 10) Render Body (Chunks) ---
  textChunks.forEach((chunk, idx) => {
    doc.text(chunk, { align: 'justify' });
    if (idx < textChunks.length - 1) {
      doc.moveDown();
    }
  });

    // --- 11) Render Date ---
  doc.font('Helvetica').fontSize(7)
  doc.moveDown();
  doc.font('Helvetica').fontSize(13);
  doc.fillColor('#808080')
    .text(dateString, { align: 'left' })
    .fillColor('black');
    doc.moveDown();

  // --- 12) Render Image (if it exists and scaled dimension > 0) ---
  if (imageScaledWidth > 0 && imageScaledHeight > 0) {
    // Center image horizontally
    const x = (doc.page.width - imageScaledWidth) / 2;
    doc.image(imagePath, x, doc.y, {
      width: imageScaledWidth,
      height: imageScaledHeight,
    });
    // Move Y below the image
    doc.y += imageScaledHeight;
  }
}
 
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

    if (hasImages && post.pictures.length === 1) {
        renderSingleImagePost(doc, post);
    } else if (hasImages && post.pictures.length > 1) {
    // Some other function for multiple images
    } else {
        renderTextOnlyPost(doc, post);
    }
  });

  doc.end();
  console.log(`PDF generated at: ${pdfPath}`);
};

// Run PDF generation
createStoryPDF();
