const debug = require('debug')(require('../package.json').name + ':command:' + require('path').basename(__filename, '.js'))

const config = require('config')
const os = require('os')
const easymidi = require('easymidi')
const glob = require('glob')

const _ = require('lodash')

const Acid = require('../lib/acid')

const Midi = require('../lib/midi/midi')

const { Midi:TonalMidi } = require('@tonaljs/tonal')

const Machine = require('../lib/midi/machine')
const Interface = require('../lib/midi/interface')
const MidiCache = require('../lib/midi/cache')
const path = require('path')
const untildify = require('untildify')

const yves = require('../lib/yves')
const pkg = require('../package.json')
const debugMidi = yves.debugger(`${pkg.name.replace(/^@/, '')}:midi`)
const debugMidiNoteOn = yves.debugger(`${pkg.name.replace(/^@/, '')}:midi:note:on`)
const debugMidiNoteOff = yves.debugger(`${pkg.name.replace(/^@/, '')}:midi:note:off`)
const debugMidiControlChange = yves.debugger(`${pkg.name.replace(/^@/, '')}:midi:control:change`)
const debugMidiProgramChange = yves.debugger(`${pkg.name.replace(/^@/, '')}:midi:program:change`)

const euclideanRhythms = require('euclidean-rhythms')
const scaleMappings = require('../extra/scales/scales.json')

const chalk = require('chalk')
const { knownDeviceCCs } = require('../lib/devices')
const deviceCCs = knownDeviceCCs()

const phaseDetection = true
const tableParameters = ['transpose', 'density', 'muteSteps', 'muteShift', 'scales', 'base', 'split', 'deviate', 'shift']

const toneJSmidi = require('@tonejs/midi')

const Table = require('cli-table3')
const ticksPerStep = 120

const matrixSetSlotValueTimout = 10
const matrixSlotSources = {
  off: 0,
  modWheel: 1,
  velocity: 2,
  channelAftertouch: 3,
}

