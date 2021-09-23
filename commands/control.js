const Midi = require('../lib/midi/midi')
const fs = require('fs')

let args

const COLOR_WHITE = 'FFFFFF'
const COLOR_RED = 'F45C51'
const COLOR_YELLOW = 'F49500'
const COLOR_BLUE = '529DEC'
const COLOR_GREEN = '03A598'
const COLOR_MAGENTA = 'C44795'

function controlUpdate(name, sub, options) {

  let bytes = [
    0xF0,   /* sysex start - 0xf0 */
    0x00,   /* manufacturer ID 1 - 0x00 */
    0x21,   /* manufacturer ID 2 - 0x21 */
    0x45,   /* manufacturer ID 3 - 0x45 */
    0x14,   /* Update runtime command */
    0x07,   /* Control */
    (options.id >> 0) & 0x7F,
    (options.id >> 7) & 0x7F,
  ]

  const json = {}

  function colorTrans(color) {
    if (color == 'white') {
      return COLOR_WHITE
    }
    if (color == 'red') {
      return COLOR_RED
    }
    if (color == 'yellow') {
      return COLOR_YELLOW
    }
    if (color == 'blue') {
      return COLOR_BLUE
    }
    if (color == 'green') {
      return COLOR_GREEN
    }
    if (color == 'magenta') {
      return COLOR_MAGENTA
    }
    return color
  }
  if (options.name) {
    json.name = options.name
  }
  if (options.color) {
    json.color = colorTrans(options.color)
  }
  if (Object.prototype.hasOwnProperty.call(options, 'visible')) {
    json.visible = (options.visible == 'false' || options.visible == 'off' || options.visible == 0 ? false : true)
  }
  const data = JSON.stringify(json)
  debug('json %y', json)
  //  debug('options %y',options)

  bytes = bytes.concat(data.split('').map( char => char.charCodeAt(0) ))

  bytes.push(0xF7   /* sysex end - 0xf7 */)

  Midi.send(options.electraOneCtrl, 'sysex', bytes)
/*  } else {
    args.showHelp()

  }
*/}

module.exports = {
  setup(a) {
    args = a
  },
  name: 'control',
  description: 'Control Update',
  handler: controlUpdate,
  examples: [
    {usage:'electra-one control --id <controlID> --name <name> --color <color> --visible <true|false>', description:'Control update'},
  ],
  aliases:[]
}