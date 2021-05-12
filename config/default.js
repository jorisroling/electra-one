const pkg = require('../package.json')
const debugPrefix = pkg.name
const path = require('path')

const bacaraAcidVirtualName = 'Bacara Acid'
/*
 iConnectMIDI4+:iConnectMIDI4+ MIDI 3 20:2   ║ Virus TI
*/
module.exports = {
  debugPrefix,
  debug: Object.prototype.hasOwnProperty.call(process.env,'DEBUG') ? process.env.DEBUG : `${debugPrefix}*,-${debugPrefix}*:midi:*`,
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
      port: 'tr-6s',
      electraOne: {
        port: 2,
      },
    },
    'mc-101': {
      model: 'MC-101',
      manufacturer: 'Roland',
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
            channels: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16],
            portMap: 'virus-ti',
            initialize: {
              'electra-one-1': [0xF0, 0x7D, 0x20, 'part', 0xF7],
              'virus-ti': [0xF0,0x00,0x20,0x33,0x01,0x00,0x30,0x00,'part:-1',0xF7],
            },
          },
          'tr-6s': {
            enabled: false,
            port: 2,
            channels: [10,11],
          },
          'mc-101': {
            enabled: false,
            port: 2,
            channels: [6,7,8,9],
          },
          'acdgen': {
            enabled: true,
            port: 2,
            channels: [13,16],
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
    last_used: {
      nrpn: 71,
    },
    generate: {
      nrpn: 10,
    },
    temperature: {
      nrpn: 9,
      min: 100,
      max: 500,
      resolution: 256,
      default: 100,
    },
    previous_pattern: {
      nrpn: 11,
    },
    next_pattern: {
      nrpn: 12,
    },
    transpose: {
      nrpn: 13,
      min: 0,
      max: 24,
      resolution: 25,
      default: 12,
    },
    gate: {
      nrpn: 14,
      min: 0,
      max: 127,
      resolution: 128,
      default: 64,
    },
    octave: {
      nrpn: 15,
      min: 0,
      max: 127,
      resolution: 128,
      default: 64,
    },
    density: {
      nrpn: 16,
      min: 0,
      max: 100,
      resolution: 101,
      default: 100,
    },
    probability: {
      nrpn: 68,
      min: 0,
      max: 100,
      resolution: 64,
      default: 100,
    },
    killSteps: {
      nrpn: 17,
      min: 0,
      max: 16,
      resolution: 17,
      default: 0,
    },
    killShift: {
      nrpn: 18,
      min: 0,
      max: 30,
      resolution: 16,
      default: 15,
    },
    scales: {
      nrpn: 19,
      min: 0,
      max: 36,
      resolution: 16,
      default: 0,
    },
    base: {
      nrpn: 20,
      min: 0,
      max: 11,
      resolution: 16,
      default: 0,
    },
    shift: {
      nrpn: 21,
      min: 0,
      max: 32,
      resolution: 16,
      default: 16,
    },
    split: {
      nrpn: 22,
      min: 0,
      max: 127,
      resolution: 128,
      default: 127,
    },
    deviate: {
      nrpn: 23,
      min: 0,
      max: 100,
      resolution: 100,
      default: 0,
    },
    reset_preset: {
      nrpn: 24,
    },
    previous_preset: {
      nrpn: 69,
    },
    next_preset: {
      nrpn: 70,
    },
    save_preset: {
      nrpn: 71,
    },
    lfo: {
      1: {
        device: {
          A: {
            nrpn: 41,
          },
          B: {
            nrpn: 42,
          },
        },
        control: {
          nrpn: 25,
          min: 0,
          max: 127,
          resolution: 128,
          default: 0,
        },
        shape: {
          nrpn: 58,
          min: 0,
          max: 5,
          resolution: 16,
          default: 0,
        },
        rate: {
          nrpn: 26,
          min: 0,
          max: 127,
          resolution: 128,
          default: 64,
        },
        phase: {
          nrpn: 27,
          min: 0,
          max: 100,
          resolution: 100,
          default: 100,
        },
        amount: {
          nrpn: 28,
          min: 0,
          max: 100,
          resolution: 100,
          default: 100,
        },
        offset: {
          nrpn: 29,
          min: 0,
          max: 100,
          resolution: 128,
          default: 50,
        },
        density: {
          nrpn: 61,
          min: 0,
          max: 127,
          resolution: 128,
          default: 0,
        },
        show: {
          nrpn: 55,
          min: 0,
          max: 127,
          resolution: 128,
          default: 0,
        },
      },
      2: {
        device: {
          A: {
            nrpn: 43,
          },
          B: {
            nrpn: 44,
          },
        },
        control: {
          nrpn: 30,
          min: 0,
          max: 127,
          resolution: 128,
          default: 0,
        },
        shape: {
          nrpn: 59,
          min: 0,
          max: 15,
          resolution: 16,
          default: 0,
        },
        rate: {
          nrpn: 31,
          min: 0,
          max: 127,
          resolution: 128,
          default: 64,
        },
        phase: {
          nrpn: 32,
          min: 0,
          max: 100,
          resolution: 100,
          default: 100,
        },
        amount: {
          nrpn: 33,
          min: 0,
          max: 100,
          resolution: 100,
          default: 100,
        },
        offset: {
          nrpn: 34,
          min: 0,
          max: 100,
          resolution: 128,
          default: 50,
        },
        density: {
          nrpn: 62,
          min: 0,
          max: 127,
          resolution: 128,
          default: 0,
        },
        show: {
          nrpn: 56,
          min: 0,
          max: 127,
          resolution: 128,
          default: 0,
        },
      },
      3: {
        device: {
          A: {
            nrpn: 45,
          },
          B: {
            nrpn: 46,
          },
        },
        control: {
          nrpn: 35,
          min: 0,
          max: 127,
          resolution: 128,
          default: 0,
        },
        shape: {
          nrpn: 60,
          min: 0,
          max: 15,
          resolution: 16,
          default: 0,
        },
        rate: {
          nrpn: 36,
          min: 0,
          max: 127,
          resolution: 128,
          default: 64,
        },
        phase: {
          nrpn: 37,
          min: 0,
          max: 100,
          resolution: 100,
          default: 100,
        },
        amount: {
          nrpn: 38,
          min: 0,
          max: 100,
          resolution: 100,
          default: 100,
        },
        offset: {
          nrpn: 39,
          min: 0,
          max: 100,
          resolution: 128,
          default: 50,
        },
        density: {
          nrpn: 63,
          min: 0,
          max: 127,
          resolution: 128,
          default: 0,
        },
        show: {
          nrpn: 57,
          min: 0,
          max: 127,
          resolution: 128,
          default: 0,
        },
      },
    },
    device: {
      A: {
        device: {
          nrpn: 64,
          min: 0,
          max: 63,
          resolution: 64,
          default: 0,
        },
        mute: {
          nrpn: 66,
          min: 0,
          max: 1,
          resolution: 64,
          default: 0,
        },
        port: {
          nrpn: 51,
          min: 0,
          max: 63,
          resolution: 64,
          default: 0,
        },
        channel: {
          nrpn: 52,
          min: 1,
          max: 16,
          resolution: 16,
          default: 1,
        },
        bank: {
          nrpn: 47,
          min: 0,
          max: 127,
          resolution: 128,
          default: 0,
        },
        program: {
          nrpn: 48,
          min: 0,
          max: 127,
          resolution: 128,
          default: 0,
        },
      },
      B: {
        device: {
          nrpn: 65,
          min: 0,
          max: 63,
          resolution: 64,
          default: 0,
        },
        mute: {
          nrpn: 67,
          min: 0,
          max: 1,
          resolution: 64,
          default: 0,
        },
        port: {
          nrpn: 53,
          min: 0,
          max: 63,
          resolution: 64,
          default: 0,
        },
        channel: {
          nrpn: 54,
          min: 1,
          max: 16,
          resolution: 16,
          default: 2,
        },
        bank: {
          nrpn: 49,
          min: 0,
          max: 127,
          resolution: 128,
          default: 0,
        },
        program: {
          nrpn: 50,
          min: 0,
          max: 127,
          resolution: 128,
          default: 0,
        },
      },
    },
    test: {
      nrpn: 40,
      min: 0,
      max: 127,
      resolution: 128,
      default: 0,
    },
    nrpns: {
      min: 9,
      max: 13,
    },
  },
}
