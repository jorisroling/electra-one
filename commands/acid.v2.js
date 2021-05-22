const debug = require('debug')(require('../package.json').name + ':command:' + require('path').basename(__filename, '.js'))

const _ = require('lodash')

const Acid = require('../lib/acid')

const Midi = require('../lib/midi/midi')

const Machine = require('../lib/midi/machine')
const Interface = require('../lib/midi/interface')
const MidiCache = require('../lib/midi/cache')

const yves = require('../lib/yves')
const pkg = require('../package.json')
const debugMidi = yves.debugger(`${pkg.name.replace(/^@/, '')}:midi`)
const debugMidiNoteOn = yves.debugger(`${pkg.name.replace(/^@/, '')}:midi:note:on`)
const debugMidiNoteOff = yves.debugger(`${pkg.name.replace(/^@/, '')}:midi:note:off`)
const debugMidiControlChange = yves.debugger(`${pkg.name.replace(/^@/, '')}:midi:control:change`)
const debugMidiProgramChange = yves.debugger(`${pkg.name.replace(/^@/, '')}:midi:program:change`)

const euclideanRhythms = require('euclidean-rhythms')
const scaleMappings = require('../extra/scales/scales.json')

function radians(degrees) {
  return (degrees % 360) * (Math.PI / 180)
}


class AcidMachine extends Machine {
  constructor(name) {
    super(name)

    this.pulseTime = [0, 0]
    this.pulses = 0
    this.pulseDuration = 0
    this.midiCache = new MidiCache()
    this.lfoHistory = [[], [], []]

    this.state = {sounding:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]}
    this.state.pattern = Acid.generate(this.state)

