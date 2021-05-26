const debug = require('debug')(require('../package.json').name + ':command:' + require('path').basename(__filename, '.js'))

const yves = require('../lib/yves')
const pkg = require('../package.json')
const debugMidi = yves.debugger(`${pkg.name.replace(/^@/, '')}:midi`)
const debugMidiNoteOn = yves.debugger(`${pkg.name.replace(/^@/, '')}:midi:note:on`)
const debugMidiNoteOff = yves.debugger(`${pkg.name.replace(/^@/, '')}:midi:note:off`)
const debugMidiControlChange = yves.debugger(`${pkg.name.replace(/^@/, '')}:midi:control:change`)
const debugMidiProgramChange = yves.debugger(`${pkg.name.replace(/^@/, '')}:midi:program:change`)

const os = require('os')
const deepEqual = require('deep-equal')

const easymidi = require('easymidi')

const Acid = require('../lib/acid')

const Midi = require('../lib/midi/midi')




const _ = require('lodash')
const config = require('config')
const fs = require('fs-extra')
const path = require('path')
const untildify = require('untildify')
const jsonfile = require('jsonfile')
const chalk = require('chalk')

const getRandomInt = (max) => Math.floor(Math.random() * Math.floor(max + 1))

const euclideanRhythms = require('euclidean-rhythms')

const scaleMappings = require('../extra/scales/scales.json')

const { knownDeviceCCs } = require('../lib/devices')
const deviceCCs = knownDeviceCCs()

const performanceMap = {}
_.get(deviceCCs, 'bacara-acid', []).forEach((name, idx) => {
  if (name) {
    performanceMap[idx] = name
  }
})

//debug('performanceMap %y',performanceMap)


const shapes = ['sine', 'triangle', 'saw-up', 'saw-down', 'square', 'random']
const phaseDetection = true


function difference(object, base) {
  return _.transform(object, (result, value, key) => {
    if (!_.isEqual(value, base[key])) {
      result[key] = _.isObject(value) && _.isObject(base[key]) ? difference(value, base[key]) : value
    }
  })
}

let output
const deviceChannels = {  // 1-based channels
  A: 1,
  B: 2,
}

let midiInputName
let midiOutputName

let pulses = 0
let steps = 0

let time
let pulseDuration = 0

let writeState = true

let state
const midiCache = {}

const matrixSetSlotValueTimout = 10
const matrixSlotSources = {
  off: 0,
  modWheel: 1,
  velocity: 2,
  channelAftertouch: 3,
}

const lfoHistory = [[], [], []]
class State {
  constructor() {
    this.values = {}

    this.values.playing = false
    this.values.pattern = null
    this.values.last_pattern_but = 0
    this.values.last_preset_but = 0

    this.values.size = 16

    this.reset_preset(false)
    this.read()
    this.sendProgramChange('A')
    this.sendProgramChange('B')

    if (!this.values.pattern) {
      this.values.pattern = Acid.generate(this)
    }
  }

  reset_preset(write = true) {
    this.values.temperature = 1.0
    this.values.transpose = 0
    this.values.gate = 1.0
    this.values.octaveChance = 0
    this.values.octaves = []
    this.values.density = 100
    this.values.probability = 100
    this.values.sounding = []
    this.values.killSteps = 0
    this.values.killShift = 0
    this.values.scales = 0
    this.values.base = 0
    this.values.shift = 0
    this.values.split = 127
    this.values.deviate = 0
    this.values.bank = 0
    this.values.program = 0
    this.values.mute = 0
    this.values.lfo = [
      {
        device: {
          A: 0,
          B: 0,
        },
        control: 0,
        shape: 0,
        shapeName: 'sine',
        rate: 64,
        phase: 0,
        amount: 100,
        offset: 50,
        density: 0,
      },
      {
        device: {
          A: 0,
          B: 0,
        },
        control: 0,
        shape: 0,
        shapeName: 'sine',
        rate: 64,
        phase: 0,
        amount: 100,
        offset: 50,
        density: 0,
      },
      {
        device: {
          A: 0,
          B: 0,
        },
        control: 0,
        shape: 0,
        shapeName: 'sine',
        rate: 64,
        phase: 0,
        amount: 100,
        offset: 50,
        density: 0,
      }
    ]
    this.values.device = {
      A: {
        device: 0,
        mute: 0,
        port: 0,
        portName: null,
        channel: 1,
        bank: 0,
        program: 0,
      },
      B: {
        device: 0,
        mute: 0,
        port: 0,
        portName: null,
        channel: 1,
        bank: 0,
        program: 0,
      },
    }
    this.values.matrix = {
      slot: [
        {
          source: 0,
          value: 0,
          slewLimiter: 0,
          destination: [
            {
              target: 0,
              amount: 0,
            },
            {
              target: 0,
              amount: 0,
            },
            {
              target: 0,
              amount: 0,
            },
          ],
        },
        {
          source: 0,
          value: 0,
          slewLimiter: 0,
          destination: [
            {
              target: 0,
              amount: 0,
            },
            {
              target: 0,
              amount: 0,
            },
            {
              target: 0,
              amount: 0,
            },
          ],
        },
        {
          source: 0,
          value: 0,
          slewLimiter: 0,
          destination: [
            {
              target: 0,
              amount: 0,
            },
            {
              target: 0,
              amount: 0,
            },
            {
              target: 0,
              amount: 0,
            },
          ],
        },
      ],
    }

    this.modulation = null
    this.genOctaves(this.octaveChance)
    this.genSounding(this.density)
    if (write) {
      this.write()
    }
  }

  get playing() {
    return this.values.playing
  }
  set playing(value) {
    if (!deepEqual(this.values.playing, value, {strict:true})) {
      this.values.playing = value
      this.write()
    }
  }

  get pattern() {
    return this.values.pattern
  }
  set pattern(value) {
    if (!deepEqual(this.values.pattern, value, {strict:true})) {
      this.values.pattern = value
      this.write()
    }
  }

  get last_pattern_but() {
    return this.values.last_pattern_but
  }
  set last_pattern_but(value) {
    if (!deepEqual(this.values.last_pattern_but, value, {strict:true})) {
      this.values.last_pattern_but = value
      this.write()
    }
  }

  get last_preset_but() {
    return this.values.last_preset_but
  }
  set last_preset_but(value) {
    if (!deepEqual(this.values.last_preset_but, value, {strict:true})) {
      this.values.last_preset_but = value
      this.write()
    }
  }

  get size() {
    return this.values.size
  }
  set size(value) {
    if (!deepEqual(this.values.size, value, {strict:true})) {
      this.values.size = value
      this.write()
    }
  }

  get temperature() {
    return this.values.temperature
  }
  set temperature(value) {
    if (!deepEqual(this.values.temperature, value, {strict:true})) {
      this.values.temperature = value
      this.write()
    }
  }

  get transpose() {
    return this.modulate('transpose')
  }
  set transpose(value) {
    if (!deepEqual(this.values.transpose, value, {strict:true})) {
      this.values.transpose = value
      this.write()
    }
  }

  get gate() {
    return this.modulate('gate')
  }
  set gate(value) {
    if (!deepEqual(this.values.gate, value, {strict:true})) {
      this.values.gate = value
      this.write()
    }
  }

  get octaveChance() {
    return this.modulate('octaveChance')
  }
  set octaveChance(value) {
    if (!deepEqual(this.values.octaveChance, value, {strict:true})) {
      this.values.octaveChance = value
      this.genOctaves(this.octaveChance)
      this.write()
    }
  }

