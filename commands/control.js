const Midi = require('../lib/midi/midi')
const fs = require('fs')

let args


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
      return 'FFFFFF'
    }
    if (color == 'red') {
      return 'F45C51'
    }
    if (color == 'orange') {
      return 'F49500'
    }
    if (color == 'blue') {
      return '529DEC'
    }
    if (color == 'green') {
      return '03A598'
    }
    if (color == 'magenta') {
      return 'C44795'
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