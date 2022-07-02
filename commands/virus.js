const config = require('config')
const path = require('path')


const virus = require('../lib/virus')

const yves = require('../lib/yves')
const pkg = require('../package.json')
const debugError = yves.debugger(`${pkg.name.replace(/^@/, '')}:${(require('change-case').paramCase(require('path').basename(__filename, '.js'))).replace(/-/g, ':')}:error`)
const _ = require('lodash')

const glob = require('glob')

const fs = require('fs-extra')
const jsonfile = require('jsonfile')
const deepSortObject = require('deep-sort-object')

const { table } = require('table')
const chalk = require('chalk')
const labelColor = chalk.hex('#FF8800')
const dimColor = chalk.hex('#222')

let args

const Bacara = require('../lib/bacara')
const { devices, knownDeviceCCs } = require('../lib/devices')
const Random = require('../lib/random')

const semver = require('semver')

const virusCompanionPresetName = config.electra.presetName.virus //'Virus Companion'
const Machine = require('../lib/midi/machine')
const Interface = require('../lib/midi/interface')
const untildify = require('untildify')

const electra = require('../lib/electra')

const E1_FIRMWARE_PRESET_REQUEST_VERSION = 'v2.1.2'
let e1_system_info

const VIRUS_MAX_PART = 6

const virusAxyzModeRelative = 0
const virusAxyzModeAbsolute = 1

const Virus = require('../lib/virus')
const virusRamRomBanks = 30
//const virusMixerSelectControls = [145, 146, 147, 148, 149, 150]

const virusMixerPage = 1
const virusMixerSelectControls = [1, 2, 3, 4, 5, 6]


const virusSearchPage = 7
const virusSearchSelectControls = [1, 2, 3, 4, 5, 6]


/*
const debugError = yves.debugger(`${pkg.name.replace(/^@/, '')}:${(require('change-case').paramCase(require('path').basename(__filename, '.js'))).replace(/-/g, ':')}:error`)
const debugLfo = yves.debugger(`${pkg.name.replace(/^@/, '')}:${(require('change-case').paramCase(require('path').basename(__filename, '.js'))).replace(/-/g, ':')}:lfo`)
const debugDispatch = yves.debugger(`${pkg.name.replace(/^@/, '')}:${(require('change-case').paramCase(require('path').basename(__filename, '.js'))).replace(/-/g, ':')}:dispatch`)
const debugMidi = yves.debugger(`${pkg.name.replace(/^@/, '')}:${(require('change-case').paramCase(require('path').basename(__filename, '.js'))).replace(/-/g, ':')}:midi`)
const debugMidiNoteOn = yves.debugger(`${pkg.name.replace(/^@/, '')}:${(require('change-case').paramCase(require('path').basename(__filename, '.js'))).replace(/-/g, ':')}:midi:note:on`)
const debugMidiNoteOff = yves.debugger(`${pkg.name.replace(/^@/, '')}:${(require('change-case').paramCase(require('path').basename(__filename, '.js'))).replace(/-/g, ':')}:midi:note:off`)
const debugMidiNoteError = yves.debugger(`${pkg.name.replace(/^@/, '')}:${(require('change-case').paramCase(require('path').basename(__filename, '.js'))).replace(/-/g, ':')}:midi:note:error`)
*/
const debugMidiControlChange = yves.debugger(`${pkg.name.replace(/^@/, '')}:${(require('change-case').paramCase(require('path').basename(__filename, '.js'))).replace(/-/g, ':')}:midi:control:change`)
const debugState = yves.debugger(`${pkg.name.replace(/^@/, '')}:${(require('change-case').paramCase(require('path').basename(__filename, '.js'))).replace(/-/g, ':')}:state`)
const debugMidiProgramChange = yves.debugger(`${pkg.name.replace(/^@/, '')}:${(require('change-case').paramCase(require('path').basename(__filename, '.js'))).replace(/-/g, ':')}:midi:program:change`)
const debugChange = yves.debugger(`${pkg.name.replace(/^@/, '')}:${(require('change-case').paramCase(require('path').basename(__filename, '.js'))).replace(/-/g, ':')}:change`)

