import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15

Page {
    id: historyPage

    signal back()
    signal projectSelected(var project)

    function getProjectData(projectType) {
        if (projectType === "balcony") {
            return {
                material: { length: 6000, cutWidth: 4, cost: null },
                details: [
                    { length: 2400, quantity: 2 },
                    { length: 1800, quantity: 3 },
                    { length: 1200, quantity: 4 }
                ],
                result: {
                    boardCount: 4,
                    materialLength: 6000,
                    totalMaterialUsed: 24000,
                    totalPiecesLength: 19200,
                    totalWaste: 6480,
                    wastePercent: 27,
                    benefitPercent: 73,
                    cutsCount: 8,
                    boards: [
                        { boardNumber: 1, pieces: [2400, 2400, 1200], usedLength: 5736, wasteLength: 264 },
                        { boardNumber: 2, pieces: [1800, 1800, 1800], usedLength: 5388, wasteLength: 612 },
                        { boardNumber: 3, pieces: [1800, 1200, 1200, 1200], usedLength: 5196, wasteLength: 804 },
                        { boardNumber: 4, pieces: [1200], usedLength: 1200, wasteLength: 4800 }
                    ],
                    details: [{ length: 1200, quantity: 4 }, { length: 1800, quantity: 3 }, { length: 2400, quantity: 2 }],
                    cost: null
                }
            }
        }
        if (projectType === "office") {
            return {
                material: { length: 100, cutWidth: 0, cost: null },
                details: [
                    { length: 30, quantity: 2 },
                    { length: 25, quantity: 2 },
                    { length: 15, quantity: 2 }
                ],
                result: {
                    boardCount: 2,
                    materialLength: 100,
                    totalMaterialUsed: 200,
                    totalPiecesLength: 170,
                    totalWaste: 30,
                    wastePercent: 15,
                    benefitPercent: 85,
                    cutsCount: 4,
                    boards: [
                        { boardNumber: 1, pieces: [30, 30, 25, 15], usedLength: 100, wasteLength: 0 },
                        { boardNumber: 2, pieces: [25, 15], usedLength: 40, wasteLength: 60 }
                    ],
                    details: [{ length: 15, quantity: 2 }, { length: 25, quantity: 2 }, { length: 30, quantity: 2 }],
                    cost: null
                }
            }
        }
        if (projectType === "kitchen") {
            return {
                material: { length: 3000, cutWidth: 0, cost: null },
                details: [
                    { length: 600, quantity: 4 },
                    { length: 400, quantity: 2 },
                    { length: 800, quantity: 2 }
                ],
                result: {
                    boardCount: 2,
                    materialLength: 3000,
                    totalMaterialUsed: 6000,
                    totalPiecesLength: 5600,
                    totalWaste: 400,
                    wastePercent: 6.67,
                    benefitPercent: 93.33,
                    cutsCount: 7,
                    boards: [
                        { boardNumber: 1, pieces: [800, 800, 600, 600], usedLength: 2800, wasteLength: 200 },
                        { boardNumber: 2, pieces: [600, 600, 400, 400], usedLength: 2800, wasteLength: 200 }
                    ],
                    details: [{ length: 400, quantity: 2 }, { length: 600, quantity: 4 }, { length: 800, quantity: 2 }],
                    cost: null
                }
            }
        }
        return null
    }

    background: Rectangle {
        color: "#F5F5F5"
    }

    ColumnLayout {
        anchors.fill: parent
        anchors.margins: 20
        spacing: 15

        RowLayout {
            Layout.fillWidth: true
            spacing: 15

            Button {
                text: "←"
                font.pixelSize: 26
                Layout.preferredWidth: 50
                Layout.preferredHeight: 50
                topPadding: 0
                background: Rectangle {
                    color: "#F5F5F5"
                    radius: 25
                }
                contentItem: Text {
                    text: parent.text
                    font: parent.font
                    color: "#212121"
                    horizontalAlignment: Text.AlignHCenter
                    verticalAlignment: Text.AlignVCenter
                }
                onClicked: historyPage.back()
            }

            Text {
                Layout.fillWidth: true
                text: "История расчётов"
                font.pixelSize: 22
                font.bold: true
                color: "#212121"
            }
        }

        TextField {
            id: searchField
            Layout.fillWidth: true
            Layout.preferredHeight: 50
            placeholderText: "🔍 Поиск..."
            font.pixelSize: 16
            verticalAlignment: Text.AlignVCenter
            background: Rectangle {
                color: "#FFFFFF"
                border.color: searchField.focus ? "#2196F3" : "#BDBDBD"
                border.width: 2
                radius: 8
            }
        }

        ListView {
            Layout.fillWidth: true
            Layout.fillHeight: true
            model: ListModel {
                id: historyModel
                ListElement {
                    name: "Проект «Кухня»"
                    projectType: "kitchen"
                    boardCount: 2
                    wastePercent: 6.7
                    date: "05.02.2026"
                }
                ListElement {
                    name: "Проект «Балкон»"
                    projectType: "balcony"
                    boardCount: 4
                    wastePercent: 27
                    date: "03.02.2026"
                }
                ListElement {
                    name: "Проект «Офис»"
                    projectType: "office"
                    boardCount: 2
                    wastePercent: 15
                    date: "01.02.2026"
                }
            }
            delegate: Rectangle {
                width: ListView.view.width
                height: 100
                color: mouseArea.pressed ? "#E3F2FD" : (mouseArea.containsMouse ? "#F5F5F5" : "#FFFFFF")
                border.color: "#E0E0E0"
                border.width: 1
                radius: 8

                RowLayout {
                    anchors.fill: parent
                    anchors.margins: 15
                    spacing: 15

                    ColumnLayout {
                        Layout.fillWidth: true
                        spacing: 5

                        Text {
                            text: model.name
                            font.pixelSize: 16
                            font.bold: true
                            color: "#212121"
                        }

                        Text {
                            text: model.boardCount + " заготовок, " + model.wastePercent + "% остатков"
                            font.pixelSize: 14
                            color: "#757575"
                        }

                        Text {
                            text: model.date
                            font.pixelSize: 12
                            color: "#9E9E9E"
                        }
                    }

                    Text {
                        text: "→"
                        font.pixelSize: 24
                        color: "#BDBDBD"
                    }
                }

                MouseArea {
                    id: mouseArea
                    anchors.fill: parent
                    hoverEnabled: true
                    onClicked: {
                        var project = historyPage.getProjectData(model.projectType)
                        if (project) historyPage.projectSelected(project)
                    }
                }
            }
            spacing: 10
        }
    }
}