  get octaves() {
    return this.values.octaves
  }
  set octaves(value) {
    if (!deepEqual(this.values.octaves, value, {strict:true})) {
      this.values.octaves = value
      this.write()
    }
  }

  get density() {
    return this.modulate('density')
  }
  set density(value) {
    if (!deepEqual(this.values.density, value, {strict:true})) {
      this.values.density = value
      this.genSounding(this.density)
      this.write()
    }
  }

  get probability() {
    return this.modulate('probability')
  }
  set probability(value) {
    if (!deepEqual(this.values.probability, value, {strict:true})) {
      this.values.probability = value
      this.write()
    }
  }

  get sounding() {
    return this.values.sounding
  }
  set sounding(value) {
    if (!deepEqual(this.values.sounding, value, {strict:true})) {
      this.values.sounding = value
      this.write()
    }
  }

  get killSteps() {
    return this.modulate('killSteps')
  }
  set killSteps(value) {
    if (!deepEqual(this.values.killSteps, value, {strict:true})) {
      this.values.killSteps = value
      this.euclidian(this.killSteps, 16, this.killShift)
      this.write()
    }
  }

  get killShift() {
    return this.modulate('killShift')
  }
  set killShift(value) {
    if (!deepEqual(this.values.killShift, value, {strict:true})) {
      this.values.killShift = value
      this.euclidian(this.killSteps, 16, this.killShift)
      this.write()
    }
  }

  get scales() {
    return this.modulate('scales')
  }
  set scales(value) {
    if (!deepEqual(this.values.scales, value, {strict:true})) {
      this.values.scales = value
      this.write()
    }
  }

  get base() {
    return this.modulate('base')
  }
  set base(value) {
    if (!deepEqual(this.values.base, value, {strict:true})) {
      this.values.base = value
      this.write()
    }
  }

  get shift() {
    return this.modulate('shift')
  }
  set shift(value) {
    if (!deepEqual(this.values.shift, value, {strict:true})) {
      this.values.shift = value
      this.write()
    }
  }

  get split() {
    return this.modulate('split')
  }
  set split(value) {
    if (!deepEqual(this.values.split, value, {strict:true})) {
      this.values.split = value
      this.write()
    }
  }

  get deviate() {
    return this.modulate('deviate')
  }
  set deviate(value) {
    if (!deepEqual(this.values.deviate, value, {strict:true})) {
      this.values.deviate = value
      this.write()
    }
  }

  get bank() {
    return this.values.bank
  }
  set bank(value) {
    if (!deepEqual(this.values.bank, value, {strict:true})) {
      this.values.bank = value
      this.write()
    }
  }

  get program() {
    return this.values.program
  }
  set program(value) {
    if (!deepEqual(this.values.program, value, {strict:true})) {
      this.values.program = value
      this.write()
    }
  }

  get mute() {
    return this.values.mute
  }
  set mute(value) {
    if (!deepEqual(this.values.mute, value, {strict:true})) {
      this.values.mute = value
      this.write()
    }
  }

  get lfo() {
    return this.values.lfo
  }
  set lfo(value) {
    if (!deepEqual(this.values.lfo, value, {strict:true})) {
      this.values.lfo = value
      this.write()
    }
  }

  get device() {
    return this.values.device
  }
  set device(value) {
    if (!deepEqual(this.values.device, value, {strict:true})) {
      this.values.device = value
      this.write()
    }
  }

  get matrix() {
    return this.values.matrix
  }
  set matrix(value) {
    if (!deepEqual(this.values.matrix, value, {strict:true})) {
      this.values.matrix = value
      this.write()
    }
  }

  matrixTargetCount(cc) {
    let result = 0
    this.matrix.slot.forEach( (slot, slotIdx) => {
      if (slot.source > 0) {
        _.get(slot, 'destination', []).forEach( (destination, destIdx) => {
          if (destination && destination.target == cc && destination.amount) {
            result++
          }
        })
      }
    })
    return result
  }

  modulate(path) {
    const value = _.get(this.values, path)
    let result = value

    const modFactor = _.get(this.modulation, path)
    if (modFactor) {
      if (modFactor > 0) {
        result = value + Math.round((_.get(config.acid.interface, `${path}.max`) - value) * modFactor)
      } else {
        result = value + Math.round((value - _.get(config.acid.interface, `${path}.min`)) * modFactor)
      }
    }

    return result
  }


  matrixRemodulate(reason) {

    const performancePaths = _.get(deviceCCs, 'bacara-acid').filter ( cc => !!cc )
    //    debug('performancePaths %y',performancePaths)
    const oldValues = {}
    performancePaths.forEach( perfPath => oldValues[perfPath] = _.get(this, perfPath) )

    this.modulation = {}
    _.get(this, 'matrix.slot', []).forEach( (slot, slotIdx) => {
      if (slot && _.get(this, `matrix.slot.${slotIdx}.value`) > 0) {

        _.get(slot, 'destination', []).forEach( (destination, destIdx) => {
          if (destination) {
            if (destination.target > 0 && destination.target < _.get(deviceCCs, 'bacara-acid.length') && destination.amount) {
              const targetPath = deviceCCs['bacara-acid'][destination.target]
              const targetCount = this.matrixTargetCount(destination.target)

              const mod = (((_.get(this, `matrix.slot.${slotIdx}.value`) + 1) / 128) * (destination.amount / 100)) / targetCount
              _.set(this.modulation, targetPath, _.get(this.modulation, targetPath, 0) + mod)
            }
          }
        })
      }
    })
    const newValues = {}
    performancePaths.forEach( perfPath => newValues[perfPath] = _.get(this, perfPath) )
    const deltaValues = difference(newValues, oldValues)

    if (deltaValues['killSteps'] || deltaValues['killShift']) {
      this.euclidian(this.killSteps, 16, this.killShift)
    }
    if (deltaValues['octaveChance']) {
      this.genOctaves(this.octaveChance)
    }
    if (deltaValues['density']) {
      this.genSounding(this.density)
    }
    const tableParameters = ['scales', 'base', 'transpose', 'split', 'deviate']
    const deltaKeys = Object.keys(deltaValues)
    if (deltaKeys.length) {
      if (_.intersection(deltaKeys, tableParameters)) {
        Acid.table(this)
      }
      debug('modulation impact: %y', deltaValues)
    }
  }

  read() {
    const filePath = path.resolve( (process.env.NODE_ENV == 'production') ? untildify('~/.electra-one/state/acid.json') : `${__dirname}/../state/acid.json` )
    if (fs.existsSync(filePath)) {
      const state = jsonfile.readFileSync(filePath)
      const keys = Object.keys(this.values)
      for (let k in keys) {
        if (Object.prototype.hasOwnProperty.call(state, keys[k])) {
          this.values[keys[k]] = state[keys[k]]
        }
      }
    }
  }

  write(quiet = false) {
    const filePath = path.resolve((process.env.NODE_ENV == 'production') ? untildify('~/.electra-one/state/acid.json') : `${__dirname}/../state/acid.json`)
    fs.ensureDirSync(path.dirname(filePath))
    jsonfile.writeFileSync(filePath, this.values, { flag: 'w', spaces: 2 })
    if (!quiet) {
      Acid.table(this)
    }
  }


  genOctaves(octaveChance) {
    for (let idx = 0; idx < 16; idx++) {
      const rnd = getRandomInt(100)
      const octave = (Math.abs(octaveChance) > rnd)
      this.values.octaves[idx] = (octave ? (octaveChance > 0 ? 1 : -1) : 0)
    }
  }

  genSounding(density) {
    for (let idx = 0; idx < 16; idx++) {
      const rnd = getRandomInt(100)
      this.values.sounding[idx] = (density && (density >= rnd)) ? 1 : 0
    }
  }

