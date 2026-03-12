import React, { useEffect, useMemo, useRef, useState } from "react";
import { Caption, Div, Footnote, Text } from "@vkontakte/vkui";

const MIN_SEGMENT_WIDTH = 56;
const MIN_GROUP_PADDING = 18;
const KERF_DISPLAY_WIDTH = 6;
const RULER_TEXT_COLOR = "#a0a4a8";
const RULER_LINE_COLOR = "#8e949a";
const RULER_GAP_BEFORE_MARKER = 14;

function formatNumber(value) {
  return new Intl.NumberFormat("ru-RU", {
    useGrouping: false,
    maximumFractionDigits: 10
  }).format(Number(value));
}

function formatLength(value, unit) {
  return `${formatNumber(value)} ${unit}`;
}

function getSegmentColor(index) {
  const colors = ["#2688eb", "#4bb34b", "#ff9f1a", "#8f3ffd", "#e64646", "#33b5e5", "#ffaa00", "#795548"];
  return colors[index % colors.length];
}

function getBoardsLabel(numbers) {
  const title = numbers.length === 1 ? "Заготовка" : "Заготовки";
  return `${title} ${formatRanges(numbers)}`;
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

function buildPieceGroups(pieces, cutWidth) {
  const groups = [];
  const cutPositions = [];
  let currentOffset = 0;
  let pieceIndex = 1;

  for (let index = 0; index < pieces.length; ) {
    const currentLength = pieces[index];
    const startPieceNumber = pieceIndex;
    const startOffset = currentOffset;
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
      endPieceNumber: pieceIndex - 1,
      startOffset,
      endOffset: currentOffset - (index < pieces.length ? cutWidth : 0)
    });
  }

  return { groups, cutPositions };
}

function estimateTextWidth(group, lengthUnit) {
  const line1 = group.startPieceNumber === group.endPieceNumber ? `№${group.startPieceNumber}` : `№${group.startPieceNumber}-${group.endPieceNumber}`;
  const line2 = group.count > 1 ? `${formatNumber(group.length)} ${lengthUnit} (x${group.count})` : `${formatNumber(group.length)} ${lengthUnit}`;
  const longestLineLength = Math.max(line1.length, line2.length);

  return longestLineLength * 8 + MIN_GROUP_PADDING * 2;
}

function buildDisplayModel(groups, cutWidth, materialLength, displayWasteLength, lengthUnit) {
  const baseScale = 0.12;
  const kerfWidth = cutWidth > 0 ? KERF_DISPLAY_WIDTH : 0;
  let cursor = 0;
  const cutPositions = [];

  const displayGroups = groups.map((group) => {
    const minGroupWidth = estimateTextWidth(group, lengthUnit);
    const scaledPieceWidth = Math.max(group.length * baseScale, MIN_SEGMENT_WIDTH);
    const segmentWidth = Math.max(
      scaledPieceWidth,
      (minGroupWidth - kerfWidth * Math.max(group.count - 1, 0)) / group.count
    );
    const groupWidth = segmentWidth * group.count + kerfWidth * Math.max(group.count - 1, 0);
    const startX = cursor;
    let localCursor = startX;

    for (let index = 0; index < group.count; index += 1) {
      localCursor += segmentWidth;
      cutPositions.push(localCursor);

      if (index < group.count - 1) {
        localCursor += kerfWidth;
      }
    }

    cursor = startX + groupWidth;

    return {
      ...group,
      startX,
      groupWidth,
      segmentWidth,
      labelLine1:
        group.startPieceNumber === group.endPieceNumber ? `№${group.startPieceNumber}` : `№${group.startPieceNumber}-${group.endPieceNumber}`,
      labelLine2:
        group.count > 1 ? `${formatNumber(group.length)} ${lengthUnit} (x${group.count})` : `${formatNumber(group.length)} ${lengthUnit}`
    };
  });

  const wasteWidth = displayWasteLength > 0 ? Math.max(displayWasteLength * baseScale, MIN_SEGMENT_WIDTH * 1.2) : 0;
  const totalWidth = cursor + wasteWidth;
  const displayCutPositions = cutPositions.map((position) => position);

  return {
    displayGroups,
    cutPositions: displayCutPositions,
    kerfWidth,
    wasteWidth,
    totalWidth
  };
}

function getTextLayout(groups, board, lengthUnit, boardCount) {
  const chunks = groups.map((group) => {
    const label =
      group.startPieceNumber === group.endPieceNumber ? `№${group.startPieceNumber}` : `№${group.startPieceNumber}-${group.endPieceNumber}`;

    return `[ ${label} ${formatLength(group.length, lengthUnit)}${group.count > 1 ? ` (x${group.count})` : ""} ]`;
  });

  return `${boardCount}x ${chunks.join(" ")} = ${formatLength(board.usedLength, lengthUnit)}`;
}

