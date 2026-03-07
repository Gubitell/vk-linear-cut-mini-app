import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15

Page {
    id: materialSetupPage

    signal back()
    signal continueClicked(var material)

    background: Rectangle {
        color: "#F5F5F5"
    }

    ColumnLayout {
        anchors.fill: parent
        anchors.margins: 20
        spacing: 20

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
                onClicked: materialSetupPage.back()
            }

            Text {
                Layout.fillWidth: true
                text: "Настройка материала"
                font.pixelSize: 22
                font.bold: true
                color: "#212121"
            }
        }

        ColumnLayout {
            Layout.fillWidth: true
            spacing: 25

            ColumnLayout {
                Layout.fillWidth: true
                spacing: 8

                Text {
                    text: "Длина исходного материала:"
                    font.pixelSize: 16
                    color: "#424242"
                }

                RowLayout {
                    Layout.fillWidth: true
                    spacing: 10

                    TextField {
                        id: lengthField
                        Layout.fillWidth: true
                        Layout.preferredHeight: 50
                        placeholderText: "6000 или 6.5"
                        text: "6000"
                        font.pixelSize: 16
                        verticalAlignment: Text.AlignVCenter
                        inputMethodHints: Qt.ImhFormattedNumbersOnly
                        validator: DoubleValidator { bottom: 0.001; top: 10000000; decimals: 3 }
                        background: Rectangle {
                            color: "#FFFFFF"
                            border.color: parent.focus ? "#2196F3" : "#BDBDBD"
                            border.width: 2
                            radius: 8
                        }
                    }
                }
            }

            ColumnLayout {
                Layout.fillWidth: true
                spacing: 8

                Text {
                    text: "Толщина реза (пропил):"
                    font.pixelSize: 16
                    color: "#424242"
                }

                RowLayout {
                    Layout.fillWidth: true
                    spacing: 10

                    TextField {
                        id: cutWidthField
                        Layout.fillWidth: true
                        Layout.preferredHeight: 50
                        placeholderText: "3 или 3.2"
                        text: "3"
                        font.pixelSize: 16
                        verticalAlignment: Text.AlignVCenter
                        inputMethodHints: Qt.ImhFormattedNumbersOnly
                        validator: DoubleValidator { bottom: 0; top: 100; decimals: 3 }
                        background: Rectangle {
                            color: "#FFFFFF"
                            border.color: parent.focus ? "#2196F3" : "#BDBDBD"
                            border.width: 2
                            radius: 8
                        }
                    }
                }
            }

            ColumnLayout {
                Layout.fillWidth: true
                spacing: 8

                Text {
                    text: "Стоимость единицы (опционально):"
                    font.pixelSize: 16
                    color: "#424242"
                }

                RowLayout {
                    Layout.fillWidth: true
                    spacing: 10

                    TextField {
                        id: costField
                        Layout.fillWidth: true
                        Layout.preferredHeight: 50
                        font.pixelSize: 16
                        placeholderText: "0"
                        verticalAlignment: Text.AlignVCenter
                        inputMethodHints: Qt.ImhFormattedNumbersOnly
                        validator: DoubleValidator { bottom: 0 }
                        background: Rectangle {
                            color: "#FFFFFF"
                            border.color: parent.focus ? "#2196F3" : "#BDBDBD"
                            border.width: 2
                            radius: 8
                        }
                    }
                }
            }
        }

        Item {
            Layout.fillHeight: true
        }

        Button {
            Layout.fillWidth: true
            Layout.preferredHeight: 60
            text: "Продолжить"
            font.pixelSize: 18
            enabled: lengthField.text.length > 0 && parseFloat(lengthField.text) > 0
            background: Rectangle {
                color: parent.enabled ? (parent.pressed ? "#1976D2" : "#2196F3") : "#BDBDBD"
                radius: 8
            }
            contentItem: Text {
                text: parent.text
                font: parent.font
                color: "white"
                horizontalAlignment: Text.AlignHCenter
                verticalAlignment: Text.AlignVCenter
            }
            onClicked: {
                var material = {
                    length: parseFloat(lengthField.text),
                    cutWidth: parseFloat(cutWidthField.text) || 0,
                    cost: costField.text.length > 0 ? parseFloat(costField.text) : null
                }
                materialSetupPage.continueClicked(material)
            }
        }
    }
}
