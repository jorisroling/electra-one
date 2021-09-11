const debug = require('yves').debugger(require('../package.json').name + ':' + (require('change-case').paramCase(require('path').basename(__filename, '.js'))).replace(/-/g, ':'))

const config = require('config')
const os = require('os')
const easymidi = require('easymidi')
const glob = require('glob')
const path = require('path')

const _ = require('lodash')

const Pattern = require('../lib/pattern')

const Bacara = require('../lib/bacara')
const me = path.basename(__filename, '.js')

const Midi = require('../lib/midi/midi')

const { Midi:TonalMidi } = require('@tonaljs/tonal')

const Machine = require('../lib/midi/machine')
const Interface = require('../lib/midi/interface')
const MidiCache = require('../lib/midi/cache')
const untildify = require('untildify')

const yves = require('../lib/yves')
const pkg = require('../package.json')
const debugLfo = yves.debugger(`${pkg.name.replace(/^@/, '')}:${(require('change-case').paramCase(require('path').basename(__filename, '.js'))).replace(/-/g, ':')}:lfo`)
const debugMidi = yves.debugger(`${pkg.name.replace(/^@/, '')}:${(require('change-case').paramCase(require('path').basename(__filename, '.js'))).replace(/-/g, ':')}:midi`)
const debugMidiNoteOn = yves.debugger(`${pkg.name.replace(/^@/, '')}:${(require('change-case').paramCase(require('path').basename(__filename, '.js'))).replace(/-/g, ':')}:midi:note:on`)
const debugMidiNoteOff = yves.debugger(`${pkg.name.replace(/^@/, '')}:${(require('change-case').paramCase(require('path').basename(__filename, '.js'))).replace(/-/g, ':')}:midi:note:off`)
const debugMidiControlChange = yves.debugger(`${pkg.name.replace(/^@/, '')}:${(require('change-case').paramCase(require('path').basename(__filename, '.js'))).replace(/-/g, ':')}:midi:control:change`)
const debugMidiProgramChange = yves.debugger(`${pkg.name.replace(/^@/, '')}:${(require('change-case').paramCase(require('path').basename(__filename, '.js'))).replace(/-/g, ':')}:midi:program:change`)

const debugMonome = yves.debugger(`${pkg.name.replace(/^@/, '')}:monome`)

const euclideanRhythms = require('euclidean-rhythms')
const scaleMappings = require('../extra/scales/scales.json')

const chalk = require('chalk')
const { devices, knownDeviceCCs } = require('../lib/devices')
const deviceCCs = knownDeviceCCs()

const virusAxyzModeRelative = 0
const virusAxyzModeAbsolute = 1

const phaseDetection = true
const tableParameters = ['transpose', 'density', 'muteSteps', 'muteShift', 'scales', 'base', 'split', 'deviate', 'shift']

const toneJSmidi = require('@tonejs/midi')

const Table = require('cli-table3')
const ticksPerStep = 120

const Virus = require('../lib/virus')
const electra = require('../lib/electra')

const virusRamRomBanks = 30
const patternStepsDefault = 16

const matrixSetSlotValueTimout = 10
const matrixSlotSources = {
  off: 0,
  modWheel: 1,
  velocity: 2,
  channelAftertouch: 3,
}

const beatCC = 2 // -1 for off
const reverseDeviceBrowsOnGrid = false

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
  Bacara.event.emit('change', portName, part, type, value, origin, path.basename(__filename, '.js'))
}

