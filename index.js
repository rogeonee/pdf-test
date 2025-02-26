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

  // Determine bottom margin based on QR code presence
  const bottomMargin = post.qrCode ? 100 : LAYOUT.MARGINS;

  // Calculate available height for text
  const availableHeight = doc.page.height - LAYOUT.MARGINS - bottomMargin;

  // Center text vertically within available height
  const centeredStartY = LAYOUT.MARGINS + (availableHeight - textHeight) / 2;
  const startY = Math.max(centeredStartY, LAYOUT.MARGINS);
  doc.y = startY;

  // Render the text
  renderTextElements(doc, post, textChunks);

  // Render QR code and label if present
  if (post.qrCode) {
    const qrSize = 90;
    const qrX = doc.page.width - 5 - qrSize;
    const qrY = doc.page.height - bottomMargin + (bottomMargin - qrSize) / 2;

    // Render label
    const labelText = 'See more digital content here =>';
    doc.fontSize(13);
    const labelWidth = doc.widthOfString(labelText);
    const labelX = qrX - labelWidth - 5;
    const labelY = qrY + (qrSize - doc.currentLineHeight()) / 2;
    doc.text(labelText, labelX, labelY, { align: 'left' });

    // Render QR code
    doc.image(post.qrCode, qrX, qrY, { width: qrSize, height: qrSize });
  }
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

  // Set bottom margin: 100 if QR code exists, otherwise use default
  const bottomMargin = post.qrCode ? 100 : LAYOUT.MARGINS;

  // Wide image case: centered with text content
  if (isWide) {
    const maxWidth = Math.min(531, doc.page.width - LAYOUT.MARGINS * 2);
    const scaledWidth = maxWidth;
    const scaledHeight = scaledWidth / aspectRatio;

    const totalContentHeight = textHeight + gapAfterDate + scaledHeight;
    const availableHeight = doc.page.height - LAYOUT.MARGINS - bottomMargin;

    if (totalContentHeight < availableHeight) {
      const startY = (doc.page.height - totalContentHeight) / 2;

      // Render text
      doc.y = startY;
      renderTextElements(doc, post, textChunks);

      // Gap after date
      doc.y += gapAfterDate;

      // Render image, centered horizontally
      const imageX = (doc.page.width - scaledWidth) / 2;
      doc.image(imagePath, imageX, doc.y, {
        width: scaledWidth,
        height: scaledHeight,
      });

      // Render QR code and label if present
      if (post.qrCode) {
        const qrSize = 90;
        const qrX = doc.page.width - 5 - qrSize;
        const qrY =
          doc.page.height - bottomMargin + (bottomMargin - qrSize) / 2;

        // Render label
        const labelText = 'See more digital content here =>';
        doc.fontSize(13);
        const labelWidth = doc.widthOfString(labelText);
        const labelX = qrX - labelWidth - 5;
        const labelY = qrY + (qrSize - doc.currentLineHeight()) / 2;
        doc.text(labelText, labelX, labelY, { align: 'left' });

        // Render QR code
        doc.image(post.qrCode, qrX, qrY, { width: qrSize, height: qrSize });
      }
      return;
    }
  }

  // Default case: tall image, whole height of doc
  doc.y = LAYOUT.MARGINS;
  renderTextElements(doc, post, textChunks);

  // Calculate leftover space with dynamic bottom margin
  const leftoverSpace = doc.page.height - doc.y - bottomMargin;
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

  // Center vertically
  let verticalOffset = 0;
  if (imageHeight < leftoverSpace) {
    verticalOffset = (leftoverSpace - imageHeight) / 2;
  }

  // Center horizontally
  const imageX = (doc.page.width - imageWidth) / 2;

  doc.image(imagePath, imageX, doc.y + verticalOffset, {
    width: imageWidth,
    height: imageHeight,
  });

  // Render QR code and label if present
  if (post.qrCode) {
    const qrSize = 90;
    const qrX = doc.page.width - 5 - qrSize;
    const qrY = doc.page.height - bottomMargin + (bottomMargin - qrSize) / 2;

    // Render label
    const labelText = 'See more digital content here =>';
    doc.fontSize(13);
    const labelWidth = doc.widthOfString(labelText);
    const labelX = qrX - labelWidth - 5;
    const labelY = qrY + (qrSize - doc.currentLineHeight()) / 2;
    doc.text(labelText, labelX, labelY, { align: 'left' });

    // Render QR code
    doc.image(post.qrCode, qrX, qrY, { width: qrSize, height: qrSize });
  }
};

const renderTwoImagePost = (doc, post) => {
  const charLimit = LAYOUT.CHAR_LIMIT_WITH_IMAGES;

  const formattedText = convertHtmlToFormattedText(post.body);
  const textChunks = splitTextIntoChunks(formattedText, charLimit);

  doc.y = LAYOUT.MARGINS;
  renderTextElements(doc, post, textChunks);

  // Set bottom margin: 100 if QR code exists, otherwise use default
  const bottomMargin = post.qrCode ? 100 : LAYOUT.MARGINS;

  // Calculate leftover space with dynamic bottom margin
  const leftoverSpace = doc.page.height - doc.y - bottomMargin;
  if (leftoverSpace <= 0) {
    console.log('No space left for images');
    return;
  }

  const imageGap = LAYOUT.IMAGE_GAP;
  const maxImageWidth = Math.min(531, doc.page.width - LAYOUT.MARGINS * 2);

  // Divide equally for two images
  const imageHeight = (leftoverSpace - imageGap) / 2;
  const imageWidth = maxImageWidth;

  // Center horizontally
  const imageX = (doc.page.width - imageWidth) / 2;
  const imagePaths = post.pictures.slice(0, 2);

  // First image
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

  // Second image
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

  // Render QR code and label if present
  if (post.qrCode) {
    const qrSize = 90;
    const qrX = doc.page.width - 5 - qrSize;
    const qrY = doc.page.height - bottomMargin + (bottomMargin - qrSize) / 2;

    // Render label
    const labelText = 'See more digital content here =>';
    doc.fontSize(13);
    const labelWidth = doc.widthOfString(labelText);
    const labelX = qrX - labelWidth - 5; // 5-unit gap between label and QR code
    const labelY = qrY + (qrSize - doc.currentLineHeight()) / 2;
    doc.text(labelText, labelX, labelY, { align: 'left' });

    // Render QR code
    doc.image(post.qrCode, qrX, qrY, { width: qrSize, height: qrSize });
  }
};

