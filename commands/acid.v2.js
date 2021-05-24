const debug = require('debug')(require('../package.json').name + ':command:' + require('path').basename(__filename, '.js'))

const config = require('config')
const os = require('os')
const easymidi = require('easymidi')
const glob = require('glob')

const _ = require('lodash')

const Acid = require('../lib/acid')

const Midi = require('../lib/midi/midi')

const Machine = require('../lib/midi/machine')
const Interface = require('../lib/midi/interface')
const MidiCache = require('../lib/midi/cache')
const path = require('path')

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


    this.state.sounding = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    this.state.pattern = Acid.generate(this.state)

    this.actionSideEffects = {
      generate: (elementPath, origin) => {
        debug('Action Side Effect %y: Hello World! (from %y)', elementPath, origin)
        if (origin == 'surface') {
          this.state.pattern = Acid.generate(this.state)
          this.state.last_pattern_but = 0
          debug('generated')
        }
      },
      previous_pattern: (elementPath, origin) => {
        debug('Action Side Effect %y: Hello World! (from %y)', elementPath, origin)
        if (origin == 'surface') {
          this.state.last_pattern_but += 1

          this.state.pattern = Acid.load_pattern(this.state)
          debug('previous_pattern: %y', this.state.last_pattern_but)
        }
      },
      next_pattern: (elementPath, origin) => {
        debug('Action Side Effect %y: Hello World! (from %y)', elementPath, origin)
        if (origin == 'surface') {
          this.state.last_pattern_but -= 1
          if (this.state.last_pattern_but < 0) {
            this.state.last_pattern_but = 0
          }

          this.state.pattern = Acid.load_pattern(this.state)
          debug('next_pattern: %y', this.state.last_pattern_but)
        }
      },
      previous_preset: (elementPath, origin) => {
        debug('Action Side Effect %y: Hello World! (from %y)', elementPath, origin)
        if (origin == 'surface') {
          this.state.last_preset_but += 1

          const filename = this.load_preset()
          if (filename) {
            this.sendProgramChange('A')
            this.sendProgramChange('B')
            this.interface.sendValues(origin)
            this.writeState()
            debug('previous_preset: %y %y', this.state.last_preset_but, path.basename(filename))
          }
        }
      },
      next_preset: (elementPath, origin) => {
        debug('Action Side Effect %y: Hello World! (from %y)', elementPath, origin)
        if (origin == 'surface') {

          this.state.last_preset_but -= 1
          if (this.state.last_preset_but < 0) {
            this.state.last_preset_but = 0
          }

          const filename = this.load_preset()
          if (filename) {
            this.sendProgramChange('A')
            this.sendProgramChange('B')
            this.interface.sendValues(origin)
            this.writeState()
            debug('next_preset: %y %y', this.state.last_preset_but, path.basename(filename))
          }
        }
      },
      save_preset: (elementPath, origin) => {
        debug('Action Side Effect %y: Hello World! (from %y)', elementPath, origin)
        if (origin == 'surface') {
          this.save_preset()
        }
      },
      reset_preset: (elementPath, origin) => {
        debug('Action Side Effect %y: Hello World! (from %y)', elementPath, origin)
        if (origin == 'surface') {
          this.interface.reset()
        }
      },
/*      load: (elementPath, origin) => {
        debug('Action Side Effect %y: Hello World! (from %y)', elementPath, origin)
        if (origin == 'surface') {
          // do it
        }
      },*/
      clock: (elementPath, origin) => {
        // debug('Action Side Effect %y: Hello World! (from %y)',elementPath,origin)
        if (origin == 'clock') {
          const deltaTime = process.hrtime(this.pulseTime)
          this.pulseTime = process.hrtime()

          const ticks = (this.pulses % (24 * 4)) * 20
          this.pulseDuration = (deltaTime[0] * 1000) + (deltaTime[1] / 1000000)

          const ticksPerStep = 120
          const stepIdx = ticks / ticksPerStep
          if (this.getState('playing')) {
            const tickDuration = this.pulseDuration / 20
            const shiftedTicks = (ticks + (ticksPerStep * this.interface.getParameter('shift','modulated'))) % (ticksPerStep * 16)

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
                      const pth = `port_${this.getState(`device.${dev}.portName`)}.channel_${_.padStart(channel + 1, 2, '0')}.controller_${_.padStart(this.interface.getParameter(`lfo.${l}.control`,'modulated'), 3, '0')}`
                      const midiValue = Math.min(127, value)

                      const cacheValue = this.midiCache.getValue(this.getState(`device.${dev}.portName`), channel, 'cc', this.interface.getParameter(`lfo.${l}.control`,'modulated') )
                      if (cacheValue != midiValue) {

                        debugMidiControlChange('%s %d CC %y = %y', this.getState(`device.${dev}.portName`), channel + 1, this.interface.getParameter(`lfo.${l}.control`,'modulated'), midiValue)

                        if (!this.lfoHistory[l].length || this.lfoHistory[l][0] != midiValue) {
                          if (this.lfoHistory[l].unshift(midiValue) > 2) {
                            this.lfoHistory[l].splice(2)
                          }
                        }

                        Midi.send(this.getState(`device.${dev}.portName`), 'cc', {channel, controller:this.interface.getParameter(`lfo.${l}.control`,'modulated'), value:midiValue})
                        this.midiCache.setValue(this.getState(`device.${dev}.portName`), channel, 'cc', this.interface.getParameter(`lfo.${l}.control`,'modulated'), midiValue)

                        // Can Electra handle many NRPN's?
                        this.interface.setParameter(`lfo.${l}.show`, Interface.remap(midiValue, 0, 127, -100, 100))
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

                    const scaleMapping = scaleMappings.scales[this.interface.getParameter('scales','modulated')]
                    const midiNoteFromBase = (midiNote + this.interface.getParameter('base','modulated')) % 12
                    const midiNoteBase =  midiNote - midiNoteFromBase
                    if (scaleMapping && scaleMapping.mapping[midiNoteFromBase] != midiNoteFromBase) {
                      midiNote = (midiNoteBase + scaleMapping.mapping[midiNoteFromBase]) - this.interface.getParameter('base','modulated')
                    }

                    midiNote += this.interface.getParameter('transpose','modulated') + ((stepIdx < this.state.octaves.length && this.state.octaves[stepIdx]) ? (this.state.octaves[stepIdx] * 12) : 0)

                    const deviateRnd = Machine.getRandomInt(100)
                    const switchChannel = (this.interface.getParameter('deviate','modulated') && this.interface.getParameter('deviate','modulated') >= deviateRnd)
                    const channel = (midiNote <= this.interface.getParameter('split','modulated')) ? (switchChannel ? 1 : 0) : (switchChannel ? 0 : 1)
                    const dev =  (midiNote <= this.interface.getParameter('split','modulated')) ? (switchChannel ? 'B' : 'A') : (switchChannel ? 'A' : 'B')

                    let probabilityRnd = Machine.getRandomInt(100)
                    if (!this.interface.getParameter(`device.${dev}.mute`) && this.getState(`device.${dev}.portName`) && this.interface.getParameter('probability','modulated') >= probabilityRnd) {
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
                      const r = (note.durationTicks % ticksPerStep) * this.interface.getParameter('gate','modulated')
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
      start: (elementPath, origin) => {
        debug('Action Side Effect %y: Hello World! (from %y)', elementPath, origin)
        if (origin == 'clock') {
          this.setState('playing', true)
          this.pulses = 0
          this.steps = 0
          this.pulseTime = process.hrtime()
          debug('start')
        }
      },
      stop: (elementPath, origin) => {
        debug('Action Side Effect %y: Hello World! (from %y)', elementPath, origin)
        if (origin == 'clock') {
          this.setState('playing', false)
          debug('stop')
        }
      },
      continue: (elementPath, origin) => {
        debug('Action Side Effect %y: Hello World! (from %y)', elementPath, origin)
        if (origin == 'clock') {
          this.setState('playing', true)
          this.pulseTime = process.hrtime()
          debug('continue')
        }
      },
    }

    const deviceDeviceChange = (dev) => {
      return (elementPath, value, origin) => {
        debug('Parameter Side Effect device.%s.port: Hello World! %y = %y (from %y)', dev, elementPath, value, origin)
        if (value > 0 && config.devices) {
          const deviceKeys = Object.keys(config.devices)
          if (deviceKeys.length > value - 1) {
            const device = deviceKeys[value - 1]
            const port = _.get(config, `devices.${device}.port`)
            if (port) {
              const portName = _.get(config, `midi.ports.${port}.${os.platform()}`)
              if (portName) {
                const midiNames = easymidi.getOutputs()
                if (midiNames) {
                  const idx = midiNames.indexOf(portName)
                  if (idx >= 0) {
                    this.interface.setParameter(`device.${dev}.port`,idx)
                    const midiNames = easymidi.getOutputs()
                    if (midiNames) {
                      if (idx < midiNames.length) {
                        let name = midiNames[idx]
                        const ports = Object.keys(config.midi.ports).filter( p => config.midi.ports[p][os.platform()] == name )
                        if (ports && ports.length == 1) {
                          name = ports[0]
                        }
                        this.setState(`device.${dev}.portName`,name)
                      }
                    } else {
                      this.clearState(`device.${dev}.portName`)
                    }
                    const channels = _.get(config, `devices.${device}.channels`)
                    if (Array.isArray(channels) && channels.length) {
                      const channel = this.interface.getParameter(`device.${dev}.channel`)//_.get(this, `device.${dev}.channel`)
                      if (channels.indexOf(channel) < 0) {
                        this.interface.setParameter(`device.${dev}.channel`,channels[0])
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    const devicePortOrChannelChanged = (dev) => {
      let deviceIdx = 0
      let portName
      const midiNames = easymidi.getOutputs()
      if (midiNames) {
        const port = this.interface.getParameter(`device.${dev}.port`)
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
          const channel = this.interface.getParameter(`device.${dev}.channel`)
          const channels = _.get(config, `devices.${deviceKey}.channels`)
          if (channels.indexOf(channel) >= 0) {
            const devIdx = deviceKeys.indexOf(matchingDevices[0])
            if (devIdx >= 0) {
              deviceIdx = devIdx + 1
            }
          }
        } )
      }

      this.interface.setParameter(`device.${dev}.device`,deviceIdx)
      if (!deviceIdx) {
        this.interface.setParameter(`device.${dev}.mute`,1)
      }
    }

    const devicePortChange = (dev) => {
      return (elementPath, value, origin) => {
        debug('Parameter Side Effect device.%s.port: Hello World! %y = %y (from %y)', dev, elementPath, value, origin)
        this.setState(`device.${dev}.portName`, Midi.normalisePortName(value))
        devicePortOrChannelChanged(dev)
      }
    }

    const deviceChannelChange = (dev) => {
      return (elementPath, value, origin) => {
        debug('Parameter Side Effect device.%s.port: Hello World! %y = %y (from %y)', dev, elementPath, value, origin)
        devicePortOrChannelChanged(dev)
      }
    }

    const lfoShapeChange = (lfoIdx) => {
      return (elementPath, value, origin) => {
        debug('Parameter Side Effect lfo.%d.shape: Hello World! %y = %y (from %y)', lfoIdx, elementPath, value, origin)
        const shapes = ['sine', 'triangle', 'saw-up', 'saw-down', 'square', 'random']
        this.setState(`lfo.${lfoIdx}.shapeName`, shapes[value])
      }
    }

    const matrixRemodulate = (slotIdx,destIdx) => {
      return (elementPath, value, origin) => {
//        debug('Parameter Side Effect matrixRemodulate(%d,%d): Hello World! %y = %y (from %y)', slotIdx, destIdx, elementPath, value, origin)
        this.interface.matrixRemodulate(elementPath)
      }
    }



    this.parameterSideEffects = {
      octaveChance: (elementPath, value, origin) => {
        debug('Parameter Side Effect %y: Hello World! %y (from %y)', elementPath, value, origin)
        if (origin == 'surface' || !this.state.octaves) {
          this.state.octaves = []
          for (let idx = 0; idx < 16; idx++) {
            const rnd = Machine.getRandomInt(100)
            const octave = (Math.abs(value) > rnd)
            this.state.octaves[idx] = (octave ? (value > 0 ? 1 : -1) : 0)
          }
        }
      },
      density: (elementPath, value, origin) => {
        debug('Parameter Side Effect %y: Hello World! %y (from %y)', elementPath, value, origin)
        if (origin == 'surface' && value != 100) {
          this.interface.setParameter('killSteps', 0)
        }
        if (origin == 'surface' || !this.state.sounding) {
          this.state.sounding = []
          for (let idx = 0; idx < 16; idx++) {
            const rnd = Machine.getRandomInt(100)
            this.state.sounding[idx] = (value && (value >= rnd)) ? 1 : 0
          }
        }
      },
      killSteps: (elementPath, value, origin) => {
        debug('Parameter Side Effect %y: Hello World! %y (from %y)', elementPath, value, origin)
        if (origin == 'surface' && value != 0) {
          this.interface.setParameter('density', 100)
        }
        if (origin == 'surface' || !this.state.sounding && value > 0) {
          this.euclidian(this.interface.getParameter('killSteps'), 16, this.interface.getParameter('killShift'))
        }
      },
      killShift: (elementPath, value, origin) => {
        debug('Parameter Side Effect %y: Hello World! %y (from %y)', elementPath, value, origin)
        if (this.interface.getParameter('killSteps') > 0) {
          if (origin == 'surface' || !this.state.sounding) {
            this.euclidian(this.interface.getParameter('killSteps'), 16, this.interface.getParameter('killShift'))
          }
        }
      },
      device: {
        A: {
          device: deviceDeviceChange('A'),
          port: devicePortChange('A'),
          channel: deviceChannelChange('A'),
        },
        B: {
          device: deviceDeviceChange('B'),
          port: devicePortChange('B'),
          channel: deviceChannelChange('B'),
        },
      },
      lfo: [
        { shape: lfoShapeChange(0) },
        { shape: lfoShapeChange(1) },
        { shape: lfoShapeChange(2) },
      ],
      matrix: {
        slot: [
          {
            value: matrixRemodulate(0),
            destination: [
              {
                target: matrixRemodulate(0,0),
                amount: matrixRemodulate(0,0),
              },
              {
                target: matrixRemodulate(0,1),
                amount: matrixRemodulate(0,1),
              },
              {
                target: matrixRemodulate(0,2),
                amount: matrixRemodulate(0,2),
              },
            ],
          },
          {
            value: matrixRemodulate(1),
            destination: [
              {
                target: matrixRemodulate(1,0),
                amount: matrixRemodulate(1,0),
              },
              {
                target: matrixRemodulate(1,1),
                amount: matrixRemodulate(1,1),
              },
              {
                target: matrixRemodulate(1,2),
                amount: matrixRemodulate(1,2),
              },
            ],
          },
          {
            value: matrixRemodulate(2),
            destination: [
              {
                target: matrixRemodulate(2,0),
                amount: matrixRemodulate(2,0),
              },
              {
                target: matrixRemodulate(2,1),
                amount: matrixRemodulate(2,1),
              },
              {
                target: matrixRemodulate(2,2),
                amount: matrixRemodulate(2,2),
              },
            ],
          },
        ]
      },
    }
  }

  sendProgramChange(dev) {
    debugMidiControlChange('%s %d CC %y = %y', this.getState(`device.${dev}.portName`), this.interface.getParameter(`device.${dev}.channel`), 0, this.interface.getParameter(`device.${dev}.bank`))
    Midi.send(this.getState(`device.${dev}.portName`), 'cc', {channel:this.interface.getParameter(`device.${dev}.channel`,1) - 1, controller:0, value:this.interface.getParameter(`device.${dev}.bank`)})
    debugMidiProgramChange('%s %d %y', this.getState(`device.${dev}.portName`), this.interface.getParameter(`device.${dev}.channel`,1) - 1, this.interface.getParameter(`device.${dev}.program`))
    Midi.send(this.getState(`device.${dev}.portName`), 'program', {channel:this.interface.getParameter(`device.${dev}.channel`,1) - 1, number:this.interface.getParameter(`device.${dev}.program`)})
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
      return Machine.getRandomInt(127)
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

  load_preset() {

    const presetFiles = this.presetFiles()

    let but = (this.state && this.state.last_preset_but ? this.state.last_preset_but : 0)
    if (!but) {
      but = 0
    }
    if (but < 0) {
      but = 0
    }
    if (but > (presetFiles.length - 1)) {
      but = presetFiles.length - 1
    }
    if (this.state) {
      this.state.last_preset_but = but
    }

    const filename = presetFiles[(presetFiles.length - 1) - but]
    if (filename) {
      const bank = this.interface.getParameter('bank',0)
      const playing = this.state.playing
      const last_preset_but = this.state.last_preset_but
      this.readState(filename)
      this.interface.setParameter('bank',bank)
      this.interface.setParameter('program',((presetFiles.length - 1) - but) >= 0 ? ((presetFiles.length - 1) - but) : 0)
      this.state.last_preset_but = last_preset_but
      this.state.playing = playing
      return filename
    }
  }

  bankName() {
    return `bank-${_.padStart(this.interface.getParameter('bank',0), 3, '0')}`
  }

  presetFiles(count = false) {
    const files = glob.sync(path.resolve(
      ( (process.env.NODE_ENV == 'production') ? path.join(untildify('~/.electra-one'), 'state', 'acid', this.bankName(), 'presets') : path.join(__dirname, '..', 'state', 'acid', this.bankName(), 'presets') ) + '/*.json'), {})
    return count ? (Array.isArray(files) ? files.length : 0) : files
  }

  save_preset(state) {
    const name = `Acid - ${new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')}`
    const filePath = path.resolve((process.env.NODE_ENV == 'production') ? untildify(`~/.electra-one/state/acid/${Acid.bankName(state)}/presets/${name.replace(/:/g, '.')}.json`) : `${__dirname}/../state/acid/${this.bankName()}/presets/${name.replace(/:/g, '.')}.json`)
    this.writeState(filePath)
    this.state.last_preset_but = 0
    this.interface.setParameter('program',this.presetFiles(true) - 1)
    return filePath
  }

}


function acidSequencer(name, sub, options) {

  //  Midi.setupVirtualPorts(config.acid.virtual)

  const machine = new AcidMachine('acid.v2')
  machine.readState()
  machine.writeState()

  machine.connect(options.electra, 'surface')
  machine.connect(options.general, 'external')
  machine.connect(options.clock, 'clock');

  machine.notesReset()
  machine.interface.sendValues('surface')

  debug('State %y', machine.getPreset())
}

module.exports = {
  name: 'acid.v2',
  description: 'Acid Sequencer',
  examples: [
    {usage:'electra-one acid', description:'Starts acid sequencer'},
  ],
  handler: acidSequencer,
}



