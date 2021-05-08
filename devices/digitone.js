module.exports = {
  manufacturer: 'Elektron',
  model: 'Digitone',
  version: 'v1.21',
  released: 'June 27, 2019',
  parameters: {

    // TRACK PARAMETERS
    track: {
      mute: {
        cc: 94,
        nrpn: {
          msb: 1,
          lsb: 101,
        },
        min: 0,
        max: 127,
      },
      level: {
        cc: 95,
        nrpn: {
          msb: 1,
          lsb: 100,
        },
        min: 0,
        max: 127,
      },
    },

    // TRIG PARAMETERS
    trig: {
      note: {
        cc: 3,
        nrpn: {
          msb: 3,
          lsb: 0,
        },
        min: 0,
        max: 127,
      },
      velocity: {
        cc: 4,
        nrpn: {
          msb: 3,
          lsb: 1,
        },
        min: 0,
        max: 127,
      },
      length: {
        cc: 5,
        nrpn: {
          msb: 3,
          lsb: 2,
        },
        min: 0,
        max: 127,
      },
      filter: {
        cc: 13,
        nrpn: {
          msb: 3,
          lsb: 5,
        },
        min: 0,
        max: 127,
      },
      lfo: {
        cc: 14,
        nrpn: {
          msb: 3,
          lsb: 6,
        },
        min: 0,
        max: 127,
      },
      portamento: {
        time: {
          cc: 15,
          nrpn: {
            msb: 3,
            lsb: 7,
          },
          min: 0,
          max: 127,
        },
        on: {
          cc: 16,
          nrpn: {
            msb: 3,
            lsb: 8,
          },
          min: 0,
          max: 127,
        },
      },
    },

    // FM PARAMETERS
    fm: {

      // SYN1 PAGE

      algorithm: {
        cc: 90,
        nrpn: {
          msb: 1,
          lsb: 72,
        },
        min: 0,
        max: 7,
      },
      ratio: {
        c: {
          cc: 91,
          nrpn: {
            msb: 1,
            lsb: 73,
          },
          min: 0,
          max: 18,

          offset: {
            nrpn: { msb: 1, lsb: 95 },
            min: 0,
            max: 16383,
          },
        },
        a: {
          cc: 92,
          nrpn: {
            msb: 1,
            lsb: 74,
          },
          min: 0,
          max: 35,

          offset: {
            nrpn: { msb: 1, lsb: 96 },
            min: 0,
            max: 16383,
          },

        },
        b: {
          cc: {
            msb: 16,
            lsb: 48,
          },
          nrpn: {
            msb: 1,
            lsb: 75,
          },
          min: 0,
          max: 360,

          1: {
            offset: {
              nrpn: { msb: 1, lsb: 97 },
              min: 0,
              max: 16383,
            },
          },
          2: {
            offset: {
              nrpn: { msb: 1, lsb: 98 },
              min: 0,
              max: 16383,
            },
          }
        },
      },
      harmonics: {
        cc: { msb: 17, lsb: 49 },
        nrpn: { msb: 1, lsb: 76 },
        min: 4736,
        max: 11392,
      },
      detune: {
        cc: { msb: 18, lsb: 50 },
        nrpn: { msb: 1, lsb: 77 },
        min: 0,
        max: 16256,
      },
      feedback: {
        cc: { msb: 19, lsb: 51 },
        nrpn: { msb: 1, lsb: 78 },
        min: 0,
        max: 16256,
      },
      mix: {
        cc: { msb: 20, lsb: 52 },
        nrpn: { msb: 1, lsb: 79 },
        min: 0,
        max: 127,
      },

      // SYN2 PAGE
      a: {
        envelope: {
          attack: {
            cc: 75,
            nrpn: { msb: 1, lsb: 80 },
            min: 0,
            max: 127,
          },
          decay: {
            cc: 76,
            nrpn: { msb: 1, lsb: 81 },
            min: 0,
            max: 127,
          },
          end: {
            cc: 77,
            nrpn: { msb: 1, lsb: 82 },
            min: 0,
            max: 127,
          },
          reset: {
            cc: 85,
            nrpn: { msb: 1, lsb: 90 },
            min: 0,
            max: 1,
          },
        },
        level: {
          cc: 78,
          nrpn: { msb: 1, lsb: 83 },
          min: 0,
          max: 127,
        },
        delay: {
          cc: 83,
          nrpn: { msb: 1, lsb: 88 },
          min: 0,
          max: 127,
        },
        trig: {
          cc: 84,
          nrpn: { msb: 1, lsb: 89 },
          min: 0,
          max: 1,
        },
      },
      b: {
        envelope: {
          attack: {
            cc: 79,
            nrpn: { msb: 1, lsb: 84 },
            min: 0,
            max: 127,
          },
          decay: {
            cc: 80,
            nrpn: { msb: 1, lsb: 85 },
            min: 0,
            max: 127,
          },
          end: {
            cc: 81,
            nrpn: { msb: 1, lsb: 86 },
            min: 0,
            max: 127,
          },
          reset: {
            cc: 88,
            nrpn: { msb: 1, lsb: 93 },
            min: 0,
            max: 1,
          },
        },
        level: {
          cc: 82,
          nrpn: { msb: 1, lsb: 87 },
          min: 0,
          max: 127,
        },
        delay: {
          cc: 86,
          nrpn: { msb: 1, lsb: 91 },
          min: 0,
          max: 127,
        },
        trig: {
          cc: 87,
          nrpn: { msb: 1, lsb: 92 },
          min: 0,
          max: 1,
        },
      },
      phase: {
        reset: {
          cc: 89,
          nrpn: { msb: 1, lsb: 94 },
          min: 0,
          max: 4,
        },
      }
    },

    // FILTER PARAMETERS
    filter: {
      frequency: {
        cc: { msb: 23, lsb: 55 },
        nrpn: { msb: 1, lsb: 20 },
        min: 0,
        max: 16256,
      },
      resonance: {
        cc: { msb: 24, lsb: 56 },
        nrpn: { msb: 1, lsb: 21 },
        min: 0,
        max: 16256,
      },
      type: {
        cc: 74,
        nrpn: { msb: 1, lsb: 22 },
        min: 0,
        max: 3,
      },
      attack: {
        cc: 70,
        nrpn: { msb: 1, lsb: 16 },
        min: 0,
        max: 127,
      },
      decay: {
        cc: 71,
        nrpn: { msb: 1, lsb: 17 },
        min: 0,
        max: 127,
      },
      sustain: {
        cc: 72,
        nrpn: { msb: 1, lsb: 18 },
        min: 0,
        max: 127,
      },
      release: {
        cc: 73,
        nrpn: { msb: 1, lsb: 19 },
        min: 0,
        max: 127,
      },
      envDepth: {
        cc: { msb: 25, lsb: 57 },
        nrpn: { msb: 1, lsb: 23 },
        min: 0,
        max: 16256,
      },
      base: {
        cc: { msb: 26, lsb: 58 },
        nrpn: { msb: 1, lsb: 24 },
        min: 0,
        max: 127,
      },
      width: {
        cc: { msb: 27, lsb: 59 },
        nrpn: { msb: 1, lsb: 25 },
        min: 0,
        max: 127,
      },
    },

    // AMP PARAMETERS
    amp: {
      envelope: {
        attack: {
          cc: 104,
          nrpn: { msb: 1, lsb: 32 },
          min: 0,
          max: 127,
        },
        decay: {
          cc: 105,
          nrpn: { msb: 1, lsb: 33 },
          min: 0,
          max: 127,
        },
        sustain: {
          cc: 106,
          nrpn: { msb: 1, lsb: 34 },
          min: 0,
          max: 127,
        },
        release: {
          cc: 107,
          nrpn: { msb: 1, lsb: 35 },
          min: 0,
          max: 127,
        },
        reset: {
          cc: 102,
          nrpn: { msb: 1, lsb: 42 },
          min: 0,
          max: 1,
        },
      },
      drive: {
        cc: { msb: 9, lsb: 41 },
        nrpn: { msb: 1, lsb: 36 },
        min: 0,
        max: 16256,
      },
      pan: {
        cc: { msb: 10, lsb: 42 },
        nrpn: { msb: 1, lsb: 37 },
        min: 0,
        max: 127,
      },
      volume: {
        cc: { msb: 7, lsb: 39 },
        nrpn: { msb: 1, lsb: 38 },
        min: 0,
        max: 16256,
      },
      chorus: {
        cc: { msb: 12, lsb: 44 },
        nrpn: { msb: 1, lsb: 41 },
        min: 0,
        max: 16256,
      },
      delay: {
        cc: { msb: 13, lsb: 45 },
        nrpn: { msb: 1, lsb: 40 },
        min: 0,
        max: 16256,
      },
      reverb: {
        cc: { msb: 14, lsb: 46 },
        nrpn: { msb: 1, lsb: 39 },
        min: 0,
        max: 16256,
      },
    },

    // LFO PARAMETERS

    lfo: {

      // LFO 1
      1: {
        speed: {
          cc: { msb: 28, lsb: 60 },
          nrpn: { msb: 1, lsb: 32 },
          min: 0,
          max: 16256,
        },
        multiplier: {
          cc: 108,
          nrpn: { msb: 1, lsb: 49 },
          min: 0,
          max: 23,
        },
        fadeInOut: {
          cc: 109,
          nrpn: { msb: 1, lsb: 50 },
          min: 0,
          max: 127,
        },
        destination: {
          cc: 110,
          nrpn: { msb: 1, lsb: 51 },
          min: 0,
          max: 73,
        },
        waveform: {
          cc: 111,
          nrpn: { msb: 1, lsb: 52 },
          min: 0,
          max: 6,
        },
        startPhase: {
          cc: 112,
          nrpn: { msb: 1, lsb: 53 },
          min: 0,
          max: 127,
        },
        mode: {
          cc: 113,
          nrpn: { msb: 1, lsb: 54 },
          min: 0,
          max: 4,
        },
        depth: {
          cc: { msb: 29, lsb: 61 },
          nrpn: { msb: 1, lsb: 55 },
          min: 0,
          max: 16383,
        },
      },

      // LFO 2
      2: {
        speed: {
          cc: { msb: 30, lsb: 62 },
          nrpn: { msb: 1, lsb: 57 },
          min: 0,
          max: 16256,
        },
        multiplier: {
          cc: 114,
          nrpn: { msb: 1, lsb: 58 },
          min: 0,
          max: 23,
        },
        fadeInOut: {
          cc: 115,
          nrpn: { msb: 1, lsb: 59 },
          min: 0,
          max: 127,
        },
        destination: {
          cc: 116,
          nrpn: { msb: 1, lsb: 60 },
          min: 0,
          max: 73,
        },
        waveform: {
          cc: 117,
          nrpn: { msb: 1, lsb: 61 },
          min: 0,
          max: 6,
        },
        startPhase: {
          cc: 118,
          nrpn: { msb: 1, lsb: 62 },
          min: 0,
          max: 127,
        },
        mode: {
          cc: 119,
          nrpn: { msb: 1, lsb: 63 },
          min: 0,
          max: 4,
        },
        depth: {
          cc: { msb: 31, lsb: 63 },
          nrpn: { msb: 1, lsb: 64 },
          min: 0,
          max: 16383,
        },
      },
    },

    // MIDI TRACK PARAMETERS

    midi: {
      value: {
        1: {
          cc: 70,
          min: 0,
          max: 127,
        },
        2: {
          cc: 71,
          min: 0,
          max: 127,
        },
        3: {
          cc: 72,
          min: 0,
          max: 127,
        },
        4: {
          cc: 73,
          min: 0,
          max: 127,
        },
        5: {
          cc: 74,
          min: 0,
          max: 127,
        },
        6: {
          cc: 75,
          min: 0,
          max: 127,
        },
        7: {
          cc: 76,
          min: 0,
          max: 127,
        },
        8: {
          cc: 77,
          min: 0,
          max: 127,
        },
      },
    },


    // FX PARAMETERS

    fx: {

      // CHORUS PARAMETERS

      chorus: {
        depth: {
          cc: { msb: 3, lsb: 35 },
          nrpn: { msb: 2, lsb: 0 },
          min: 0,
          max: 16256,
        },
        speed: {
          cc: { msb: 9, lsb: 41 },
          nrpn: { msb: 2, lsb: 1 },
          min: 0,
          max: 16256,
        },
        highpass: {
          cc: 70,
          nrpn: { msb: 2, lsb: 2 },
          min: 0,
          max: 127,
        },
        width: {
          cc: 71,
          nrpn: { msb: 2, lsb: 3 },
          min: 0,
          max: 127,
        },
        delay: {
          cc: { msb: 12, lsb: 44 },
          nrpn: { msb: 2, lsb: 4 },
          min: 0,
          max: 16256,
        },
        reverb: {
          cc: { msb: 13, lsb: 45 },
          nrpn: { msb: 2, lsb: 5 },
          min: 0,
          max: 16256,
        },
        volume: {
          cc: 14,
          nrpn: { msb: 2, lsb: 6 },
          min: 0,
          max: 127,
        },
      },

      // DELAY PARAMETERS

      delay: {
        time: {
          cc: { msb: 15, lsb: 47 },
          nrpn: { msb: 2, lsb: 10 },
          min: 0,
          max: 16256,
        },
        pingpong: {
          cc: { msb: 16, lsb: 48 },
          nrpn: { msb: 2, lsb: 11 },
          min: 0,
          max: 1,
        },
        stereo: {
          width: {
            cc: { msb: 17, lsb: 49 },
            nrpn: { msb: 2, lsb: 12 },
            min: 0,
            max: 16256,
          },
        },
        feedback: {
          cc: { msb: 18, lsb: 50 },
          nrpn: { msb: 2, lsb: 13 },
          min: 0,
          max: 16256,
        },
        filter: {
          highpass: {
            cc: 72,
            nrpn: { msb: 2, lsb: 14 },
            min: 0,
            max: 127,
          },
          lowpass: {
            cc: 73,
            nrpn: { msb: 2, lsb: 15 },
            min: 0,
            max: 127,
          },
        },
        reverb: {
          cc: { msb: 19, lsb: 51 },
          nrpn: { msb: 2, lsb: 16 },
          min: 0,
          max: 16256,
        },
        volume: {
          cc: 20,
          nrpn: { msb: 2, lsb: 17 },
          min: 0,
          max: 127,
        },
      },

      // REVERB PARAMETERS

      reverb: {
        predelay: {
          cc: { msb: 21, lsb: 53 },
          nrpn: { msb: 2, lsb: 20 },
          min: 0,
          max: 16256,
        },
        decay: {
          cc: 74,
          nrpn: { msb: 2, lsb: 21 },
          min: 0,
          max: 127,
        },
        shelving: {
          frequency: {
            cc: 75,
            nrpn: { msb: 2, lsb: 22 },
            min: 0,
            max: 127,
          },
          gain: {
            cc: { msb: 22, lsb: 54 },
            nrpn: { msb: 2, lsb: 23 },
            min: 0,
            max: 16256,
          },
        },
        filter: {
          highpass: {
            cc: 76,
            nrpn: { msb: 2, lsb: 24 },
            min: 0,
            max: 127,
          },
          lowpass: {
            cc: 77,
            nrpn: { msb: 2, lsb: 25 },
            min: 0,
            max: 127,
          },
        },
        volume: {
          cc: 23,
          nrpn: { msb: 2, lsb: 26 },
          min: 0,
          max: 127,
        },
      },

      // MASTER PARAMETERS

      master: {
        input: {
          left: {
            volume: {
              cc: { msb: 24, lsb: 56 },
              nrpn: { msb: 2, lsb: 30 },
              min: 0,
              max: 16256,
            },
            pan: {
              cc: 78,
              nrpn: { msb: 2, lsb: 31 },
              min: 0,
              max: 127,
            },
          },
          right: {
            volume: {
              cc: { msb: 25, lsb: 57 },
              nrpn: { msb: 2, lsb: 32 },
              min: 0,
              max: 16256,
            },
            pan: {
              cc: 79,
              nrpn: { msb: 2, lsb: 33 },
              min: 0,
              max: 127,
            },
          },
        },
        chorus: {
          cc: { msb: 26, lsb: 58 },
          nrpn: { msb: 2, lsb: 34 },
          min: 0,
          max: 16256,
        },
        delay: {
          cc: { msb: 27, lsb: 59 },
          nrpn: { msb: 2, lsb: 35 },
          min: 0,
          max: 16256,
        },
        reverb: {
          cc: { msb: 28, lsb: 60 },
          nrpn: { msb: 2, lsb: 36 },
          min: 0,
          max: 16256,
        },
        overdrive: {
          cc: { msb: 29, lsb: 61 },
          nrpn: { msb: 2, lsb: 37 },
          min: 0,
          max: 16256,
        },
        volume: {
          cc: 95,
          nrpn: { msb: 2, lsb: 38 },
          min: 0,
          max: 127,
        },
      },
    },

    // MISC PARAMETERS

    misc: {
      patternMute: {
        nrpn: { msb: 1, lsb: 104 },
        min: 0,
        max: 1,
      },
      sustain: {
        cc: 64,
        min: 0,
        max: 127,
      },
      sostenuto: {
        cc: 66,
        min: 0,
        max: 127,
      },
    },
  },
}

