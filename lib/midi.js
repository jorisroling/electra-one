const changeCase = require('change-case')
const config = require('config')
const _ = require('lodash')
const os = require('os')

const pkg = require('../package.json')
const easymidi = require('easymidi')
const escapeRegexString = require('escape-regex-string')

const inputDevices = {}
const outputDevices = {}

const queue = {}
const timeoutIDs = {}

class Midi  {

  static pretty(text) {
    return changeCase.capitalCase(text)
  }

  static input(name, match = false) {
    const oname = name
    let virtual = false

    if (name) {
      const tmp = _.get(config,`midi.ports.${name.toLowerCase()}.${os.platform()}`,name)
      if (tmp) {
        match = false
        name = tmp
      }
    }
    if (inputDevices[name]) {
      return inputDevices[name]
    }

    if (name) {
      const midiInputNames = easymidi.getInputs()
      let inputNamesMatching = midiInputNames.filter( inputName => match ? inputName.match(escapeRegexString(name)) : (inputName == name) )
      if (inputNamesMatching.length > 1) {
        inputNamesMatching = midiInputNames.filter( inputName => (inputName == name) )
      }
      if (!inputNamesMatching || inputNamesMatching.length != 1) {
        debug(midiInputNames)
        console.error(`No (unambiguous) input port found with: ${name}`,inputNamesMatching)
        process.exit(1)
      }
      name = inputNamesMatching[0]
    } else {
      name = Midi.pretty(pkg.name)
      virtual = true
    }
    if (!inputDevices[name]) {
      debug('Input %y => %y',oname,name)
      inputDevices[name] = new easymidi.Input(name, virtual)
    }
    return inputDevices[name]
  }


  static output(name, match = false) {
    const oname = name
    let virtual = false

    if (name) {
      const tmp = _.get(config,`midi.ports.${name.toLowerCase()}.${os.platform()}`,name)
      if (tmp) {
        match = false
        name = tmp
      }
    }
    if (outputDevices[name]) {
      return outputDevices[name]
    }

    if (name) {
      const midiOutputNames = easymidi.getOutputs()
      let outputNamesMatching = midiOutputNames.filter( outputName => match ? outputName.match(escapeRegexString(name)) : (outputName == name) )
      if (outputNamesMatching.length > 1) {
        outputNamesMatching = midiOutputNames.filter( outputName => (outputName == name) )
      }
      if (!outputNamesMatching || outputNamesMatching.length != 1) {
        debug(midiOutputNames)
        console.error(`No (unambiguous) output port found with: ${name}`,outputNamesMatching)
        process.exit(1)
      }
      name = outputNamesMatching[0]
    } else {
      name = Midi.pretty(pkg.name)
      virtual = true
    }
    if (!outputDevices[name]) {
      debug('Output %y => %y',oname,name)
      outputDevices[name] = new easymidi.Output(name, virtual)
    }
    return outputDevices[name]
  }


  static send(name,type,options,label = null, timeout = 200) {
    if (!name || !type || !options) {
      return
    }
    if (type != 'sysex') {
      const midiOutput = Midi.output(name)
      if (midiOutput) {
        midiOutput.send(type,options)
      }
      return
    }
    if (!queue[name]) {
      queue[name] = []
    }
    if (label) { // clear earlier messages with this label
      queue[name] = queue[name].filter( msg => msg.label !== label )
    }
    queue[name].push({type,options,label,timeout})

    const worker = (name) => {
      let timeout = 200
      if (queue[name].length) {
        const midiOutput = Midi.output(name)
        if (midiOutput) {
          const msg = queue[name].shift()
          if (msg.timeout) timeout = msg.timeout
          if (msg) {
            midiOutput.send(msg.type,msg.options)
            debug('SEND label %y timeout %y',label,timeout)
          }
        }
      }
      timeoutIDs[name] = queue[name].length ? setTimeout(worker,timeout,name) : null
    }

    if (!timeoutIDs[name]) {
      timeoutIDs[name] = setTimeout( worker,timeout,name)
    }


  }

}


module.exports = Midi