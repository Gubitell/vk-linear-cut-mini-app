import { jsPDF } from "jspdf";

function formatNumber(value) {
  return Number(value).toLocaleString("ru-RU");
}

function formatLength(value, unit) {
  return `${formatNumber(value)} ${unit}`;
}

function formatRanges(numbers, prefix = "№") {
  if (numbers.length === 0) {
    return "";
  }

  const ranges = [];
  let start = numbers[0];
  let previous = numbers[0];

  for (let index = 1; index < numbers.length; index += 1) {
    const current = numbers[index];

    if (current === previous + 1) {
      previous = current;
      continue;
    }

    ranges.push(start === previous ? `${prefix}${start}` : `${prefix}${start}-${previous}`);
    start = current;
    previous = current;
  }

  ranges.push(start === previous ? `${prefix}${start}` : `${prefix}${start}-${previous}`);

  return ranges.join(", ");
}

function groupConsecutivePieces(pieces, cutWidth) {
  const groups = [];
  const cutPositions = [];
  let currentOffset = 0;
  let pieceIndex = 1;

  for (let index = 0; index < pieces.length; ) {
    const currentLength = pieces[index];
    const startPieceNumber = pieceIndex;
    let count = 0;

    while (index < pieces.length && pieces[index] === currentLength) {
      count += 1;
      currentOffset += currentLength;
      cutPositions.push(currentOffset);

      if (index < pieces.length - 1) {
        currentOffset += cutWidth;
      }

      index += 1;
      pieceIndex += 1;
    }

    groups.push({
      length: currentLength,
      count,
      startPieceNumber,
      endPieceNumber: pieceIndex - 1
    });
  }

  return { groups, cutPositions };
}

function getSchemeTitle(scheme) {
  const label = scheme.boardNumbers.length === 1 ? "Заготовка" : "Заготовки";
  return `Схема #${scheme.schemeNumber} • ${label} ${formatRanges(scheme.boardNumbers)}`;
}

function getTextSchemeLine(scheme, material) {
  const { groups } = groupConsecutivePieces(scheme.representativeBoard.pieces, Number(material.cutWidth || 0));
  const chunks = groups.map((group) => {
    const pieceLabel =
      group.startPieceNumber === group.endPieceNumber ? `№${group.startPieceNumber}` : `№${group.startPieceNumber}-${group.endPieceNumber}`;

    return `[ ${pieceLabel} ${formatLength(group.length, material.lengthUnit)}${group.count > 1 ? ` (x${group.count})` : ""} ]`;
  });

  return `${scheme.boardCount}x ${chunks.join(" ")} = ${formatLength(scheme.representativeBoard.usedLength, material.lengthUnit)}`;
}

function getZeroDimensionsLine(scheme, material) {
  const { cutPositions } = groupConsecutivePieces(scheme.representativeBoard.pieces, Number(material.cutWidth || 0));
  const values = [0, ...cutPositions];
  const formatted = values.map((value) => (value === 0 ? "0" : formatLength(value, material.lengthUnit)));

  return `${scheme.boardCount}x ( ${formatted.join(" | ")} )`;
}

function getSchemeTextBlock(scheme, material, includeZeroDimensions) {
  const lines = [getTextSchemeLine(scheme, material)];

  if (includeZeroDimensions) {
    lines.push("");
    lines.push("Размеры от нуля:");
    lines.push(getZeroDimensionsLine(scheme, material));
  }

  return lines;
}

function saveBlob(filename, type, content) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadTxtExport({ projectName, schemes, material, includeZeroDimensions }) {
  const lines = [
    projectName || "Раскрой",
    `Заготовка: ${formatLength(material.length, material.lengthUnit)}`,
    `Пропил: ${formatLength(material.cutWidth, material.lengthUnit)}`,
    ""
  ];

  schemes.forEach((scheme, index) => {
    lines.push(getSchemeTitle(scheme));
    lines.push(...getSchemeTextBlock(scheme, material, includeZeroDimensions));

    if (index < schemes.length - 1) {
      lines.push("");
      lines.push("");
    }
  });

  const safeName = (projectName || "raskroy").replace(/[^\wа-яА-Я.-]+/g, "_");
  saveBlob(`${safeName}.txt`, "text/plain;charset=utf-8", lines.join("\n"));
}

