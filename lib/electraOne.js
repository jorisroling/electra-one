const config = require('config')
const _ = require('lodash')
const os = require('os')

const pkg = require('../package.json')
const easymidi = require('easymidi')
const escapeRegexString = require('escape-regex-string')

const inputDevices = {}
const outputDevices = {}

class ElectraOne  {
  static input(name, match = false) {
    let virtual = false

    if (name) {
      const tmp = _.get(config,`midi.ports.${name.toLowerCase()}.${os.platform()}`,name)
      if (tmp) {
        match = false
        name = tmp
      }
    }
    if (inputDevices[name]) return inputDevices[name]

    if (name) {
      const midiInputNames = easymidi.getInputs()
      let inputNamesMatching = midiInputNames.filter( inputName => match ? inputName.match(escapeRegexString(name)) : (inputName == name) )
      if (inputNamesMatching.length > 1) inputNamesMatching = midiInputNames.filter( inputName => (inputName == name) )
      if (!inputNamesMatching || inputNamesMatching.length != 1) {
        debug(midiInputNames)
        console.error(`No (unambiguous) input port found with: ${name}`,inputNamesMatching)
        process.exit(1)
      }
      name = inputNamesMatching[0]
    } else {
      name = ElectraOne.pretty(pkg.name)
      virtual = true
    }
    if (!inputDevices[name]) {
      debug('Input: %y',name,match)
      inputDevices[name] = new easymidi.Input(name, virtual)
    }
    return inputDevices[name]
  }
  static output(name, match = false) {
    let virtual = false

    if (name) {
      const tmp = _.get(config,`midi.ports.${name.toLowerCase()}.${os.platform()}`,name)
      if (tmp) {
        match = false
        name = tmp
      }
    }
    if (outputDevices[name]) return outputDevices[name]

    if (name) {
      const midiOutputNames = easymidi.getOutputs()
      let outputNamesMatching = midiOutputNames.filter( outputName => match ? outputName.match(escapeRegexString(name)) : (outputName == name) )
      if (outputNamesMatching.length > 1) outputNamesMatching = midiOutputNames.filter( outputName => (outputName == name) )
      if (!outputNamesMatching || outputNamesMatching.length != 1) {
        debug(midiOutputNames)
        console.error(`No (unambiguous) output port found with: ${name}`,outputNamesMatching)
        process.exit(1)
      }
      name = outputNamesMatching[0]
    } else {
      name = ElectraOne.pretty(pkg.name)
      virtual = true
    }
    if (!outputDevices[name]) {
      debug('Output: %y',name,match)
      outputDevices[name] = new easymidi.Output(name, virtual)
    }
    return outputDevices[name]
  }

}

module.exports = ElectraOne