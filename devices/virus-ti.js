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
          parameter: 'A17',
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
          parameter: 'A18',
        },
        waveSelect: {
          cc: 19,
          min: 0,
          max: 127,
          parameter: 'A19',
        },
        semitone: {
          cc: 20,
          min: 0,
          max: 127,
          parameter: 'A20',
        },
        keyboard: {
          tracking: {
            cc: 21,
            min: 0,
            max: 127,
            parameter: 'A21',
          },
        },
      },
      2: {
        shape: {
          cc: 22,
          min: 0,
          max: 127,
          parameter: 'A22',
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
          parameter: 'A23',
        },
        semitone: {
          cc: 25,
          min: 0,
          max: 127,
          parameter: 'A25',
        },
        detune: {
          cc: 26,
          min: 0,
          max: 127,
          parameter: 'A26',
        },
        fmAmount: {
          cc: 27,
          min: 0,
          max: 127,
          parameter: 'A27',
        },
        sync: {
          cc: 28,
          min: 0,
          max: 1,
          parameter: 'A28',
        },
        filterEnvelope: {
          cc: 29,
          min: 0,
          max: 127,
          parameter: 'A29',
        },
        keyboard: {
          tracking: {
            cc: 31,
            min: 0,
            max: 127,
            parameter: 'A31',
          },
        },
      },
      balance: {
        cc: 33,
        min: 0,
        max: 127,
        parameter: 'A33',
      },
      suboscillator: {
        volume: {
          cc: 34,
          min: 0,
          max: 127,
          parameter: 'A34',
        },
        shape: {
          cc: 35,
          min: 0,
          max: 127,
          parameter: 'A35',
        },
      },
      oscillatorMainVolume: {
        cc: 36,
        min: 0,
        max: 127,
        parameter: 'A36',
      },
      noiseVolume: {
        cc: 37,
        min: 0,
        max: 127,
        parameter: 'A37',
      },
      ringModulatorVolume: {
        cc: 38,
        min: 0,
        max: 127,
        parameter: 'A38',
      },
      noiseColor: {
        cc: 39,
        min: 0,
        max: 127,
        parameter: 'A39',
      },
    },
    filter: {
      1: {
        cutoff: {
          cc: 40,
          min: 0,
          max: 127,
          parameter: 'A40',
        },
        resonance: {
          cc: 42,
          min: 0,
          max: 127,
          parameter: 'A42',
        },
        envelopeAmount: {
          cc: 44,
          min: 0,
          max: 127,
          parameter: 'A44',
        },
        keyboard: {
          tracking: {
            cc: 46,
            min: 0,
            max: 127,
            parameter: 'A46',
          },
        },
        mode: {
          cc: 51,
          min: 0,
          max: 127,
          parameter: 'A51',
        },
      },
      2: {
        cutoff: {
          cc: 41,
          min: 0,
          max: 127,
          parameter: 'A41',
        },
        resonance: {
          cc: 43,
          min: 0,
          max: 127,
          parameter: 'A43',
        },
        envelopeAmount: {
          cc: 45,
          min: 0,
          max: 127,
          parameter: 'A45',
        },
        keyboard: {
          tracking: {
            cc: 47,
            min: 0,
            max: 127,
            parameter: 'A47',
          },
        },
        mode: {
          cc: 52,
          min: 0,
          max: 127,
          parameter: 'A52',
        },
      },
      balance: {
        cc: 48,
        min: 0,
        max: 127,
        parameter: 'A48',
      },
      routing: {
        cc: 53,
        min: 0,
        max: 127,
        parameter: 'A53',
      },
      saturationCurve: {
        cc: 49,
        min: 0,
        max: 127,
        parameter: 'A49',
      },
      fmFilterEnvelope: {
        cc: 30,
        min: 0,
        max: 127,
        parameter: 'A30',
      },
      envelope: {
        attack: {
          cc: 54,
          min: 0,
          max: 127,
          parameter: 'A54',
        },
        decay: {
          cc: 55,
          min: 0,
          max: 127,
          parameter: 'A45',
        },
        sustain: {
          cc: 56,
          min: 0,
          max: 127,
          parameter: 'A56',
          time: {
            cc: 57,
            min: 0,
            max: 127,
            parameter: 'A57',
          },
        },
        release: {
          cc: 58,
          min: 0,
          max: 127,
          parameter: 'A58',
        },
      },
    },
    amp: {
      envelope: {
        attack: {
          cc: 59,
          min: 0,
          max: 127,
          parameter: 'A59',
        },
        decay: {
          cc: 60,
          min: 0,
          max: 127,
          parameter: 'A60',
        },
        sustain: {
          cc: 61,
          min: 0,
          max: 127,
          parameter: 'A61',

          time: {
            cc: 62,
            min: 0,
            max: 127,
            parameter: 'A62',
          },
        },
        release: {
          cc: 63,
          min: 0,
          max: 127,
          parameter: 'A63',
        },
      },
    },
    voice: {
      portamentoTime: {
        cc: 5,
        min: 0,
        max: 127,
        parameter: 'A5',
      },
      transpose: {
        cc: 93,
        min: 0,
        max: 127,
        parameter: 'A93',
      },
      keyboardMode: {
        cc: 94,
        min: 0,
        max: 127,
        parameter: 'A94',
      },
      unison: {
        mode: {
          cc: 97,
          min: 0,
          max: 127,
          parameter: 'A97',
        },
        detune: {
          cc: 98,
          min: 0,
          max: 127,
          parameter: 'A98',
        },
        spread: {
          cc: 99,
          min: 0,
          max: 127,
          parameter: 'A99',
        },
        lfoPhase: {
          cc: 100,
          min: 0,
          max: 127,
          parameter: 'A100',
        },
      },
    },
    mixer: {
      part: {
        volume: {
          cc: 7,
          min: 0,
          max: 127,
          parameter: 'A7',
        },
        balance: {
          cc: 8,
          min: 0,
          max: 127,
          parameter: 'A8',
        },
        pan: {
          cc: 10,
          min: 0,
          max: 127,
          parameter: 'A10',
        },
      },
      patch: {
        volume: {
          cc: 91,
          min: 0,
          max: 127,
          parameter: 'A91',
        },
      },
      input: {
        mode: {
          cc: 101,
          min: 0,
          max: 127,
          parameter: 'A101',
        },
        select: {
          cc: 102,
          min: 0,
          max: 127,
          parameter: 'A102',
        },
      },
    },
    lfo: {
      1: {
        rate: {
          cc: 67,
          min: 0,
          max: 127,
          parameter: 'A67',
        },
        shape: {
          cc: 68,
          min: 0,
          max: 127,
          parameter: 'A68',
        },
        envelopeMode: {
          cc: 69,
          min: 0,
          max: 127,
          parameter: 'A69',
        },
        lfoMode: {
          cc: 70,
          min: 0,
          max: 127,
          parameter: 'A70',
        },
        symmetry: {
          cc: 71,
          min: 0,
          max: 127,
          parameter: 'A71',
        },
        keyboard: {
          tracking: {
            cc: 72,
            min: 0,
            max: 127,
            parameter: 'A72',
          },
        },
        keyTrigger: {
          cc: 73,
          min: 0,
          max: 127,
          parameter: 'A73',
        },
        routing: {
          osc: {
            1: {
              cc: 74,
              min: 0,
              max: 127,
              parameter: 'A74',
            },
            2: {
              cc: 75,
              min: 0,
              max: 127,
              parameter: 'A75',
            },
          },
          pulsewidth: {
            cc: 76,
            min: 0,
            max: 127,
            parameter: 'A76',
          },
          resonance: {
            cc: 77,
            min: 0,
            max: 127,
            parameter: 'A77',
          },
          filterGain: {
            cc: 78,
            min: 0,
            max: 127,
            parameter: 'A78',
          },
        },
      },
      2: {
        rate: {
          cc: 79,
          min: 0,
          max: 127,
          parameter: 'A79',
        },
        shape: {
          cc: 80,
          min: 0,
          max: 127,
          parameter: 'A80',
        },
        envelopeMode: {
          cc: 81,
          min: 0,
          max: 127,
          parameter: 'A81',
        },
        lfoMode: {
          cc: 82,
          min: 0,
          max: 127,
          parameter: 'A82',
        },
        symmetry: {
          cc: 83,
          min: 0,
          max: 127,
          parameter: 'A83',
        },
        keyboard: {
          tracking: {
            cc: 84,
            min: 0,
            max: 127,
            parameter: 'A84',
          },
        },
        keyTrigger: {
          cc: 85,
          min: 0,
          max: 127,
          parameter: 'A85',
        },
        routing: {
          oscillatorShape: {
            cc: 86,
            min: 0,
            max: 127,
            parameter: 'A86',
          },
          fmAmount: {
            cc: 87,
            min: 0,
            max: 127,
            parameter: 'A87',
          },
          filert: {
            1: {
              cutoff: {
                cc: 88,
                min: 0,
                max: 127,
                parameter: 'A80',
              },
            },
            2: {
              cutoff: {
                cc: 89,
                min: 0,
                max: 127,
                parameter: 'A89',
              },
            }
          },
          pan: {
            cc: 90,
            min: 0,
            max: 127,
            parameter: 'A90',
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
          parameter: 'A105',
        },
        rate: {
          cc: 106,
          min: 0,
          max: 127,
          parameter: 'A106',
        },
        depth: {
          cc: 107,
          min: 0,
          max: 127,
          parameter: 'A107',
        },
        delay: {
          cc: 108,
          min: 0,
          max: 127,
          parameter: 'A108',
        },
        feedback: {
          cc: 109,
          min: 0,
          max: 127,
          parameter: 'A109',
        },
        lfoShape: {
          cc: 110,
          min: 0,
          max: 127,
          parameter: 'A110',
        },
      },
      delay: {
        time: {
          cc: 114,
          min: 0,
          max: 127,
          parameter: 'A114',
        },
        feedback: {
          cc: 115,
          min: 0,
          max: 127,
          parameter: 'A115',
        },
        rate: {
          cc: 116,
          min: 0,
          max: 127,
          parameter: 'A116',
        },
        depth: {
          cc: 117,
          min: 0,
          max: 127,
          parameter: 'A117',
        },
        lfoShape: {
          cc: 118,
          min: 0,
          max: 127,
          parameter: 'A118',
        },
        color: {
          cc: 119,
          min: 0,
          max: 127,
          parameter: 'A119',
        },
      },
      reverb:{
        decay: {
          cc: 116,
          min: 0,
          max: 127,
          parameter: 'A116',
        },
        size: {
          cc: 117,
          min: 0,
          max: 127,
          parameter: 'A117',
        },
        damping: {
          cc: 118,
          min: 0,
          max: 127,
          parameter: 'A118',
        },
      },
      mode: {
        cc: 112,
        min: 0,
        max: 127,
        parameter: 'A112',
      },
      send: {
        cc: 113,
        min: 0,
        max: 127,
        parameter: 'A113',
      },
    },
    controller: {
      breath: {
        cc: 2,
        min: 0,
        max: 127,
        parameter: 'A2',
      },
      expression: {
        cc: 11,
        min: 0,
        max: 127,
        parameter: 'A11',
      },
      foot: {
        cc: 4,
        min: 0,
        max: 127,
        parameter: 'A4',
      },
      holdPedal: {
        cc: 64,
        min: 0,
        max: 127,
        parameter: 'A64',
      },
      modulation: {
        cc: 1,
        min: 0,
        max: 127,
        parameter: 'A1',
      },
      portamentoPedal: {
        cc: 65,
        min: 0,
        max: 127,
        parameter: 'A65',
      },
      sostenutoPedal: {
        cc: 66,
        min: 0,
        max: 127,
        parameter: 'A66',
      },
      3: {
        cc: 3,
        min: 0,
        max: 127,
        parameter: 'A3',
      },
      9: {
        cc: 9,
        min: 0,
        max: 127,
        parameter: 'A9',
      },
      12: {
        cc: 12,
        min: 0,
        max: 127,
        parameter: 'A12',
      },
      13: {
        cc: 13,
        min: 0,
        max: 127,
        parameter: 'A13',
      },
      14: {
        cc: 14,
        min: 0,
        max: 127,
        parameter: 'A14',
      },
      15: {
        cc: 15,
        min: 0,
        max: 127,
        parameter: 'A15',
      },
      16: {
        cc: 16,
        min: 0,
        max: 127,
        parameter: 'A16',
      },
      50: {
        cc: 50,
        min: 0,
        max: 127,
        parameter: 'A50',
      },
      92: {
        cc: 92,
        min: 0,
        max: 127,
        parameter: 'A92',
      },
      95: {
        cc: 95,
        min: 0,
        max: 127,
        parameter: 'A95',
      },
      96: {
        cc: 96,
        min: 0,
        max: 127,
        parameter: 'A96',
      },
      103: {
        cc: 103,
        min: 0,
        max: 127,
        parameter: 'A103',
      },
      104: {
        cc: 104,
        min: 0,
        max: 127,
        parameter: 'A104',
      },
      111: {
        cc: 111,
        min: 0,
        max: 127,
        parameter: 'A111',
      },
      120: {
        cc: 120,
        min: 0,
        max: 127,
        parameter: 'A120',
      },
      121: {
        cc: 121,
        min: 0,
        max: 127,
        parameter: 'A121',
      },
      124: {
        cc: 124,
        min: 0,
        max: 127,
        parameter: 'A124',
      },
      125: {
        cc: 125,
        min: 0,
        max: 127,
        parameter: 'A125',
      },
      126: {
        cc: 126,
        min: 0,
        max: 127,
        parameter: 'A126',
      },
      127: {
        cc: 127,
        min: 0,
        max: 127,
        parameter: 'A127',
      },
    },
    misc: {
      allNotesOff: {
        cc: 123,
        min: 0,
        max: 127,
        parameter: 'A123',
      },
      keyboard: {
        cc: 122,
        min: 0,
        max: 127,
        parameter: 'A122',
      },
    },
  },
}
