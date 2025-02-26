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
  MARGINS: 32,
  IMAGE_GAP: 8,
};

// Convert HTML to formatted text
const convertHtmlToFormattedText = (html) => {
  return html ? htmlToText(html, { wordwrap: 130 }) : '';
};

// Function to split text into chunks for PDF
const splitTextIntoChunks = (text, limit) => {
  if (!text) return [];

  const paragraphs = text.split(/\n\n+/);
  const chunks = [];
  let currentChunk = '';

  paragraphs.forEach((paragraph) => {
    const words = paragraph.split(/\s+/);

    words.forEach((word) => {
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
    year: 'numeric',
  });
};

const calculateTextHeights = (doc, post, charLimit) => {
  // title height
  doc.font('Helvetica-Bold').fontSize(24);
  const titleHeight = doc.heightOfString(post.title, {
    width: doc.page.width - LAYOUT.MARGINS * 2,
  });

  // switch to body font
  doc.font('Helvetica').fontSize(13);
  const spacingAfterTitle = doc.currentLineHeight(); // gap after title

  // body chunks
  const formattedText = convertHtmlToFormattedText(post.body);
  const textChunks = splitTextIntoChunks(formattedText, charLimit);
  let bodyHeight = 0;
  textChunks.forEach((chunk) => {
    bodyHeight += doc.heightOfString(chunk, {
      width: doc.page.width - LAYOUT.MARGINS * 2,
    });
  });
  const bodySpacing =
    textChunks.length > 1 ? (textChunks.length - 1) * spacingAfterTitle : 0;

  // smaller gap before date if there is body text
  let smallerGapHeight = 0;
  if (textChunks.length > 0) {
    doc.font('Helvetica').fontSize(6);
    smallerGapHeight = doc.currentLineHeight(); // gap before date
    doc.font('Helvetica').fontSize(13); // reset
  }

  // date height
  const dateHeight = doc.heightOfString(formatDate(post.createdAt), {
    width: doc.page.width - LAYOUT.MARGINS * 2,
  });

  // gap after date
  const gapAfterDate = doc.currentLineHeight(); // Gap after date

  // total text height (excludes gapAfterDate for text-only posts)
  const textHeight =
    titleHeight +
    spacingAfterTitle +
    bodyHeight +
    bodySpacing +
    smallerGapHeight +
    dateHeight;

  return {
    textHeight,
    gapAfterDate,
    textChunks,
  };
};

const renderTextElements = (doc, post, textChunks) => {
  // title
  doc.font('Helvetica-Bold').fontSize(24).text(post.title, { align: 'left' });

  // switch to body font before moving down
  if (textChunks.length > 0) {
    doc.font('Helvetica').fontSize(13);
    doc.moveDown(); // gap after title
  }

  // body
  textChunks.forEach((chunk, idx) => {
    doc.text(chunk, { align: 'justify' });
    if (idx < textChunks.length - 1) {
      doc.moveDown(); // gap between chunks
    }
  });

  doc.font('Helvetica').fontSize(6);
  doc.moveDown(); // smaller gap before date

  doc.font('Helvetica').fontSize(13);
  doc
    .fillColor('#808080')
    .text(formatDate(post.createdAt), { align: 'left' })
    .fillColor('black');
  doc.moveDown(); // gap after date
};

const renderCroppedImage = (
  doc,
  imagePath,
  x,
  y,
  targetWidth,
  targetHeight,
) => {
  if (!fs.existsSync(imagePath)) {
    console.error(`Image not found: ${imagePath}`);
    return;
  }

  try {
    const { width: origWidth, height: origHeight } = sizeOf(imagePath);
    const widthRatio = targetWidth / origWidth;
    const heightRatio = targetHeight / origHeight;

    const ratio = Math.max(widthRatio, heightRatio);

    const scaledWidth = origWidth * ratio;
    const scaledHeight = origHeight * ratio;

    const offsetX = (targetWidth - scaledWidth) / 2;
    const offsetY = (targetHeight - scaledHeight) / 2;

    // draw image with clipping
    doc.save();
    doc.rect(x, y, targetWidth, targetHeight).clip();
    doc.image(imagePath, x + offsetX, y + offsetY, {
      width: scaledWidth,
      height: scaledHeight,
    });
    doc.restore();
  } catch (error) {
    console.error(`Error processing image ${imagePath}:`, error);
  }
};

const renderTextOnlyPost = (doc, post) => {
  const charLimit = LAYOUT.CHAR_LIMIT_NO_IMAGES;
  const { textHeight, textChunks } = calculateTextHeights(doc, post, charLimit);

  // center vertically
  const startY = Math.max((doc.page.height - textHeight) / 2, LAYOUT.MARGINS);
  doc.y = startY;

  renderTextElements(doc, post, textChunks);
};

const renderSingleImagePost = (doc, post) => {
  const charLimit = LAYOUT.CHAR_LIMIT_WITH_IMAGES;

  const { textHeight, gapAfterDate, textChunks } = calculateTextHeights(
    doc,
    post,
    charLimit,
  );

  const imagePath = post.pictures[0];
  if (!fs.existsSync(imagePath)) {
    console.error(`Image not found: ${imagePath}`);
    return;
  }
  const { width: origW, height: origH } = sizeOf(imagePath);
  const aspectRatio = origW / origH;

  const isWide = origW >= origH;

  // wide image case: centered with text content
  if (isWide) {
    const maxWidth = Math.min(531, doc.page.width - LAYOUT.MARGINS * 2);
    const scaledWidth = maxWidth;
    const scaledHeight = scaledWidth / aspectRatio;

    const totalContentHeight = textHeight + gapAfterDate + scaledHeight;
    const availableHeight = doc.page.height - LAYOUT.MARGINS * 2;

    if (totalContentHeight < availableHeight) {
      const startY = (doc.page.height - totalContentHeight) / 2;

      // render text
      doc.y = startY;
      renderTextElements(doc, post, textChunks);

      // gap after date
      doc.y += gapAfterDate;

      // render image, centered horizontally
      const imageX = (doc.page.width - scaledWidth) / 2;
      doc.image(imagePath, imageX, doc.y, {
        width: scaledWidth,
        height: scaledHeight,
      });
      return;
    }
  }

  // default case: tall image, whole height of doc
  doc.y = LAYOUT.MARGINS;
  renderTextElements(doc, post, textChunks);

  // calculate leftover space
  const leftoverSpace = doc.page.height - doc.y - LAYOUT.MARGINS;
  if (leftoverSpace <= 0) {
    console.log('No space left for image');
    return;
  }

  let imageHeight = leftoverSpace;
  let imageWidth = imageHeight * aspectRatio;

  const maxWidthFallback =
    doc.page.width - doc.page.margins.left - doc.page.margins.right;
  if (imageWidth > maxWidthFallback) {
    imageWidth = maxWidthFallback;
    imageHeight = imageWidth / aspectRatio;
  }

  // center vertically
  let verticalOffset = 0;
  if (imageHeight < leftoverSpace) {
    verticalOffset = (leftoverSpace - imageHeight) / 2;
  }

  // center horizontally
  const imageX = (doc.page.width - imageWidth) / 2;

  doc.image(imagePath, imageX, doc.y + verticalOffset, {
    width: imageWidth,
    height: imageHeight,
  });
};

const renderTwoImagePost = (doc, post) => {
  const charLimit = LAYOUT.CHAR_LIMIT_WITH_IMAGES;

  const formattedText = convertHtmlToFormattedText(post.body);
  const textChunks = splitTextIntoChunks(formattedText, charLimit);

  doc.y = LAYOUT.MARGINS;
  renderTextElements(doc, post, textChunks);

  // calculate leftover space
  const leftoverSpace = doc.page.height - doc.y - LAYOUT.MARGINS;
  if (leftoverSpace <= 0) {
    console.log('No space left for images');
    return;
  }

  const imageGap = LAYOUT.IMAGE_GAP;
  const maxImageWidth = Math.min(531, doc.page.width - LAYOUT.MARGINS * 2);

  // divide equally for two images
  const imageHeight = (leftoverSpace - imageGap) / 2;
  const imageWidth = maxImageWidth;

  // center horizontally
  const imageX = (doc.page.width - imageWidth) / 2;
  const imagePaths = post.pictures.slice(0, 2);

  // first image
  if (imagePaths[0]) {
    renderCroppedImage(
      doc,
      imagePaths[0],
      imageX,
      doc.y,
      imageWidth,
      imageHeight,
    );
  }

  doc.y += imageHeight + imageGap;

  // second image
  if (imagePaths[1]) {
    renderCroppedImage(
      doc,
      imagePaths[1],
      imageX,
      doc.y,
      imageWidth,
      imageHeight,
    );
  }
};

const renderThreeImagePost = (doc, post) => {
  const charLimit = LAYOUT.CHAR_LIMIT_WITH_IMAGES;

  const formattedText = convertHtmlToFormattedText(post.body);
  const textChunks = splitTextIntoChunks(formattedText, charLimit);

  doc.y = LAYOUT.MARGINS;
  renderTextElements(doc, post, textChunks);

  // calculate leftover space
  const leftoverSpace = doc.page.height - doc.y - LAYOUT.MARGINS;
  if (leftoverSpace <= 0) {
    console.log('No space left for images');
    return;
  }

  const imageGap = LAYOUT.IMAGE_GAP;

  // 60% to the top image, 40% to each bottom image
  const topImageHeight = (leftoverSpace - imageGap) * 0.6;
  const bottomImageHeight = (leftoverSpace - imageGap) * 0.4;

  const maxImageWidth = Math.min(531, doc.page.width - LAYOUT.MARGINS * 2);

  // full width for top image
  const topImageWidth = maxImageWidth;
  // half width for bottom images
  const bottomImageWidth = (maxImageWidth - imageGap) / 2;

  // center horizontally
  const topImageX = (doc.page.width - topImageWidth) / 2;
  const topImageY = doc.y;

  const imagePaths = post.pictures.slice(0, 3);

  // first image on top
  if (imagePaths[0]) {
    renderCroppedImage(
      doc,
      imagePaths[0],
      topImageX,
      topImageY,
      topImageWidth,
      topImageHeight,
    );
  }

  const bottomRowY = topImageY + topImageHeight + imageGap;

  const combinedBottomWidth = bottomImageWidth * 2 + imageGap;
  const bottomLeftX = (doc.page.width - combinedBottomWidth) / 2;

  // bottom left image
  if (imagePaths[1]) {
    renderCroppedImage(
      doc,
      imagePaths[1],
      bottomLeftX,
      bottomRowY,
      bottomImageWidth,
      bottomImageHeight,
    );
  }

  // bottom right image
  const bottomRightX = bottomLeftX + bottomImageWidth + imageGap;
  if (imagePaths[2]) {
    renderCroppedImage(
      doc,
      imagePaths[2],
      bottomRightX,
      bottomRowY,
      bottomImageWidth,
      bottomImageHeight,
    );
  }
};

const renderFourImagePost = (doc, post) => {
  const charLimit = LAYOUT.CHAR_LIMIT_WITH_IMAGES;

  const formattedText = convertHtmlToFormattedText(post.body);
  const textChunks = splitTextIntoChunks(formattedText, charLimit);

  doc.y = LAYOUT.MARGINS;
  renderTextElements(doc, post, textChunks);

  // calculate remaining space
  const leftoverSpace = doc.page.height - doc.y - LAYOUT.MARGINS;
  if (leftoverSpace <= 0) {
    console.log('No space left for images');
    return;
  }

  const maxGridWidth = Math.min(531, doc.page.width - LAYOUT.MARGINS * 2);

  // calculate cell dimensions
  const imageGap = LAYOUT.IMAGE_GAP;
  const cellWidth = (maxGridWidth - imageGap) / 2;
  const cellHeight = (leftoverSpace - imageGap) / 2;

  // center horizontally
  const gridX = (doc.page.width - maxGridWidth) / 2;
  const gridY = doc.y;

  const imagePaths = post.pictures.slice(0, 4);

  // top left image
  if (imagePaths[0]) {
    renderCroppedImage(doc, imagePaths[0], gridX, gridY, cellWidth, cellHeight);
  }

  // top right image
  if (imagePaths[1]) {
    renderCroppedImage(
      doc,
      imagePaths[1],
      gridX + cellWidth + imageGap,
      gridY,
      cellWidth,
      cellHeight,
    );
  }

  // bottom left image
  if (imagePaths[2]) {
    renderCroppedImage(
      doc,
      imagePaths[2],
      gridX,
      gridY + cellHeight + imageGap,
      cellWidth,
      cellHeight,
    );
  }

  // bottom right image
  if (imagePaths[3]) {
    renderCroppedImage(
      doc,
      imagePaths[3],
      gridX + cellWidth + imageGap,
      gridY + cellHeight + imageGap,
      cellWidth,
      cellHeight,
    );
  }
};

const createStoryPDF = () => {
  const doc = new PDFDocument({
    margins: {
      top: LAYOUT.MARGINS,
      bottom: LAYOUT.MARGINS,
      left: LAYOUT.MARGINS,
      right: LAYOUT.MARGINS,
    },
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
