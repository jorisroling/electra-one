const { table } = require('table')
const _ = require('lodash')
const yves = require('../lib/yves')
const easymidi = require('easymidi')
const chalk = require('chalk')
const labelColor = chalk.hex('#FF8800')

function listPorts(name, sub, options) {

  const midiInputNames = easymidi.getInputs()
  const midiOutputNames = easymidi.getOutputs()

  const data = [
    ['Input','Output']
  ]

  for (let i = 0; i < midiInputNames.length; i++) {
    data.push([labelColor(midiInputNames[i]),labelColor(midiOutputNames[i])])
  }

  const output = table(data, {})

  console.log(output)
}

module.exports = {
  name: 'list',
  description: 'List all ports',
  handler: listPorts,
  aliases:[]
}