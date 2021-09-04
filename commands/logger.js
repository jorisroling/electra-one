const Midi = require('../lib/midi/midi')

function setLogger(name, sub, options) {

  let bytes = [
    0xF0,   /* sysex start - 0xf0 */
    0x00,   /* manufacturer ID 1 - 0x00 */
    0x21,   /* manufacturer ID 2 - 0x21 */
    0x45,   /* manufacturer ID 3 - 0x45 */
    0x7F,   /* System call */
    0x7D,   /* Logger status change */
    (sub == 'on' || sub == 'true' || sub == 'yes' || sub == '1') ? 0x01 : 0x00, /* state */
    0x00,   /* reserved */
    0xF7    /* sysex end - 0xf7 */
  ]

  //  debug('%y',options)
  Midi.send(options.electraOneCtrl, 'sysex', bytes)
}

module.exports = {
  name: 'logger',
  description: 'Set Electra One Logger state (on/off)',
  examples: [
    {usage:'electra-one logger on', description:'Sets Electra One Logger to ON'},
    {usage:'electra-one logger off', description:'Sets Electra One Logger to OFF'},
  ],
  handler: setLogger,
  aliases:[]
}