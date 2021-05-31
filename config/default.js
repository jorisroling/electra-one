const pkg = require('../package.json')
const debugPrefix = pkg.name
const path = require('path')

const bacaraAcidVirtualName = 'Bacara Acid'
/*
 iConnectMIDI4+:iConnectMIDI4+ MIDI 3 20:2   ║ Virus TI
*/
module.exports = {
  debugPrefix,
  debug: Object.prototype.hasOwnProperty.call(process.env, 'DEBUG') ? process.env.DEBUG : `${debugPrefix}*,-${debugPrefix}:midi:*`,
  midi: {
    ports: {
      'electra-one-1': {
        darwin: 'Electra Controller Electra Port 1',
        linux: 'iConnectMIDI4+:iConnectMIDI4+ MIDI 8 20:7',
      },
      'electra-one-2': {
        darwin: 'Electra Controller Electra Port 2',
        linux: 'iConnectMIDI4+:iConnectMIDI4+ MIDI 9 20:8',
      },
      'electra-one-ctrl': {
        darwin: 'Electra Controller Electra CTRL',
        linux: 'iConnectMIDI4+:iConnectMIDI4+ MIDI 12 20:11',
      },
      'typhon': {
        darwin: 'iConnectMIDI4+ Typhon',
        linux: 'iConnectMIDI4+:iConnectMIDI4+ MIDI 1 20:0',
      },
      'tr-6s': {
        darwin: 'iConnectMIDI4+ TR-6S',
        linux: 'iConnectMIDI4+:iConnectMIDI4+ MIDI 2 20:1',
      },
      'virus-ti': {
        darwin: 'iConnectMIDI4+ Virus TI',
        linux: 'iConnectMIDI4+:iConnectMIDI4+ MIDI 3 20:2',
      },
      'midihub': {
        darwin: 'iConnectMIDI4+ Midihub',
        linux: 'iConnectMIDI4+:iConnectMIDI4+ MIDI 4 20:3',
      },
      'deluge': {
        darwin: 'iConnectMIDI4+ Deluge',
        linux: 'iConnectMIDI4+:iConnectMIDI4+ MIDI 7 20:6',
      },
      'acdgen': {
        darwin: 'iConnectMIDI4+ ACDGEN',
        linux: 'iConnectMIDI4+:iConnectMIDI4+ MIDI 11 20:10',
      },
      'bacara': {
        darwin: bacaraAcidVirtualName,
        linux: bacaraAcidVirtualName,
      },
    },
  },
  devices: {
    'virus-ti': {
      model: 'Virus TI',
      manufacturer: 'Access',
      instance: 'pt.#',
      channels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
      port: 'virus-ti',
      electraOne: {
        port: 1,
        portMap: 'virus-ti',
        initialize: {
          'electra-one-1': [0xF0, 0x7D, 0x20, 'part', 0xF7],
          'virus-ti': [0xF0, 0x00, 0x20, 0x33, 0x01, 0x00, 0x30, 0x00, 'part:-1', 0xF7],
        },
      },
    },
    'deluge': {
      model: 'Deluge',
      manufacturer: 'Synthstrom',
      channels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
      port: 'deluge',
      electraOne: {
        port: 1,
      },
    },
    'typhon': {
      model: 'Typhon',
      manufacturer: 'Dreadbox',
      channels: [15],
      port: 'typhon',
      electraOne: {
        port: 2,
      },
    },
    'mb33': {
      model: 'MB33',
      manufacturer: 'MAM',
      channels: [16],
      port: 'midihub',
      electraOne: {
        port: 2,
      },
    },
    'tr-6s': {
      model: 'TR-6S',
      manufacturer: 'Roland',
      channels: [10, 11],
      instances: ['Patterns','Kits'],
      port: 'tr-6s',
      electraOne: {
        port: 2,
      },
    },
    'mc-101': {
      model: 'MC-101',
      manufacturer: 'Roland',
      instance: 'tk.#',
      channels: [6, 7, 8, 9],
      port: 'midihub',
      electraOne: {
        port: 2,
      },
    },
    'vp-03': {
      model: 'VP-03',
      manufacturer: 'Roland',
      channels: [14],
      port: 'midihub',
      electraOne: {
        port: 2,
      },
    },
    'nts-1': {
      model: 'NTS-1',
      manufacturer: 'Korg',
      channels: [12],
      port: 'midihub',
      electraOne: {
        port: 2,
      },
    },
    'bacara': {
      model: 'Bacara',
      manufacturer: 'Me',
      channels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
      port: 'bacara',
      electraOne: {
        port: 2,
      },
    },
    'acdgen': {
      model: 'ACDGEN',
      manufacturer: 'Spektro Audio',
      channels: [13],
      port: 'acdgen',
      electraOne: {
        port: 2,
      },
    },
  },
  router: {
    scenarios: {
      'default': {
        actors: {
          'virus-ti': {
            enabled: true,
            port: 1,
            channels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
            portMap: 'virus-ti',
            initialize: {
              'electra-one-1': [0xF0, 0x7D, 0x20, 'part', 0xF7],
              'virus-ti': [0xF0, 0x00, 0x20, 0x33, 0x01, 0x00, 0x30, 0x00, 'part:-1', 0xF7],
            },
          },
          'tr-6s': {
            enabled: true,
            port: 2,
            channels: [10, 11],
          },
          'mc-101': {
            enabled: true,
            port: 2,
            channels: [6, 7, 8, 9],
            oneway: true,
          },
          'acdgen': {
            enabled: true,
            port: 2,
            channels: [13, 16],
            oneway: true,
          },
          'typhon': {
            enabled: true,
            port: 2,
            channels: [15],
            oneway: true,
          },
        },
      },
    },
  },
  list: {
    virtual: bacaraAcidVirtualName,
  },
  acid: {
    virtual: bacaraAcidVirtualName,
    channel: 1,
    interface: require('../interfaces/acid.v1').parameters
  }
}
