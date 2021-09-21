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

  Midi.setupVirtualPorts(config.list.virtual)

  const midiInputNames = easymidi.getInputs()
  const midiOutputNames = easymidi.getOutputs()

  const data = [
    [`${dimColor('[')}Input${dimColor(']')}`, `${dimColor('[')}Output${dimColor(']')}`]
  ]

  for (let i = 0; i < midiInputNames.length || i < midiOutputNames.length; i++) {
    data.push([i < midiInputNames.length && midiInputNames[i] ? `${dimColor('[')}${labelColor(midiInputNames[i])}${dimColor(']')}` : '', i < midiOutputNames.length && midiOutputNames[i] ? `${dimColor('[')}${labelColor(midiOutputNames[i])}${dimColor(']')}` : ''])
  }

  const output = table(data, {})

  console.log(output)
  process.exit()
}

module.exports = {
  name: 'list',
  description: 'List all ports',
  handler: listPorts,
  aliases:[]
}