const pkg = require('../package.json')
const debugPrefix = pkg.name
const path = require('path')

const bacaraAcidVirtualName = 'Bacara'
/*
 iConnectMIDI4+:iConnectMIDI4+ MIDI 3 20:2   ║ Virus TI
*/
module.exports = {
  debugPrefix,
  debug: Object.prototype.hasOwnProperty.call(process.env, 'DEBUG') ? process.env.DEBUG : `${debugPrefix}*,-${debugPrefix}:midi:*,-${debugPrefix}:part*`,
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
      'virus-ti': {
        darwin: 'MRCC Port 1', // 'iConnectMIDI4+ Virus TI',
        //        linux: 'iConnectMIDI4+:iConnectMIDI4+ MIDI 3 20:2',
      },
      'deluge': {
        darwin: 'MRCC Port 2', // 'iConnectMIDI4+ Deluge',
        //        linux: 'iConnectMIDI4+:iConnectMIDI4+ MIDI 7 20:6',
      },
      'typhon': {
        darwin: 'MRCC Port 3', // 'iConnectMIDI4+ Typhon',
        //        linux: 'iConnectMIDI4+:iConnectMIDI4+ MIDI 1 20:0',
      },
      'tr-6s': {
        darwin: 'MRCC Port 4', // 'iConnectMIDI4+ TR-6S',
        //        linux: 'iConnectMIDI4+:iConnectMIDI4+ MIDI 2 20:1',
      },
      'mb33': {
        darwin: 'MRCC Port 7', // 'iConnectMIDI4+ TR-6S',
        //        linux: 'iConnectMIDI4+:iConnectMIDI4+ MIDI 2 20:1',
      },
      'vp-03': {
        darwin: 'MRCC Port 8', // 'iConnectMIDI4+ TR-6S',
        //        linux: 'iConnectMIDI4+:iConnectMIDI4+ MIDI 2 20:1',
      },
      'nts-1': {
        darwin: 'MRCC Port 9', // 'iConnectMIDI4+ TR-6S',
        //        linux: 'iConnectMIDI4+:iConnectMIDI4+ MIDI 2 20:1',
      },
      'acdgen': {
        darwin: 'MRCC Port 10',
        //        linux: 'iConnectMIDI4+:iConnectMIDI4+ MIDI 11 20:10',
      },
      'midihub': {
        darwin: 'MRCC Port 11',
        //        linux: 'iConnectMIDI4+:iConnectMIDI4+ MIDI 4 20:3',
      },
      'keystep-pro': {
        darwin: 'MRCC Port 12', // darwin: 'iConnectMIDI4+ Keystep Pro',
        //        linux: 'iConnectMIDI4+:iConnectMIDI4+ MIDI 6 20:5',
      },
      'bacara': {
        darwin: bacaraAcidVirtualName,
        linux: bacaraAcidVirtualName,
      },
      'komplete-kontrol': {
        //        darwin: 'KOMPLETE KONTROL M32',
        darwin: 'MRCC Port 12',
      },
      'lightpad-block': {
        darwin: 'Lightpad BLOCK ', // Pfff, a trailing space, really?
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
        port: 2,
        initialize: {
          'electra-one-2': [0xF0, 0x7D, 0x20, 'part', 0xF7],
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
        port: 1,
      },
    },
    'mb33': {
      model: 'MB33',
      manufacturer: 'MAM',
      channels: [16],
      port: 'mb33',
      electraOne: {
        port: 1,
      },
    },
    'tr-6s': {
      model: 'TR-6S',
      manufacturer: 'Roland',
      channels: [10, 11],
      instances: ['Patterns', 'Kits'],
      port: 'tr-6s',
      electraOne: {
        port: 1,
      },
    },
    'vp-03': {
      model: 'VP-03',
      manufacturer: 'Roland',
      channels: [14],
      port: 'vp-03',
      electraOne: {
        port: 1,
      },
    },
    'nts-1': {
      model: 'NTS-1',
      manufacturer: 'Korg',
      channels: [12],
      port: 'nts-1',
      electraOne: {
        port: 1,
      },
    },
    'acdgen': {
      model: 'ACDGEN',
      manufacturer: 'Spektro Audio',
      channels: [13],
      port: 'acdgen',
      electraOne: {
        port: 1,
      },
    },
    'keystep-pro': {
      model: 'KeyStep Pro',
      manufacturer: 'Arturia',
      instance: 't.#',
      channels: [1, 2, 3, 4],
      port: 'keystep-pro',
      electraOne: {
        port: 1,
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
  },
  router: {
    scenarios: {
      'default': {
        actors: {
          'virus-ti': {
            enabled: true,
            port: 2,
            channels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
            flags: ['virus-ti-portmap'],
            initialize: {
              'electra-one-2': [0xF0, 0x7D, 0x20, 'part', 0xF7],
              'virus-ti': [0xF0, 0x00, 0x20, 0x33, 0x01, 0x00, 0x30, 0x00, 'part:-1', 0xF7],
            },
          },
          'tr-6s': {
            enabled: true,
            port: 1,
            channels: [10, 11],
            ignore: [2],
          },
          'acdgen': {
            enabled: true,
            port: 1,
            channels: [13, 16],
            oneway: true,
          },
          'typhon': {
            enabled: true,
            port: 1,
            channels: [15],
            oneway: true,
          },
          'nts-1': {
            enabled: true,
            port: 1,
            channels: [12],
            oneway: true,
          },
          'vp-03': {
            enabled: true,
            port: 1,
            channels: [14],
            oneway: true,
          },
          'keystep-pro': {
            enabled: true,
            port: 2,
            channels: [1,2,3,4,10],
            flags:['keystep-pro-tracker'],
            oneway: false,
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
    //    interface: require('../interfaces/acid.v1').parameters,
    scenarios: {
      'default': {
        actors: {
          'keystep-pro': {
            enabled: true,
            port: 2,
            channels: [1, 2, 3, 4, 10],
            flags:['tracker'],
            oneway: false,
          },
        },
      },
    },
  },
}
