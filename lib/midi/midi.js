const debug = require('yves').debugger(require('../../package.json').name + ':lib:midi:' + (require('change-case').paramCase(require('path').basename(__filename, '.js'))).replace(/-/g, ':'))
const debugMidi = require('yves').debugger(`${require('../../package.json').name.replace(/^@/, '')}:midi:send`)

const changeCase = require('change-case')
const config = require('config')
const _ = require('lodash')
const os = require('os')

const pkg = require('../../package.json')
const easymidi = require('easymidi')
const escapeRegexString = require('escape-regex-string')

const inputDevices = {}
const outputDevices = {}

const queue = {}
const timeoutIDs = {}

let bacaraVirtualName
let bacaraVirtualInput
let bacaraVirtualOutput

const sendShadowMidiToBacaraPort = true

const MidiCache = require('./cache')
const midiCache = new MidiCache()

const warnings = []

class Midi  {

  static setupVirtualPorts(virtualName) {
    if (virtualName) {
      bacaraVirtualName = virtualName
      const inputPortNames = easymidi.getInputs()
      if (Array.isArray(inputPortNames) && inputPortNames.indexOf(virtualName) < 0) {
        bacaraVirtualOutput = new easymidi.Output(virtualName, true)
      }

      const outputPortNames = easymidi.getOutputs()
      if (Array.isArray(outputPortNames) && outputPortNames.indexOf(virtualName) < 0) {
        bacaraVirtualInput = new easymidi.Input(virtualName, true)
      }
    }
  }

  static normalisePortName(portName, portTypeIsInput, returnEmptyIfNotFound) {
    if (Number.isInteger(portName)) {

      const configPath = `preset.midi.ports.${portTypeIsInput?'in':'out'}put.${portName}`
      const presetMidiPort = _.get(config,configPath)
      if (presetMidiPort) {
        portName = presetMidiPort.device ? presetMidiPort.device : presetMidiPort.name
      } else {

        const midiNames = portTypeIsInput ? easymidi.getInputs() : easymidi.getOutputs()
        if (midiNames) {
          if (portName < midiNames.length) {
            portName = midiNames[portName]
          } else {
            portName = null
          }
        }
      }
    }

    if (portName && !_.get(config, `midi.ports.${portName}`)) {
      for (let p in _.get(config, 'midi.ports', {})) {
        if (_.get(config, `midi.ports.${p}.${portTypeIsInput ? 'in' : 'out'}.${os.platform()}`, _.get(config, `midi.ports.${p}.${os.platform()}`)) == portName) {
          return p
        }
      }
    }
    return returnEmptyIfNotFound ? null : portName
  }

  static pretty(text) {
    return changeCase.capitalCase(text)
  }

  static input(name, match = false, exit = false) {
    const oname = name
    let virtual = false

    if (name) {
      const tmp = _.get(config, `midi.ports.${name.toLowerCase()}.in.${os.platform()}`, _.get(config, `midi.ports.${name.toLowerCase()}.${os.platform()}`))
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
      let inputNamesMatching = midiInputNames.filter( inputName => match ? inputName.match(new RegExp(escapeRegexString(name), 'i')) : (inputName == name) )
      if (inputNamesMatching.length > 1) {
        inputNamesMatching = midiInputNames.filter( inputName => (inputName == name) )
      }
      if (!inputNamesMatching || inputNamesMatching.length != 1) {
        if (exit) {
          debug('existing midiInputNames %y', midiInputNames)
          console.trace(`Oh my, No (unambiguous) input port found with: ${name}`, inputNamesMatching)
          process.exit(1)
        } else {
          const warning = `Input ${name} aka ${oname}`
          if (warnings.indexOf(warning) < 0) {
            warnings.push(warning)
            debug('No input port found matching %y (a.k.a. %y)', name, oname)
          }
          return
        }
      }
      name = inputNamesMatching[0]
    } else {
      name = Midi.pretty(pkg.name)
      virtual = true
    }
    if (!inputDevices[name]) {
      debug('Input %y => %y', oname, name)
      if (name == config.bacara.virtual && bacaraVirtualInput) {
        inputDevices[name] = bacaraVirtualInput
      } else {
        inputDevices[name] = new easymidi.Input(name, virtual)
      }
    }
    return inputDevices[name]
  }


