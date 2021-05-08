module.exports = {
  manufacturer: 'iConnectivity',
  model: 'ICM4+',
  version: 'v2.0.5',
  parameters: {},
  manufactererID: 0xF3,
  info: {
    din: {
      jacks: 4,
      ports: 1,
    },
    usb: {
      device: {
        jacks: 3,
        ports: 16,
      },
      host: {
        jacks: 1,
        ports: 8,
      },
    },
    rtp: {
    },
  },
  commands: {
    GetMIDIPortRoute: {
      bytes: [

        0xF0, 0x00, 0x01, 0x73, 0x7E,	// header
        0x00, 0x06,										// product ID
        0x00, 0x00, 0x00, 0x4C, 0x76, // serial number
        0x00, 0x00,										// transaction ID
        0x40, 0x28,										// command flags and ID
        0x00, 0x02,										// data length
        0x00, 0x35,										// port ID
        0x00,													// checksum
        0xF7,													// footer
      ]
    }
  }
}