class BacaraMachine extends Machine {
  constructor(name,options) {
    super(name)
    this.options = options
    this.pulseTime = [0, 0]
    this.pulses = 0
    this.stepIdx = -1
    this.showPatternGrid(this.stepIdx)
    this.pulseDuration = 0
    this.midiCache = new MidiCache()
    this.lfoHistory = [[], [], []]
    this.slewLimiterTimouts = []

    this.virus = new Virus('virus-ti')
    this.remote = {}

    Bacara.event.on('change', (device, part, name, value, origin, command) => {
      if (/*command != me &&*/ device == 'virus-ti' && (part >= 1 && part <= 16)) {
        //debug('BACARA change %y - device: %y  part: %y  name: %y  value: %y  origin: %y command: %y',me,device, part, name, value, origin, command)
        if (name == 'bank-and-program') {
          if (value && value.bank) {
            this.interface.setParameter(`virus.mixer.part.${part - 1}.bank`, value.bank)
          }
          if (value && value.program) {
            this.interface.setParameter(`virus.mixer.part.${part - 1}.program`, value.program)
          }
          if (part == this.interface.getParameter('virus.axyz.part')) {

            if (value && value.bank) {
              this.interface.setParameter('virus.axyz.bank', value.bank)
            }
            if (value && value.program) {
              this.interface.setParameter('virus.axyz.program', value.program)
            }
            virusAxyzRecenterSend()
          }
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

    const virusAxyzRestoreDefaultSend = (axyz) => {
      const virusPortName = 'virus-ti'
      const part = this.interface.getParameter('virus.axyz.part', 1)
      const channel = part

      const rstAxyz = (axyz) => {
        for (let t = 0; t < 2; t++) {
          const value = 0
          const trgt = this.interface.getParameter(`virus.axyz.${axyz}.target.${t}`)
          if (trgt) {
            const idx = trgt - 1

            const parameter = _.get(devices['virus-ti'].parameters, list[idx])
            if (parameter && parameter.cc) {
              const patchDefault = Virus.getPresetPageParameter(_.get(this.state, `virus.part.${part - 1}.preset`), 0, parameter.cc)
              if (patchDefault >= 0) {
                //                 debug('Reset Axyz %y T %d CC %y = patch default %y',axyz,t,parameter.cc,patchDefault)
                Midi.send(virusPortName, 'cc', {channel:channel - 1, controller:parameter.cc, value:patchDefault})
                Bacara.event.emit('change', virusPortName, part, 'cc', {controller:parameter.cc, value:patchDefault}, 'surface', path.basename(__filename, '.js'))
              }
            }
          }
        }
      }

      const list = devices['virus-ti'].flatList
      for (let a = 1; a <= 4; a++) {
        if (!axyz || axyz == `x${a}`) {
          rstAxyz(`x${a}`)
        }
        if (!axyz || axyz == `y${a}`) {
          rstAxyz(`y${a}`)
        }
      }
    }

    const virusAxyzRecenterSend = () => {
      this.interface.setParameter('virus.axyz.x1.control', 0)
      this.interface.setParameter('virus.axyz.y1.control', 0)
      this.interface.setParameter('virus.axyz.x2.control', 0)
      this.interface.setParameter('virus.axyz.y2.control', 0)
      this.interface.setParameter('virus.axyz.x3.control', 0)
      this.interface.setParameter('virus.axyz.y3.control', 0)
      this.interface.setParameter('virus.axyz.x4.control', 0)
      this.interface.setParameter('virus.axyz.y4.control', 0)

      virusAxyzRestoreDefaultSend()
    }

    virusAxyzRecenterSend()

    const virusAxyzRecenter = (elementPath, origin) => {
      virusAxyzRecenterSend()
    }

    const virusAxyzResetTargets = (elementPath, origin) => {
      virusAxyzRecenterSend()
      const rstAxyzTargets = (axyz) => {
        virusAxyzRestoreDefaultSend(axyz)
        for (let t = 0; t < 2; t++) {
          const elementPath = `virus.axyz.${axyz}.target.${t}`
          this.interface.setParameter(elementPath, this.interface.getElementAttribute(elementPath, 'default', 0))
        }
      }

      const list = devices['virus-ti'].flatList
      for (let a = 1; a <= 4; a++) {
        rstAxyzTargets(`x${a}`)
        rstAxyzTargets(`y${a}`)
      }

    }

    const virusAxyzSelect = (elementPath, origin) => {
      const part = this.interface.getParameter('virus.axyz.part', 1)
      this.setRemote(origin,{next:`virus.axyz.next`,previous:`virus.axyz.previous`,nextBank:`virus.axyz.nextBank`,previousBank:`virus.axyz.previousBank`})
      if (part >= 1 && part <= 16) {
        bacaraEmit('virus-ti', part, 'select', null, origin)
      }
    }

    const virusAxyzNext = (elementPath, origin) => {
      const part = this.interface.getParameter('virus.axyz.part', 1)
      if (part >= 1 && part <= 16) {
        const bank = this.interface.getParameter('virus.axyz.bank')
        const program = this.interface.getParameter('virus.axyz.program')
        if (program < 127) {
          this.interface.setParameter('virus.axyz.program', program + 1)
        } else {
          const banks = Virus.getBanks()
          if (banks && bank < (virusRamRomBanks + banks.length)) {
            this.interface.setParameter('virus.axyz.bank', bank + 1)
          } else {
            this.interface.setParameter('virus.axyz.bank', 0)
          }
          this.interface.setParameter('virus.axyz.program', 0)
        }
        virusAxyzSendBankAndProgram(elementPath, 1, origin)
      }
    }


    const virusAxyzPrevious = (elementPath, origin) => {
      const part = this.interface.getParameter('virus.axyz.part', 1)
      if (part >= 1 && part <= 16) {
        const bank = this.interface.getParameter('virus.axyz.bank')
        const program = this.interface.getParameter('virus.axyz.program')
        if (program > 0) {
          this.interface.setParameter('virus.axyz.program', program - 1)
        } else {
          if (bank > 0) {
            this.interface.setParameter('virus.axyz.bank', bank - 1)
          } else {
            const banks = Virus.getBanks()
            if (banks) {
              this.interface.setParameter('virus.axyz.bank', (virusRamRomBanks + banks.length) - 1)
            }
          }
          this.interface.setParameter('virus.axyz.program', 127)
        }
        virusAxyzSendBankAndProgram(elementPath, 1, origin)
      }
    }

    const virusAxyzNextBank = (elementPath, origin) => {
      const part = this.interface.getParameter('virus.axyz.part', 1)
      if (part >= 1 && part <= 16) {
        const bank = this.interface.getParameter('virus.axyz.bank')
        const banks = Virus.getBanks()
        if (banks && bank < (virusRamRomBanks + banks.length)) {
          this.interface.setParameter('virus.axyz.bank', bank + 1)
          virusAxyzSendBankAndProgram(elementPath, 1, origin)
        }
      }
    }

    const virusAxyzPreviousBank = (elementPath, origin) => {
      const part = this.interface.getParameter('virus.axyz.part', 1)
      if (part >= 1 && part <= 16) {
        const bank = this.interface.getParameter('virus.axyz.bank')
        if (bank > 0) {
          this.interface.setParameter('virus.axyz.bank', bank - 1)
          virusAxyzSendBankAndProgram(elementPath, 1, origin)
        } else {
          const banks = Virus.getBanks()
          if (banks) {
            this.interface.setParameter('virus.axyz.bank', (virusRamRomBanks + banks.length) - 1)
            virusAxyzSendBankAndProgram(elementPath, 1, origin)
          }
        }
      }
    }

    const midiInput_virusTI = Midi.input('virus-ti', true)
    if (midiInput_virusTI) {
      midiInput_virusTI.on('message', (msg) => {
        switch (msg._type) {
        case 'sysex':
          Virus.parseSysEx(msg.bytes, (part, storedPreset) => {
            this.virusReflectPreset(part, storedPreset)
          })
          break
        }
      })
    }

   debug('options %y',options)
    if (options.remote) {
      const midiInput_remote = Midi.input(options.remote)
      if (midiInput_remote) {
        midiInput_remote.on('message', (msg) => {

/*          debug('msg %y',msg)*/
          switch (msg._type) {
          case 'cc':
            if (msg.channel == (this.options.remoteChannel - 1)) {
              let actionPath
              if (msg.controller==89 && msg.value==127) actionPath=this.getState('remote.next')
              if (msg.controller==88 && msg.value==127) actionPath=this.getState('remote.previous')
              if (msg.controller==84 && msg.value==127) actionPath=this.getState('remote.nextBank')
              if (msg.controller==83 && msg.value==127) actionPath=this.getState('remote.previousBank')
              if (actionPath) {
                debug('Remote %y',actionPath)
                const actionSideEffect = _.get(this.actionSideEffects, actionPath)
                if (typeof actionSideEffect == 'function') {
                  actionSideEffect(path, 'remote')
                }
              }
            }
            break
          }
        })
      }
    }

    this.state.sounding = new Array(this.getState('patternSteps', patternStepsDefault)).fill(1)


    const virusMixerSelect = (part) => (elementPath, origin) => {
      if (part >= 1 && part <= 16) {
        this.setRemote(origin,{next:`virus.mixer.part.${part - 1}.next`,previous:`virus.mixer.part.${part - 1}.previous`,nextBank:`virus.mixer.part.${part - 1}.nextBank`,previousBank:`virus.mixer.part.${part - 1}.previousBank`})
        bacaraEmit('virus-ti', part, 'select', null, origin)
      }
    }

    const virusMixerNext = (part) => (elementPath, origin) => {
      if (part >= 1 && part <= 16) {
        const bank = this.interface.getParameter(`virus.mixer.part.${part - 1}.bank`)
        const program = this.interface.getParameter(`virus.mixer.part.${part - 1}.program`)
        if (program < 127) {
          this.interface.setParameter(`virus.mixer.part.${part - 1}.program`, program + 1)
        } else {
          const banks = Virus.getBanks()
          if (banks) {
            if (bank < (virusRamRomBanks + banks.length)) {
              this.interface.setParameter(`virus.mixer.part.${part - 1}.bank`, bank + 1)
            } else {
              this.interface.setParameter(`virus.mixer.part.${part - 1}.bank`, 0)
            }
          }
          this.interface.setParameter(`virus.mixer.part.${part - 1}.program`, 0)
        }
        virusMixerSendBankAndProgram(part, origin)
      }
    }

    const virusMixerPrevious = (part) => (elementPath, origin) => {
      if (part >= 1 && part <= 16) {
        const bank = this.interface.getParameter(`virus.mixer.part.${part - 1}.bank`)
        const program = this.interface.getParameter(`virus.mixer.part.${part - 1}.program`)
        if (program > 0) {
          this.interface.setParameter(`virus.mixer.part.${part - 1}.program`, program - 1)
        } else {
          if (bank > 0) {
            this.interface.setParameter(`virus.mixer.part.${part - 1}.bank`, bank - 1)
          } else {
            const banks = Virus.getBanks()
            if (banks) {
              this.interface.setParameter(`virus.mixer.part.${part - 1}.bank`, (virusRamRomBanks + banks.length) - 1)
            }
          }
          this.interface.setParameter(`virus.mixer.part.${part - 1}.program`, 127)
        }
        virusMixerSendBankAndProgram(part, origin)
      }
    }

    const virusMixerNextBank = (part) => (elementPath, origin) => {
      if (part >= 1 && part <= 16) {
        const bank = this.interface.getParameter(`virus.mixer.part.${part - 1}.bank`)
        const banks = Virus.getBanks()
        if (banks && bank < (virusRamRomBanks + banks.length)) {
          this.interface.setParameter(`virus.mixer.part.${part - 1}.bank`, bank + 1)
          virusMixerSendBankAndProgram(part, origin)
        }
      }
    }

    const virusMixerPreviousBank = (part) => (elementPath, origin) => {
      if (part >= 1 && part <= 16) {
        const bank = this.interface.getParameter(`virus.mixer.part.${part - 1}.bank`)
        if (bank > 0) {
          this.interface.setParameter(`virus.mixer.part.${part - 1}.bank`, bank - 1)
          virusMixerSendBankAndProgram(part, origin)
        } else {
          const banks = Virus.getBanks()
          if (banks) {
            this.interface.setParameter(`virus.mixer.part.${part - 1}.bank`, (virusRamRomBanks + banks.length) - 1)
            virusMixerSendBankAndProgram(part, origin)
          }
        }
      }
    }


    const virusSearchSelect = (part) => (elementPath, origin) => {
      if (part >= 1 && part <= 16) {
        this.setRemote(origin,{next:`virus.search.part.${part - 1}.next`,previous:`virus.search.part.${part - 1}.previous`,nextBank:`virus.search.part.${part - 1}.nextBank`,previousBank:`virus.search.part.${part - 1}.previousBank`})
        bacaraEmit('virus-ti', part, 'select', null, origin)
      }
    }

    const virusSearch = (part,direction,elementPath, origin) => {
      if (part >= 1 && part <= 16) {
        const category = this.interface.getParameter(`virus.search.part.${part - 1}.category`)
        const bank = this.interface.getParameter(`virus.mixer.part.${part - 1}.bank`)
        const program = this.interface.getParameter(`virus.mixer.part.${part - 1}.program`)
        Virus.searchCategory(category,direction,bank >= virusRamRomBanks ? bank - virusRamRomBanks : -1,bank >= virusRamRomBanks ? program : -1,(bank,program) => {
          if (bank>=0) {
            this.interface.setParameter(`virus.mixer.part.${part - 1}.bank`,bank + virusRamRomBanks)
          }
          if (program>=0) {
            this.interface.setParameter(`virus.mixer.part.${part - 1}.program`,program)
          }
          virusMixerSendBankAndProgram(part, origin)
          this.setRemote(origin,{next:`virus.search.part.${part - 1}.next`,previous:`virus.search.part.${part - 1}.previous`,nextBank:`virus.search.part.${part - 1}.nextBank`,previousBank:`virus.search.part.${part - 1}.previousBank`})
        })
      }
    }

    const virusSearchNext = (part) => (elementPath, origin) => {
      virusSearch(part,1,elementPath, origin)
    }

    const virusSearchPrevious = (part) => (elementPath, origin) => {
      virusSearch(part,-1,elementPath, origin)
    }


    this.actionSideEffects = {
      load: (elementPath, origin) => {
        if (origin == 'surface') {
          this.interface.sendValues(origin)
          debug('load')
        }
      },
      generate: (elementPath, origin) => {
        if (origin == 'surface') {
          this.state.pattern = Pattern.generate(this.state, this.interface.getParameter('steps'))
          this.state.last_pattern_but = 0
          this.showPattern()
          this.writeState()
          debug('generated')
        }
      },
      previous_pattern: (elementPath, origin) => {
        if (origin == 'surface') {
          this.state.last_pattern_but += 1

          this.state.pattern = Pattern.load_pattern(this.state)
          this.interface.setParameter('steps', this.getState('patternSteps', patternStepsDefault))
          this.showPattern()
          this.writeState()
          debug('previous_pattern: %y', this.state.last_pattern_but)
        }
      },
      next_pattern: (elementPath, origin) => {
        if (origin == 'surface') {
          this.state.last_pattern_but -= 1
          if (this.state.last_pattern_but < 0) {
            this.state.last_pattern_but = 0
          }

          this.state.pattern = Pattern.load_pattern(this.state)
          this.interface.setParameter('steps', this.getState('patternSteps', patternStepsDefault))
          this.showPattern()
          this.writeState()
          debug('next_pattern: %y', this.state.last_pattern_but)
        }
      },
      previous_preset: (elementPath, origin) => {
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
              this.virusSetupParts()
              this.interface.sendValues(origin)
              this.showPattern()
              this.writeState()
              debug('previous_preset: %y %y', this.interface.getParameter('program'), path.basename(filename))
            }
          }
        }
      },
      next_preset: (elementPath, origin) => {
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
              this.virusSetupParts()
              this.interface.sendValues(origin)
              this.showPattern()
              this.writeState()
              debug('next_preset: %y %y', this.interface.getParameter('program'), path.basename(filename))
            }
          }
        }
      },
      add_preset: (elementPath, origin) => {
        if (origin == 'surface') {
          const filename = this.add_preset()
          debug('add_preset: %y', filename)
        }
      },
      save_preset: (elementPath, origin) => {
        if (origin == 'surface') {
          const filename = this.save_preset()
          debug('save_preset: %y', filename)
        }
      },
      reset_preset: (elementPath, origin) => {
        if (origin == 'surface') {
          this.interface.reset()
          this.showPattern()
          this.writeState()
        }
      },
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
      virus: {
        axyz: {
          recenter: virusAxyzRecenter,
          resetTargets: virusAxyzResetTargets,
          select: virusAxyzSelect,
          next: virusAxyzNext,
          previous: virusAxyzPrevious,
          nextBank: virusAxyzNextBank,
          previousBank: virusAxyzPreviousBank,
        },
        mixer: {
          part: [
            {
              select: virusMixerSelect(1),
              next: virusMixerNext(1),
              previous: virusMixerPrevious(1),
              nextBank: virusMixerNextBank(1),
              previousBank: virusMixerPreviousBank(1),
            },
            {
              select: virusMixerSelect(2),
              next: virusMixerNext(2),
              previous: virusMixerPrevious(2),
              nextBank: virusMixerNextBank(2),
              previousBank: virusMixerPreviousBank(2),
            },
            {
              select: virusMixerSelect(3),
              next: virusMixerNext(3),
              previous: virusMixerPrevious(3),
              nextBank: virusMixerNextBank(3),
              previousBank: virusMixerPreviousBank(3),
            },
            {
              select: virusMixerSelect(4),
              next: virusMixerNext(4),
              previous: virusMixerPrevious(4),
              nextBank: virusMixerNextBank(4),
              previousBank: virusMixerPreviousBank(4),
            },
            {
              select: virusMixerSelect(5),
              next: virusMixerNext(5),
              previous: virusMixerPrevious(5),
              nextBank: virusMixerNextBank(5),
              previousBank: virusMixerPreviousBank(5),
            },
            {
              select: virusMixerSelect(6),
              next: virusMixerNext(6),
              previous: virusMixerPrevious(6),
              nextBank: virusMixerNextBank(6),
              previousBank: virusMixerPreviousBank(6),
            },
          ],
        },
        search: {
          part: [
            {
              select: virusSearchSelect(1),
              next: virusSearchNext(1),
              previous: virusSearchPrevious(1),
            },
            {
              select: virusSearchSelect(2),
              next: virusSearchNext(2),
              previous: virusSearchPrevious(2),
            },
            {
              select: virusSearchSelect(3),
              next: virusSearchNext(3),
              previous: virusSearchPrevious(3),
            },
            {
              select: virusSearchSelect(4),
              next: virusSearchNext(4),
              previous: virusSearchPrevious(4),
            },
            {
              select: virusSearchSelect(5),
              next: virusSearchNext(5),
              previous: virusSearchPrevious(5),
            },
            {
              select: virusSearchSelect(6),
              next: virusSearchNext(6),
              previous: virusSearchPrevious(6),
            },
          ],
        },
      },
    }

    const deviceDeviceChange = (dev) => {
      return (elementPath, value, origin) => {
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
        this.interface.matrixRemodulate(elementPath)
      }
    }

    const virusAxyzPart = (elementPath, value, origin) => {
      virusAxyzRecenterSend()
      bacaraEmit('virus-ti', value, 'select', null, origin)
      this.writeState()
    }

    const virusAxyzLevel = (elementPath, value, origin) => {
      const portName = 'virus-ti'
      const part = this.interface.getParameter('virus.axyz.part', 1)
      const channel = part
      const bank = this.interface.getParameter('virus.axyz.bank')
      const program = this.interface.getParameter('virus.axyz.program')
      this.setRemote(origin,{next:`virus.axyz.next`,previous:`virus.axyz.previous`,nextBank:`virus.axyz.nextBank`,previousBank:`virus.axyz.previousBank`})
      debugMidiControlChange('port %s  channel %d  CC %y = %y', portName, channel, 91, value)
      Midi.send(portName, 'cc', {channel:channel - 1, controller:91, value}, 'levelChange-virus', 200)
    }

    const virusAxyzSendBankAndProgram = (elementPath, value, origin) => {
      const part = this.interface.getParameter('virus.axyz.part', 1)
      const bank = this.interface.getParameter('virus.axyz.bank')
      const program = this.interface.getParameter('virus.axyz.program')

      this.setRemote(origin,{next:`virus.axyz.next`,previous:`virus.axyz.previous`,nextBank:`virus.axyz.nextBank`,previousBank:`virus.axyz.previousBank`})
      this.virusSendBankAndProgram(part, bank, program, origin)
    }

    const virusAxyzBank = (elementPath, value, origin) => {
      virusAxyzSendBankAndProgram(elementPath, value, origin)
    }

    const virusAxyzProgram = (elementPath, value, origin) => {
      virusAxyzSendBankAndProgram(elementPath, value, origin)
    }

    const virusAxyzControl = (axyz) => {
      return (elementPath, value, origin) => {
        const virusPortName = 'virus-ti'
        const part = this.interface.getParameter('virus.axyz.part', 1)
        const channel = part

        const mode = this.interface.getParameter('virus.axyz.mode', 0)

        const list = devices['virus-ti'].flatList
        for (let t = 0; t < 2; t++) {
          const trgt = this.interface.getParameter(`virus.axyz.${axyz}.target.${t}`)
          if (trgt) {
            const idx = trgt - 1
            //          debug('Axyz %y Target %y = %y %y %y',axyz,idx,idx,list[idx],_.get(devices['virus-ti'].parameters,list[idx]))

            const parameter = _.get(devices['virus-ti'].parameters, list[idx])

            if (parameter && parameter.cc) {
              let val
              const patchDefault = Virus.getPresetPageParameter(_.get(this.state, `virus.part.${part - 1}.preset`), 0, parameter.cc)
              if (mode == virusAxyzModeRelative) {
                if (value >= 0.0) {
                  val = Math.round(patchDefault + ((127 - patchDefault) * value))
                } else {
                  val = Math.round(patchDefault - (patchDefault * -value))
                }
              } else if (mode == virusAxyzModeAbsolute) {
                val = Math.round(Interface.remap(value, -1, 1, 0, 127))
              }
              //               debug('Axyz %y T %d CC %y = %y (because %y) (patch default %y)',axyz,t,parameter.cc,val,value,patchDefault)
              Midi.send(virusPortName, 'cc', {channel:channel - 1, controller:parameter.cc, value:val})
              Bacara.event.emit('change', virusPortName, part, 'cc', {controller:parameter.cc, value:val}, origin, path.basename(__filename, '.js'))
            }
          }
        }
      }
    }

    const virusAxyzRestoreDefault = (axyz, trgt) => (elementPath, value, origin) => {
      virusAxyzRestoreDefaultSend(axyz)
      this.writeState()
    }

    const virusAxyzTarget = (axyz, trgt) => {
      return (elementPath, value, origin) => {
        if (value) {
          const idx = value - 1
          const list = devices['virus-ti'].flatList
          debug('Axyz %y Target %y = %y %y %y', axyz, trgt, idx, list[idx], _.get(devices['virus-ti'].parameters, list[idx]))
        }
      }
    }

    const virusMixerSendBankAndProgram = (part, origin) => {
      if (part >= 1 && part <= 16) {
        this.setRemote(origin,{next:`virus.mixer.part.${part - 1}.next`,previous:`virus.mixer.part.${part - 1}.previous`,nextBank:`virus.mixer.part.${part - 1}.nextBank`,previousBank:`virus.mixer.part.${part - 1}.previousBank`})
        const bank = this.interface.getParameter(`virus.mixer.part.${part - 1}.bank`)
        const program = this.interface.getParameter(`virus.mixer.part.${part - 1}.program`)
        this.virusSendBankAndProgram(part, bank, program, origin)
      }
    }


    const virusMixerBank = (part) => (elementPath, value, origin) => {
      virusMixerSendBankAndProgram(part, origin)
    }

    const virusMixerProgram = (part) => (elementPath, value, origin) => {
      virusMixerSendBankAndProgram(part, origin)
    }

    const virusMixerLevel = (part) => (elementPath, value, origin) => {
      if (part >= 1 && part <= 16) {
        Midi.send('virus-ti', 'cc', {channel:part - 1, controller:91, value}, 'levelChange-virus', 200)
        bacaraEmit('virus-ti', part, 'level', value, origin)
      }
    }

    const virusMacroControl = (part, ctrl) => (elementPath, value, origin) => {
      if (part >= 1 && part <= 16) {
        const type = _.get(this.state, `virus.part.${part - 1}.macros.${ctrl - 1}.type`)
        let val = value
        switch (type) {
        case 'cc':
          {
            const controller = _.get(this.state, `virus.part.${part - 1}.macros.${ctrl - 1}.cc`)
            if (controller) {
              val = Math.round(Interface.remap(value, 0, 16383, 0, 127))
              Midi.send('virus-ti', 'cc', {channel:part - 1, controller, value:val}, 'macrosChange-virus', 200)
            }
          }
          break
        case 'pressure':
          val = Math.round(Interface.remap(value, 0, 16383, 0, 127))
          Midi.send('virus-ti', 'channel aftertouch', {channel:part - 1, pressure:val}, 'macrosChange-virus', 200)
          break
        case 'pitch':
          Midi.send('virus-ti', 'pitch', {channel:part - 1, value:value}, 'macrosChange-virus', 200)
          break
        }
        bacaraEmit('virus-ti', part, `macrosControl#${ctrl}`, val, origin)
      }
    }

    const virusSearchCategory = (part) => (elementPath, value, origin) => {
      debug('Category part %y %y',part,value)
    }



    this.parameterEminentSideEffects = {
      virus: {
        axyz: {
          x1: { target: [virusAxyzRestoreDefault('x1', 1), virusAxyzRestoreDefault('x1', 2)] },
          y1: { target: [virusAxyzRestoreDefault('y1', 1), virusAxyzRestoreDefault('y1', 2)] },
          x2: { target: [virusAxyzRestoreDefault('x2', 1), virusAxyzRestoreDefault('x2', 2)] },
          y2: { target: [virusAxyzRestoreDefault('y2', 1), virusAxyzRestoreDefault('y2', 2)] },
          x3: { target: [virusAxyzRestoreDefault('x3', 1), virusAxyzRestoreDefault('x3', 2)] },
          y3: { target: [virusAxyzRestoreDefault('y3', 1), virusAxyzRestoreDefault('y3', 2)] },
          x4: { target: [virusAxyzRestoreDefault('x4', 1), virusAxyzRestoreDefault('x4', 2)] },
          y4: { target: [virusAxyzRestoreDefault('y4', 1), virusAxyzRestoreDefault('y4', 2)] },
        },
      },
    }

    this.parameterSideEffects = {
      octaveChance: (elementPath, value, origin) => {
        if (origin == 'surface' || !this.state.octaves) {
          this.state.octaves = []
          for (let idx = 0; idx < this.getState('patternSteps', patternStepsDefault); idx++) {
            const octave = (Math.abs(value) > Machine.getRandomInt(100))
            this.state.octaves[idx] = (octave ? (value > 0 ? 1 : -1) : 0)
          }
        }
      },
      density: (elementPath, value, origin) => {
        if (origin == 'surface' && value != 100) {
          this.interface.setParameter('muteSteps', 0)
        }
        if (origin == 'surface' || !this.state.sounding) {
          this.state.sounding = []
          for (let idx = 0; idx < this.getState('patternSteps', patternStepsDefault); idx++) {
            this.state.sounding[idx] = (value && (value >= Machine.getRandomInt(100))) ? 1 : 0
          }
        }
      },
      muteSteps: (elementPath, value, origin) => {
        if (origin == 'surface' && value != 0) {
          this.interface.setParameter('density', 100)
        }
        if (origin == 'surface' || !this.state.sounding && value > 0) {
          this.euclidian(this.interface.getParameter('muteSteps'), this.getState('patternSteps', patternStepsDefault), this.interface.getParameter('muteShift'))
        }
      },
      muteShift: (elementPath, value, origin) => {
        if (this.interface.getParameter('muteSteps') > 0) {
          if (origin == 'surface' || !this.state.sounding) {
            this.euclidian(this.interface.getParameter('muteSteps'), this.getState('patternSteps', patternStepsDefault), this.interface.getParameter('muteShift'))
          }
        }
      },
      program: (elementPath, value, origin) => {
        if (origin == 'surface') {
          const presetFilesCount = Pattern.presetFiles(this.state, true)
          if (value >= 0 && value < presetFilesCount) {
            const filename = this.load_preset(value)
            if (filename) {
              this.sendDeviceProgramChange('A')
              this.sendDeviceProgramChange('B')
              for (let trk = 0; trk < 6; trk++) {
                this.sendTrackProgramChange(trk)
              }
              this.virusSetupParts()
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
        axyz: {
          part: virusAxyzPart,
          level: virusAxyzLevel,
          bank: virusAxyzBank,
          program: virusAxyzProgram,
          x1: { control:virusAxyzControl('x1'), target: [virusAxyzTarget('x1', 1), virusAxyzTarget('x1', 2)] },
          y1: { control:virusAxyzControl('y1'), target: [virusAxyzTarget('y1', 1), virusAxyzTarget('y1', 2)] },
          x2: { control:virusAxyzControl('x2'), target: [virusAxyzTarget('x2', 1), virusAxyzTarget('x2', 2)] },
          y2: { control:virusAxyzControl('y2'), target: [virusAxyzTarget('y2', 1), virusAxyzTarget('y2', 2)] },
          x3: { control:virusAxyzControl('x3'), target: [virusAxyzTarget('x3', 1), virusAxyzTarget('x3', 2)] },
          y3: { control:virusAxyzControl('y3'), target: [virusAxyzTarget('y3', 1), virusAxyzTarget('y3', 2)] },
          x4: { control:virusAxyzControl('x4'), target: [virusAxyzTarget('x4', 1), virusAxyzTarget('x4', 2)] },
          y4: { control:virusAxyzControl('y4'), target: [virusAxyzTarget('y4', 1), virusAxyzTarget('y4', 2)] },
        },
        mixer: {
          part: [
            {
              bank: virusMixerBank(1),
              program: virusMixerProgram(1),
              level: virusMixerLevel(1),
            },
            {
              bank: virusMixerBank(2),
              program: virusMixerProgram(2),
              level: virusMixerLevel(2),
            },
            {
              bank: virusMixerBank(3),
              program: virusMixerProgram(3),
              level: virusMixerLevel(3),
            },
            {
              bank: virusMixerBank(4),
              program: virusMixerProgram(4),
              level: virusMixerLevel(4),
            },
            {
              bank: virusMixerBank(5),
              program: virusMixerProgram(5),
              level: virusMixerLevel(5),
            },
            {
              bank: virusMixerBank(6),
              program: virusMixerProgram(6),
              level: virusMixerLevel(6),
            },
          ],
        },
        macros: {
          part: [
            { control: [ virusMacroControl(1, 1), virusMacroControl(1, 2), virusMacroControl(1, 3), virusMacroControl(1, 4), virusMacroControl(1, 5), virusMacroControl(1, 6) ] },
            { control: [ virusMacroControl(2, 1), virusMacroControl(2, 2), virusMacroControl(2, 3), virusMacroControl(2, 4), virusMacroControl(2, 5), virusMacroControl(2, 6) ] },
            { control: [ virusMacroControl(3, 1), virusMacroControl(3, 2), virusMacroControl(3, 3), virusMacroControl(3, 4), virusMacroControl(3, 5), virusMacroControl(3, 6) ] },
            { control: [ virusMacroControl(4, 1), virusMacroControl(4, 2), virusMacroControl(4, 3), virusMacroControl(4, 4), virusMacroControl(4, 5), virusMacroControl(4, 6) ] },
            { control: [ virusMacroControl(5, 1), virusMacroControl(5, 2), virusMacroControl(5, 3), virusMacroControl(5, 4), virusMacroControl(5, 5), virusMacroControl(5, 6) ] },
            { control: [ virusMacroControl(6, 1), virusMacroControl(6, 2), virusMacroControl(6, 3), virusMacroControl(6, 4), virusMacroControl(6, 5), virusMacroControl(6, 6) ] },
          ],
        },
        search: {
          part: [
            {
              category: virusSearchCategory(1),
            },
            {
              category: virusSearchCategory(2),
            },
            {
              category: virusSearchCategory(3),
            },
            {
              category: virusSearchCategory(4),
            },
            {
              category: virusSearchCategory(5),
            },
            {
              category: virusSearchCategory(6),
            },
          ],
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
        this.showPattern()
      }
    })

    this.interface.on('modulationChange', (path, value, reason) => {
      if (tableParameters.indexOf(path) >= 0) {
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
      this.writeState()
    }
    if (step > 0) {
      this.slewLimiterTimouts[slotIdx] = setTimeout( (slotIdx, step, timeout, newValue) => this.matrixSetSlotValue(slotIdx, step, timeout, newValue), timeout, slotIdx, step - 1, timeout, newValue)
    }
  }


  showPattern() {

    const pattern = this.getState('pattern')
    const size = this.getState('patternSteps', 16)
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

    const grid = []

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

    _.get(pattern, 'tracks.0.notes', []).forEach( note => {
      if (notes.indexOf(note.midi) < 0) {
        notes.push(note.midi)
      }
    })
    notes.sort()
    notes.reverse()

    let row = 0
    notes.forEach( noteMidi => {
      grid[row] = []
      for (let col = 0; col < this.getState('patternSteps', patternStepsDefault); col++) {
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


      /*      debug('JJ: %y %y %y',(state && this.interface.getParameter('split','modulated') && noteMidiTransposed <= this.interface.getParameter('split','modulated')),this.interface.getParameter('split','modulated'),noteMidiTransposed)*/
      const deviceBrow = (this.interface.getParameter('split', 'modulated') && noteMidiTransposed <= this.interface.getParameter('split', 'modulated')) ? ((this.interface.getParameter('deviate', 'modulated') >= 50) ? true : false) : ((this.interface.getParameter('deviate', 'modulated') >= 50) ? false : true)
      const arr = [
        {hAlign:'center', content:deviceBrow ? deviceBColor('B') : deviceAColor('A') },
        {hAlign:'center', content:TonalMidi.midiToNoteName(noteMidiTransposed - 12, { sharps: true })/*+` ${noteMidi}`*/}
      ]
      for (let ticks = 0; ticks < (size * ticksPerStep); ticks += ticksPerStep) {
        let shiftedTicks = (ticks + (ticksPerStep * -this.interface.getParameter('shift', 'modulated'))) % (ticksPerStep * this.getState('patternSteps', patternStepsDefault)) // JJR ? steps?
        if (shiftedTicks < 0) {
          shiftedTicks +=  ticksPerStep * this.getState('patternSteps', patternStepsDefault)
        }
        //debug ('ticks %y  shiftedTicks %y',ticks,shiftedTicks)
        let chNote = '  '
        _.get(pattern, 'tracks.0.notes', []).forEach( note => {
          if (note.midi  == noteMidi && note.ticks == shiftedTicks) {
            const count = Math.ceil(note.durationTicks / ticksPerStep)
            /*            const color = this.getState('sounding')[ticks / ticksPerStep] ? (note.velocity == 1 ? accentedColor : normalColor) : disabledColor*/
            const color = this.sounding(ticks / ticksPerStep) ? (note.velocity == 1 ? accentedColor : normalColor) : disabledColor
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
      if (deviceBrow && reverseDeviceBrowsOnGrid) {
        for (let col = 0; col < grid[row].length; col++) {
          grid[row][col] = !grid[row][col]
        }
      }
      table.push(arr)
      row++
    })

    debug(table.toString())
    /*    debug(grid)*/
    _.set(this.state, 'pattern.grid', grid)
    this.showPatternGrid(this.stepIdx)
  }

  showPatternGrid(step, showCursor = true) {
    const offset =  Math.floor((step < 0 ? 0 : step) / monome.width) * monome.width

    for (let row = 0; row < monome.height; row++) {
      for (let col = 0; col < monome.width; col++) {
        let on = _.get(this.state, `pattern.grid.${row}.${col + offset}`)
        if (showCursor && step >= 0 && step == (col + offset)) {
          on = !on
        }
        monome.led((monome.height - row) - 1, col, on ? 1 : 0)
      }
    }
  }


  sendDeviceProgramChange(dev) {
    const portName = this.getState(`device.${dev}.portName`)
    const channel = this.interface.getParameter(`device.${dev}.channel`, 1)
    const bank = this.interface.getParameter(`device.${dev}.bank`)
    const program = this.interface.getParameter(`device.${dev}.program`)
    if (portName == 'virus-ti') {
      let fromStore = false
      if (bank >= virusRamRomBanks) {
        const part = channel
        const virusPreset = _.get(this.state, `virus.part.${part - 1}.preset`)
        if (virusPreset) {
          const bytes = Virus.presetToSysEx(part, virusPreset, bank, program)
          if (bytes) {
            fromStore = true
            Midi.send('virus-ti', 'sysex', bytes)
            Virus.parseSysEx(bytes, (part, storedPreset) => {
              this.virusReflectPreset(part, storedPreset)
            })
            bacaraEmit('virus-ti', part, 'sysex', bytes, 'internal')
            bacaraEmit('virus-ti', part, 'bank-and-program', {bank, program}, 'internal')
          }
        }
      }
      if (!fromStore) {
        this.virusSendBankAndProgram(channel, bank, program, 'internal')
      }
    } else {
      debugMidiControlChange('port %s  channel %d  CC %y = %y', portName, channel, 0, bank)
      Midi.send(portName, 'cc', {channel:channel - 1, controller:0, value:bank}, `bankChange-${dev}`, 200)
      debugMidiProgramChange('port %s  channel %d  PC %y', portName, channel - 1, program)
      Midi.send(portName, 'program', {channel:channel - 1, number: program}, `programChange-${dev}`, 200)
    }
  }

  sendTrackProgramChange(trk) {
    const portName = this.getState(`track.${trk}.portName`)
    const channel = this.getState(`track.${trk}.channel`, 1)
    const bank = this.interface.getParameter(`track.${trk}.bank`)
    const program = this.interface.getParameter(`track.${trk}.program`)
    debugMidiControlChange('port %s  channel %d  CC %y = %y', portName, channel - 1, 0, bank)
    Midi.send(portName, 'cc', {channel:channel - 1, controller:0, value:bank}, `bankChange-${trk}`, 200)
    debugMidiProgramChange('port %s  channel %d  PC %y', portName, channel - 1, program)
    Midi.send(portName, 'program', {channel:channel - 1, number:program}, `programChange-${trk}`, 200)
  }

  sendVirusMixerChannel(part) {
    const portName = 'virus-ti'
    const channel = part
    const bank = this.interface.getParameter(`virus.mixer.part.${part - 1}.bank`)
    const program = this.interface.getParameter(`virus.mixer.part.${part - 1}.program`)
    const level = this.interface.getParameter(`virus.mixer.part.${part - 1}.level`)
    debugMidiControlChange('port %s  cahnnel %d  CC %y = %y', portName, channel - 1, 0, bank)
    Midi.send(portName, 'cc', {channel:channel - 1, controller:0, value:bank}, `bankChange-${part}`, 200)
    debugMidiProgramChange('port %s  channel %d  PC %y', portName, channel - 1, program)
    Midi.send(portName, 'program', {channel:channel - 1, number:program}, `programChange-${part}`, 200)
    debugMidiControlChange('port %s  channel %d  CC %y = %y', portName, channel - 1, 91, level)
    Midi.send(portName, 'cc', {channel:channel - 1, controller:91, value:level}, `bankChange-${part}`, 200)
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
    return `bank-${_.padStart(this.interface.getParameter('bank', 0), 3, '0')}`
  }

  sequencer() {
    const deltaTime = process.hrtime(this.pulseTime)
    this.pulseTime = process.hrtime()

    const ticks = (this.pulses % ((24 * 4) * (this.interface.getParameter('steps') / 16))) * 20
    this.pulseDuration = (deltaTime[0] * 1000) + (deltaTime[1] / 1000000)

    this.stepIdx = (ticks  * (this.interface.getParameter('steps') / 16) ) / ticksPerStep
    this.stepIdx = (ticks  * 1 ) / ticksPerStep

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

        for (let l = 0; l < 3; l++) {
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
                  const channel = this.interface.getParameter(`device.${dev}.channel`) - 1
                  const pth = `port_${this.getState(`device.${dev}.portName`)}.channel_${_.padStart(channel + 1, 2, '0')}.controller_${_.padStart(this.interface.getParameter(`lfo.${l}.control`), 3, '0')}`

                  const cacheValue = this.midiCache.getValue(this.getState(`device.${dev}.portName`), channel, 'cc', this.interface.getParameter(`lfo.${l}.control`) )
                  if (cacheValue != midiValue) {

                    debugMidiControlChange('port %s  channel %d  CC %y = %y', this.getState(`device.${dev}.portName`), channel + 1, this.interface.getParameter(`lfo.${l}.control`), midiValue)
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

          if (this.stepIdx < this.interface.getParameter('steps') && this.sounding(this.stepIdx)/*this.state.sounding[this.stepIdx]*/) {
              let midiNote = note.midi

              const scaleMapping = scaleMappings.scales[this.interface.getParameter('scales', 'modulated')]
              const midiNoteFromBase = (midiNote + this.interface.getParameter('base', 'modulated')) % 12
              const midiNoteBase =  midiNote - midiNoteFromBase
              if (scaleMapping && scaleMapping.mapping[midiNoteFromBase] != midiNoteFromBase) {
                midiNote = (midiNoteBase + scaleMapping.mapping[midiNoteFromBase]) - this.interface.getParameter('base', 'modulated')
              }

              const switchSide = (this.interface.getParameter('deviate', 'modulated') && this.interface.getParameter('deviate', 'modulated') >= Machine.getRandomInt(100))
              const dev =  (midiNote <= this.interface.getParameter('split', 'modulated')) ? (switchSide ? 'B' : 'A') : (switchSide ? 'A' : 'B')
              midiNote += this.interface.getParameter('transpose', 'modulated') + this.interface.getParameter(`device.${dev}.transpose`, 'modulated') + this.octave(this.stepIdx)

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
                  debugMidiNoteOff('port %s  channel %d  note %y', portName, channel + 1, midiNote)
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



  virusMacros(part) {
    if (electra.presetEquals('electra-one-ctrl', 'Bacara')) {
      if (part >= 1 && part <= 6) {
        const macros = _.get(this.state, `virus.part.${part - 1}.macros`, [])
        for (let i = 0; i < 6; i++) {

          const selectControls = [253, 254, 255, 256, 257, 258]
          const macroControls = [
            [181, 182, 183, 187, 188, 189],
            [184, 185, 186, 190, 191, 192],
            [193, 194, 195, 199, 200, 201],
            [196, 197, 198, 202, 203, 204],
            [205, 206, 207, 211, 212, 213],
            [208, 209, 210, 214, 215, 216],
          ]
          let json
          if (i < macros.length) {
            json = {name:macros[i].name, visible:true}
          } else {
            json = {visible:false}
          }

          const ctrlId = macroControls[part - 1][i]
          electra.controlReflect('electra-one-ctrl', ctrlId, json)
        }
      }
    }
  }

  virusSetupParts() {
    for (let part = 16; part > 0; part--) {
      const virusPreset = _.get(this.state, `virus.part.${part - 1}.preset`)
      if (virusPreset) {
        const bank = this.interface.getParameter(`virus.mixer.part.${part - 1}.bank`)
        const program = this.interface.getParameter(`virus.mixer.part.${part - 1}.program`)
        this.virus.sendPreset(part, bank, program, virusPreset)
        this.virusReflectPreset(part, virusPreset)
      } else {
        Midi.send('virus-ti', 'sysex', [0xF0, 0x00, 0x20, 0x33, 0x01, 0x10, 0x30, 0x00, part - 1, 0xF7], `singleRequest-part-${part}`, 200)
      }
    }
  }

  virusSendBankAndProgram(part, bank, program, origin) {
    if (part >= 1 && part <= 16) {
      const portName = 'virus-ti'
      const channel = part
      if (bank < virusRamRomBanks) {
        debugMidiControlChange('port %s  channel %d  CC %y = %y', portName, channel, 0, bank)
        Midi.send(portName, 'cc', {channel:channel - 1, controller:0, value:bank}, 'bankChange-virus', 200)
        debugMidiProgramChange('port %s  channel %d  PC %y', portName, channel - 1, program)
        Midi.send(portName, 'program', {channel:channel - 1, number: program}, 'programChange-virus', 200)
        bacaraEmit('virus-ti', part, 'bank-and-program', {bank, program}, origin)
        _.unset(this.state, `virus.part.${part - 1}.preset`)
        Midi.send('virus-ti', 'sysex', [0xF0, 0x00, 0x20, 0x33, 0x01, 0x10, 0x30, 0x00, part - 1, 0xF7], `singleRequest-part-${part}`, 200)
      } else {
        if (origin != 'post-connect') {
          Virus.getPreset(bank - virusRamRomBanks, program, (virusPreset) => {
            if (virusPreset) {
              const bytes = Virus.presetToSysEx(part, virusPreset, bank, program)
              if (bytes) {
                _.set(this.state, `virus.part.${part - 1}.preset`, virusPreset)
                Midi.send('virus-ti', 'sysex', bytes)
                Virus.parseSysEx(bytes, (part, storedPreset) => {
                  this.virusReflectPreset(part, storedPreset)
                })
                bacaraEmit('virus-ti', part, 'sysex', bytes, origin)
                bacaraEmit('virus-ti', part, 'bank-and-program', {bank, program}, origin)
              }
            } else {
              const virusBank = Virus.getBank(bank - virusRamRomBanks)
              debug('virusBank %y', virusBank)
              if (virusBank && virusBank.presets) {
                //              this.interface.setParameter(`virus.mixer.part.${part-1}.program`,virusBank.presets-1)
              }
            }
          })
        }
      }
    }
  }


  virusReflectParts() {
    if (electra.presetEquals('electra-one-ctrl', 'Bacara')) {
      for (let part = 16; part >=1; part--) {
        const virusPreset = _.get(this.state, `virus.part.${part - 1}.preset`)
        if (virusPreset) {
          this.virusReflectPreset(part, virusPreset)
        }
      }
    }
  }

  virusReflectPreset(part, virusPreset) {

    if (part >= 1 && part <= 6 && virusPreset && virusPreset.page) {
      const level = Virus.getPresetPageParameter(virusPreset, 0, 91)
      this.interface.setParameter(`virus.mixer.part.${part - 1}.level`, level)

      if (this.interface.getParameter(`virus.mixer.part.${part - 1}.bank`) < virusRamRomBanks) {
        this.interface.setParameter(`virus.mixer.part.${part - 1}.bank`, Virus.getPresetPageParameter(virusPreset, 0, 2))
        this.interface.setParameter(`virus.mixer.part.${part - 1}.program`, Virus.getPresetPageParameter(virusPreset, 0, 3))
      }

      if (part == this.interface.getParameter('virus.axyz.part')) {
        if (this.interface.getParameter('virus.axyz.bank') < virusRamRomBanks) {
          this.interface.setParameter('virus.axyz.bank', Virus.getPresetPageParameter(virusPreset, 0, 2))
          this.interface.setParameter('virus.axyz.program', Virus.getPresetPageParameter(virusPreset, 0, 3))
        }
      }

      if (electra.presetEquals('electra-one-ctrl', 'Bacara')) {
        if (part >= 1 && part <= 6) {
          const matrixSelectControls = [145, 146, 147, 148, 149, 150]
          const searchSelectControls = [325, 326, 327, 328, 329, 330]
          electra.controlReflect('electra-one-ctrl', matrixSelectControls[part - 1], {'name': virusPreset.name})
          electra.controlReflect('electra-one-ctrl', searchSelectControls[part - 1], {'name': virusPreset.name})
        }
        if (part == this.interface.getParameter('virus.axyz.part')) {
          const ctrlId = 110
          electra.controlReflect('electra-one-ctrl', ctrlId, {'name': virusPreset.name})
        }
      } else {
        debug('electra Bacara Preset NOT Loaded')
      }

      let macros = {}

      for (let s = 0; s < 6; s++) {
        const slotSource = Virus.getPresetPageParameter(virusPreset, config.virus.info.matrix.slot[s].source.page, config.virus.info.matrix.slot[s].source.offset)
        if (slotSource > 0 && slotSource <= 18) {
          let destinations = 0
          for (let d = 0; d < 3; d++) {
            const target = Virus.getPresetPageParameter(virusPreset, config.virus.info.matrix.slot[s].destinations[d].target.page, config.virus.info.matrix.slot[s].destinations[d].target.offset)
            const amount = Virus.getPresetPageParameter(virusPreset, config.virus.info.matrix.slot[s].destinations[d].amount.page, config.virus.info.matrix.slot[s].destinations[d].amount.offset)
            if (target && amount) {
              destinations++
            }
          }
          if (destinations) {
            const slotSourceType = Object.assign({}, config.virus.info.matrix.source.type[slotSource])
            /*                  debug('mod slot #%d (%s) source %y %s %y',s+1,config.virus.info.matrix.slot[s].name,slotSource,slotSourceType.name,slotSourceType.cc)*/
            macros[slotSourceType.name] = slotSourceType
          }
        }
      }
      /*          debug('macros %y',macros)*/
      macros = Object.values(macros)

      const names = _.get(config.virus.info, 'soft.names')
      for (let macro of macros) {
        if (macro.softknob) {
          for (let k = 0; k < 3; k++) {
            const destination = Virus.getPresetPageParameter(virusPreset, _.get(config.virus.info, `soft.knob.${k}.destination.page`), _.get(config.virus.info, `soft.knob.${k}.destination.offset`))
            /*                  debug('knob %d dest %y',k+1,destination)*/
            if (destination == macro.softknob) {
              macro.name = names[Virus.getPresetPageParameter(virusPreset, _.get(config.virus.info, `soft.knob.${k}.name.page`), _.get(config.virus.info, `soft.knob.${k}.name.offset`))]
              macro.index = k + 1
            }
          }
        }
      }

      macros.sort(function(a, b) {
        if (a.index || b.index) {
          return (a.index ? a.index : 1000) - (b.index ? b.index : 1000)
        } else if (a.cc && b.cc) {
          return a.cc - b.cc
        } else {
          return a.type.localeCompare(b.type)
        }
      })

      for (let ctrl = 0; ctrl < 6; ctrl++) {
        const macro = (ctrl < macros.length) ? macros[ctrl] : null
        if (macro) {
          if (macro.type == 'cc' && macro.cc) {
            this.interface.setParameter(`virus.macros.part.${part - 1}.control.${ctrl}`, Virus.getPresetPageParameter(virusPreset, 0, macro.cc))
          }
        }
      }
      _.set(this.state, `virus.part.${part - 1}.macros`, macros)

      this.virusMacros(part)
      /*            debug('Part #%y Macros %y',part,macros)*/

      this.writeState()
    }
  }

  sounding(step) {
    const arr = this.getState('sounding')
    if (Array.isArray(arr) && step >= 0) {
      return (step < arr.length) ? arr[step] : 1
    }
  }

  octave(stepIdx) {
    return ((stepIdx < this.state.octaves.length && this.state.octaves[stepIdx]) ? (this.state.octaves[stepIdx] * 12) : 0)
  }

  setRemote(origin,options) {
    if (origin!='post-connect') {
      for (let key in options) {
        this.setState(`remote.${key}`, options[key])
      }
    }
  }

}

function bacaraSequencer(name, sub, options) {

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


  const bacaraMachine = new BacaraMachine('bacara',options)
  bacaraMachine.readState()
  bacaraMachine.writeState()

  //  Midi.send('electra-one-ctrl', 'sysex', [0xF0, 0x00, 0x21, 0x45, 0x02, 0x01, 0xF7])  /* Patch Request */
  Midi.send('electra-one-ctrl', 'sysex', [0xF0, 0x00, 0x21, 0x45, 0x02, 0x7C, 0xF7])  /* Preset Name Request */


  const midiInput_electraOneCtrl = Midi.input('electra-one-ctrl', true)
  if (midiInput_electraOneCtrl) {
    midiInput_electraOneCtrl.on('message', (msg) => {
      switch (msg._type) {
      case 'sysex':
        {
          /*        debug('HI')*/
          const electraSysexHeader = [0xF0, 0x00, 0x21, 0x45]
          const electraSysexCmdPresetSwitch = [0x7E, 0x02]
          const electraSysexCmdPresetNameResponse = [0x01, 0x7C]
          const electraSysexCmdPatchResponse = [0x01, 0x01]
          const sysexHeader = msg.bytes.slice(0, 4)
          const sysexCmd = msg.bytes.slice(4, 6)
          if (_.isEqual(sysexHeader, electraSysexHeader)) {
            if (_.isEqual(sysexCmd, electraSysexCmdPresetNameResponse)) {
              electra.parseSysexCmdPresetNameResponse('electra-one-ctrl', msg.bytes)
              bacaraMachine.virusReflectParts()
            } else if (_.isEqual(sysexCmd, electraSysexCmdPresetSwitch)) {
              //Midi.send('electra-one-ctrl', 'sysex', [0xF0, 0x00, 0x21, 0x45, 0x02, 0x01, 0xF7])  /* Patch Request */
              Midi.send('electra-one-ctrl', 'sysex', [0xF0, 0x00, 0x21, 0x45, 0x02, 0x7C, 0xF7])  /* Preset Name Request */
              debug('Bacara Preset Name Request done')
            } else if (_.isEqual(sysexCmd, electraSysexCmdPatchResponse)) {
              electra.parseSysexCmdPatchResponseResponse('electra-one-ctrl', msg.bytes)
              bacaraMachine.virusReflectParts()
            } else {
              //            debug('unhandles sysex %y',sysexCmd)
            }
          }
        }
        break
      }
    })
  }


  bacaraMachine.connect(options.electra, 'surface')

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
  bacaraMachine.virusSetupParts()
}

module.exports = {
  name: 'bacara',
  description: 'Bacara Sequencer',
  examples: [
    {usage:'electra-one bacara', description:'Starts Bacara sequencer'},
  ],
  handler: bacaraSequencer,
}



