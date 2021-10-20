const config = require('config')
const _ = require('lodash')
const yves = require('../lib/yves')
const pkg = require('../package.json')
const debugError = yves.debugger(`${pkg.name.replace(/^@/, '')}:${(require('change-case').paramCase(require('path').basename(__filename, '.js'))).replace(/-/g, ':')}:error`)



const { QApplication, QSize, QMainWindow, QWidget, QLabel, FlexLayout, QPushButton, QIcon, PenStyle,
  QColor,
  QPainter,
  QPoint,
  RenderHint,
  WidgetEventTypes } = require('@nodegui/nodegui')



const hourHand = [new QPoint(7, 8), new QPoint(-7, 8), new QPoint(0, -40)]
const minuteHand = [new QPoint(7, 8), new QPoint(-7, 8), new QPoint(0, -70)]
const secondHand = [new QPoint(4, 8), new QPoint(-4, 8), new QPoint(0, -70)]
const hourColor = new QColor(127, 0, 127)
const minuteColor = new QColor(0, 127, 127, 191)
const secondColor = new QColor(0, 0, 0)

//app = new QApplication(('My Application Name'))



function gui(name, sub, options) {
  debug('Hi from GUI')

  /*  QCoreApplication::setApplicationName("your title")*/

  const win = new QMainWindow()

  function repaint() {
    win.repaint()
    setTimeout(repaint, 1000)
  }

  setTimeout(repaint, 1000)

  const side = Math.min(win.geometry().width(), win.geometry().height())
  win.setWindowTitle('Bacara Sequencer')
  win.resize(500, 500)

  const centralWidget = new QWidget()
  centralWidget.setObjectName('myroot')
  const rootLayout = new FlexLayout()
  centralWidget.setLayout(rootLayout)

  const canvas = new QWidget()
  canvas.setObjectName('mycanvas')
  //canvas.resize(500,500)
  //  canvas.setStyleSheet("border: 1px solid red")

  win.addEventListener(WidgetEventTypes.Paint, () => {

    //    console.time('paint');
    const time = new Date()

    const painter = new QPainter(win)
    painter.setRenderHint(RenderHint.Antialiasing)
    painter.translate(win.geometry().width() / 2, win.geometry().height() / 2)
    painter.scale(side / 200.0, side / 200.0)

    painter.setPen(PenStyle.NoPen)
    painter.setBrush(hourColor)

    painter.save()
    painter.rotate(30.0 * (time.getHours() + time.getMinutes() / 60.0))
    painter.drawConvexPolygon(hourHand)
    painter.restore()

    painter.setPen(hourColor)

    for (let i = 0; i < 12; ++i) {
      painter.drawLine(88, 0, 96, 0)
      painter.rotate(30.0)
    }

    painter.setPen(PenStyle.NoPen)
    painter.setBrush(minuteColor)

    painter.save()
    painter.rotate(6.0 * (time.getMinutes() + time.getSeconds() / 60.0))
    painter.drawConvexPolygon(minuteHand)
    painter.restore()

    painter.setBrush(secondColor)
    painter.setPen(PenStyle.NoPen)

    painter.save()
    painter.rotate(360 * (time.getSeconds() / 60.0))
    painter.drawConvexPolygon(secondHand)
    painter.restore()

    painter.setPen(minuteColor)
    for (let j = 0; j < 60; ++j) {
      if (j % 5 != 0) {
        painter.drawLine(92, 0, 96, 0)
      }
      painter.rotate(6.0)
    }
    painter.end()
    /*    console.timeEnd('paint');*/
  })

  const label = new QLabel()
  label.setObjectName('mylabel')
  label.setText('Hello')

  const button = new QPushButton()
  button.setObjectName('mybutton')
  button.setIcon(new QIcon('./assets/logox200.png'))
  button.setIconSize(new QSize(100, 100))

  const label2 = new QLabel()
  label2.setText('World')
  label2.setInlineStyle(`
    color: red;
    margin-top:4px;
  `)

  rootLayout.addWidget(canvas)
  rootLayout.addWidget(label)
  rootLayout.addWidget(button)
  rootLayout.addWidget(label2)
  win.setCentralWidget(centralWidget)
  win.setStyleSheet(`
    #tmp {
      background-color: #009688;
    }

      #myroot {
        height: '100%';
        align-items: 'center';
        justify-content: 'center';
      }
      #mycanvas {
        border: 1px solid red;
        width: 200px;
        height: 200px;
      }
      #mybutton {
        width: 100px;
        height: 100px;
        margin:4px;
      }
      #mylabel {
        font-size: 16px;
        font-weight: bold;
        padding: 1;
      }
  `)
  win.show()

  //  (global as any).win = win;

}

module.exports = {
  name: 'gui',
  description: 'GUI for Bacara',
  handler: gui,
  examples: [
    {usage:'electra-one gui', description:'Starts GUI for Bacara sequencer'},
  ],
  aliases:[]
}