const Midi = require('../lib/midi/midi')
const fs = require('fs')

let args


function executeLUA(name, sub, options) {

  let data
  if (typeof options.lua == 'string') {
    data = options.lua
  } else if (options.filename) {
    data = fs.readFileSync(options.filename, 'ascii')
  } else {
    const stdinBuffer = fs.readFileSync(0) // STDIN_FILENO = 0
    data = stdinBuffer.toString()
  }
  if (data) {
    if (data.length<=128) {
      let bytes = [
        0xF0,   /* sysex start - 0xf0 */
        0x00,   /* manufacturer ID 1 - 0x00 */
        0x21,   /* manufacturer ID 2 - 0x21 */
        0x45,   /* manufacturer ID 3 - 0x45 */
        0x08,   /* Execute command */
        0x0D,   /* Lua command */
      ]


      bytes = bytes.concat(data.split('').map( char => char.charCodeAt(0) ))

      bytes.push(0xF7   /* sysex end - 0xf7 */)

      Midi.send(options.electraOneCtrl, 'sysex', bytes)
    } else {
      console.error(`Too long command (${data.length} chars), max is 128 chars`)
    }
  } else {
    args.showHelp()

  }
}

module.exports = {
  setup(a) {
    args = a
  },
  name: 'execute',
  description: 'Execute LUA',
  handler: executeLUA,
  examples: [
    {usage:'electra-one execute --filename <filepath>', description:'Execute LUA command in file (max 128 chars)'},
    {usage:'electra-one execute --lua <LUA command>', description:'Execute LUA command direct (max 128 chars)'},
    {usage:'electra-one execute', description:'Execute LUA command from stdin (max 128 chars)'},
  ],
  aliases:['exec']
}