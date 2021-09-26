const debug = require('yves').debugger(require('../../package.json').name + ':lib:midi:' + (require('change-case').paramCase(require('path').basename(__filename, '.js'))).replace(/-/g, ':'))

const Interface = require('./interface')
const _ = require('lodash')
const fs = require('fs-extra')
const path = require('path')
const untildify = require('untildify')
const jsonfile = require('jsonfile')

const deepSortObject = require('deep-sort-object')

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

  static getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max + 1))
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

  getPreset() {
    return {
      name:pkg.name,
      version:pkg.version,
      model:this.name,
      lfo:deepSortObject(this.interface.lfo),
      modulation:deepSortObject(this.interface.modulation),
      state:deepSortObject(this.state),
      parameters:deepSortObject(this.interface.getParameters())
    }
  }

  readState(filename) {
    const filePath = filename ? filename : path.resolve( (process.env.NODE_ENV == 'production') ? untildify(`~/.electra-one/state/${this.name}.json`) : `${__dirname}/../../state/${this.name}.json` )
    if (fs.existsSync(filePath)) {
      const json = jsonfile.readFileSync(filePath)

      const state = {}
      const paths = [
        'device.A.portName',
        'device.B.portName',
        'lfo.0.shapeName',
        'lfo.1.shapeName',
        'lfo.2.shapeName',
        'octaves',
        'pattern',
        'playing',
        'size',
        'patternSteps',
        'sounding',
        'virus',
        'remote',
        'drums.pattern',
        'drums.redrum',
      ]
      paths.forEach( path => _.set(state, path, _.get(json.state ? json.state : json, path)) )
      this.setStates(state)
      _.set(this.modulation, 'lfo', _.get(json, 'modulation.lfo', {}))
      _.set(this.modulation, 'matrix', _.get(json, 'modulation.matrix', {}))
      this.interface.setParameters(json.parameters ? json.parameters : json)
    }
  }

  writeState(filename) {
    const filePath = filename ? filename : path.resolve((process.env.NODE_ENV == 'production') ? untildify(`~/.electra-one/state/${this.name}.json`) : `${__dirname}/../../state/${this.name}.json`)
    fs.ensureDirSync(path.dirname(filePath))
    jsonfile.writeFileSync(filePath, this.getPreset(), { flag: 'w', spaces: 2 })
    //      debug('writeState %y',filePath)
  }


  notesReset() {
    ['A', 'B'].forEach( dev => {
      if (this.state.device[dev].portName) {
        const channel = this.interface.getParameter(`device.${dev}.channel`, 0)
        for (let midiNote = 0; midiNote < 128; midiNote++) {
          debugMidiNoteOff('port %y  channel %y  note %y', this.state.device[dev].portName, channel, midiNote)
          Midi.send(this.state.device[dev].portName, 'noteoff', {
            note: midiNote,
            velocity: 127,
            channel: channel,
          })
        }
      }
    })
  }
}


module.exports = Machine