/*
const debugDeviation = yves.debugger(`${pkg.name.replace(/^@/, '')}:${(require('change-case').paramCase(require('path').basename(__filename, '.js'))).replace(/-/g, ':')}:deviation`)
const debugOsc = yves.debugger(`${pkg.name.replace(/^@/, '')}:${(require('change-case').paramCase(require('path').basename(__filename, '.js'))).replace(/-/g, ':')}:osc`)
*/
const Midi = require('../lib/midi/midi')

function msleep(n) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, n)
}
function sleep(n) {
  msleep(n * 1000)
}


let bacaraEmitPart
let bacaraEmitTime
function bacaraEmit(portName, part, type, value, origin) {
  bacaraEmitTime = Date.now()
  bacaraEmitPart = part
  Bacara.event().emit('change', portName, part, type, value, origin, path.basename(__filename, '.js'))
}


class VirusMachine extends Machine {
  constructor(name, options) {
    super(name)
    this.options = options

    this.virus = new Virus('virus-ti')
    this.remote = {}

    Bacara.event().on('change', (device, part, name, value, origin, command) => {
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
          this.writeState()
        } else if (name == 'select') {
          this.interface.setParameter('virus.axyz.part', part)
          virusAxyzRecenterSend()
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
              const patchDefault = Virus.getPresetPageParameter(this.getState(`virus.part.${part - 1}.preset`), 0, parameter.cc)
              if (patchDefault >= 0) {
                //                 debug('Reset Axyz %y T %d CC %y = patch default %y',axyz,t,parameter.cc,patchDefault)
                Midi.send(virusPortName, 'cc', {channel:channel - 1, controller:parameter.cc, value:patchDefault})
                Bacara.event().emit('change', virusPortName, part, 'cc', {controller:parameter.cc, value:patchDefault}, 'surface', path.basename(__filename, '.js'))
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
      this.setRemote(origin, {next:'virus.axyz.next', previous:'virus.axyz.previous', random:'virus.axyz.random', nextBank:'virus.axyz.nextBank', previousBank:'virus.axyz.previousBank', recenter:'virus.axyz.recenter'})
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

    const virusAxyzRandom = (elementPath, origin) => {
      const part = this.interface.getParameter('virus.axyz.part', 1)
      if (part >= 1 && part <= 16) {
        Virus.randomBankAndProgram((bank, program) => {
          this.interface.setParameter('virus.axyz.bank', bank + virusRamRomBanks)
          this.interface.setParameter('virus.axyz.program', program)
          virusAxyzSendBankAndProgram(elementPath, 1, origin)
        })
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
            if (part >= 1 && part <= 16 && storedPreset) {
              this.setState(`virus.part.${part - 1}.preset`, storedPreset)
              this.writeState()
            }
            this.virusReflectPreset(part, storedPreset)
          })
          break
        }
      })
    }

//       debug('options %y', options)
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

