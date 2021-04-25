const pkg = require('../package.json')
const debugPrefix = pkg.name
const path = require('path')

/*
 iConnectMIDI4+:iConnectMIDI4+ MIDI 3 20:2   ║ Virus TI
*/
module.exports = {
  debugPrefix,
  debug: Object.prototype.hasOwnProperty.call(process.env,'DEBUG') ? process.env.DEBUG : `${debugPrefix}*,-${debugPrefix}*:midi:*`,
  midi: {
    ports: {
      'electra-one-1': {
        darwin: "Electra Controller Electra Port 1",
        linux: "iConnectMIDI4+:iConnectMIDI4+ MIDI 8 20:7",
      },
      'electra-one-2': {
        darwin: "Electra Controller Electra Port 2",
        linux: "iConnectMIDI4+:iConnectMIDI4+ MIDI 9 20:8",
      },
      'electra-one-ctrl': {
        darwin: "Electra Controller Electra CTRL",
        linux: "iConnectMIDI4+:iConnectMIDI4+ MIDI 11 20:10",
      },
      'virus-ti': {
        darwin: "iConnectMIDI4+ Virus TI",
        linux: "iConnectMIDI4+:iConnectMIDI4+ MIDI 3 20:2",
      },
    },
  },
}
