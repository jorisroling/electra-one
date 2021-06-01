const Midi = require('../lib/midi/midi')
const fs = require('fs')

let args

function uploadPresetFile(name, sub, options) {
  if (Number.isInteger(options.bank) && Number.isInteger(options.slot)) {
    let fileContent
    if (options.filename) {
      if (fs.existsSync(options.filename)) {
        fileContent = fs.readFileSync(options.filename, 'ascii')
      } else {
        console.error(`File "${options.filename}" does not exist`)
      }
    } else {
      const stdinBuffer = fs.readFileSync(0) // STDIN_FILENO = 0
      fileContent = stdinBuffer.toString()
    }
    if (!fileContent) {
      console.error('No File content')
    }

    if (Array.isArray(sub) && (sub[0] == 'preset' || sub[0] == 'config') && options.bank == 0 && options.slot == 0) {
      /*      const midiInputCtrlPort = Midi.input(options.electraOneCtrl)
      midiInputCtrlPort.on('message', (msg) => {
        debug('msg %y', msg)
        if (msg._type == 'sysex') {
          debug('CTRL sysex = %y', msg.bytes)
        }
      })
*/
      const midiOutputCtrlPort = Midi.output(options.electraOneCtrl)

      let bytes = [
        0xF0,   /* sysex start - 0xf0 */
        0x00,   /* manufacturer ID 1 - 0x00 */
        0x21,   /* manufacturer ID 2 - 0x21 */
        0x45,   /* manufacturer ID 3 - 0x45 */
        0x01,   /* Upload data */
        (sub[0] == 'preset' ? 0x01 : (sub[0] == 'config' ? 0x02 : 0xFF)),   /* Preset or Config File */
        /* data */
      ]

      let json
      let data
      try {
        json = JSON.parse(fileContent)
        data = JSON.stringify(json)
      } catch (e) {
        console.error(e.message)
      }
      if (data && data.length) {
        bytes = bytes.concat([...data].map( char => char.charCodeAt(0) ))

        bytes.push(0xF7   /* sysex end - 0xf7 */)

        debug('sysex size = %y bytes', bytes.length)

        midiOutputCtrlPort.send('sysex', bytes)
        setTimeout(() => {
          midiOutputCtrlPort.close()
        }, 1 * 1000)
      }
    } else if (Array.isArray(sub) && sub[0] == 'script' && options.bank == 0 && options.slot == 0) {
      const midiOutputCtrlPort = Midi.output(options.electraOneCtrl)

      let bytes = [
        0xF0,   /* sysex start - 0xf0 */
        0x00,   /* manufacturer ID 1 - 0x00 */
        0x21,   /* manufacturer ID 2 - 0x21 */
        0x45,   /* manufacturer ID 3 - 0x45 */
        0x01,   /* Upload data */
        0x0C,   /* LUA Script */
        /* data */
      ]

      bytes = bytes.concat([...fileContent].map( char => char.charCodeAt(0) ))

      bytes.push(0xF7   /* sysex end - 0xf7 */)

      debug('sysex size = %y bytes', bytes.length)

      midiOutputCtrlPort.send('sysex', bytes)
      setTimeout(() => {
        midiOutputCtrlPort.close()
      }, 1 * 1000)
    }
  } else {
    args.showHelp()
  }
}

module.exports = {
  setup(a) {
    args = a
  },
  name: 'upload',
  description: 'Upload Preset Preset or Script to Console',
  handler: uploadPresetFile,
  examples: [
    {usage:'electra-one upload preset --filename <filepath>', description:'Upload a Preset File to the currently active bank/slot'},
    {usage:'electra-one upload script --filename <filepath>', description:'Upload a LUA Script to the currently active bank/slot'},
    {usage:'electra-one upload preset --filename <filepath> --bank <1-6> --slot <1-12>', description:'Upload a Preset File to the specified bank/slot'},
    {usage:'electra-one upload script --filename <filepath> --bank <1-6> --slot <1-12>', description:'Upload a LUA Script to the specified bank/slot'},
  ],
  aliases:[]
}