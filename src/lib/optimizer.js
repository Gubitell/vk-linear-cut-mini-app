function round3(value) {
  return Math.round(value * 1000) / 1000;
}

function toNumber(value, fallback = 0) {
  const next = Number(value);

  if (!Number.isFinite(next)) {
    return fallback;
  }

  return next;
}

export function normalizeDetails(details) {
  return details
    .map((detail) => ({
      length: toNumber(detail.length),
      quantity: Math.trunc(toNumber(detail.quantity))
    }))
    .filter((detail) => detail.length > 0 && detail.quantity > 0);
}

export function calculateCutting(materialLength, cutWidth, details, materialCost = 0) {
  const normalizedMaterialLength = toNumber(materialLength);
  const normalizedCutWidth = Math.max(0, toNumber(cutWidth));
  const normalizedMaterialCost = Math.max(0, toNumber(materialCost));
  const normalizedDetails = normalizeDetails(details);

  if (normalizedMaterialLength <= 0) {
    return {
      error: "Длина материала должна быть больше 0"
    };
  }

  if (normalizedDetails.length === 0) {
    return {
      error: "Добавь хотя бы одну деталь"
    };
  }

  const pieces = [];
  const detailSummary = new Map();

  for (const detail of normalizedDetails) {
    const { length, quantity } = detail;

    if (length > normalizedMaterialLength) {
      return {
        error: `Деталь длиной ${length} мм превышает длину материала ${normalizedMaterialLength} мм`
      };
    }

    for (let index = 0; index < quantity; index += 1) {
      pieces.push(length);
    }

    detailSummary.set(length, (detailSummary.get(length) ?? 0) + quantity);
  }

  pieces.sort((left, right) => right - left);

  const boards = [];

  for (const piece of pieces) {
    let placed = false;

    for (const board of boards) {
      if (board.remaining >= piece + normalizedCutWidth) {
        board.pieces.push(piece);
        board.remaining -= piece + normalizedCutWidth;
        placed = true;
        break;
      }
    }

    if (!placed) {
      boards.push({
        pieces: [piece],
        remaining: normalizedMaterialLength - piece - normalizedCutWidth
      });
    }
  }

  const boardCount = boards.length;
  const totalMaterialUsed = boardCount * normalizedMaterialLength;
  const totalPiecesLength = pieces.reduce((sum, piece) => sum + piece, 0);

  let totalCuts = 0;

  for (const board of boards) {
    const piecesCount = board.pieces.length;
    totalCuts += board.remaining === 0 ? piecesCount - 1 : piecesCount;
  }

  const totalCutWaste = totalCuts * normalizedCutWidth;
  const totalWaste = boards.reduce((sum, board) => sum + board.remaining, 0) + totalCutWaste;
  const wastePercent = totalMaterialUsed > 0 ? (totalWaste / totalMaterialUsed) * 100 : 0;
  const benefitPercent = 100 - wastePercent;

  const boardsDetail = boards.map((board, index) => ({
    boardNumber: index + 1,
    pieces: board.pieces,
    usedLength: board.pieces.reduce((sum, piece) => sum + piece, 0) + (board.pieces.length - 1) * normalizedCutWidth,
    wasteLength: Math.max(0, board.remaining)
  }));

  const detailsList = [...detailSummary.entries()]
    .sort((left, right) => left[0] - right[0])
    .map(([length, quantity]) => ({
      length,
      quantity
    }));

  return {
    boardCount,
    materialLength: normalizedMaterialLength,
    totalMaterialUsed,
    totalPiecesLength,
    totalWaste: Math.trunc(totalWaste),
    wastePercent: round3(wastePercent),
    benefitPercent: round3(benefitPercent),
    cutsCount: totalCuts,
    boards: boardsDetail,
    details: detailsList,
    cost: normalizedMaterialCost > 0 ? round3(boardCount * normalizedMaterialCost) : null
  };
}

export function summarizeResult(material, result) {
  const parts = [
    `Материал: ${material.length} мм`,
    `Пропил: ${material.cutWidth} мм`,
    `Заготовок: ${result.boardCount}`,
    `Польза: ${result.benefitPercent}%`,
    `Отходы: ${result.wastePercent}% (${result.totalWaste} мм)`,
    `Резов: ${result.cutsCount}`
  ];

  if (result.cost !== null) {
    parts.push(`Стоимость: ${result.cost}`);
  }

  return parts.join("\n");
}
