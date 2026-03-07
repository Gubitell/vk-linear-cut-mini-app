import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15

Page {
    id: detailsInputPage

    property var material: null

    signal back()
    signal calculate(var details)

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
                onClicked: detailsInputPage.back()
            }

            Text {
                Layout.fillWidth: true
                text: "Ввод деталей"
                font.pixelSize: 22
                font.bold: true
                color: "#212121"
            }
        }

        ColumnLayout {
            Layout.fillWidth: true
            spacing: 15

            Text {
                text: "Добавить деталь:"
                font.pixelSize: 16
                font.bold: true
                color: "#424242"
            }

            RowLayout {
                Layout.fillWidth: true
                spacing: 10

                ColumnLayout {
                    Layout.fillWidth: true
                    spacing: 5

                    Text {
                        text: "Длина:"
                        font.pixelSize: 14
                        color: "#757575"
                    }

                    TextField {
                        id: lengthField
                        Layout.fillWidth: true
                        Layout.preferredHeight: 45
                        text: ""
                        placeholderText: "0"
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
                        
                        Keys.onReturnPressed: {
                            // Enter переводит фокус на количество
                            quantityField.forceActiveFocus()
                            quantityField.selectAll()
                        }
                    }
                }

                ColumnLayout {
                    Layout.fillWidth: true
                    spacing: 5

                    Text {
                        text: "Количество:"
                        font.pixelSize: 14
                        color: "#757575"
                    }

                    TextField {
                        id: quantityField
                        Layout.fillWidth: true
                        Layout.preferredHeight: 45
                        text: ""
                        placeholderText: "0"
                        font.pixelSize: 16
                        verticalAlignment: Text.AlignVCenter
                        inputMethodHints: Qt.ImhFormattedNumbersOnly
                        validator: IntValidator { bottom: 1; top: 1000 }
                        background: Rectangle {
                            color: "#FFFFFF"
                            border.color: parent.focus ? "#2196F3" : "#BDBDBD"
                            border.width: 2
                            radius: 8
                        }
                        
                        Keys.onReturnPressed: {
                            // Enter для добавления детали
                            if (lengthField.text.length > 0 && text.length > 0) {
                                var length = parseFloat(lengthField.text)
                                var qty = parseInt(text)
                                if (length > 0 && qty > 0 && material && length <= material.length) {
                                    detailsModel.append({
                                        length: length,
                                        quantity: qty
                                    })
                                    lengthField.text = ""
                                    text = ""
                                    lengthField.forceActiveFocus()
                                }
                            }
                        }
                    }
                }

                Button {
                    Layout.preferredWidth: 50
                    Layout.preferredHeight: 45
                    Layout.alignment: Qt.AlignBottom
                    text: "+"
                    font.pixelSize: 24                    
                    font.bold: true
                    topPadding: 0
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
                    onClicked: {
                        if (lengthField.text.length > 0 && quantityField.text.length > 0) {
                            var length = parseFloat(lengthField.text)
                            var qty = parseInt(quantityField.text)
                            if (length > 0 && qty > 0 && material && length <= material.length) {
                                detailsModel.append({
                                    length: length,
                                    quantity: qty
                                })
                                lengthField.text = ""
                                quantityField.text = ""
                                lengthField.forceActiveFocus()
                            }
                        }
                    }
                }
            }
        }

        ColumnLayout {
            Layout.fillWidth: true
            Layout.fillHeight: true
            spacing: 10

            Text {
                text: "Список деталей:"
                font.pixelSize: 16
                font.bold: true
                color: "#424242"
            }

            ListView {
                id: detailsListView
                Layout.fillWidth: true
                Layout.fillHeight: true
                model: ListModel {
                    id: detailsModel
                }
                delegate: DetailCard {
                    width: detailsListView.width
                    detailLength: model.length
                    detailQuantity: model.quantity
                    onDeleteRequested: {
                        detailsModel.remove(index)
                    }
                }
                spacing: 10
            }
        }

        Rectangle {
            Layout.fillWidth: true
            Layout.preferredHeight: 60
            color: detailsModel.count > 0 ? (mouseArea.pressed ? "#1565C0" : (mouseArea.containsMouse ? "#1976D2" : "#2196F3")) : "#BDBDBD"
            radius: 8
            
            Text {
                anchors.centerIn: parent
                text: "Рассчитать"
                font.pixelSize: 18
                font.bold: false
                color: "white"
            }
            
            MouseArea {
                id: mouseArea
                anchors.fill: parent
                enabled: detailsModel.count > 0
                hoverEnabled: true
                cursorShape: Qt.PointingHandCursor
                onClicked: {
                    var details = []
                    for (var i = 0; i < detailsModel.count; i++) {
                        details.push({
                            length: detailsModel.get(i).length,
                            quantity: detailsModel.get(i).quantity
                        })
                    }
                    detailsInputPage.calculate(details)
                }
            }
        }
    }
}
