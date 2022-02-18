const debug = require('yves').debugger(require('../../package.json').name + ':lib:midi:' + (require('change-case').paramCase(require('path').basename(__filename, '.js'))).replace(/-/g, ':'))

const Interface = require('./interface')
const _ = require('lodash')
const path = require('path')
const untildify = require('untildify')

const yves = require('../yves')
const pkg = require('../../package.json')
const debugMidiNoteOff = yves.debugger(`${pkg.name.replace(/^@/, '')}:midi:note:off`)

const Midi = require('./midi')

class Machine  {

  constructor(name) {
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

    this.interface.on('parameterChange', (path, value, origin) => {
      const parameterSideEffect = _.get(this.parameterSideEffects, path)
      if (typeof parameterSideEffect == 'function') {
        parameterSideEffect(path, value, origin)
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

  getState(path, deflt) {
    return _.get(this.state, path, deflt)
  }

  setState(path, value) {
    _.set(this.state, path, value)
  }

  clearState(path) {
    _.unset(this.state, path)
  }

  setStates(state) {
    //    const {} = state
    this.state = state
  }

}


module.exports = Machine
