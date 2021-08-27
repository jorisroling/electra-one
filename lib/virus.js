module.exports = {
  matrix: {
    slot: [
      {
        name: 'Mod Slot #1',
        source: {
          page:1,
          offset: 64,
        },
        destinations: [
          {
            target:{
              page:1,
              offset: 65,
            },
            amount:{
              page:1,
              offset: 66,
            },
          },
          {
            target:{
              page:2,
              offset: 89,
            },
            amount:{
              page:2,
              offset: 90,
            },
          },
          {
            target:{
              page:2,
              offset: 91,
            },
            amount:{
              page:2,
              offset: 92,
            },
          },
        ],
      },
      {
        name: 'Mod Slot #2',
        source: {
          page:1,
          offset: 67,
        },
        destinations: [
          {
            target:{
              page:1,
              offset: 68,
            },
            amount:{
              page:1,
              offset: 69,
            },
          },
          {
            target:{
              page:1,
              offset: 70,
            },
            amount:{
              page:1,
              offset: 71,
            },
          },
          {
            target:{
              page:2,
              offset: 93,
            },
            amount:{
              page:2,
              offset: 94,
            },
          },
        ],
      },
      {
        name: 'Mod Slot #3',
        source: {
          page:1,
          offset: 72,
        },
        destinations: [
          {
            target:{
              page:1,
              offset: 73,
            },
            amount:{
              page:1,
              offset: 74,
            },
          },
          {
            target:{
              page:1,
              offset: 75,
            },
            amount:{
              page:1,
              offset: 76,
            },
          },
          {
            target:{
              page:1,
              offset: 77,
            },
            amount:{
              page:1,
              offset: 78,
            },
          },
        ],
      },
      {
        name: 'Mod Slot #4',
        source: {
          page:1,
          offset: 103,
        },
        destinations: [
          {
            target:{
              page:1,
              offset: 104,
            },
            amount:{
              page:1,
              offset: 105,
            },
          },
          {
            target:{
              page:2,
              offset: 95,
            },
            amount:{
              page:2,
              offset: 96,
            },
          },
          {
            target:{
              page:2,
              offset: 97,
            },
            amount:{
              page:2,
              offset: 98,
            },
          },
        ],
      },
      {
        name: 'Mod Slot #5',
        source: {
          page:1,
          offset: 106,
        },
        destinations: [
          {
            target:{
              page:1,
              offset: 107,
            },
            amount:{
              page:1,
              offset: 108,
            },
          },
          {
            target:{
              page:2,
              offset: 99,
            },
            amount:{
              page:2,
              offset: 100,
            },
          },
          {
            target:{
              page:2,
              offset: 101,
            },
            amount:{
              page:2,
              offset: 102,
            },
          },
        ],
      },
      {
        name: 'Mod Slot #6',
        source: {
          page:1,
          offset: 109,
        },
        destinations: [
          {
            target:{
              page:1,
              offset: 110,
            },
            amount:{
              page:1,
              offset: 111,
            },
          },
          {
            target:{
              page:2,
              offset: 103,
            },
            amount:{
              page:2,
              offset: 104,
            },
          },
          {
            target:{
              page:2,
              offset: 105,
            },
            amount:{
              page:2,
              offset: 106,
            },
          },
        ],
      },
    ],
    source: {
      type: [
        {
          name: 'Off',
          type: 'off',
        },
        {
          name: 'Pitch Bend',
          type: 'pitch',
        },
        {
          name: 'Channel Pressure',
          type: 'pressure',
        },
        {
          name: 'Mod Wheel',
          type: 'cc',
          cc: 1
        },
        {
          name: 'Breath',
          type: 'cc',
          cc: 2
        },
        {
          name: 'Control 3',
          type: 'cc',
          cc: 3
        },
        {
          name: 'Foot Pedal',
          type: 'cc',
          cc: 4
        },
        {
          name: 'Data Entry',
          type: 'cc',
          cc: 6
        },
        {
          name: 'Balance',
          type: 'cc',
          cc: 8
        },
        {
          name: 'Control 9',
          type: 'cc',
          cc: 9
        },
        {
          name: 'Expression',
          type: 'cc',
          cc: 11
        },
        {
          name: 'Control 12',
          type: 'cc',
          cc: 12
        },
        {
          name: 'Control 13',
          type: 'cc',
          cc: 13
        },
        {
          name: 'Control 14',
          type: 'cc',
          cc: 14
        },
        {
          name: 'Control 15',
          type: 'cc',
          cc: 15
        },
        {
          name: 'Control 16',
          type: 'cc',
          cc: 16
        },
        {
          name: 'Hold Pedal',
          type: 'cc',
          cc: 64
        },
        {
          name: 'Portamento Switch',
          type: 'cc',
          cc: 65
        },
        {
          name: 'Sustain Pedal',
          type: 'cc',
          cc: 66
        },
      ],
    },
  },
}
