const debug = require('yves').debugger(require('../../package.json').name + ':lib:midi:' + (require('change-case').paramCase(require('path').basename(__filename, '.js'))).replace(/-/g, ':'))

const Interface = require('./interface')
const _ = require('lodash')
const path = require('path')
const untildify = require('untildify')

const yves = require('../yves')
const pkg = require('../../package.json')
const debugMidiNoteOff = yves.debugger(`${pkg.name.replace(/^@/, '')}:midi:note:off`)

const Midi = require('./midi')

const EventEmitter = require('events')

class Machine extends EventEmitter  {

  constructor(name) {
    super()
    this.name = name
    this.interface = new Interface(name)
    this.state = {}

    this.parameterEminentSideEffects = {}

    this.interface.on('parameterChangeEminent', (path, value, origin) => {
      const parameterEminentSideEffect = _.get(this.parameterEminentSideEffects, path)
      if (typeof parameterEminentSideEffect == 'function') {
        parameterEminentSideEffect(path, value, origin)
      }
    })

    this.parameterSideEffects = {}

    this.interface.on('parameterChange', (path, value, origin, originalValue) => {
      const parameterSideEffect = _.get(this.parameterSideEffects, path)
      if (typeof parameterSideEffect == 'function') {
        parameterSideEffect(path, value, origin, originalValue)
      }
      if (origin == 'surface') {
        this.writeState()
      }
    })

    this.interface.on('modulationChange', (path, value, reason) => {
      const parameterSideEffect = _.get(this.parameterSideEffects, path)
      if (typeof parameterSideEffect == 'function') {
        parameterSideEffect(path, value, 'surface')
      }
      this.writeState()
    })

    this.actionSideEffects = {}

    this.interface.on('action', (path, origin) => {
      const actionSideEffect = _.get(this.actionSideEffects, path)
      if (typeof actionSideEffect == 'function') {
        actionSideEffect(path, origin)
      }
    })

    this.displayHandlers = {}

    this.interface.on('display', (path, value, origin, callback) => {
      const displayHandler = _.get(this.displayHandlers, path)
      if (typeof displayHandler == 'function') {
        displayHandler(path, value, origin, callback)
      }
    })

  }

  connect(portName, kind, channel = 0, incoming = true, outgoing = true) {
    debug('connect %y as %y (ch %y in %y out %y)', portName, kind, channel + 1, incoming, outgoing)
    this.interface.connect(portName, kind, channel, incoming, outgoing)
  }

  getState(path, deflt, section) {
    let source = this.state
    if (typeof(section) == 'undefined') {
      section = this.interface.getParameter('section')
    }
    if (section > 0) {
      if (this.interface.sections && _.has(this.interface,`sections.${String.fromCharCode(64+section)}.state.${path}`)) {
        source = this.interface.sections[String.fromCharCode(64+section)].state
      }
    }
    let result = _.get(source, path, deflt)
    if (!result && section>0) {
      result = _.get(this.state, path, deflt)
    }
    return result
  }

  setState(path, value, section, emitChanges = true) {
    if (emitChanges) {
      this.emit('stateChangeEminent', path, value)
    }
    let originalValue
    if (emitChanges) {
      const tmp = _.get(this.state)
      originalValue =  (typeof tmp == 'undefined')?tmp:JSON.parse(JSON.stringify(tmp))
    }

    let target = this.state

    if (typeof(section) == 'undefined') {
      section = this.interface.getParameter('section','internal',0)
    }


    if (section > 0) {
      if (typeof _.get(this.interface,`sections.${String.fromCharCode(64+section)}.state`) != 'object') _.set(this.interface,`sections.${String.fromCharCode(64+section)}.state`,{})
      target = this.interface.sections[String.fromCharCode(64+section)].state
    }
    _.set(target, path, value)
    if (emitChanges) {
      this.emit('stateChange', path, value, originalValue)
    }
  }

  clearState(path) {
    _.unset(this.state, path)
  }

  setStates(state) {
    this.state = state
  }

}


module.exports = Machine
