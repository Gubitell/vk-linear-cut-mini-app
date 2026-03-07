import QtQuick 2.15
import QtQuick.Controls 2.15

Rectangle {
    id: template

    property string name: ""
    property int length: 0
    property int cutWidth: 0

    signal clicked()

    width: 150
    height: 80
    color: mouseArea.pressed ? "#E3F2FD" : "#FFFFFF"
    border.color: "#BDBDBD"
    border.width: 1
    radius: 8

    Column {
        anchors.centerIn: parent
        spacing: 5

        Text {
            anchors.horizontalCenter: parent.horizontalCenter
            text: template.name
            font.pixelSize: 16
            font.bold: true
            color: "#212121"
        }

        Text {
            anchors.horizontalCenter: parent.horizontalCenter
            text: template.length
            font.pixelSize: 14
            color: "#757575"
        }
    }

    MouseArea {
        id: mouseArea
        anchors.fill: parent
        onClicked: template.clicked()
    }
}
