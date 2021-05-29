const Midi = require('../lib/midi/midi')
const fs = require('fs')

function downloadFile(name, sub, options) {
  const midiInputCtrlPort = Midi.input(options.electraOneCtrl)

  function closeAndExit() {
    midiInputCtrlPort.close()
    process.exit()
  }

  midiInputCtrlPort.on('message', (msg) => {
    if (msg._type == 'sysex' && msg.bytes && msg.bytes.length >= 7 && msg.bytes[0] == 0xF0 && msg.bytes[1] == 0x00 && msg.bytes[2] == 0x21 && msg.bytes[3] == 0x45 && msg.bytes[4] == 0x01 && (msg.bytes[5] == 0x01 || msg.bytes[5] == 0x02 || msg.bytes[5] == 0x0C)/*&& msg.bytes[msg.bytes.length-1]==0xF7*/) {

      let data
      try {
        const json = JSON.parse(msg.bytes.slice(6, msg.bytes.length - 1).reduce((a, c) => a + String.fromCharCode(parseInt(c)), ''))
        data = JSON.stringify(json, null, 2)
      } catch (e) {
        data = msg.bytes.slice(6, msg.bytes.length - 1).reduce((a, c) => a + String.fromCharCode(parseInt(c)), '')
      }
      if (options.filename) {
        fs.writeFileSync(options.filename, data)
      } else {
        process.stdout.write(data)
      }
      setTimeout( closeAndExit, 0)
    }
  } )

  let bytes = [
    0xF0,   /* sysex start - 0xf0 */
    0x00,   /* manufacturer ID 1 - 0x00 */
    0x21,   /* manufacturer ID 2 - 0x21 */
    0x45,   /* manufacturer ID 3 - 0x45 */
    0x02,   /* Query data */
    sub[0] == 'preset' ? 0x01 : (sub[0] == 'config' ? 0x02 : (sub[0] == 'script' ? 0x0C : 0xFF)),   /* Config File */
    0xF7    /* sysex end - 0xf7 */
  ]

  Midi.send(options.electraOneCtrl, 'sysex', bytes)

  setTimeout( closeAndExit, 2500)

}

module.exports = {
  name: 'download',
  description: 'Get Console File',
  handler: downloadFile,
  examples: [
    {usage:'electra-one download <preset:config|script> --filename <filepath>', description:'Download a File from the currently active bank/slot'},
  ],
  aliases:[]
}