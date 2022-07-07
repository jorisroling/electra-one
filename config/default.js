const pkg = require('../package.json')
const debugPrefix = pkg.name
const path = require('path')

const bacaraVirtualName = 'Bacara'


const customWrapper = require('../lib/custom')

module.exports = customWrapper({
  local:false,
  custom: false,
  debugPrefix,
  debug: Object.prototype.hasOwnProperty.call(process.env, 'DEBUG') ? process.env.DEBUG : `${debugPrefix}*,-${debugPrefix}:*:part*,-${debugPrefix}:*:lfo*,-${debugPrefix}:lib:midi:interface,-${debugPrefix}:bacara:midi:note:on,-${debugPrefix}:bacara:midi:note:off,-${debugPrefix}:midi:send,-${debugPrefix}:router:midi:sysex,-${debugPrefix}:bacara:virus:preset,-${debugPrefix}:bacara:dispatch,-${debugPrefix}:bacara:state,-${debugPrefix}:bacara:osc,-${debugPrefix}:*:state,-${debugPrefix}:*:change`,
  options: {
    electra: 'electra-one-port-2',
    electraOneCtrl: 'electra-one-ctrl',
    scenario: 'default',
    clock: 'bacara',
    transpose: 'bacara',
    transposeChannel: 16,
    general: '',
    generalChannel: 1,
    remote: '',
    remoteChannel: 1,
    bank: 0,
    slot: 0,
    id: 0,
    name: '',
    focus: 'bacara',
    template: {
      bacara: path.resolve(__dirname + '/../presets/Bacara Template.eproj'),
      virus: path.resolve(__dirname + '/../presets/Virus TI Companion Template.eproj'),
    },
    presetName: {
      bacara: 'Bacara',
      virus: 'Virus TI Companion',
    },
    custom: [],
    variantDevice: '',
    variantChannel: 1,
    variantGeneralNote: 36,
  },
  electra: {
    checkPresetVia: 'patch',  // patch, preset or none
    presetName: {
      bacara: 'Bacara',
      virus: 'Virus TI Companion',
    },
  },
  midi: {
    ports: {
      'electra-one-port-1': {
        darwin: 'Electra Controller Electra Port 1',
        linux: 'iConnectMIDI4+:iConnectMIDI4+ MIDI 8 20:7',
        windows: 'Electra Controller',
      },
      'electra-one-port-2': {
        darwin: 'Electra Controller Electra Port 2',
        linux: 'iConnectMIDI4+:iConnectMIDI4+ MIDI 9 20:8',
        in: {
          windows: 'MIDIIN2 (Electra Controller)',
        },
        out: {
          windows: 'MIDIOUT2 (Electra Controller)',
        },
      },
      'electra-one-ctrl': {
        darwin: 'Electra Controller Electra CTRL',
        linux: 'iConnectMIDI4+:iConnectMIDI4+ MIDI 12 20:11',
        in: {
          windows: 'MIDIIN3 (Electra Controller)',
        },
        out: {
          windows: 'MIDIOUT3 (Electra Controller)',
        },
      },
      'bacara': {
        darwin: bacaraVirtualName,
        linux: bacaraVirtualName,
      },
    },
  },
  devices: {
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
  touchBlock: {
    button:[
      {
        cc: 80,
      },
      {
        cc: 81,
      },
      {
        cc: 82,
      },
      {
        cc: 83,
      },
      {
        cc: 84,
      },
      {
        cc: 85,
      },
      {
        cc: 86,
      },
      {
        cc: 87,
      },
      {
        cc: 88,
      },
      {
        cc: 89,
      },
    ],
  },
  router: {
    scenarios: {
      'default': {
        electra: 'electra-one-b-port-{port}',
        actors: {},
      },
    },
  },
  list: {
    virtual: bacaraVirtualName,
  },
  bacara: {
    virtual: bacaraVirtualName,
    channel: 1,
  },
})

