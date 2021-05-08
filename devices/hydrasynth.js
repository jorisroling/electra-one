module.exports = {
  manufacturer: 'ASM',
  model: 'Hydrasynth',
  version: 'v1.30',
  parameters: {
    osc: {
      cent: {
        nrpn: { msb: 0x41, lsb: 0x04 },
        min: 0,
        max: 0x2000, //8192
        text: 'All OSC Cent',
      },
      mode: {
        nrpn: { msb: 0x3F, lsb: 0x18 },
        text: 'OSC Mode',
        options: [
          {
            msb:0x00,
            lsb:0x00,
            text:'OSC1 Single',
          },
          {
            msb:0x01,
            lsb:0x00,
            text:'OSC2 Single',
          },
          {
            msb:0x02,
            lsb:0x00,
            text:'OSC3 Single',
          },
          {
            msb:0x00,
            lsb:0x01,
            text:'OSC1 WaveScan',
          },
          {
            msb:0x01,
            lsb:0x01,
            text:'OSC2 WaveScan',
          },
          {
            msb:0x02,
            lsb:0x01,
            text:'OSC3 WaveScan',
          },
        ],
      },
      semi: {
        nrpn: { msb: 0x3F, lsb: 0x11 },
        text: 'OSC Semi',
        options: [
          {
            msb:0x00,
            lsb: { min:0, max:127 }, // 0 - 64 = value, 65 - 127 = value - 128
            text:'OSC1 Semi',
          },
          {
            msb:0x01,
            lsb: { min:0, max:127 }, // 0 - 64 = value, 65 - 127 = value - 128
            text:'OSC2 Semi',
          },
          {
            msb:0x02,
            lsb: { min:0, max:127 }, // 0 - 64 = value, 65 - 127 = value - 128
            text:'OSC3 Semi',
          },
        ],
      },
      1: {
        type: {
          nrpn: { msb: 0x3F, lsb: 0x19 },
          min: 0,
          max: 218,
          text: 'OSC1 Type',
        },
        cent: {
          nrpn: { msb: 0x41, lsb: 0x01 },
          min: 0,
          max: 8192, // 0 - 4096 = value, 4095 - 8191 = value - 8192
          text: 'OSC1 Cent',
        },
        keytrack: {
          nrpn: { msb: 0x3F, lsb: 0x54 },
          min: 0,
          max: 200,
          text: 'OSC1 Keytrack',
        },
        wavindex: {
          nrpn: { msb: 0x41, lsb: 0x2A },
          min: 0,
          max: 8192,
          text: 'OSC1 WavIndex',
        },
        solo: {
          nrpn: { msb: 0x3F, lsb: 0x1B },
          text: 'OSC1 Solo WavScan',
          options: [
            {
              msb:0x00,
              lsb:0x00,
              text:'OSC1 Wave1 Off',
            },
            {
              msb:0x01,
              lsb:0x00,
              text:'OSC1 Wave2 Off',
            },
            {
              msb:0x02,
              lsb:0x00,
              text:'OSC1 Wave3 Off',
            },
            {
              msb:0x03,
              lsb:0x00,
              text:'OSC1 Wave4 Off',
            },
            {
              msb:0x04,
              lsb:0x00,
              text:'OSC1 Wave5 Off',
            },
            {
              msb:0x05,
              lsb:0x00,
              text:'OSC1 Wave6 Off',
            },
            {
              msb:0x06,
              lsb:0x00,
              text:'OSC1 Wave7 Off',
            },
            {
              msb:0x07,
              lsb:0x00,
              text:'OSC1 Wave8 Off',
            },
            {
              msb:0x00,
              lsb:0x01,
              text:'OSC1 Wave1 On',
            },
            {
              msb:0x01,
              lsb:0x01,
              text:'OSC1 Wave2 On',
            },
            {
              msb:0x02,
              lsb:0x01,
              text:'OSC1 Wave3 On',
            },
            {
              msb:0x03,
              lsb:0x01,
              text:'OSC1 Wave4 On',
            },
            {
              msb:0x04,
              lsb:0x01,
              text:'OSC1 Wave5 On',
            },
            {
              msb:0x05,
              lsb:0x01,
              text:'OSC1 Wave6 On',
            },
            {
              msb:0x06,
              lsb:0x01,
              text:'OSC1 Wave7 On',
            },
            {
              msb:0x07,
              lsb:0x01,
              text:'OSC1 Wave8 On',
            },
          ],
        },
        wavescan: {
          1: {
            nrpn: { msb: 0x3F, lsb: 0x60 },
            min: 0,
            max: 218,
            text: 'OSC1 WaveScan Wave1',
          },
          2: {
            nrpn: { msb: 0x3F, lsb: 0x61 },
            min: 0,
            max: 218,
            text: 'OSC1 WaveScan Wave2',
          },
          3: {
            nrpn: { msb: 0x3F, lsb: 0x62 },
            min: 0,
            max: 218,
            text: 'OSC1 WaveScan Wave3',
          },
          4: {
            nrpn: { msb: 0x3F, lsb: 0x63 },
            min: 0,
            max: 218,
            text: 'OSC1 WaveScan Wave4',
          },
          5: {
            nrpn: { msb: 0x3F, lsb: 0x64 },
            min: 0,
            max: 218,
            text: 'OSC1 WaveScan Wave5',
          },
          6: {
            nrpn: { msb: 0x3F, lsb: 0x65 },
            min: 0,
            max: 218,
            text: 'OSC1 WaveScan Wave6',
          },
          7: {
            nrpn: { msb: 0x3F, lsb: 0x66 },
            min: 0,
            max: 218,
            text: 'OSC1 WaveScan Wave7',
          },
          8: {
            nrpn: { msb: 0x3F, lsb: 0x67 },
            min: 0,
            max: 218,
            text: 'OSC1 WaveScan Wave8',
          },
        },
      },
      2: {
        type: {
          nrpn: { msb: 0x3F, lsb: 0x1A },
          min: 0,
          max: 218,
          text: 'OSC2 Type',
        },
        cent: {
          nrpn: { msb: 0x41, lsb: 0x02 },
          min: 0,
          max: 8192, // 0 - 4096 = value, 4095 - 8191 = value - 8192
          text: 'OSC2 Cent',
        },
        keytrack: {
          nrpn: { msb: 0x3F, lsb: 0x55 },
          min: 0,
          max: 200,
          text: 'OSC2 Keytrack',
        },
        wavindex: {
          nrpn: { msb: 0x41, lsb: 0x2B },
          min: 0,
          max: 8192,
          text: 'OSC2 WavIndex',
        },
        solo: {
          nrpn: { msb: 0x3F, lsb: 0x1C },
          text: 'OSC2 Solo WavScan',
          options: [
            {
              msb:0x00,
              lsb:0x00,
              text:'OSC2 Wave1 Off',
            },
            {
              msb:0x01,
              lsb:0x00,
              text:'OSC2 Wave2 Off',
            },
            {
              msb:0x02,
              lsb:0x00,
              text:'OSC2 Wave3 Off',
            },
            {
              msb:0x03,
              lsb:0x00,
              text:'OSC2 Wave4 Off',
            },
            {
              msb:0x04,
              lsb:0x00,
              text:'OSC2 Wave5 Off',
            },
            {
              msb:0x05,
              lsb:0x00,
              text:'OSC2 Wave6 Off',
            },
            {
              msb:0x06,
              lsb:0x00,
              text:'OSC2 Wave7 Off',
            },
            {
              msb:0x07,
              lsb:0x00,
              text:'OSC2 Wave8 Off',
            },
            {
              msb:0x00,
              lsb:0x01,
              text:'OSC2 Wave1 On',
            },
            {
              msb:0x01,
              lsb:0x01,
              text:'OSC2 Wave2 On',
            },
            {
              msb:0x02,
              lsb:0x01,
              text:'OSC2 Wave3 On',
            },
            {
              msb:0x03,
              lsb:0x01,
              text:'OSC2 Wave4 On',
            },
            {
              msb:0x04,
              lsb:0x01,
              text:'OSC2 Wave5 On',
            },
            {
              msb:0x05,
              lsb:0x01,
              text:'OSC2 Wave6 On',
            },
            {
              msb:0x06,
              lsb:0x01,
              text:'OSC2 Wave7 On',
            },
            {
              msb:0x07,
              lsb:0x01,
              text:'OSC2 Wave8 On',
            },
          ],
        },
        wavescan: {
          1: {
            nrpn: { msb: 0x3F, lsb: 0x68 },
            min: 0,
            max: 218,
            text: 'OSC2 WaveScan Wave1',
          },
          2: {
            nrpn: { msb: 0x3F, lsb: 0x69 },
            min: 0,
            max: 218,
            text: 'OSC2 WaveScan Wave2',
          },
          3: {
            nrpn: { msb: 0x3F, lsb: 0x6A },
            min: 0,
            max: 218,
            text: 'OSC2 WaveScan Wave3',
          },
          4: {
            nrpn: { msb: 0x3F, lsb: 0x6B },
            min: 0,
            max: 218,
            text: 'OSC2 WaveScan Wave4',
          },
          5: {
            nrpn: { msb: 0x3F, lsb: 0x6C },
            min: 0,
            max: 218,
            text: 'OSC2 WaveScan Wave5',
          },
          6: {
            nrpn: { msb: 0x3F, lsb: 0x6D },
            min: 0,
            max: 218,
            text: 'OSC2 WaveScan Wave6',
          },
          7: {
            nrpn: { msb: 0x3F, lsb: 0x6E },
            min: 0,
            max: 218,
            text: 'OSC2 WaveScan Wave7',
          },
          8: {
            nrpn: { msb: 0x3F, lsb: 0x6F },
            min: 0,
            max: 218,
            text: 'OSC2 WaveScan Wave8',
          },
        },
      },
      3: {
        type: {
          nrpn: { msb: 0x3F, lsb: 0x0D },
          min: 0,
          max: 218,
          text: 'OSC3 Type',
        },
        cent: {
          nrpn: { msb: 0x41, lsb: 0x03 },
          min: 0,
          max: 8192, // 0 - 4096 = value, 4095 - 8191 = value - 8192
          text: 'OSC3 Cent',
        },
        keytrack: {
          nrpn: { msb: 0x3F, lsb: 0x56 },
          min: 0,
          max: 200,
          text: 'OSC3 Keytrack',
        },
      },
    }
  },
}