    const virusMixerSelect = (part) => (elementPath, origin) => {
      if (part >= 1 && part <= 16) {
        this.setRemote(origin, {next:`virus.mixer.part.${part - 1}.next`, previous:`virus.mixer.part.${part - 1}.previous`, random:`virus.mixer.part.${part - 1}.random`, nextBank:`virus.mixer.part.${part - 1}.nextBank`, previousBank:`virus.mixer.part.${part - 1}.previousBank`})
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

    const virusMixerRandom = (part) => (elementPath, origin) => {
      if (part >= 1 && part <= 16) {
        Virus.randomBankAndProgram((bank, program) => {
          this.interface.setParameter(`virus.mixer.part.${part - 1}.bank`, bank + virusRamRomBanks)
          this.interface.setParameter(`virus.mixer.part.${part - 1}.program`, program)
          virusMixerSendBankAndProgram(part, origin)
        })
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
        this.setRemote(origin, {next:`virus.search.part.${part - 1}.next`, previous:`virus.search.part.${part - 1}.previous`, random:`virus.search.part.${part - 1}.random`, remote_reset:`virus.search.part.${part - 1}.randomAll`, nextBank:`virus.search.part.${part - 1}.nextBank`, previousBank:`virus.search.part.${part - 1}.previousBank`})
        bacaraEmit('virus-ti', part, 'select', null, origin)
      }
    }

    const virusSearch = (part, direction, bank, program, origin) => {
      if (part >= 1 && part <= 16) {
        const category = this.interface.getParameter(`virus.search.part.${part - 1}.category`)
        Virus.searchCategory(category, direction, bank >= virusRamRomBanks ? bank - virusRamRomBanks : -1, bank >= virusRamRomBanks ? program : -1, (bank, program) => {
          if (bank >= 0) {
            this.interface.setParameter(`virus.mixer.part.${part - 1}.bank`, bank + virusRamRomBanks)
          }
          if (program >= 0) {
            this.interface.setParameter(`virus.mixer.part.${part - 1}.program`, program)
          }
          virusMixerSendBankAndProgram(part, origin)
          this.setRemote(origin, {next:`virus.search.part.${part - 1}.next`, previous:`virus.search.part.${part - 1}.previous`, random:`virus.search.part.${part - 1}.random`, nextBank:`virus.search.part.${part - 1}.nextBank`, previousBank:`virus.search.part.${part - 1}.previousBank`})
        })
      }
    }

    const virusSearchNext = (part) => (elementPath, origin) => {
      const bank = this.interface.getParameter(`virus.mixer.part.${part - 1}.bank`)
      const program = this.interface.getParameter(`virus.mixer.part.${part - 1}.program`)
      virusSearch(part, 1, bank, program, origin)
    }

    const virusSearchPrevious = (part) => (elementPath, origin) => {
      const bank = this.interface.getParameter(`virus.mixer.part.${part - 1}.bank`)
      const program = this.interface.getParameter(`virus.mixer.part.${part - 1}.program`)
      virusSearch(part, -1, bank, program, origin)
    }

    const virusSearchRandom = (part) => (elementPath, origin) => {
      if (part >= 1 && part <= 16) {
        Virus.randomBankAndProgram((bank, program) => {
          debug('Random bank %y program %y', bank, program)
          virusSearch(part, 0, bank + virusRamRomBanks, program, origin)
        })
      } else if (part == -1) {
        for (part = 0; part < 16; part++) {
          msleep(300)
          Virus.randomBankAndProgram((bank, program) => {
            debug('Random bank %y program %y', bank, program)
            virusSearch(part, 0, bank + virusRamRomBanks, program, origin)
          })
        }
      }
    }


    this.actionSideEffects = {
      load: (elementPath, origin) => {
        if (origin == 'surface' || origin == 'remote') {
          this.interface.sendValues(origin)
          debug('load')
        }
      },
      remote_reset: (elementPath, origin) => {
        this.setState('remote', {})
      },
      previous_preset: (elementPath, origin) => {
        if (origin == 'surface' || origin == 'remote') {
          this.setRemote(origin, {next:'next_preset', previous:'previous_preset', random:'random_preset'})
          const program = this.interface.getParameter('program')
          if (program >= 1 && program < 128) {
            const filename = this.load_preset(program - 1)
            if (filename) {
              this.virusSetupParts()
              this.interface.sendValues('surface')
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
              this.virusSetupParts()
              this.interface.sendValues('surface')
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
            this.virusSetupParts()
            this.interface.sendValues('surface')
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
      virus: {
        axyz: {
          recenter: virusAxyzRecenter,
          resetTargets: virusAxyzResetTargets,
          select: virusAxyzSelect,
          next: virusAxyzNext,
          previous: virusAxyzPrevious,
          random: virusAxyzRandom,
          nextBank: virusAxyzNextBank,
          previousBank: virusAxyzPreviousBank,
        },
        mixer: {
          part: [
            {
              select: virusMixerSelect(1),
              next: virusMixerNext(1),
              previous: virusMixerPrevious(1),
              random: virusMixerRandom(1),
              nextBank: virusMixerNextBank(1),
              previousBank: virusMixerPreviousBank(1),
            },
            {
              select: virusMixerSelect(2),
              next: virusMixerNext(2),
              previous: virusMixerPrevious(2),
              random: virusMixerRandom(2),
              nextBank: virusMixerNextBank(2),
              previousBank: virusMixerPreviousBank(2),
            },
            {
              select: virusMixerSelect(3),
              next: virusMixerNext(3),
              previous: virusMixerPrevious(3),
              random: virusMixerRandom(3),
              nextBank: virusMixerNextBank(3),
              previousBank: virusMixerPreviousBank(3),
            },
            {
              select: virusMixerSelect(4),
              next: virusMixerNext(4),
              previous: virusMixerPrevious(4),
              random: virusMixerRandom(4),
              nextBank: virusMixerNextBank(4),
              previousBank: virusMixerPreviousBank(4),
            },
            {
              select: virusMixerSelect(5),
              next: virusMixerNext(5),
              previous: virusMixerPrevious(5),
              random: virusMixerRandom(5),
              nextBank: virusMixerNextBank(5),
              previousBank: virusMixerPreviousBank(5),
            },
            {
              select: virusMixerSelect(6),
              next: virusMixerNext(6),
              previous: virusMixerPrevious(6),
              random: virusMixerRandom(6),
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
              random: virusSearchRandom(1),
              randomAll: virusSearchRandom(-1),
            },
            {
              select: virusSearchSelect(2),
              next: virusSearchNext(2),
              previous: virusSearchPrevious(2),
              random: virusSearchRandom(2),
              randomAll: virusSearchRandom(-1),
            },
            {
              select: virusSearchSelect(3),
              next: virusSearchNext(3),
              previous: virusSearchPrevious(3),
              random: virusSearchRandom(3),
              randomAll: virusSearchRandom(-1),
            },
            {
              select: virusSearchSelect(4),
              next: virusSearchNext(4),
              previous: virusSearchPrevious(4),
              random: virusSearchRandom(4),
              randomAll: virusSearchRandom(-1),
            },
            {
              select: virusSearchSelect(5),
              next: virusSearchNext(5),
              previous: virusSearchPrevious(5),
              random: virusSearchRandom(5),
              randomAll: virusSearchRandom(-1),
            },
            {
              select: virusSearchSelect(6),
              next: virusSearchNext(6),
              previous: virusSearchPrevious(6),
              random: virusSearchRandom(6),
              randomAll: virusSearchRandom(-1),
            },
          ],
        },
      },
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
      this.setRemote(origin, {next:'virus.axyz.next', previous:'virus.axyz.previous', random:'virus.axyz.random', nextBank:'virus.axyz.nextBank', previousBank:'virus.axyz.previousBank'})
      debugMidiControlChange('port %s  channel %d  CC %y = %y', portName, channel, 91, value)
      Midi.send(portName, 'cc', {channel:channel - 1, controller:91, value}, 'levelChange-virus', 200)
    }

    const virusAxyzSendBankAndProgram = (elementPath, value, origin) => {
      const part = this.interface.getParameter('virus.axyz.part', 1)
      const bank = this.interface.getParameter('virus.axyz.bank')
      const program = this.interface.getParameter('virus.axyz.program')

      this.setRemote(origin, {next:'virus.axyz.next', previous:'virus.axyz.previous', random:'virus.axyz.random', nextBank:'virus.axyz.nextBank', previousBank:'virus.axyz.previousBank'})
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
              const patchDefault = Virus.getPresetPageParameter(this.getState(`virus.part.${part - 1}.preset`), 0, parameter.cc)
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
              Bacara.event().emit('change', virusPortName, part, 'cc', {controller:parameter.cc, value:val}, origin, path.basename(__filename, '.js'))
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
          //debug('Axyz %y Target %y = %y %y %y', axyz, trgt, idx, list[idx], _.get(devices['virus-ti'].parameters, list[idx]))
        }
      }
    }

    const virusMixerSendBankAndProgram = (part, origin) => {
      if (part >= 1 && part <= 16) {
        this.setRemote(origin, {next:`virus.mixer.part.${part - 1}.next`, previous:`virus.mixer.part.${part - 1}.previous`, random:`virus.mixer.part.${part - 1}.random`, nextBank:`virus.mixer.part.${part - 1}.nextBank`, previousBank:`virus.mixer.part.${part - 1}.previousBank`})
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
        const type = this.getState(`virus.part.${part - 1}.macros.${ctrl - 1}.type`)
        let val = value
        switch (type) {
        case 'cc':
          {
            const controller = this.getState(`virus.part.${part - 1}.macros.${ctrl - 1}.cc`)
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
      //debug('Category part %y %y', part, value)
      this.setRemote(origin, {next:`virus.search.part.${part - 1}.next`, previous:`virus.search.part.${part - 1}.previous`, random:`virus.search.part.${part - 1}.random`, nextBank:`virus.search.part.${part - 1}.nextBank`, previousBank:`virus.search.part.${part - 1}.previousBank`})
    }


    this.parameterEminentSideEffects = {
      virus: {
        axyz: {
          //          part: virusAxyzRecenter,
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



    this.interface.on('parameterChange', (path, value, origin, originalValue) => {
      debugChange('parameterChange %y %y', path, value)
    })

    this.on('stateChange', (path, value, originalValue) => {
      debugChange('stateChange %y %y (was %y)', path, value, originalValue)
    })

    this.interface.on('modulationChange', (path, value, reason) => {
      debugChange('modulationChange %y %y (reason %y)', path, value, reason)
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
          'virus',
          'remote',
        ]
        paths.forEach( path => _.set(state, path, _.get(json.state ? json.state : json, path)) )
        this.setStates(state)

        let parameters = (json.parameters ? json.parameters : json)
        if (keepObj) {
          _.merge(parameters, keepObj)
        }
        this.interface.setParameters(parameters)

        this.interface.emitParameters('post-connect')
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
      const remote = this.getState('remote')
      this.readState(filename, {bank, program})
      this.setState('remote', remote)
      return filename
    }
  }

  presetFiles(count = false) {
    const files = glob.sync(path.resolve(
      ( (process.env.NODE_ENV == 'production') ? path.join(untildify('~/.electra-one'), 'state', 'virus', this.bankName(), 'presets') : path.join(__dirname, '..', 'state', 'virus', this.bankName(), 'presets') ) + '/*.json'), {})
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
    const filePath = path.resolve((process.env.NODE_ENV == 'production') ? untildify(`~/.electra-one/state/virus/${this.bankName()}/presets/${name.replace(/:/g, '.')}.json`) : `${__dirname}/../state/virus/${this.bankName()}/presets/${name.replace(/:/g, '.')}.json`)
    this.writeState(filePath)
    this.interface.setParameter('program', this.presetFiles(true) - 1)
    return filePath
  }

  bankName() {
    return `bank-${_.padStart(this.interface.getParameter('bank'), 3, '0')}`
  }

  virusMacros(part) {
    if (config.electra.checkPresetVia == 'none' || electra.presetEquals(this.options.electraOneCtrl, virusCompanionPresetName)) {
      if (part >= 1 && part <= 6) {
        const macros = this.getState(`virus.part.${part - 1}.macros`, [])
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
          electra.controlReflect(this.options.electraOneCtrl, ctrlId, json)
        }
      }
    }
  }

  virusSetupParts() {
    for (let part = 1; part <= VIRUS_MAX_PART; part++) {
      const virusPreset = this.getState(`virus.part.${part - 1}.preset`)
      if (virusPreset) {
        const bank = this.interface.getParameter(`virus.mixer.part.${part - 1}.bank`)
        const program = this.interface.getParameter(`virus.mixer.part.${part - 1}.program`)
        this.virus.sendPreset(part, bank, program, virusPreset)
        this.virusReflectPreset(part, virusPreset)
        Midi.send('virus-ti', 'sysex', [0xF0, 0x00, 0x20, 0x33, 0x01, 0x10, 0x30, 0x00, part - 1, 0xF7], `singleRequest-part-${part}`, 200)
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
            this.virus.sendPreset(part, bank, program, virusPreset)
            this.virusReflectPreset(part, virusPreset)
            Midi.send('virus-ti', 'sysex', [0xF0, 0x00, 0x20, 0x33, 0x01, 0x10, 0x30, 0x00, part - 1, 0xF7], `singleRequest-part-${part}`, 200)
          })
        }
      }
    }
  }


  virusReflectParts() {
    if (config.electra.checkPresetVia == 'none' || electra.presetEquals(this.options.electraOneCtrl, virusCompanionPresetName)) {
      for (let part = 16; part >= 1; part--) {
        const virusPreset = this.getState(`virus.part.${part - 1}.preset`)
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

      if (config.electra.checkPresetVia == 'none' || electra.presetEquals(this.options.electraOneCtrl, virusCompanionPresetName)) {
        /*        if (electra.presetEquals(this.options.electraOneCtrl, virusCompanionPresetName)) {
          debug('Electra One %y preset IS Loaded 1', virusCompanionPresetName)
        }
*/
        if (part >= 1 && part <= 6) {
          //          debug('controlReflect %y %y',virusMixerSelectControls[part - 1],{'name': virusPreset.name})
          electra.controlReflect(this.options.electraOneCtrl, virusMixerSelectControls[part - 1] + ((virusMixerPage-1)*36), {'name': virusPreset.name})
          electra.controlReflect(this.options.electraOneCtrl, virusSearchSelectControls[part - 1] + ((virusSearchPage-1)*36), {'name': virusPreset.name})
        }
        if (part == this.interface.getParameter('virus.axyz.part')) {
          const ctrlId = 110
          electra.controlReflect(this.options.electraOneCtrl, ctrlId, {'name': virusPreset.name})
        }
        //      } else {
        //        debug('Electra One %y preset NOT Loaded', virusCompanionPresetName)
      }

      let macros = {}

      for (let s = 0; s < 6; s++) {
        const slotSource = Virus.getPresetPageParameter(virusPreset, _.get(config, `virus.info.matrix.slot.${s}.source.page`), _.get(config, `virus.info.matrix.slot.${s}.source.offset`))
        if (slotSource > 0 && slotSource <= 18) {
          let destinations = 0
          for (let d = 0; d < 3; d++) {
            const target = Virus.getPresetPageParameter(virusPreset, _.get(config, `virus.info.matrix.slot.${s}.destinations.${d}.target.page`), _.get(config, `virus.info.matrix.slot.${s}.destinations.${d}.target.offset`))
            const amount = Virus.getPresetPageParameter(virusPreset, _.get(config, `virus.info.matrix.slot.${s}.destinations.${d}.amount.page`), _.get(config, `virus.info.matrix.slot.${s}.destinations.${d}.amount.offset`))
            if (target && amount) {
              destinations++
            }
          }
          if (destinations) {
            const slotSourceType = Object.assign({}, _.get(config, `virus.info.matrix.source.type.${slotSource}`))
            /*                  debug('mod slot #%d (%s) source %y %s %y',s+1,_.get(config,`virus.info.matrix.slot.${s}.name`),slotSource,slotSourceType.name,slotSourceType.cc)*/
            macros[slotSourceType.name] = slotSourceType
          }
        }
      }
      /*          debug('macros %y',macros)*/
      macros = Object.values(macros)

      const names = _.get(config, 'virus.info.soft.names')
      for (let macro of macros) {
        if (macro.softknob) {
          for (let k = 0; k < 3; k++) {
            const destination = Virus.getPresetPageParameter(virusPreset, _.get(config, `virus.info.soft.knob.${k}.destination.page`), _.get(config, `virus.info.soft.knob.${k}.destination.offset`))
            /*                  debug('knob %d dest %y',k+1,destination)*/
            if (destination == macro.softknob) {
              macro.name = names[Virus.getPresetPageParameter(virusPreset, _.get(config, `virus.info.soft.knob.${k}.name.page`), _.get(config, `virus.info.soft.knob.${k}.name.offset`))]
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
      this.setState(`virus.part.${part - 1}.macros`, macros)

      this.virusMacros(part)
      /*            debug('Part #%y Macros %y',part,macros)*/

      this.writeState()
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


function virusCommandHandler(name, sub, options) {

  if (options.verbose) {
    debugError('options %y', _.fromPairs(_.toPairs(options).filter(a => a[0].length > 1 )) )
    debugError('config %y', config.util.toObject(config))
  }

  //    debug('sub %y',sub)

  switch (sub && sub.length > 0 && sub[0] && sub[0].toLowerCase()) {
  case 'companion':
    {
      if (options.verbose) {
        debugError('options %y', _.fromPairs(_.toPairs(options).filter(a => a[0].length > 1 )) )
        debugError('config %y', config.util.toObject(config))
      }

      if (options.custom && options.custom.length) {
        Bacara.setPresetStateFilename(options.custom[options.custom.length - 1])
      }

      const virusMachine = new VirusMachine('virus', options)
      virusMachine.readState()
      virusMachine.writeState()

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
                  if (presetName == virusCompanionPresetName || presetName.toLowerCase().indexOf('bacara') >= 0) {
                    debug('Electra One "%s" preset IS Loaded (patch)', virusCompanionPresetName)
                    virusMachine.virusReflectParts()
                  } else {
                    debug('Electra One "%s" preset is NOT Loaded (currently is "%s") (patch)', virusCompanionPresetName, presetName)
                  }
                } else if (_.isEqual(sysexCmd, electraSysexCmdPresetNameResponse)) {
                  const presetName = electra.parseSysexCmdPresetNameResponse(options.electraOneCtrl, msg.bytes) || ''
                  if (!presetName || (presetName == virusCompanionPresetName || presetName.toLowerCase().indexOf('bacara') >= 0)) {
                    debug('Electra One "%s" preset IS Loaded (preset)', virusCompanionPresetName)
                    virusMachine.virusReflectParts()
                  } else {
                    debug('Electra One "%s" preset is NOT Loaded (currently is "%s") (preset)', virusCompanionPresetName, presetName, presetName.toLowerCase().indexOf(virusCompanionPresetName.toLowerCase()), presetName, virusCompanionPresetName)
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


      virusMachine.connect(options.electra, 'surface')

      if (options.general) {
        virusMachine.connect(options.general, 'external', Number.isInteger(options.generalChannel) ? parseInt(options.generalChannel) - 1 : 0)
      }

      virusMachine.interface.emitParameters('post-connect')

      virusMachine.interface.sendValues('surface')
      virusMachine.virusSetupParts()
    }
    break
  case 'preset':
    switch (sub.length > 1 && sub[1] && sub[1].toLowerCase()) {
    case 'search':
      if (sub.length > 2 && sub[2]) {
        const matches = virus.searchBanks(sub[2])
        if (matches && matches.length) {
          const data = [['Bank', 'Preset', dimColor('Index')]]

          for (let m = 0; m < matches.length; m++) {
            data.push([`${labelColor(matches[m].bank)}`, `${labelColor(matches[m].preset)}`, `${dimColor(matches[m].index)}`])
          }
          const output = table(data, {})
          console.log(output)
        }
        console.log(`Total presets matching "${sub[2]}": `, matches && matches.length ? matches.length : 0)
      }
      break
    }
  }
}

module.exports = {
  setup(a) {
    args = a
  },
  name: 'virus',
  description: 'Virus TI tools',
  handler: virusCommandHandler,
  examples: [
    {usage:'electra-one virus companion', description:'Virus Companion'},
    {usage:'electra-one virus preset search <search pattern>', description:'Search preset in Virus TI banks'},
  ],
  aliases:[]
}