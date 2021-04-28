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
      'tr-6s': {
        darwin: "iConnectMIDI4+ TR-6S",
        linux: "iConnectMIDI4+:iConnectMIDI4+ MIDI 2 20:1",
      },
      'mc-101': {
        darwin: "iConnectMIDI4+ Midihub",
        linux: "iConnectMIDI4+:iConnectMIDI4+ MIDI 4 20:3",
      },
    },
  },
  router: {
    scenarios: {
      'default': {
        'virus-ti': {
          enabled: true,
          port: 1,
          channels: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16],
          portMap: 'virus-ti',
        },
        'tr-6s': {
          enabled: false,
          port: 2,
          channels: [10,11],
        },
        'mc-101': {
          enabled: true,
          port: 2,
          channels: [6,7,8,9],
        },
      },
    },
  },
}