function getZeroDimensionsText(cutPositions, scheme, lengthUnit) {
  const values = [0, ...cutPositions.map((value) => Math.round(value * 1000) / 1000)];
  const formatted = values.map((value) => (value === 0 ? "0" : formatLength(value, lengthUnit)));

  return `${scheme.boardCount}x ( ${formatted.join(" | ")} )`;
}

function buildRulerSegments(startX, endX, markerPositions) {
  if (markerPositions.length === 0) {
    return [{ x1: startX, x2: endX }];
  }

  const segments = [];
  let currentStart = startX;

  for (const markerX of markerPositions) {
    const segmentEnd = Math.max(currentStart, markerX - RULER_GAP_BEFORE_MARKER);

    if (segmentEnd > currentStart) {
      segments.push({ x1: currentStart, x2: segmentEnd });
    }

    currentStart = markerX;
  }

  if (currentStart < endX) {
    segments.push({ x1: currentStart, x2: endX });
  }

  return segments;
}

function clampTransform(scale, x, y, viewportWidth, viewportHeight, contentWidth, contentHeight) {
  const scaledWidth = contentWidth * scale;
  const scaledHeight = contentHeight * scale;

  let nextX = x;
  let nextY = y;

  if (scaledWidth <= viewportWidth) {
    nextX = (viewportWidth - scaledWidth) / 2;
  } else {
    const minX = viewportWidth - scaledWidth;
    nextX = Math.min(0, Math.max(minX, x));
  }

  if (scaledHeight <= viewportHeight) {
    nextY = (viewportHeight - scaledHeight) / 2;
  } else {
    const minY = viewportHeight - scaledHeight;
    nextY = Math.min(0, Math.max(minY, y));
  }

  return { scale, x: nextX, y: nextY };
}

