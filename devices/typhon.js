module.exports = {
  manufacturer: 'Dreadbox',
  model: 'Typhon',
  version: 'v3.1.1',
  parameters: {
    controller: {
      modulation: {
        cc: 1,
      },
      cc2: {
        cc: 2,
      },
    },
    filter: {
      lp: {
        cutoff: {
          cc: 4,
        },
        resonance: {
          cc: 3,
        },
        tracking: {
          cc: 9,
        },
        fm: {
          cc: 11,
        },
      },
      hp: {
        cutoff: {
          cc: 12,
        },
        resonance: {
          cc: 13,
        },
      },
      envelope: {
        attack: {
          cc: 27,
        },
        decay: {
          cc: 28,
        },
        sustain: {
          cc: 29,
        },
        release: {
          cc: 30,
        },
        time: {
          cc: 31,
        },
        level: {
          cc: 33,
        },
      },
    },
    amp: {
      envelope: {
        attack: {
          cc: 34,
        },
        decay: {
          cc: 35,
        },
        sustain: {
          cc: 36,
        },
        release: {
          cc: 37,
        },
        time: {
          cc: 38,
        },
        level: {
          cc: 39,
        },
      },
    },
    mod: {
      1: {
        parameter: {
          1: {
            cc: 40,
          },
          2: {
            cc: 41,
          },
          3: {
            cc: 42,
          },
        },
        cv: {
          level: {
            cc: 43,
          },
          1: {
            level: {
              cc: 44,
            },
          },
          2: {
            level: {
              cc: 45,
            },
          },
        },
        wave: {
          level: {
            cc: 46,
          },
        },
        cut: {
          level: {
            cc: 47,
          },
        },
        vca: {
          level: {
            cc: 48,
          },
        },
        fx: {
          fm: {
            level: {
              cc: 50,
            },
          },
          1: {
            level: {
              cc: 49,
            },
          },
          2: {
            level: {
              cc: 51,
            },
          },
          3: {
            level: {
              cc: 52,
            },
          },
        },
        custom:{
          1: {
            level: {
              cc: 53,
            },
          },
          2: {
            level: {
              cc: 54,
            },
          },
          3: {
            level: {
              cc: 55,
            },
          },
        },
        mode: {
          cc: 93,
        },
      },
      2: {
        parameter: {
          1: {
            cc: 56,
          },
          2: {
            cc: 57,
          },
          3: {
            cc: 58,
          },
        },
        cv: {
          level: {
            cc: 59,
          },
          1: {
            level: {
              cc: 60,
            },
          },
          2: {
            level: {
              cc: 61,
            },
          },
        },
        wave: {
          level: {
            cc: 62,
          },
        },
        cut: {
          level: {
            cc: 63,
          },
        },
        vca: {
          level: {
            cc: 65,
          },
        },
        fx: {
          fm: {
            level: {
              cc: 67,
            },
          },
          1: {
            level: {
              cc: 66,
            },
          },
          2: {
            level: {
              cc: 68,
            },
          },
          3: {
            level: {
              cc: 69,
            },
          },
        },
        custom:{
          1: {
            level: {
              cc: 70,
            },
          },
          2: {
            level: {
              cc: 71,
            },
          },
          3: {
            level: {
              cc: 72,
            },
          },
        },
        mode: {
          cc: 94,
        },
      },
      3: {
        parameter: {
          1: {
            cc: 73,
          },
          2: {
            cc: 74,
          },
          3: {
            cc: 75,
          },
        },
        cv: {
          level: {
            cc: 76,
          },
          1: {
            level: {
              cc: 77,
            },
          },
          2: {
            level: {
              cc: 78,
            },
          },
        },
        wave: {
          level: {
            cc: 79,
          },
        },
        cut: {
          level: {
            cc: 80,
          },
        },
        vca: {
          level: {
            cc: 81,
          },
        },
        fx: {
          fm: {
            level: {
              cc: 83,
            },
          },
          1: {
            level: {
              cc: 82,
            },
          },
          2: {
            level: {
              cc: 84,
            },
          },
          3: {
            level: {
              cc: 85,
            },
          },
        },
        custom:{
          1: {
            level: {
              cc: 86,
            },
          },
          2: {
            level: {
              cc: 87,
            },
          },
          3: {
            level: {
              cc: 88,
            },
          },
        },
        mode: {
          cc: 95,
        },
      },
    },
    fx: {
      1: {
        parameter: {
          1: {
            cc: 14,
          },
          2: {
            cc: 15,
          },
        },
        mix: {
          cc: 16,
        },
        type: {
          cc: 96,
        },
      },
      2: {
        parameter: {
          1: {
            cc: 17,
          },
          2: {
            cc: 18,
          },
          3: {
            cc: 19,
          },
          4: {
            cc: 20,
          },
        },
        mix: {
          cc: 21,
        },
        type: {
          cc: 97,
        },
      },
      3: {
        parameter: {
          1: {
            cc: 22,
          },
          2: {
            cc: 23,
          },
          3: {
            cc: 24,
          },
          4: {
            cc: 25,
          },
        },
        mix: {
          cc: 26,
        },
        type: {
          cc: 98,
        },
      },
    },
    osc: {
      wave: {
        cc: 5,
      },
      tune: {
        cc: 6,
      },
      glide: {
        cc: 7,
      },
      level: {
        cc: 8,
      },
    },
  },
}

