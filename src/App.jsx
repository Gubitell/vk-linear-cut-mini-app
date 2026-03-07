import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  ButtonGroup,
  Card,
  CardGrid,
  Div,
  FormItem,
  Group,
  Header,
  Input,
  Panel,
  PanelHeader,
  PanelHeaderBack,
  Placeholder,
  Separator,
  SimpleCell,
  SplitCol,
  SplitLayout,
  Text,
  Title,
  View
} from "@vkontakte/vkui";
import { runTapticImpactOccurred } from "@vkontakte/vk-bridge-react";
import { BoardScheme } from "./components/BoardScheme.jsx";
import { DETAIL_PRESETS, MATERIAL_PRESETS } from "./data/presets.js";
import { calculateCutting, normalizeDetails, summarizeResult } from "./lib/optimizer.js";
import { loadHistory, saveHistoryEntry } from "./lib/storage.js";
import { copyText, getUserInfoSafe, setSwipeSettings } from "./lib/vk.js";

const EMPTY_MATERIAL = {
  name: "Новый расчёт",
  length: "6000",
  cutWidth: "3",
  cost: "450"
};

const EMPTY_DETAIL_FORM = {
  length: "",
  quantity: "1"
};

function generateId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `calc-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function makeHistoryEntry(material, details, result) {
  return {
    id: generateId(),
    savedAt: new Date().toISOString(),
    projectName: material.name || "Без названия",
    material,
    details,
    result
  };
}

function formatNumber(value) {
  return Number(value).toLocaleString("ru-RU");
}

function formatDate(value) {
  return new Date(value).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function sanitizeMaterial(material) {
  return {
    name: material.name.trim() || "Новый расчёт",
    length: Number(material.length),
    cutWidth: Number(material.cutWidth || 0),
    cost: material.cost === "" ? null : Number(material.cost)
  };
}

function statsRows(result) {
  return [
    ["Заготовок", `${result.boardCount} шт.`],
    ["Материала", `${formatNumber(result.totalMaterialUsed)} мм`],
    ["Полезный выход", `${result.benefitPercent}%`],
    ["Отходы", `${result.wastePercent}% (${formatNumber(result.totalWaste)} мм)`],
    ["Резов", `${result.cutsCount}`],
    ["Стоимость", result.cost === null ? "не указана" : `${formatNumber(result.cost)} руб.`]
  ];
}

export default function App() {
  const [historyStack, setHistoryStack] = useState(["home"]);
  const [userInfo, setUserInfo] = useState(null);
  const [material, setMaterial] = useState(EMPTY_MATERIAL);
  const [detailForm, setDetailForm] = useState(EMPTY_DETAIL_FORM);
  const [details, setDetails] = useState([]);
  const [result, setResult] = useState(null);
  const [historyItems, setHistoryItems] = useState([]);
  const [statusText, setStatusText] = useState("Готов к расчёту");

  const activePanel = historyStack[historyStack.length - 1];

  useEffect(() => {
    getUserInfoSafe().then((data) => {
      if (data) {
        setUserInfo(data);
      }
    });

    loadHistory().then(setHistoryItems);
  }, []);

  useEffect(() => {
    setSwipeSettings(historyStack.length === 1);
  }, [historyStack.length]);

  const sortedDetails = useMemo(() => normalizeDetails(details), [details]);

  function go(panel) {
    setHistoryStack((prev) => [...prev, panel]);
  }

  function goBack() {
    setHistoryStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }

  function resetCalculation(presetMaterial = null, presetDetails = []) {
    const nextMaterial = presetMaterial
      ? {
          name: presetMaterial.name,
          length: String(presetMaterial.length),
          cutWidth: String(presetMaterial.cutWidth),
          cost: presetMaterial.cost ? String(presetMaterial.cost) : ""
        }
      : EMPTY_MATERIAL;

    setMaterial(nextMaterial);
    setDetails(presetDetails);
    setDetailForm(EMPTY_DETAIL_FORM);
    setResult(null);
    setStatusText("Черновик обновлён");
    setHistoryStack(["home", "material"]);
  }

  function applyDetailPreset(preset) {
    setDetails(preset.details);
    setStatusText(`Загружен шаблон: ${preset.title}`);
  }

  function appendDetail() {
    const length = Number(detailForm.length);
    const quantity = Number(detailForm.quantity);
    const materialLength = Number(material.length);

    if (!Number.isFinite(length) || length <= 0) {
      setStatusText("Длина детали должна быть больше 0");
      return;
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setStatusText("Количество должно быть больше 0");
      return;
    }

    if (Number.isFinite(materialLength) && materialLength > 0 && length > materialLength) {
      setStatusText("Деталь длиннее исходной заготовки");
      return;
    }

    setDetails((prev) => [...prev, { length, quantity }]);
    setDetailForm(EMPTY_DETAIL_FORM);
    setStatusText(`Добавлена деталь ${length} мм × ${quantity}`);
  }

  function removeDetail(index) {
    setDetails((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
  }

  function runCalculation() {
    const nextMaterial = sanitizeMaterial(material);
    const calculation = calculateCutting(nextMaterial.length, nextMaterial.cutWidth, sortedDetails, nextMaterial.cost ?? 0);

    if (calculation.error) {
      setStatusText(calculation.error);
      return;
    }

    setMaterial({
      name: nextMaterial.name,
      length: String(nextMaterial.length),
      cutWidth: String(nextMaterial.cutWidth),
      cost: nextMaterial.cost === null ? "" : String(nextMaterial.cost)
    });
    setResult(calculation);
    setStatusText("Расчёт готов");
    runTapticImpactOccurred("light");
    go("results");
  }

  async function saveCurrentCalculation() {
    if (!result) {
      return;
    }

    const entry = makeHistoryEntry(sanitizeMaterial(material), sortedDetails, result);
    const nextHistory = await saveHistoryEntry(entry);

    setHistoryItems(nextHistory);
    setStatusText(`Сохранено: ${entry.projectName}`);
    runTapticImpactOccurred("medium");
  }

  async function copyCurrentSummary() {
    if (!result) {
      return;
    }

    const summary = summarizeResult(sanitizeMaterial(material), result);
    const copied = await copyText(summary);

    setStatusText(copied ? "Сводка скопирована" : "Не удалось скопировать сводку");
  }

  function openHistoryEntry(item) {
    setMaterial({
      name: item.material.name ?? "История",
      length: String(item.material.length),
      cutWidth: String(item.material.cutWidth),
      cost: item.material.cost === null ? "" : String(item.material.cost)
    });
    setDetails(item.details);
    setResult(item.result);
    setStatusText(`Открыт расчёт: ${item.projectName}`);
    setHistoryStack(["home", "history", "results"]);
  }

  return (
    <SplitLayout>
      <SplitCol autoSpaced>
        <View activePanel={activePanel} history={historyStack} onSwipeBack={goBack}>
          <Panel id="home">
            <PanelHeader>Оптимальный раскрой</PanelHeader>
            <Group>
              <Div className="hero">
                <div className="hero__title-row">
                  <Title level="1">VK Mini App для линейного раскроя</Title>
                  <Badge mode="prominent">FFD</Badge>
                </div>
                <Text className="muted-text">
                  Расчёт заготовок, пропила, отходов и стоимости. Алгоритм перенесён из твоего desktop-проекта на
                  Python/QML в React + VKUI + VK Bridge.
                </Text>
                <div className="hero__actions">
                  <Button size="l" stretched onClick={() => resetCalculation()}>
                    Новый расчёт
                  </Button>
                  <Button size="l" stretched mode="secondary" onClick={() => go("history")}>
                    История
                  </Button>
                </div>
              </Div>
            </Group>

            <Group header={<Header>Пользователь VK</Header>}>
              <SimpleCell>
                {userInfo ? `${userInfo.first_name} ${userInfo.last_name}` : "Не удалось получить профиль через Bridge"}
              </SimpleCell>
            </Group>

            <Group header={<Header>Шаблоны материала</Header>}>
              <CardGrid size="l">
                {MATERIAL_PRESETS.map((preset) => (
                  <Card key={preset.id} mode="shadow" className="preset-card">
                    <Div>
                      <Text weight="2">{preset.title}</Text>
                      <Text className="muted-text">{preset.description}</Text>
                      <Button
                        stretched
                        mode="secondary"
                        className="top-gap"
                        onClick={() => resetCalculation(preset.material, [])}
                      >
                        Использовать
                      </Button>
                    </Div>
                  </Card>
                ))}
              </CardGrid>
            </Group>

            <Group header={<Header>Шаблоны деталей</Header>}>
              {DETAIL_PRESETS.map((preset) => (
                <SimpleCell
                  key={preset.id}
                  subtitle={`${preset.details.length} позиций`}
                  after={
                    <Button size="s" mode="secondary" onClick={() => resetCalculation(null, preset.details)}>
                      Открыть
                    </Button>
                  }
                >
                  {preset.title}
                </SimpleCell>
              ))}
            </Group>
          </Panel>

          <Panel id="material">
            <PanelHeader before={<PanelHeaderBack onClick={goBack} />}>Материал</PanelHeader>
            <Group header={<Header>Параметры заготовки</Header>}>
              <FormItem top="Название проекта">
                <Input
                  value={material.name}
                  onChange={(event) => setMaterial((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Например: Балкон, кухня, профиль"
                />
              </FormItem>
              <FormItem top="Длина материала, мм">
                <Input
                  type="number"
                  value={material.length}
                  onChange={(event) => setMaterial((prev) => ({ ...prev, length: event.target.value }))}
                />
              </FormItem>
              <FormItem top="Толщина реза, мм">
                <Input
                  type="number"
                  value={material.cutWidth}
                  onChange={(event) => setMaterial((prev) => ({ ...prev, cutWidth: event.target.value }))}
                />
              </FormItem>
              <FormItem top="Стоимость одной заготовки, руб.">
                <Input
                  type="number"
                  value={material.cost}
                  onChange={(event) => setMaterial((prev) => ({ ...prev, cost: event.target.value }))}
                  placeholder="Опционально"
                />
              </FormItem>
              <Div>
                <Button stretched size="l" onClick={() => go("details")}>
                  К вводу деталей
                </Button>
              </Div>
            </Group>
          </Panel>

          <Panel id="details">
            <PanelHeader before={<PanelHeaderBack onClick={goBack} />}>Детали</PanelHeader>
            <Group header={<Header>Добавить деталь</Header>}>
              <FormItem top="Длина детали, мм">
                <Input
                  type="number"
                  value={detailForm.length}
                  onChange={(event) => setDetailForm((prev) => ({ ...prev, length: event.target.value }))}
                  placeholder="Например: 1200"
                />
              </FormItem>
              <FormItem top="Количество">
                <Input
                  type="number"
                  value={detailForm.quantity}
                  onChange={(event) => setDetailForm((prev) => ({ ...prev, quantity: event.target.value }))}
                />
              </FormItem>
              <Div>
                <ButtonGroup stretched mode="horizontal">
                  <Button stretched onClick={appendDetail}>
                    Добавить
                  </Button>
                  <Button stretched mode="secondary" onClick={runCalculation} disabled={sortedDetails.length === 0}>
                    Рассчитать
                  </Button>
                </ButtonGroup>
              </Div>
            </Group>

            <Group header={<Header>Быстрые наборы</Header>}>
              {DETAIL_PRESETS.map((preset) => (
                <SimpleCell
                  key={preset.id}
                  subtitle={preset.details.map((item) => `${item.length}x${item.quantity}`).join(", ")}
                  after={
                    <Button size="s" mode="secondary" onClick={() => applyDetailPreset(preset)}>
                      Загрузить
                    </Button>
                  }
                >
                  {preset.title}
                </SimpleCell>
              ))}
            </Group>

            <Group header={<Header>Текущий список</Header>}>
              {sortedDetails.length === 0 ? (
                <Placeholder>Список пуст. Добавь детали вручную или подгрузи шаблон.</Placeholder>
              ) : (
                sortedDetails.map((detail, index) => (
                  <SimpleCell
                    key={`${detail.length}-${detail.quantity}-${index}`}
                    subtitle={`Суммарно ${formatNumber(detail.length * detail.quantity)} мм`}
                    after={
                      <Button size="s" mode="tertiary" appearance="negative" onClick={() => removeDetail(index)}>
                        Удалить
                      </Button>
                    }
                  >
                    {detail.length} мм × {detail.quantity} шт.
                  </SimpleCell>
                ))
              )}
            </Group>
          </Panel>

          <Panel id="results">
            <PanelHeader before={<PanelHeaderBack onClick={goBack} />}>Результат</PanelHeader>
            {result ? (
              <>
                <Group header={<Header>Сводка</Header>}>
                  <CardGrid size="l">
                    <Card mode="shadow" className="summary-card">
                      <Div>
                        <Title level="3">{material.name || "Новый расчёт"}</Title>
                        <Text className="muted-text">
                          {result.materialLength} мм • пропил {material.cutWidth || 0} мм
                        </Text>
                        <Separator className="top-gap" />
                        <div className="stats-grid">
                          {statsRows(result).map(([label, value]) => (
                            <div className="stats-grid__row" key={label}>
                              <span>{label}</span>
                              <strong>{value}</strong>
                            </div>
                          ))}
                        </div>
                      </Div>
                    </Card>
                  </CardGrid>
                  <Div>
                    <ButtonGroup stretched mode="horizontal">
                      <Button stretched onClick={saveCurrentCalculation}>
                        Сохранить
                      </Button>
                      <Button stretched mode="secondary" onClick={copyCurrentSummary}>
                        Копировать
                      </Button>
                    </ButtonGroup>
                  </Div>
                </Group>

                <Group header={<Header>Детали</Header>}>
                  {result.details.map((detail) => (
                    <SimpleCell key={`${detail.length}-${detail.quantity}`}>
                      {detail.length} мм × {detail.quantity} шт.
                    </SimpleCell>
                  ))}
                </Group>

                <Group header={<Header>Схема раскроя</Header>}>
                  {result.boards.map((board) => (
                    <BoardScheme
                      key={board.boardNumber}
                      board={board}
                      materialLength={result.materialLength}
                      cutWidth={Number(material.cutWidth || 0)}
                    />
                  ))}
                </Group>
              </>
            ) : (
              <Group>
                <Placeholder>Сначала выполни расчёт.</Placeholder>
              </Group>
            )}
          </Panel>

          <Panel id="history">
            <PanelHeader before={<PanelHeaderBack onClick={goBack} />}>История</PanelHeader>
            <Group header={<Header>Сохранённые расчёты</Header>}>
              {historyItems.length === 0 ? (
                <Placeholder>История пока пустая. Сохрани любой расчёт, и он попадёт сюда через VK Bridge Storage.</Placeholder>
              ) : (
                historyItems.map((item) => (
                  <SimpleCell
                    key={item.id}
                    subtitle={`${formatDate(item.savedAt)} • ${item.result.boardCount} заготовок • ${item.result.wastePercent}% отходов`}
                    after={
                      <Button size="s" mode="secondary" onClick={() => openHistoryEntry(item)}>
                        Открыть
                      </Button>
                    }
                  >
                    {item.projectName}
                  </SimpleCell>
                ))
              )}
            </Group>
          </Panel>
        </View>

        <div className="status-bar">{statusText}</div>
      </SplitCol>
    </SplitLayout>
  );
}
