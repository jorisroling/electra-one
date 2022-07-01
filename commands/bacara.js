const debug = require('yves').debugger(require('../package.json').name + ':' + (require('change-case').paramCase(require('path').basename(__filename, '.js'))).replace(/-/g, ':'))

const config = require('config')
const os = require('os')
const easymidi = require('easymidi')
const glob = require('glob')
const path = require('path')

const _ = require('lodash')
const fs = require('fs-extra')
const jsonfile = require('jsonfile')
const deepSortObject = require('deep-sort-object')

const osc = require('osc')


const Random = require('../lib/random')

const Pattern = require('../lib/pattern')
const Drums = require('../lib/drums')

const Bacara = require('../lib/bacara')
const me = path.basename(__filename, '.js')

const Midi = require('../lib/midi/midi')
const semver = require('semver')

const { Midi:TonalMidi } = require('@tonaljs/tonal')

const bacaraPresetName = config.electra.presetName.bacara //'Bacara'
const Machine = require('../lib/midi/machine')
const Interface = require('../lib/midi/interface')
const MidiCache = require('../lib/midi/cache')
const untildify = require('untildify')

const yves = require('../lib/yves')
const pkg = require('../package.json')
const debugError = yves.debugger(`${pkg.name.replace(/^@/, '')}:${(require('change-case').paramCase(require('path').basename(__filename, '.js'))).replace(/-/g, ':')}:error`)
const debugLfo = yves.debugger(`${pkg.name.replace(/^@/, '')}:${(require('change-case').paramCase(require('path').basename(__filename, '.js'))).replace(/-/g, ':')}:lfo`)
const debugDispatch = yves.debugger(`${pkg.name.replace(/^@/, '')}:${(require('change-case').paramCase(require('path').basename(__filename, '.js'))).replace(/-/g, ':')}:dispatch`)
const debugMidi = yves.debugger(`${pkg.name.replace(/^@/, '')}:${(require('change-case').paramCase(require('path').basename(__filename, '.js'))).replace(/-/g, ':')}:midi`)
const debugMidiNoteOn = yves.debugger(`${pkg.name.replace(/^@/, '')}:${(require('change-case').paramCase(require('path').basename(__filename, '.js'))).replace(/-/g, ':')}:midi:note:on`)
const debugMidiNoteOff = yves.debugger(`${pkg.name.replace(/^@/, '')}:${(require('change-case').paramCase(require('path').basename(__filename, '.js'))).replace(/-/g, ':')}:midi:note:off`)
const debugMidiNoteError = yves.debugger(`${pkg.name.replace(/^@/, '')}:${(require('change-case').paramCase(require('path').basename(__filename, '.js'))).replace(/-/g, ':')}:midi:note:error`)
const debugMidiControlChange = yves.debugger(`${pkg.name.replace(/^@/, '')}:${(require('change-case').paramCase(require('path').basename(__filename, '.js'))).replace(/-/g, ':')}:midi:control:change`)
const debugMidiProgramChange = yves.debugger(`${pkg.name.replace(/^@/, '')}:${(require('change-case').paramCase(require('path').basename(__filename, '.js'))).replace(/-/g, ':')}:midi:program:change`)
const debugState = yves.debugger(`${pkg.name.replace(/^@/, '')}:${(require('change-case').paramCase(require('path').basename(__filename, '.js'))).replace(/-/g, ':')}:state`)
const debugDeviation = yves.debugger(`${pkg.name.replace(/^@/, '')}:${(require('change-case').paramCase(require('path').basename(__filename, '.js'))).replace(/-/g, ':')}:deviation`)
const debugOsc = yves.debugger(`${pkg.name.replace(/^@/, '')}:${(require('change-case').paramCase(require('path').basename(__filename, '.js'))).replace(/-/g, ':')}:osc`)

const debugMonome = yves.debugger(`${pkg.name.replace(/^@/, '')}:monome`)
const debugPattern = yves.debugger(`${pkg.name.replace(/^@/, '')}:${(require('change-case').paramCase(require('path').basename(__filename, '.js'))).replace(/-/g, ':')}:pattern`)

const DRUM_TRACKS = 11
const REDRUM_TRACKS = 12
const LFOS = 3
const GRID_MODE_NONE = 0
const GRID_MODE_MELODIC = 2
const GRID_MODE_DRUMS = 2

const euclideanRhythms = require('euclidean-rhythms')
const scaleMappings = require('../extra/scales/scales.json')

const chalk = require('chalk')
const { devices, knownDeviceCCs } = require('../lib/devices')
const deviceCCs = knownDeviceCCs()

const E1_FIRMWARE_PRESET_REQUEST_VERSION = 'v2.1.2'
let e1_system_info

const torsoT1OSC = require('../extra/osc/torso-t1.json')

const phaseDetection = true
const showPatternParameters = ['transpose', 'scales', 'base', 'split', 'shift', 'steps',
  'deviations.note.maximum', 'deviations.note.minimum', 'deviations.note.density', 'deviations.note.probability', 'deviations.note.euclidian', 'deviations.note.rotation',
  'deviations.velocity.maximum', 'deviations.velocity.minimum', 'deviations.velocity.density', 'deviations.velocity.probability', 'deviations.velocity.euclidian', 'deviations.velocity.rotation',
  'deviations.octave.maximum', 'deviations.octave.minimum', 'deviations.octave.density', 'deviations.octave.probability', 'deviations.octave.euclidian', 'deviations.octave.rotation',
  'deviations.duration.maximum', 'deviations.duration.minimum', 'deviations.duration.density', 'deviations.duration.probability', 'deviations.duration.euclidian', 'deviations.duration.rotation',
  'deviations.accent.density', 'deviations.accent.probability', 'deviations.accent.euclidian', 'deviations.accent.rotation',
  'deviations.mute.density', 'deviations.mute.probability', 'deviations.mute.euclidian', 'deviations.mute.rotation',
  'deviations.device.density', 'deviations.device.probability', 'deviations.device.euclidian', 'deviations.device.rotation',
]
const showPatternStates = []

const showDrumPatternParameters = ['drums.density', 'drums.velocity', 'drums.steps']

for (let trck = 0; trck < DRUM_TRACKS; trck++) {
  showDrumPatternParameters.push(`drums.instrument.${trck}.mute`)
}

for (let trck = 0; trck < REDRUM_TRACKS; trck++) {
  showDrumPatternParameters.push(`drums.redrum.${trck}.instrument`)
  showDrumPatternParameters.push(`drums.redrum.${trck}.mute`)
}

const showDrumPatternStates = ['drums.sounding']

const toneJSmidi = require('@tonejs/midi')

const Table = require('cli-table3')
const ticksPerStep = 120

const electra = require('../lib/electra')

const patternStepsDefault = 16

const matrixSetSlotValueTimout = 10
const matrixSlotSources = {
  off: 0,
  modWheel: 1,
  velocity: 2,
  channelAftertouch: 3,
}

const beatCC = 2 // -1 for off
const reverseDeviceBrowsOnGrid = true

const monodeInit = require('monode')

let monome = {
  led(x, y, s) {
  }
}

function radians(degrees) {
  return (degrees % 360) * (Math.PI / 180)
}

let bacaraEmitPart
let bacaraEmitTime
function bacaraEmit(portName, part, type, value, origin) {
  bacaraEmitTime = Date.now()
  bacaraEmitPart = part
  Bacara.event().emit('change', portName, part, type, value, origin, path.basename(__filename, '.js'))
}

