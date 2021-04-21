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
      easyOne1: {
        darwin: "Electra Controller Electra Port 1",
        linux: "",
      },
      easyOne2: {
        darwin: "Electra Controller Electra Port 2",
        linux: "",
      },
      virusTI: {
        darwin: "iConnectMIDI4+ Virus TI",
        linux: "iConnectMIDI4+:iConnectMIDI4+ MIDI 3 20:2",
      },
    },
  },
}
