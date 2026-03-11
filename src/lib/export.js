import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

function ensurePdfFonts() {
  if (typeof pdfMake.addVirtualFileSystem === "function") {
    pdfMake.addVirtualFileSystem(pdfFonts);
    return;
  }

  pdfMake.vfs = pdfFonts?.vfs ?? pdfFonts?.pdfMake?.vfs;
}

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

function getSchemeTextLine(scheme, blank) {
  const { groups } = groupConsecutivePieces(scheme.representativeBoard.pieces, Number(blank.cutWidth || 0));
  const parts = groups.map((group) => {
    const pieceLabel =
      group.startPieceNumber === group.endPieceNumber ? `№${group.startPieceNumber}` : `№${group.startPieceNumber}-${group.endPieceNumber}`;

    return `[ ${pieceLabel} ${formatLength(group.length, blank.lengthUnit)}${group.count > 1 ? ` (x${group.count})` : ""} ]`;
  });

  return `${scheme.boardCount}x ${parts.join(" ")} = ${formatLength(scheme.representativeBoard.usedLength, blank.lengthUnit)}`;
}

function getZeroDimensionsLine(scheme, blank) {
  const { cutPositions } = groupConsecutivePieces(scheme.representativeBoard.pieces, Number(blank.cutWidth || 0));
  const values = [0, ...cutPositions];
  const formatted = values.map((value) => (value === 0 ? "0" : formatLength(value, blank.lengthUnit)));

  return `${scheme.boardCount}x ( ${formatted.join(" | ")} )`;
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

function makeSafeFilename(value) {
  return (value || "raskroy").replace(/[^\wа-яА-Я.-]+/g, "_");
}

function buildGraphicTable(scheme, blank) {
  const { groups } = groupConsecutivePieces(scheme.representativeBoard.pieces, Number(blank.cutWidth || 0));
  const colors = ["#2688eb", "#4bb34b", "#ff9f1a", "#8f3ffd", "#e64646", "#33b5e5"];
  const widths = groups.map((group) => Math.max(group.length * group.count + blank.cutWidth * Math.max(group.count - 1, 0), 60));
  const body = [
    groups.map((group, index) => {
      const pieceLabel =
        group.startPieceNumber === group.endPieceNumber ? `№${group.startPieceNumber}` : `№${group.startPieceNumber}-${group.endPieceNumber}`;
      const lengthLabel =
        group.count > 1 ? `${formatNumber(group.length)} ${blank.lengthUnit} (x${group.count})` : `${formatNumber(group.length)} ${blank.lengthUnit}`;

      return {
        text: `${pieceLabel}\n${lengthLabel}`,
        alignment: "center",
        fillColor: colors[index % colors.length],
        color: "#111111",
        margin: [4, 8, 4, 8]
      };
    })
  ];

  return {
    table: {
      widths,
      body
    },
    layout: {
      hLineWidth: () => 1,
      vLineWidth: () => 1,
      hLineColor: () => "#64686c",
      vLineColor: () => "#64686c"
    }
  };
}

export function downloadTxtExport({ projectName, blank, schemes, includeZeroDimensions }) {
  const lines = [
    projectName || "Раскрой",
    `Заготовка: ${blank.name}`,
    `Длина: ${formatLength(blank.length, blank.lengthUnit)}`,
    `Пропил: ${formatLength(blank.cutWidth, blank.lengthUnit)}`,
    ""
  ];

  schemes.forEach((scheme, index) => {
    lines.push(getSchemeTitle(scheme));
    lines.push(getSchemeTextLine(scheme, blank));

    if (includeZeroDimensions) {
      lines.push("");
      lines.push("Размеры от нуля:");
      lines.push(getZeroDimensionsLine(scheme, blank));
    }

    if (index < schemes.length - 1) {
      lines.push("");
      lines.push("");
    }
  });

  saveBlob(`${makeSafeFilename(`${projectName}_${blank.name}`)}.txt`, "text/plain;charset=utf-8", lines.join("\n"));
}

export function downloadPdfExport({ projectName, blank, schemes, includeZeroDimensions, orientation }) {
  ensurePdfFonts();

  const content = [
    { text: projectName || "Раскрой", style: "title" },
    { text: `Заготовка: ${blank.name}`, style: "subtitle" },
    {
      text: `Длина ${formatLength(blank.length, blank.lengthUnit)} • Пропил ${formatLength(blank.cutWidth, blank.lengthUnit)}${
        blank.cost !== null ? ` • Цена ${formatNumber(blank.cost)} ${blank.currency}` : ""
      }`,
      margin: [0, 0, 0, 12]
    }
  ];

  schemes.forEach((scheme, index) => {
    content.push({ text: getSchemeTitle(scheme), style: "section" });
    content.push({
      text: `Использовано ${formatLength(scheme.representativeBoard.usedLength, blank.lengthUnit)} • Остаток ${formatLength(
        Math.max(blank.length - scheme.representativeBoard.usedLength, 0),
        blank.lengthUnit
      )}`,
      margin: [0, 0, 0, 8]
    });
    content.push(buildGraphicTable(scheme, blank));
    content.push({ text: getSchemeTextLine(scheme, blank), margin: [0, 8, 0, 0] });

    if (includeZeroDimensions) {
      content.push({ text: "Размеры от нуля:", margin: [0, 8, 0, 0] });
      content.push({ text: getZeroDimensionsLine(scheme, blank) });
    }

    if (index < schemes.length - 1) {
      content.push({ text: "", pageBreak: "after" });
    }
  });

  pdfMake
    .createPdf({
      pageOrientation: orientation,
      pageSize: "A4",
      pageMargins: [24, 24, 24, 24],
      defaultStyle: {
        font: "Roboto",
        fontSize: 10
      },
      styles: {
        title: {
          fontSize: 18,
          bold: true
        },
        subtitle: {
          fontSize: 12,
          bold: true,
          margin: [0, 4, 0, 6]
        },
        section: {
          fontSize: 12,
          bold: true,
          margin: [0, 12, 0, 6]
        }
      },
      content
    })
    .download(`${makeSafeFilename(`${projectName}_${blank.name}`)}.pdf`);
}
