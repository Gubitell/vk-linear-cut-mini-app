import { Caption, Div, Footnote, Text } from "@vkontakte/vkui";

function formatLength(value) {
  return `${Number(value).toLocaleString("ru-RU")} мм`;
}

function getSegmentColor(index) {
  const colors = ["#2688eb", "#4bb34b", "#ff9f1a", "#8f3ffd", "#e64646", "#33b5e5", "#ffaa00", "#795548"];
  return colors[index % colors.length];
}

export function BoardScheme({ board, materialLength, cutWidth }) {
  if (!board) {
    return null;
  }

  return (
    <Div className="board-card">
      <div className="board-card__header">
        <Text weight="2">Заготовка #{board.boardNumber}</Text>
        <Caption level="1" caps={false}>
          Использовано {formatLength(board.usedLength)} • Остаток {formatLength(board.wasteLength)}
        </Caption>
      </div>

      <div className="board-track">
        {board.pieces.map((piece, index) => {
          const pieceWidth = `${Math.max((piece / materialLength) * 100, 5)}%`;
          const kerfWidth = `${Math.max((cutWidth / materialLength) * 100, 0.5)}%`;

          return (
            <div className="board-track__chunk" key={`${board.boardNumber}-${index}-${piece}`}>
              <div className="board-track__piece" style={{ width: pieceWidth, background: getSegmentColor(index) }}>
                <span>{piece}</span>
              </div>
              {index < board.pieces.length - 1 && cutWidth > 0 ? (
                <div className="board-track__kerf" style={{ width: kerfWidth }} />
              ) : null}
            </div>
          );
        })}

        {board.wasteLength > 0 ? (
          <div
            className="board-track__waste"
            style={{
              width: `${Math.max((board.wasteLength / materialLength) * 100, 4)}%`
            }}
          >
            <span>{board.wasteLength}</span>
          </div>
        ) : null}
      </div>

      <Footnote>
        Пропил: {formatLength(cutWidth)}. Серый сегмент справа показывает остаток после раскроя.
      </Footnote>
    </Div>
  );
}
