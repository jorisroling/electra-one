module.exports = {
  manufacturer: 'Elektron',
  model: 'Digitakt',
  version: 'v1.11',
  released: 'June 26, 2019',
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
        max: 1,
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
        min: 0,
        max: 1,
      },
      lfo: {
        cc: 14,
        min: 0,
        max: 1,
      },
    },

    // SOURCE PARAMETERS
    source: {
      tune: {
        cc: 16,
        nrpn: {
          msb: 1,
          lsb: 0,
          min: 5120,
          max: 11264,
        },
        min: 0,
        max: 127,
      },
      playMode: {
        cc: 17,
        nrpn: {
          msb: 1,
          lsb: 1,
        },
        min: 0,
        max: 3,
      },
      bitReduction: {
        cc: 18,
        nrpn: {
          msb: 1,
          lsb: 2,
        },
        min: 0,
        max: 127,
      },
      sampleSlot: {
        cc: 19,
        nrpn: {
          msb: 1,
          lsb: 3,
        },
        min: 0,
        max: 127,
      },
      start: {
        cc: 20,
        nrpn: {
          msb: 1,
          lsb: 4,
          max: 15360,
        },
        min: 0,
        max: 127,
      },
      length: {
        cc: 21,
        nrpn: {
          msb: 1,
          lsb: 5,
          max: 15360,
        },
        min: 0,
        max: 127,
      },
      loopPosition: {
        cc: 22,
        nrpn: {
          msb: 1,
          lsb: 6,
          max: 15360,
        },
        min: 0,
        max: 127,
      },
      sampleLevel: {
        cc: 23,
        nrpn: {
          msb: 1,
          lsb: 7,
          max: 16256,
        },
        min: 0,
        max: 127,
      },
    },

    // FILTER PARAMETERS
    filter: {
      frequency: {
        cc: 74,
        nrpn: {
          msb: 1,
          lsb: 20,
          max: 16256,
        },
        min: 0,
        max: 127,
      },
      resonance: {
        cc: 75,
        nrpn: {
          msb: 1,
          lsb: 21,
          max: 16256,
        },
        min: 0,
        max: 127,
      },
      type: {
        cc: 76,
        nrpn: {
          msb: 1,
          lsb: 22,
        },
        min: 0,
        max: 2,
      },
      attack: {
        cc: 70,
        nrpn: {
          msb: 1,
          lsb: 16,
        },
        min: 0,
        max: 127,
      },
      decay: {
        cc: 71,
        nrpn: {
          msb: 1,
          lsb: 17,
        },
        min: 0,
        max: 127,
      },
      sustain: {
        cc: 72,
        nrpn: {
          msb: 1,
          lsb: 18,
        },
        min: 0,
        max: 127,
      },
      release: {
        cc: 73,
        nrpn: {
          msb: 1,
          lsb: 19,
        },
        min: 0,
        max: 127,
      },
      envDepth: {
        cc: 77,
        nrpn: {
          msb: 1,
          lsb: 23,
          max: 16256,
        },
        min: 0,
        max: 127,
      },
    },

    // AMP PARAMETERS
    amp: {
      envelope: {
        attack: {
          cc: 78,
          nrpn: {
            msb: 1,
            lsb: 24,
          },
          min: 0,
          max: 127,
        },
        hold: {
          cc: 79,
          nrpn: {
            msb: 1,
            lsb: 25,
          },
          min: 0,
          max: 127,
        },
        decay: {
          cc: 80,
          nrpn: {
            msb: 1,
            lsb: 26,
          },
          min: 0,
          max: 127,
        },
      },
      overdrive: {
        cc: 81,
        nrpn: {
          msb: 1,
          lsb: 27,
          max: 16256,
        },
        min: 0,
        max: 127,
      },
      delay: {
        cc: 82,
        nrpn: {
          msb: 1,
          lsb: 28,
          max: 16256,
        },
        min: 0,
        max: 127,
      },
      reverb: {
        cc: 83,
        nrpn: {
          msb: 1,
          lsb: 29,
          max: 16256,
        },
        min: 0,
        max: 127,
      },
      pan: {
        cc: 10,
        nrpn: {
          msb: 1,
          lsb: 30,
        },
        min: 0,
        max: 127,
      },
      volume: {
        cc: 7,
        nrpn: {
          msb: 1,
          lsb: 31,
          max: 16256,
        },
        min: 0,
        max: 127,
      },
    },

    // LFO PARAMETERS
    lfo: {
      speed: {
        cc: 102,
        nrpn: {
          msb: 1,
          lsb: 32,
          max: 16256,
        },
        min: 0,
        max: 127,
      },
      multiplier: {
        cc: 103,
        nrpn: {
          msb: 1,
          lsb: 33,
        },
        min: 0,
        max: 23,
      },
      fade: {
        cc: 104,
        nrpn: {
          msb: 1,
          lsb: 34,
        },
        min: 0,
        max: 127,
      },
      destination: {
        cc: 105,
        nrpn: {
          msb: 1,
          lsb: 35,
        },
        min: 0,
        max: 127,
      },
      waveform: {
        cc: 106,
        nrpn: {
          msb: 1,
          lsb: 36,
        },
        min: 0,
        max: 6,
      },
      startPhase: {
        cc: 107,
        nrpn: {
          msb: 1,
          lsb: 37,
        },
        min: 0,
        max: 127,
      },
      trigMode: {
        cc: 108,
        nrpn: {
          msb: 1,
          lsb: 38,
        },
        min: 0,
        max: 4,
      },
      depth: {
        cc: {
          msb: 109,
          lsb: 110,
        },
        nrpn: {
          msb: 1,
          lsb: 39,
        },
        min: 0,
        max: 16256,
      },
    },

    // FX PARAMETERS
    fx: {
      delay: {
        time: {
          cc: 85,
          nrpn: {
            msb: 2,
            lsb: 0,
            max: 16256,
          },
          min: 0,
          max: 127,
        },
        pingpong: {
          cc: 86,
          nrpn: {
            msb: 2,
            lsb: 1,
          },
          min: 0,
          max: 1,
        },
        stereo: {
          width: {
            cc: 87,
            nrpn: {
              msb: 2,
              lsb: 2,
              max: 16256,
            },
            min: 0,
            max: 127,
          },
        },
        feedback: {
          cc: 88,
          nrpn: {
            msb: 2,
            lsb: 3,
          },
          min: 0,
          max: 127,
        },
        filter: {
          highpass: {
            cc: 89,
            nrpn: {
              msb: 2,
              lsb: 4,
              max: 16256,
            },
            min: 0,
            max: 127,
          },
          lowpass: {
            cc: 90,
            nrpn: {
              msb: 2,
              lsb: 5,
              max: 16256,
            },
            min: 0,
            max: 127,
          },
        },
        reverb: {
          cc: 91,
          nrpn: {
            msb: 2,
            lsb: 6,
            max: 16256,
          },
          min: 0,
          max: 127,
        },
        volume: {
          cc: 92,
          nrpn: {
            msb: 2,
            lsb: 7,
            max: 16256,
          },
          min: 0,
          max: 127,
        },
      },
      reverb: {
        predelay: {
          cc: 24,
          nrpn: {
            msb: 2,
            lsb: 8,
            max: 16256,
          },
          min: 0,
          max: 127,
        },
        decay: {
          cc: 25,
          nrpn: {
            msb: 2,
            lsb: 9,
            max: 16256,
          },
          min: 0,
          max: 127,
        },
        shelving: {
          frequency: {
            cc: 26,
            nrpn: {
              msb: 2,
              lsb: 10,
              max: 16256,
            },
            min: 0,
            max: 127,
          },
          gain: {
            cc: 27,
            nrpn: {
              msb: 2,
              lsb: 11,
              max: 16256,
            },
            min: 0,
            max: 127,
          },
        },
        filter: {
          highpass: {
            cc: 28,
            nrpn: {
              msb: 2,
              lsb: 12,
              max: 16256,
            },
            min: 0,
            max: 127,
          },
          lowpass: {
            cc: 29,
            nrpn: {
              msb: 2,
              lsb: 13,
              max: 16256,
            },
            min: 0,
            max: 127,
          },
        },
        revPrePostComp: {
          cc: 30,
          nrpn: {
            msb: 2,
            lsb: 14,
          },
          min: 0,
          max: 1,
        },
        volume: {
          cc: 31,
          nrpn: {
            msb: 2,
            lsb: 15,
            max: 16256,
          },
          min: 0,
          max: 127,
        },
      },
      compressor: {
        threshold: {
          cc: 111,
          nrpn: {
            msb: 2,
            lsb: 16,
          },
          min: 0,
          max: 127,
        },
        attack: {
          cc: 112,
          nrpn: {
            msb: 2,
            lsb: 17,
          },
          min: 0,
          max: 127,
        },
        release: {
          cc: 113,
          nrpn: {
            msb: 2,
            lsb: 18,
          },
          min: 0,
          max: 127,
        },
        makeupGain: {
          cc: 114,
          nrpn: {
            msb: 2,
            lsb: 19,
            max: 16256,
          },
          min: 0,
          max: 127,
        },
        patternVolume: {
          cc: 119,
          nrpn: {
            msb: 2,
            lsb: 24,
            max: 16256,
          },
          min: 0,
          max: 127,
        },
        ratio: {
          cc: 115,
          nrpn: {
            msb: 2,
            lsb: 20,
          },
          min: 0,
          max: 7,
        },
        sidechain: {
          source: {
            cc: 116,
            nrpn: {
              msb: 2,
              lsb: 21,
            },
            min: 0,
            max: 8,
          },
          filter: {
            cc: 117,
            nrpn: {
              msb: 2,
              lsb: 22,
            },
            min: 0,
            max: 127,
          },
        },
        dryWetMix: {
          cc: 118,
          nrpn: {
            msb: 2,
            lsb: 23,
          },
          min: 0,
          max: 127,
        },
      },
    },

    // VAL PARAMETERS
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

    // MISC PARAMETERS
    pattern: {
      mute: {
        cc: 110, //6, in manual?
        nrpn: {
          msb: 1,
          lsb: 104,
        },
        min: 0,
        max: 1,
      },
    },
  },
}

