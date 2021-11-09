const { table } = require('table')
const _ = require('lodash')
const yves = require('../lib/yves')
const easymidi = require('easymidi')
const chalk = require('chalk')
const labelColor = chalk.hex('#FF8800')
const dimColor = chalk.hex('#222')
const config = require('config')

const Midi = require('../lib/midi/midi')

function listPorts(name, sub, options) {

  const data = []
  if (options.setup) {
    data.push(['Setup MIDI Input', 'Setup MIDI Output'])

    for (let i = 0; i < _.get(config, 'preset.midi.ports.input', []).length || i < _.get(config, 'preset.midi.ports.output', []).length; i++) {
      const input = _.get(config, `preset.midi.ports.input.${i}.name`)
      const output = _.get(config, `preset.midi.ports.output.${i}.name`)
      data.push([input ? `${dimColor('[')}${labelColor(input)}${dimColor(']')}` : '', output ? `${dimColor('[')}${labelColor(output)}${dimColor(']')}` : ''])
    }
  } else {
    data.push(['MIDI Input', 'MIDI Output'])

    Midi.setupVirtualPorts(config.list.virtual)

    const midiInputNames = easymidi.getInputs()
    const midiOutputNames = easymidi.getOutputs()

    for (let i = 0; i < midiInputNames.length || i < midiOutputNames.length; i++) {
      data.push([i < midiInputNames.length && midiInputNames[i] ? `${dimColor('[')}${labelColor(midiInputNames[i])}${dimColor(']')}` : '', i < midiOutputNames.length && midiOutputNames[i] ? `${dimColor('[')}${labelColor(midiOutputNames[i])}${dimColor(']')}` : ''])
    }
  }

  const output = table(data, {})
  console.log(output)

  process.exit()
}

module.exports = {
  name: 'list',
  description: 'List all ports',
  handler: listPorts,
  examples: [
    {usage:'electra-one list', description:'Lists actual MIDI ports'},
    {usage:'electra-one list --setup', description:'List MIDI ports from setup'},
  ],
  aliases:[]
}