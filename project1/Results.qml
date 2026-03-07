import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15

Page {
    id: resultsPage

    property var result: null
    property var material: null

    signal back()
    signal showVisualization()

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
                onClicked: resultsPage.back()
            }

            Text {
                Layout.fillWidth: true
                text: "Результаты"
                font.pixelSize: 22
                font.bold: true
                color: "#212121"
            }
        }

        Flickable {
            Layout.fillWidth: true
            Layout.fillHeight: true
            contentHeight: contentColumn.height
            clip: true
            
            ColumnLayout {
                id: contentColumn
                width: parent.width
                spacing: 15

                // Использовано заготовок
                Rectangle {
                    Layout.fillWidth: true
                    implicitHeight: 90
                    color: "#E3F2FD"
                    border.color: "#2196F3"
                    border.width: 2
                    radius: 12

                    ColumnLayout {
                        anchors.centerIn: parent
                        spacing: 5

                        Text {
                            anchors.horizontalCenter: parent.horizontalCenter
                            text: "Использовано заготовок"
                            font.pixelSize: 13
                            color: "#757575"
                        }

                        Text {
                            anchors.horizontalCenter: parent.horizontalCenter
                            text: result ? result.materialLength + " × " + result.boardCount + " шт. = " + result.totalMaterialUsed : ""
                            font.pixelSize: 18
                            font.bold: true
                            color: "#1976D2"
                        }
                    }
                }

                // Польза и остатки
                RowLayout {
                    Layout.fillWidth: true
                    spacing: 10

                    Rectangle {
                        Layout.fillWidth: true
                        Layout.preferredHeight: 85
                        color: "#E8F5E9"
                        border.color: "#4CAF50"
                        border.width: 2
                        radius: 12

                        ColumnLayout {
                            anchors.centerIn: parent
                            spacing: 3

                            Text {
                                anchors.horizontalCenter: parent.horizontalCenter
                                text: "Польза"
                                font.pixelSize: 12
                                color: "#757575"
                            }

                            Text {
                                anchors.horizontalCenter: parent.horizontalCenter
                                text: result ? result.benefitPercent.toFixed(3) + "%" : "0%"
                                font.pixelSize: 20
                                font.bold: true
                                color: "#2E7D32"
                            }
                        }
                    }

                    Rectangle {
                        Layout.fillWidth: true
                        Layout.preferredHeight: 85
                        color: "#FFEBEE"
                        border.color: "#F44336"
                        border.width: 2
                        radius: 12

                        ColumnLayout {
                            anchors.centerIn: parent
                            spacing: 3

                            Text {
                                anchors.horizontalCenter: parent.horizontalCenter
                                text: "Остатки"
                                font.pixelSize: 12
                                color: "#757575"
                            }

                            Text {
                                anchors.horizontalCenter: parent.horizontalCenter
                                text: result ? result.wastePercent.toFixed(3) + "% (" + result.totalWaste + ")" : "0%"
                                font.pixelSize: 16
                                font.bold: true
                                color: "#C62828"
                                wrapMode: Text.NoWrap
                            }
                        }
                    }
                }

                // Количество разрезов
                Rectangle {
                    Layout.fillWidth: true
                    implicitHeight: 70
                    color: "#FFF3E0"
                    border.color: "#FF9800"
                    border.width: 2
                    radius: 12

                    RowLayout {
                        anchors.centerIn: parent
                        spacing: 10

                        Text {
                            text: "Количество разрезов:"
                            font.pixelSize: 14
                            color: "#757575"
                        }

                        Text {
                            text: result ? result.cutsCount : "0"
                            font.pixelSize: 22
                            font.bold: true
                            color: "#E65100"
                        }
                    }
                }

                // Общая стоимость (если указана)
                Rectangle {
                    Layout.fillWidth: true
                    implicitHeight: 70
                    visible: result && result.cost !== null && result.cost !== undefined
                    color: "#E8F5E9"
                    border.color: "#4CAF50"
                    border.width: 2
                    radius: 12

                    RowLayout {
                        anchors.centerIn: parent
                        spacing: 10

                        Text {
                            text: "Общая стоимость:"
                            font.pixelSize: 14
                            color: "#757575"
                        }

                        Text {
                            text: result && result.cost ? result.cost.toFixed(2) : ""
                            font.pixelSize: 22
                            font.bold: true
                            color: "#2E7D32"
                        }
                    }
                }

                // Детали
                Rectangle {
                    Layout.fillWidth: true
                    implicitHeight: detailsCol.implicitHeight + 20
                    color: "#FFFFFF"
                    border.color: "#BDBDBD"
                    border.width: 2
                    radius: 12

                    ColumnLayout {
                        id: detailsCol
                        anchors.fill: parent
                        anchors.margins: 15
                        spacing: 8

                        Text {
                            text: "Детали:"
                            font.pixelSize: 15
                            font.bold: true
                            color: "#424242"
                        }

                        Repeater {
                            model: result ? result.details : []
                            delegate: Text {
                                text: modelData.length + " - " + modelData.quantity + " шт."
                                font.pixelSize: 13
                                color: "#616161"
                            }
                        }
                    }
                }
            }
        }

        ColumnLayout {
            Layout.fillWidth: true
            spacing: 10

            Button {
                Layout.fillWidth: true
                Layout.preferredHeight: 55
                text: "Показать схему раскроя"
                font.pixelSize: 16
                background: Rectangle {
                    color: parent.pressed ? "#1976D2" : "#2196F3"
                    radius: 8
                }
                contentItem: Text {
                    text: parent.text
                    font: parent.font
                    color: "white"
                    horizontalAlignment: Text.AlignHCenter
                    verticalAlignment: Text.AlignVCenter
                }
                onClicked: resultsPage.showVisualization()
            }

            Button {
                Layout.fillWidth: true
                Layout.preferredHeight: 50
                text: "Сохранить расчёт"
                font.pixelSize: 15
                background: Rectangle {
                    color: parent.pressed ? "#E0E0E0" : "#FFFFFF"
                    border.color: "#BDBDBD"
                    border.width: 1
                    radius: 8
                }
                contentItem: Text {
                    text: parent.text
                    font: parent.font
                    color: "#424242"
                    horizontalAlignment: Text.AlignHCenter
                    verticalAlignment: Text.AlignVCenter
                }
                onClicked: {
                    console.log("Сохранение (заглушка)")
                }
            }
        }
    }
}
