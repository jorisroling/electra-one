// LAST USED NRPN 101

module.exports = {

  elements: {
    generate: {
      name: 'Generate',
      type: 'action',
      surface: {
        type: 'nrpn',
        number: 1281,
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
        min: 100,
        max: 500,
      },
      min: 1.0,
      max: 5.0,
      default: 1.0,
    },
    previous_pattern: {
      name: 'Previous Pattern',
      type: 'action',
      surface: {
        type: 'nrpn',
        number: 1409,
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
    },
    gate: {
      name: 'Gate',
      type: 'parameter',
      surface: {
        type: 'nrpn',
        number: 1793,
        min: 0,
        max: 127,
      },
      external: {
        type: 'cc',
        number: 18,
        min: 0,
        max: 127,
      },
      min: 0.0,
      max: 1.92,
      default: 0.96,
      precision: 2,
    },
    octaveChance: {
      name: 'Octave Chance',
      type: 'parameter',
      surface: {
        type: 'nrpn',
        number: 1921,
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
    },
    density: {
      name: 'Density',
      type: 'parameter',
      surface: {
        type: 'nrpn',
        number: 2049,
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
    },
    probability: {
      name: 'Probability',
      type: 'parameter',
      surface: {
        type: 'nrpn',
        number: 8705,
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
    },
    killSteps: {
      name: 'Kill Steps',
      type: 'parameter',
      surface: {
        type: 'nrpn',
        number: 2177,
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
    },
    killShift: {
      name: 'Kill Shift',
      type: 'parameter',
      surface: {
        type: 'nrpn',
        number: 2305,
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
    },
    scales: {
      name: 'Scales Mode',
      type: 'parameter',
      surface: {
        type: 'nrpn',
        number: 2433,
        min: 0,
        max: 36,
      },
      external: {
        type: 'cc',
        number: 20,
        min: 0,
        max: 36,
      },
      min: 0,
      max: 36,
      default: 0,
    },
    base: {
      name: 'Scales Base',
      type: 'parameter',
      surface: {
        type: 'nrpn',
        number: 2561,
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
    },
    shift: {
      name: 'Shift',
      type: 'parameter',
      surface: {
        type: 'nrpn',
        number: 2689,
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
    },
    split: {
      name: 'Split',
      type: 'parameter',
      surface: {
        type: 'nrpn',
        number: 2817,
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
    },
    reset_preset: {
      name: 'Reset Preset',
      type: 'action',
      surface: {
        type: 'nrpn',
        number: 3073,
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
        number: 6401,
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
            min: 0,
            max: 127,
          },
          external: {
            type: 'cc',
            number: 24,
            min: 0,
            max: 127,
          },
          min: 0,
          max: 127,
          default: 0,
        },
        shape: {
          name: 'LFO 1 Shape',
          type: 'parameter',
          surface: {
            type: 'nrpn',
            number: 7425,
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
        },
        amount: {
          name: 'LFO 1 Amount',
          type: 'parameter',
          surface: {
            type: 'nrpn',
            number: 3585,
            min: 0,
            max: 100,
          },
          external: {
            type: 'cc',
            number: 26,
            min: 0,
            max: 100,
          },
          min: 0,
          max: 100,
          default: 100,
        },
        offset: {
          name: 'LFO 1 Offset',
          type: 'parameter',
          surface: {
            type: 'nrpn',
            number: 3713,
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
        },
        density: {
          name: 'LFO 1 Density',
          type: 'parameter',
          surface: {
            type: 'nrpn',
            number: 7809,
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
            min: 0,
            max: 127,
          },
          min: -100,
          max: 100,
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
            min: 0,
            max: 127,
          },
          external: {
            type: 'cc',
            number: 86,
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
        },
        amount: {
          name: 'LFO 2 Amount',
          type: 'parameter',
          surface: {
            type: 'nrpn',
            number: 4225,
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
        },
        offset: {
          name: 'LFO 2 Offset',
          type: 'parameter',
          surface: {
            type: 'nrpn',
            number: 4353,
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
        },
        density: {
          name: 'LFO 2 Density',
          type: 'parameter',
          surface: {
            type: 'nrpn',
            number: 7937,
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
            min: 0,
            max: 127,
          },
          min: -100,
          max: 100,
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
            min: 0,
            max: 127,
          },
          external: {
            type: 'cc',
            number: 106,
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
        },
        amount: {
          name: 'LFO 3 Amount',
          type: 'parameter',
          surface: {
            type: 'nrpn',
            number: 4865,
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
        },
        offset: {
          name: 'LFO 3 Offset',
          type: 'parameter',
          surface: {
            type: 'nrpn',
            number: 4993,
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
        },
        density: {
          name: 'LFO 3 Density',
          type: 'parameter',
          surface: {
            type: 'nrpn',
            number: 8065,
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
            min: 0,
            max: 127,
          },
          min: -100,
          max: 100,
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
            number: 6145,
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
                  min: 0,
                  max: 127,
                },
                min: -100,
                max: 100,
                default: 0,
              },
            },
            {
              target: {
                name: 'Matrix Slot 1 Target 2',
                type: 'parameter',
                surface: {
                  type: 'nrpn',
                  number: 9729,
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
                  min: 0,
                  max: 127,
                },
                min: -100,
                max: 100,
                default: 0,
              },
            },
            {
              target: {
                name: 'Matrix Slot 1 Target 3',
                type: 'parameter',
                surface: {
                  type: 'nrpn',
                  number: 9857,
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
                  min: 0,
                  max: 127,
                },
                min: -100,
                max: 100,
                default: 0,
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
                  min: 0,
                  max: 127,
                },
                min: -100,
                max: 100,
                default: 0,
              },
            },
            {
              target: {
                name: 'Matrix Slot 2 Target 2',
                type: 'parameter',
                surface: {
                  type: 'nrpn',
                  number: 10625,
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
                  min: 0,
                  max: 127,
                },
                min: -100,
                max: 100,
                default: 0,
              },
            },
            {
              target: {
                name: 'Matrix Slot 2 Target 3',
                type: 'parameter',
                surface: {
                  type: 'nrpn',
                  number: 10753,
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
                  min: 0,
                  max: 127,
                },
                min: -100,
                max: 100,
                default: 0,
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
                  min: 0,
                  max: 127,
                },
                min: -100,
                max: 100,
                default: 0,
              },
            },
            {
              target: {
                name: 'Matrix Slot 3 Target 2',
                type: 'parameter',
                surface: {
                  type: 'nrpn',
                  number: 11521,
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
                  min: 0,
                  max: 127,
                },
                min: -100,
                max: 100,
                default: 0,
              },
            },
            {
              target: {
                name: 'Matrix Slot 3 Target 3',
                type: 'parameter',
                surface: {
                  type: 'nrpn',
                  number: 11649,
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
                  min: 0,
                  max: 127,
                },
                min: -100,
                max: 100,
                default: 0,
              },
            },
          ],
        },
      ],
    },
  },
}
