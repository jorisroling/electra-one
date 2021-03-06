const Midi = require('../lib/midi/midi')
const { table } = require('table')
const chalk = require('chalk')
const labelColor = chalk.hex('#FF8800')

const config = require('config')
const _ = require('lodash')
const yves = require('../lib/yves')
const pkg = require('../package.json')
const debugError = yves.debugger(`${pkg.name.replace(/^@/, '')}:${(require('change-case').paramCase(require('path').basename(__filename, '.js'))).replace(/-/g, ':')}:error`)

const Bacara = require('../lib/bacara')

function queryInfo(name, sub, options) {
  const midiInputCtrlPort = Midi.input(options.electraOneCtrl)

  if (options.verbose) {
    debugError('options %y', _.fromPairs(_.toPairs(options).filter(a => a[0].length > 1 )) )
    debugError('config %y', config.util.toObject(config))
  }

  if (options.custom && options.custom.length) {
    Bacara.setPresetStateFilename(options.custom[options.custom.length - 1])
  }

  function close() {
    if (midiInputCtrlPort) {
      midiInputCtrlPort.close()
    }
    process.exit()
  }

  if (midiInputCtrlPort) {
    midiInputCtrlPort.on('message', (msg) => {
      if (msg._type == 'sysex' && msg.bytes && msg.bytes.length >= 7 && msg.bytes[0] == 0xF0 && msg.bytes[1] == 0x00 && msg.bytes[2] == 0x21 && msg.bytes[3] == 0x45 && msg.bytes[4] == 0x01 && (msg.bytes[5] == 0x7F || msg.bytes[5] == 0x7E || msg.bytes[5] == 0x7C)/*&& msg.bytes[msg.bytes.length-1]==0xF7*/) {
        const info = JSON.parse(msg.bytes.slice(6, msg.bytes.length - 1).reduce((a, c) => a + String.fromCharCode(parseInt(c)), ''))
        /*      debug('info: %y',info)*/

        const data = []
        const keys = Object.keys(data)

        for (const key in info) {
          data.push([labelColor(key), labelColor(info[key])])
        }

        const output = table(data, {})
        console.log(output)

      //      close()
      }
    } )
  }

  let bytes = [
    0xF0,   /* sysex start - 0xf0 */
    0x00,   /* manufacturer ID 1 - 0x00 */
    0x21,   /* manufacturer ID 2 - 0x21 */
    0x45,   /* manufacturer ID 3 - 0x45 */
    0x02,   /* Query data */
    0x7F,   /* Electra information */
    0xF7    /* sysex end - 0xf7 */
  ]


  Midi.send(options.electraOneCtrl, 'sysex', bytes)

  let bytes2 = [
    0xF0,   /* sysex start - 0xf0 */
    0x00,   /* manufacturer ID 1 - 0x00 */
    0x21,   /* manufacturer ID 2 - 0x21 */
    0x45,   /* manufacturer ID 3 - 0x45 */
    0x02,   /* Query data */
    0x7E,   /* Run-time information */
    0xF7    /* sysex end - 0xf7 */
  ]

  Midi.send(options.electraOneCtrl, 'sysex', bytes2)

  let bytes3 = [
    0xF0,   /* sysex start - 0xf0 */
    0x00,   /* manufacturer ID 1 - 0x00 */
    0x21,   /* manufacturer ID 2 - 0x21 */
    0x45,   /* manufacturer ID 3 - 0x45 */
    0x02,   /* Query data */
    0x7C,   /* Preset Name Request */
    0xF7    /* sysex end - 0xf7 */
  ]

  Midi.send(options.electraOneCtrl, 'sysex', bytes3)

  setTimeout( close, 2500)

}

module.exports = {
  name: 'info',
  description: 'Query Console Info',
  handler: queryInfo,
  aliases:[]
}