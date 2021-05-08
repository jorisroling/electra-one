module.exports = {
  manufacturer: 'Roland',
  model: 'MC-101',
  version: 'v1.60',
  released: 'September 25, 2020',
  tracks: {
    1: {
      name: "Track 1",
      channel: 6,
      controls: 'parameters',
    },
    2: {
      name: "Track 2",
      channel: 7,
      controls: 'parameters',
    },
    3: {
      name: "Track 3",
      channel: 8,
      controls: 'parameters',
    },
    4: {
      name: "Track 4",
      channel: 9,
      controls: 'parameters',
    },
    control: {
      name: "Control",
      channel: 16,
    },
  },
  parameters: {
    modulation: {
      cc: 1,
    },
    volume: {
      cc: 7,
    },
    pan: {
      cc: 10,
    },
    expression: {
      cc: 11,
    },
    hold: {
      1: {
        cc: 64,
      },
    },
    portamento: {
      cc: 65,
      time: {
        cc: 5,
      },
      control: {
        cc: 84,
      },
    },
    sostenuto: {
      cc: 66,
    },
    soft: {
      cc: 67,
    },
    legato: {
      cc: 68,
    },
    resonance: {
      cc: 71,
    },
    release: {
      cc: 72,
    },
    attack: {
      cc: 73,
    },
    cutoff: {
      cc: 74,
    },
    decay: {
      cc: 75,
    },
    vibrato: {
      rate: {
        cc: 76,
      },
      depth: {
        cc: 77,
      },
      delay: {
        cc: 78,
      },
    },
    knob: {
      sound: {
        cc: 83,
      },
      filter: {
        cc: 80,
      },
      mod: {
        cc: 81,
      },
      fx: {
        cc: 82,
      },
    },
    fx: {
      1: {
        send: {
          cc: 91,
        },
      },
      3: {
        send: {
          cc: 92,
        },
      },
    },
  },
}

