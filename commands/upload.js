const ElectraOne = require('../lib/electraOne')
const fs = require('fs')

function uploadPresetFile(name, sub, options) {
  const midiOutputCtrlPort = ElectraOne.output(options.electraOneCtrl)

  let bytes = [
    0xF0,   /* sysex start - 0xf0 */
    0x00,   /* manufacturer ID 1 - 0x00 */
    0x21,   /* manufacturer ID 2 - 0x21 */
    0x45,   /* manufacturer ID 3 - 0x45 */
    0x01,   /* Upload data */
    0x00,   /* Preset File */
    /* data */
  ]

  const fileContent = fs.readFileSync(options.filename,'ascii')
  const json = JSON.parse(fileContent)
  const data = JSON.stringify(json)

  bytes = bytes.concat(/*data.split('')*/[...data].map( char => char.charCodeAt(0) ))

  bytes.push(0xF7   /* sysex end - 0xf7 */)

  debug('sysex size = %y bytes',bytes.length)

  midiOutputCtrlPort.send('sysex',bytes)
  setTimeout(() => {
    midiOutputCtrlPort.close()
  }, 4 * 1000)

}

module.exports = {
  name: 'upload',
  description: 'Upload Preset File',
  handler: uploadPresetFile,
  aliases:[]
}