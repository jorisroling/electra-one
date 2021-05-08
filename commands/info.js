const Midi = require('../lib/midi')
const { table } = require('table')
const chalk = require('chalk')
const labelColor = chalk.hex('#FF8800')

function queryInfo(name, sub, options) {
  const midiInputCtrlPort = Midi.input(options.electraOneCtrl)
  const midiOutputCtrlPort = Midi.output(options.electraOneCtrl)

  function close() {
    midiInputCtrlPort.close()
    midiOutputCtrlPort.close()
    process.exit()
  }

  midiInputCtrlPort.on('message', (msg) => {
    if (msg._type == 'sysex' && msg.bytes && msg.bytes.length >= 7 && msg.bytes[0] == 0xF0 && msg.bytes[1] == 0x00 && msg.bytes[2] == 0x21 && msg.bytes[3] == 0x45 && msg.bytes[4] == 0x01 && msg.bytes[5] == 0x7F /*&& msg.bytes[msg.bytes.length-1]==0xF7*/) {
      const info = JSON.parse(msg.bytes.slice(6, msg.bytes.length - 1).reduce((a, c) => a + String.fromCharCode(parseInt(c)),''))
/*      debug('info: %y',info)*/

      const data = []
      const keys = Object.keys(data)

      for (const key in info) {
        data.push([labelColor(key),labelColor(info[key])])
      }

      const output = table(data, {})
      console.log(output)

      close()
    }
  } )

  let bytes = [
    0xF0,   /* sysex start - 0xf0 */
    0x00,   /* manufacturer ID 1 - 0x00 */
    0x21,   /* manufacturer ID 2 - 0x21 */
    0x45,   /* manufacturer ID 3 - 0x45 */
    0x02,   /* Query data */
    0x7F,   /* Electra information */
    0xF7    /* sysex end - 0xf7 */
  ]


  midiOutputCtrlPort.send('sysex',bytes)

  setTimeout( close, 2500)

}

module.exports = {
  name: 'info',
  description: 'Query Console Info',
  handler: queryInfo,
  aliases:[]
}