const beatCC = 2 // -1 for off

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
    this.slewLimiterTimouts = []


    this.state.sounding = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]

    this.actionSideEffects = {
      load: (elementPath, origin) => {
        /*        debug('Action Side Effect %y: Hello World! (from %y)', elementPath, origin)*/
        if (origin == 'surface') {
          this.interface.sendValues(origin)
          debug('load')
        }
      },
      generate: (elementPath, origin) => {
        /*        debug('Action Side Effect %y: Hello World! (from %y)', elementPath, origin)*/
        if (origin == 'surface') {
          this.state.pattern = Acid.generate(this.state)
          this.state.last_pattern_but = 0
          this.showPattern()
          this.writeState()
          debug('generated')
        }
      },
      previous_pattern: (elementPath, origin) => {
        /*        debug('Action Side Effect %y: Hello World! (from %y)', elementPath, origin)*/
        if (origin == 'surface') {
          this.state.last_pattern_but += 1

          this.state.pattern = Acid.load_pattern(this.state)
          this.showPattern()
          this.writeState()
          debug('previous_pattern: %y', this.state.last_pattern_but)
        }
      },
      next_pattern: (elementPath, origin) => {
        /*        debug('Action Side Effect %y: Hello World! (from %y)', elementPath, origin)*/
        if (origin == 'surface') {
          this.state.last_pattern_but -= 1
          if (this.state.last_pattern_but < 0) {
            this.state.last_pattern_but = 0
          }

          this.state.pattern = Acid.load_pattern(this.state)
          this.showPattern()
          this.writeState()
          debug('next_pattern: %y', this.state.last_pattern_but)
        }
      },
      previous_preset: (elementPath, origin) => {
        /*        debug('Action Side Effect %y: Hello World! (from %y)', elementPath, origin)*/
        if (origin == 'surface') {
          const program = this.interface.getParameter('program')
          if (program >= 1 && program < 128) {
            const filename = this.load_preset(program - 1)
            if (filename) {
              this.sendDeviceProgramChange('A')
              this.sendDeviceProgramChange('B')
              for (let trk = 0; trk < 6; trk++) {
                this.sendTrackProgramChange(trk)
              }
              this.interface.sendValues(origin)
              this.showPattern()
              this.writeState()
              debug('previous_preset: %y %y', this.interface.getParameter('program'), path.basename(filename))
            }
          }
        }
      },
      next_preset: (elementPath, origin) => {
        /*        debug('Action Side Effect %y: Hello World! (from %y)', elementPath, origin)*/
        if (origin == 'surface') {
          const program = this.interface.getParameter('program')
          if (program >= 0 && program < 127) {
            const filename = this.load_preset(program + 1)
            if (filename) {
              this.sendDeviceProgramChange('A')
              this.sendDeviceProgramChange('B')
              for (let trk = 0; trk < 6; trk++) {
                this.sendTrackProgramChange(trk)
              }
              this.interface.sendValues(origin)
              this.showPattern()
              this.writeState()
              debug('next_preset: %y %y', this.interface.getParameter('program'), path.basename(filename))
            }
          }
        }
      },
      add_preset: (elementPath, origin) => {
        debug('Action Side Effect %y: Hello World! (from %y)', elementPath, origin)
        if (origin == 'surface') {
          const filename = this.add_preset()
          debug('add_preset: %y', filename)
        }
      },
      save_preset: (elementPath, origin) => {
        debug('Action Side Effect %y: Hello World! (from %y)', elementPath, origin)
        if (origin == 'surface') {
          const filename = this.save_preset()
          debug('save_preset: %y', filename)
        }
      },
      reset_preset: (elementPath, origin) => {
        debug('Action Side Effect %y: Hello World! (from %y)', elementPath, origin)
        if (origin == 'surface') {
          this.interface.reset()
          this.showPattern()
          this.writeState()
        }
      },
      clock: (elementPath, origin) => {
        // debug('Action Side Effect %y: Hello World! (from %y)',elementPath,origin)
        if (origin == 'clock') {
          this.sequencer()
        }
      },
      start: (elementPath, origin) => {
        //        debug('Action Side Effect %y: Hello World! (from %y)', elementPath, origin)
        if (origin == 'clock') {
          this.setState('playing', true)
          this.pulses = 0
          this.pulseTime = process.hrtime()
          this.writeState()
          debug('start')
        }
      },
      stop: (elementPath, origin) => {
        /*        debug('Action Side Effect %y: Hello World! (from %y)', elementPath, origin)*/
        if (origin == 'clock') {
          this.setState('playing', false)
          this.writeState()
          debug('stop')
        }
      },
      continue: (elementPath, origin) => {
        /*        debug('Action Side Effect %y: Hello World! (from %y)', elementPath, origin)*/
        if (origin == 'clock') {
          this.setState('playing', true)
          this.pulseTime = process.hrtime()
          this.writeState()
          debug('continue')
        }
      },
    }

    const deviceDeviceChange = (dev) => {
      return (elementPath, value, origin) => {
        /*        debug('Parameter Side Effect device.%s.port: Hello World! %y = %y (from %y)', dev, elementPath, value, origin)*/
        if (value > 0 && config.devices) {
          let idx = 0
          let choosenDeviceKey
          let choosenChannel
          for (let deviceKey in config.devices) {
            if (Array.isArray(config.devices[deviceKey].channels)) {
              for (let c in config.devices[deviceKey].channels) {
                idx++
                if (idx == value) {
                  choosenDeviceKey = deviceKey
                  choosenChannel = config.devices[deviceKey].channels[c]
                }
              }
            }
          }

          /*          debug ('new %y %y',choosenDeviceKey,choosenChannel)*/
          if (choosenDeviceKey && Number.isInteger(choosenChannel)) {
            const port = _.get(config, `devices.${choosenDeviceKey}.port`)
            if (port) {
              const portName = _.get(config, `midi.ports.${port}.${os.platform()}`)
              if (portName) {
                const midiNames = easymidi.getOutputs()
                if (midiNames) {
                  const idx = midiNames.indexOf(portName)
                  if (idx >= 0) {
                    this.interface.setParameter(`device.${dev}.port`, idx)
                    const midiNames = easymidi.getOutputs()
                    if (midiNames) {
                      if (idx < midiNames.length) {
                        let name = midiNames[idx]
                        const ports = Object.keys(config.midi.ports).filter( p => config.midi.ports[p][os.platform()] == name )
                        if (ports && ports.length == 1) {
                          name = ports[0]
                        }
                        this.setState(`device.${dev}.portName`, name)
                      }
                    } else {
                      this.clearState(`device.${dev}.portName`)
                    }
                    this.interface.setParameter(`device.${dev}.channel`, choosenChannel)
                  }
                }
              }
            }
          }
        }
      }
    }

    const devicePortOrChannelChanged = (dev) => {
      let portName
      const midiNames = easymidi.getOutputs()
      if (midiNames) {
        const port = this.interface.getParameter(`device.${dev}.port`)
        if (port < midiNames.length) {
          portName = Midi.normalisePortName(midiNames[port])
        }
      }
      if (portName) {
        const deviceMenu = this.deviceMenu()
        if (deviceMenu) {
          let deviceIdx = 0
          for (let d in deviceMenu) {
            if (deviceMenu[d].port == portName && deviceMenu[d].channel == this.interface.getParameter(`device.${dev}.channel`)) {
              deviceIdx = parseInt(d)
            }
          }

          this.interface.setParameter(`device.${dev}.device`, deviceIdx)
          if (!deviceIdx) {
            this.interface.setParameter(`device.${dev}.mute`, 1)
          }
        }
      }
      this.sendDeviceProgramChange(dev)
    }

    const devicePortChange = (dev) => {
      return (elementPath, value, origin) => {
        this.setState(`device.${dev}.portName`, Midi.normalisePortName(value))
        if (origin != 'internal') {
          devicePortOrChannelChanged(dev)
        }
      }
    }

    const deviceChannelChange = (dev) => {
      return (elementPath, value, origin) => {
        if (origin != 'internal') {
          devicePortOrChannelChanged(dev)
        }
      }
    }
    const deviceBankOrProgramChange = (dev) => {
      return (elementPath, value, origin) => {
        if (origin != 'internal') {
          this.sendDeviceProgramChange(dev)
        }
      }
    }

    const trackDeviceChange = (trk) => {
      return (elementPath, value, origin) => {
        /*        debug('Parameter Side Effect device.%s.port: Hello World! %y = %y (from %y)', dev, elementPath, value, origin)*/
        if (value > 0 && config.devices) {
          let idx = 0
          let choosenDeviceKey
          let choosenChannel
          for (let deviceKey in config.devices) {
            if (Array.isArray(config.devices[deviceKey].channels)) {
              for (let c in config.devices[deviceKey].channels) {
                idx++
                if (idx == value) {
                  choosenDeviceKey = deviceKey
                  choosenChannel = config.devices[deviceKey].channels[c]
                }
              }
            }
          }

          /*          debug ('new %y %y',choosenDeviceKey,choosenChannel)*/
          if (choosenDeviceKey && Number.isInteger(choosenChannel)) {
            this.setState(`track.${trk}.channel`, choosenChannel)

            const port = _.get(config, `devices.${choosenDeviceKey}.port`)
            if (port) {
              const portName = _.get(config, `midi.ports.${port}.${os.platform()}`)
              if (portName) {
                const midiNames = easymidi.getOutputs()
                if (midiNames) {
                  const idx = midiNames.indexOf(portName)
                  if (idx >= 0) {
                    //                    this.interface.setParameter(`device.${dev}.port`, idx)
                    const midiNames = easymidi.getOutputs()
                    if (midiNames) {
                      if (idx < midiNames.length) {
                        let name = midiNames[idx]
                        const ports = Object.keys(config.midi.ports).filter( p => config.midi.ports[p][os.platform()] == name )
                        if (ports && ports.length == 1) {
                          name = ports[0]
                        }
                        this.setState(`track.${trk}.portName`, name)
                      }
                    } else {
                      this.clearState(`track.${trk}.portName`)
                    }
                    /*                    this.interface.setParameter(`device.${dev}.channel`, choosenChannel)*/
                  }
                }
              }
            }
          } else {
            this.clearState(`track.${trk}.portName`)
            this.clearState(`track.${trk}.channel`)
          }
        }
      }
    }

    const trackBankOrProgramChange = (trk) => {
      return (elementPath, value, origin) => {
        if (origin != 'internal') {
          this.sendTrackProgramChange(trk)
        }
      }
    }



    const lfoShapeChange = (lfoIdx) => {
      const myLfoPhaseDetection = lfoPhaseDetection(lfoIdx)
      return (elementPath, value, origin) => {
        const list = this.interface.getElementAttribute(elementPath, 'list')
        this.setState(`lfo.${lfoIdx}.shapeName`, list[value])
        myLfoPhaseDetection(elementPath, value, origin)
      }
    }

    const lfoPhaseDetection = (lfoIdx)  => {
      return (elementPath, value, origin) => {
        if (phaseDetection && this.getState('playing') && this.lfoHistory.length >= 2) {
          const phaseDetectionShapes = ['sine', 'triangle', 'saw-up', 'saw-down']
          if (phaseDetectionShapes.indexOf(this.getState(`lfo.${lfoIdx}.shapeName`)) >= 0 /*&& phaseDetectionShapes.indexOf(oldShapeName) >= 0*/) {
            const value = this.lfoValue(lfoIdx)
            if (Number.isInteger(value)) {

              const phaseValues = []
              for (let p = 0; p <= 100; p++) {
                phaseValues[p] = this.lfoValue(lfoIdx, p)
              }

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
                let pDelta = Math.abs(pIndex - this.interface.getParameter(`lfo.${lfoIdx}.phase`, 0))

                for (let p = 0; p <= 100; p++) {
                  const diff = Math.abs(phaseValues[p] - value)
                  if (diff == pDiff) {
                    const delta = Math.abs(p - this.interface.getParameter(`lfo.${lfoIdx}.phase`, 0))
                    const pDir = (phaseValues[p] - phaseValues[p > 0 ? p - 1 : 100]) > 0 ? 1 : -1
                    const rDir = (this.lfoHistory[lfoIdx][0] - this.lfoHistory[lfoIdx][1]) > 0 ? 1 : -1
                    // debug('Diff pos %y  pDir:%y curr:%y prev:%y  rDir:%y history:%y',p,pDir,phaseValues[p],phaseValues[p>0?p-1:100],rDir,lfoHistory[l])
                    if (pDir == rDir && delta <= pDelta) { // Direction is same, prefer this re-position of Phase
                      pIndex = p
                      pDelta = delta
                      // debug('better %y %y',p,delta)
                    }
                  }
                }
                if (this.interface.getParameter(`lfo.${lfoIdx}.phase`) != pIndex) {
                  this.interface.setParameter(`lfo.${lfoIdx}.phase`, pIndex)
                  debug('Reposition Phase: %y', pIndex)
                }
              }
            }
          } else {
            // debug('NO %y %y',phaseDetectionShapes.indexOf(this.lfo[l].shapeName)>=0,phaseDetectionShapes.indexOf(oldShapeName)>=0)
          }
        }
      }
    }

    const matrixRemodulate = (slotIdx, destIdx) => {
      return (elementPath, value, origin) => {
        //        debug('Parameter Side Effect matrixRemodulate(%d,%d): Hello World! %y = %y (from %y)', slotIdx, destIdx, elementPath, value, origin)
        this.interface.matrixRemodulate(elementPath)
      }
    }

    const virusPart = (elementPath, value, origin) => {
      debug('Parameter Side Effect virusPart: Hello World! %y = %y (from %y)', elementPath, value, origin)
    }

    const virusLevel = (elementPath, value, origin) => {
      debug('Parameter Side Effect virusLevel: Hello World! %y = %y (from %y)', elementPath, value, origin)
      const portName = 'virus-ti'
      const part = this.interface.getParameter('virus.part', 1)
      const channel = part
      const bank = this.interface.getParameter('virus.bank')
      const program = this.interface.getParameter('virus.program')
      debugMidiControlChange('%s %d CC %y = %y', portName, channel, 7, value)
      Midi.send(portName, 'cc', {channel:channel - 1, controller:7, value}, 'levelChange-virus', 200)
    }

    const virusSendBankAndProgram = () => {
      const portName = 'virus-ti'
      const part = this.interface.getParameter('virus.part', 1)
      const channel = part
      const bank = this.interface.getParameter('virus.bank')
      const program = this.interface.getParameter('virus.program')
      debugMidiControlChange('%s %d CC %y = %y', portName, channel, 0, bank)
      Midi.send(portName, 'cc', {channel:channel - 1, controller:0, value:bank}, 'bankChange-virus', 200)
      debugMidiProgramChange('%s %d %y', portName, channel - 1, program)
      Midi.send(portName, 'program', {channel:channel - 1, number: program}, 'programChange-virus', 200)
    }

    const virusBank = (elementPath, value, origin) => {
      debug('Parameter Side Effect virusBank: Hello World! %y = %y (from %y)', elementPath, value, origin)
      virusSendBankAndProgram()
    }

    const virusProgram = (elementPath, value, origin) => {
      debug('Parameter Side Effect virusProgram: Hello World! %y = %y (from %y)', elementPath, value, origin)
      virusSendBankAndProgram()
    }

    const virusAxyz = (axyz) => {
      return (elementPath, value, origin) => {
//        debug('Parameter Side Effect virusAxyz(%y): Hello World! %y = %y (from %y)', axyz, elementPath, value, origin)
        const portName = 'virus-ti'
        const part = this.interface.getParameter('virus.part', 1)
        const channel = part
        const val= Math.round(Interface.remap(value,-1,1,0,127))
          debug(val)
        switch (axyz) {
        case 'x1':
          Midi.send(portName, 'cc', {channel:channel - 1, controller:17, value:val})
          Midi.send(portName, 'cc', {channel:channel - 1, controller:18, value:val})
          break
        case 'y1':
          Midi.send(portName, 'cc', {channel:channel - 1, controller:19, value:val})
          break
        case 'x2':
          debug(val)
          Midi.send(portName, 'cc', {channel:channel - 1, controller:41, value:val})
          break
        case 'y2':
          Midi.send(portName, 'cc', {channel:channel - 1, controller:42, value:val})
          Midi.send(portName, 'cc', {channel:channel - 1, controller:43, value:val})
          break
        case 'x3':
          Midi.send(portName, 'cc', {channel:channel - 1, controller:60, value:val})
          break
        case 'y3':
          Midi.send(portName, 'cc', {channel:channel - 1, controller:63, value:val})
          break
        case 'x4':
          Midi.send(portName, 'cc', {channel:channel - 1, controller:117, value:val})
          break
        case 'y4':
          Midi.send(portName, 'cc', {channel:channel - 1, controller:118, value:val})
          break
        }
      }
    }

    this.parameterSideEffects = {
      octaveChance: (elementPath, value, origin) => {
        /*        debug('Parameter Side Effect %y: Hello World! %y (from %y)', elementPath, value, origin)*/
        if (origin == 'surface' || !this.state.octaves) {
          this.state.octaves = []
          for (let idx = 0; idx < 16; idx++) {
            const octave = (Math.abs(value) > Machine.getRandomInt(100))
            this.state.octaves[idx] = (octave ? (value > 0 ? 1 : -1) : 0)
          }
        }
      },
      density: (elementPath, value, origin) => {
        /*        debug('Parameter Side Effect %y: Hello World! %y (from %y)', elementPath, value, origin)*/
        if (origin == 'surface' && value != 100) {
          this.interface.setParameter('muteSteps', 0)
        }
        if (origin == 'surface' || !this.state.sounding) {
          this.state.sounding = []
          for (let idx = 0; idx < 16; idx++) {
            this.state.sounding[idx] = (value && (value >= Machine.getRandomInt(100))) ? 1 : 0
          }
        }
      },
      muteSteps: (elementPath, value, origin) => {
        /*        debug('Parameter Side Effect %y: Hello World! %y (from %y)', elementPath, value, origin)*/
        if (origin == 'surface' && value != 0) {
          this.interface.setParameter('density', 100)
        }
        if (origin == 'surface' || !this.state.sounding && value > 0) {
          this.euclidian(this.interface.getParameter('muteSteps'), 16, this.interface.getParameter('muteShift'))
        }
      },
      muteShift: (elementPath, value, origin) => {
        /*        debug('Parameter Side Effect %y: Hello World! %y (from %y)', elementPath, value, origin)*/
        if (this.interface.getParameter('muteSteps') > 0) {
          if (origin == 'surface' || !this.state.sounding) {
            this.euclidian(this.interface.getParameter('muteSteps'), 16, this.interface.getParameter('muteShift'))
          }
        }
      },
      program: (elementPath, value, origin) => {
        if (origin == 'surface') {
          const presetFilesCount = Acid.presetFiles(this.state, true)
          if (value >= 0 && value < presetFilesCount) {
            const filename = this.load_preset(value)
            if (filename) {
              this.sendDeviceProgramChange('A')
              this.sendDeviceProgramChange('B')
              for (let trk = 0; trk < 6; trk++) {
                this.sendTrackProgramChange(trk)
              }
              this.interface.sendValues()
              this.writeState()
              debug('program: %y %y', value, path.basename(filename))
            }
          } else {
            debug('program: NOT PRESET %y', value)
          }
        }
      },

      device: {
        A: {
          device: deviceDeviceChange('A'),
          port: devicePortChange('A'),
          channel: deviceChannelChange('A'),
          bank: deviceBankOrProgramChange('A'),
          program: deviceBankOrProgramChange('A'),
        },
        B: {
          device: deviceDeviceChange('B'),
          port: devicePortChange('B'),
          channel: deviceChannelChange('B'),
          bank: deviceBankOrProgramChange('B'),
          program: deviceBankOrProgramChange('B'),
        },
      },

      track: [
        {
          device: trackDeviceChange(0),
          bank: trackBankOrProgramChange(0),
          program: trackBankOrProgramChange(0),
        },
        {
          device: trackDeviceChange(1),
          bank: trackBankOrProgramChange(1),
          program: trackBankOrProgramChange(1),
        },
        {
          device: trackDeviceChange(2),
          bank: trackBankOrProgramChange(2),
          program: trackBankOrProgramChange(2),
        },
        {
          device: trackDeviceChange(3),
          bank: trackBankOrProgramChange(3),
          program: trackBankOrProgramChange(3),
        },
        {
          device: trackDeviceChange(4),
          bank: trackBankOrProgramChange(4),
          program: trackBankOrProgramChange(4),
        },
        {
          device: trackDeviceChange(5),
          bank: trackBankOrProgramChange(5),
          program: trackBankOrProgramChange(5),
        },
      ],
      lfo: [
        {
          shape: lfoShapeChange(0),
          amount: lfoPhaseDetection(0),
          rate: lfoPhaseDetection(0),
          offset: lfoPhaseDetection(0),
          density: lfoPhaseDetection(0),
        },
        {
          shape: lfoShapeChange(1),
          amount: lfoPhaseDetection(1),
          rate: lfoPhaseDetection(1),
          offset: lfoPhaseDetection(1),
          density: lfoPhaseDetection(1),
        },
        {
          shape: lfoShapeChange(2),
          amount: lfoPhaseDetection(2),
          rate: lfoPhaseDetection(2),
          offset: lfoPhaseDetection(2),
          density: lfoPhaseDetection(2),
        },
      ],
      matrix: {
        slot: [
          {
            value: matrixRemodulate(0),
            destination: [
              {
                target: matrixRemodulate(0, 0),
                amount: matrixRemodulate(0, 0),
              },
              {
                target: matrixRemodulate(0, 1),
                amount: matrixRemodulate(0, 1),
              },
              {
                target: matrixRemodulate(0, 2),
                amount: matrixRemodulate(0, 2),
              },
            ],
          },
          {
            value: matrixRemodulate(1),
            destination: [
              {
                target: matrixRemodulate(1, 0),
                amount: matrixRemodulate(1, 0),
              },
              {
                target: matrixRemodulate(1, 1),
                amount: matrixRemodulate(1, 1),
              },
              {
                target: matrixRemodulate(1, 2),
                amount: matrixRemodulate(1, 2),
              },
            ],
          },
          {
            value: matrixRemodulate(2),
            destination: [
              {
                target: matrixRemodulate(2, 0),
                amount: matrixRemodulate(2, 0),
              },
              {
                target: matrixRemodulate(2, 1),
                amount: matrixRemodulate(2, 1),
              },
              {
                target: matrixRemodulate(2, 2),
                amount: matrixRemodulate(2, 2),
              },
            ],
          },
        ]
      },
      virus: {
        part: virusPart,
        level: virusLevel,
        bank: virusBank,
        program: virusProgram,
        axyz: {
          x1: virusAxyz('x1'),
          y1: virusAxyz('y1'),
          x2: virusAxyz('x2'),
          y2: virusAxyz('y2'),
          x3: virusAxyz('x3'),
          y3: virusAxyz('y3'),
          x4: virusAxyz('x4'),
          y4: virusAxyz('y4'),
        },
      },
    }



    const lfoControlDisplay = (lfoIdx) => {
      return (elementPath, value, origin, callback) => {
        if (value >= 128 && value <= 255) {
          const control = value - 128
          const names = [];
          ['A', 'B'].forEach( dev => {
            const deviceIdx = this.interface.getParameter(`device.${dev}.device`)
            if (deviceIdx > 0 && config.devices) {
              const deviceKeys = Object.keys(config.devices)
              if (deviceKeys.length > deviceIdx - 1) {
                const device = deviceKeys[deviceIdx - 1]
                const deviceColor = (dev == 'A') ? chalk.hex('#FF0000') : chalk.hex('#0000FF')
                names.push(deviceColor(`${dev}: ` + device + ' ' + _.get(deviceCCs, `${device}.${control}`)))
              }
            }
          } )
          //          debug('LFO %d Control: %s', lfoIdx + 1, names.length ? ` [ ${names.join(', ')} ]` : '')
          callback(`CC #${value - 128}` + (names.length ? ` [ ${names.join(', ')} ]` : ''))
        } else {
          const path = this.interface.getMapPath('external', 'cc', value)
          if (path) {
            const name = this.interface.getElementAttribute(path, 'name')
            callback(name ? name : path)
          }
        }
      }
    }

    this.displayHandlers = {
      lfo: [{
        control: lfoControlDisplay(0),
      }, {
        control: lfoControlDisplay(1),
      }, {
        control: lfoControlDisplay(2),
      }, ],

    }

    this.interface.on('parameterChange', (path, value, origin) => {
      if (origin == 'surface' && tableParameters.indexOf(path) >= 0) {
        /*        debug('parameterChange pattern because of %y',path)*/
        this.showPattern()
      }
    })

    this.interface.on('modulationChange', (path, value, reason) => {
      if (tableParameters.indexOf(path) >= 0) {
        /*        debug('modulationChange pattern because of %y',path)*/
        this.showPattern()
      }
    })

    this.interface.on('incoming', (msg, origin, channel) => {
      //     if (msg._type!='clock' /*&& origin!='clock'*/) debug('Incoming (from %y) ch.%y: %y',origin,channel,msg)
      /*      return*/
      let modSlotIdx
      let modSlotSource
      let modSlotValue

      // dedicated functions like beat & transpose
      if (!Number.isInteger(channel) || msg.channel == channel) {
        if (origin == 'transpose') {
          if (msg._type == 'noteoff') {
            const notes = this.interface.connection(origin).midiCache.playingNotes(channel ? channel : 0)
            if (!notes || notes.length == 0) {
              //              this.interface.setParameter('mute', 1)
            }
            if (notes && notes.length > 0) {
              notes.sort()
              this.interface.setParameter('transpose', notes[0] + 4, 'external')
            }
          }
          if (msg._type == 'noteon') {
            const notes = this.interface.connection(origin).midiCache.playingNotes(channel ? channel : 0)
            /*            debug('hi %y, %y',channel,notes)*/
            if (notes && notes.length > 0) {
              this.interface.setParameter('mute', 0)
              notes.sort()
              this.interface.setParameter('transpose', notes[0] + 4, 'external')
            }
            modSlotSource = matrixSlotSources.velocity
            modSlotValue = msg.velocity
          }
          if (msg._type == 'cc' && msg.controller == 1) {
            modSlotSource = matrixSlotSources.modWheel
            modSlotValue = msg.value
          }
          if (msg._type == 'channel aftertouch') {
            modSlotSource = matrixSlotSources.channelAftertouch
            modSlotValue = msg.pressure
          }
        }
        if (origin == 'clock' && msg.controller == beatCC && msg.value < 4) {
          const offbeatPulses =  (((this.pulses - 1) % 96) - (24 * msg.value))
          if (offbeatPulses) {
            let amend = 0
            if (this.pulses >= offbeatPulses ) {
              amend = - offbeatPulses
            } else {
              amend = 96 - offbeatPulses
            }
            if (amend) {
              debug('Amend pulses by %y at beat %y pulse %y offbeat %y', amend, (msg.value + 1), this.pulses, offbeatPulses)
              this.pulses += amend
            }
          }
        }
      }

      if (origin == 'external') {
        //        if (msg._type!='clock' /*&& origin!='clock'*/) debug('Incoming (from %y) ch.%y: %y',origin,channel,msg)

        if (Number.isInteger(msg.channel)) { // is it Voice Message?
          //debug('Incoming (from %y) ch.%y: %y',origin,channel,msg)
        }
      }

      if (modSlotSource) {
        for (let slotIdx = 0; slotIdx < 3; slotIdx++) {
          if (this.interface.getParameter(`matrix.slot.${slotIdx}.source`) == modSlotSource) {
            if (this.interface.getParameter(`matrix.slot.${slotIdx}.value`) !== modSlotValue) {
              this.matrixSetSlotValue(slotIdx, this.interface.getParameter(`matrix.slot.${slotIdx}.slewLimiter`, 0), matrixSetSlotValueTimout, modSlotValue)
            }
          }
        }
      }
    })
  }

  matrixSetSlotValue(slotIdx, step, timeout, newValue) {
    const valueDelta = (newValue - this.interface.getParameter(`matrix.slot.${slotIdx}.value`, 0)) / (step + 1)
    const stepValue = step ? Math.round(this.interface.getParameter(`matrix.slot.${slotIdx}.value`, 0) + valueDelta ) : newValue
    if (this.slewLimiterTimouts[slotIdx]) {
      clearTimeout(this.slewLimiterTimouts[slotIdx])
      this.slewLimiterTimouts[slotIdx] = null
    }
    //debug('matrixSetSlotValue slotIdx %y step %y timeout %y valueDelta %y currentValue %y stepValue %y newValue %y',slotIdx,step,timeout,valueDelta,_.get(state.values,`matrix.slot.${slotIdx}.value`,0),stepValue,newValue)
    if (this.interface.getParameter(`matrix.slot.${slotIdx}.value`, 0) != stepValue) {
      this.interface.setParameter(`matrix.slot.${slotIdx}.value`, stepValue)
      this.interface.matrixRemodulate('slewLimiter')
    }
    if (step > 0) {
      this.slewLimiterTimouts[slotIdx] = setTimeout( (slotIdx, step, timeout, newValue) => this.matrixSetSlotValue(slotIdx, step, timeout, newValue), timeout, slotIdx, step - 1, timeout, newValue)
    }
  }


  showPattern() {

    const pattern = this.getState('pattern')
    const size = this.getState('size')
    if (!pattern) {
      return
    }
    const accentedColor = chalk.bgHex('#FF8800')
    const normalColor = chalk.bgHex('#00BB00')
    const disabledColor = chalk.bgHex('#666666')

    const deviceAColor = chalk.hex('#FF0000')
    const deviceBColor = chalk.hex('#0000FF')
    //    const deviceAColor = chalk.hex('#F45C51')
    //    const deviceBColor = chalk.hex('#529DEC')

    let table = new Table(
      {
        head: [
          'Device',
          'Notes',
          {colSpan:size, content:pattern.header.name + `              normal ${normalColor('  ')}   accented ${accentedColor('  ')}   disabled ${disabledColor('  ')}`}
        ]
        /*,style:{head:[],border:[]}*/
      }
    )

    const notes = []
    pattern.tracks[0].notes.forEach( note => {
      if (notes.indexOf(note.midi) < 0) {
        notes.push(note.midi)
      }
    })
    notes.sort()
    notes.reverse()

    notes.forEach( noteMidi => {
      let midiNote = noteMidi
      const scaleMapping = scaleMappings.scales[this.interface.getParameter('scales', 'modulated')]
      const midiNoteFromBase = (midiNote + this.interface.getParameter('base', 'modulated')) % 12
      const midiNoteBase =  midiNote - midiNoteFromBase
      if (scaleMapping && scaleMapping.mapping[midiNoteFromBase] != midiNoteFromBase) {
        //                debug('scale: %s %y => %y',scaleMapping.name, midiNoteFromBase, scaleMapping.mapping[midiNoteFromBase])
        midiNote = (midiNoteBase + scaleMapping.mapping[midiNoteFromBase]) - this.interface.getParameter('base', 'modulated')
      }

      const noteMidiTransposed = midiNote + this.interface.getParameter('transpose', 'modulated')


      /*      debug('JJR: %y %y %y',(state && this.interface.getParameter('split','modulated') && noteMidiTransposed <= this.interface.getParameter('split','modulated')),this.interface.getParameter('split','modulated'),noteMidiTransposed)*/
      const arr = [
        {hAlign:'center', content:(this.interface.getParameter('split', 'modulated') && noteMidiTransposed <= this.interface.getParameter('split', 'modulated')) ? ((this.interface.getParameter('deviate', 'modulated') >= 50) ? deviceBColor('B') : deviceAColor('A')) : ((this.interface.getParameter('deviate', 'modulated') >= 50) ? deviceAColor('A') : deviceBColor('B')) },
        {hAlign:'center', content:TonalMidi.midiToNoteName(noteMidiTransposed - 12, { sharps: true })/*+` ${noteMidi}`*/}
      ]
      for (let ticks = 0; ticks < (size * ticksPerStep); ticks += ticksPerStep) {
        let shiftedTicks = (ticks + (ticksPerStep * -this.interface.getParameter('shift', 'modulated'))) % (ticksPerStep * 16)
        if (shiftedTicks < 0) {
          shiftedTicks += 1920
        }
        //debug ('ticks %y  shiftedTicks %y',ticks,shiftedTicks)
        let chNote = '  '
        pattern.tracks[0].notes.forEach( note => {
          if (note.midi  == noteMidi && note.ticks == shiftedTicks) {
            const count = Math.ceil(note.durationTicks / ticksPerStep)
            const color = this.getState('sounding')[ticks / ticksPerStep] ? (note.velocity == 1 ? accentedColor : normalColor) : disabledColor
            const rep = count * 2 + ((count - 1) * 3)
            chNote = {colSpan:count, content:color(' '.repeat(rep >= 0 ? rep : 0))}
            ticks += (count - 1) * ticksPerStep
          }
        })
        if (chNote) {
          arr.push(chNote)
        }
      }
      table.push(arr)
    })

    /*    console.log(table.toString())*/
    debug(table.toString())
  }

  sendDeviceProgramChange(dev) {
    const portName = this.getState(`device.${dev}.portName`)
    const channel = this.interface.getParameter(`device.${dev}.channel`, 1)
    const bank = this.interface.getParameter(`device.${dev}.bank`)
    const program = this.interface.getParameter(`device.${dev}.program`)
    debugMidiControlChange('%s %d CC %y = %y', portName, channel, 0, bank)
    Midi.send(portName, 'cc', {channel:channel - 1, controller:0, value:bank}, `bankChange-${dev}`, 200)
    debugMidiProgramChange('%s %d %y', portName, channel - 1, program)
    Midi.send(portName, 'program', {channel:channel - 1, number: program}, `programChange-${dev}`, 200)
  }

  sendTrackProgramChange(trk) {
    /*   console.trace('JJR:'+trk)*/
    const portName = this.getState(`track.${trk}.portName`)
    const channel = this.getState(`track.${trk}.channel`, 1)
    const bank = this.interface.getParameter(`track.${trk}.bank`)
    const program = this.interface.getParameter(`track.${trk}.program`)
    debugMidiControlChange('%s %d CC %y = %y', portName, channel - 1, 0, bank)
    Midi.send(portName, 'cc', {channel:channel - 1, controller:0, value:bank}, `bankChange-${trk}`, 200)
    debugMidiProgramChange('%s %d %y', portName, channel - 1, program)
    Midi.send(portName, 'program', {channel:channel - 1, number:program}, `programChange-${trk}`, 200)
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

  lfoValue(lfoIdx, phase /*optional*/) {
    let result
    if (this.interface.getParameter(`lfo.${lfoIdx}.control`) > 0 && this.interface.getParameter(`lfo.${lfoIdx}.amount`, 'modulated') && (this.interface.getParameter(`lfo.${lfoIdx}.control`) < 128 || (this.interface.getParameter(`lfo.${lfoIdx}.device.A`, 'modulated') || this.interface.getParameter(`lfo.${lfoIdx}.device.B`, 'modulated')))) {
      const factor = (this.interface.getParameter(`lfo.${lfoIdx}.amount`, 'modulated') / 100)
      const base = Math.floor((((100 - this.interface.getParameter(`lfo.${lfoIdx}.amount`, 'modulated')) / 100) * 128) / 2)
      const offset = Math.floor(base * (((this.interface.getParameter(`lfo.${lfoIdx}.offset`, 'modulated') - 50) ) / 50) )
      if (!Number.isInteger(phase)) {
        phase = this.interface.getParameter(`lfo.${lfoIdx}.phase`, 'modulated')
      }
      const mod = this.lfo( this.pulses, (128 - this.interface.getParameter(`lfo.${lfoIdx}.rate`, 'modulated')) * 4, this.getState(`lfo.${lfoIdx}.shapeName`), phase / 100)
      if (mod >= 0) {
        const value = Math.min(127, Math.max(0, Math.floor(( mod * factor) + base + offset )))
        result = Math.min(127, value)
      }
    }
    return result
  }

  euclidian(muteSteps, steps, muteShift) {
    function arrayRotate(arr, reverse) {
      if (reverse) {
        arr.unshift(arr.pop())
      } else {
        arr.push(arr.shift())
      }
      return arr
    }
    let pat = euclideanRhythms.getPattern(muteSteps, steps)
    if (muteShift) {
      let p = Math.abs(muteShift)
      while (--p) {
        pat = arrayRotate(pat, muteShift > 0)
      }
    }
    this.state.sounding = []
    for (let idx = 0; idx < steps; idx++) {
      this.state.sounding[idx] = !pat[idx] ? 1 : 0
    }
    return pat
  }

  load_preset(program) {
    const presetFiles = this.presetFiles()

    if (!program) {
      program = 0
    }
    if (program < 0) {
      program = 0
    }
    if (program > (presetFiles.length - 1)) {
      program = presetFiles.length - 1
    }
    const filename = presetFiles[program]
    if (filename) {
      const bank = this.interface.getParameter('bank', 0)
      const playing = this.state.playing
      this.readState(filename)
      this.interface.setParameter('bank', bank)
      this.interface.setParameter('program', program)
      this.state.playing = playing
      return filename
    }
  }

  presetFiles(count = false) {
    const files = glob.sync(path.resolve(
      ( (process.env.NODE_ENV == 'production') ? path.join(untildify('~/.electra-one'), 'state', 'acid', this.bankName(), 'presets') : path.join(__dirname, '..', 'state', 'acid', this.bankName(), 'presets') ) + '/*.json'), {})
    return count ? (Array.isArray(files) ? files.length : 0) : files
  }

  save_preset() {
    const presetFiles = this.presetFiles()
    const program = this.interface.getParameter('program')
    if (program < presetFiles.length) {
      const filePath = presetFiles[program]
      this.writeState(filePath)
      return filePath
    }
  }

  add_preset() {
    const name = `Acid - ${new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')}`
    const filePath = path.resolve((process.env.NODE_ENV == 'production') ? untildify(`~/.electra-one/state/acid/${this.bankName()}/presets/${name.replace(/:/g, '.')}.json`) : `${__dirname}/../state/acid/${this.bankName()}/presets/${name.replace(/:/g, '.')}.json`)
    this.writeState(filePath)
    this.interface.setParameter('program', this.presetFiles(true) - 1)
    return filePath
  }

  bankName() {
    return `bank-${_.padStart(this.interface.getParameter('bank', 0), 3, '0')}`
  }

  sequencer() {
    const deltaTime = process.hrtime(this.pulseTime)
    this.pulseTime = process.hrtime()

    const ticks = (this.pulses % (24 * 4)) * 20
    this.pulseDuration = (deltaTime[0] * 1000) + (deltaTime[1] / 1000000)

    const stepIdx = ticks / ticksPerStep
    if (this.getState('playing')) {

      const tickDuration = this.pulseDuration / 20
      let shiftedTicks = (ticks + (ticksPerStep * -this.interface.getParameter('shift', 'modulated'))) % (ticksPerStep * 16)
      if (shiftedTicks < 0) {
        shiftedTicks += 1920
      }

      if (!this.interface.getParameter('mute')) {

        const performancePaths = this.interface.getMap('external', 'cc') ? Object.values(this.interface.getMap('external', 'cc')) : []
        const oldValues = {}
        performancePaths.forEach( perfPath => {
          oldValues[perfPath] = this.interface.getParameter(perfPath, 'modulated')
        })

        this.interface.clearModulation('lfo')

        for (let l = 0; l < 3; l++) {
          let control = this.interface.getParameter(`lfo.${l}.control`)

          const value = this.lfoValue(l)
          if (Number.isInteger(value)) {
            const midiValue = Math.min(127, Math.max(0, value))

            const devs = []

            if (control < 128) {
              const path = this.interface.getMapPath('external', 'cc', control)
              if (path) {
                //debug('int control %d %y = %y %d', l, control, path, midiValue)

                if (!this.lfoHistory[l].length || this.lfoHistory[l][0] != midiValue) {
                  if (this.lfoHistory[l].unshift(midiValue) > 2) {
                    this.lfoHistory[l].splice(2)
                  }
                }

                //this.interface.setParameter(path, midiValue, 'external')

                let lfoControlCount = 0
                for (let j = 0; j < 3; j++) {
                  lfoControlCount += (this.interface.getParameter(`lfo.${j}.control`) == control ? 1 : 0)
                }
                const mod = Interface.remap(midiValue, 0, 127, 0.0, 1.0) / lfoControlCount
                /*                debug('mod %y=%y/%y',mod,midiValue,lfoControlCount)*/
                this.interface.setModulation('lfo', path, this.interface.getModulation('lfo', path, 0) + mod)

                // Can Electra handle many NRPN's?
                this.interface.setParameter(`lfo.${l}.show`, midiValue)
              }
            } else {
              control -= 128
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

                  const cacheValue = this.midiCache.getValue(this.getState(`device.${dev}.portName`), channel, 'cc', this.interface.getParameter(`lfo.${l}.control`) )
                  if (cacheValue != midiValue) {

                    debugMidiControlChange('%s %d CC %y = %y', this.getState(`device.${dev}.portName`), channel + 1, this.interface.getParameter(`lfo.${l}.control`), midiValue)
                    //                    debug('cc control %d %y = %d', l, control, midiValue)

                    if (!this.lfoHistory[l].length || this.lfoHistory[l][0] != midiValue) {
                      if (this.lfoHistory[l].unshift(midiValue) > 2) {
                        this.lfoHistory[l].splice(2)
                      }
                    }

                    Midi.send(this.getState(`device.${dev}.portName`), 'cc', {channel, controller:control, value:midiValue})
                    this.midiCache.setValue(this.getState(`device.${dev}.portName`), channel, 'cc', control, midiValue)

                    // Can Electra handle many NRPN's?
                    this.interface.setParameter(`lfo.${l}.show`, midiValue)
                    //sendNRPN(midiOutputName, config.acid.interface.lfo[l + 1].show.nrpn, 1, midiValue, 0, 50)
                  }
                }
              })
            }
          }
        }
        const newValues = {}
        performancePaths.forEach( perfPath => newValues[perfPath] = this.interface.getParameter(perfPath, 'modulated') )
        const deltaValues = Interface.difference(newValues, oldValues)

        //      debug('modulation impact: old %y new %y delta %y ', oldValues, newValues, deltaValues)

        const deltaKeys = Object.keys(deltaValues)

        if (deltaKeys.length) {
          deltaKeys.forEach( deltaKey => {
            this.interface.emit('modulationChange', deltaKey, deltaValues[deltaKey], 'lfo')
            //            debug('lfo modulation old: %y = %y', deltaKey, oldValues[deltaKey])
          })
          debug('LFO Modulation Impact: %y', deltaValues)
        }
      }
      if (this.getState('pattern') && !this.interface.getParameter('mute')) {
        this.getState('pattern').tracks[0].notes.forEach( (note) => {
          if (note.ticks == shiftedTicks) {

            if (stepIdx < this.state.sounding.length && this.state.sounding[stepIdx]) {
              let midiNote = note.midi

              const scaleMapping = scaleMappings.scales[this.interface.getParameter('scales', 'modulated')]
              const midiNoteFromBase = (midiNote + this.interface.getParameter('base', 'modulated')) % 12
              const midiNoteBase =  midiNote - midiNoteFromBase
              if (scaleMapping && scaleMapping.mapping[midiNoteFromBase] != midiNoteFromBase) {
                midiNote = (midiNoteBase + scaleMapping.mapping[midiNoteFromBase]) - this.interface.getParameter('base', 'modulated')
              }

              midiNote += this.interface.getParameter('transpose', 'modulated') + ((stepIdx < this.state.octaves.length && this.state.octaves[stepIdx]) ? (this.state.octaves[stepIdx] * 12) : 0)

              const switchSide = (this.interface.getParameter('deviate', 'modulated') && this.interface.getParameter('deviate', 'modulated') >= Machine.getRandomInt(100))
              const dev =  (midiNote <= this.interface.getParameter('split', 'modulated')) ? (switchSide ? 'B' : 'A') : (switchSide ? 'A' : 'B')
              //              debug('hi')
              if (!this.interface.getParameter(`device.${dev}.mute`) && this.getState(`device.${dev}.portName`) && this.interface.getParameter('probability', 'modulated') >= Machine.getRandomInt(100)) {
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
                const r = (note.durationTicks % ticksPerStep) * this.interface.getParameter('gate', 'modulated')
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
    }
    this.pulses++
  }

  deviceMenu() {
    if (config.devices) {
      const deviceMenu = [{
        label: 'Unknown',
        port: null,
        channel: -1,
      }]
      for (let deviceKey in config.devices) {
        let instance = config.devices[deviceKey].instance ? config.devices[deviceKey].instance : 'ch.#'
        const model = config.devices[deviceKey].model
        if (Array.isArray(config.devices[deviceKey].channels)) {
          for (let c in config.devices[deviceKey].channels) {
            if (Array.isArray(config.devices[deviceKey].instances) && config.devices[deviceKey].instances.length > c) {
              instance = config.devices[deviceKey].instances[c]
            }
            const label = config.devices[deviceKey].channels.length > 1 ? `${model} ${instance}` : model
            const rLabel = label.replace('#', config.devices[deviceKey].instance ? (parseInt(c) + 1) : config.devices[deviceKey].channels[c])
            deviceMenu.push({
              label: rLabel,
              port: Midi.normalisePortName(config.devices[deviceKey].port),
              channel: config.devices[deviceKey].channels[c],
            })
          }
        }
      }
      return deviceMenu
    }
  }
}

/*function setupMidi(options) {
  const scenario = _.get(config, `acid.scenarios.${options.scenario}`)
  if (scenario && scenario.actors) {
    const actors = Object.keys(scenario.actors)
    for (const actor of actors) {
      if (scenario.actors[actor].enabled && scenario.actors[actor].port && scenario.actors[actor].channels && scenario.actors[actor].channels.length) {
        const electraOnePortName = `electra-one-${scenario.actors[actor].port}`
        const midiInput_electraOne = Midi.input(electraOnePortName, true)
        midiInput_electraOne.on('message', handleIncoming(electraOnePortName, actor, false, {actor, ...scenario.actors[actor]}) )

        if (!scenario.actors[actor].oneway) {
          const midiInput_actor = Midi.input(actor, true)
          midiInput_actor.on('message', handleIncoming(actor, electraOnePortName, true, {actor, ...scenario.actors[actor]}) )
        }

        if (scenario.actors[actor].initialize) {
          for (const init in scenario.actors[actor].initialize) {
            Midi.send(init, 'sysex', doMapping(scenario.actors[actor].initialize[init]))
          }
        }
      }
    }
  } else {
    console.error(`Unknown scenario "${options.scenario}"`)
  }
}
*/

function acidSequencer(name, sub, options) {

  Midi.setupVirtualPorts(config.acid.virtual)

  const acidMachine = new AcidMachine('acid.v2')
  acidMachine.readState()
  acidMachine.writeState()

  acidMachine.connect(options.electra, 'surface')
  acidMachine.connect(options.general, 'external', Number.isInteger(options.generalChannel) ? parseInt(options.generalChannel) - 1 : 0)
  acidMachine.connect(options.clock, 'clock', 10 - 1)
  acidMachine.connect(options.transpose, 'transpose', Number.isInteger(options.transposeChannel) ? parseInt(options.transposeChannel) - 1 : 0)

  acidMachine.interface.emitParameters('post-connect')

  acidMachine.notesReset()
  acidMachine.interface.sendValues('surface')
  acidMachine.showPattern()
  //  debug('State %y', machine.getPreset())
  /*  debug('Options %y', options)*/

/*  setupMidi(options)*/
}

module.exports = {
  name: 'acid.v2',
  description: 'Acid Sequencer',
  examples: [
    {usage:'electra-one acid.v2', description:'Starts acid.v2 sequencer'},
  ],
  handler: acidSequencer,
}