    this.actionSideEffects = {
      reset_preset: (path,origin) => {
        debug('Action Side Effect %y: Hello World! (from %y)',path,origin)
        if (origin == 'surface') {
          this.interface.reset()
        }
      },
      load: (path,origin) => {
        debug('Action Side Effect %y: Hello World! (from %y)',path,origin)
        if (origin == 'surface') {
          // do it
        }
      },
      clock: (path,origin) => {
        // debug('Action Side Effect %y: Hello World! (from %y)',path,origin)
        if (origin == 'clock') {
          const deltaTime = process.hrtime(this.pulseTime)
          this.pulseTime = process.hrtime()

          const ticks = (this.pulses % (24 * 4)) * 20
          this.pulseDuration = (deltaTime[0] * 1000) + (deltaTime[1] / 1000000)

          const ticksPerStep = 120
          const stepIdx = ticks / ticksPerStep
          if (this.getState('playing')) {
            const tickDuration = this.pulseDuration / 20
            const shiftedTicks = (ticks + (ticksPerStep * this.interface.getParameter('shift'))) % (ticksPerStep * 16)

            if (!this.interface.getParameter('mute')) {
              for (let l = 0; l < 3; l++) {
                const value = this.lfoValue(l)
                if (Number.isInteger(value)) {
                  const devs = []

                  if (this.interface.getParameter(`lfo.${l}.device.A`)) {
                    devs.push('A')
                  }
                  if (this.interface.getParameter(`lfo.${l}.device.B`)) {
                    devs.push('B')
                  }

                  devs.forEach( dev => {
                    if (!this.interface.getParameter(`device.${dev}.mute`) && this.getState(`device.${dev}.portName`)) {
                      const channel = this.interface.getParameter(`device.${dev}.channel`) - 1
                      const pth = `port_${this.getState(`device.${dev}.portName`)}.channel_${_.padStart(channel + 1, 2, '0')}.controller_${_.padStart(this.interface.getParameter(`lfo.${l}.control`), 3, '0')}`
                      const midiValue = Math.min(127, value)

                      const cacheValue = this.midiCache.getValue(this.getState(`device.${dev}.portName`), channel, 'cc', this.interface.getParameter(`lfo.${l}.control`) )
                      if (cacheValue != midiValue) {

                        debugMidiControlChange('%s %d CC %y = %y', this.getState(`device.${dev}.portName`), channel + 1, this.interface.getParameter(`lfo.${l}.control`), midiValue)

                        if (!this.lfoHistory[l].length || this.lfoHistory[l][0] != midiValue) {
                          if (this.lfoHistory[l].unshift(midiValue) > 2) {
                            this.lfoHistory[l].splice(2)
                          }
                        }

                        Midi.send(this.getState(`device.${dev}.portName`), 'cc', {channel, controller:this.interface.getParameter(`lfo.${l}.control`), value:midiValue})
                        this.midiCache.setValue(this.getState(`device.${dev}.portName`), channel, 'cc', this.interface.getParameter(`lfo.${l}.control`), midiValue)

                        // Can Electra handle many NRPN's?
                        this.interface.setParameter(`lfo.${l}.show`,Interface.remap(midiValue,0,127,-100,100))
                        //sendNRPN(midiOutputName, config.acid.interface.lfo[l + 1].show.nrpn, 1, midiValue, 0, 50)
                      }
                    }
                  })
                }
              }
            }
            if (this.getState('pattern') && !this.interface.getParameter('mute')) {
              this.getState('pattern').tracks[0].notes.forEach( (note) => {
                if (note.ticks == shiftedTicks) {
                  if (stepIdx < this.state.sounding.length && this.state.sounding[stepIdx]) {
                    let midiNote = note.midi

                    const scaleMapping = scaleMappings.scales[this.interface.getParameter('scales')]
                    const midiNoteFromBase = (midiNote + this.interface.getParameter('base')) % 12
                    const midiNoteBase =  midiNote - midiNoteFromBase
                    if (scaleMapping && scaleMapping.mapping[midiNoteFromBase] != midiNoteFromBase) {
                      midiNote = (midiNoteBase + scaleMapping.mapping[midiNoteFromBase]) - this.interface.getParameter('base')
                    }

                    midiNote += this.interface.getParameter('transpose') + ((stepIdx < this.state.octaves.length && this.state.octaves[stepIdx]) ? (this.state.octaves[stepIdx] * 12) : 0)

                    const deviateRnd = Machine.getRandomInt(100)
                    const switchChannel = (this.interface.getParameter('deviate') && this.interface.getParameter('deviate') >= deviateRnd)
                    const channel = (midiNote <= this.interface.getParameter('split')) ? (switchChannel ? 1 : 0) : (switchChannel ? 0 : 1)
                    const dev =  (midiNote <= this.interface.getParameter('split')) ? (switchChannel ? 'B' : 'A') : (switchChannel ? 'A' : 'B')

                    let probabilityRnd = Machine.getRandomInt(100)
                    if (!this.interface.getParameter(`device.${dev}.mute`) && this.getState(`device.${dev}.portName`) && this.interface.getParameter('probability') >= probabilityRnd) {
                      const channel = this.interface.getParameter(`device.${dev}.channel`) - 1
                      debugMidiNoteOn('%s %d %y', this.getState(`device.${dev}.portName`), channel + 1, midiNote)

                      if (this.midiCache.getValue(this.getState(`device.${dev}.portName`), channel, 'note', midiNote)) {
                        Midi.send(this.getState(`device.${dev}.portName`), 'noteoff', {
                          note: midiNote,
                          velocity: 127,
                          channel: channel,
                        })
                      }
                      Midi.send(this.getState(`device.${dev}.portName`), 'noteon', {
                        note: midiNote,
                        velocity: 127 * note.velocity,
                        channel: channel,
                      })
                      this.midiCache.setValue(this.getState(`device.${dev}.portName`), channel, 'note', midiNote, true)

                      const b = Math.floor(note.durationTicks / ticksPerStep) * ticksPerStep
                      const r = (note.durationTicks % ticksPerStep) * this.interface.getParameter('gate')
                      setTimeout((portName, midiNote, channel) => {
                        debugMidiNoteOff('%s %d %y', portName, channel + 1, midiNote)
                        Midi.send(portName, 'noteoff', {
                          note: midiNote,
                          velocity: 127,
                          channel: channel,
                        })
                        this.midiCache.clearValue(this.getState(`device.${dev}.portName`), channel, 'note', midiNote)
                      }, b + r, this.getState(`device.${dev}.portName`), midiNote, channel)
                    }
                  }
                }
              })
            }
            if (! (ticks % 1) ) {
              this.steps++
            }
          }
          this.pulses++
        }
      },
      start: (path,origin) => {
        debug('Action Side Effect %y: Hello World! (from %y)',path,origin)
        if (origin == 'clock') {
          this.setState('playing',true)
          this.pulses = 0
          this.steps = 0
          this.pulseTime = process.hrtime()
          debug('start')
        }
      },
      stop: (path,origin) => {
        debug('Action Side Effect %y: Hello World! (from %y)',path,origin)
        if (origin == 'clock') {
          this.setState('playing',false)
          debug('stop')
        }
      },
      continue: (path,origin) => {
        debug('Action Side Effect %y: Hello World! (from %y)',path,origin)
        if (origin == 'clock') {
          this.setState('playing',true)
          pulseTime = process.hrtime()
          debug('continue')
        }
      },
    }

    const devicePortChange = (dev) => {
      return (path,value,origin) => {
        debug('Parameter Side Effect device.%s.port: Hello World! %y = %y (from %y)',dev,path,value,origin)
        this.setState(`device.${dev}.portName`,Midi.normalisePortName(value))
      }
    }

