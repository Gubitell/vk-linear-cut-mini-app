import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15

RowLayout {
    id: detailCard

    property int detailLength: 0
    property int detailQuantity: 0

    signal deleteRequested()

    height: 60
    spacing: 10

    Rectangle {
        Layout.fillWidth: true
        Layout.preferredHeight: 60
        color: "#FFFFFF"
        border.color: "#E0E0E0"
        border.width: 1
        radius: 8

        Text {
            anchors.fill: parent
            anchors.margins: 15
            text: detailLength + " × " + detailQuantity + " шт"
            font.pixelSize: 16
            color: "#212121"
            verticalAlignment: Text.AlignVCenter
        }
    }

    Button {
        Layout.preferredWidth: 40
        Layout.preferredHeight: 40
        Layout.alignment: Qt.AlignVCenter
        text: "×"
        font.pixelSize: 20
        font.bold: true
        topPadding: 0
        background: Rectangle {
            color: parent.pressed ? "#E53935" : "#F44336"
            radius: 20
        }
        contentItem: Text {
            text: parent.text
            font: parent.font
            color: "white"
            horizontalAlignment: Text.AlignHCenter
            verticalAlignment: Text.AlignVCenter
        }
        onClicked: detailCard.deleteRequested()
    }
}
