module.exports = {
  elements: {
    part: {
      name: 'Part',
      type: 'parameter',
      surface: {
        type: 'sysex',
        bytes: [0xF0, 0x7D, 0x20, '*', 0xF7],
        number: 0x20,
        min: 1,
        max: 16,
      },
      min: 1,
      max: 16,
      default: 1,
    },
    load: {
      name: 'Load',
      type: 'action',
      surface: {
        type: 'sysex',
        bytes: [0xF0, 0x7D, 0x21, 0xF7],
        number: 0x21,
      },
    },
  },
}
