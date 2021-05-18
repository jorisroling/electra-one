const _ = require('lodash')

class MidiCache {
  constructor() {
    this.midiCache = {}
  }

  getValue(portName, channel, controller, deflt) {
    return _.get(this.midiCache, `${portName}.channel.#${_.padStart(channel + 1, 2, '0')}.controller.#${_.padStart(controller, 3, '0')}`, deflt)
  }

  setValue(portName, channel, controller, value) {
    _.set(this.midiCache, `${portName}.channel.#${_.padStart(channel + 1, 2, '0')}.controller.#${_.padStart(controller, 3, '0')}`, value)
  }

  clearValue(portName, channel, controller) {
    _.unset(this.midiCache, `${portName}.channel.#${_.padStart(channel + 1, 2, '0')}.controller.#${_.padStart(controller, 3, '0')}`)
  }
}

module.exports = MidiCache