module.exports = {
  manufacturer: 'Access',
  model: 'Virus TI',
  version: 'v5.1.7.00',
  parameters: {
    osc: {
      1: {
        shape: {
          cc: 17,
          min: 0,
          max: 127,
          page: 'A',
          map: {
            range: {
              min: -64,
              max: +63,
            },
            label: {
              0: 'Left',
              64: 'Center',
              127: 'Right',
            },
          },
        },
        pulsewidth: {
          cc: 18,
          min: 0,
          max: 127,
        },
        waveSelect: {
          cc: 19,
          min: 0,
          max: 127,
        },
        semitone: {
          cc: 20,
          min: 0,
          max: 127,
        },
        keyboard: {
          tracking: {
            cc: 21,
            min: 0,
            max: 127,
          },
        },
      },
      2: {
        shape: {
          cc: 22,
          min: 0,
          max: 127,
        },
        pulsewidth: {
          cc: 23,
          min: 0,
          max: 127,
        },
        waveSelect: {
          cc: 24,
          min: 0,
          max: 127,
        },
        semitone: {
          cc: 25,
          min: 0,
          max: 127,
        },
        detune: {
          cc: 26,
          min: 0,
          max: 127,
        },
        fmAmount: {
          cc: 26,
          min: 0,
          max: 127,
        },
        sync: {
          cc: 28,
          min: 0,
          max: 127,
        },
        filterEnvelope: {
          cc: 29,
          min: 0,
          max: 127,
        },
        keyboard: {
          tracking: {
            cc: 31,
            min: 0,
            max: 127,
          },
        },
      },
      balance: {
        cc: 33,
        min: 0,
        max: 127,
      },
      suboscillatorVolume: {
        cc: 34,
        min: 0,
        max: 127,
      },
      oscillatorMainVolume: {
        cc: 36,
        min: 0,
        max: 127,
      },
      noiseVolume: {
        cc: 37,
        min: 0,
        max: 127,
      },
      ringModulatorVolume: {
        cc: 38,
        min: 0,
        max: 127,
      },
      noiseColor: {
        cc: 39,
        min: 0,
        max: 127,
      },
      suboscillatorShape: {
        cc: 35,
        min: 0,
        max: 127,
      },
    },
    filter: {
      1: {
        cutoff: {
          cc: 40,
          min: 0,
          max: 127,
        },
        resonance: {
          cc: 42,
          min: 0,
          max: 127,
        },
        envelopeAmount: {
          cc: 44,
          min: 0,
          max: 127,
        },
        keyboard: {
          tracking: {
            cc: 46,
            min: 0,
            max: 127,
          },
        },
        mode: {
          cc: 51,
          min: 0,
          max: 127,
        },
      },
      2: {
        cutoff: {
          cc: 41,
          min: 0,
          max: 127,
        },
        resonance: {
          cc: 43,
          min: 0,
          max: 127,
        },
        envelopeAmount: {
          cc: 45,
          min: 0,
          max: 127,
        },
        keyboard: {
          tracking: {
            cc: 47,
            min: 0,
            max: 127,
          },
        },
        mode: {
          cc: 52,
          min: 0,
          max: 127,
        },
      },
      balance: {
        cc: 48,
        min: 0,
        max: 127,
      },
      routing: {
        cc: 53,
        min: 0,
        max: 127,
      },
      saturationCurve: {
        cc: 49,
        min: 0,
        max: 127,
      },
      fmFilterEnvelope: {
        cc: 30,
        min: 0,
        max: 127,
      },
      envelope: {
        attack: {
          cc: 54,
          min: 0,
          max: 127,
        },
        decay: {
          cc: 55,
          min: 0,
          max: 127,
        },
        sustain: {
          cc: 56,
          min: 0,
          max: 127,

          time: {
            cc: 57,
            min: 0,
            max: 127,
          },
        },
        release: {
          cc: 58,
          min: 0,
          max: 127,
        },
      },
    },
    amp: {
      envelope: {
        attack: {
          cc: 59,
          min: 0,
          max: 127,
        },
        decay: {
          cc: 60,
          min: 0,
          max: 127,
        },
        sustain: {
          cc: 61,
          min: 0,
          max: 127,

          time: {
            cc: 62,
            min: 0,
            max: 127,
          },
        },
        release: {
          cc: 63,
          min: 0,
          max: 127,
        },
      },
    },
    voice: {
      portamentoTime: {
        cc: 5,
        min: 0,
        max: 127,
      },
      transpose: {
        cc: 93,
        min: 0,
        max: 127,
      },
      keyboardMode: {
        cc: 94,
        min: 0,
        max: 127,
      },
      unison: {
        mode: {
          cc: 97,
          min: 0,
          max: 127,
        },
        detune: {
          cc: 98,
          min: 0,
          max: 127,
        },
        spread: {
          cc: 99,
          min: 0,
          max: 127,
        },
        lfoPhase: {
          cc: 100,
          min: 0,
          max: 127,
        },
      },
    },
    mixer: {
      part: {
        volume: {
          cc: 7,
          min: 0,
          max: 127,
        },
        balance: {
          cc: 8,
          min: 0,
          max: 127,
        },
        pan: {
          cc: 10,
          min: 0,
          max: 127,
        },
      },
      patch: {
        volume: {
          cc: 91,
          min: 0,
          max: 127,
        },
      },
      input: {
        mode: {
          cc: 101,
          min: 0,
          max: 127,
        },
        select: {
          cc: 102,
          min: 0,
          max: 127,
        },
      },
    },
    lfo: {
      1: {
        rate: {
          cc: 67,
          min: 0,
          max: 127,
        },
        shape: {
          cc: 68,
          min: 0,
          max: 127,
        },
        envelopeMode: {
          cc: 69,
          min: 0,
          max: 127,
        },
        lfoMode: {
          cc: 70,
          min: 0,
          max: 127,
        },
        symmetry: {
          cc: 71,
          min: 0,
          max: 127,
        },
        keyboard: {
          tracking: {
            cc: 72,
            min: 0,
            max: 127,
          },
        },
        keyTrigger: {
          cc: 73,
          min: 0,
          max: 127,
        },
        routing: {
          osc: {
            1: {
              cc: 74,
              min: 0,
              max: 127,
            },
            2: {
              cc: 75,
              min: 0,
              max: 127,
            },
          },
          pulsewidth: {
            cc: 76,
            min: 0,
            max: 127,
          },
          resonance: {
            cc: 77,
            min: 0,
            max: 127,
          },
          filterGain: {
            cc: 78,
            min: 0,
            max: 127,
          },
        },
      },
      2: {
        rate: {
          cc: 79,
          min: 0,
          max: 127,
        },
        shape: {
          cc: 80,
          min: 0,
          max: 127,
        },
        envelopeMode: {
          cc: 81,
          min: 0,
          max: 127,
        },
        lfoMode: {
          cc: 82,
          min: 0,
          max: 127,
        },
        symmetry: {
          cc: 83,
          min: 0,
          max: 127,
        },
        keyboard: {
          tracking: {
            cc: 84,
            min: 0,
            max: 127,
          },
        },
        keyTrigger: {
          cc: 85,
          min: 0,
          max: 127,
        },
        routing: {
          oscillatorShape: {
            cc: 86,
            min: 0,
            max: 127,
          },
          fmAmount: {
            cc: 87,
            min: 0,
            max: 127,
          },
          filert: {
            1: {
              cutoff: {
                cc: 88,
                min: 0,
                max: 127,
              },
            },
            2: {
              cutoff: {
                cc: 89,
                min: 0,
                max: 127,
              },
            }
          },
          pan: {
            cc: 90,
            min: 0,
            max: 127,
          },
        },
      },
    },
    fx: {
      chorus: {
        mix: {
          cc: 105,
          min: 0,
          max: 127,
        },
        rate: {
          cc: 106,
          min: 0,
          max: 127,
        },
        depth: {
          cc: 107,
          min: 0,
          max: 127,
        },
        delay: {
          cc: 108,
          min: 0,
          max: 127,
        },
        feedback: {
          cc: 109,
          min: 0,
          max: 127,
        },
        lfoShape: {
          cc: 110,
          min: 0,
          max: 127,
        },
      },
      delay: {
        time: {
          cc: 114,
          min: 0,
          max: 127,
        },
        feedback: {
          cc: 115,
          min: 0,
          max: 127,
        },
        rate: {
          cc: 116,
          min: 0,
          max: 127,
        },
        depth: {
          cc: 117,
          min: 0,
          max: 127,
        },
        lfoShape: {
          cc: 118,
          min: 0,
          max: 127,
        },
        color: {
          cc: 119,
          min: 0,
          max: 127,
        },
      },
      reverb:{
        decay: {
          cc: 116,
          min: 0,
          max: 127,
        },
        size: {
          cc: 117,
          min: 0,
          max: 127,
        },
        damping: {
          cc: 118,
          min: 0,
          max: 127,
        },
      },
      mode: {
        cc: 112,
        min: 0,
        max: 127,
      },
      send: {
        cc: 113,
        min: 0,
        max: 127,
      },
    },
    controller: {
      breath: {
        cc: 2,
        min: 0,
        max: 127,
      },
      expression: {
        cc: 11,
        min: 0,
        max: 127,
      },
      foot: {
        cc: 4,
        min: 0,
        max: 127,
      },
      holdPedal: {
        cc: 64,
        min: 0,
        max: 127,
      },
      modulation: {
        cc: 1,
        min: 0,
        max: 127,
      },
      portamentoPedal: {
        cc: 65,
        min: 0,
        max: 127,
      },
      sostenutoPedal: {
        cc: 66,
        min: 0,
        max: 127,
      },
      3: {
        cc: 3,
        min: 0,
        max: 127,
      },
      9: {
        cc: 9,
        min: 0,
        max: 127,
      },
      12: {
        cc: 12,
        min: 0,
        max: 127,
      },
      13: {
        cc: 13,
        min: 0,
        max: 127,
      },
      14: {
        cc: 14,
        min: 0,
        max: 127,
      },
      15: {
        cc: 15,
        min: 0,
        max: 127,
      },
      16: {
        cc: 16,
        min: 0,
        max: 127,
      },
      50: {
        cc: 50,
        min: 0,
        max: 127,
      },
      92: {
        cc: 92,
        min: 0,
        max: 127,
      },
      95: {
        cc: 95,
        min: 0,
        max: 127,
      },
      96: {
        cc: 96,
        min: 0,
        max: 127,
      },
      103: {
        cc: 103,
        min: 0,
        max: 127,
      },
      104: {
        cc: 104,
        min: 0,
        max: 127,
      },
      111: {
        cc: 111,
        min: 0,
        max: 127,
      },
      120: {
        cc: 120,
        min: 0,
        max: 127,
      },
      121: {
        cc: 121,
        min: 0,
        max: 127,
      },
      124: {
        cc: 124,
        min: 0,
        max: 127,
      },
      125: {
        cc: 125,
        min: 0,
        max: 127,
      },
      126: {
        cc: 126,
        min: 0,
        max: 127,
      },
      127: {
        cc: 127,
        min: 0,
        max: 127,
      },
    },
    misc: {
      allNotesOff: {
        cc: 123,
        min: 0,
        max: 127,
      },
      keyboard: {
        cc: 122,
        min: 0,
        max: 127,
      },
    },
  },
}