  static output(name, match = false, exit = false) {
    const oname = name
    let virtual = false

    if (name) {
      const tmp = _.get(config, `midi.ports.${name.toLowerCase()}.out.${os.platform()}`, _.get(config, `midi.ports.${name.toLowerCase()}.${os.platform()}`))
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
      //      debug('er %y %y',escapeRegexString(name),match)
      let outputNamesMatching = midiOutputNames.filter( outputName => match ? outputName.match(new RegExp(escapeRegexString(name), 'i')) : (outputName == name) )
      if (outputNamesMatching.length > 1) {
        outputNamesMatching = midiOutputNames.filter( outputName => (outputName == name) )
      }
      if (!outputNamesMatching || outputNamesMatching.length != 1) {
        if (exit) {
          debug('existing midiOutputNames %y', midiOutputNames)
          console.trace(`Oh my, No (unambiguous) output port found with: ${name}`, outputNamesMatching)
          process.exit(1)
        } else {
          const warning = `Output ${name} aka ${oname}`
          if (warnings.indexOf(warning) < 0) {
            warnings.push(warning)
            debug('No output port found matching %y (a.k.a %y)', name, oname)
          }
          return
        }
      }
      name = outputNamesMatching[0]
    } else {
      name = Midi.pretty(pkg.name)
      virtual = true
    }
    if (!outputDevices[name]) {
      debug('Output %y => %y', oname, name)
      if (name == config.bacara.virtual && bacaraVirtualOutput) {
        outputDevices[name] = bacaraVirtualOutput
      } else {
        outputDevices[name] = new easymidi.Output(name, virtual)
      }
    }
    return outputDevices[name]
  }


