import QtQuick 2.15
import QtQuick.Layouts 1.15

Rectangle {
    id: boardView

    property var board: null
    property int materialLength: 0
    property int cutWidth: 0

    color: "#FFFFFF"
    border.color: "#BDBDBD"
    border.width: 2
    radius: 12

    ColumnLayout {
        anchors.fill: parent
        anchors.margins: 20
        spacing: 10

            RowLayout {
                Layout.fillWidth: true
                spacing: 15

                Text {
                    text: "Использовано: " + (board ? board.usedLength : 0)
                    font.pixelSize: 14
                    font.bold: true
                    color: "#212121"
                }

                Text {
                    text: "Остаток: " + (board ? board.wasteLength : 0)
                    font.pixelSize: 13
                    color: "#757575"
                }

                Item { Layout.fillWidth: true }
            }

        Rectangle {
            Layout.fillWidth: true
            Layout.fillHeight: true
            color: "#F5F5F5"
            border.color: "#BDBDBD"
            border.width: 1
            radius: 8
            clip: true

            Item {
                id: zoomContainer
                anchors.fill: parent
                anchors.margins: 15
                
                property real baseScaleFactor: materialLength > 0 ? (width * 0.95) / materialLength : 1

                Row {
                    id: boardRow
                    spacing: 0
                    scale: {
                        // Автомасштабирование чтобы схема влезала
                        if (width === 0) return 1.0
                        var availableWidth = zoomContainer.width
                        var neededWidth = width
                        if (neededWidth > availableWidth) {
                            return (availableWidth * 0.98) / neededWidth
                        }
                        return 1.0
                    }
                    transformOrigin: Item.Center
                    x: (zoomContainer.width - width * scale) / 2
                    y: (zoomContainer.height - height * scale) / 2

                    Behavior on scale {
                        enabled: !dragArea.drag.active
                        NumberAnimation { duration: 200; easing.type: Easing.OutQuad }
                    }

                    Repeater {
                        model: board ? board.pieces : null
                        delegate: Column {
                            spacing: 5

                            Rectangle {
                                width: modelData * zoomContainer.baseScaleFactor
                                height: 60
                                color: getColorForIndex(index)
                                border.color: "#424242"
                                border.width: 1
                                radius: 4

                                Text {
                                    anchors.centerIn: parent
                                    text: modelData
                                    font.pixelSize: 12
                                    font.bold: true
                                    color: "#FFFFFF"
                                }
                            }

                            Rectangle {
                                visible: index < (board.pieces.length - 1)
                                width: cutWidth * zoomContainer.baseScaleFactor
                                height: 20
                                color: "#9E9E9E"
                            }
                        }
                    }

                    Rectangle {
                        visible: board && board.wasteLength > 0
                        width: board ? board.wasteLength * zoomContainer.baseScaleFactor : 0
                        height: 60
                        color: "#CFCFCF"
                        border.color: "#9E9E9E"
                        border.width: 1
                        radius: 4

                        Canvas {
                            anchors.fill: parent
                            onPaint: {
                                var ctx = getContext("2d")
                                ctx.strokeStyle = "#9E9E9E"
                                ctx.lineWidth = 1
                                ctx.setLineDash([4, 4])
                                ctx.strokeRect(0, 0, width, height)
                            }
                        }

                        Text {
                            anchors.centerIn: parent
                            visible: parent.width > 50
                            text: board ? board.wasteLength : ""
                            font.pixelSize: 11
                            color: "#616161"
                        }
                    }
                }

                PinchArea {
                    anchors.fill: parent
                    pinch.target: boardRow
                    pinch.minimumScale: 0.3
                    pinch.maximumScale: 5.0
                    pinch.dragAxis: Pinch.XAndYAxis

                    MouseArea {
                        id: dragArea
                        anchors.fill: parent
                        drag.target: boardRow
                        drag.axis: Drag.XAndYAxis
                        scrollGestureEnabled: false
                        cursorShape: pressed ? Qt.ClosedHandCursor : Qt.OpenHandCursor

                        onWheel: function(wheel) {
                            var scaleFactor = wheel.angleDelta.y > 0 ? 1.15 : 0.85
                            var newScale = boardRow.scale * scaleFactor
                            
                            // Ограничение масштаба
                            if (newScale < 0.3) newScale = 0.3
                            if (newScale > 5.0) newScale = 5.0
                            
                            boardRow.scale = newScale
                        }

                        onDoubleClicked: {
                            // Двойной клик - сброс масштаба и позиции
                            boardRow.scale = Qt.binding(function() {
                                if (boardRow.width === 0) return 1.0
                                var availableWidth = zoomContainer.width
                                var neededWidth = boardRow.width
                                if (neededWidth > availableWidth) {
                                    return availableWidth / neededWidth
                                }
                                return 1.0
                            })
                            boardRow.x = Qt.binding(function() { 
                                return (zoomContainer.width - boardRow.width * boardRow.scale) / 2 
                            })
                            boardRow.y = Qt.binding(function() { 
                                return (zoomContainer.height - boardRow.height * boardRow.scale) / 2 
                            })
                        }
                    }

                    onPinchFinished: {
                        if (boardRow.scale < 0.3) boardRow.scale = 0.3
                        if (boardRow.scale > 5.0) boardRow.scale = 5.0
                    }
                }
            }
        }

        Text {
            Layout.alignment: Qt.AlignHCenter
            text: "Колесико - зум, ЛКМ - перемещение, 2х клик - сброс"
            font.pixelSize: 9
            color: "#757575"
            opacity: 0.7
        }

        Flow {
            Layout.fillWidth: true
            Layout.maximumHeight: 60
            Layout.alignment: Qt.AlignHCenter
            spacing: 10
            clip: true

            Repeater {
                model: board ? board.pieces.length : 0
                delegate: Row {
                    spacing: 5

                    Rectangle {
                        width: 16
                        height: 16
                        anchors.verticalCenter: parent.verticalCenter
                        color: getColorForIndex(index)
                        border.color: "#424242"
                        border.width: 1
                        radius: 3
                    }

                    Text {
                        anchors.verticalCenter: parent.verticalCenter
                        text: "Деталь " + (index + 1)
                        font.pixelSize: 11
                        color: "#757575"
                    }
                }
            }
        }
    }

    function getColorForIndex(index) {
        var colors = [
            "#2196F3",
            "#4CAF50",
            "#FF9800",
            "#9C27B0",
            "#F44336",
            "#00BCD4",
            "#FFC107",
            "#795548"
        ]
        return colors[index % colors.length]
    }
}