    const lfoShapeChange = (lfoIdx) => {
      return (path,value,origin) => {
        debug('Parameter Side Effect lfo.%d.shape: Hello World! %y = %y (from %y)',lfoIdx,path,value,origin)
        const shapes = ['sine', 'triangle', 'saw-up', 'saw-down', 'square', 'random']
        this.setState(`lfo.${lfoIdx}.shapeName`,shapes[value])
      }
    }

    this.parameterSideEffects = {
      octaveChance: (path,value,origin) => {
        debug('Parameter Side Effect %y: Hello World! %y (from %y)',path,value,origin)
        if (origin == 'surface' || !this.state.octaves) {
          this.state.octaves = []
          for (let idx = 0; idx < 16; idx++) {
            const rnd = Machine.getRandomInt(100)
            const octave = (Math.abs(value) > rnd)
            this.state.octaves[idx] = (octave ? (value > 0 ? 1 : -1) : 0)
          }
        }
      },
      density: (path,value,origin) => {
        debug('Parameter Side Effect %y: Hello World! %y (from %y)',path,value,origin)
        if (origin == 'surface' && value != 100) {
          this.interface.setParameter('killSteps',0)
        }
        if (origin == 'surface' || !this.state.sounding) {
          this.state.sounding = []
          for (let idx = 0; idx < 16; idx++) {
            const rnd = Machine.getRandomInt(100)
            this.state.sounding[idx] = (value && (value >= rnd)) ? 1 : 0
          }
        }
      },
      killSteps: (path,value,origin) => {
        debug('Parameter Side Effect %y: Hello World! %y (from %y)',path,value,origin)
        if (origin == 'surface' && value != 0) {
          this.interface.setParameter('density',100)
        }
        if (origin == 'surface' || !this.state.sounding && value>0) {
          this.euclidian(this.interface.getParameter('killSteps'), 16, this.interface.getParameter('killShift'))
        }
      },
      killShift: (path,value,origin) => {
        debug('Parameter Side Effect %y: Hello World! %y (from %y)',path,value,origin)
        if (this.interface.getParameter('killSteps')>0) {
          if (origin == 'surface' || !this.state.sounding) {
            this.euclidian(this.interface.getParameter('killSteps'), 16, this.interface.getParameter('killShift'))
          }
        }
      },
      device: {
        A: { port: devicePortChange('A') },
        B: { port: devicePortChange('B') },
      },
      lfo: [
        { shape: lfoShapeChange(0) },
        { shape: lfoShapeChange(1) },
        { shape: lfoShapeChange(2) },
      ],
    }
  }

  getState(path,deflt) {
    return _.get(this.state,path,deflt)
  }

  setState(path,value) {
    _.set(this.state,path,value)
  }


  lfo(step, stepsPerCycle, shape, phase) {
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

  lfoValue(l, phase /*optional*/) {
    let result
    if (this.interface.getParameter(`lfo.${l}.control`) && this.interface.getParameter(`lfo.${l}.amount`) && (this.interface.getParameter(`lfo.${l}.device.A`) || this.interface.getParameter(`lfo.${l}.device.B`))) {
      const factor = (this.interface.getParameter(`lfo.${l}.amount`) / 100)
      const base = Math.floor((((100 - this.interface.getParameter(`lfo.${l}.amount`)) / 100) * 128) / 2)
      const offset = Math.floor(base * (((this.interface.getParameter(`lfo.${l}.offset`) - 50) ) / 50) )
      if (!Number.isInteger(phase)) {
        phase = this.interface.getParameter(`lfo.${l}.phase`)
      }
      const mod = this.lfo( this.steps, (128 - this.interface.getParameter(`lfo.${l}.rate`)) * 4, this.getState(`lfo.${l}.shapeName`), phase / 100)
      if (mod >= 0) {
        const value = Math.min(127, Math.max(0, Math.floor(( mod * factor) + base + offset )))
        result = Math.min(127, value)
      }
    }
    return result
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
    this.state.sounding = []
    for (let idx = 0; idx < steps; idx++) {
      this.state.sounding[idx] = !pat[idx] ? 1 : 0
    }
    return pat
  }


}


function acidSequencer(name, sub, options) {

//  Midi.setupVirtualPorts(config.acid.virtual)

  const machine = new AcidMachine('acid.v2')
  machine.readState()
  machine.writeState()

  machine.connect(options.electra, 'surface')
  machine.connect(options.general, 'external')
  machine.connect(options.clock, 'clock')

  debug('State %y',machine.state)
}

module.exports = {
  name: 'acid.v2',
  description: 'Acid Sequencer',
  examples: [
    {usage:'electra-one acid', description:'Starts acid sequencer'},
  ],
  handler: acidSequencer,
}



