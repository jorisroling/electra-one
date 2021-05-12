const { table } = require('table')
const _ = require('lodash')
const yves = require('../lib/yves')
const easymidi = require('easymidi')
const chalk = require('chalk')
const labelColor = chalk.hex('#FF8800')
const config = require('config')

const Midi = require('../lib/midi')

function listPorts(name, sub, options) {

  Midi.setupVirtualPorts(config.list.virtual)

  const midiInputNames = easymidi.getInputs()
  const midiOutputNames = easymidi.getOutputs()

  const data = [
    ['Input','Output']
  ]

  for (let i = 0; i < midiInputNames.length || i < midiOutputNames.length; i++) {
    data.push([i < midiInputNames.length && midiInputNames[i]?labelColor(midiInputNames[i]):'',i < midiOutputNames.length && midiOutputNames[i]?labelColor(midiOutputNames[i]):''])
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