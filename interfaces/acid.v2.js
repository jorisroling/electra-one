// LAST USED NRPN 101

module.exports = {

  elements: {
    test: {
      name: 'Test',
      type: 'parameter',
      surface: {
        type: 'cc',
        number: 2,
        hiRes: true,
        lsbFirst: true,
        min: 0,
        max: 512,
      },
      external: {
        type: 'cc',
        number: 20,
        hiRes: false,
        lsbFirst: false,
        min: 0,
        max: 127,
      },
      min: 1,
      max: 513,
      default: 1,
    },
    load: {
      name: 'Load',
      type: 'action',
      surface: {
        type: 'sysex',
        bytes: [0xF0, 0x7D, 0x00, 0x03, 0xF7],
        number: 0x03,
      },
    },
    generate: {
      name: 'Generate',
      type: 'action',
      surface: {
        type: 'nrpn',
        number: 1281,
        lsbFirst:true,
        min: 0,
        max: 1,
      },
      on: 1,
    },
    temperature: {
      name: 'Temperature',
      type: 'parameter',
      surface: {
        type: 'nrpn',
        number: 1153,
        lsbFirst:true,
        min: 100,
        max: 500,
      },
      min: 1.0,
      max: 5.0,
      default: 1.0,
      precision: 3,
      unit: '°',
    },
    previous_pattern: {
      name: 'Previous Pattern',
      type: 'action',
      surface: {
        type: 'nrpn',
        number: 1409,
        lsbFirst:true,
        min: 0,
        max: 1,
      },
      on: 1,
    },
    next_pattern: {
      name: 'Next Pattern',
      type: 'action',
      surface: {
        type: 'nrpn',
        number: 1537,
        lsbFirst:true,
        min: 0,
        max: 1,
      },
      on: 1,
    },
    transpose: {
      name: 'Transpose',
      type: 'parameter',
      surface: {
        type: 'nrpn',
        number: 1665,
        lsbFirst:true,
        min: 0,
        max: 127,
      },
      external: {
        type: 'cc',
        number: 3,
        min: 0,
        max: 127,
      },
      min: -64,
      max: 63,
      default: 0,
      unit: 'notes',
    },
    gate: {
      name: 'Gate',
      type: 'parameter',
      surface: {
        type: 'nrpn',
        number: 1793,
        lsbFirst:true,
        min: 0,
        max: 127,
      },
      external: {
        type: 'cc',
        number: 18,
        min: 0,
        max: 127,
      },
      min: 0.02,
      max: 1.92,
      default: 0.96,
      precision: 2,
      unit: 'steps',
    },
    octaveChance: {
      name: 'Octave Chance',
      type: 'parameter',
      surface: {
        type: 'nrpn',
        number: 1921,
        lsbFirst:true,
        min: 0,
        max: 127,
      },
      external: {
        type: 'cc',
        number: 9,
        min: 0,
        max: 127,
      },
      min: -100,
      max: 100,
      default: 0,
      precision: 0,
      unit: '%',
    },
    density: {
      name: 'Density',
      type: 'parameter',
      surface: {
        type: 'nrpn',
        number: 2049,
        lsbFirst:true,
        min: 0,
        max: 100,
      },
      external: {
        type: 'cc',
        number: 14,
        min: 0,
        max: 127,
      },
      min: 0,
      max: 100,
      default: 100,
      unit: '%',
    },
    probability: {
      name: 'Probability',
      type: 'parameter',
      surface: {
        type: 'nrpn',
        number: 8705,
        lsbFirst:true,
        min: 0,
        max: 100,
      },
      external: {
        type: 'cc',
        number: 15,
        min: 0,
        max: 100,
      },
      min: 0,
      max: 100,
      default: 100,
      unit: '%',
    },
    killSteps: {
      name: 'Kill Steps',
      type: 'parameter',
      surface: {
        type: 'nrpn',
        number: 2177,
        lsbFirst:true,
        min: 0,
        max: 16,
      },
      external: {
        type: 'cc',
        number: 16,
        min: 0,
        max: 16,
      },
      min: 0,
      max: 16,
      default: 0,
      unit: 'steps',
    },
    killShift: {
      name: 'Kill Shift',
      type: 'parameter',
      surface: {
        type: 'nrpn',
        number: 2305,
        lsbFirst:true,
        min: 0,
        max: 30,
      },
      external: {
        type: 'cc',
        number: 17,
        min: 0,
        max: 30,
      },
      min: -15,
      max: 15,
      default: 0,
      unit: 'steps',
    },
    scales: {
      name: 'Scales Mode',
      type: 'parameter',
      surface: {
        type: 'nrpn',
        number: 2433,
        lsbFirst:true,
        min: 0,
        max: 36,
      },
      external: {
        type: 'cc',
        number: 20,
        min: 0,
        max: 127,
      },
      min: 0,
      max: 36,
      default: 0,
      integer: true,
      list: [
        'Chromatic',
        '8-Tone Spanish',
        'Bhairav',
        'Dorian #4',
        'Dorian mode',
        'Half-Whole Dim',
        'Hirajoshi',
        'Insen',
        'Iwato',
        'Kumoi',
        'Locrian Mode',
        'Locrian Super',
        'Lydian Augment',
        'Lydian Dominan',
        'Lydian Mode',
        'Major Harmonic',
        'Major Pentatnc',
        'Major',
        'Messiaen 3',
        'Messiaen 4',
        'Messiaen 5',
        'Messiaen 6',
        'Messiaen 7',
        'Minor Blues',
        'Minor Harmonic',
        'Minor Hungrian',
        'Minor Mldc Dwn',
        'Minor Mldc Up',
        'Minor Pentatnc',
        'Minor',
        'Mixolydian Mde',
        'Pelog Selisir',
        'Pelog Tembung',
        'Phrygian Domnt',
        'Phrygian Mode',
        'Whole Tone',
        'Whole-Half Dim',
      ],
    },
    base: {
      name: 'Scales Base',
      type: 'parameter',
      surface: {
        type: 'nrpn',
        number: 2561,
        lsbFirst:true,
        min: 0,
        max: 11,
      },
      external: {
        type: 'cc',
        number: 21,
        min: 0,
        max: 11,
      },
      min: 0,
      max: 11,
      default: 0,
      list: ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'],
    },
    shift: {
      name: 'Shift',
      type: 'parameter',
      surface: {
        type: 'nrpn',
        number: 2689,
        lsbFirst:true,
        min: 0,
        max: 32,
      },
      external: {
        type: 'cc',
        number: 19,
        min: 0,
        max: 32,
      },
      min: -16,
      max: 16,
      default: 0,
      unit: 'steps',
    },
    split: {
      name: 'Split',
      type: 'parameter',
      surface: {
        type: 'nrpn',
        number: 2817,
        lsbFirst:true,
        min: 0,
        max: 127,
      },
      external: {
        type: 'cc',
        number: 22,
        min: 0,
        max: 127,
      },
      min: 0,
      max: 127,
      default: 127,
    },
    deviate: {
      name: 'Deviate',
      type: 'parameter',
      surface: {
        type: 'nrpn',
        number: 2945,
        lsbFirst:true,
        min: 0,
        max: 100,
      },
      external: {
        type: 'cc',
        number: 23,
        min: 0,
        max: 100,
      },
      min: 0,
      max: 100,
      default: 0,
      unit: '%',
    },
    reset_preset: {
      name: 'Reset Preset',
      type: 'action',
      surface: {
        type: 'nrpn',
        number: 3073,
        lsbFirst:true,
        min: 0,
        max: 1,
      },
      on: 1,
    },
    previous_preset: {
      name: 'Previous Preset',
      type: 'action',
      surface: {
        type: 'nrpn',
        number: 8833,
        lsbFirst:true,
        min: 0,
        max: 1,
      },
      on: 1,
    },
    next_preset: {
      name: 'Next Preset',
      type: 'action',
      surface: {
        type: 'nrpn',
        number: 8961,
        lsbFirst:true,
        min: 0,
        max: 1,
      },
      on: 1,
    },
    save_preset: {
      name: 'Save Preset',
      type: 'action',
      surface: {
        type: 'nrpn',
        number: 9089,
        lsbFirst:true,
        min: 0,
        max: 1,
      },
      on: 1,
    },
    bank: {
      name: 'Bank',
      type: 'parameter',
      surface: {
        type: 'nrpn',
        number: 9217,
        lsbFirst:true,
        min: 0,
        max: 127,
      },
      min: 0,
      max: 127,
      default: 0,
    },
    program: {
      name: 'Program',
      type: 'parameter',
      surface: {
        type: 'nrpn',
        number: 9345,
        lsbFirst:true,
        min: 0,
        max: 127,
      },
      min: 0,
      max: 127,
      default: 0,
    },
    mute: {
      name: 'Mute',
      type: 'parameter',
      surface: {
        type: 'nrpn',
        number: 12929,
        lsbFirst:true,
        min: 0,
        max: 1,
      },
      on: 1,
      default: 0,
    },
    lfo: [
      {
        device: {
          A: {
            name: 'LFO 1 Device A',
            type: 'parameter',
            surface: {
              type: 'nrpn',
              number: 5249,
              lsbFirst:true,
              min: 0,
              max: 1,
            },
            external: {
              type: 'cc',
              number: 31,
              min: 0,
              max: 1,
            },
            on: 1,
            default: 0,
          },
          B: {
            name: 'LFO 1 Device B',
            type: 'parameter',
            surface: {
              type: 'nrpn',
              number: 5377,
              lsbFirst:true,
              min: 0,
              max: 1,
            },
            external: {
              type: 'cc',
              number: 85,
              min: 0,
              max: 1,
            },
            on: 1,
            default: 0,
          },
        },
        control: {
          name: 'LFO 1 Control',
          type: 'parameter',
          surface: {
            type: 'nrpn',
            number: 3201,
            lsbFirst:true,
            min: 0,
            max: 255,
          },
          min: 0,
          max: 255,
          default: 0,
        },
        shape: {
          name: 'LFO 1 Shape',
          type: 'parameter',
          surface: {
            type: 'nrpn',
            number: 7425,
            lsbFirst:true,
            min: 0,
            max: 5,
          },
          external: {
            type: 'cc',
            number: 25,
            min: 0,
            max: 5,
          },
          min: 0,
          max: 5,
          default: 0,
        },
        rate: {
          name: 'LFO 1 Rate',
          type: 'parameter',
          surface: {
            type: 'nrpn',
            number: 3329,
            lsbFirst:true,
            min: 0,
            max: 127,
          },
          external: {
            type: 'cc',
            number: 27,
            min: 0,
            max: 127,
          },
          min: 0,
          max: 127,
          default: 64,
        },
        phase: {
          name: 'LFO 1 Phase',
          type: 'parameter',
          surface: {
            type: 'nrpn',
            number: 3457,
            lsbFirst:true,
            min: 0,
            max: 100,
          },
          external: {
            type: 'cc',
            number: 29,
            min: 0,
            max: 100,
          },
          min: 0,
          max: 100,
          default: 100,
          unit: '%',
        },
        amount: {
          name: 'LFO 1 Amount',
          type: 'parameter',
          surface: {
            type: 'nrpn',
            number: 3585,
            lsbFirst:true,
            min: 0,
            max: 100,
          },
          external: {
            type: 'cc',
            number: 26,
            min: 0,
            max: 127,
          },
          min: 0,
          max: 100,
          default: 100,
          unit: '%',
        },
        offset: {
          name: 'LFO 1 Offset',
          type: 'parameter',
          surface: {
            type: 'nrpn',
            number: 3713,
            lsbFirst:true,
            min: 0,
            max: 100,
          },
          external: {
            type: 'cc',
            number: 28,
            min: 0,
            max: 100,
          },
          min: 0,
          max: 100,
          default: 50,
          unit: '%',
        },
        density: {
          name: 'LFO 1 Density',
          type: 'parameter',
          surface: {
            type: 'nrpn',
            number: 7809,
            lsbFirst:true,
            min: 0,
            max: 127,
          },
          external: {
            type: 'cc',
            number: 30,
            min: 0,
            max: 127,
          },
          min: 0,
          max: 127,
          default: 127,
        },
        show: {
          name: 'LFO 1 Show',
          type: 'feedback',
          surface: {
            type: 'nrpn',
            number: 7041,
            lsbFirst:true,
            min: 0,
            max: 127,
          },
          min: 0,
          max: 127,
          default: 0,
        },
      },
      {
        device: {
          A: {
            name: 'LFO 2 Device A',
            type: 'parameter',
            surface: {
              type: 'nrpn',
              number: 5505,
              lsbFirst:true,
              min: 0,
              max: 1,
            },
            external: {
              type: 'cc',
              number: 104,
              min: 0,
              max: 1,
            },
            on: 1,
            default: 0,
          },
          B: {
            name: 'LFO 2 Device B',
            type: 'parameter',
            surface: {
              type: 'nrpn',
              number: 5633,
              lsbFirst:true,
              min: 0,
              max: 1,
            },
            external: {
              type: 'cc',
              number: 105,
              min: 0,
              max: 1,
            },
            on: 1,
            default: 0,
          },
        },
        control: {
          name: 'LFO 2 Control',
          type: 'parameter',
          surface: {
            type: 'nrpn',
            number: 3841,
            lsbFirst:true,
            min: 0,
            max: 127,
          },
          min: 0,
          max: 127,
          default: 0,
        },
        shape: {
          name: 'LFO 2 Shape',
          type: 'parameter',
          surface: {
            type: 'nrpn',
            number: 7553,
            lsbFirst:true,
            min: 0,
            max: 5,
          },
          external: {
            type: 'cc',
            number: 87,
            min: 0,
            max: 5,
          },
          min: 0,
          max: 5,
          default: 0,
        },
        rate: {
          name: 'LFO 2 Rate',
          type: 'parameter',
          surface: {
            type: 'nrpn',
            number: 3969,
            lsbFirst:true,
            min: 0,
            max: 127,
          },
          external: {
            type: 'cc',
            number: 89,
            min: 0,
            max: 127,
          },
          min: 0,
          max: 127,
          default: 64,
        },
        phase: {
          name: 'LFO 2 Phase',
          type: 'parameter',
          surface: {
            type: 'nrpn',
            number: 4097,
            lsbFirst:true,
            min: 0,
            max: 100,
          },
          external: {
            type: 'cc',
            number: 102,
            min: 0,
            max: 100,
          },
          min: 0,
          max: 100,
          default: 100,
          unit: '%',
        },
        amount: {
          name: 'LFO 2 Amount',
          type: 'parameter',
          surface: {
            type: 'nrpn',
            number: 4225,
            lsbFirst:true,
            min: 0,
            max: 100,
          },
          external: {
            type: 'cc',
            number: 88,
            min: 0,
            max: 100,
          },
          min: 0,
          max: 100,
          default: 100,
          unit: '%',
        },
        offset: {
          name: 'LFO 2 Offset',
          type: 'parameter',
          surface: {
            type: 'nrpn',
            number: 4353,
            lsbFirst:true,
            min: 0,
            max: 100,
          },
          external: {
            type: 'cc',
            number: 90,
            min: 0,
            max: 100,
          },
          min: 0,
          max: 100,
          default: 50,
          unit: '%',
        },
        density: {
          name: 'LFO 2 Density',
          type: 'parameter',
          surface: {
            type: 'nrpn',
            number: 7937,
            lsbFirst:true,
            min: 0,
            max: 127,
          },
          external: {
            type: 'cc',
            number: 103,
            min: 0,
            max: 127,
          },
          min: 0,
          max: 127,
          default: 127,
        },
        show: {
          name: 'LFO 2 Show',
          type: 'feedback',
          surface: {
            type: 'nrpn',
            number: 7169,
            lsbFirst:true,
            min: 0,
            max: 127,
          },
          min: 0,
          max: 127,
          default: 0,
        },
      },
      {
        device: {
          A: {
            name: 'LFO 3 Device A',
            type: 'parameter',
            surface: {
              type: 'nrpn',
              number: 5761,
              lsbFirst:true,
              min: 0,
              max: 1,
            },
            external: {
              type: 'cc',
              number: 113,
              min: 0,
              max: 1,
            },
            on: 1,
            default: 0,
          },
          B: {
            name: 'LFO 3 Device B',
            type: 'parameter',
            surface: {
              type: 'nrpn',
              number: 5889,
              lsbFirst:true,
              min: 0,
              max: 1,
            },
            external: {
              type: 'cc',
              number: 114,
              min: 0,
              max: 1,
            },
            on: 1,
            default: 0,
          },
        },
        control: {
          name: 'LFO 3 Control',
          type: 'parameter',
          surface: {
            type: 'nrpn',
            number: 4481,
            lsbFirst:true,
            min: 0,
            max: 127,
          },
          min: 0,
          max: 127,
          default: 0,
        },
        shape: {
          name: 'LFO 3 Shape',
          type: 'parameter',
          surface: {
            type: 'nrpn',
            number: 7681,
            lsbFirst:true,
            min: 0,
            max: 5,
          },
          external: {
            type: 'cc',
            number: 107,
            min: 0,
            max: 5,
          },
          min: 0,
          max: 5,
          default: 0,
        },
        rate: {
          name: 'LFO 3 Rate',
          type: 'parameter',
          surface: {
            type: 'nrpn',
            number: 4609,
            lsbFirst:true,
            min: 0,
            max: 127,
          },
          external: {
            type: 'cc',
            number: 109,
            min: 0,
            max: 127,
          },
          min: 0,
          max: 127,
          default: 64,
        },
        phase: {
          name: 'LFO 3 Phase',
          type: 'parameter',
          surface: {
            type: 'nrpn',
            number: 4737,
            lsbFirst:true,
            min: 0,
            max: 100,
          },
          external: {
            type: 'cc',
            number: 111,
            min: 0,
            max: 100,
          },
          min: 0,
          max: 100,
          default: 100,
          unit: '%',
        },
        amount: {
          name: 'LFO 3 Amount',
          type: 'parameter',
          surface: {
            type: 'nrpn',
            number: 4865,
            lsbFirst:true,
            min: 0,
            max: 100,
          },
          external: {
            type: 'cc',
            number: 108,
            min: 0,
            max: 100,
          },
          min: 0,
          max: 100,
          default: 100,
          unit: '%',
        },
        offset: {
          name: 'LFO 3 Offset',
          type: 'parameter',
          surface: {
            type: 'nrpn',
            number: 4993,
            lsbFirst:true,
            min: 0,
            max: 100,
          },
          external: {
            type: 'cc',
            number: 110,
            min: 0,
            max: 100,
          },
          min: 0,
          max: 100,
          default: 50,
          unit: '%',
        },
        density: {
          name: 'LFO 3 Density',
          type: 'parameter',
          surface: {
            type: 'nrpn',
            number: 8065,
            lsbFirst:true,
            min: 0,
            max: 127,
          },
          external: {
            type: 'cc',
            number: 112,
            min: 0,
            max: 127,
          },
          min: 0,
          max: 127,
          default: 127,
        },
        show: {
          name: 'LFO 3 Show',
          type: 'feedback',
          surface: {
            type: 'nrpn',
            number: 7297,
            lsbFirst:true,
            min: 0,
            max: 127,
          },
          min: 0,
          max: 127,
          default: 0,
        },
      },
    ],
    device: {
      A: {
        device: {
          name: 'Device A Device',
          type: 'parameter',
          surface: {
            type: 'nrpn',
            number: 8193,
            lsbFirst:true,
            min: 0,
            max: 127,
          },
          min: 0,
          max: 127,
          default: 0,
        },
        mute: {
          name: 'Device A Mute',
          type: 'parameter',
          surface: {
            type: 'nrpn',
            number: 8449,
            lsbFirst:true,
            min: 0,
            max: 1,
          },
          on: 1,
          default: 1,
        },
        port: {
          name: 'Device A Port',
          type: 'parameter',
          surface: {
            type: 'nrpn',
            number: 6529,
            lsbFirst:true,
            min: 0,
            max: 63,
          },
          min: 0,
          max: 63,
          default: 0,
        },
        channel: {
          name: 'Device A Channel',
          type: 'parameter',
          surface: {
            type: 'nrpn',
            number: 6657,
            lsbFirst:true,
            min: 1,
            max: 16,
          },
          min: 1,
          max: 16,
          default: 1,
        },
        bank: {
          name: 'Device A Bank',
          type: 'parameter',
          surface: {
            type: 'nrpn',
            number: 6017,
            lsbFirst:true,
            min: 0,
            max: 127,
          },
          min: 0,
          max: 127,
          default: 0,
        },
        program: {
          name: 'Device A Program',
          type: 'parameter',
          surface: {
            type: 'nrpn',
            number: 6145,
            lsbFirst:true,
            min: 0,
            max: 127,
          },
          min: 0,
          max: 127,
          default: 0,
        },
      },
      B: {
        device: {
          name: 'Device B Device',
          type: 'parameter',
          surface: {
            type: 'nrpn',
            number: 8321,
            lsbFirst:true,
            min: 0,
            max: 127,
          },
          min: 0,
          max: 127,
          default: 0,
        },
        mute: {
          name: 'Device B Mute',
          type: 'parameter',
          surface: {
            type: 'nrpn',
            number: 8577,
            lsbFirst:true,
            min: 0,
            max: 1,
          },
          on: 1,
          default: 1,
        },
        port: {
          name: 'Device B Port',
          type: 'parameter',
          surface: {
            type: 'nrpn',
            number: 6785,
            lsbFirst:true,
            min: 0,
            max: 63,
          },
          min: 0,
          max: 63,
          default: 0,
        },
        channel: {
          name: 'Device B Channel',
          type: 'parameter',
          surface: {
            type: 'nrpn',
            number: 6913,
            lsbFirst:true,
            min: 1,
            max: 16,
          },
          min: 1,
          max: 16,
          default: 1,
        },
        bank: {
          name: 'Device B Bank',
          type: 'parameter',
          surface: {
            type: 'nrpn',
            number: 6273,
            lsbFirst:true,
            min: 0,
            max: 127,
          },
          min: 0,
          max: 127,
          default: 0,
        },
        program: {
          name: 'Device B Program',
          type: 'parameter',
          surface: {
            type: 'nrpn',
            number: 6401,
            lsbFirst:true,
            min: 0,
            max: 127,
          },
          min: 0,
          max: 127,
          default: 0,
        },
      },
    },
    matrix: {
      slot: [
        {
          source: {
            name: 'Matrix Slot 1 Source',
            type: 'parameter',
            surface: {
              type: 'nrpn',
              number: 9473,
              lsbFirst:true,
              min: 0,
              max: 3,
            },
            min: 0,
            max: 3,
            default: 0,
          },
          value: {
            name: 'Matrix Slot 1 Value',
            type: 'parameter',
            surface: {
              type: 'nrpn',
              number: 12161,
              lsbFirst:true,
              min: 0,
              max: 127,
            },
            min: 0,
            max: 127,
            default: 0,
          },
          slewLimiter: {
            name: 'Matrix Slot 1 Slew Limiter',
            type: 'parameter',
            surface: {
              type: 'nrpn',
              number: 12545,
              lsbFirst:true,
              min: 0,
              max: 127,
            },
            min: 0,
            max: 127,
            default: 0,
          },
          destination: [
            {
              target: {
                name: 'Matrix Slot 1 Target 1',
                type: 'parameter',
                surface: {
                  type: 'nrpn',
                  number: 9601,
                  lsbFirst:true,
                  min: 0,
                  max: 127,
                },
                min: 0,
                max: 127,
                default: 0,
              },
              amount: {
                name: 'Matrix Slot 1 Amount 1',
                type: 'parameter',
                surface: {
                  type: 'nrpn',
                  number: 9985,
                  lsbFirst:true,
                  min: 0,
                  max: 127,
                },
                min: -100,
                max: 100,
                default: 0,
                unit: '%',
              },
            },
            {
              target: {
                name: 'Matrix Slot 1 Target 2',
                type: 'parameter',
                surface: {
                  type: 'nrpn',
                  number: 9729,
                  lsbFirst:true,
                  min: 0,
                  max: 127,
                },
                min: 0,
                max: 127,
                default: 0,
              },
              amount: {
                name: 'Matrix Slot 1 Amount 2',
                type: 'parameter',
                surface: {
                  type: 'nrpn',
                  number: 10113,
                  lsbFirst:true,
                  min: 0,
                  max: 127,
                },
                min: -100,
                max: 100,
                default: 0,
                unit: '%',
              },
            },
            {
              target: {
                name: 'Matrix Slot 1 Target 3',
                type: 'parameter',
                surface: {
                  type: 'nrpn',
                  number: 9857,
                  lsbFirst:true,
                  min: 0,
                  max: 127,
                },
                min: 0,
                max: 127,
                default: 0,
              },
              amount: {
                name: 'Matrix Slot 1 Amount 3',
                type: 'parameter',
                surface: {
                  type: 'nrpn',
                  number: 10241,
                  lsbFirst:true,
                  min: 0,
                  max: 127,
                },
                min: -100,
                max: 100,
                default: 0,
                unit: '%',
              },
            },
          ],
        },
        {
          source: {
            name: 'Matrix Slot 2 Source',
            type: 'parameter',
            surface: {
              type: 'nrpn',
              number: 10369,
              lsbFirst:true,
              min: 0,
              max: 3,
            },
            min: 0,
            max: 3,
            default: 0,
          },
          value: {
            name: 'Matrix Slot 2 Value',
            type: 'parameter',
            surface: {
              type: 'nrpn',
              number: 12289,
              lsbFirst:true,
              min: 0,
              max: 127,
            },
            min: 0,
            max: 127,
            default: 0,
          },
          slewLimiter: {
            name: 'Matrix Slot 2 Slew Limiter',
            type: 'parameter',
            surface: {
              type: 'nrpn',
              number: 12673,
              lsbFirst:true,
              min: 0,
              max: 127,
            },
            min: 0,
            max: 127,
            default: 0,
          },
          destination: [
            {
              target: {
                name: 'Matrix Slot 2 Target 1',
                type: 'parameter',
                surface: {
                  type: 'nrpn',
                  number: 10497,
                  lsbFirst:true,
                  min: 0,
                  max: 127,
                },
                min: 0,
                max: 127,
                default: 0,
              },
              amount: {
                name: 'Matrix Slot 2 Amount 1',
                type: 'parameter',
                surface: {
                  type: 'nrpn',
                  number: 10881,
                  lsbFirst:true,
                  min: 0,
                  max: 127,
                },
                min: -100,
                max: 100,
                default: 0,
                unit: '%',
              },
            },
            {
              target: {
                name: 'Matrix Slot 2 Target 2',
                type: 'parameter',
                surface: {
                  type: 'nrpn',
                  number: 10625,
                  lsbFirst:true,
                  min: 0,
                  max: 127,
                },
                min: 0,
                max: 127,
                default: 0,
              },
              amount: {
                name: 'Matrix Slot 2 Amount 2',
                type: 'parameter',
                surface: {
                  type: 'nrpn',
                  number: 11009,
                  lsbFirst:true,
                  min: 0,
                  max: 127,
                },
                min: -100,
                max: 100,
                default: 0,
                unit: '%',
              },
            },
            {
              target: {
                name: 'Matrix Slot 2 Target 3',
                type: 'parameter',
                surface: {
                  type: 'nrpn',
                  number: 10753,
                  lsbFirst:true,
                  min: 0,
                  max: 127,
                },
                min: 0,
                max: 127,
                default: 0,
              },
              amount: {
                name: 'Matrix Slot 2 Amount 3',
                type: 'parameter',
                surface: {
                  type: 'nrpn',
                  number: 11137,
                  lsbFirst:true,
                  min: 0,
                  max: 127,
                },
                min: -100,
                max: 100,
                default: 0,
                unit: '%',
              },
            },
          ],
        },
        {
          source: {
            name: 'Matrix Slot 3 Source',
            type: 'parameter',
            surface: {
              type: 'nrpn',
              number: 11265,
              lsbFirst:true,
              min: 0,
              max: 3,
            },
            min: 0,
            max: 3,
            default: 0,
          },
          value: {
            name: 'Matrix Slot 3 Value',
            type: 'parameter',
            surface: {
              type: 'nrpn',
              number: 12417,
              lsbFirst:true,
              min: 0,
              max: 127,
            },
            min: 0,
            max: 127,
            default: 0,
          },
          slewLimiter: {
            name: 'Matrix Slot 3 Slew Limiter',
            type: 'parameter',
            surface: {
              type: 'nrpn',
              number: 12801,
              lsbFirst:true,
              min: 0,
              max: 127,
            },
            min: 0,
            max: 127,
            default: 0,
          },
          destination: [
            {
              target: {
                name: 'Matrix Slot 3 Target 1',
                type: 'parameter',
                surface: {
                  type: 'nrpn',
                  number: 11393,
                  lsbFirst:true,
                  min: 0,
                  max: 127,
                },
                min: 0,
                max: 127,
                default: 0,
              },
              amount: {
                name: 'Matrix Slot 3 Amount 1',
                type: 'parameter',
                surface: {
                  type: 'nrpn',
                  number: 11777,
                  lsbFirst:true,
                  min: 0,
                  max: 127,
                },
                min: -100,
                max: 100,
                default: 0,
                unit: '%',
              },
            },
            {
              target: {
                name: 'Matrix Slot 3 Target 2',
                type: 'parameter',
                surface: {
                  type: 'nrpn',
                  number: 11521,
                  lsbFirst:true,
                  min: 0,
                  max: 127,
                },
                min: 0,
                max: 127,
                default: 0,
              },
              amount: {
                name: 'Matrix Slot 3 Amount 2',
                type: 'parameter',
                surface: {
                  type: 'nrpn',
                  number: 11905,
                  lsbFirst:true,
                  min: 0,
                  max: 127,
                },
                min: -100,
                max: 100,
                default: 0,
                unit: '%',
              },
            },
            {
              target: {
                name: 'Matrix Slot 3 Target 3',
                type: 'parameter',
                surface: {
                  type: 'nrpn',
                  number: 11649,
                  lsbFirst:true,
                  min: 0,
                  max: 127,
                },
                min: 0,
                max: 127,
                default: 0,
              },
              amount: {
                name: 'Matrix Slot 3 Amount 3',
                type: 'parameter',
                surface: {
                  type: 'nrpn',
                  number: 12033,
                  lsbFirst:true,
                  min: 0,
                  max: 127,
                },
                min: -100,
                max: 100,
                default: 0,
                unit: '%',
              },
            },
          ],
        },
      ],
    },
  },
}