function drawWrappedText(doc, lines, x, y, maxWidth, lineHeight = 5) {
  let currentY = y;

  for (const line of lines) {
    const split = doc.splitTextToSize(line, maxWidth);

    if (split.length === 0) {
      currentY += lineHeight;
      continue;
    }

    doc.text(split, x, currentY);
    currentY += split.length * lineHeight;
  }

  return currentY;
}

function drawSchemeGraphic(doc, scheme, material, x, y, width) {
  const board = scheme.representativeBoard;
  const cutWidth = Number(material.cutWidth || 0);
  const materialLength = Number(material.length || 0);
  const { groups } = groupConsecutivePieces(board.pieces, cutWidth);
  const colors = [
    [38, 136, 235],
    [75, 179, 75],
    [255, 159, 26],
    [143, 63, 253],
    [230, 70, 70],
    [51, 181, 229]
  ];
  const height = 16;
  const boardScale = width / materialLength;
  let currentX = x;

  doc.setDrawColor(100, 104, 108);
  doc.setFillColor(236, 234, 217);
  doc.rect(x, y, width, height, "FD");

  groups.forEach((group, index) => {
    const groupLength = group.length * group.count + cutWidth * Math.max(group.count - 1, 0);
    const groupWidth = Math.max(groupLength * boardScale, 18);
    const [r, g, b] = colors[index % colors.length];
    const pieceLabel =
      group.startPieceNumber === group.endPieceNumber ? `№${group.startPieceNumber}` : `№${group.startPieceNumber}-${group.endPieceNumber}`;
    const line2 =
      group.count > 1 ? `${formatNumber(group.length)} ${material.lengthUnit} (x${group.count})` : `${formatNumber(group.length)} ${material.lengthUnit}`;

    doc.setFillColor(r, g, b);
    doc.rect(currentX, y, groupWidth, height, "F");
    doc.setTextColor(20, 20, 20);
    doc.setFontSize(8);
    doc.text(pieceLabel, currentX + groupWidth / 2, y + 6, { align: "center" });
    doc.text(line2, currentX + groupWidth / 2, y + 12, { align: "center" });

    currentX += groupWidth;
  });

  const wasteLength = Math.max(materialLength - board.usedLength, 0);
  if (wasteLength > 0) {
    const wasteWidth = wasteLength * boardScale;
    doc.setFillColor(215, 217, 220);
    doc.rect(x + width - wasteWidth, y, wasteWidth, height, "F");
  }

  doc.setTextColor(80, 80, 80);
  doc.setFontSize(9);
  doc.text(`${scheme.boardCount}x`, x - 6, y + 10, { align: "right" });
}

export function downloadPdfExport({ projectName, schemes, material, includeZeroDimensions, orientation }) {
  const doc = new jsPDF({
    orientation,
    unit: "mm",
    format: "a4"
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const usableWidth = pageWidth - margin * 2;

  schemes.forEach((scheme, index) => {
    if (index > 0) {
      doc.addPage();
    }

    let cursorY = margin;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(projectName || "Раскрой", margin, cursorY);
    cursorY += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(getSchemeTitle(scheme), margin, cursorY);
    cursorY += 6;
    doc.text(
      `Использовано ${formatLength(scheme.representativeBoard.usedLength, material.lengthUnit)} • Остаток ${formatLength(
        Math.max(Number(material.length) - scheme.representativeBoard.usedLength, 0),
        material.lengthUnit
      )}`,
      margin,
      cursorY
    );
    cursorY += 8;

    drawSchemeGraphic(doc, scheme, material, margin + 8, cursorY, usableWidth - 8);
    cursorY += 24;

    doc.setFontSize(10);
    const textLines = getSchemeTextBlock(scheme, material, includeZeroDimensions);
    cursorY = drawWrappedText(doc, textLines, margin, cursorY, usableWidth, 5);
    cursorY += 8;

    doc.setFontSize(9);
    const footerText = `Пропил: ${formatLength(material.cutWidth, material.lengthUnit)} • Формат: ${
      includeZeroDimensions ? "с размерами от нуля" : "без размеров от нуля"
    }`;
    drawWrappedText(doc, [footerText], margin, Math.min(cursorY, pageHeight - 12), usableWidth, 4.5);
  });

  const safeName = (projectName || "raskroy").replace(/[^\wа-яА-Я.-]+/g, "_");
  doc.save(`${safeName}.pdf`);
}