  euclidian(killSteps, steps, killShift) {
    function arrayRotate(arr, reverse) {
      if (reverse) {
        arr.unshift(arr.pop())
      } else {
        arr.push(arr.shift())
      }
      return arr
    }
    let pat = euclideanRhythms.getPattern(killSteps, steps)
    if (killShift) {
      let p = Math.abs(killShift)
      while (--p) {
        pat = arrayRotate(pat, killShift > 0)
      }
    }
    for (let idx = 0; idx < 16; idx++) {
      this.values.sounding[idx] = !pat[idx] ? 1 : 0
    }
    return pat
  }

  sendValues() {
    debug('Send Values')
    // Mind you, we should use the underlaying 'this.values' instead of 'this', we want to see the raw values on Electra One, not the modulated versions

    sendNRPN(midiOutputName, config.acid.interface.temperature.nrpn, 1, (this.temperature * 100) & 0xFF, (_.get(this.values, 'temperature', 0) * 100) >> 7)
    sendNRPN(midiOutputName, config.acid.interface.split.nrpn, 1, _.get(this.values, 'split', 0), 0)
    sendNRPN(midiOutputName, config.acid.interface.deviate.nrpn, 1, _.get(this.values, 'deviate', 0), 0)
    for (let l = 0; l < 3; l++) {
      ['device.A', 'device.B'].forEach( key => {
        sendNRPN(midiOutputName, _.get(config.acid.interface, `lfo.${l + 1}.${key}.nrpn`), 1, _.get(this.values, `lfo.${l}.${key}`, 0), 0)
      })
    }

    sendNRPN(midiOutputName, config.acid.interface.transpose.nrpn, 1, _.get(this.values, 'transpose', 0) + 64, 0)
    sendNRPN(midiOutputName, config.acid.interface.gate.nrpn, 1, _.get(this.values, 'gate', 0) * 64, 0)
    sendNRPN(midiOutputName, config.acid.interface.octaveChance.nrpn, 1, ((_.get(this.values, 'octaveChance', 0) / 100) * 64) + 64, 0)

    sendNRPN(midiOutputName, config.acid.interface.density.nrpn, 1, _.get(this.values, 'density', 0), 0)
    sendNRPN(midiOutputName, config.acid.interface.probability.nrpn, 1, _.get(this.values, 'probability', 0), 0)
    sendNRPN(midiOutputName, config.acid.interface.killSteps.nrpn, 1, _.get(this.values, 'killSteps', 0), 0)
    sendNRPN(midiOutputName, config.acid.interface.killShift.nrpn, 1, _.get(this.values, 'killShift', 0) + 15, 0)

    sendNRPN(midiOutputName, config.acid.interface.scales.nrpn, 1, _.get(this.values, 'scales', 0), 0)
    sendNRPN(midiOutputName, config.acid.interface.base.nrpn, 1, _.get(this.values, 'base', 0), 0)
    sendNRPN(midiOutputName, config.acid.interface.shift.nrpn, 1, _.get(this.values, 'shift', 0) + 16, 0)

    sendNRPN(midiOutputName, config.acid.interface.bank.nrpn, 1, _.get(this.values, 'bank', 0), 0)
    sendNRPN(midiOutputName, config.acid.interface.program.nrpn, 1, _.get(this.values, 'program', 0), 0)
    sendNRPN(midiOutputName, config.acid.interface.mute.nrpn, 1, _.get(this.values, 'mute', 0), 0)

    // LFO
    for (let l = 0; l < 3; l++) {
      ['control', 'shape', 'rate', 'phase', 'amount', 'offset', 'density'].forEach( key => {
        sendNRPN(midiOutputName, _.get(config.acid.interface, `lfo.${l + 1}.${key}.nrpn`), 1, _.get(this.values, `lfo.${l}.${key}`, 0), 0)
      })
    }

    // PROGRAM
    ['A', 'B'].forEach( dev => {
      ['device', 'mute', 'port', 'channel', 'bank', 'program'].forEach( key => {
        sendNRPN(midiOutputName, _.get(config.acid.interface, `device.${dev}.${key}.nrpn`), 1, _.get(this.values, `device.${dev}.${key}`, 0), 0)
      })
    })

    // MOD MATRIX
    for (let s = 0; s < 3; s++) {
      ['source', 'value', 'slewLimiter'].forEach( key => {
        sendNRPN(midiOutputName, _.get(config.acid.interface, `matrix.slot.${s}.${key}.nrpn`), 1, _.get(this.values, `matrix.slot.${s}.${key}`, 0), 0)
      })
      for (let d = 0; d < 3; d++) {
        sendNRPN(midiOutputName, _.get(config.acid.interface, `matrix.slot.${s}.destination.${d}.target.nrpn`), 1, _.get(this.values, `matrix.slot.${s}.destination.${d}.target`, 0), 0)
        sendNRPN(midiOutputName, _.get(config.acid.interface, `matrix.slot.${s}.destination.${d}.amount.nrpn`), 1, (_.get(this.values, `matrix.slot.${s}.destination.${d}.amount`, 0) + 100) * (128 / 200), 0)
      }
    }
  }

  sendProgramChange(dev) {
    debugMidiControlChange('%s %d CC %y = %y', this.device[dev].portName, _.get(this, `device.${dev}.channel`), 0, _.get(this, `device.${dev}.bank`))
    Midi.send(this.device[dev].portName, 'cc', {channel:_.get(this, `device.${dev}.channel`) - 1, controller:0, value:_.get(this, `device.${dev}.bank`)})
    debugMidiProgramChange('%s %d %y', this.device[dev].portName, _.get(this, `device.${dev}.channel`), _.get(this, `device.${dev}.program`))
    Midi.send(this.device[dev].portName, 'program', {channel:_.get(this, `device.${dev}.channel`) - 1, number:_.get(this, `device.${dev}.program`)})
  }


  handleNamedSysEx(midiName) {
    if (!midiCache[midiName]) {
      midiCache[midiName] = {}
    }

    return (msg) => {
      if (msg && msg.bytes && msg.bytes.length >= 5 && msg.bytes[0] == 0xF0 && msg.bytes[1] == 0x7D && msg.bytes[2] == 0x00 && msg.bytes[3] == 0x03 && msg.bytes[4] == 0xF7) {
        state.sendValues()
      }
    }

  }

