module.exports = {
  matrix: {
    slot: [
      {
        name: 'Mod Slot #1',
        source: {
          page:1,
          offset: 64,
        },
        destinations: [
          {
            target:{
              page:1,
              offset: 65,
            },
            amount:{
              page:1,
              offset: 66,
            },
          },
          {
            target:{
              page:2,
              offset: 89,
            },
            amount:{
              page:2,
              offset: 90,
            },
          },
          {
            target:{
              page:2,
              offset: 91,
            },
            amount:{
              page:2,
              offset: 92,
            },
          },
        ],
      },
      {
        name: 'Mod Slot #2',
        source: {
          page:1,
          offset: 67,
        },
        destinations: [
          {
            target:{
              page:1,
              offset: 68,
            },
            amount:{
              page:1,
              offset: 69,
            },
          },
          {
            target:{
              page:1,
              offset: 70,
            },
            amount:{
              page:1,
              offset: 71,
            },
          },
          {
            target:{
              page:2,
              offset: 93,
            },
            amount:{
              page:2,
              offset: 94,
            },
          },
        ],
      },
      {
        name: 'Mod Slot #3',
        source: {
          page:1,
          offset: 72,
        },
        destinations: [
          {
            target:{
              page:1,
              offset: 73,
            },
            amount:{
              page:1,
              offset: 74,
            },
          },
          {
            target:{
              page:1,
              offset: 75,
            },
            amount:{
              page:1,
              offset: 76,
            },
          },
          {
            target:{
              page:1,
              offset: 77,
            },
            amount:{
              page:1,
              offset: 78,
            },
          },
        ],
      },
      {
        name: 'Mod Slot #4',
        source: {
          page:1,
          offset: 103,
        },
        destinations: [
          {
            target:{
              page:1,
              offset: 104,
            },
            amount:{
              page:1,
              offset: 105,
            },
          },
          {
            target:{
              page:2,
              offset: 95,
            },
            amount:{
              page:2,
              offset: 96,
            },
          },
          {
            target:{
              page:2,
              offset: 97,
            },
            amount:{
              page:2,
              offset: 98,
            },
          },
        ],
      },
      {
        name: 'Mod Slot #5',
        source: {
          page:1,
          offset: 106,
        },
        destinations: [
          {
            target:{
              page:1,
              offset: 107,
            },
            amount:{
              page:1,
              offset: 108,
            },
          },
          {
            target:{
              page:2,
              offset: 99,
            },
            amount:{
              page:2,
              offset: 100,
            },
          },
          {
            target:{
              page:2,
              offset: 101,
            },
            amount:{
              page:2,
              offset: 102,
            },
          },
        ],
      },
      {
        name: 'Mod Slot #6',
        source: {
          page:1,
          offset: 109,
        },
        destinations: [
          {
            target:{
              page:1,
              offset: 110,
            },
            amount:{
              page:1,
              offset: 111,
            },
          },
          {
            target:{
              page:2,
              offset: 103,
            },
            amount:{
              page:2,
              offset: 104,
            },
          },
          {
            target:{
              page:2,
              offset: 105,
            },
            amount:{
              page:2,
              offset: 106,
            },
          },
        ],
      },
    ],
    source: {
      type: [
        {
          name: 'Off',
          type: 'off',
          softknob: 0,
        },
        {
          name: 'Pitch Bend',
          type: 'pitch',
        },
        {
          name: 'Channel Pressure',
          type: 'pressure',
          softknob: 64,
        },
        {
          name: 'Mod Wheel',
          type: 'cc',
          cc: 1,
          softknob: 1,
        },
        {
          name: 'Breath',
          type: 'cc',
          cc: 2,
          softknob: 2,
        },
        {
          name: 'Control 3',
          type: 'cc',
          cc: 3,
          softknob: 3,
        },
        {
          name: 'Foot Pedal',
          type: 'cc',
          cc: 4,
          softknob: 4,
        },
        {
          name: 'Data Entry',
          type: 'cc',
          cc: 6,
          softknob: 5,
        },
        {
          name: 'Balance',
          type: 'cc',
          cc: 8,
          softknob: 6,
        },
        {
          name: 'Control 9',
          type: 'cc',
          cc: 9,
          softknob: 7,
        },
        {
          name: 'Expression',
          type: 'cc',
          cc: 11,
          softknob: 8,
        },
        {
          name: 'Control 12',
          type: 'cc',
          cc: 12,
          softknob: 9,
        },
        {
          name: 'Control 13',
          type: 'cc',
          cc: 13,
          softknob: 10,
        },
        {
          name: 'Control 14',
          type: 'cc',
          cc: 14,
          softknob: 11,
        },
        {
          name: 'Control 15',
          type: 'cc',
          cc: 15,
          softknob: 12,
        },
        {
          name: 'Control 16',
          type: 'cc',
          cc: 16,
          softknob: 13,
        },
        {
          name: 'Hold Pedal',
          type: 'cc',
          cc: 64,
        },
        {
          name: 'Portamento Switch',
          type: 'cc',
          cc: 65,
        },
        {
          name: 'Sustain Pedal',
          type: 'cc',
          cc: 66,
        },
      ],
    },
  },
  soft: {
    names: {
      0: '>Para',
      1: '*3rds',
      2: '*4ths',
      3: '*5ths',
      4: '*7ths',
      5: '+octave',
      6: 'Access',
      7: 'ArpMode',
      8: 'ArpOct',
      9: 'Attack',
      10: 'Balance',
      11: 'Chorus',
      12: 'Cutoff',
      13: 'Decay',
      14: 'Delay',
      15: 'Depth',
      16: 'Destroy',
      17: 'Detune',
      18: 'Disolve',
      19: 'Distort',
      20: 'Dive',
      21: 'Effects',
      22: 'Elevate',
      23: 'Energy',
      24: 'EqHigh',
      25: 'EqLow',
      26: 'EqMid',
      27: 'Fast',
      28: 'Fear',
      29: 'Filter',
      30: 'FM',
      31: 'Glide',
      32: 'Hold',
      33: 'Hype',
      34: 'Infect',
      35: 'Length',
      36: 'Mix',
      37: 'Morph',
      38: 'Mutate',
      39: 'Noise',
      40: 'Open',
      41: 'Orbit',
      42: 'Pan',
      43: 'Phaser',
      44: 'Phatter',
      45: 'Pitch',
      46: 'Pulsate',
      47: 'Push',
      48: 'PWM',
      49: 'Rate',
      50: 'Release',
      51: 'Reso',
      52: 'Reverb',
      53: 'Scream',
      54: 'Shape',
      55: 'Sharpen',
      56: 'Slow',
      57: 'Soften',
      58: 'Speed',
      59: 'SubOsc',
      60: 'Sustain',
      61: 'Sweep',
      62: 'Swing',
      63: 'Tempo',
      64: 'Thinner',
      65: 'Tone',
      66: 'Tremolo',
      67: 'Vibrato',
      68: 'WahWah',
      69: 'Warmth',
      70: 'Warp',
      71: 'Width',
      72: 'Bite',
      73: 'Flanger',
      74: 'RingMod',
      75: 'Punch',
      76: 'Fuzz',
      77: 'Modulate',
      78: 'Party!',
      79: 'Interpolation',
      80: 'F-Shift',
      81: 'F-Spread',
      82: 'Bush',
      83: 'Muscle',
      84: 'Sack',
      85: 'Vowel',
      86: 'Comb',
      87: 'Speaker',
    },
    knob: [
      {
        name: {
          page: 1,
          offset: 51,
        },
        destination: {
          page: 1,
          offset: 62,
        },
      },
      {
        name: {
          page: 1,
          offset: 52,
        },
        destination: {
          page: 1,
          offset: 63,
        },
      },
      {
        name: {
          page: 1,
          offset: 53,
        },
        destination: {
          page: 2,
          offset: 27,
        },
      },
    ]
  }
}
