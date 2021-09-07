const debug = require('yves').debugger(require('../package.json').name + ':lib:' + (require('change-case').paramCase(require('path').basename(__filename, '.js'))).replace(/-/g, ':'))
const _ = require('lodash')
const Midi = require('./midi/midi')

const cache = {}

const Electra = {

  controlReflect(portName,ctrlId,options) {
    const was = _.get(cache,`${portName}.ctrl_id_${ctrlId}`)
    if (!_.isEqual(options, was)) {
      _.set(cache,`${portName}.ctrl_id_${ctrlId}`,options)
      const bytes = [0xF0, 0x00, 0x21, 0x45, 0x14, 0x07, ctrlId & 0x7F, ctrlId >> 7]
      const str = JSON.stringify(options)
      for (let n = 0, l = str.length; n < l; n++) {
        bytes.push(Number(str.charCodeAt(n)))
      }
      bytes.push(0xF7)

      Midi.send(portName, 'sysex', bytes)
    }
  },


  parseSysexCmdPatchResponseResponse(portName,bytes) {
    const data = bytes.slice(6, bytes.length - 1).reduce((a, c) => a + String.fromCharCode(parseInt(c)), '')
    const match = data.match(/,"name"\s*:\s*"([^"]*)",/)
    if (match && match.length && match[1]) {
      _.set(cache,`${portName}.preset`,match[1].trim())
      debug('Preset Loaded on port %y  preset %y', portName, _.get(cache,`${portName}.preset`))
    }
  },

  parseSysexCmdPresetNameResponse(portName,bytes) {
    let json
    try {
      const data = bytes.slice(6, bytes.length - 1).reduce((a, c) => a + String.fromCharCode(parseInt(c)), '')
      json = JSON.parse(data)
    } catch (e) {
      console.error(e)
    }
    if (json && json.preset) {
      _.set(cache,`${portName}.preset`,json.preset.trim())
      debug('Preset Loaded on port %y  preset %y', portName, _.get(cache,`${portName}.preset`))
    }
  },

  presetEquals(portName, testName) {
    return (_.get(cache,`${portName}.preset`,'').toLowerCase() === testName.toLowerCase())
  }

}

module.exports = Electra