const renderThreeImagePost = (doc, post) => {
  const charLimit = LAYOUT.CHAR_LIMIT_WITH_IMAGES;

  const formattedText = convertHtmlToFormattedText(post.body);
  const textChunks = splitTextIntoChunks(formattedText, charLimit);

  // Set initial y-position
  doc.y = LAYOUT.MARGINS;
  renderTextElements(doc, post, textChunks);

  // Determine bottom margin based on QR code presence
  const bottomMargin = post.qrCode ? 100 : LAYOUT.MARGINS;

  // Calculate remaining space for images
  const leftoverSpace = doc.page.height - doc.y - bottomMargin;
  if (leftoverSpace <= 0) {
    console.log('No space left for images');
    return;
  }

  const imageGap = LAYOUT.IMAGE_GAP;

  // 60% to the top image, 40% to the bottom row
  const topImageHeight = (leftoverSpace - imageGap) * 0.6;
  const bottomImageHeight = (leftoverSpace - imageGap) * 0.4;

  const maxImageWidth = Math.min(531, doc.page.width - LAYOUT.MARGINS * 2);

  // Full width for top image
  const topImageWidth = maxImageWidth;
  // Half width for bottom images
  const bottomImageWidth = (maxImageWidth - imageGap) / 2;

  // Center top image horizontally
  const topImageX = (doc.page.width - topImageWidth) / 2;
  const topImageY = doc.y;

  const imagePaths = post.pictures.slice(0, 3);

  // Render top image
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

  // Calculate bottom row position
  const bottomRowY = topImageY + topImageHeight + imageGap;

  // Center bottom row horizontally
  const combinedBottomWidth = bottomImageWidth * 2 + imageGap;
  const bottomLeftX = (doc.page.width - combinedBottomWidth) / 2;

  // Render bottom left image
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

  // Render bottom right image
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

  // Add QR code and label if present
  if (post.qrCode) {
    const qrSize = 90;
    const qrX = doc.page.width - 5 - qrSize;
    const qrY = doc.page.height - bottomMargin + (bottomMargin - qrSize) / 2; // Center vertically in the 100px space

    // Render label
    const labelText = 'See more digital content here =>';
    doc.fontSize(13);
    const labelWidth = doc.widthOfString(labelText);
    const labelX = qrX - labelWidth - 5; // 5px gap between label and QR code
    const labelY = qrY + (qrSize - doc.currentLineHeight()) / 2; // Vertically align with QR code
    doc.text(labelText, labelX, labelY, { align: 'left' });

    // Render QR code
    doc.image(post.qrCode, qrX, qrY, { width: qrSize, height: qrSize });
  }
};

const renderFourImagePost = (doc, post) => {
  const charLimit = LAYOUT.CHAR_LIMIT_WITH_IMAGES;

  const formattedText = convertHtmlToFormattedText(post.body);
  const textChunks = splitTextIntoChunks(formattedText, charLimit);

  // Set initial y-position
  doc.y = LAYOUT.MARGINS;
  renderTextElements(doc, post, textChunks);

  // Determine bottom margin based on QR code presence
  const bottomMargin = post.qrCode ? 100 : LAYOUT.MARGINS;

  // Calculate remaining space for images
  const leftoverSpace = doc.page.height - doc.y - bottomMargin;
  if (leftoverSpace <= 0) {
    console.log('No space left for images');
    return;
  }

  const maxGridWidth = Math.min(531, doc.page.width - LAYOUT.MARGINS * 2);

  // Calculate cell dimensions for images
  const imageGap = LAYOUT.IMAGE_GAP;
  const cellWidth = (maxGridWidth - imageGap) / 2;
  const cellHeight = (leftoverSpace - imageGap) / 2;

  // Center the image grid horizontally
  const gridX = (doc.page.width - maxGridWidth) / 2;
  const gridY = doc.y;

  const imagePaths = post.pictures.slice(0, 4);

  // Render top left image
  if (imagePaths[0]) {
    renderCroppedImage(doc, imagePaths[0], gridX, gridY, cellWidth, cellHeight);
  }

  // Render top right image
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

  // Render bottom left image
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

  // Render bottom right image
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

  // Add QR code and label if present
  if (post.qrCode) {
    const qrSize = 90;
    const qrX = doc.page.width - 5 - qrSize;
    const qrY = doc.page.height - bottomMargin + (bottomMargin - qrSize) / 2; // Center vertically in the 100px space

    // Render label
    const labelText = 'See more digital content here =>';
    doc.fontSize(13);
    const labelWidth = doc.widthOfString(labelText);
    const labelX = qrX - labelWidth - 5;
    const labelY = qrY + (qrSize - doc.currentLineHeight()) / 2; // Vertically align with QR code
    doc.text(labelText, labelX, labelY, { align: 'left' });

    // Render QR code
    doc.image(post.qrCode, qrX, qrY, { width: qrSize, height: qrSize });
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
