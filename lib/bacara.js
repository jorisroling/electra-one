const debug = require('yves').debugger(require('../package.json').name + ':lib:' + (require('change-case').paramCase(require('path').basename(__filename, '.js'))).replace(/-/g, ':'))

const EventEmitter = require('events')

const untildify = require('untildify')
const _ = require('lodash')

const fs = require('fs-extra')
const path = require('path')
const jsonfile = require('jsonfile')

const easymidi = require('easymidi')
const Midi = require('./midi/midi')

let presetStateFilePath = path.resolve((process.env.NODE_ENV == 'production') ? untildify('~/.electra-one/state/bacara.preset.json') : `${__dirname}/../state/bacara.preset.json`)

const bacaraEventEmitter = new EventEmitter()
let presetState

class Bacara {
  static event() {
    return bacaraEventEmitter
  }

  static setPresetStateFilename(filePath) {
    debug('setPresetStateFilename %y',filePath)
    presetStateFilePath = path.resolve(filePath)
  }

  static presetState() {
    if (!presetState) {
      presetState = fs.existsSync(presetStateFilePath) ? jsonfile.readFileSync(presetStateFilePath) : {}
    }
    return presetState
  }

  static writePresetState(state) {
    presetState = state
    fs.ensureDirSync(path.dirname(presetStateFilePath))
    jsonfile.writeFileSync(presetStateFilePath, presetState, { flag: 'w', spaces: 2 })
  }

  static presetStateFilename() {
    return presetStateFilePath
  }

  static getPresetState(path,dflt) {
    const bacaraPresetState = Bacara.presetState()
    return _.get(bacaraPresetState,'preset.'+path,dflt)
  }

  static setPresetState(path,value) {
    const bacaraPresetState = Bacara.presetState()
    _.set(bacaraPresetState,'preset.'+path,value)
    Bacara.writePresetState(bacaraPresetState)
  }

  static scanMidiPorts() {

    const shortName = (name) => {
      let prefix = ''
      let midfix = ''
      let suffix = ''
      let ctrl = ''
      if (name.indexOf(' - ') >= 0) {
        const parts = name.split(' - ')
        prefix = parts[0]
        midfix = parts[1]
      } else {
        midfix = name
      }
      const amatch = midfix.match(/\sA\s/i)
      if (amatch) {
        ctrl+=' A'
        midfix = midfix.replace(/\sA\s/i,'')
      }
      const bmatch = midfix.match(/\sB\s/i)
      if (bmatch) {
        ctrl+=' B'
        midfix = midfix.replace(/\sB\s/i,'')
      }
      const cmatch = midfix.match(/\sctrl$/i)
      if (cmatch) {
        ctrl+='.CTRL'
        midfix = midfix.substr(0,midfix.length-4)
      }

      const match = midfix.match(/^(.*[^\d])(\d+)$/)
      if (match) {
        midfix = match[1].trim()
        suffix = match[2]
      } else {
        const match = midfix.match(/^(.*\s)(\w)$/)
        if (match) {
          midfix = match[1].trim()
          suffix = match[2]
        }
      }
      if (prefix) {
        const words = prefix.split(' ')
        prefix = ''
        for (let word of words) {
          prefix += word.substr(0, 1).toUpperCase()
        }
      }
      if (prefix) {
        prefix = prefix.trim() + '.'
      }
      if (midfix) {
        midfix = midfix.trim()
      }
      if (suffix) {
        suffix = '.' + suffix.trim()
      }
      midfix = midfix.substr(0, 14 - (prefix.length + suffix.length)).trim()

      return prefix + midfix + ctrl + suffix
    }

    const ports = {input:[],output:[]}
    const midiOutputNames = easymidi.getOutputs()
    for (let i = 0; i < midiOutputNames.length; i++) {
      const port = {
        name: midiOutputNames[i],
        short: shortName(midiOutputNames[i]),
      }
      const device = Midi.normalisePortName(midiOutputNames[i],false,true)
      if (device) {
        port.device = device
      }
      ports.output.push(port)
    }
    const midiInputNames = easymidi.getInputs()
    for (let i = 0; i < midiInputNames.length; i++) {
      const port = {
        name: midiInputNames[i],
        short: shortName(midiInputNames[i]),
      }
      const device = Midi.normalisePortName(midiInputNames[i],true,true)
      if (device) {
        port.device = device
      }
      ports.input.push(port)
    }


/*    const bacaraPresetState = Bacara.presetState()

    _.set(bacaraPresetState, 'midi.ports', ports)

    Bacara.writePresetState(bacaraPresetState)
*/
    Bacara.setPresetState('midi.ports', ports)
  }
}

module.exports = Bacara
