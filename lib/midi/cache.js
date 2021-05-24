const debug = require('debug')(require('../../package.json').name + ':lib:midi:' + (require('change-case').paramCase(require('path').basename(__filename, '.js'))).replace(/-/g, ':'))

const _ = require('lodash')

class MidiCache {
  constructor() {
    this.midiCache = {}
  }

  getValue(portName, channel, type, number, deflt) {
    return _.get(this.midiCache, `${portName}.channel.#${_.padStart(channel + 1, 2, '0')}.${type.trim().toLowerCase()}.#${_.padStart(number, 3, '0')}`, deflt)
  }

  setValue(portName, channel, type, number, value) {
    _.set(this.midiCache, `${portName}.channel.#${_.padStart(channel + 1, 2, '0')}.${type.trim().toLowerCase()}.#${_.padStart(number, 3, '0')}`, value)
  }

  clearValue(portName, channel, type, number) {
    _.unset(this.midiCache, `${portName}.channel.#${_.padStart(channel + 1, 2, '0')}.${type.trim().toLowerCase()}.#${_.padStart(number, 3, '0')}`)
  }
}

module.exports = MidiCache