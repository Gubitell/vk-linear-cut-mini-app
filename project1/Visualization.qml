import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15

Page {
    id: visualizationPage

    property var result: null
    property var material: null

    signal back()

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

            Button  {
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
                onClicked: visualizationPage.back()
            }

            Text {
                Layout.fillWidth: true
                text: result ? "Заготовка " + (swipeView.currentIndex + 1) + " из " + result.boardCount : "Визуализация"
                font.pixelSize: 20
                font.bold: true
                color: "#212121"
            }
        }

        SwipeView {
            id: swipeView
            Layout.fillWidth: true
            Layout.fillHeight: true
            interactive: true
            clip: true

            Repeater {
                model: result ? result.boards : null
                delegate: BoardView {
                    board: modelData
                    materialLength: material ? material.length : 0
                    cutWidth: material ? material.cutWidth : 0
                }
            }
        }

        ColumnLayout {
            Layout.fillWidth: true
            Layout.alignment: Qt.AlignHCenter
            spacing: 5
            visible: swipeView.count > 1

            Rectangle {
                Layout.preferredWidth: 200
                Layout.preferredHeight: 8
                Layout.alignment: Qt.AlignHCenter
                color: "#E0E0E0"
                radius: 24

                Rectangle {
                    width: parent.width * (swipeView.count > 0 ? (swipeView.currentIndex + 1) / swipeView.count : 0)
                    height: parent.height
                    color: "#2196F3"
                    radius: 4

                    Behavior on width {
                        NumberAnimation { duration: 200; easing.type: Easing.OutQuad }
                    }
                }
            }

            Text {
                Layout.alignment: Qt.AlignHCenter
                text: swipeView.count > 0 ? (swipeView.currentIndex + 1) + " / " + swipeView.count : ""
                font.pixelSize: 12
                color: "#757575"
            }
        }

        Button {
            Layout.fillWidth: true
            Layout.preferredHeight: 50
            text: "Экспорт схемы"
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
            onClicked: {
                console.log("Экспорт (заглушка)")
            }
        }
    }
}
