import QtQuick 2.15
import QtQuick.Window 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15

ApplicationWindow {
    id: window
    width: 360
    height: 640
    visible: true
    title: qsTr("Калькулятор раскроя")

    // Цветовая схема
    readonly property color primaryColor: "#2196F3"
    readonly property color secondaryColor: "#FF9800"
    readonly property color backgroundColor: "#F5F5F5"
    readonly property color textColor: "#212121"
    readonly property color wasteColor: "#9E9E9E"

    StackView {
        id: stackView
        anchors.fill: parent
        initialItem: homePage

        pushEnter: Transition {
            PropertyAnimation {
                property: "opacity"
                from: 0
                to: 1
                duration: 200
            }
        }
        pushExit: Transition {
            PropertyAnimation {
                property: "opacity"
                from: 1
                to: 0
                duration: 200
            }
        }
        popEnter: Transition {
            PropertyAnimation {
                property: "opacity"
                from: 0
                to: 1
                duration: 200
            }
        }
        popExit: Transition {
            PropertyAnimation {
                property: "opacity"
                from: 1
                to: 0
                duration: 200
            }
        }
    }

    // Главная страница
    Component {
        id: homePage
        HomePage {
            onNewCalculation: stackView.push(materialSetupPage)
            onShowHistory: stackView.push(historyPage)
            onTemplateSelected: function(material) {
                mockMaterial = material
                stackView.push(detailsInputPage)
            }
        }
    }

    // Настройка материала
    Component {
        id: materialSetupPage
        MaterialSetup {
            onBack: stackView.pop()
            onContinueClicked: function(material) {
                mockMaterial = material
                stackView.push(detailsInputPage)
            }
        }
    }

    // Ввод деталей
    Component {
        id: detailsInputPage
        DetailsInput {
            material: mockMaterial
            onBack: stackView.pop()
            onCalculate: function(details) {
                mockDetails = details
                // Вызываем Python логику оптимизации с ценой материала
                var cost = mockMaterial.cost || 0
                cuttingOptimizer.calculate(mockMaterial.length, mockMaterial.cutWidth, details, cost)
            }
        }
    }

    // Результаты
    Component {
        id: resultsPage
        Results {
            result: mockResult
            material: mockMaterial
            onBack: stackView.pop()
            onShowVisualization: stackView.push(visualizationPage)
        }
    }

    // Визуализация
    Component {
        id: visualizationPage
        Visualization {
            result: mockResult
            material: mockMaterial
            onBack: stackView.pop()
        }
    }

    // История
    Component {
        id: historyPage
        History {
            onBack: stackView.pop()
            onProjectSelected: function(project) {
                mockMaterial = project.material
                mockDetails = project.details
                mockResult = project.result
                stackView.push(resultsPage)
            }
        }
    }

    // Mock данные
    property var mockMaterial: null
    property var mockDetails: null
    property var mockResult: null
    
    // Подключение к Python обработчику результатов
    Connections {
        target: cuttingOptimizer
        function onCalculationComplete(result) {
            if (result.error) {
                console.error("Ошибка расчета:", result.error)
                // TODO: показать диалог с ошибкой
                return
            }
            mockResult = result
            stackView.push(resultsPage)
        }
    }

    function generateMockResult(details, material) {
        var boardCount = Math.ceil(details.reduce(function(sum, d) {
            return sum + (d.length * d.quantity);
        }, 0) / material.length) || 1;

        var boards = []
        for (var i = 0; i < boardCount; i++) {
            boards.push({
                pieces: [
                    {length: 1200},
                    {length: 2300},
                    {length: 2300}
                ],
                usedLength: 5800,
                wasteLength: 200,
                wastePercent: 3.3
            })
        }

        return {
            boards: boards,
            boardCount: boardCount,
            wastePercent: 8.5,
            cost: material.cost ? {
                total: boardCount * material.cost
            } : null
        }
    }
}
