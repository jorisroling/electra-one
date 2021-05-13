// LAST USED NRPN 73

module.exports = {
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
    nrpn: 13,
    min: 0,
    max: 24,
    default: 12,
  },
  gate: {
    nrpn: 14,
    min: 0,
    max: 127,
    default: 64,
  },
  octave: {
    nrpn: 15,
    min: 0,
    max: 127,
    default: 64,
  },
  density: {
    nrpn: 16,
    min: 0,
    max: 100,
    default: 100,
  },
  probability: {
    nrpn: 68,
    min: 0,
    max: 100,
    default: 100,
  },
  killSteps: {
    nrpn: 17,
    min: 0,
    max: 16,
    default: 0,
  },
  killShift: {
    nrpn: 18,
    min: 0,
    max: 30,
    default: 15,
  },
  scales: {
    nrpn: 19,
    min: 0,
    max: 36,
    default: 0,
  },
  base: {
    nrpn: 20,
    min: 0,
    max: 11,
    default: 0,
  },
  shift: {
    nrpn: 21,
    min: 0,
    max: 32,
    default: 16,
  },
  split: {
    nrpn: 22,
    min: 0,
    max: 127,
    default: 127,
  },
  deviate: {
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
        default: 0,
      },
      shape: {
        nrpn: 58,
        min: 0,
        max: 5,
        default: 0,
      },
      rate: {
        nrpn: 26,
        min: 0,
        max: 127,
        default: 64,
      },
      phase: {
        nrpn: 27,
        min: 0,
        max: 100,
        default: 100,
      },
      amount: {
        nrpn: 28,
        min: 0,
        max: 100,
        default: 100,
      },
      offset: {
        nrpn: 29,
        min: 0,
        max: 100,
        default: 50,
      },
      density: {
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
        default: 0,
      },
      shape: {
        nrpn: 59,
        min: 0,
        max: 15,
        default: 0,
      },
      rate: {
        nrpn: 31,
        min: 0,
        max: 127,
        default: 64,
      },
      phase: {
        nrpn: 32,
        min: 0,
        max: 100,
        default: 100,
      },
      amount: {
        nrpn: 33,
        min: 0,
        max: 100,
        default: 100,
      },
      offset: {
        nrpn: 34,
        min: 0,
        max: 100,
        default: 50,
      },
      density: {
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
        default: 0,
      },
      shape: {
        nrpn: 60,
        min: 0,
        max: 15,
        default: 0,
      },
      rate: {
        nrpn: 36,
        min: 0,
        max: 127,
        default: 64,
      },
      phase: {
        nrpn: 37,
        min: 0,
        max: 100,
        default: 100,
      },
      amount: {
        nrpn: 38,
        min: 0,
        max: 100,
        default: 100,
      },
      offset: {
        nrpn: 39,
        min: 0,
        max: 100,
        default: 50,
      },
      density: {
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
  test: {
    nrpn: 40,
    min: 0,
    max: 127,
    default: 0,
  },
  nrpns: {
    min: 9,
    max: 13,
  },
}
