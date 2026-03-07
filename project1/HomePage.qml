import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15

Page {
    id: homePage

    signal newCalculation()
    signal showHistory()
    signal templateSelected(var material)

    background: Rectangle {
        color: "#F5F5F5"
    }

    ColumnLayout {
        anchors.fill: parent
        anchors.margins: 20
        spacing: 30

        Text {
            Layout.fillWidth: true
            text: "Калькулятор раскроя материалов"
            font.pixelSize: 20
            font.bold: true
            horizontalAlignment: Text.AlignHCenter
            color: "#212121"
        }

        Button {
            Layout.fillWidth: true
            Layout.preferredHeight: 60
            text: "Новый расчёт"
            font.pixelSize: 18
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
            onClicked: homePage.newCalculation()
        }

        ColumnLayout {
            Layout.fillWidth: true
            Layout.alignment: Qt.AlignHCenter
            spacing: 15

            Text {
                Layout.fillWidth: true
                text: "Шаблоны материалов:"
                font.pixelSize: 16
                font.bold: true
                color: "#424242"
                horizontalAlignment: Text.AlignHCenter
            }

            GridLayout {
                Layout.alignment: Qt.AlignHCenter
                columns: 2
                columnSpacing: 15
                rowSpacing: 15

                MaterialTemplate {
                    name: "Доска 6м"
                    length: 6000
                    cutWidth: 4
                    onClicked: homePage.templateSelected({ length: length, cutWidth: cutWidth, cost: null })
                }

                MaterialTemplate {
                    name: "Труба 3м"
                    length: 3000
                    cutWidth: 3
                    onClicked: homePage.templateSelected({ length: length, cutWidth: cutWidth, cost: null })
                }

                MaterialTemplate {
                    name: "Профиль 3м"
                    length: 3000
                    cutWidth: 0
                    onClicked: homePage.templateSelected({ length: length, cutWidth: cutWidth, cost: null })
                }

                MaterialTemplate {
                    name: "Кабель 100м"
                    length: 100
                    cutWidth: 0
                    onClicked: homePage.templateSelected({ length: length, cutWidth: cutWidth, cost: null })
                }
            }
        }

        Button {
            Layout.fillWidth: true
            Layout.preferredHeight: 60
            text: "История расчётов"
            font.pixelSize: 16
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
            onClicked: homePage.showHistory()
        }

        Item {
            Layout.fillHeight: true
        }
    }
}
