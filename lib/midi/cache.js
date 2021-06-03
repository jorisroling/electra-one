const debug = require('debug')(require('../../package.json').name + ':lib:midi:' + (require('change-case').paramCase(require('path').basename(__filename, '.js'))).replace(/-/g, ':'))

const _ = require('lodash')

class MidiCache {
  constructor(portName) {
    this.portName = portName
    this.midiCache = {}
  }

  getValue(portName, channel, type, number, deflt) {
    if (!portName) {
      portName = this.portName
    }
    return _.get(this.midiCache, `${portName}.channel.#${_.padStart(channel + 1, 2, '0')}.${type.trim().toLowerCase()}.#${_.padStart(number, 3, '0')}`, deflt)
  }

  getPathValue(portName, path, deflt) {
    if (!portName) {
      portName = this.portName
    }
    return _.get(this.midiCache, `${portName}.${path}`, deflt)
  }

  setValue(portName, channel, type, number, value) {
    if (!portName) {
      portName = this.portName
    }
    const channelPart = Number.isInteger(channel) ? `.channel.#${_.padStart(channel + 1, 2, '0')}` : ''
    _.set(this.midiCache, `${portName}${channelPart}.${type.trim().toLowerCase()}.#${_.padStart(number, 3, '0')}`, value)
  }

  setMessageValue(msg,portName = null) {
    if (!portName) {
      portName = this.portName
    }
    const {path, value} = this.getPathAndValue(portName, msg)
    if (path) {
      if (value === null) {
        _.unset(this.midiCache, path)
      } else {
        _.set(this.midiCache, path, value)
      }
    }
  }

  getMessageValue(msg,portName = null) {
    if (!portName) {
      portName = this.portName
    }
    const {path, value} = this.getPathAndValue(portName, msg)
    if (path) {
      return _.get(this.midiCache, path)
    }
  }

  getPathAndValue(portName, msg) {
    if (!portName) {
      portName = this.portName
    }
    switch (msg._type) {
    case 'noteon':
      return {
        path: `${portName}.channel.#${_.padStart(msg.channel + 1, 2, '0')}.note.#${_.padStart(msg.note, 3, '0')}`,
        value: msg.velocity
      }
    case 'noteoff':
      return {
        path: `${portName}.channel.#${_.padStart(msg.channel + 1, 2, '0')}.note.#${_.padStart(msg.note, 3, '0')}`,
        value: null
      }
    case 'poly aftertouch':
      return {
        path: `${portName}.channel.#${_.padStart(msg.channel + 1, 2, '0')}.${msg._type}.#${_.padStart(msg.note, 3, '0')}`,
        value: msg.velocity
      }
    case 'cc':
      return {
        path: `${portName}.channel.#${_.padStart(msg.channel + 1, 2, '0')}.${msg._type}.#${_.padStart(msg.controller, 3, '0')}`,
        value: msg.value
      }
    case 'program':
      return {
        path: `${portName}.channel.#${_.padStart(msg.channel + 1, 2, '0')}.${msg._type}}`,
        value: msg.number
      }
    case 'channel aftertouch':
      return {
        path: `${portName}.channel.#${_.padStart(msg.channel + 1, 2, '0')}.${msg._type}}`,
        value: msg.pressure
      }
    case 'pitch':
      return {
        path: `${portName}.channel.#${_.padStart(msg.channel + 1, 2, '0')}.${msg._type}}`,
        value: msg.value
      }
    case 'position':
      return {
        path: `${portName}.${msg._type}}`,
        value: msg.value
      }
    case 'mtc':
      return {
        path: `${portName}.channel.#${_.padStart(msg.channel + 1, 2, '0')}.${msg._type}}.#${msg.type}`,
        value: msg.value
      }
    case 'select':
      return {
        path: `${portName}.${msg._type}}`,
        value: msg.song
      }
    }
    return {}
  }

  clearValue(portName, channel, type, number) {
    if (!portName) {
      portName = this.portName
    }
    _.unset(this.midiCache, `${portName}.channel.#${_.padStart(channel + 1, 2, '0')}.${type.trim().toLowerCase()}.#${_.padStart(number, 3, '0')}`)
  }

  clearPathValue(portName, path) {
    if (!portName) {
      portName = this.portName
    }
    _.unset(this.midiCache, `${portName}.${path}`)
  }

  playingNotes(channel) {
    const notes = this.getPathValue(null, `channel.#${_.padStart((channel ? channel : 0) + 1, 2, '0')}.note`, {})
    return Object.keys(notes).map (note => parseInt(note.substr(1)) )
  }

}

module.exports = MidiCache