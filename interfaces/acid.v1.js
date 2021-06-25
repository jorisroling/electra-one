// LAST USED NRPN 101

module.exports = {

  parameters: {
    generate: {
      nrpn: 10,
    },
    temperature: {
      nrpn: 9,
      min: 100,
      max: 500,
      default: 100,
    },
    previous_pattern: {
      nrpn: 11,
    },
    next_pattern: {
      nrpn: 12,
    },
    transpose: {
      cc: 3,
      nrpn: 13,
      min: -64,
      max: 63,
      default: 0,
    },
    gate: {
      cc: 18,
      nrpn: 14,
      min: 0,
      max: 192,
      default: 96,
    },
    octaveChance: {
      cc: 9,
      nrpn: 15,
      min: 0,
      max: 127,
      default: 64,
    },
    density: {
      cc: 14,
      nrpn: 16,
      min: 0,
      max: 100,
      default: 100,
    },
    probability: {
      cc: 15,
      nrpn: 68,
      min: 0,
      max: 100,
      default: 100,
    },
    muteSteps: {
      cc: 16,
      nrpn: 17,
      min: 0,
      max: 16,
      default: 0,
    },
    muteShift: {
      cc: 17,
      nrpn: 18,
      min: 0,
      max: 30,
      default: 15,
    },
    scales: {
      cc: 20,
      nrpn: 19,
      min: 0,
      max: 36,
      default: 0,
    },
    base: {
      cc: 21,
      nrpn: 20,
      min: 0,
      max: 11,
      default: 0,
    },
    shift: {
      cc: 19,
      nrpn: 21,
      min: 0,
      max: 32,
      default: 16,
    },
    split: {
      cc: 22,
      nrpn: 22,
      min: 0,
      max: 127,
      default: 127,
    },
    deviate: {
      cc: 23,
      nrpn: 23,
      min: 0,
      max: 100,
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
    bank: {
      nrpn: 72,
      min: 0,
      max: 127,
      default: 0,
    },
    program: {
      nrpn: 73,
      min: 0,
      max: 127,
      default: 0,
    },
    mute: {
      nrpn: 101,
      min: 0,
      max: 1,
      default: 0,
    },
    lfo: {
      1: {
        device: {
          A: {
            cc: 31,
            nrpn: 41,
          },
          B: {
            cc: 85,
            nrpn: 42,
          },
        },
        control: {
          cc: 24,
          nrpn: 25,
          min: 0,
          max: 127,
          default: 0,
        },
        shape: {
          cc: 25,
          nrpn: 58,
          min: 0,
          max: 5,
          default: 0,
        },
        rate: {
          cc: 27,
          nrpn: 26,
          min: 0,
          max: 127,
          default: 64,
        },
        phase: {
          cc: 29,
          nrpn: 27,
          min: 0,
          max: 100,
          default: 100,
        },
        amount: {
          cc: 26,
          nrpn: 28,
          min: 0,
          max: 100,
          default: 100,
        },
        offset: {
          cc: 28,
          nrpn: 29,
          min: 0,
          max: 100,
          default: 50,
        },
        density: {
          cc: 30,
          nrpn: 61,
          min: 0,
          max: 127,
          default: 0,
        },
        show: {
          nrpn: 55,
          min: 0,
          max: 127,
          default: 0,
        },
      },
      2: {
        device: {
          A: {
            cc: 104,
            nrpn: 43,
          },
          B: {
            cc: 105,
            nrpn: 44,
          },
        },
        control: {
          cc: 86,
          nrpn: 30,
          min: 0,
          max: 127,
          default: 0,
        },
        shape: {
          cc: 87,
          nrpn: 59,
          min: 0,
          max: 15,
          default: 0,
        },
        rate: {
          cc: 89,
          nrpn: 31,
          min: 0,
          max: 127,
          default: 64,
        },
        phase: {
          cc: 102,
          nrpn: 32,
          min: 0,
          max: 100,
          default: 100,
        },
        amount: {
          cc: 88,
          nrpn: 33,
          min: 0,
          max: 100,
          default: 100,
        },
        offset: {
          cc: 90,
          nrpn: 34,
          min: 0,
          max: 100,
          default: 50,
        },
        density: {
          cc: 103,
          nrpn: 62,
          min: 0,
          max: 127,
          default: 0,
        },
        show: {
          nrpn: 56,
          min: 0,
          max: 127,
          default: 0,
        },
      },
      3: {
        device: {
          A: {
            cc: 113,
            nrpn: 45,
          },
          B: {
            cc: 114,
            nrpn: 46,
          },
        },
        control: {
          cc: 106,
          nrpn: 35,
          min: 0,
          max: 127,
          default: 0,
        },
        shape: {
          cc: 107,
          nrpn: 60,
          min: 0,
          max: 15,
          default: 0,
        },
        rate: {
          cc: 109,
          nrpn: 36,
          min: 0,
          max: 127,
          default: 64,
        },
        phase: {
          cc: 111,
          nrpn: 37,
          min: 0,
          max: 100,
          default: 100,
        },
        amount: {
          cc: 108,
          nrpn: 38,
          min: 0,
          max: 100,
          default: 100,
        },
        offset: {
          cc: 110,
          nrpn: 39,
          min: 0,
          max: 100,
          default: 50,
        },
        density: {
          cc: 112,
          nrpn: 63,
          min: 0,
          max: 127,
          default: 0,
        },
        show: {
          nrpn: 57,
          min: 0,
          max: 127,
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
          default: 0,
        },
        mute: {
          nrpn: 66,
          min: 0,
          max: 1,
          default: 0,
        },
        port: {
          nrpn: 51,
          min: 0,
          max: 63,
          default: 0,
        },
        channel: {
          nrpn: 52,
          min: 1,
          max: 16,
          default: 1,
        },
        bank: {
          nrpn: 47,
          min: 0,
          max: 127,
          default: 0,
        },
        program: {
          nrpn: 48,
          min: 0,
          max: 127,
          default: 0,
        },
      },
      B: {
        device: {
          nrpn: 65,
          min: 0,
          max: 63,
          default: 0,
        },
        mute: {
          nrpn: 67,
          min: 0,
          max: 1,
          default: 0,
        },
        port: {
          nrpn: 53,
          min: 0,
          max: 63,
          default: 0,
        },
        channel: {
          nrpn: 54,
          min: 1,
          max: 16,
          default: 2,
        },
        bank: {
          nrpn: 49,
          min: 0,
          max: 127,
          default: 0,
        },
        program: {
          nrpn: 50,
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
            nrpn: 74,
            min: 0,
            max: 2,
            default: 0,
          },
          value: {
            nrpn: 95,
            min: 0,
            max: 127,
            default: 0,
          },
          slewLimiter: {
            nrpn: 98,
            min: 0,
            max: 127,
            default: 0,
          },
          destination: [
            {
              target: {
                nrpn: 75,
                min: 0,
                max: 39,
                default: 0,
              },
              amount: {
                nrpn: 78,
                min: 0,
                max: 127,
                default: 0,
              },
            },
            {
              target: {
                nrpn: 76,
                min: 0,
                max: 39,
                default: 0,
              },
              amount: {
                nrpn: 79,
                min: 0,
                max: 127,
                default: 0,
              },
            },
            {
              target: {
                nrpn: 77,
                min: 0,
                max: 39,
                default: 0,
              },
              amount: {
                nrpn: 80,
                min: 0,
                max: 127,
                default: 0,
              },
            },
          ],
        },
        {
          source: {
            nrpn: 81,
            min: 0,
            max: 2,
            default: 0,
          },
          value: {
            nrpn: 96,
            min: 0,
            max: 127,
            default: 0,
          },
          slewLimiter: {
            nrpn: 99,
            min: 0,
            max: 127,
            default: 0,
          },
          destination: [
            {
              target: {
                nrpn: 82,
                min: 0,
                max: 39,
                default: 0,
              },
              amount: {
                nrpn: 85,
                min: 0,
                max: 127,
                default: 0,
              },
            },
            {
              target: {
                nrpn: 83,
                min: 0,
                max: 39,
                default: 0,
              },
              amount: {
                nrpn: 86,
                min: 0,
                max: 127,
                default: 0,
              },
            },
            {
              target: {
                nrpn: 84,
                min: 0,
                max: 39,
                default: 0,
              },
              amount: {
                nrpn: 87,
                min: 0,
                max: 127,
                default: 0,
              },
            },
          ],
        },
        {
          source: {
            nrpn: 88,
            min: 0,
            max: 2,
            default: 0,
          },
          value: {
            nrpn: 97,
            min: 0,
            max: 127,
            default: 0,
          },
          slewLimiter: {
            nrpn: 100,
            min: 0,
            max: 127,
            default: 0,
          },
          destination: [
            {
              target: {
                nrpn: 89,
                min: 0,
                max: 39,
                default: 0,
              },
              amount: {
                nrpn: 92,
                min: 0,
                max: 127,
                default: 0,
              },
            },
            {
              target: {
                nrpn: 90,
                min: 0,
                max: 39,
                default: 0,
              },
              amount: {
                nrpn: 93,
                min: 0,
                max: 127,
                default: 0,
              },
            },
            {
              target: {
                nrpn: 91,
                min: 0,
                max: 39,
                default: 0,
              },
              amount: {
                nrpn: 94,
                min: 0,
                max: 127,
                default: 0,
              },
            },
          ],
        },
      ],
    },
  },
}