export function BoardScheme({ scheme, materialLength, cutWidth, lengthUnit }) {
  const viewportRef = useRef(null);
  const viewRef = useRef({ scale: 1, x: 0, y: 0 });
  const pointerStateRef = useRef({
    activePointerId: null,
    dragStartX: 0,
    dragStartY: 0,
    originX: 0,
    originY: 0
  });
  const pinchStateRef = useRef({
    pointers: new Map(),
    startDistance: 0,
    startScale: 1,
    startX: 0,
    startY: 0,
    centerX: 0,
    centerY: 0
  });
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 280 });
  const [view, setView] = useState({ scale: 1, x: 0, y: 0 });

  if (!scheme) {
    return null;
  }

  const board = scheme.representativeBoard;
  const displayWasteLength = Math.max(materialLength - board.usedLength, 0);
  const { groups, cutPositions: rawCutPositions } = buildPieceGroups(board.pieces, cutWidth);
  const { displayGroups, cutPositions, wasteWidth, totalWidth } = buildDisplayModel(
    groups,
    cutWidth,
    materialLength,
    displayWasteLength,
    lengthUnit
  );
  const svgWidth = Math.max(860, totalWidth + 120);
  const svgHeight = 210;
  const barX = 40;
  const barY = 36;
  const barHeight = 52;
  const rulerBaseY = 164;
  const barEndX = barX + totalWidth;
  const markerXs = cutPositions.map((position) => barX + position);
  const rulerSegments = buildRulerSegments(barX, barEndX, markerXs);
  const minScale = useMemo(() => {
    if (!viewportSize.width) {
      return 1;
    }

    return Math.min(1, viewportSize.width / svgWidth);
  }, [viewportSize.width, svgWidth]);
  const maxScale = Math.max(minScale * 4, 4);

  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  useEffect(() => {
    const node = viewportRef.current;

    if (!node) {
      return undefined;
    }

    const updateSize = () => {
      setViewportSize({
        width: node.clientWidth,
        height: node.clientHeight
      });
    };

    updateSize();

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(updateSize);
      observer.observe(node);
      return () => observer.disconnect();
    }

    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    if (!viewportSize.width) {
      return;
    }

    const nextScale = minScale;
    const centered = clampTransform(nextScale, 0, 0, viewportSize.width, viewportSize.height, svgWidth, svgHeight);
    setView({
      scale: nextScale,
      x: centered.x,
      y: centered.y
    });
  }, [scheme.schemeNumber, svgWidth, svgHeight, viewportSize.width, viewportSize.height, minScale]);

  function updateView(updater) {
    setView((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;
      return clampTransform(next.scale, next.x, next.y, viewportSize.width, viewportSize.height, svgWidth, svgHeight);
    });
  }

  function zoomAt(clientX, clientY, scaleFactor) {
    if (!viewportRef.current || !viewportSize.width) {
      return;
    }

    const rect = viewportRef.current.getBoundingClientRect();
    const pointX = clientX - rect.left;
    const pointY = clientY - rect.top;

    updateView((current) => {
      const nextScale = Math.max(minScale, Math.min(maxScale, current.scale * scaleFactor));
      const scaleRatio = nextScale / current.scale;
      const nextX = pointX - (pointX - current.x) * scaleRatio;
      const nextY = pointY - (pointY - current.y) * scaleRatio;

      return {
        scale: nextScale,
        x: nextX,
        y: nextY
      };
    });
  }

  function resetView() {
    if (!viewportSize.width) {
      return;
    }

    const centered = clampTransform(minScale, 0, 0, viewportSize.width, viewportSize.height, svgWidth, svgHeight);
    setView({
      scale: minScale,
      x: centered.x,
      y: centered.y
    });
  }

  function handleWheel(event) {
    event.preventDefault();
    const scaleFactor = event.deltaY < 0 ? 1.1 : 0.9;
    zoomAt(event.clientX, event.clientY, scaleFactor);
  }

  function handlePointerDown(event) {
    if (!viewportRef.current) {
      return;
    }

    try {
      if (typeof viewportRef.current.setPointerCapture === "function") {
        viewportRef.current.setPointerCapture(event.pointerId);
      }
    } catch {
      // Ignore pointer capture issues in browsers that partially support it.
    }

    const pinchState = pinchStateRef.current;
    pinchState.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pinchState.pointers.size === 2) {
      const [first, second] = [...pinchState.pointers.values()];
      pinchState.startDistance = Math.hypot(second.x - first.x, second.y - first.y);
      pinchState.startScale = viewRef.current.scale;
      pinchState.startX = viewRef.current.x;
      pinchState.startY = viewRef.current.y;
      pinchState.centerX = (first.x + second.x) / 2;
      pinchState.centerY = (first.y + second.y) / 2;
      return;
    }

    pointerStateRef.current = {
      activePointerId: event.pointerId,
      dragStartX: event.clientX,
      dragStartY: event.clientY,
      originX: viewRef.current.x,
      originY: viewRef.current.y
    };
  }

  function handlePointerMove(event) {
    const pinchState = pinchStateRef.current;

    if (pinchState.pointers.has(event.pointerId)) {
      pinchState.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    }

    if (pinchState.pointers.size === 2) {
      const [first, second] = [...pinchState.pointers.values()];
      const distance = Math.hypot(second.x - first.x, second.y - first.y);

      if (!pinchState.startDistance) {
        return;
      }

      const rect = viewportRef.current.getBoundingClientRect();
      const centerX = pinchState.centerX - rect.left;
      const centerY = pinchState.centerY - rect.top;
      const nextScale = Math.max(minScale, Math.min(maxScale, pinchState.startScale * (distance / pinchState.startDistance)));
      const scaleRatio = nextScale / pinchState.startScale;

      updateView({
        scale: nextScale,
        x: centerX - (centerX - pinchState.startX) * scaleRatio,
        y: centerY - (centerY - pinchState.startY) * scaleRatio
      });
      return;
    }

    if (pointerStateRef.current.activePointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - pointerStateRef.current.dragStartX;
    const deltaY = event.clientY - pointerStateRef.current.dragStartY;

    updateView({
      scale: viewRef.current.scale,
      x: pointerStateRef.current.originX + deltaX,
      y: pointerStateRef.current.originY + deltaY
    });
  }

  function handlePointerUp(event) {
    try {
      if (viewportRef.current && typeof viewportRef.current.releasePointerCapture === "function") {
        viewportRef.current.releasePointerCapture(event.pointerId);
      }
    } catch {
      // Ignore capture release issues.
    }

    pinchStateRef.current.pointers.delete(event.pointerId);

    if (pointerStateRef.current.activePointerId === event.pointerId) {
      pointerStateRef.current.activePointerId = null;
    }

    if (pinchStateRef.current.pointers.size < 2) {
      pinchStateRef.current.startDistance = 0;
    }
  }

  return (
    <Div className="board-card">
      <div className="board-card__header">
        <Text weight="2">
          Схема #{scheme.schemeNumber} • {getBoardsLabel(scheme.boardNumbers)}
        </Text>
        <Caption level="1" caps={false}>
          Повторений: {scheme.boardCount} • Использовано {formatLength(board.usedLength, lengthUnit)} • Остаток{" "}
          {formatLength(displayWasteLength, lengthUnit)}
        </Caption>
      </div>

      <div className="board-toolbar">
        <Text className="muted-text">Масштаб: {view.scale.toFixed(2)}x</Text>
        <div className="compact-actions">
          <button className="board-toolbar__button" type="button" onClick={() => updateView((current) => ({ ...current, scale: Math.max(minScale, current.scale / 1.15) }))}>
            -
          </button>
          <button className="board-toolbar__button" type="button" onClick={() => updateView((current) => ({ ...current, scale: Math.min(maxScale, current.scale * 1.15) }))}>
            +
          </button>
          <button className="board-toolbar__button" type="button" onClick={resetView}>
            Сброс
          </button>
        </div>
      </div>

      <div
        ref={viewportRef}
        className="board-viewport"
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div
          className="board-canvas"
          style={{
            width: `${svgWidth}px`,
            height: `${svgHeight}px`,
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`
          }}
        >
          <svg
            width={svgWidth}
            height={svgHeight}
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            role="img"
            aria-label={`Схема ${scheme.schemeNumber}`}
          >
          <rect x={barX} y={barY} width={totalWidth} height={barHeight} fill="#ecead9" stroke="#64686c" strokeWidth="1" />

          {displayGroups.map((group, index) => {
            const x = barX + group.startX;
            const fill = getSegmentColor(index);

            return (
              <g key={`${scheme.schemeNumber}-${group.startPieceNumber}-${group.length}-${group.count}`}>
                <rect x={x} y={barY} width={group.groupWidth} height={barHeight} fill={fill} opacity="0.9" />
                <line x1={x} y1={barY} x2={x} y2={barY + barHeight} stroke="#4f4f4f" strokeWidth="1" />
                <text x={x + group.groupWidth / 2} y={barY + 21} textAnchor="middle" fontSize="13" fill="#111315">
                  {group.labelLine1}
                </text>
                <text x={x + group.groupWidth / 2} y={barY + 39} textAnchor="middle" fontSize="13" fill="#111315">
                  {group.labelLine2}
                </text>
              </g>
            );
          })}

          {displayWasteLength > 0 ? (
            <rect
              x={barX + totalWidth - wasteWidth}
              y={barY}
              width={wasteWidth}
              height={barHeight}
              fill="#d7d9dc"
              stroke="#8e949a"
              strokeDasharray="5 3"
            />
          ) : null}

          <text x={barX - 8} y={barY + 32} textAnchor="end" fontSize="18" fill={RULER_TEXT_COLOR}>
            {scheme.boardCount}x
          </text>

          {rulerSegments.map((segment, index) => (
            <line
              key={`${scheme.schemeNumber}-ruler-segment-${index + 1}`}
              x1={segment.x1}
              y1={rulerBaseY}
              x2={segment.x2}
              y2={rulerBaseY}
              stroke={RULER_LINE_COLOR}
              strokeWidth="1"
            />
          ))}

          {cutPositions.map((position, index) => {
            const x = barX + position;
            const actualValue = rawCutPositions[index];

            return (
              <g key={`${scheme.schemeNumber}-cut-marker-${index + 1}`}>
                <line x1={x} y1={barY + barHeight + 2} x2={x} y2={rulerBaseY + 4} stroke={RULER_LINE_COLOR} strokeDasharray="4 3" />
                <path
                  d={`M ${x - 12} ${rulerBaseY - 4} L ${x - 7} ${rulerBaseY} L ${x - 12} ${rulerBaseY + 4}`}
                  fill="none"
                  stroke={RULER_LINE_COLOR}
                  strokeWidth="1"
                />
                <text x={x - 6} y={rulerBaseY - 10} textAnchor="end" fontSize="12" fill={RULER_TEXT_COLOR}>
                  {formatLength(actualValue, lengthUnit)}
                </text>
              </g>
            );
          })}

            <line x1={barEndX} y1={barY + barHeight + 2} x2={barEndX} y2={rulerBaseY + 4} stroke={RULER_LINE_COLOR} strokeDasharray="4 3" />
            <text x={barEndX} y={rulerBaseY + 18} textAnchor="end" fontSize="13" fill={RULER_TEXT_COLOR}>
              {formatLength(materialLength, lengthUnit)}
            </text>
          </svg>
        </div>
      </div>

      <Footnote>
        Пропил: {formatLength(cutWidth, lengthUnit)}. Колесо мыши и тачпад меняют масштаб, перетаскивание двигает
        схему, на смартфоне работают drag и pinch-to-zoom.
      </Footnote>

      <div className="scheme-text-block">
        <Text className="scheme-text-line">{getTextLayout(groups, board, lengthUnit, scheme.boardCount)}</Text>
        <div className="scheme-text-spacer" />
        <Text weight="2">Размеры от нуля:</Text>
        <Text className="scheme-text-line">{getZeroDimensionsText(rawCutPositions, scheme, lengthUnit)}</Text>
      </div>
    </Div>
  );
}
