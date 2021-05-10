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

const midiCache = {}

class Midi  {

  static pretty(text) {
    return changeCase.capitalCase(text)
  }

  static input(name, match = false, exit = true) {
    const oname = name
    let virtual = false

    if (name) {
      const tmp = _.get(config,`midi.ports.${name.toLowerCase()}.${os.platform()}`)
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
      let inputNamesMatching = midiInputNames.filter( inputName => match ? inputName.match(new RegExp(escapeRegexString(name),'i')) : (inputName == name) )
      if (inputNamesMatching.length > 1) {
        inputNamesMatching = midiInputNames.filter( inputName => (inputName == name) )
      }
      if (!inputNamesMatching || inputNamesMatching.length != 1) {
        debug(midiInputNames)
        console.error(`Oh my, No (unambiguous) input port found with: ${name}`,inputNamesMatching)
        if (exit) {
          process.exit(1)
        } else {
          return
        }
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


  static output(name, match = false, exit = true) {
    const oname = name
    let virtual = false
    //      debug('er %y %y',name,match)
    //    console.trace('JJR')

    if (name) {
      const tmp = _.get(config,`midi.ports.${name.toLowerCase()}.${os.platform()}`)
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
      let outputNamesMatching = midiOutputNames.filter( outputName => match ? outputName.match(new RegExp(escapeRegexString(name),'i')) : (outputName == name) )
      if (outputNamesMatching.length > 1) {
        outputNamesMatching = midiOutputNames.filter( outputName => (outputName == name) )
      }
      if (!outputNamesMatching || outputNamesMatching.length != 1) {
        debug(midiOutputNames)
        console.error(`Oh my, No (unambiguous) output port found with: ${name}`,outputNamesMatching)
        if (exit) {
          process.exit(1)
        } else {
          return
        }
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


  static send(name,type,options,label = null, timeout = 0) {
    //    debug('. %y',options.valueMsb)
    if (!name || !type || !options) {
      return
    }

    function sendDeduped(name,type,options) {
      if (type === 'cc') {
        if (_.get(midiCache,`${name}.channel.${options.channel}.cc.${options.controller}`) === options.value) {
          /*          debug('dupe CC! %y %y %y',name,type,options)*/
          return
        }
      } else if (type === 'nrpn') {
        if (_.get(midiCache,`${name}.channel.${options.channel}.nrpn.${(options.msb << 7) | (options.lsb & 0x7F)}`) === (options.valueMsb << 7) | (options.valueLsb & 0x7F) ) {
          /*          debug('dupe NRPN! %y %y %y',name,type,options)*/
          return
        }
      }
      const midiOutput = Midi.output(name)
      if (midiOutput) {
        if (type == 'nrpn') {
          midiOutput.send('cc',{channel:options.channel,controller:99,value:options.msb})
          midiOutput.send('cc',{channel:options.channel,controller:98,value:options.lsb})
          midiOutput.send('cc',{channel:options.channel,controller:38,value: options.valueMsb})
          midiOutput.send('cc',{channel:options.channel,controller:6,value: options.valueLsb})
          _.set(midiCache,`${name}.channel.${options.channel}.nrpn.${(options.msb << 7) | (options.lsb & 0x7F)}`,(options.valueMsb << 7) | (options.valueLsb & 0x7F) )
        } else {
          midiOutput.send(type,options)
          if (type === 'cc') {
            _.set(midiCache,`${name}.channel.${options.channel}.cc.${options.controller}`,options.value)
          }
        }
      }
    }

    if (type != 'sysex' && !label && !timeout) {
      sendDeduped(name,type,options)
      return
    }

    if (!queue[name]) {
      queue[name] = []
    }
    if (label) { // check earlier messages with this label
      let found = false
      queue[name].forEach( msg => {
        if (msg.type === type && msg.label === label) {
          msg.options = options
          found = true
        }
      })
      if (!found) {
        queue[name].push({type,options,label,timeout})
      }
    } else {
      queue[name].push({type,options,label,timeout})
    }

    const worker = (name, timeout) => {
      if (queue[name].length) {
        const msg = queue[name].shift()
        if (msg.timeout) {
          timeout = msg.timeout
        }
        if (msg) {
          sendDeduped(name,msg.type,msg.options)
        }
      }
      timeoutIDs[name] = queue[name].length ? setTimeout(worker,timeout,name) : null
    }

    if (!timeoutIDs[name]) {
      timeoutIDs[name] = setTimeout( worker,timeout,name,200)
    }


  }

}


module.exports = Midi