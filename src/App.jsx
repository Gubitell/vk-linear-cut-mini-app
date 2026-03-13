import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Badge,
  Button,
  ButtonGroup,
  Card,
  CardGrid,
  Checkbox,
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
import { downloadPdfExport, downloadTxtExport } from "./lib/export.js";
import { calculateCutting, normalizeDetails } from "./lib/optimizer.js";
import { deleteMaterialTemplate, loadHistory, loadMaterialTemplates, saveHistoryEntry, saveMaterialTemplate } from "./lib/storage.js";
import { getUserInfoSafe, isVkWebView, setSwipeSettings } from "./lib/vk.js";

const EMPTY_PROJECT_NAME = "Новый проект";
const EMPTY_BLANK_FORM = {
  name: "Новая заготовка",
  length: "6000",
  cutWidth: "3",
  cost: "450",
  lengthUnit: "мм",
  currency: "руб."
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

function formatNumber(value) {
  return new Intl.NumberFormat("ru-RU", {
    useGrouping: false,
    maximumFractionDigits: 10
  }).format(Number(value));
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

function getLengthUnit(blank) {
  return blank?.lengthUnit?.trim() || "мм";
}

function getCurrency(blank) {
  return blank?.currency?.trim() || "руб.";
}

function formatMeasure(value, unit) {
  return `${formatNumber(value)} ${unit}`;
}

function formatMoney(value, currency) {
  return `${formatNumber(value)} ${currency}`;
}

function normalizeBlankState(blank) {
  return {
    name: blank?.name ?? EMPTY_BLANK_FORM.name,
    length: String(blank?.length ?? EMPTY_BLANK_FORM.length),
    cutWidth: String(blank?.cutWidth ?? EMPTY_BLANK_FORM.cutWidth),
    cost: blank?.cost === null || blank?.cost === undefined ? "" : String(blank.cost),
    lengthUnit: getLengthUnit(blank ?? EMPTY_BLANK_FORM),
    currency: getCurrency(blank ?? EMPTY_BLANK_FORM)
  };
}

function sanitizeBlank(blank) {
  return {
    name: blank.name.trim() || "Новая заготовка",
    length: Number(blank.length),
    cutWidth: Number(blank.cutWidth || 0),
    cost: blank.cost === "" ? null : Number(blank.cost),
    lengthUnit: getLengthUnit(blank),
    currency: getCurrency(blank)
  };
}

function makeBlankTemplate(blankForm) {
  const blank = sanitizeBlank(blankForm);

  return {
    id: generateId(),
    title: blank.name,
    description: `${formatMeasure(blank.length, blank.lengthUnit)} • пропил ${formatMeasure(blank.cutWidth, blank.lengthUnit)}${
      blank.cost !== null ? ` • ${formatMoney(blank.cost, blank.currency)}` : ""
    }`,
    material: blank
  };
}

function createProjectBlank(blankForm) {
  const blank = sanitizeBlank(blankForm);

  return {
    id: generateId(),
    ...blank,
    details: [],
    result: null
  };
}

function makeHistoryEntry(projectName, blank) {
  return {
    id: generateId(),
    savedAt: new Date().toISOString(),
    projectName: projectName.trim() || EMPTY_PROJECT_NAME,
    projectLabel: `${projectName.trim() || EMPTY_PROJECT_NAME} / ${blank.name}`,
    material: {
      name: blank.name,
      length: blank.length,
      cutWidth: blank.cutWidth,
      cost: blank.cost,
      lengthUnit: blank.lengthUnit,
      currency: blank.currency
    },
    details: blank.details,
    result: blank.result
  };
}

function statsRows(result, blank) {
  return [
    ["Заготовок", `${result.boardCount} шт.`],
    ["Материала", formatMeasure(result.totalMaterialUsed, blank.lengthUnit)],
    ["Полезный выход", `${result.benefitPercent}%`],
    ["Отходы", `${result.wastePercent}% (${formatMeasure(result.totalWaste, blank.lengthUnit)})`],
    ["Резов", `${result.cutsCount}`],
    ["Стоимость", result.cost === null ? "не указана" : formatMoney(result.cost, blank.currency)]
  ];
}

function getBoardSignature(board) {
  return JSON.stringify(board.pieces);
}

function groupBoardsByScheme(boards) {
  const groups = new Map();

  for (const board of boards) {
    const signature = getBoardSignature(board);

    if (!groups.has(signature)) {
      groups.set(signature, {
        representativeBoard: board,
        boardNumbers: [],
        boardCount: 0
      });
    }

    const currentGroup = groups.get(signature);
    currentGroup.boardNumbers.push(board.boardNumber);
    currentGroup.boardCount += 1;
  }

  return [...groups.values()]
    .sort((left, right) => left.boardNumbers[0] - right.boardNumbers[0])
    .map((group, index) => ({
      ...group,
      schemeNumber: index + 1
    }));
}

function getBlankSubtitle(blank) {
  const price = blank.cost === null ? "без цены" : formatMoney(blank.cost, blank.currency);
  return `${formatMeasure(blank.length, blank.lengthUnit)} • пропил ${formatMeasure(blank.cutWidth, blank.lengthUnit)} • ${price}`;
}

export default function App() {
  const [historyStack, setHistoryStack] = useState(["home"]);
  const [userInfo, setUserInfo] = useState(null);
  const [projectName, setProjectName] = useState(EMPTY_PROJECT_NAME);
  const [blankForm, setBlankForm] = useState(EMPTY_BLANK_FORM);
  const [projectBlanks, setProjectBlanks] = useState([]);
  const [activeBlankId, setActiveBlankId] = useState(null);
  const [detailForm, setDetailForm] = useState(EMPTY_DETAIL_FORM);
  const [historyItems, setHistoryItems] = useState([]);
  const [customTemplates, setCustomTemplates] = useState([]);
  const DEFAULT_STATUS = "Готов к расчёту";
  const [statusText, setStatusText] = useState(DEFAULT_STATUS);
  const [exportIncludeZero, setExportIncludeZero] = useState(true);
  const [pdfOrientation, setPdfOrientation] = useState("landscape");
  const statusTimeoutRef = useRef(null);

  const activePanel = historyStack[historyStack.length - 1];

  function showStatus(message) {
    if (statusTimeoutRef.current) {
      clearTimeout(statusTimeoutRef.current);
    }
    setStatusText(message);
    statusTimeoutRef.current = setTimeout(() => {
      setStatusText(DEFAULT_STATUS);
      statusTimeoutRef.current = null;
    }, 3000);
  }

  useEffect(() => {
    getUserInfoSafe().then((data) => {
      if (data) {
        setUserInfo(data);
      }
    });

    loadHistory().then(setHistoryItems);
    loadMaterialTemplates().then(setCustomTemplates);
  }, []);

  useEffect(() => {
    setSwipeSettings(historyStack.length === 1);
  }, [historyStack.length]);

  useEffect(() => {
    return () => {
      if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
    };
  }, []);

  const activeBlank = useMemo(
    () => projectBlanks.find((blank) => blank.id === activeBlankId) ?? null,
    [projectBlanks, activeBlankId]
  );
  const activeResult = activeBlank?.result ?? null;
  const sortedDetails = useMemo(() => normalizeDetails(activeBlank?.details ?? []), [activeBlank]);
  const boardSchemes = useMemo(() => (activeResult ? groupBoardsByScheme(activeResult.boards) : []), [activeResult]);

  function go(panel) {
    setHistoryStack((prev) => [...prev, panel]);
  }

  function goBack() {
    setHistoryStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }

  function resetProject() {
    setProjectName(EMPTY_PROJECT_NAME);
    setBlankForm(EMPTY_BLANK_FORM);
    setProjectBlanks([]);
    setActiveBlankId(null);
    setDetailForm(EMPTY_DETAIL_FORM);
    showStatus("Новый проект");
    setHistoryStack(["home"]);
  }

  function startNewBlank() {
    setActiveBlankId(null);
    setBlankForm({
      ...EMPTY_BLANK_FORM,
      name: `Заготовка ${projectBlanks.length + 1}`
    });
    showStatus("Черновик новой заготовки");
  }

  function saveBlankToProject() {
    const sanitizedBlank = sanitizeBlank(blankForm);

    if (!Number.isFinite(sanitizedBlank.length) || sanitizedBlank.length <= 0) {
      showStatus("Длина заготовки должна быть больше 0");
      return;
    }

    setProjectBlanks((prev) => {
      const existing = prev.find((blank) => blank.id === activeBlankId);

      if (existing) {
        return prev.map((blank) =>
          blank.id === activeBlankId
            ? {
                ...blank,
                ...sanitizedBlank
              }
            : blank
        );
      }

      const created = {
        ...createProjectBlank(blankForm)
      };

      setActiveBlankId(created.id);
      return [...prev, created];
    });

    showStatus(activeBlankId ? "Заготовка обновлена" : "Заготовка добавлена в проект");
  }

  function activateBlank(blankId) {
    const blank = projectBlanks.find((item) => item.id === blankId);

    if (!blank) {
      return;
    }

    setActiveBlankId(blank.id);
    setBlankForm(normalizeBlankState(blank));
    showStatus(`Выбрана заготовка: ${blank.name}`);
  }

  function deleteProjectBlank(blankId) {
    setProjectBlanks((prev) => {
      const next = prev.filter((blank) => blank.id !== blankId);

      if (blankId === activeBlankId) {
        const nextActive = next[0] ?? null;
        setActiveBlankId(nextActive?.id ?? null);
        setBlankForm(nextActive ? normalizeBlankState(nextActive) : EMPTY_BLANK_FORM);
      }

      return next;
    });

    showStatus("Заготовка удалена из проекта");
  }

  function clearAllProjectBlanks() {
    setProjectBlanks([]);
    setActiveBlankId(null);
    setBlankForm(EMPTY_BLANK_FORM);
    setDetailForm(EMPTY_DETAIL_FORM);
    showStatus("Все заготовки проекта удалены");
  }

  function addTemplateToProject(template) {
    const created = {
      id: generateId(),
      ...template.material,
      details: [],
      result: null
    };

    setProjectBlanks((prev) => [...prev, created]);
    setActiveBlankId(created.id);
    setBlankForm(normalizeBlankState(created));
    showStatus(`Шаблон добавлен в проект: ${created.name}`);
  }

  async function saveCurrentBlankAsTemplate() {
    const template = makeBlankTemplate(blankForm);
    const nextTemplates = await saveMaterialTemplate(template);

    setCustomTemplates(nextTemplates);
    showStatus(`Шаблон сохранён: ${template.title}`);
  }

  async function removeMaterialTemplate(templateId) {
    const nextTemplates = await deleteMaterialTemplate(templateId);

    setCustomTemplates(nextTemplates);
    showStatus("Шаблон заготовки удалён");
  }

  function updateActiveBlank(updater) {
    setProjectBlanks((prev) =>
      prev.map((blank) => (blank.id === activeBlankId ? updater(blank) : blank))
    );
  }

  function appendDetail() {
    if (!activeBlank) {
      showStatus("Сначала сохрани или выбери заготовку");
      return;
    }

    const length = Number(detailForm.length);
    const quantity = Number(detailForm.quantity);

    if (!Number.isFinite(length) || length <= 0) {
      showStatus("Длина детали должна быть больше 0");
      return;
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      showStatus("Количество должно быть больше 0");
      return;
    }

    if (length > activeBlank.length) {
      showStatus("Деталь длиннее выбранной заготовки");
      return;
    }

    updateActiveBlank((blank) => ({
      ...blank,
      details: [...blank.details, { length, quantity }],
      result: null
    }));
    setDetailForm(EMPTY_DETAIL_FORM);
    showStatus(`Добавлена деталь ${length} ${activeBlank.lengthUnit} × ${quantity}`);
  }

  function removeDetail(index) {
    updateActiveBlank((blank) => ({
      ...blank,
      details: blank.details.filter((_, currentIndex) => currentIndex !== index),
      result: null
    }));
  }

  function clearAllDetails() {
    updateActiveBlank((blank) => ({
      ...blank,
      details: [],
      result: null
    }));
    showStatus("Все детали удалены");
  }

  function runCalculation() {
    if (!activeBlank) {
      showStatus("Сначала сохрани или выбери заготовку");
      return;
    }

    const calculation = calculateCutting(
      activeBlank.length,
      activeBlank.cutWidth,
      activeBlank.details,
      activeBlank.cost ?? 0,
      activeBlank.lengthUnit
    );

    if (calculation.error) {
      showStatus(calculation.error);
      return;
    }

    updateActiveBlank((blank) => ({
      ...blank,
      result: calculation
    }));
    showStatus("Расчёт готов");
    runTapticImpactOccurred("light");
    go("results");
  }

  async function saveCurrentCalculation() {
    if (!activeBlank || !activeBlank.result) {
      return;
    }

    const entry = makeHistoryEntry(projectName, activeBlank);
    const nextHistory = await saveHistoryEntry(entry);

    setHistoryItems(nextHistory);
    showStatus(`Раскрой сохранён в историю: ${entry.projectLabel}`);
    runTapticImpactOccurred("medium");
  }

  async function exportTxt() {
    if (!activeBlank || !activeBlank.result) {
      return;
    }

    const result = await downloadTxtExport({
      projectName,
      blank: activeBlank,
      schemes: boardSchemes,
      includeZeroDimensions: exportIncludeZero
    });
    showStatus(result?.statusMessage ?? "TXT выгружен");
  }

  async function exportPdf() {
    if (!activeBlank || !activeBlank.result) {
      return;
    }

    const result = await downloadPdfExport({
      projectName,
      blank: activeBlank,
      schemes: boardSchemes,
      includeZeroDimensions: exportIncludeZero,
      orientation: pdfOrientation
    });
    showStatus(result?.statusMessage ?? "PDF выгружен");
  }

  function openHistoryEntry(item) {
    const restoredBlank = {
      id: generateId(),
      ...item.material,
      details: item.details,
      result: item.result
    };

    setProjectName(item.projectName || EMPTY_PROJECT_NAME);
    setProjectBlanks([restoredBlank]);
    setActiveBlankId(restoredBlank.id);
    setBlankForm(normalizeBlankState(restoredBlank));
    showStatus(`Открыт раскрой: ${item.projectLabel || restoredBlank.name}`);
    setHistoryStack(["home", "results"]);
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
                  <Title level="1">Оптимальный линейный раскрой</Title>
                  <Badge mode="prominent">FFD</Badge>
                </div>
                <Text className="muted-text">
                  Один проект может содержать несколько разных заготовок. Шаблоны сохраняются для заготовок отдельно.
                </Text>
                <div className="compact-actions">
                  <Button size="m" onClick={resetProject}>
                    Новый проект
                  </Button>
                  <Button size="m" mode="secondary" onClick={() => go("history")}>
                    История раскроев
                  </Button>
                </div>
              </Div>
            </Group>

            <Group header={<Header>Проект</Header>}>
              <FormItem top="Название проекта">
                <Input value={projectName} onChange={(event) => setProjectName(event.target.value)} />
              </FormItem>
              <SimpleCell>{userInfo ? `${userInfo.first_name} ${userInfo.last_name}` : "Профиль VK недоступен"}</SimpleCell>
            </Group>

            <Group header={<Header>Параметры заготовки</Header>}>
              <FormItem top="Название заготовки">
                <Input
                  value={blankForm.name}
                  onChange={(event) => setBlankForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Например: Лист 3000, Профиль 40x20"
                />
              </FormItem>
              <FormItem top={`Длина заготовки, ${getLengthUnit(blankForm)}`}>
                <Input
                  type="number"
                  value={blankForm.length}
                  onChange={(event) => setBlankForm((prev) => ({ ...prev, length: event.target.value }))}
                />
              </FormItem>
              <FormItem top={`Толщина реза, ${getLengthUnit(blankForm)}`}>
                <Input
                  type="number"
                  value={blankForm.cutWidth}
                  onChange={(event) => setBlankForm((prev) => ({ ...prev, cutWidth: event.target.value }))}
                />
              </FormItem>
              <FormItem top="Единица длины">
                <Input
                  value={blankForm.lengthUnit}
                  onChange={(event) => setBlankForm((prev) => ({ ...prev, lengthUnit: event.target.value }))}
                  placeholder="мм, см, м, in"
                />
              </FormItem>
              <FormItem top={`Стоимость одной заготовки, ${getCurrency(blankForm)}`}>
                <Input
                  type="number"
                  value={blankForm.cost}
                  onChange={(event) => setBlankForm((prev) => ({ ...prev, cost: event.target.value }))}
                  placeholder="Опционально"
                />
              </FormItem>
              <FormItem top="Обозначение валюты">
                <Input
                  value={blankForm.currency}
                  onChange={(event) => setBlankForm((prev) => ({ ...prev, currency: event.target.value }))}
                  placeholder="руб., $, EUR"
                />
              </FormItem>
              <Div>
                <div className="compact-actions">
                  <Button size="m" onClick={saveBlankToProject}>
                    {activeBlank ? "Обновить заготовку" : "Добавить заготовку"}
                  </Button>
                  <Button size="m" mode="secondary" onClick={saveCurrentBlankAsTemplate}>
                    Сохранить шаблон
                  </Button>
                  <Button size="m" mode="secondary" onClick={startNewBlank}>
                    Новая заготовка
                  </Button>
                  <Button size="m" mode="secondary" disabled={!activeBlank} onClick={() => go("details")}>
                    К деталям
                  </Button>
                </div>
              </Div>
            </Group>

            <Group>
              <div className="section-title-row">
                <Header>Заготовки проекта</Header>
                {projectBlanks.length > 0 ? (
                  <Button size="s" mode="tertiary" appearance="negative" onClick={clearAllProjectBlanks}>
                    Очистить всё
                  </Button>
                ) : null}
              </div>
              {projectBlanks.length === 0 ? (
                <Placeholder>Добавь первую заготовку в проект. После этого для каждой можно вести свой раскрой.</Placeholder>
              ) : (
                <CardGrid size="l">
                  {projectBlanks.map((blank) => (
                    <Card key={blank.id} mode="shadow" className="preset-card">
                      <Div>
                        <Text weight="2">{blank.name}</Text>
                        <Text className="muted-text">{getBlankSubtitle(blank)}</Text>
                        <Text className="muted-text">
                          Деталей: {normalizeDetails(blank.details).length} • {blank.result ? "Есть расчёт" : "Без расчёта"}
                        </Text>
                        <div className="compact-actions top-gap">
                          <Button size="s" mode={blank.id === activeBlankId ? "primary" : "secondary"} onClick={() => activateBlank(blank.id)}>
                            Выбрать
                          </Button>
                          <Button size="s" mode="secondary" onClick={() => (activateBlank(blank.id), go("details"))}>
                            Детали
                          </Button>
                          <Button size="s" appearance="negative" mode="tertiary" onClick={() => deleteProjectBlank(blank.id)}>
                            Удалить
                          </Button>
                        </div>
                      </Div>
                    </Card>
                  ))}
                </CardGrid>
              )}
            </Group>

            <Group header={<Header>Шаблоны заготовок</Header>}>
              {customTemplates.length === 0 ? (
                <Placeholder>Пока пусто. Настрой любую заготовку и нажми «Сохранить шаблон».</Placeholder>
              ) : (
                <CardGrid size="l">
                  {customTemplates.map((template) => (
                    <Card key={template.id} mode="shadow" className="preset-card">
                      <Div>
                        <Text weight="2">{template.title}</Text>
                        <Text className="muted-text">{template.description}</Text>
                        <div className="compact-actions top-gap">
                          <Button size="s" mode="secondary" onClick={() => addTemplateToProject(template)}>
                            Добавить в проект
                          </Button>
                          <Button size="s" appearance="negative" mode="tertiary" onClick={() => removeMaterialTemplate(template.id)}>
                            Удалить
                          </Button>
                        </div>
                      </Div>
                    </Card>
                  ))}
                </CardGrid>
              )}
            </Group>
          </Panel>

          <Panel id="details">
            <PanelHeader before={<PanelHeaderBack onClick={goBack} />}>Детали</PanelHeader>
            {!activeBlank ? (
              <Group>
                <Placeholder>Сначала создай или выбери заготовку на главном экране.</Placeholder>
              </Group>
            ) : (
              <>
                <Group header={<Header>{`${projectName} • ${activeBlank.name}`}</Header>}>
                  <SimpleCell>{getBlankSubtitle(activeBlank)}</SimpleCell>
                </Group>

                <Group header={<Header>Добавить деталь</Header>}>
                  <FormItem top={`Длина детали, ${activeBlank.lengthUnit}`}>
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
                    <div className="compact-actions">
                      <Button size="m" onClick={appendDetail}>
                        Добавить
                      </Button>
                      <Button size="m" mode="secondary" onClick={runCalculation} disabled={sortedDetails.length === 0}>
                        Рассчитать
                      </Button>
                    </div>
                  </Div>
                </Group>

                <Group>
                  <div className="section-title-row">
                    <Header>Текущий список</Header>
                    {sortedDetails.length > 0 ? (
                      <Button size="s" mode="tertiary" appearance="negative" onClick={clearAllDetails}>
                        Очистить всё
                      </Button>
                    ) : null}
                  </div>
                  {sortedDetails.length === 0 ? (
                    <Placeholder>Список пуст. Добавь детали вручную.</Placeholder>
                  ) : (
                    sortedDetails.map((detail, index) => (
                      <SimpleCell
                        key={`${detail.length}-${detail.quantity}-${index}`}
                        subtitle={`Суммарно ${formatMeasure(detail.length * detail.quantity, activeBlank.lengthUnit)}`}
                        after={
                          <Button size="s" mode="tertiary" appearance="negative" onClick={() => removeDetail(index)}>
                            Удалить
                          </Button>
                        }
                      >
                        {detail.length} {activeBlank.lengthUnit} × {detail.quantity} шт.
                      </SimpleCell>
                    ))
                  )}
                </Group>
              </>
            )}
          </Panel>

          <Panel id="results">
            <PanelHeader before={<PanelHeaderBack onClick={goBack} />}>Результат</PanelHeader>
            {!activeBlank || !activeResult ? (
              <Group>
                <Placeholder>Сначала выполни расчёт для выбранной заготовки.</Placeholder>
              </Group>
            ) : (
              <>
                <Group header={<Header>Сводка</Header>}>
                  <CardGrid size="l">
                    <Card mode="shadow" className="summary-card">
                      <Div>
                        <Title level="3">{`${projectName} • ${activeBlank.name}`}</Title>
                        <Text className="muted-text">
                          {formatMeasure(activeBlank.length, activeBlank.lengthUnit)} • пропил{" "}
                          {formatMeasure(activeBlank.cutWidth, activeBlank.lengthUnit)}
                        </Text>
                        <Separator className="top-gap" />
                        <div className="stats-grid">
                          {statsRows(activeResult, activeBlank).map(([label, value]) => (
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
                    <div className="compact-actions">
                      <Button size="m" onClick={saveCurrentCalculation}>
                        Сохранить в историю
                      </Button>
                      <Button size="m" mode="secondary" onClick={() => setHistoryStack(["home"])}>
                        На главную
                      </Button>
                    </div>
                  </Div>
                </Group>

                <Group header={<Header>Экспорт</Header>}>
                  <FormItem>
                    <Checkbox checked={exportIncludeZero} onChange={(event) => setExportIncludeZero(event.target.checked)}>
                      Включать размеры от нуля
                    </Checkbox>
                  </FormItem>
                  {!isVkWebView() && (
                    <FormItem top="Ориентация PDF">
                      <div className="compact-actions">
                        <Button size="s" mode={pdfOrientation === "portrait" ? "primary" : "secondary"} onClick={() => setPdfOrientation("portrait")}>
                          Вертикально
                        </Button>
                        <Button size="s" mode={pdfOrientation === "landscape" ? "primary" : "secondary"} onClick={() => setPdfOrientation("landscape")}>
                          Горизонтально
                        </Button>
                      </div>
                    </FormItem>
                  )}
                  <FormItem top={isVkWebView() ? null : "Файлы"}>
                    {isVkWebView() ? (
                      <>
                        <div className="compact-actions">
                          <Button size="m" onClick={exportTxt}>
                            Скопировать данные расчёта
                          </Button>
                        </div>
                        <Text className="muted-text" style={{ display: "block", marginTop: 8 }}>
                          Расчёт в PDF можно скачать только через веб-браузер.
                        </Text>
                      </>
                    ) : (
                      <div className="compact-actions">
                        <Button size="m" onClick={exportTxt}>
                          Скачать TXT
                        </Button>
                        <Button size="m" mode="secondary" onClick={exportPdf}>
                          Скачать PDF
                        </Button>
                      </div>
                    )}
                  </FormItem>
                </Group>

                <Group header={<Header>Детали</Header>}>
                  {activeResult.details.map((detail) => (
                    <SimpleCell key={`${detail.length}-${detail.quantity}`}>
                      {detail.length} {activeBlank.lengthUnit} × {detail.quantity} шт.
                    </SimpleCell>
                  ))}
                </Group>

                <Group header={<Header>Схема раскроя</Header>}>
                  {boardSchemes.map((scheme) => (
                    <BoardScheme
                      key={scheme.schemeNumber}
                      scheme={scheme}
                      materialLength={activeResult.materialLength}
                      cutWidth={activeBlank.cutWidth}
                      lengthUnit={activeBlank.lengthUnit}
                    />
                  ))}
                </Group>
              </>
            )}
          </Panel>

          <Panel id="history">
            <PanelHeader before={<PanelHeaderBack onClick={goBack} />}>История раскроев</PanelHeader>
            <Group header={<Header>Сохранённые раскрои</Header>}>
              {historyItems.length === 0 ? (
                <Placeholder>История пока пустая. Сохрани любой расчёт, и он появится здесь.</Placeholder>
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
                    {item.projectLabel || item.projectName}
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
