const Midi = require('../lib/midi/midi')
const fs = require('fs')

let args

function removePresetFile(name, sub, options) {
  if (Number.isInteger(options.bank) && Number.isInteger(options.slot)) {

    ['preset', 'config', 'script'].forEach( kind => {
      if (Array.isArray(sub) && sub.indexOf(kind) >= 0) {
        const midiOutputCtrlPort = Midi.output(options.electraOneCtrl)

        let bytes = [
          0xF0,   /* sysex start - 0xf0 */
          0x00,   /* manufacturer ID 1 - 0x00 */
          0x21,   /* manufacturer ID 2 - 0x21 */
          0x45,   /* manufacturer ID 3 - 0x45 */
          0x05,   /* remove command */
          kind == 'preset' ? 0x01 : (kind == 'script' ? 0xC : (kind == 'config' ? 0x02 : 0xFF)),   /* Kind */
          /* optional bank & slot */
        ]

        if (options.bank && options.slot) {
          bytes.push(options.bank)
          bytes.push(options.slot)
        }

        bytes.push(0xF7   /* sysex end - 0xf7 */)

        debug('sysex size = %y bytes %y', bytes.length)

        midiOutputCtrlPort.send('sysex', bytes)

        setTimeout(() => {
          midiOutputCtrlPort.close()
        }, 1 * 1000)
      }
    })
  } else {
    args.showHelp()
  }
}

module.exports = {
  setup(a) {
    args = a
  },
  name: 'remove',
  description: 'Remove Preset or Script from Console',
  handler: removePresetFile,
  examples: [
    {usage:'electra-one remove preset --filename <filepath>', description:'Remove a Preset File from the currently active bank/slot'},
    {usage:'electra-one remove config --filename <filepath>', description:'Remove a Config File from the currently active bank/slot'},
    {usage:'electra-one remove script --filename <filepath>', description:'Remove a LUA Script from the currently active bank/slot'},
    {usage:'electra-one remove preset --filename <filepath> --bank <1-6> --slot <1-12>', description:'Remove a Preset File from the specified bank/slot'},
    {usage:'electra-one remove config --filename <filepath> --bank <1-6> --slot <1-12>', description:'Remove a Config File from the specified bank/slot'},
    {usage:'electra-one remove script --filename <filepath> --bank <1-6> --slot <1-12>', description:'Remove a LUA Script from the specified bank/slot'},
  ],
  aliases:[]
}