  static send(portName, type, options, label = null, timeout = 0) {
    if (!portName || !type || !options) {
      debug('Invalid MIDI send: portName: %y type: %y options: %y',portName,type,options)
      return
    }
    portName = this.normalisePortName(portName)
    //    debug('. %y',options.valueMsb)
    if (portName == this.normalisePortName(bacaraVirtualName) && ['noteon', 'noteoff', 'cc'].indexOf(type) < 0) {
      return
    }

    const cacheChangeDetection = false
    function sendDeduped(portName, type, options) {
      if (cacheChangeDetection) {
        if (type === 'cc') {
          if (midiCache.getValue(portName, options.channel, 'cc', options.controller) === options.value ) {
            debug('NO CACHE CHANGE, NOT SEND %y %y', type, options)
            return
          }
        } else if (type === 'nrpn') {
          const msb = Object.prototype.hasOwnProperty.call(options, 'msb') ? options.msb : ((options.number >> 7) & 0x7F)
          const lsb = Object.prototype.hasOwnProperty.call(options, 'lsb') ? options.lsb : ((options.number >> 0) & 0x7F)
          const valueMsb = Object.prototype.hasOwnProperty.call(options, 'valueMsb') ? options.valueMsb : ((options.value >> 7) & 0x7F)
          const valueLsb = Object.prototype.hasOwnProperty.call(options, 'valueLsb') ? options.valueLsb : ((options.value >> 0) & 0x7F)
          if (midiCache.getValue(portName, options.channel, 'nrpn', (msb << 7) | (lsb & 0x7F)) === (valueMsb << 7) | (valueLsb & 0x7F) ) {
            debug('NO CACHE CHANGE, NOT SEND %y %y', type, options)
            return
          }
        } else if (type === 'program') {
          if (midiCache.getMessageValue({_type:type, ...options}) === options.value ) {

            debug('NO CACHE CHANGE, NOT SEND %y %y', type, options)
          } else {
            debug('CACHE CHANGE  (%y), SEND %y %y', midiCache.getMessageValue({_type:type, ...options}), type, options)

          }
        }
      }
      const midiOutput = Midi.output(portName)
      if (midiOutput) {
        if (type == 'nrpn') {
          const msb = Object.prototype.hasOwnProperty.call(options, 'msb') ? options.msb : ((options.number >> 7) & 0x7F)
          const lsb = Object.prototype.hasOwnProperty.call(options, 'lsb') ? options.lsb : ((options.number >> 0) & 0x7F)
          const valueMsb = Object.prototype.hasOwnProperty.call(options, 'valueMsb') ? options.valueMsb : ((options.value >> 7) & 0x7F)
          const valueLsb = Object.prototype.hasOwnProperty.call(options, 'valueLsb') ? options.valueLsb : ((options.value >> 0) & 0x7F)
          if (options.lsbFirst) {
            //lsbFirst= true  : 99 98 38 6 101 100
            midiOutput.send('cc', {channel:options.channel, controller:99, value:msb })
            midiOutput.send('cc', {channel:options.channel, controller:98, value:lsb})
            midiOutput.send('cc', {channel:options.channel, controller:38, value: valueMsb})
            midiOutput.send('cc', {channel:options.channel, controller:6, value: valueLsb})
          } else {
            //lsbFirst= false : 99 98 6 38 101 100
            midiOutput.send('cc', {channel:options.channel, controller:99, value:msb })
            midiOutput.send('cc', {channel:options.channel, controller:98, value:lsb})
            midiOutput.send('cc', {channel:options.channel, controller:6, value: valueMsb})
            midiOutput.send('cc', {channel:options.channel, controller:38, value: valueLsb})
          }

          midiCache.setValue(portName, options.channel, 'nrpn', ((msb << 7) | (lsb & 0x7F)), (valueMsb << 7) | (valueLsb & 0x7F) )
        } else {
          midiOutput.send(type, options)
          midiCache.setMessageValue({_type:type, ...options})
          if (type === 'cc') {
            //            midiCache.setValue(portName, options.channel, 'cc', options.controller, options.value)
          }
          //debugMidi('%y %y %y', portName, type, options)
        }
      }
    }

    if (type != 'sysex' && !label && !timeout) {
      sendDeduped(portName, type, options)
      if (sendShadowMidiToBacaraPort && options.sendShadowMidiToBacaraPort && portName != this.normalisePortName(bacaraVirtualName) && (type == 'noteon' || type == 'noteoff' || type == 'cc')) {
        options.channel = options.shadowChannel
        delete options.sendShadowMidiToBacaraPort
        delete options.shadowChannel
        debugMidi('shadow %s port %s  options %y    ', type, bacaraVirtualName, options)
        Midi.send(bacaraVirtualName, type, options, label = null, timeout = 0)
      }
    } else {
      if (!queue[portName]) {
        queue[portName] = []
      }
      if (label) { // check earlier messages with this label
        let found = false
        queue[portName].forEach( msg => {
          if (msg.type === type && msg.label === label) {
            msg.options = options
            found = true
          }
        })
        if (!found) {
          queue[portName].push({type, options, label, timeout})
        }
      } else {
        queue[portName].push({type, options, label, timeout})
      }

      const worker = (portName, timeout) => {
        if (queue[portName].length) {
          const msg = queue[portName].shift()
          if (msg.timeout) {
            timeout = msg.timeout
          }
          if (msg) {
            sendDeduped(portName, msg.type, msg.options)
          }
        }
        timeoutIDs[portName] = queue[portName].length ? setTimeout(worker, timeout, portName) : null
      }

      if (!timeoutIDs[portName]) {
        timeoutIDs[portName] = setTimeout( worker, timeout, portName, 200)
      }
    }
  }
}


module.exports = Midi