  handleNamedCC(midiName) {

    if (!midiCache[midiName]) {
      midiCache[midiName] = {}
    }

    return (msg) => {
      _.set(midiCache[midiName], `channel_${_.padStart(msg.channel + 1, 2, '0')}.controller_${_.padStart(msg.controller, 3, '0')}`, msg.value)

      if ((msg.channel + 1) == config.acid.channel) {
        if (((msg.controller == 100) || (msg.controller == 101)) /* (N)RPN Reset */
          && _.get(midiCache, `${midiName}.channel_${_.padStart(msg.channel + 1, 2, '0')}.controller_100`, 0) == 127
          && _.get(midiCache, `${midiName}.channel_${_.padStart(msg.channel + 1, 2, '0')}.controller_101`, 0) == 127) {
          _.unset(midiCache[midiName], `channel_${_.padStart(msg.channel + 1, 2, '0')}.controller_006`)
          _.unset(midiCache[midiName], `channel_${_.padStart(msg.channel + 1, 2, '0')}.controller_038`)
          _.unset(midiCache[midiName], `channel_${_.padStart(msg.channel + 1, 2, '0')}.controller_098`)
          _.unset(midiCache[midiName], `channel_${_.padStart(msg.channel + 1, 2, '0')}.controller_099`)
          _.unset(midiCache[midiName], `channel_${_.padStart(msg.channel + 1, 2, '0')}.controller_100`)
          _.unset(midiCache[midiName], `channel_${_.padStart(msg.channel + 1, 2, '0')}.controller_101`)
          debug('(N)RPN Reset')
        }
        if ((msg.controller == 6) || (msg.controller == 38)) {
          const msb = _.get(midiCache, `${midiName}.channel_${_.padStart(config.acid.channel, 2, '0')}.controller_099`)
          const lsb = _.get(midiCache, `${midiName}.channel_${_.padStart(config.acid.channel, 2, '0')}.controller_098`)
          //          debug('NRPN => %y %y = %y',msb,lsb,(msb<<7)|lsb)
          if (msb == config.acid.interface.generate.nrpn && (lsb >= 1 && lsb <= 8)) {
            if (msg.controller == 6) { // MSB
              if (msg.value) {
                this.pattern = Acid.generate(state)
                this.last_pattern_but = 0
                debug('generated')
              }
            }
            if (msg.controller == 38) { // LSB
              // not used as value is always < 128
            }
          }
          if (msb == config.acid.interface.temperature.nrpn && (lsb >= 1 && lsb <= 8)) {
            const msb = _.get(midiCache, `${midiName}.channel_${_.padStart(config.acid.channel, 2, '0')}.controller_006`)
            const lsb = _.get(midiCache, `${midiName}.channel_${_.padStart(config.acid.channel, 2, '0')}.controller_038`)
            this.temperature = (((lsb << 7) | msb) / 100)
            debug('temperature %y', this.values.temperature)
          }
          if (msb == config.acid.interface.transpose.nrpn && (lsb >= 1 && lsb <= 8)) {
            if (msg.controller == 6) { // MSB
              const msb = _.get(midiCache, `${midiName}.channel_${_.padStart(config.acid.channel, 2, '0')}.controller_006`)
              this.transpose = (msb - 64)
              debug('transpose: %y', this.values.transpose)
            }
          }
          if (msb == config.acid.interface.gate.nrpn && (lsb >= 1 && lsb <= 8)) {
            if (msg.controller == 6) { // MSB
              const msb = _.get(midiCache, `${midiName}.channel_${_.padStart(config.acid.channel, 2, '0')}.controller_006`)
              this.gate = parseFloat((msb / 64 ).toFixed(2))
              if (this.values.gate > 1.92) {
                this.gate = 1.92
              }
              debug('gate: %y', this.values.gate)
            }
          }
          if (msb == config.acid.interface.previous_pattern.nrpn && (lsb >= 1 && lsb <= 8)) {
            const msb = _.get(midiCache, `${midiName}.channel_${_.padStart(config.acid.channel, 2, '0')}.controller_006`)
            if (msb && msg.controller == 6) {

              this.last_pattern_but += 1

              this.pattern = Acid.load_pattern(state)
              debug('previous_pattern: %y', this.values.last_pattern_but)
            }
          }
          if (msb == config.acid.interface.next_pattern.nrpn && (lsb >= 1 && lsb <= 8)) {
            const msb = _.get(midiCache, `${midiName}.channel_${_.padStart(config.acid.channel, 2, '0')}.controller_006`)
            if (msb && msg.controller == 6) {

              this.last_pattern_but -= 1
              if (this.values.last_pattern_but < 0) {
                this.values.last_pattern_but = 0
              }

              this.pattern = Acid.load_pattern(state)
              debug('next_pattern: %y', this.values.last_pattern_but)
            }
          }
          if (msb == config.acid.interface.previous_preset.nrpn && (lsb >= 1 && lsb <= 8)) {
            const msb = _.get(midiCache, `${midiName}.channel_${_.padStart(config.acid.channel, 2, '0')}.controller_006`)
            if (msb && msg.controller == 6) {

              this.last_preset_but += 1

              const filename = Acid.load_preset(state)
              if (filename) {
                this.sendProgramChange('A')
                this.sendProgramChange('B')
                this.sendValues()
                this.write(true)
                debug('previous_preset: %y %y', this.values.last_preset_but, path.basename(filename))
              }
            }
          }
          if (msb == config.acid.interface.next_preset.nrpn && (lsb >= 1 && lsb <= 8)) {
            const msb = _.get(midiCache, `${midiName}.channel_${_.padStart(config.acid.channel, 2, '0')}.controller_006`)
            if (msb && msg.controller == 6) {

              this.last_preset_but -= 1
              if (this.values.last_preset_but < 0) {
                this.last_preset_but = 0
              }

              const filename = Acid.load_preset(state)
              if (filename) {
                this.sendProgramChange('A')
                this.sendProgramChange('B')
                this.sendValues()
                this.write(true)
                debug('next_preset: %y %y', this.values.last_preset_but, path.basename(filename))
              }
            }
          }
          if (msb == config.acid.interface.save_preset.nrpn && (lsb >= 1 && lsb <= 8)) {
            const msb = _.get(midiCache, `${midiName}.channel_${_.padStart(config.acid.channel, 2, '0')}.controller_006`)
            if (msb && msg.controller == 6) {

              const filename = Acid.save_preset(state)
              if (filename) {
                this.sendValues()
                this.write(true)
                debug('save_pattern: %y %y', this.values.last_preset_but, path.basename(filename))
              }
            }
          }
          if (msb == config.acid.interface.reset_preset.nrpn && (lsb >= 1 && lsb <= 8)) {
            const msb = _.get(midiCache, `${midiName}.channel_${_.padStart(config.acid.channel, 2, '0')}.controller_006`)
            if (msb && msg.controller == 6) {

              this.reset_preset()
              this.sendValues()

              debug('reset')
            }
          }
          if (msb == config.acid.interface.bank.nrpn && (lsb >= 1 && lsb <= 8)) {
            if (msg.controller == 6) { // MSB
              let tmp = _.get(midiCache, `${midiName}.channel_${_.padStart(config.acid.channel, 2, '0')}.controller_006`)
              if (tmp != this.values.bank) {
                this.bank = tmp
                debug('bank: %y', this.values.bank)
              }
            }
          }
          if (msb == config.acid.interface.program.nrpn && (lsb >= 1 && lsb <= 8)) {
            if (msg.controller == 6) { // MSB
              let tmp = _.get(midiCache, `${midiName}.channel_${_.padStart(config.acid.channel, 2, '0')}.controller_006`)
              if (tmp != this.values.program) {
                const presetFilesCount = Acid.presetFiles(this, true)
                if (tmp >= 0 && tmp < presetFilesCount) {
                  this.program = tmp

                  this.last_preset_but = presetFilesCount - (this.values.program + 1)

                  const filename = Acid.load_preset(state)
                  if (filename) {
                    this.sendProgramChange('A')
                    this.sendProgramChange('B')
                    this.sendValues()
                    this.write(true)
                    debug('program: %y %y', this.values.program, path.basename(filename))
                  }
                } else {
                  debug('program: NOT PRESET %y', tmp)
                }
              }
            }
          }
          if (msb == config.acid.interface.mute.nrpn && (lsb >= 1 && lsb <= 8)) {
            if (msg.controller == 6) { // MSB
              let tmp = _.get(midiCache, `${midiName}.channel_${_.padStart(config.acid.channel, 2, '0')}.controller_006`)
              if (tmp != this.values.mute) {
                this.mute = tmp
                debug('mute: %y', this.values.mute)
              }
            }
          }
          if (msb == config.acid.interface.octaveChance.nrpn && (lsb >= 1 && lsb <= 8)) {
            if (msg.controller == 6) { // MSB
              let tmp = _.get(midiCache, `${midiName}.channel_${_.padStart(config.acid.channel, 2, '0')}.controller_006`) - 64
              if (tmp < 0) {
                tmp = Math.floor((tmp / 64) * 100)
              }
              if (tmp > 0) {
                tmp = Math.floor((tmp / 63) * 100)
              }
              if (tmp != this.values.octaveChance) {
                this.octaveChance = tmp
                debug('octaveChance: %y', this.values.octaveChance)
              }
            }
          }
          if (msb == config.acid.interface.density.nrpn && (lsb >= 1 && lsb <= 8)) {
            if (msg.controller == 6) { // MSB
              let tmp = _.get(midiCache, `${midiName}.channel_${_.padStart(config.acid.channel, 2, '0')}.controller_006`)
              if (tmp != this.values.density) {
                this.density = tmp
                debug('density: %y', this.values.density)
              }
            }
          }
          if (msb == config.acid.interface.probability.nrpn && (lsb >= 1 && lsb <= 8)) {
            if (msg.controller == 6) { // MSB
              let tmp = _.get(midiCache, `${midiName}.channel_${_.padStart(config.acid.channel, 2, '0')}.controller_006`)
              if (tmp != this.values.probability) {
                this.probability = tmp
                debug('probability: %y', this.values.probability)
              }
            }
          }
          if (msb == config.acid.interface.killSteps.nrpn && (lsb >= 1 && lsb <= 8)) {
            if (msg.controller == 6) { // MSB
              let tmp = _.get(midiCache, `${midiName}.channel_${_.padStart(config.acid.channel, 2, '0')}.controller_006`)
              if (tmp != this.values.killSteps) {
                this.killSteps = tmp
                debug('killSteps: %y', this.values.killSteps)

              }
            }
          }
          if (msb == config.acid.interface.killShift.nrpn && (lsb >= 1 && lsb <= 8)) {
            if (msg.controller == 6) { // MSB
              let tmp = _.get(midiCache, `${midiName}.channel_${_.padStart(config.acid.channel, 2, '0')}.controller_006`) - 15
              if (tmp != this.values.killShift) {
                this.killShift = tmp
                debug('killShift: %y', this.values.killShift)
              }
            }
          }
          if (msb == config.acid.interface.scales.nrpn && (lsb >= 1 && lsb <= 8)) {
            if (msg.controller == 6) { // MSB
              let tmp = _.get(midiCache, `${midiName}.channel_${_.padStart(config.acid.channel, 2, '0')}.controller_006`)
              if (tmp != this.values.scales) {
                this.scales = tmp
                debug('scales: %y = %s', this.values.scales, scaleMappings.scales[this.values.scales].name )
              }
            }
          }
          if (msb == config.acid.interface.base.nrpn && (lsb >= 1 && lsb <= 8)) {
            if (msg.controller == 6) { // MSB
              let tmp = _.get(midiCache, `${midiName}.channel_${_.padStart(config.acid.channel, 2, '0')}.controller_006`)
              if (tmp != this.values.base) {
                this.base = tmp
                debug('base: %y', this.values.base)
              }
            }
          }
          if (msb == config.acid.interface.shift.nrpn && (lsb >= 1 && lsb <= 8)) {
            if (msg.controller == 6) { // MSB
              let tmp = _.get(midiCache, `${midiName}.channel_${_.padStart(config.acid.channel, 2, '0')}.controller_006`) - 16
              if (tmp != this.values.shift) {
                this.shift = tmp
                debug('shift: %y', this.values.shift)
              }
            }
          }
          if (msb == config.acid.interface.split.nrpn && (lsb >= 1 && lsb <= 8)) {
            if (msg.controller == 6) { // MSB
              let tmp = _.get(midiCache, `${midiName}.channel_${_.padStart(config.acid.channel, 2, '0')}.controller_006`)
              if (tmp != this.values.split) {
                this.split = tmp
                debug('split: %y', this.values.split)
              }
            }
          }
          if (msb == config.acid.interface.deviate.nrpn && (lsb >= 1 && lsb <= 8)) {
            if (msg.controller == 6) { // MSB
              let tmp = _.get(midiCache, `${midiName}.channel_${_.padStart(config.acid.channel, 2, '0')}.controller_006`)
              if (tmp != this.values.deviate) {
                this.deviate = tmp
                debug('deviate: %y', this.values.deviate)
              }
            }
          }

          // LFO
          for (let l = 0; l < 3; l++) {
            ['control', 'shape', 'rate', 'phase', 'amount', 'offset', 'density', 'device.A', 'device.B'].forEach( key => {
              if (msb == _.get(config.acid.interface, `lfo.${l + 1}.${key}.nrpn`) && (lsb >= 1 && lsb <= 8)) {
                if (msg.controller == 6) { // MSB
                  let tmp = _.get(midiCache, `${midiName}.channel_${_.padStart(config.acid.channel, 2, '0')}.controller_006`)
                  if (tmp != _.get(this, `lfo.${l}.${key}`)) {
                    let oldShapeName = this.lfo[l].shapeName
                    const phaseValues = []
                    for (let p = 0; p <= 100; p++) {
                      phaseValues[p] = lfoValue(l, p)
                    }

                    _.set(this, `lfo.${l}.${key}`, tmp)

                    let names = []

                    if (key == 'shape') {
                      const idx = tmp
                      if (idx >= 0 && idx < shapes.length) {
                        this.lfo[l].shapeName = shapes[idx]
                        names.push(this.values.lfo[l].shapeName)
                      } else {
                        names.push('unknown')
                      }
                    }
                    if (key == 'control') {
                      if (this.values.lfo[l].control) {
                        ['A', 'B'].forEach( dev => {
                          const deviceIdx = _.get(this, `device.${dev}.device`)
                          if (deviceIdx > 0 && config.devices) {
                            const deviceKeys = Object.keys(config.devices)
                            if (deviceKeys.length > deviceIdx - 1) {
                              const device = deviceKeys[deviceIdx - 1]
                              const deviceColor = (dev == 'A') ? chalk.hex('#FF0000') : chalk.hex('#0000FF')
                              names.push(deviceColor(`${dev}: ` + device + ' ' + _.get(deviceCCs, `${device}.${this.values.lfo[l].control}`)))
                            }
                          }
                        } )
                      }
                    }

                    if (phaseDetection && this.playing && lfoHistory.length >= 2) {
                      const phaseDetectionShapes = ['sine', 'triangle', 'saw-up', 'saw-down']
                      const phaseDetectionParameters = ['shape', 'amount', 'rate', 'offset', 'density']
                      if (phaseDetectionShapes.indexOf(this.lfo[l].shapeName) >= 0 && phaseDetectionShapes.indexOf(oldShapeName) >= 0) {
                        if (phaseDetectionParameters.indexOf(key) >= 0) {

                          const value = lfoValue(l)
                          if (Number.isInteger(value)) {

                            // debug('YES HI %y %y %y',value,lfoHistory[l],phaseValues)
                            let pIndex
                            let pDiff = 255
                            for (let p = 0; p <= 100; p++) {
                              const diff = Math.abs(phaseValues[p] - value)
                              if (diff < pDiff) {
                                pIndex = p
                                pDiff = diff
                              }
                            }
                            if (Number.isInteger(pIndex)) {
                              let pDelta = Math.abs(pIndex - _.get(this, `lfo.${l}.phase`, 0))

                              for (let p = 0; p <= 100; p++) {
                                const diff = Math.abs(phaseValues[p] - value)
                                if (diff == pDiff) {
                                  const delta = Math.abs(p - _.get(this, `lfo.${l}.phase`, 0))
                                  const pDir = (phaseValues[p] - phaseValues[p > 0 ? p - 1 : 100]) > 0 ? 1 : -1
                                  const rDir = (lfoHistory[l][0] - lfoHistory[l][1]) > 0 ? 1 : -1
                                  // debug('Diff pos %y  pDir:%y curr:%y prev:%y  rDir:%y history:%y',p,pDir,phaseValues[p],phaseValues[p>0?p-1:100],rDir,lfoHistory[l])
                                  if (pDir == rDir && delta <= pDelta) { // Direction is same, prefer this re-position of Phase
                                    pIndex = p
                                    pDelta = delta
                                    // debug('better %y %y',p,delta)
                                  }
                                }
                              }
                              _.set(this, `lfo.${l}.phase`, pIndex)
                              sendNRPN(midiOutputName, _.get(config.acid.interface, `lfo.${l + 1}.phase.nrpn`), 1, _.get(this.values, `lfo.${l}.phase`, 0), 0)
                              debug('Reposition Phase: %y', pIndex)
                            }
                          }

                        } else {
                          // debug('NO %y',phaseDetectionParameters.indexOf(key))
                        }
                      } else {
                        // debug('NO %y %y',phaseDetectionShapes.indexOf(this.lfo[l].shapeName)>=0,phaseDetectionShapes.indexOf(oldShapeName)>=0)
                      }
                    }

                    debug('lfo.%d.%s: %y%s', l + 1, key, _.get(this, `lfo.${l}.${key}`), names.length ? ` [ ${names.join(', ')} ]` : '')
                    this.write(true) // write because lfo values are deep values
                  }
                }
              }
            })
          }

          // DEVICES
          ['A', 'B'].forEach( dev => {
            ['device', 'mute', 'port', 'channel', 'bank', 'program'].forEach( key => {
              if (msb == _.get(config.acid.interface, `device.${dev}.${key}.nrpn`) && (lsb >= 1 && lsb <= 8)) {
                if (msg.controller == 6) { // MSB
                  let tmp = _.get(midiCache, `${midiName}.channel_${_.padStart(config.acid.channel, 2, '0')}.controller_006`)
                  if (tmp != _.get(this, `device.${dev}.${key}`)) {
                    debug('device %s %s = %y', (dev == 'A') ? chalk.hex('#FF0000')(dev) : chalk.hex('#0000FF')(dev), key, tmp)

                    _.set(this.device, `${dev}.${key}`, tmp)
                    if (key == 'port' || key == 'channel') {
                      let deviceIdx = 0
                      let portName
                      const midiNames = easymidi.getOutputs()
                      if (midiNames) {
                        const port = _.get(this, `device.${dev}.port`)
                        if (port < midiNames.length) {
                          portName = midiNames[port]
                        }
                      }
                      if (portName) {
                        const deviceKeys = Object.keys(config.devices)
                        const matchingDevices = deviceKeys.filter( deviceKey => {
                          const devicePortKey = _.get(config, `devices.${deviceKey}.port`)
                          const devicePortName = _.get(config, `midi.ports.${devicePortKey}.${os.platform()}`)
                          return devicePortName == portName
                        })
                        matchingDevices.forEach( deviceKey => {
                          const channel = _.get(this, `device.${dev}.channel`)
                          const channels = _.get(config, `devices.${deviceKey}.channels`)
                          if (channels.indexOf(channel) >= 0) {
                            const devIdx = deviceKeys.indexOf(matchingDevices[0])
                            if (devIdx >= 0) {
                              deviceIdx = devIdx + 1
                            }
                          }
                        } )
                      }

                      _.set(this.device, `${dev}.device`, deviceIdx)
                      sendNRPN(midiOutputName, _.get(config.acid.interface, `device.${dev}.device.nrpn`), 1, _.get(this, `device.${dev}.device`), 0)
                      if (!deviceIdx) {
                        _.set(this.device, `${dev}.mute`, 1)
                        sendNRPN(midiOutputName, _.get(config.acid.interface, `device.${dev}.mute.nrpn`), 1, _.get(this, `device.${dev}.mute`), 0)
                      }
                    }
                    if (key == 'device') {
                      if (tmp > 0 && config.devices) {
                        const deviceKeys = Object.keys(config.devices)
                        if (deviceKeys.length > tmp - 1) {
                          const device = deviceKeys[tmp - 1]
                          debug ('device: %y', device)
                          const port = _.get(config, `devices.${device}.port`)
                          if (port) {
                            const portName = _.get(config, `midi.ports.${port}.${os.platform()}`)
                            if (portName) {
                              const midiNames = easymidi.getOutputs()
                              if (midiNames) {
                                const idx = midiNames.indexOf(portName)
                                if (idx >= 0) {
                                  tmp = idx
                                  key = 'port' // fall through next condition
                                  _.set(this.device, `${dev}.port`, idx)
                                  sendNRPN(midiOutputName, _.get(config.acid.interface, `device.${dev}.port.nrpn`), 1, _.get(this, `device.${dev}.port`), 0)

                                  const channels = _.get(config, `devices.${device}.channels`)
                                  if (Array.isArray(channels) && channels.length) {
                                    const channel = _.get(this, `device.${dev}.channel`)
                                    if (channels.indexOf(channel) < 0) {
                                      _.set(this.device, `${dev}.channel`, channels[0])
                                      sendNRPN(midiOutputName, _.get(config.acid.interface, `device.${dev}.channel.nrpn`), 1, _.get(this, `device.${dev}.channel`), 0)
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                    if (key == 'port') {
                      const midiNames = easymidi.getOutputs()
                      if (midiNames) {
                        const idx = tmp
                        if (idx < midiNames.length) {
                          let name = midiNames[idx]
                          const ports = Object.keys(config.midi.ports).filter( p => config.midi.ports[p][os.platform()] == name )
                          if (ports && ports.length == 1) {
                            name = ports[0]
                          }
                          _.set(this.device, `${dev}.${key}Name`, name)
                        }
                      } else {
                        _.set(this.device, `${dev}.${key}Name`, null)
                      }
                    }

                    if (key == 'bank' || key == 'program') {
                      this.sendProgramChange(dev)
                    }
                    this.write(true) // write because device values are deep values
                  }
                }
              }
            })
          })

          // MOD MATRIX

          for (let s = 0; s < 3; s++) {
            ['source', 'value', 'slewLimiter'].forEach( key => {
              if (msb == _.get(config.acid.interface, `matrix.slot.${s}.${key}.nrpn`) && (lsb >= 1 && lsb <= 8)) {
                if (msg.controller == 6) { // MSB
                  let tmp = _.get(midiCache, `${midiName}.channel_${_.padStart(config.acid.channel, 2, '0')}.controller_006`)
                  if (tmp != _.get(this, `matrix.slot.${s}.${key}`)) {
                    _.set(this, `matrix.slot.${s}.${key}`, tmp)
                    debug('matrix.slot.%d.%s: %y', s + 1, key, _.get(this, `matrix.slot.${s}.${key}`))
                    state.matrixRemodulate(key)
                    this.write(true) // write because matrix values are deep values
                  }
                }
              }
            })
            for (let d = 0; d < 3; d++) {
              ['target', 'amount'].forEach( key => {
                if (msb == _.get(config.acid.interface, `matrix.slot.${s}.destination.${d}.${key}.nrpn`) && (lsb >= 1 && lsb <= 8)) {
                  if (msg.controller == 6) { // MSB
                    let tmp = _.get(midiCache, `${midiName}.channel_${_.padStart(config.acid.channel, 2, '0')}.controller_006`)
                    if (tmp != _.get(this, `matrix.slot.${s}.${key}`)) {
                      if (key == 'amount') {
                        tmp = Math.round((tmp - 63) * (100 / (tmp < 63 ? 63 : 64)))
                      }
                      _.set(this, `matrix.slot.${s}.destination.${d}.${key}`, tmp)
                      debug('matrix.slot.%d.destination.%d.%s: %y', s + 1, d + 1, key, _.get(this, `matrix.slot.${s}.destination.${d}.${key}`))
                      state.matrixRemodulate(key)
                      this.write(true) // write because matrix values are deep values
                    }
                  }
                }
              })
            }
          }
        }
      }
    }
  }
}


function radians(degrees) {
  return (degrees % 360) * (Math.PI / 180)
}


function lfo(step, stepsPerCycle, shape, phase) {
  let cycleStep = ((step + 0) + (((phase + 0.0) % 1.0) * stepsPerCycle)) % stepsPerCycle
  //    debug('JJR lfo: step: %y  stepsPerCycle: %y  shape: %y  phase: %y  cycleStep: %y',step, stepsPerCycle, shape, phase, cycleStep)
  switch (shape) {
  case 'sine':
    cycleStep = ((step + 0) + (((phase + 0.75) % 1.0) * stepsPerCycle)) % stepsPerCycle
    return (Math.sin(radians(((cycleStep / stepsPerCycle) * 360 ))) + 1.0) * 64
  case 'triangle':
    cycleStep = cycleStep / 2
    if (cycleStep < (stepsPerCycle * 0.25)) {
      return ( 0.0 + ((cycleStep / (stepsPerCycle / 4)))) * 128
    } else {
      return ( 1.0 - ((cycleStep - (stepsPerCycle / 4) ) / (stepsPerCycle / 4))) * 128
    }
  case 'saw-up':
    return (((cycleStep * 2) / stepsPerCycle) * 128) % 128
  case 'saw-down':
    return (( 2.0 - ( (cycleStep * 2) / stepsPerCycle)) * 128) % 128
  case 'square':
    return (cycleStep < (stepsPerCycle / 4)) || ((cycleStep >= (stepsPerCycle / 2)) && (cycleStep < (stepsPerCycle * 0.75))) ? 128 : 0
  case 'random':
    return getRandomInt(127)
  }
  return -1
}

function lfoValue(l, phase /*optional*/) {
  let result
  if (state.lfo[l].control && state.lfo[l].amount && (state.lfo[l].device.A || state.lfo[l].device.B)) {
    const factor = (state.lfo[l].amount / 100)
    const base = Math.floor((((100 - state.lfo[l].amount) / 100) * 128) / 2)
    const offset = Math.floor(base * (((state.lfo[l].offset - 50) ) / 50) )
    if (!Number.isInteger(phase)) {
      phase = state.lfo[l].phase
    }
    const mod = lfo( steps, (128 - state.lfo[l].rate) * 4, state.lfo[l].shapeName, phase / 100)
    if (mod >= 0) {
      const value = Math.min(127, Math.max(0, Math.floor(( mod * factor) + base + offset )))

      const devs = []

      if (state.lfo[l].device.A) {
        devs.push('A')
      }
      if (state.lfo[l].device.B) {
        devs.push('B')
      }

      result = Math.min(127, value)
    }
  }
  return result
}


function sendNRPN(midiName, msb, lsb, valueMsb, valueLsb, timeout = 0) {
  Midi.send(midiName, 'nrpn', {channel:config.acid.channel - 1, msb, lsb, valueMsb, valueLsb}, timeout ? `NRPN_c:${config.acid.channel - 1}_n:${(msb << 7) | (lsb & 0x7F)}` : null, timeout)
}

function acidSequencer(name, sub, options) {

  Midi.setupVirtualPorts(config.acid.virtual)

  state = new State()

  const clockInput = Midi.input(options.clock, true, true)


  if (!midiCache[options.output]) {
    midiCache[options.output] = {}
  }

  ['A', 'B'].forEach( dev => {
    if (state.device[dev].portName) {
      const channel = state.device[dev].channel - 1
      for (let midiNote = 0; midiNote < 128; midiNote++) {
        debugMidiNoteOff('%s %d %y', state.device[dev].portName, channel + 1, midiNote)
        Midi.send(state.device[dev].portName, 'noteoff', {
          note: midiNote,
          velocity: 127,
          channel: channel,
        })
      }
    }
  })

  if (options.electra) {
    midiInputName = options.electra
    midiOutputName = options.electra
  }

  const slewLimiterTimouts = []
  const slewLimiterTime = 5000


  function matrixSetSlotValue(slotIdx, step, timeout, newValue) {
    const valueDelta = (newValue - _.get(state, `matrix.slot.${slotIdx}.value`, 0)) / (step + 1)
    const stepValue = step ? Math.round(_.get(state.values, `matrix.slot.${slotIdx}.value`, 0) + valueDelta ) : newValue
    if (slewLimiterTimouts[slotIdx]) {
      clearTimeout(slewLimiterTimouts[slotIdx])
      slewLimiterTimouts[slotIdx] = null
    }
    //debug('matrixSetSlotValue slotIdx %y step %y timeout %y valueDelta %y currentValue %y stepValue %y newValue %y',slotIdx,step,timeout,valueDelta,_.get(state.values,`matrix.slot.${slotIdx}.value`,0),stepValue,newValue)
    if (_.get(state.values, `matrix.slot.${slotIdx}.value`, 0) != stepValue) {
      _.set(state.values, `matrix.slot.${slotIdx}.value`, stepValue)
      sendNRPN(midiOutputName, _.get(config.acid.interface, `matrix.slot.${slotIdx}.value.nrpn`), 1, _.get(state, `matrix.slot.${slotIdx}.value`, 0), 0)
      state.matrixRemodulate('slewLimiter')
    }
    if (step > 0) {
      slewLimiterTimouts[slotIdx] = setTimeout( matrixSetSlotValue, timeout, slotIdx, step - 1, timeout, newValue)
    }
  }

  const transposeInput = (options.transpose ? Midi.input(options.transpose, true, true) : null)

  if (transposeInput) {
    transposeInput.on('message', (msg) => {
      if (msg._type == 'noteon' && (!options.transposeChannel || msg.channel == (options.transposeChannel - 1))) {
        state.transpose = msg.note - 48
        debug('Note -> transpose: %y', state.transpose)
        sendNRPN(midiOutputName, config.acid.interface.transpose.nrpn, 1, state.transpose + 64, 0)
      }
    })
  }

  const generalInput = (options.general ? Midi.input(options.general, true, true) : null)
  if (generalInput) {

    /*
  electra-one generalInput: {
  electra-one     channel: 0,
  electra-one     pressure: 0,
  electra-one     _type: 'channel aftertouch',
  electra-one } +11ms
*/
    generalInput.on('message', (msg) => {
      //         debug('generalInput: %y',msg)
      if (msg._type == 'noteon' && (!options.generalChannel || msg.channel == (options.generalChannel - 1))) {
        for (let slotIdx = 0; slotIdx < 3; slotIdx++) {
          if (_.get(state, `matrix.slot.${slotIdx}.source`) == matrixSlotSources.velocity) { // VELOCITY
            if (_.get(state, `matrix.slot.${slotIdx}.value`) !== msg.velocity) {
              matrixSetSlotValue(slotIdx, _.get(state, `matrix.slot.${slotIdx}.slewLimiter`, 0), matrixSetSlotValueTimout, msg.velocity)
            }
          }
        }
      }
      if (msg._type == 'cc' && (!options.generalChannel || msg.channel == (options.generalChannel - 1)) && msg.controller == 1) {
        for (let slotIdx = 0; slotIdx < 3; slotIdx++) {
          if (_.get(state, `matrix.slot.${slotIdx}.source`) == matrixSlotSources.modWheel) { // MOD WHEEL
            if (_.get(state, `matrix.slot.${slotIdx}.value`) !== msg.value) {
              matrixSetSlotValue(slotIdx, _.get(state, `matrix.slot.${slotIdx}.slewLimiter`, 0), matrixSetSlotValueTimout, msg.value)
            }
          }
        }
      }
      if (msg._type == 'channel aftertouch' && (!options.generalChannel || msg.channel == (options.generalChannel - 1))) {
        for (let slotIdx = 0; slotIdx < 3; slotIdx++) {
          if (_.get(state, `matrix.slot.${slotIdx}.source`) == matrixSlotSources.channelAftertouch) { // CHANNEL AFTERTOUCH
            if (_.get(state, `matrix.slot.${slotIdx}.value`) !== msg.pressure) {
              matrixSetSlotValue(slotIdx, _.get(state, `matrix.slot.${slotIdx}.slewLimiter`, 0), matrixSetSlotValueTimout, msg.pressure)
            }
          }
        }
      }

      if (msg._type == 'cc' && (!options.generalChannel || msg.channel == (options.generalChannel - 1)) && performanceMap[msg.controller]) {
        const paramName = performanceMap[msg.controller]
        let value = msg.value
        const nrpn = _.get(config.acid.interface, `${paramName}.nrpn`)
        if (nrpn) {
          //          sendNRPN(midiOutputName, nrpn, 1, value, 0)
        }
        _.set(state, paramName, value)
        debug('CC %y', performanceMap[msg.controller])
      }
    })
  }


  let lastTime = 0
  let pulseTime = [0, 0]
  clockInput.on('clock', () => {
    const deltaTime = process.hrtime(pulseTime)
    pulseTime = process.hrtime()

    const ticks = (pulses % (24 * 4)) * 20
    pulseDuration = (deltaTime[0] * 1000) + (deltaTime[1] / 1000000)

    const ticksPerStep = 120
    const stepIdx = ticks / ticksPerStep
    if (state.playing) {
      const tickDuration = pulseDuration / 20
      const shiftedTicks = (ticks + (ticksPerStep * state.shift)) % (ticksPerStep * 16)

      if (!state.mute) {
        for (let l = 0; l < 3; l++) {
          const value = lfoValue(l)
          if (Number.isInteger(value)) {
            const devs = []

            if (state.lfo[l].device.A) {
              devs.push('A')
            }
            if (state.lfo[l].device.B) {
              devs.push('B')
            }

            devs.forEach( dev => {
              if (!state.device[dev].mute && state.device[dev].portName) {
                const channel = state.device[dev].channel - 1
                const pth = `port_${state.device[dev].portName}.channel_${_.padStart(channel + 1, 2, '0')}.controller_${_.padStart(state.lfo[l].control, 3, '0')}`
                const midiValue = Math.min(127, value)

                if (_.get(midiCache[options.output], pth) != midiValue) {

                  debugMidiControlChange('%s %d CC %y = %y', state.device[dev].portName, channel + 1, state.lfo[l].control, midiValue)

                  if (!lfoHistory[l].length || lfoHistory[l][0] != midiValue) {
                    if (lfoHistory[l].unshift(midiValue) > 2) {
                      lfoHistory[l].splice(2)
                    }
                  }

                  Midi.send(state.device[dev].portName, 'cc', {channel, controller:state.lfo[l].control, value:midiValue})
                  _.set(midiCache[options.output], pth, midiValue)

                  // Can Electra handle many NRPN's?
                  sendNRPN(midiOutputName, config.acid.interface.lfo[l + 1].show.nrpn, 1, midiValue, 0, 50)
                }
              }
            })
          }
        }
      }
      if (state.pattern && !state.mute) {
        state.pattern.tracks[0].notes.forEach( (note) => {
          if (note.ticks == shiftedTicks) {
            if (stepIdx < state.sounding.length && state.sounding[stepIdx]) {
              let midiNote = note.midi

              const scaleMapping = scaleMappings.scales[state.scales]
              const midiNoteFromBase = (midiNote + state.base) % 12
              const midiNoteBase =  midiNote - midiNoteFromBase
              if (scaleMapping && scaleMapping.mapping[midiNoteFromBase] != midiNoteFromBase) {
                midiNote = (midiNoteBase + scaleMapping.mapping[midiNoteFromBase]) - state.base
              }

              midiNote += state.transpose + ((stepIdx < state.octaves.length && state.octaves[stepIdx]) ? (state.octaves[stepIdx] * 12) : 0)

              const rnd = getRandomInt(100)

              const switchChannel = (state.deviate && state.deviate >= rnd)
              const channel = (midiNote <= state.split) ? (switchChannel ? 1 : 0) : (switchChannel ? 0 : 1)

              const dev =  (midiNote <= state.split) ? (switchChannel ? 'B' : 'A') : (switchChannel ? 'A' : 'B')

              let rnd2 = getRandomInt(100)
              if (!state.device[dev].mute && state.device[dev].portName && state.probability >= rnd2) {
                const channel = state.device[dev].channel - 1
                debugMidiNoteOn('%s %d %y', state.device[dev].portName, channel + 1, midiNote)
                if (_.get(midiCache, `${state.device[dev].portName}.note_${midiNote}`)) {
                  Midi.send(state.device[dev].portName, 'noteoff', {
                    note: midiNote,
                    velocity: 127,
                    channel: channel,
                  })
                }
                Midi.send(state.device[dev].portName, 'noteon', {
                  note: midiNote,
                  velocity: 127 * note.velocity,
                  channel: channel,
                })
                _.set(midiCache, `${state.device[dev].portName}.note_${midiNote}`, true)

                const b = Math.floor(note.durationTicks / ticksPerStep) * ticksPerStep
                const r = (note.durationTicks % ticksPerStep) * state.gate
                setTimeout((portName, midiNote, channel) => {
                  debugMidiNoteOff('%s %d %y', portName, channel + 1, midiNote)
                  Midi.send(portName, 'noteoff', {
                    note: midiNote,
                    velocity: 127,
                    channel: channel,
                  })
                  _.set(midiCache, `${portName}.note_${midiNote}`, false)
                }, b + r, state.device[dev].portName, midiNote, channel)
              }
            }
          }
        })
      }
      if (! (ticks % 1) ) {
        steps++
      }
    }
    pulses++
  })

  clockInput.on('start', () => {
    state.playing = true
    pulses = 0
    steps = 0
    pulseTime = process.hrtime()
    debug('start')
  })

  clockInput.on('stop', () => {
    state.playing = false
    debug('stop')
  })

  clockInput.on('continue', () => {
    state.playing = true
    pulseTime = process.hrtime()
    debug('continue')
  })

  if (midiInputName) {
    const midiInput = Midi.input(midiInputName, true, true)
    midiInput.on('cc', state.handleNamedCC(midiInputName) )
    midiInput.on('sysex', state.handleNamedSysEx(midiInputName) )

  }

  state.sendValues()
  Acid.table(state)
}

module.exports = {
  name: 'acid.v1',
  description: 'Acid Sequencer v1',
  examples: [
    {usage:'electra-one acid.v1', description:'Starts acid.v1 sequencer'},
  ],
  handler: acidSequencer,
}