class BacaraMachine extends Machine {
  constructor(name, options) {
    super(name)
    this.options = options
    this.pulseTime = [0, 0]
    this.pulses = 0
    this.stepIdx = -1
    this.drumsStepIdx = -1
    this.showPatternGrid(this.stepIdx)
    this.pulseDuration = 0
    this.midiCache = new MidiCache()
    this.lfoHistory = [[], [], []]
    this.slewLimiterTimouts = []

    this.remote = {}

    Bacara.event().on('change', (device, part, name, value, origin, command) => {
      if (/*command != me &&*/ device == 'virus-ti' && (part >= 1 && part <= 16)) {
        //debug('BACARA change %y - device: %y  part: %y  name: %y  value: %y  origin: %y command: %y',me,device, part, name, value, origin, command)
        if (name == 'bank-and-program') {
          ['A', 'B'].forEach( dev => {
            const portName = this.getState(`device.${dev}.portName`)
            const channel = this.interface.getParameter(`device.${dev}.channel`, 1)
            const bank = this.interface.getParameter(`device.${dev}.bank`)
            const program = this.interface.getParameter(`device.${dev}.program`)
            if (portName == device && channel == part) {
              if (value && value.bank) {
                this.interface.setParameter(`device.${dev}.bank`, value.bank)
              }
              if (value && value.program) {
                this.interface.setParameter(`device.${dev}.program`, value.program)
              }
            }
          })
          this.writeState()
        }
      }
    })
    //  }

    if (options.remote) {
      const midiInput_remote = Midi.input(options.remote)
      if (midiInput_remote) {
        midiInput_remote.on('message', (msg) => {

          /*          debug('msg %y',msg)*/
          switch (msg._type) {
          case 'cc':
            if (msg.channel == (this.options.remoteChannel - 1)) {
              let actionPath
              if (msg.controller == _.get(config, 'touchBlock.button.9.cc') && msg.value == 127) {
                actionPath = this.getState('remote.next', 'virus.search.part.0.next')
              }
              if (msg.controller == _.get(config, 'touchBlock.button.8.cc') && msg.value == 127) {
                actionPath = this.getState('remote.previous', 'virus.search.part.0.previous')
              }
              if (msg.controller == _.get(config, 'touchBlock.button.7.cc') && msg.value == 127) {
                actionPath = this.getState('remote.random', 'virus.search.part.0.random')
              }
              if (msg.controller == _.get(config, 'touchBlock.button.6.cc') && msg.value == 127) {
                actionPath = this.getState('remote.random_pattern', 'random_pattern')
              }
              if (msg.controller == _.get(config, 'touchBlock.button.5.cc') && msg.value == 127) {
                actionPath = this.getState('remote.recenter', 'virus.axyz.recenter')
              }
              if (msg.controller == _.get(config, 'touchBlock.button.4.cc') && msg.value == 127) {
                actionPath = this.getState('remote.nextBank', 'virus.mixer.part.0.nextBank')
              }
              if (msg.controller == _.get(config, 'touchBlock.button.3.cc') && msg.value == 127) {
                actionPath = this.getState('remote.previousBank', 'virus.mixer.part.0.previousBank')
              }
              if (msg.controller == _.get(config, 'touchBlock.button.2.cc') && msg.value == 127) {
                actionPath = this.getState('remote.next_pattern', 'next_pattern')
              }
              if (msg.controller == _.get(config, 'touchBlock.button.1.cc') && msg.value == 127) {
                actionPath = this.getState('remote.previous_pattern', 'previous_pattern')
              }
              if (msg.controller == _.get(config, 'touchBlock.button.0.cc') && msg.value == 127) {
                actionPath = this.getState('remote.remote_reset', 'remote_reset')
              }
              this.triggerAction(actionPath, 'remote')
            }
            break
          }
        })
      }
    }
    const devicePreviousBank = (dev) => (elementPath, origin) => {
      debug('devicePreviousBank %y', dev)
      this.setRemote(origin, {next:`device.${dev}.nextBank`, previous:`device.${dev}.previousBank`})
      const bank = this.interface.getParameter(`device.${dev}.bank`)
      if (bank > 0) {
        this.interface.setParameter(`device.${dev}.bank`, bank - 1)
        this.sendDeviceProgramChange(dev)
      }
    }
    const deviceNextBank = (dev) => (elementPath, origin) => {
      debug('deviceNextBank %y', dev)
      this.setRemote(origin, {next:`device.${dev}.nextBank`, previous:`device.${dev}.previousBank`})
      const bank = this.interface.getParameter(`device.${dev}.bank`)
      if (bank < 127) {
        this.interface.setParameter(`device.${dev}.bank`, bank + 1)
        this.sendDeviceProgramChange(dev)
      }
    }
    const devicePrevious = (dev) => (elementPath, origin) => {
      debug('devicePrevious %y', dev)
      this.setRemote(origin, {next:`device.${dev}.next`, previous:`device.${dev}.previous`})
      const program = this.interface.getParameter(`device.${dev}.program`)
      if (program > 0) {
        this.interface.setParameter(`device.${dev}.program`, program - 1)
        this.sendDeviceProgramChange(dev)
      }
    }
    const deviceNext = (dev) => (elementPath, origin) => {
      debug('deviceNext %y', dev)
      this.setRemote(origin, {next:`device.${dev}.next`, previous:`device.${dev}.previous`})
      const program = this.interface.getParameter(`device.${dev}.program`)
      if (program < 127) {
        this.interface.setParameter(`device.${dev}.program`, program + 1)
        this.sendDeviceProgramChange(dev)
      }
    }

    const drumsRedrumActions = (trck) => {
      return {
        generate: (elementPath, origin) => {
          if (origin == 'surface' || origin == 'remote') {
            const instrument = this.interface.getParameter(`drums.redrum.${trck}.instrument`) - 1
            //            debug ('hi track %y instr %y',trck,instrument)
            if (instrument >= 0) {
              //            debug ('hi2')
              this.setState('drums.patterns', Drums.generate(this.interface.getParameter('drums.steps'), this.interface.getParameter('drums.style'), instrument, this.getState('drums.patterns')))
              this.setState('drums.midi', Drums.midiFromPatterns(this.interface.getParameter('drums.steps'), this.getState('drums.patterns')))
              this.showDrumsPattern()
              this.writeState()
              debug('re-generated drums for track %y instrument %y', trck, Drums.instrumentName(instrument).toUpperCase())
            }
          }
        },
        preview: (elementPath, origin) => {
          //          debug('JJR2 %y %y', elementPath, origin)


          const info = deviceInfo(this.interface.getParameter(elementPath.replace('.preview', '.device')))  // HACKY


          const note = this.interface.getParameter(elementPath.replace('.preview', '.note'), -1)
          if (note >= 0) {
            Midi.send(info.portName, 'noteon', {
              note: note,
              velocity: 100,
              channel: info.channel,
              sendShadowMidiToBacaraPort: true,
              shadowChannel: 10,
            })

            Midi.send(info.portName, 'noteoff', {
              note: note,
              velocity: 100,
              channel: info.channel,
              sendShadowMidiToBacaraPort: true,
              shadowChannel: 10,
            })
          }
        },
      }
    }

    this.actionSideEffects = {
      clock: (elementPath, origin) => {
        if (origin == 'clock') {
          this.sequencer()
        }
      },
      start: (elementPath, origin) => {
        if (origin == 'clock') {
          this.setState('playing', true)
          this.pulses = 0
          this.stepIdx = 0
          this.drumsStepIdx = 0
          this.showPatternGrid(this.stepIdx)
          this.pulseTime = process.hrtime()
          this.writeState()
          debug('start')
        }
      },
      stop: (elementPath, origin) => {
        if (origin == 'clock') {
          this.setState('playing', false)
          this.showPatternGrid(this.stepIdx, false)
          this.stepIdx = -1
          this.drumsStepIdx = -1
          this.writeState()
          debug('stop')
        }
      },
      continue: (elementPath, origin) => {
        if (origin == 'clock') {
          this.setState('playing', true)
          this.pulseTime = process.hrtime()
          this.writeState()
          debug('continue')
        }
      },
      load: (elementPath, origin) => {
        if (origin == 'surface' || origin == 'remote') {
          this.interface.sendValues(origin)
          debug('load')
        }
      },
      remote_reset: (elementPath, origin) => {
        this.setState('remote', {})
      },
      generate: (elementPath, origin) => {
        if (origin == 'surface' || origin == 'remote') {
          const pattern = Pattern.generate(this.state, this.interface.getParameter('steps'))
          this.setState('pattern', pattern)
          this.interface.setParameter('pattern', Pattern.patternFiles(this.state, true) - 1)

          this.showPattern()
          this.writeState()
          debug('generated')
        }
      },
      previous_pattern: (elementPath, origin) => {
        if (origin == 'surface' || origin == 'remote') {
          this.setRemote(origin, {next:'next_pattern', previous:'previous_pattern', random:'random_pattern'})

          if (this.interface.getParameter('pattern', 0) > 0 ) {
            this.interface.setParameter('pattern', this.interface.getParameter('pattern', 0) - 1)
            const pattern = Pattern.load_pattern(this.state, this.interface.getParameter('pattern', 0))
            this.setState('pattern', pattern)
            this.interface.setParameter('steps', this.getState('patternSteps'))
            this.showPattern()
            this.writeState()
            debug('previous_pattern: %y', this.interface.getParameter('pattern'))
          }
        }
      },
      next_pattern: (elementPath, origin) => {
        if (origin == 'surface' || origin == 'remote') {
          this.setRemote(origin, {next:'next_pattern', previous:'previous_pattern', random:'random_pattern'})

          const count = Pattern.patternFiles(this.state, true)
          if (this.interface.getParameter('pattern', 0) < (count - 1)) {
            this.interface.setParameter('pattern', this.interface.getParameter('pattern', 0) + 1)

            const pattern = Pattern.load_pattern(this.state, this.interface.getParameter('pattern', 0))
            this.setState('pattern', pattern)
            this.interface.setParameter('steps', this.getState('patternSteps'))
            this.showPattern()
            this.writeState()
            debug('next_pattern: %y', this.interface.getParameter('pattern'))
          }
        }
      },
      random_pattern: (elementPath, origin) => {
        if (origin == 'surface' || origin == 'remote') {
          this.setRemote(origin, {next:'next_pattern', previous:'previous_pattern', random:'random_pattern'})

          const count = Pattern.patternFiles(this.state, true)
          this.interface.setParameter('pattern', Random.getRandomInt(count) )

          const pattern = Pattern.load_pattern(this.state, this.interface.getParameter('pattern', 0))
          this.setState('pattern', pattern)
          this.interface.setParameter('steps', this.getState('patternSteps'))
          this.showPattern()
          this.writeState()
          debug('random_pattern: %y', this.interface.getParameter('pattern'))
        }
      },
      previous_preset: (elementPath, origin) => {
        if (origin == 'surface' || origin == 'remote') {
          this.setRemote(origin, {next:'next_preset', previous:'previous_preset', random:'random_preset'})
          const program = this.interface.getParameter('program')
          if (program >= 1 && program < 128) {
            const filename = this.load_preset(program - 1)
            if (filename) {
              this.sendDeviceProgramChange('A')
              this.sendDeviceProgramChange('B')
              this.interface.sendValues('surface')
              this.showPattern()
              this.writeState()
              debug('previous_preset: %y %y', this.interface.getParameter('program'), path.basename(filename))
            }
          }
        }
      },
      next_preset: (elementPath, origin) => {
        if (origin == 'surface' || origin == 'remote') {
          this.setRemote(origin, {next:'next_preset', previous:'previous_preset', random:'random_preset'})
          const program = this.interface.getParameter('program')
          if (program >= 0 && program < 127) {
            const filename = this.load_preset(program + 1)
            if (filename) {
              this.sendDeviceProgramChange('A')
              this.sendDeviceProgramChange('B')
              this.interface.sendValues('surface')
              this.showPattern()
              this.writeState()
              debug('next_preset: %y %y', this.interface.getParameter('program'), path.basename(filename))
            }
          }
        }
      },
      random_preset: (elementPath, origin) => {
        if (origin == 'surface' || origin == 'remote') {
          this.setRemote(origin, {next:'next_preset', previous:'previous_preset', random:'random_preset'})
          const filename = this.load_preset(Random.getRandomInt(this.presetFiles(true)))
          if (filename) {
            this.sendDeviceProgramChange('A')
            this.sendDeviceProgramChange('B')
            this.interface.sendValues('surface')
            this.showPattern()
            this.writeState()
            debug('random_preset: %y %y', this.interface.getParameter('program'), path.basename(filename))
          }
        }
      },
      add_preset: (elementPath, origin) => {
        if (origin == 'surface' || origin == 'remote') {
          const filename = this.add_preset()
          debug('add_preset: %y', filename)
        }
      },
      save_preset: (elementPath, origin) => {
        if (origin == 'surface' || origin == 'remote') {
          const filename = this.save_preset()
          debug('save_preset: %y', filename)
        }
      },
      reset_preset: (elementPath, origin) => {
        if (origin == 'surface' || origin == 'remote') {
          this.interface.reset()
          this.showPattern()
          this.writeState()
        }
      },
      device: {
        A: {
          previousBank: devicePreviousBank('A'),
          nextBank: deviceNextBank('A'),
          previous: devicePrevious('A'),
          next: deviceNext('A'),
        },
        B: {
          previousBank: devicePreviousBank('B'),
          nextBank: deviceNextBank('B'),
          previous: devicePrevious('B'),
          next: deviceNext('B'),
        },
      },
      drums: {
        generate: (elementPath, origin) => {
          if (origin == 'surface' || origin == 'remote' || !this.getState('drums.patterns')) {
            this.setState('drums.patterns', Drums.generate(this.interface.getParameter('drums.steps'), this.interface.getParameter('drums.style'), -1, this.getState('drums.patterns')))
            this.setState('drums.midi', Drums.midiFromPatterns(this.interface.getParameter('drums.steps'), this.getState('drums.patterns')))
            this.showDrumsPattern()
            this.writeState()
            debug('generated drums')
          }
        },
        redrum: [
          drumsRedrumActions(0),
          drumsRedrumActions(1),
          drumsRedrumActions(2),
          drumsRedrumActions(3),
          drumsRedrumActions(4),
          drumsRedrumActions(5),
          drumsRedrumActions(6),
          drumsRedrumActions(7),
          drumsRedrumActions(8),
          drumsRedrumActions(9),
          drumsRedrumActions(10),
          drumsRedrumActions(11),
        ],
      },
    }

    const deviceDeviceChange = (dev) => {
      return (elementPath, value, origin) => {
        if (origin == 'post-connect') {
          this.ensureDevicePortName(dev)
        } else {
          if (value > 0 && config.devices) {
            let idx = 0
            let choosenDeviceKey
            let choosenChannel

            const deviceKeys = Object.keys(config.devices).filter( deviceKey => deviceKey != 'bacara' )
            deviceKeys.unshift('bacara')

            for (let deviceKey of deviceKeys) {
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

                  const midiNames = _.get(config, 'preset.midi.ports.output', []).map( port => port.name ) //easymidi.getOutputs()
                  if (midiNames) {
                    const idx = midiNames.indexOf(portName)
                    if (idx >= 0) {
                      this.interface.setParameter(`device.${dev}.port`, idx)
                      let name = midiNames[idx]

                      const ports = Object.keys(config.midi.ports).filter( p => _.get(config, `midi.ports.${p}.out.${os.platform()}`, _.get(config, `midi.ports.${p}.${os.platform()}`)) == name )
                      if (ports && ports.length == 1) {
                        name = ports[0]
                      }
                      this.setState(`device.${dev}.portName`, name)
                      this.interface.setParameter(`device.${dev}.channel`, choosenChannel)
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
      const port = this.interface.getParameter(`device.${dev}.port`)
      const portName = Midi.normalisePortName(Bacara.getPresetState(`midi.ports.output.${port}.name`), false, true)
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
        if (origin == 'post-connect') {
          debug('devicePortChange post-connect')
        } else {
          this.setState(`device.${dev}.portName`, Midi.normalisePortName(value))
          if (origin != 'internal') {
            devicePortOrChannelChanged(dev)
          }
        }
      }
    }

    const deviceChannelChange = (dev) => {
      return (elementPath, value, origin) => {
        if (origin == 'post-connect') {
          debug('deviceChannelChange post-connect')
        } else {
          if (origin != 'internal') {
            devicePortOrChannelChanged(dev)
          }
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

    /*    const trackDeviceChange = (trk) => {
      return (elementPath, value, origin) => {
        if (value > 0 && config.devices) {
          let idx = 0
          let choosenDeviceKey
          let choosenChannel
          const deviceKeys = Object.keys(config.devices).filter( deviceKey => deviceKey != 'bacara' )
          deviceKeys.unshift('bacara')

          for (let deviceKey of deviceKeys) {
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

          if (choosenDeviceKey && Number.isInteger(choosenChannel)) {
            this.setState(`track.${trk}.channel`, choosenChannel)

            const port = _.get(config, `devices.${choosenDeviceKey}.port`)
            if (port) {
              const portName = _.get(config, `midi.ports.${port}.${os.platform()}`)
              if (portName) {
                const midiNames = _.get(config, 'preset.midi.ports.output', []).map( port => port.name ) //easymidi.getOutputs()
                if (midiNames) {
                  const idx = midiNames.indexOf(portName)
                  if (idx >= 0) {
                    let name = midiNames[idx]
                    const ports = Object.keys(config.midi.ports).filter( p => config.midi.ports[p][os.platform()] == name )
                    if (ports && ports.length == 1) {
                      name = ports[0]
                    }
                    this.setState(`track.${trk}.portName`, name)
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
*/

    /*    const trackBankOrProgramChange = (trk) => {
      return (elementPath, value, origin) => {
        if (origin != 'internal') {
          this.sendTrackProgramChange(trk)
        }
      }
    }
*/


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
        this.interface.matrixRemodulate(elementPath)
      }
    }

    const drumDevice = (trck, type) => {
      return {
        device: (elementPath, value, origin) => {
          if (value > 0 && config.devices) {

            const info = deviceInfo(value)
            /*            debug('info %y',info)*/
            if (info.portName) {
              this.setState(`drums.${type}.${trck}.portName`, info.portName)
            }
            if (info.channel >= 0 ) {
              this.setState(`drums.${type}.${trck}.channel`, info.channel)
            }
          }
        },
        note: (elementPath, value, origin) => {
          /*          debug('yo %y %y %y',elementPath, value, origin)*/

          const info = deviceInfo(this.interface.getParameter(elementPath.replace('.note', '.device'))) // Hacky

          //          debug('info %y',info)
          Midi.send(info.portName, 'noteon', {
            note: value,
            velocity: 100,
            channel: info.channel,
            sendShadowMidiToBacaraPort: true,
            shadowChannel: 10,
          })

          Midi.send(info.portName, 'noteoff', {
            note: value,
            velocity: 100,
            channel: info.channel,
            sendShadowMidiToBacaraPort: true,
            shadowChannel: 10,
          })

        }
      }
    }

    //// DEVIATION FUNCTIONS

    this.deviationsValue = (type, step) => {
      const map = this.getState(`deviations.${type}`)
      let result = 0
      if (Array.isArray(map) && step < map.length) {
        result = map[step]
      }
      return result
    }


    this.deviationsPickFromRange = (type) => {
      let minimum
      let maximum
      if (this.interface.isParameter(`deviations.${type}.maximum`) && this.interface.isParameter(`deviations.${type}.minimum`)) {
        if (!maximum) {
          maximum = Math.max(this.interface.getParameter(`deviations.${type}.maximum`, 'modulated'), this.interface.getParameter(`deviations.${type}.minimum`, 'modulated'))
        }
        if (!minimum) {
          minimum = Math.min(this.interface.getParameter(`deviations.${type}.minimum`, 'modulated'), this.interface.getParameter(`deviations.${type}.maximum`, 'modulated'))
        }
      }
      if (typeof maximum == 'number' && typeof minimum == 'number') {
        do {
          const result = minimum + Random.getRandomInt(maximum - minimum)
          if (result) {
            return result
          }
        } while (maximum - minimum)
        return 0
      }
      return 1 // boolean deviation
    }

    this.deviationsEuclidian = (euclidianValue, steps, rotation) => {
      if (!euclidianValue) {
        euclidianValue = 0
      }
      if (!steps) {
        steps = 16
      }
      if (!rotation) {
        rotation = 0
      }
      const arrayRotate = (arr, reverse) => {
        if (reverse) {
          arr.unshift(arr.pop())
        } else {
          arr.push(arr.shift())
        }
        return arr
      }
      let pat = euclideanRhythms.getPattern(euclidianValue, steps)
      if (rotation) {
        let p = Math.abs(rotation)
        while (p--) {
          pat = arrayRotate(pat, rotation > 0)
        }
      }
      return pat
    }

    this.deviationsRotate = (type, originalValue) => {
      let rotation = this.interface.getParameter(`deviations.${type}.rotation`, 'modulated')
      if (typeof rotation == 'number') {
        rotation = rotation -  originalValue
      }
      let map = this.getState(`deviations.${type}`)
      if (map) {
        const arrayRotate = (arr, reverse) => {
          if (reverse) {
            arr.unshift(arr.pop())
          } else {
            arr.push(arr.shift())
          }
          return arr
        }
        if (rotation) {
          let p = Math.abs(rotation)
          while (p--) {
            map = arrayRotate(map, rotation > 0)
          }
        }
        /*
        const nonZero = map.reduce((partialSum, a) => partialSum + (a?1:0), 0);
        if (!nonZero) {
          map = null
        }*/
        this.setState(`deviations.${type}`, map)
        this.writeState()
        debugDeviation('rotate map for %y rotate %y (was %y) %y', type, rotation, originalValue, map && map.join(', '))
      }
    }

    this.deviationsRepopulate = (type) => {
      const map = this.getState(`deviations.${type}`) ? Array.from(this.getState(`deviations.${type}`)) : null
      let changes = 0
      if (map) {
        for (let i in map) {
          if (map[i]) {
            map[i] = this.deviationsPickFromRange(type)
            changes += (map[i] ? 1 : 0)
          }
        }
        if (changes) {
          this.setState(`deviations.${type}`, map)
          this.writeState()
          debugDeviation('repopulated map for %y (changes %y) %y', type, changes, map && map.join(', '))
        }
      }
    }

    this.deviationsGenerate = (type) => {
      let map = []
      const density = this.interface.getParameter(`deviations.${type}.density`, 'modulated')
      const euclidian = this.interface.getParameter(`deviations.${type}.euclidian`, 'modulated')
      const rotation = this.interface.getParameter(`deviations.${type}.rotation`, 'modulated')
      const steps = this.interface.getParameter('steps', 'modulated')
      const pat = euclidian ? this.deviationsEuclidian(euclidian, steps, rotation) : null
      if (density || euclidian) {
        for (let idx = 0; idx < steps; idx++) {
          if (density) {
            map[idx] = (density >= Random.getRandomInt(100)) ? this.deviationsPickFromRange(type) : 0
          } else if (euclidian) {
            map[idx] = (pat && pat[idx]) ? this.deviationsPickFromRange(type) : 0
          } else {
            map[idx] = 0
          }
        }
      } else {
        map = null
      }

      this.setState(`deviations.${type}`, map)
      this.writeState()
      debugDeviation('generated map for %y %y', type, map && map.join(', '))
    }

    ///////////////

    this.parameterEminentSideEffects = {
    }

    this.parameterSideEffects = {
      pattern: (elementPath, value, origin) => {
        const pattern = Pattern.load_pattern(this.state, value)
        this.setState('pattern', pattern)
        this.interface.setParameter('steps', this.getState('patternSteps'))
        this.showPattern()
        this.setRemote(origin, {next:'next_pattern', previous:'previous_pattern'})
        this.writeState()
        debug('pattern: %y', value)
      },
      program: (elementPath, value, origin) => {
        if (origin == 'surface' || origin == 'remote') {
          this.setRemote(origin, {next:'next_preset', previous:'previous_preset'})
          const presetFilesCount = Pattern.presetFiles(this.state, true)
          if (value >= 0 && value < presetFilesCount) {
            const filename = this.load_preset(value)
            if (filename) {
              this.sendDeviceProgramChange('A')
              this.sendDeviceProgramChange('B')
              this.interface.sendValues()
              this.writeState()
              debug('program: %y %y', value, path.basename(filename))
            }
          } else {
            debug('program: NOT PRESET %y', value)
          }
        }
      },

      deviations: {
        note: {
          maximum: (elementPath, value, origin) => {
            if (origin == 'surface') {
              this.deviationsRepopulate('note')
            }
          },
          minimum: (elementPath, value, origin) => {
            if (origin == 'surface') {
              this.deviationsRepopulate('note')
            }
          },
          density: (elementPath, value, origin) => {
            if (origin == 'surface' && value != 0) {
              this.interface.setParameter('deviations.note.euclidian', 0)
            }
            if (origin == 'surface') {
              this.deviationsGenerate('note')
            }
          },
          euclidian: (elementPath, value, origin) => {
            if (origin == 'surface' && value != 0) {
              this.interface.setParameter('deviations.note.density', 0)
            }
            if (origin == 'surface') {
              this.deviationsGenerate('note')
            }
          },
          rotation: (elementPath, value, origin, originalValue) => {
            if (origin == 'surface') {
              this.deviationsRotate('note', originalValue)
            }
          },
        },
        velocity: {
          maximum: (elementPath, value, origin) => {
            if (origin == 'surface') {
              this.deviationsRepopulate('velocity')
            }
          },
          minimum: (elementPath, value, origin) => {
            if (origin == 'surface') {
              this.deviationsRepopulate('velocity')
            }
          },
          density: (elementPath, value, origin) => {
            if (origin == 'surface' && value != 0) {
              this.interface.setParameter('deviations.velocity.euclidian', 0)
            }
            if (origin == 'surface') {
              this.deviationsGenerate('velocity')
            }
          },
          euclidian: (elementPath, value, origin) => {
            if (origin == 'surface' && value != 0) {
              this.interface.setParameter('deviations.velocity.density', 0)
            }
            if (origin == 'surface') {
              this.deviationsGenerate('velocity')
            }
          },
          rotation: (elementPath, value, origin, originalValue) => {
            if (origin == 'surface') {
              this.deviationsRotate('velocity', originalValue)
            }
          },
        },
        duration: {
          maximum: (elementPath, value, origin) => {
            if (origin == 'surface') {
              this.deviationsRepopulate('duration')
            }
          },
          minimum: (elementPath, value, origin) => {
            if (origin == 'surface') {
              this.deviationsRepopulate('duration')
            }
          },
          density: (elementPath, value, origin) => {
            if (origin == 'surface' && value != 0) {
              this.interface.setParameter('deviations.duration.euclidian', 0)
            }
            if (origin == 'surface') {
              this.deviationsGenerate('duration')
            }
          },
          euclidian: (elementPath, value, origin) => {
            if (origin == 'surface' && value != 0) {
              this.interface.setParameter('deviations.duration.density', 0)
            }
            if (origin == 'surface') {
              this.deviationsGenerate('duration')
            }
          },
          rotation: (elementPath, value, origin, originalValue) => {
            if (origin == 'surface') {
              this.deviationsRotate('duration', originalValue)
            }
          },
        },
        octave: {
          maximum: (elementPath, value, origin) => {
            if (origin == 'surface') {
              this.deviationsRepopulate('octave')
            }
          },
          minimum: (elementPath, value, origin) => {
            if (origin == 'surface') {
              this.deviationsRepopulate('octave')
            }
          },
          density: (elementPath, value, origin) => {
            if (origin == 'surface' && value != 0) {
              this.interface.setParameter('deviations.octave.euclidian', 0)
            }
            if (origin == 'surface') {
              this.deviationsGenerate('octave')
            }
          },
          euclidian: (elementPath, value, origin) => {
            if (origin == 'surface' && value != 0) {
              this.interface.setParameter('deviations.octave.density', 0)
            }
            if (origin == 'surface') {
              this.deviationsGenerate('octave')
            }
          },
          rotation: (elementPath, value, origin, originalValue) => {
            if (origin == 'surface') {
              this.deviationsRotate('octave', originalValue)
            }
          },
        },
        accent: {
          density: (elementPath, value, origin) => {
            if (origin == 'surface' && value != 0) {
              this.interface.setParameter('deviations.accent.euclidian', 0)
            }
            if (origin == 'surface') {
              this.deviationsGenerate('accent')
            }
          },
          euclidian: (elementPath, value, origin) => {
            if (origin == 'surface' && value != 0) {
              this.interface.setParameter('deviations.accent.density', 0)
            }
            if (origin == 'surface') {
              this.deviationsGenerate('accent')
            }
          },
          rotation: (elementPath, value, origin, originalValue) => {
            if (origin == 'surface') {
              this.deviationsRotate('accent', originalValue)
            }
          },
        },
        mute: {
          density: (elementPath, value, origin) => {
            if (origin == 'surface' && value != 0) {
              this.interface.setParameter('deviations.mute.euclidian', 0)
            }
            if (origin == 'surface') {
              this.deviationsGenerate('mute')
            }
          },
          euclidian: (elementPath, value, origin) => {
            if (origin == 'surface' && value != 0) {
              this.interface.setParameter('deviations.mute.density', 0)
            }
            if (origin == 'surface') {
              this.deviationsGenerate('mute')
            }
          },
          rotation: (elementPath, value, origin, originalValue) => {
            if (origin == 'surface') {
              this.deviationsRotate('mute', originalValue)
            }
          },
        },
        device: {
          density: (elementPath, value, origin) => {
            if (origin == 'surface' && value != 0) {
              this.interface.setParameter('deviations.device.euclidian', 0)
            }
            if (origin == 'surface') {
              this.deviationsGenerate('device')
            }
          },
          euclidian: (elementPath, value, origin) => {
            if (origin == 'surface' && value != 0) {
              this.interface.setParameter('deviations.device.density', 0)
            }
            if (origin == 'surface') {
              this.deviationsGenerate('device')
            }
          },
          rotation: (elementPath, value, origin, originalValue) => {
            if (origin == 'surface') {
              this.deviationsRotate('device', originalValue)
            }
          },
        },
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

      /*      track: [
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
*/
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
      /*      deviations: {
        note: {
        },
      },
*/      drums: {
        density: (elementPath, value, origin) => {
          if (origin == 'surface' || !this.getState('drums.sounding')) {
            const sounding = []
            for (let idx = 0; idx < this.interface.getParameter('drums.steps', 'modulated'); idx++) {
              sounding[idx] = []
              for (let instrument = 0; instrument < DRUM_TRACKS; instrument++) {
                sounding[idx][instrument] = (value && (value >= Random.getRandomInt(100))) ? 1 : 0
              }
            }
            this.setState('drums.sounding', sounding)
          }
        },
        instrument: [
          drumDevice(0, 'instrument'),
          drumDevice(1, 'instrument'),
          drumDevice(2, 'instrument'),
          drumDevice(3, 'instrument'),
          drumDevice(4, 'instrument'),
          drumDevice(5, 'instrument'),
          drumDevice(6, 'instrument'),
          drumDevice(7, 'instrument'),
          drumDevice(8, 'instrument'),
          drumDevice(9, 'instrument'),
          drumDevice(10, 'instrument'),
        ],
        redrum: [
          drumDevice(0, 'redrum'),
          drumDevice(1, 'redrum'),
          drumDevice(2, 'redrum'),
          drumDevice(3, 'redrum'),
          drumDevice(4, 'redrum'),
          drumDevice(5, 'redrum'),
          drumDevice(6, 'redrum'),
          drumDevice(7, 'redrum'),
          drumDevice(8, 'redrum'),
          drumDevice(9, 'redrum'),
          drumDevice(10, 'redrum'),
          drumDevice(11, 'redrum'),
        ],
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

    this.interface.on('parameterChange', (path, value, origin, originalValue) => {
      if (origin == 'surface' && showPatternParameters.indexOf(path) >= 0) {
        this.showPattern()
      }
      if (origin == 'surface' && showDrumPatternParameters.indexOf(path) >= 0) {
        this.showDrumsPattern()
      }
    })

    this.on('stateChange', (path, value, originalValue) => {
      /*      console.log(path,value)*/
      if (showPatternStates.indexOf(path) >= 0) {
        this.showPattern()
      }
      if (showDrumPatternStates.indexOf(path) >= 0) {
        this.showDrumsPattern()
      }
    })

    this.interface.on('modulationChange', (path, value, reason) => {
      if (showPatternParameters.indexOf(path) >= 0) {
        this.showPattern()
      }
      if (showDrumPatternParameters.indexOf(path) >= 0) {
        this.showDrumsPattern()
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
              this.showPattern()
            }
          }
          if (msg._type == 'noteon') {
            const notes = this.interface.connection(origin).midiCache.playingNotes(channel ? channel : 0)
            if (notes && notes.length > 0) {
              this.interface.setParameter('mute', 0)
              notes.sort()
              this.interface.setParameter('transpose', notes[0] + 4, 'external')
              this.showPattern()
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

  triggerAction(actionPath, origin) {
    if (actionPath) {
      const actionSideEffect = _.get(this.actionSideEffects, actionPath)
      if (typeof actionSideEffect == 'function') {
        debug('Trigger Action %y (origin %y)', actionPath, origin)
        actionSideEffect(path, origin)
      }
    }
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

  readState(filename, keepObj) {
    const filePath = filename ? filename : path.resolve( (process.env.NODE_ENV == 'production') ? untildify(`~/.electra-one/state/${this.name}.json`) : `${__dirname}/../state/${this.name}.json` )
    if (fs.existsSync(filePath)) {
      let json
      try {
        json = jsonfile.readFileSync(filePath)
      } catch (e) {
        console.error(e)
      }
      debugState('readState (%y) %y', filePath, json)
      if (json) {
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
          'remote',
          'drums',
          'deviations',
        ]
        paths.forEach( path => _.set(state, path, _.get(json.state ? json.state : json, path)) )
        this.setStates(state)
        if (!this.getState('redrum')) {
          for (let i = 0; i < REDRUM_TRACKS; i++) {
            this.setState(`redrum.${i}`, {portName: 'analog-rytm'})
          }
        }
        _.set(this.modulation, 'lfo', _.get(json, 'modulation.lfo', {}))
        _.set(this.modulation, 'matrix', _.get(json, 'modulation.matrix', {}))

        let parameters = (json.parameters ? json.parameters : json)
        if (keepObj) {
          _.merge(parameters, keepObj)
        }
        this.interface.setParameters(parameters)

        this.interface.emitParameters('post-connect')

        const deviations = ['note', 'velocity', 'octave', 'duration', 'accent', 'mute', 'device']
        const aspects = ['maximum', 'minimum', 'density', 'probability', 'euclidian', 'rotation']
        deviations.forEach( deviation => {
          let up = false
          aspects.forEach( aspect => {
            const value = this.interface.getParameter(`deviations.${deviation}.${aspect}`)
            if (value) {
              up = true
            }
          })

          const mapped = (typeof this.getState(`deviations.${deviation}`) != 'undefined')

          if ((up && !mapped) || (!up && mapped)) {
            debug('Regenerating %y map', deviation)
            this.deviationsGenerate(deviation)
          }
        })


        if (!this.getState('drums.midi')) {
          this.triggerAction('drums.generate', 'post-connect')
        }
      }
    }
  }

  writeState(filename) {
    const filePath = filename ? filename : path.resolve((process.env.NODE_ENV == 'production') ? untildify(`~/.electra-one/state/${this.name}.json`) : `${__dirname}/../state/${this.name}.json`)
    fs.ensureDirSync(path.dirname(filePath))
    const json = this.getPreset()
    jsonfile.writeFileSync(filePath, json, { flag: 'w', spaces: 2 })
    debugState('writeState (%y) %y', filePath, json)
    //      debug('writeState %y',filePath)
  }

  sendDeviceProgramChange(dev) {
    const portName = this.getState(`device.${dev}.portName`)
    const channel = this.interface.getParameter(`device.${dev}.channel`)
    const bank = this.interface.getParameter(`device.${dev}.bank`)
    const program = this.interface.getParameter(`device.${dev}.program`)

    debugMidiControlChange('port %s  channel %d  CC %y = %y', portName, channel, 0, bank)
    Midi.send(portName, 'cc', {channel:channel - 1, controller:0, value:bank}, `bankChange-${dev}`, 200)
    debugMidiProgramChange('port %s  channel %d  PC %y', portName, channel - 1, program)
    Midi.send(portName, 'program', {channel:channel - 1, number: program}, `programChange-${dev}`, 200)
  }

  notesReset() {
    ['A', 'B'].forEach( dev => {
      if (this.getState(`device.${dev}.portName`)) {
        const channel = this.interface.getParameter(`device.${dev}.channel`)
        for (let midiNote = 0; midiNote < 128; midiNote++) {
          debugMidiNoteOff('port %y  channel %y  note %y', this.getState(`device.${dev}.portName`), channel, midiNote)
          Midi.send(this.getState(`device.${dev}.portName`), 'noteoff', {
            note: midiNote,
            velocity: 127,
            channel: channel,
          })
        }
      }
    })
  }

  matrixSetSlotValue(slotIdx, step, timeout, newValue) {
    const valueDelta = (newValue - this.interface.getParameter(`matrix.slot.${slotIdx}.value`)) / (step + 1)
    const stepValue = step ? Math.round(this.interface.getParameter(`matrix.slot.${slotIdx}.value`) + valueDelta ) : newValue
    if (this.slewLimiterTimouts[slotIdx]) {
      clearTimeout(this.slewLimiterTimouts[slotIdx])
      this.slewLimiterTimouts[slotIdx] = null
    }
    //debug('matrixSetSlotValue slotIdx %y step %y timeout %y valueDelta %y currentValue %y stepValue %y newValue %y',slotIdx,step,timeout,valueDelta,_.get(state.values,`matrix.slot.${slotIdx}.value`,0),stepValue,newValue)
    if (this.interface.getParameter(`matrix.slot.${slotIdx}.value`) != stepValue) {
      this.interface.setParameter(`matrix.slot.${slotIdx}.value`, stepValue)
      this.interface.matrixRemodulate('slewLimiter')
      this.writeState()
    }
    if (step > 0) {
      this.slewLimiterTimouts[slotIdx] = setTimeout( (slotIdx, step, timeout, newValue) => this.matrixSetSlotValue(slotIdx, step, timeout, newValue), timeout, slotIdx, step - 1, timeout, newValue)
    }
  }

  showDrumsPattern() {
    const pattern = this.getState('drums.midi')
    const size = this.getState('drums.steps', 16)
    if (!pattern) {
      return
    }
    const accentedColor = chalk.bgHex('#FF8800')
    const normalColor = chalk.bgHex('#00BB00')
    const disabledColor = chalk.bgHex('#666666')

    const deviceDColor = chalk.hex('#333')
    const deviceRColor = chalk.hex('#FFFFFF')
    //    const deviceAColor = chalk.hex('#F45C51')
    //    const deviceBColor = chalk.hex('#529DEC')

    const grid = []

    let table = new Table(
      {
        head: [
          'Drum',
          {colSpan:size, content:pattern.header.name + `      normal ${normalColor('  ')}   accented ${accentedColor('  ')}   disabled ${disabledColor('  ')}`}
        ]
        /*,style:{head:[],border:[]}*/
      }
    )

    const notes = []
    _.get(pattern, 'tracks.0.notes', []).forEach( note => {
      if (notes.indexOf(note.midi) < 0) {
        notes.push(note.midi)
      }
    })
    notes.sort()
    notes.reverse()

    let row = 0
    notes.forEach( noteMidi => {
      let midiNote = noteMidi
      const instrument = midiNote - Drums.baseNote()
      let redrum = false
      for (let trck = 0; trck < REDRUM_TRACKS; trck++) {
        if (this.interface.getParameter(`drums.redrum.${trck}.instrument`) == ( instrument + 1 )  ) {
          redrum = true
        }
      }
      if (redrum) {
        grid[row] = []
        for (let col = 0; col < this.interface.getParameter('drums.steps'); col++) {
          grid[row][col] = false
        }
      }

      const deviceColor = redrum ? deviceRColor : deviceDColor

      const arr = [
        {hAlign:'center', content:deviceColor(Drums.instrumentName(instrument).toUpperCase()) },
      ]
      for (let ticks = 0; ticks < (size * ticksPerStep); ticks += ticksPerStep) {
        let chNote = '  '
        _.get(pattern, 'tracks.0.notes', []).forEach( note => {
          if (note.midi  == noteMidi && note.ticks == ticks) {
            const count = 1//Math.ceil(note.durationTicks / ticksPerStep)

            let velFactor = this.interface.getParameter('drums.velocity')
            if (Math.abs(velFactor) < Random.getRandomInt(100)) {
              velFactor = 0
            }
            const relVelocity = ((note.velocity + (velFactor >= 0 ? ((1.0 - note.velocity) * (velFactor / 100)) : ((note.velocity) * (velFactor / 100)) ) ) )
            const color = this.sounding(ticks / ticksPerStep, 'drums.sounding', instrument) ? (note.velocity == 1 ? chalk.bgHex(`#${Math.floor(relVelocity * 0xFF).toString(16).padStart(2, '0')}${Math.floor(relVelocity * 0x88).toString(16).padStart(2, '0')}00`) : chalk.bgHex(`#00${Math.floor(relVelocity * 0xFF).toString(16).padStart(2, '0')}00`)) : chalk.bgHex(`#${Math.floor(relVelocity * 0x66).toString(16).padStart(2, '0')}${Math.floor(relVelocity * 0x66).toString(16).padStart(2, '0')}${Math.floor(relVelocity * 0x66).toString(16).padStart(2, '0')}`)
            const rep = 2//count * 2 + ((count - 1) * 3)
            chNote = {colSpan:count, content:color(' '.repeat(rep >= 0 ? rep : 0))}
            if (redrum) {
              grid[row][Math.floor(ticks / ticksPerStep)] = relVelocity && this.sounding(ticks / ticksPerStep, 'drums.sounding', instrument) ? true : false
            }
            ticks += (count - 1) * ticksPerStep
          }
        })
        if (chNote) {
          arr.push(chNote)
        }
      }
      table.push(arr)
      if (redrum) {
        row++
      }
    })

    debugPattern(table.toString())
    /*    debug(grid)*/
    this.setState('drums.grid', grid)
    this.showPatternGrid(this.stepIdx)
  }

  showPattern() {

    //console.log('\x1Bc'); // Clear screen

    const pattern = this.getState('pattern')
    const size = this.interface.getParameter('steps')
    if (!pattern) {
      return
    }
    const accentedColor = chalk.bgHex('#FF8800')
    const normalColor = chalk.bgHex('#00BB00')
    const deviatedColor = chalk.bgHex('#BB0000')
    const disabledColor = chalk.bgHex('#666666')

    const deviationColor = chalk.hex('#00FF88')
    const deviationColorBg = chalk.bgHex('#00FF88')

    const deviceAColor = chalk.hex('#FF0000')
    const deviceBColor = chalk.hex('#0000FF')
    //    const deviceAColor = chalk.hex('#F45C51')
    //    const deviceBColor = chalk.hex('#529DEC')

    const grid = []

    /*          {colSpan:size, content:pattern.header.name + `            normal ${normalColor('  ')}   accented ${accentedColor('  ')}   disabled ${disabledColor('  ')}`}*/

    let table = new Table(
      {
        head: [
          'Device',
          'Note',
          {colSpan:size, hAlign:'right', content:`normal ${normalColor('  ')}   deviation ${deviationColorBg('  ')}   accented ${accentedColor('  ')}   muted ${disabledColor('  ')}`}
        ]
        /*,style:{head:[],border:[]}*/
      }
    );

    ['note', 'velocity', 'octave', 'duration', 'accent', 'mute', 'device'].forEach( deviation => {
      const map = this.getState(`deviations.${deviation}`)
      const probability = this.interface.getParameter(`deviations.${deviation}.probability`,'modulated')
      let arr = [
        {hAlign:'center', colSpan:2, content:deviationColor(deviation) },
      ]
      const minmax = (this.interface.isParameter(`deviations.${deviation}.maximum`) && this.interface.isParameter(`deviations.${deviation}.minimum`))
      if (map) {
        const minmax = (this.interface.isParameter(`deviations.${deviation}.maximum`) && this.interface.isParameter(`deviations.${deviation}.minimum`))
        arr = arr.concat((map ? map : []).map( e => e ? (probability && (!minmax || probability < 100) ? `${deviationColor(probability)}%` : minmax ? (deviationColor(e)) : (deviationColorBg('  '))) : '' ) )
        table.push(arr)
      } else if (probability) {
        arr = arr.concat({colSpan:this.interface.getParameter('steps', 'modulated'), hAlign:'center', content:`${deviationColor(probability)}%${minmax ? ` ( max: ${deviationColor(this.interface.getParameter(`deviations.${deviation}.maximum`))}  min: ${deviationColor(this.interface.getParameter(`deviations.${deviation}.minimum`))} )` : ''}`})
        table.push(arr)
      }

    })


    const notes = []

    _.get(pattern, 'tracks.0.notes', []).forEach( note => {
      let midiNote = note.midi

      let shiftedTicks = (note.ticks + (ticksPerStep * -this.interface.getParameter('shift', 'modulated'))) % (ticksPerStep * this.interface.getParameter('steps', 'modulated')) // steps?
      if (shiftedTicks < 0) {
        shiftedTicks +=  ticksPerStep * this.interface.getParameter('steps', 'modulated')
      }

      const addNote = this.deviationsValue('note', shiftedTicks / ticksPerStep)
      if ((midiNote + addNote) >= 0 && (midiNote + addNote) < 127) {
        midiNote += addNote
      }

      const octave = this.deviationsValue('octave', shiftedTicks / ticksPerStep)
      if ((midiNote + (octave * 12)) >= 0 && (midiNote + (octave * 12)) < 127) {
        midiNote += (octave * 12)
      }

      if (notes.indexOf(midiNote) < 0) {
        notes.push(midiNote)
      }
    })
    notes.sort()
    notes.reverse()

    let row = 0
    notes.forEach( noteMidi => {
      grid[row] = []
      for (let col = 0; col < this.interface.getParameter('steps'); col++) {
        grid[row][col] = false
      }

      let midiNote = noteMidi
      const scaleMapping = scaleMappings.scales[this.interface.getParameter('scales', 'modulated')]
      const midiNoteFromBase = (midiNote + this.interface.getParameter('base', 'modulated')) % 12
      const midiNoteBase =  midiNote - midiNoteFromBase
      if (scaleMapping && scaleMapping.mapping[midiNoteFromBase] != midiNoteFromBase) {
        //                debug('scale: %s %y => %y',scaleMapping.name, midiNoteFromBase, scaleMapping.mapping[midiNoteFromBase])
        midiNote = (midiNoteBase + scaleMapping.mapping[midiNoteFromBase]) - this.interface.getParameter('base', 'modulated')
      }

      const noteMidiTransposed = midiNote + this.interface.getParameter('transpose', 'modulated')


      const split = this.interface.getParameter('split', 'modulated') + this.interface.getParameter('transpose', 'modulated')
      let deviceA = (split && noteMidiTransposed > split)
      let deviceList = []
      for (let ticks = 0; ticks < (size * ticksPerStep); ticks += ticksPerStep) {
        let shiftedTicks = (ticks + (ticksPerStep * -this.interface.getParameter('shift', 'modulated'))) % (ticksPerStep * this.interface.getParameter('steps', 'modulated')) // steps?
        if (shiftedTicks < 0) {
          shiftedTicks +=  ticksPerStep * this.interface.getParameter('steps', 'modulated')
        }
        _.get(pattern, 'tracks.0.notes', []).forEach( note => {
          let deviatedNote = note.midi
          let addNote = this.deviationsValue('note', shiftedTicks / ticksPerStep)
          if ((deviatedNote + addNote) >= 0 && (deviatedNote + addNote) < 127) {
            deviatedNote += addNote
          } else {
            addNote = 0
          }
          const octave = this.deviationsValue('octave', shiftedTicks / ticksPerStep)
          if ((deviatedNote + (octave * 12)) >= 0 && (deviatedNote + (octave * 12)) < 127) {
            deviatedNote += (octave * 12)
          }

          if (deviatedNote  == noteMidi && note.ticks == shiftedTicks) {
            if (this.deviationsValue('device', shiftedTicks / ticksPerStep)) {
              deviceList.push([deviceA ? deviceBColor('B') : deviceAColor('A')])
            } else {
              deviceList.push([deviceA ? deviceAColor('A') : deviceBColor('B')])
            }
          }
        })
      }

      const arr = [
        {hAlign:'center', content:deviceList.join(' ') },
        {hAlign:'center', content:TonalMidi.midiToNoteName(noteMidiTransposed - 12, { sharps: true })/*+` ${noteMidi}`*/}
      ]


      for (let ticks = 0; ticks < (size * ticksPerStep); ticks += ticksPerStep) {
        let shiftedTicks = (ticks + (ticksPerStep * -this.interface.getParameter('shift', 'modulated'))) % (ticksPerStep * this.interface.getParameter('steps', 'modulated')) // steps?
        if (shiftedTicks < 0) {
          shiftedTicks +=  ticksPerStep * this.interface.getParameter('steps', 'modulated')
        }
        //debug ('ticks %y  shiftedTicks %y',ticks,shiftedTicks)
        let chNote = '  '
        _.get(pattern, 'tracks.0.notes', []).forEach( note => {

          let deviatedNote = note.midi

          let addNote = this.deviationsValue('note', shiftedTicks / ticksPerStep)
          if ((deviatedNote + addNote) >= 0 && (deviatedNote + addNote) < 127) {
            deviatedNote += addNote
          } else {
            addNote = 0
          }

          let octave = this.deviationsValue('octave', shiftedTicks / ticksPerStep)
          if ((deviatedNote + (octave * 12)) >= 0 && (deviatedNote + (octave * 12)) < 127) {
            deviatedNote += (octave * 12)
          } else {
            octave = 0
          }


          if (deviatedNote  == noteMidi && note.ticks == shiftedTicks) {

            const durationDeviation = this.deviationsValue('duration', shiftedTicks / ticksPerStep)
            const durationFactor = (1.0 + (Math.max(-90, durationDeviation) / 100))

            if (durationFactor < 0.1) {
              durationFactor
            }
            /*            console.log(durationFactor,note.durationTicks,Math.floor(note.durationTicks * durationFactor),ticksPerStep)*/
            const durationTicks =  Math.floor(note.durationTicks * durationFactor)




            const count = Math.ceil(durationTicks / ticksPerStep)
            const mute = this.deviationsValue('mute', ticks / ticksPerStep)


            let velocity = (note.velocity * 127) + (this.deviationsValue('velocity', ticks / ticksPerStep))
            if (velocity < 0) {
              velocity = 0
            }
            if (velocity > 127) {
              velocity = 127
            }

            const soundColor = addNote ? chalk.bgHex(`#${Math.floor(velocity).toString(16).padStart(2, '0')}BB00`) : chalk.bgHex(`#00${Math.floor(velocity).toString(16).padStart(2, '0')}00`)

            const noSoundColor = chalk.bgHex(`#${Math.floor(velocity).toString(16).padStart(2, '0')}${Math.floor(velocity).toString(16).padStart(2, '0')}${Math.floor(velocity).toString(16).padStart(2, '0')}`)

            let accent = this.deviationsValue('accent', ticks / ticksPerStep)

            const color = !mute ? ((velocity == 127 || accent) ? accentedColor : soundColor/*normalColor*/) : noSoundColor/*disabledColor*/

            const rep = count * 2 + ((count - 1) * 3)
            chNote = {colSpan:count, content:color(' '.repeat(rep >= 0 ? rep : 0))}
            grid[row][Math.floor(ticks / ticksPerStep)] = this.sounding(ticks / ticksPerStep) ? true : false
            ticks += (count - 1) * ticksPerStep
          }
        })
        if (chNote) {
          arr.push(chNote)
        }
      }
      /*      if (deviceA && reverseDeviceBrowsOnGrid) {
        for (let col = 0; col < grid[row].length; col++) {
          grid[row][col] = !grid[row][col]
        }
      }
*/
      table.push(arr)
      row++
    })

    debugPattern(table.toString())
    /*    debug(grid)*/
    this.setState('pattern.grid', grid)
    this.showPatternGrid(this.stepIdx)
  }

  showPatternGrid(step, showCursor = true) {
    const mode = this.interface.getParameter('grid', 'modulated')
    const prefix = mode == GRID_MODE_DRUMS ? 'drums.grid' : 'pattern.grid'
    const offset =  Math.floor((step < 0 ? 0 : step) / monome.width) * monome.width

    for (let row = 0; row < monome.height; row++) {
      for (let col = 0; col < monome.width; col++) {
        let on = mode ? this.getState(`${prefix}.${row}.${col + offset}`) : false
        if (mode && showCursor && step >= 0 && step == (col + offset) /*&& Array.isArray(this.getState(`pattern.grid.${row}`)) && col<this.getState(`pattern.grid.${row}`).length*/ && row == monome.height - 1) {
          on = !on
        }
        monome.led((monome.height - row) - 1, col, on ? 1 : 0)
      }
    }
  }


  lfo(step, stepsPerCycle, shape, phase) {
    let cycleStep = ((step + 0) + (((phase + 0.0) % 1.0) * stepsPerCycle)) % stepsPerCycle
    //    debug('JJ lfo: step: %y  stepsPerCycle: %y  shape: %y  phase: %y  cycleStep: %y',step, stepsPerCycle, shape, phase, cycleStep)
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
      return Random.getRandomInt(127)
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

  ensureDevicePortName(dev) {
    const name = this.getState(`device.${dev}.portName`)
    /*    debug('ensureDevicePortName %y (%y)',dev,name)*/
    const channel = this.interface.getParameter(`device.${dev}.channel`)

    const deviceKeys = Object.keys(config.devices).filter( deviceKey => deviceKey != 'bacara' )
    deviceKeys.unshift('bacara')

    let idx = 0
    for (let deviceKey of deviceKeys) {
      if (Array.isArray(config.devices[deviceKey].channels)) {
        for (let c in config.devices[deviceKey].channels) {
          idx++
          //            debug(`device.${dev}.device %y %y %y`, idx, name, channel)
          if (deviceKey == name && config.devices[deviceKey].channels[c] == channel) {
            /*            debug(`device.${dev}.device %y (%y)`, idx,name)*/
            this.interface.setParameter(`device.${dev}.device`, idx)

            if (deviceKey && Number.isInteger(channel)) {
              const port = _.get(config, `devices.${deviceKey}.port`)
              if (port) {
                const portName = _.get(config, `midi.ports.${port}.${os.platform()}`)

                if (portName) {

                  const midiNames = _.get(config, 'preset.midi.ports.output', []).map( port => port.name ) //easymidi.getOutputs()
                  if (midiNames) {
                    const idx = midiNames.indexOf(portName)
                    if (idx >= 0) {
                      this.interface.setParameter(`device.${dev}.port`, idx)
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
      const bank = this.interface.getParameter('bank')
      const playing = this.getState('playing')
      const remote = this.getState('remote')
      this.readState(filename, {bank, program})
      this.setState('playing', playing)
      this.setState('remote', remote)
      this.ensureDevicePortName('A')
      this.ensureDevicePortName('B')
      return filename
    }
  }

  presetFiles(count = false) {
    const files = glob.sync(path.resolve(
      ( (process.env.NODE_ENV == 'production') ? path.join(untildify('~/.electra-one'), 'state', 'bacara', this.bankName(), 'presets') : path.join(__dirname, '..', 'state', 'bacara', this.bankName(), 'presets') ) + '/*.json'), {})
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
    const name = `Bacara - ${new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')}`
    const filePath = path.resolve((process.env.NODE_ENV == 'production') ? untildify(`~/.electra-one/state/bacara/${this.bankName()}/presets/${name.replace(/:/g, '.')}.json`) : `${__dirname}/../state/bacara/${this.bankName()}/presets/${name.replace(/:/g, '.')}.json`)
    this.writeState(filePath)
    this.interface.setParameter('program', this.presetFiles(true) - 1)
    return filePath
  }

  bankName() {
    return `bank-${_.padStart(this.interface.getParameter('bank'), 3, '0')}`
  }

  sequencer() {
    const deltaTime = process.hrtime(this.pulseTime)
    this.pulseTime = process.hrtime()

    const ticks = (this.pulses % ((24 * 4) * (this.interface.getParameter('steps') / 16))) * 20
    this.pulseDuration = (deltaTime[0] * 1000) + (deltaTime[1] / 1000000)

    this.stepIdx = ticks / ticksPerStep

    if (this.getState('playing')) {

      const tickDuration = this.pulseDuration / 20
      let shiftedTicks = (ticks + (ticksPerStep * -this.interface.getParameter('shift', 'modulated'))) % (ticksPerStep * this.interface.getParameter('steps'))
      if (shiftedTicks < 0) {
        shiftedTicks += ticksPerStep * this.interface.getParameter('steps')
      }

      if (!this.interface.getParameter('mute')) {

        const performancePaths = this.interface.getMap('external', 'cc') ? Object.values(this.interface.getMap('external', 'cc')) : []
        const oldValues = {}
        performancePaths.forEach( perfPath => {
          oldValues[perfPath] = this.interface.getParameter(perfPath, 'modulated')
        })

        this.interface.clearModulation('lfo')

        for (let l = 0; l < LFOS; l++) {
          let control = this.interface.getParameter(`lfo.${l}.control`)

          const value = this.lfoValue(l)
          if (Number.isInteger(value)) {
            const midiValue = Math.min(127, Math.max(0, value))

            const devs = []

            if (control < 128) {
              const path = this.interface.getMapPath('external', 'cc', control)
              if (path) {

                if (!this.lfoHistory[l].length || this.lfoHistory[l][0] != midiValue) {
                  if (this.lfoHistory[l].unshift(midiValue) > 2) {
                    this.lfoHistory[l].splice(2)
                  }
                }

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
                  const portName = this.getState(`device.${dev}.portName`)
                  const channel = this.interface.getParameter(`device.${dev}.channel`) - 1
                  const pth = `port_${portName}.channel_${_.padStart(channel + 1, 2, '0')}.controller_${_.padStart(this.interface.getParameter(`lfo.${l}.control`), 3, '0')}`

                  const cacheValue = this.midiCache.getValue(portName, channel, 'cc', this.interface.getParameter(`lfo.${l}.control`) )
                  if (cacheValue != midiValue) {

                    debugMidiControlChange('port %s  channel %d  CC %y = %y', portName, channel + 1, this.interface.getParameter(`lfo.${l}.control`), midiValue)
                    //                    debug('cc control %d %y = %d', l, control, midiValue)

                    if (!this.lfoHistory[l].length || this.lfoHistory[l][0] != midiValue) {
                      if (this.lfoHistory[l].unshift(midiValue) > 2) {
                        this.lfoHistory[l].splice(2)
                      }
                    }

                    Midi.send(portName, 'cc', {
                      channel,
                      controller:control,
                      value:midiValue,
                      sendShadowMidiToBacaraPort: true,
                      shadowChannel: dev == 'A' ? 0 : 1,
                    })
                    this.midiCache.setValue(portName, channel, 'cc', control, midiValue)

                    // Can Electra handle many NRPN's?
                    this.interface.setParameter(`lfo.${l}.show`, midiValue)
                  }
                }
              })
            }
          }
        }
        const newValues = {}
        performancePaths.forEach( perfPath => newValues[perfPath] = this.interface.getParameter(perfPath, 'modulated') )
        const deltaValues = Interface.difference(newValues, oldValues)

        const deltaKeys = Object.keys(deltaValues)

        if (deltaKeys.length) {
          deltaKeys.forEach( deltaKey => {
            this.interface.emit('modulationChange', deltaKey, deltaValues[deltaKey], 'lfo')
          })
          debugLfo('Modulation Impact: %y', deltaValues)
        }
      }

      if (Math.floor(this.stepIdx) === this.stepIdx) {
        this.showPatternGrid(this.stepIdx)
      }
      if (this.getState('pattern') && !this.interface.getParameter('mute')) {
        _.get(this.getState('pattern'), 'tracks.0.notes', []).forEach( note => {
          if (note.ticks == shiftedTicks) {

            if (this.stepIdx < this.interface.getParameter('steps', 'modulated') /*&& this.sounding(this.stepIdx)*/) {

              // DEVIATIONS MUTE
              let midiMute = false
              const deviationMuteProbability = this.interface.getParameter('deviations.mute.probability', 'modulated')
              const deviationMuteMap = this.getState('deviations.mute')
              if (Array.isArray(deviationMuteMap) && deviationMuteMap.length > this.stepIdx) {
                if (deviationMuteMap[this.stepIdx]) {
                  if (deviationMuteProbability) {
                    midiMute = (deviationMuteProbability >= Random.getRandomInt(100)) ? 1 : 0
                  } else {
                    midiMute = deviationMuteMap[this.stepIdx]
                  }
                }
              } else {
                if (deviationMuteProbability) {
                  midiMute = (deviationMuteProbability >= Random.getRandomInt(100)) ? 1 : 0
                }
              }
              if (!midiMute) {

                let midiNote = note.midi

                // DEVIATIONS NOTE
                const deviationNoteProbability = this.interface.getParameter('deviations.note.probability', 'modulated')
                const deviationNoteMap = this.getState('deviations.note')
                if (Array.isArray(deviationNoteMap) && deviationNoteMap.length > this.stepIdx) {
                  if (deviationNoteMap[this.stepIdx]) {
                    if (deviationNoteProbability) {
                      const addNote = (Math.abs(deviationNoteProbability) >= Random.getRandomInt(100)) ? (deviationNoteProbability < 0 ? this.deviationsPickFromRange('note') : deviationNoteMap[this.stepIdx]) : 0
                      if ((midiNote + addNote) >= 0 && (midiNote + addNote) <= 127) {
                        midiNote += addNote
                      }
                    } else {
                      const addNote = deviationNoteMap[this.stepIdx]
                      if ((midiNote + addNote) >= 0 && (midiNote + addNote) <= 127) {
                        midiNote += addNote
                      }
                    }
                  }
                } else {
                  if (deviationNoteProbability) {
                    const addNote = (Math.abs(deviationNoteProbability) >= Random.getRandomInt(100)) ? this.deviationsPickFromRange('note') : 0
                    if ((midiNote + addNote) >= 0 && (midiNote + addNote) <= 127) {
                      midiNote += addNote
                    }
                  }
                }
                if (midiNote >= 0 && midiNote <= 127) {
                  const scaleMapping = scaleMappings.scales[this.interface.getParameter('scales', 'modulated')]
                  const midiNoteFromBase = (midiNote + this.interface.getParameter('base', 'modulated')) % 12
                  const midiNoteBase =  midiNote - midiNoteFromBase
                  if (scaleMapping && scaleMapping.mapping[midiNoteFromBase] != midiNoteFromBase) {
                    midiNote = (midiNoteBase + scaleMapping.mapping[midiNoteFromBase]) - this.interface.getParameter('base', 'modulated')
                  }

                  // DEVIATIONS DEVICE
                  const deviationDeviceProbability = this.interface.getParameter('deviations.device.probability', 'modulated')
                  const deviationDeviceMap = this.getState('deviations.device')
                  //                const switchSide = (this.interface.getParameter('deviations.device.density', 'modulated') && this.interface.getParameter('deviations.device.density', 'modulated') >= Random.getRandomInt(100))
                  let switchSide = false
                  if (Array.isArray(deviationDeviceMap) && deviationDeviceMap.length > this.stepIdx) {
                    if (deviationDeviceMap[this.stepIdx]) {
                      if (deviationDeviceProbability) {
                        switchSide = (deviationDeviceProbability >= Random.getRandomInt(100)) ? 1 : 0
                      } else {
                        switchSide = deviationDeviceMap[this.stepIdx]
                      }
                    }
                  } else {
                    if (deviationDeviceProbability) {
                      switchSide = (deviationDeviceProbability >= Random.getRandomInt(100)) ? 1 : 0
                    }
                  }

                  const split = this.interface.getParameter('split', 'modulated') + this.interface.getParameter('transpose', 'modulated')
                  const dev =  (midiNote > split) ? (switchSide ? 'B' : 'A') : (switchSide ? 'A' : 'B')

                  midiNote += this.interface.getParameter('transpose', 'modulated') + this.interface.getParameter(`device.${dev}.transpose`, 'modulated')

                  // DEVIATIONS OCTAVE
                  let midiOctave = 0
                  const deviationOctaveProbability = this.interface.getParameter('deviations.octave.probability', 'modulated')
                  const deviationOctaveMap = this.getState('deviations.octave')
                  if (Array.isArray(deviationOctaveMap) && deviationOctaveMap.length > this.stepIdx) {
                    if (deviationOctaveMap[this.stepIdx]) {
                      if (deviationOctaveProbability) {
                        midiOctave = (Math.abs(deviationOctaveProbability) >= Random.getRandomInt(100)) ? (deviationOctaveProbability < 0 ? this.deviationsPickFromRange('octave') : deviationOctaveMap[this.stepIdx]) : 0
                      } else {
                        midiOctave = deviationOctaveMap[this.stepIdx]
                      }
                    }
                  } else {
                    if (deviationOctaveProbability) {
                      midiOctave = (Math.abs(deviationOctaveProbability) >= Random.getRandomInt(100)) ? this.deviationsPickFromRange('octave') : 0
                    }
                  }
                  if ((midiNote + (midiOctave * 12)) >= 0 && (midiNote + (midiOctave * 12)) <= 127) {
                    midiNote += (midiOctave * 12)
                  }

                  if (midiNote >= 0 && midiNote <= 127) {

                    // DEVIATIONS VELOCITY
                    let midiVelocity = 127 * note.velocity
                    const deviationVelocityProbability = this.interface.getParameter('deviations.velocity.probability', 'modulated')
                    const deviationVelocityMap = this.getState('deviations.velocity')
                    if (Array.isArray(deviationVelocityMap) && deviationVelocityMap.length > this.stepIdx) {
                      if (deviationVelocityMap[this.stepIdx]) {
                        if (deviationVelocityProbability) {
                          midiVelocity += (Math.abs(deviationVelocityProbability) >= Random.getRandomInt(100)) ? (deviationVelocityProbability < 0 ? this.deviationsPickFromRange('velocity') : deviationVelocityMap[this.stepIdx]) : 0
                        } else {
                          midiVelocity += deviationVelocityMap[this.stepIdx]
                        }
                      }
                    } else {
                      if (deviationVelocityProbability) {
                        midiVelocity += (Math.abs(deviationVelocityProbability) >= Random.getRandomInt(100)) ? this.deviationsPickFromRange('velocity') : 0
                      }
                    }


                    // DEVIATIONS ACCENT
                    let midiAccent = false
                    const deviationAccentProbability = this.interface.getParameter('deviations.accent.probability', 'modulated')
                    const deviationAccentMap = this.getState('deviations.accent')
                    if (Array.isArray(deviationAccentMap) && deviationAccentMap.length > this.stepIdx) {
                      if (deviationAccentMap[this.stepIdx]) {
                        if (deviationAccentProbability) {
                          midiAccent = (deviationAccentProbability >= Random.getRandomInt(100)) ? 1 : 0
                        } else {
                          midiAccent = deviationAccentMap[this.stepIdx]
                        }
                      }
                    } else {
                      if (deviationAccentProbability) {
                        midiAccent = (deviationAccentProbability >= Random.getRandomInt(100)) ? 1 : 0
                      }
                    }
                    if (midiAccent) {
                      midiVelocity = 127
                    }


                    if (midiVelocity < 0) {
                      midiVelocity = 0
                    }
                    if (midiVelocity > 127) {
                      midiVelocity = 127
                    }


                    // DEVIATIONS DURATION
                    let midiDuration = note.durationTicks
                    const deviationDurationProbability = this.interface.getParameter('deviations.duration.probability', 'modulated')
                    const deviationDurationMap = this.getState('deviations.duration')
                    if (Array.isArray(deviationDurationMap) && deviationDurationMap.length > this.stepIdx) {
                      if (deviationDurationMap[this.stepIdx]) {
                        if (deviationDurationProbability) {
                          midiDuration += midiDuration * (((Math.abs(deviationDurationProbability) >= Random.getRandomInt(100)) ? (deviationDurationProbability < 0 ? this.deviationsPickFromRange('duration') : deviationDurationMap[this.stepIdx]) : 100) / 100)
                        } else {
                          midiDuration += midiDuration * (deviationDurationMap[this.stepIdx] / 100)
                        }
                      }
                    } else {
                      if (deviationDurationProbability) {
                        midiDuration += midiDuration * (((Math.abs(deviationDurationProbability) >= Random.getRandomInt(100)) ? this.deviationsPickFromRange('duration') : 5) / 100)
                      }
                    }

                    /*                                debug('duration %y (was %y)',midiDuration,note.durationTicks)*/

                    /*                  console.log(`note ${midiNote} velo ${midiVelocity}  ${this.interface.getParameter('base', 'modulated')}`)*/

                    const portName = this.getState(`device.${dev}.portName`)
                    if (portName && !this.interface.getParameter(`device.${dev}.mute`, 'modulated')) {
                      const deviceNotes = this.getState(`device.${dev}.notes`, 0)
                      let channelAdd = this.getState(`device.${dev}.channelAdd`, 0)
                      const dispatch = this.interface.getParameter(`device.${dev}.dispatch`, 'modulated')
                      let dispatchMode
                      let dispatchValue
                      if (dispatch == 0) { // OFF
                        dispatchMode = 'off'
                        dispatchValue = 0
                        channelAdd = 0
                      } else if (dispatch >= 1 && dispatch <= 15) { // ROUND ROBIN
                        dispatchMode = 'round robin'
                        dispatchValue = dispatch + 1
                        channelAdd = (dispatch ? (deviceNotes % dispatchValue) : 0)
                      } else if (dispatch >= 16 && dispatch <= 30) { // RANDOM
                        dispatchMode = 'random'
                        dispatchValue = (dispatch - 16 ) + 2
                        channelAdd = Random.getRandomInt(dispatchValue - 1)
                      } else if (dispatch >= 31 && dispatch <= 45) { // OTHER
                        dispatchMode = 'other'
                        dispatchValue = (dispatch - 31) + 2
                        let tmp
                        do {
                          tmp = Random.getRandomInt(dispatchValue - 1)
                        } while (channelAdd == tmp)
                        channelAdd = tmp
                      }
                      this.setState(`device.${dev}.channelAdd`, channelAdd)
                      const channel = ((this.interface.getParameter(`device.${dev}.channel`, 'modulated') - 1) + channelAdd) % 16
                      this.setState(`device.${dev}.notes`, deviceNotes + 1)
                      debugMidiNoteOn('port %s  channel %d  note %y    ', portName, channel + 1, midiNote)

                      //                      debugDispatch('device %y  step %y  base %y  dispatch %y  mode %y  value %y  add %y  channel %y note %y velocity %y duration %y %s',dev,this.stepIdx,this.interface.getParameter(`device.${dev}.channel`, 'modulated'),dispatch,dispatchMode,dispatchValue,channelAdd,channel+1,midiNote,midiVelocity,midiDuration,midiVelocity==127?(`accent ${midiAccent} deviationAccentProbability ${deviationAccentProbability} map ${(deviationAccentMap || []).join(',')} deviationVelocityProbability ${deviationVelocityProbability}`):'')
                      debugDispatch('device %y  step %y  base %y  dispatch %y  mode %y  value %y  add %y  channel %y note %y velocity %y duration %y', dev, this.stepIdx, this.interface.getParameter(`device.${dev}.channel`, 'modulated'), dispatch, dispatchMode, dispatchValue, channelAdd, channel + 1, midiNote, midiVelocity, midiDuration)

                      if (this.midiCache.getValue(portName, channel, 'note', midiNote)) {
                        Midi.send(portName, 'noteoff', {
                          note: midiNote,
                          velocity: 127,
                          channel: channel,
                          sendShadowMidiToBacaraPort: true,
                          shadowChannel: dev == 'A' ? 0 : 1,
                        })
                      }



                      Midi.send(portName, 'noteon', {
                        note: midiNote,
                        velocity: midiVelocity,
                        channel: channel,
                        sendShadowMidiToBacaraPort: true,
                        shadowChannel: dev == 'A' ? 0 : 1,
                      })
                      this.midiCache.setValue(portName, channel, 'note', midiNote, true)

                      const durationMs = Math.floor(midiDuration / ticksPerStep) * ticksPerStep

                      setTimeout((portName, midiNote, channel, shadowChannel) => {
                        debugMidiNoteOff('port %s  channel %d  note %y    ', portName, channel + 1, midiNote)
                        Midi.send(portName, 'noteoff', {
                          note: midiNote,
                          velocity: 127,
                          channel,
                          sendShadowMidiToBacaraPort: true,
                          shadowChannel,
                        })
                        this.midiCache.clearValue(portName, channel, 'note', midiNote)
                      }, durationMs, portName, midiNote, channel, dev == 'A' ? 0 : 1)
                    }
                  } else {
                    debugMidiNoteError('MIDI B note out of range: %y', midiNote)
                  }
                } else {
                  debugMidiNoteError('MIDI A note out of range: %y', midiNote)
                }
              }
            }
          }
        })
      }



      const drum_ticks = (this.pulses % ((24 * 4) * (this.interface.getParameter('drums.steps') / 16))) * 20
      this.drumsStepIdx = drum_ticks / ticksPerStep

      let drumsShiftedTicks = (ticks + (ticksPerStep * -this.interface.getParameter('shift', 'modulated'))) % (ticksPerStep * this.interface.getParameter('drums.steps'))
      if (drumsShiftedTicks < 0) {
        drumsShiftedTicks += ticksPerStep * this.interface.getParameter('drums.steps')
      }

      if (this.getState('drums.midi') && !this.interface.getParameter('drums.mute', 'modulated')) {
        _.get(this.getState('drums.midi'), 'tracks.0.notes', []).forEach( note => {
          if (note.ticks == drumsShiftedTicks) {
            const instrument = note.midi - Drums.baseNote()
            if (this.drumsStepIdx < this.interface.getParameter('drums.steps', 'modulated') && this.sounding(this.drumsStepIdx, 'drums.sounding', instrument)) {
              if (instrument >= 0 && instrument < DRUM_TRACKS) {
                if (!this.interface.getParameter(`drums.instrument.${instrument}.mute`, 'modulated') && this.interface.getParameter('drums.probability', 'modulated') >= Random.getRandomInt(100)) {
                  const portName = this.getState(`drums.instrument.${instrument}.portName`, 'bacara')
                  const channel = this.getState(`drums.instrument.${instrument}.channel`, 10 - 1)
                  const midiNote = this.interface.getParameter(`drums.instrument.${instrument}.note`/*, 'modulated'*/)
                  debugMidiNoteOn('port %s  channel %d  note %y  instrument %y  ', portName, channel + 1, midiNote, instrument)
                  if (this.midiCache.getValue(portName, channel, 'note', midiNote)) {
                    Midi.send(portName, 'noteoff', {
                      note: midiNote,
                      velocity: 127,
                      channel: channel,
                      sendShadowMidiToBacaraPort: true,
                      shadowChannel: 9,
                    })
                  }
                  let velFactor = this.interface.getParameter('drums.velocity', 'modulated')
                  if (Math.abs(velFactor) < Random.getRandomInt(100)) {
                    velFactor = 0
                  }
                  const velocity = (127 * (note.velocity + (velFactor >= 0 ? ((1.0 - note.velocity) * (velFactor / 100)) : ((note.velocity) * (velFactor / 100)) ) ) )
                  /*                  debug('velocity %y %y %y',note.velocity,velFactor,velocity)*/
                  /*                  debug('cha.%y  instr.%y  note.%y',channel,instrument,midiNote)*/
                  Midi.send(portName, 'noteon', {
                    note: midiNote,
                    velocity,
                    channel,
                    sendShadowMidiToBacaraPort: true,
                    shadowChannel: 9,
                  })
                  this.midiCache.setValue(portName, channel, 'note', midiNote, true)

                  const durationMs = Math.floor(note.durationTicks / ticksPerStep) * ticksPerStep
                  const r = (note.durationTicks % ticksPerStep) * 1.0
                  setTimeout((portName, midiNote, channel) => {
                    debugMidiNoteOff('port %s  channel %d  note %y    ', portName, channel + 1, midiNote)
                    Midi.send(portName, 'noteoff', {
                      note: midiNote,
                      velocity: 127,
                      channel: channel,
                      sendShadowMidiToBacaraPort: true,
                      shadowChannel: 9,
                    })
                    this.midiCache.clearValue(portName, channel, 'note', midiNote)
                  }, durationMs + r, portName, midiNote, channel)
                }
                for (let trck = 0; trck < REDRUM_TRACKS; trck++) {
                  if (this.interface.getParameter(`drums.redrum.${trck}.instrument`, 'modulated') == (instrument + 1 )) {
                    if (!this.interface.getParameter(`drums.redrum.${trck}.mute`, 'modulated') && this.getState(`drums.redrum.${trck}.portName`) && this.interface.getParameter('drums.probability', 'modulated') >= Random.getRandomInt(100)) {
                      const portName = this.getState(`drums.redrum.${trck}.portName`)
                      const channel = this.getState(`drums.redrum.${trck}.channel`, 9)
                      const midiNote = this.interface.getParameter(`drums.redrum.${trck}.note`, 'modulated')
                      debugMidiNoteOn('port %s  channel %d  note %y  track %y  ', portName, channel + 1, midiNote, trck)
                      //console.log(`drums: ${midiNote}  drums.redrum.${trck}.mute = ${this.interface.getParameter(`drums.redrum.${trck}.mute`, 'modulated')}`)

                      //                    debug('track %y inst %y  port %y  tinst %y channel %y',trck,instrument,this.getState(`drums.redrum.${trck}.portName`),this.interface.getParameter(`drums.redrum.${trck}.instrument`, 'modulated'),channel)

                      if (this.midiCache.getValue(portName, channel, 'note', midiNote)) {
                        Midi.send(portName, 'noteoff', {
                          note: midiNote,
                          velocity: 127,
                          channel: channel,
                          sendShadowMidiToBacaraPort: true,
                          shadowChannel: 9,
                        })
                      }
                      let velFactor = this.interface.getParameter('drums.velocity', 'modulated')
                      if (Math.abs(velFactor) < Random.getRandomInt(100)) {
                        velFactor = 0
                      }
                      const velocity = (127 * (note.velocity + (velFactor >= 0 ? ((1.0 - note.velocity) * (velFactor / 100)) : ((note.velocity) * (velFactor / 100)) ) ) )
                      /*                      debug('velocity %y %y %y',note.velocity,velFactor,velocity)*/
                      Midi.send(portName, 'noteon', {
                        note: midiNote,
                        velocity: velocity,
                        channel: channel,
                        sendShadowMidiToBacaraPort: true,
                        shadowChannel: 9,
                      })
                      this.midiCache.setValue(portName, channel, 'note', midiNote, true)

                      const durationMs = Math.floor(note.durationTicks / ticksPerStep) * ticksPerStep
                      const r = (note.durationTicks % ticksPerStep) * 1.0
                      setTimeout((portName, midiNote, channel) => {
                        debugMidiNoteOff('port %s  channel %d  note %y    ', portName, channel + 1, midiNote)
                        Midi.send(portName, 'noteoff', {
                          note: midiNote,
                          velocity: 127,
                          channel: channel,
                          sendShadowMidiToBacaraPort: true,
                          shadowChannel: 9,
                        })
                        this.midiCache.clearValue(portName, channel, 'note', midiNote)
                      }, durationMs + r, portName, midiNote, channel)
                    }
                  }
                }
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
      const deviceKeys = Object.keys(config.devices).filter( deviceKey => deviceKey != 'bacara' )
      deviceKeys.unshift('bacara')

      for (let deviceKey of deviceKeys) {
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


  sounding(step, path = 'sounding', instrument) {
    const arr = this.getState(path)
    if (Array.isArray(arr) && step >= 0) {
      if ((step < arr.length) && Array.isArray(arr[step]) && Number.isInteger(instrument)) {
        return (instrument < arr[step].length) ? arr[step][instrument] : 1
      } else {
        return (step < arr.length) ? arr[step] : 1
      }
    }
  }

  setRemote(origin, options) {
    if (origin == 'surface') {
      for (let key in options) {
        this.setState(`remote.${key}`, options[key])
      }
    }
  }
}


function deviceInfo(value) {
  let idx = 0

  const result = {}
  const deviceKeys = Object.keys(config.devices).filter( deviceKey => deviceKey != 'bacara' )
  deviceKeys.unshift('bacara')

  for (let deviceKey of deviceKeys) {
    if (Array.isArray(config.devices[deviceKey].channels)) {
      for (let c in config.devices[deviceKey].channels) {
        idx++
        if (idx == value) {
          result.deviceKey = deviceKey
          result.channel = config.devices[deviceKey].channels[c] - 1
        }
      }
    }
  }

  if (result.deviceKey && Number.isInteger(result.channel)) {
    const port = _.get(config, `devices.${result.deviceKey}.port`)
    if (port) {
      const portName = _.get(config, `midi.ports.${port}.${os.platform()}`)
      if (portName) {
        const midiNames = _.get(config, 'preset.midi.ports.output', []).map( port => port.name )
        if (midiNames) {
          const idx = midiNames.indexOf(portName)
          if (idx >= 0) {
            result.portName = midiNames[idx]
            const ports = Object.keys(config.midi.ports).filter( p => config.midi.ports[p][os.platform()] == result.portName )
            if (ports && ports.length == 1) {
              result.portName = ports[0]
            }
          }
        }
      }
    }
  }
  return result
}

function bacaraSequencer(name, sub, options) {
  if (options.verbose) {
    debugError('options %y', _.fromPairs(_.toPairs(options).filter(a => a[0].length > 1 )) )
    debugError('config %y', config.util.toObject(config))
  }

  if (options.custom && options.custom.length) {
    Bacara.setPresetStateFilename(options.custom[options.custom.length - 1])
  }
  Midi.setupVirtualPorts(config.bacara.virtual)

  const monode = monodeInit()

  monode.on('device', function(device) {
    monome = device

    for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 8; y++) {
        monome.led(x, y, 0)
      }
    }
    monome.on('key', function(x, y, s) {
      debugMonome('X %y Y %y S %y', x, y, s)
      monome.led(x, y, s)
      if (s && x >= 6 && x <= 7) {
        debugMonome('P %y', ((((x - 6) ? 0 : 1) * 8) + y) + 1)
      }
    })

    monome.on('rotation', function(value){
      debugMonome('rotation changed to: %y', value)
    })

    monome.rotation = 180
    debugMonome('rotation %y', monome.rotation)
    debug('Monome width %y height %y', monome.width, monome.height)
  })


  const bacaraMachine = new BacaraMachine('bacara', options)
  bacaraMachine.readState()
  bacaraMachine.writeState()

  Midi.send(options.electraOneCtrl, 'sysex', [0xF0, 0x00, 0x21, 0x45, 0x02, 0x7F, 0xF7])  /* Electra information */


  const midiInput_electraOneCtrl = Midi.input(options.electraOneCtrl, true)
  if (midiInput_electraOneCtrl) {
    midiInput_electraOneCtrl.on('message', (msg) => {
      switch (msg._type) {
      case 'sysex':
        {
          const electraSysexHeader = [0xF0, 0x00, 0x21, 0x45]
          const electraSysexCmdPresetSwitch = [0x7E, 0x02]
          const electraSysexCmdPresetNameResponse = [0x01, 0x7C]
          const electraSysexCmdPatchResponse = [0x01, 0x01]
          const electraSysexCmdInfoResponse = [0x01, 0x7F]
          const sysexHeader = msg.bytes.slice(0, 4)
          const sysexCmd = msg.bytes.slice(4, 6)
          if (_.isEqual(sysexHeader, electraSysexHeader)) {
            if (_.isEqual(sysexCmd, electraSysexCmdInfoResponse)) {
              e1_system_info = electra.parseSysexCmdInfoResponse(options.electraOneCtrl, msg.bytes)
              if (!e1_system_info.versionText.match(/^v\d+\.\d+\.\d+$/)) {
                if (e1_system_info.versionText.match(/^v\d+\.\d+$/)) {
                  e1_system_info.versionText += '.0'
                }
                debug('%y %y', e1_system_info.versionText, E1_FIRMWARE_PRESET_REQUEST_VERSION)
              }
              e1_system_info.versionText = e1_system_info.versionText.replace(/[a-zA-Z-]/g, '')  // allows for v3.0-a.2
              debug('info actual %y >= %y ? %y', e1_system_info.versionText, E1_FIRMWARE_PRESET_REQUEST_VERSION, semver.gte(_.get(e1_system_info, 'versionText', 'v0.0.0'), E1_FIRMWARE_PRESET_REQUEST_VERSION))
              if (config.electra.checkPresetVia == 'patch' || semver.lt(_.get(e1_system_info, 'versionText', 'v0.0.0'), E1_FIRMWARE_PRESET_REQUEST_VERSION)) { // semver: see if actual version is smaller that v2.1.2
                debug('Send Patch Request to %y', options.electraOneCtrl)
                Midi.send(options.electraOneCtrl, 'sysex', [0xF0, 0x00, 0x21, 0x45, 0x02, 0x01, 0xF7])  /* Patch Request */
              } else if (config.electra.checkPresetVia == 'preset') {
                debug('Send Preset Name Request to %y', options.electraOneCtrl)
                Midi.send(options.electraOneCtrl, 'sysex', [0xF0, 0x00, 0x21, 0x45, 0x02, 0x7C, 0xF7])  /* Preset Name Request */
              }
            } else if (_.isEqual(sysexCmd, electraSysexCmdPatchResponse)) {
              const presetName = electra.parseSysexCmdPatchRequestResponse(options.electraOneCtrl, msg.bytes)
              if (presetName == bacaraPresetName || presetName.toLowerCase().indexOf('bacara') >= 0) {
                debug('Electra One "%s" preset IS Loaded (patch)', bacaraPresetName)
                //                bacaraMachine.virusReflectParts()
              } else {
                debug('Electra One "%s" preset is NOT Loaded (currently is "%s") (patch)', bacaraPresetName, presetName)
              }
            } else if (_.isEqual(sysexCmd, electraSysexCmdPresetNameResponse)) {
              const presetName = electra.parseSysexCmdPresetNameResponse(options.electraOneCtrl, msg.bytes) || ''
              if (!presetName || (presetName == bacaraPresetName || presetName.toLowerCase().indexOf('bacara') >= 0)) {
                debug('Electra One "%s" preset IS Loaded (preset)', bacaraPresetName)
                //                bacaraMachine.virusReflectParts()
              } else {
                debug('Electra One "%s" preset is NOT Loaded (currently is "%s") (preset)', bacaraPresetName, presetName, presetName.toLowerCase().indexOf(bacaraPresetName.toLowerCase()), presetName, bacaraPresetName)
              }
            } else if (_.isEqual(sysexCmd, electraSysexCmdPresetSwitch)) {
              if (config.electra.checkPresetVia == 'patch' || semver.lt(_.get(e1_system_info, 'versionText', 'v0.0.0'), E1_FIRMWARE_PRESET_REQUEST_VERSION)) {
                debug('Send Patch Request to %y', options.electraOneCtrl)
                Midi.send(options.electraOneCtrl, 'sysex', [0xF0, 0x00, 0x21, 0x45, 0x02, 0x01, 0xF7])  /* Patch Request */
              } else if (config.electra.checkPresetVia == 'preset') {
                debug('Send Preset Name Request to %y', options.electraOneCtrl)
                Midi.send(options.electraOneCtrl, 'sysex', [0xF0, 0x00, 0x21, 0x45, 0x02, 0x7C, 0xF7])  /* Preset Name Request */
              }
              debug('Bacara Preset Name Request done')
            } else {
              //                         debug('unhandles sysex %y',sysexCmd)
            }
          }
        }
        break
      }
    })
  }


  bacaraMachine.connect(options.electra, 'surface')

  if (options.osc) {
    const oscSetup = _.get(config, `osc.devices.${options.osc}`)
    if (oscSetup) {
      debugOsc('setup %y', oscSetup)

      const getIPAddresses = () => {
        const os = require('os')
        const interfaces = os.networkInterfaces()
        const ipAddresses = []

        for (let deviceName in interfaces) {
          const addresses = interfaces[deviceName]
          for (let i = 0; i < addresses.length; i++) {
            const addressInfo = addresses[i]
            if (addressInfo.family === 'IPv4' && !addressInfo.internal) {
              ipAddresses.push(addressInfo.address)
            }
          }
        }
        return ipAddresses
      }


      const udpPort = new osc.UDPPort({
        localAddress: oscSetup.address,
        localPort: oscSetup.port
      })

      udpPort.on('ready', function () {
        const ipAddresses = getIPAddresses()

        debugOsc('Listening for OSC over UDP.')
        ipAddresses.forEach( address => {
          debugOsc(' Host: %y  Port: %y', address, udpPort.options.localPort)
        })
      })

      udpPort.on('message', function (oscMessage) {
        debugOsc('message %y', oscMessage)

        let modSlotSource = Object.keys(matrixSlotSources).length
        for (addr in torsoT1OSC) {
          if (oscMessage.address == addr && torsoT1OSC[addr].type == 'integer') {
            const modSlotValue = oscMessage.args[0]
            for (let slotIdx = 0; slotIdx < 3; slotIdx++) {
              if (bacaraMachine.interface.getParameter(`matrix.slot.${slotIdx}.source`) == modSlotSource) {
                if (bacaraMachine.interface.getParameter(`matrix.slot.${slotIdx}.value`) !== modSlotValue) {
                  bacaraMachine.matrixSetSlotValue(slotIdx, bacaraMachine.interface.getParameter(`matrix.slot.${slotIdx}.slewLimiter`, 0), matrixSetSlotValueTimout, modSlotValue)
                }
              }
            }
          }
          modSlotSource++
        }

      })

      udpPort.on('error', function (err) {
        debugOsc('error %y', err)
      })

      udpPort.open()
    }
  }
  if (options.general) {
    bacaraMachine.connect(options.general, 'external', Number.isInteger(options.generalChannel) ? parseInt(options.generalChannel) - 1 : 0)
  }
  if (options.clock) {
    bacaraMachine.connect(options.clock, 'clock', 10 - 1)
  }
  if (options.transpose) {
    bacaraMachine.connect(options.transpose, 'transpose', Number.isInteger(options.transposeChannel) ? parseInt(options.transposeChannel) - 1 : 0)
  }

  bacaraMachine.interface.emitParameters('post-connect')

  bacaraMachine.notesReset()
  bacaraMachine.interface.sendValues('surface')
  bacaraMachine.showPattern()
  bacaraMachine.showDrumsPattern()
}

module.exports = {
  name: 'bacara',
  description: 'Bacara Sequencer',
  examples: [
    {usage:'electra-one bacara', description:'Starts Bacara sequencer'},
  ],
  handler: bacaraSequencer,
}



