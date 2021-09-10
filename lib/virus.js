const debug = require('yves').debugger(require('../package.json').name + ':lib:' + (require('change-case').paramCase(require('path').basename(__filename, '.js'))).replace(/-/g, ':'))
const config = require('config')
const glob = require('glob')
const path = require('path')
const untildify = require('untildify')

const fs = require('fs-extra')
const jsonfile = require('jsonfile')
const _ = require('lodash')

const crypto = require('crypto')

const Bacara = require('./bacara')

const Midi = require('./midi/midi')

const yves = require('../lib/yves')
const pkg = require('../package.json')
const debugVirusPreset = yves.debugger(`${pkg.name.replace(/^@/, '')}:${(require('change-case').paramCase(require('path').basename(__filename, '.js'))).replace(/-/g, ':')}:virus:preset`)

function bacaraEmit(portName, part, type, value, origin) {
  Bacara.event.emit('change', portName, part, type, value, origin, path.basename(__filename, '.js'))
}

class Virus {

  constructor(portName) {
    this.portName = Midi.normalisePortName(portName)
  }


  sendPreset(part, bank, program, virusPreset) {
    if (part >= 1 && part <= 16) {
      if (virusPreset) {
        const bytes = Virus.presetToSysEx(part, virusPreset, bank, program)
        if (bytes) {
          Midi.send('virus-ti', 'sysex', bytes)
          Virus.parseSysEx(bytes)
          bacaraEmit('virus-ti', part, 'sysex', bytes, 'internal')
          bacaraEmit('virus-ti', part, 'bank-and-program', {bank, program}, 'internal')
        }
      }
    }
  }


  static parseSysEx(bytes, reflectCallback) {
    if (Array.isArray(bytes)) {
      const virusSysexHeader = [0xF0, 0x00, 0x20, 0x33, 0x01]
      const sysexHeader = bytes.slice(0, 5)
      if (_.isEqual(sysexHeader, virusSysexHeader)) {
        const virusSysexMessageSingleDump = [0x10, 0x00]
        const msgHeader = bytes.slice(6, 8)
        if (_.isEqual(msgHeader, virusSysexMessageSingleDump)) {
          const part = bytes[8] + 1
          const page = [
            bytes.slice(9 + (128 * 0) + 0, 9 + (128 * 0) + 0 + 128),
            bytes.slice(9 + (128 * 1) + 0, 9 + (128 * 1) + 0 + 128),
            bytes.slice(9 + (128 * 2) + 2, 9 + (128 * 2) + 2 + 128),
            bytes.slice(9 + (128 * 3) + 2, 9 + (128 * 3) + 2 + 128),
          ]

          function toHexString(byteArray) {
            return byteArray.reduce((output, elem) => (output + ('0' + elem.toString(16).toUpperCase()).slice(-2)), '')
          }

          const hexPage = []
          for (let p = 0; p < 4; p++) {
            hexPage[p] = toHexString(page[p])
          }

          let storedPreset = _.get(this.state, `virus.part.${part - 1}.preset`)
          if (storedPreset) {
            //              debug('Current stored preset %y',storedPreset)

            let rectified = false
            const changedPage = []
            for (let p = 0; p < 4; p++) {
              if (storedPreset.page[p] !== hexPage[p]) {
                debugVirusPreset('Part %y Page %y not same \nstore %y\nvirus %y\n', part, p + 1, storedPreset.page[p], hexPage[p])
                storedPreset.page[p] = hexPage[p]
                changedPage.push(p + 1)
                rectified = true
              }
            }
            if (rectified) {
              debugVirusPreset('Rectify preset (part %y) because of page differences [%y]', part, changedPage.join(', '))
              storedPreset.part = part
              storedPreset.rectified = true
              _.set(this.state, `virus.part.${part - 1}.preset`, storedPreset)
            }
          } else {
            let patchName = ''
            for (let n = 112; n <= 121; n++) {
              patchName += String.fromCharCode(parseInt(page[1][n]))
            }
            patchName = patchName.trim()
            debug('patchName part %y %y', part, patchName)

            storedPreset = {part:part, name:patchName, bank:page[0][2], program:page[0][3], page: hexPage}
            _.set(this.state, `virus.part.${part - 1}.preset`, storedPreset)
          }

          if (reflectCallback) {
            reflectCallback(part, storedPreset)
          }
        } else if (msgHeader[0] >= 0x6E && msgHeader[0] <= 0x73 && msgHeader[1] >= 0 && msgHeader[1] < 16 ) {
          const page = ((msgHeader[0] + (msgHeader[0] < 0x70 ? 4 : (msgHeader[0] > 0x71 ? 2 : 0)) ) - 0x70 )
          const part = msgHeader[1] + 1
          const offset = bytes[8]
          const value = bytes[9]
          debug('Parameter Change part %y  page %y  offset %y  value %y', part, page, offset, value)
          const preset = _.get(this.state, `virus.part.${part - 1}.preset`)
          if (preset) {
            if (Virus.getPresetPageParameter(preset, page, offset) != value) {
              if (Virus.setPresetPageParameter(preset, page, offset, value)) {
                preset.modified = true
                _.set(this.state, `virus.part.${part - 1}.preset`, preset)
                this.writeState()
              }
            }
          }
        }
      }
    }
  }


  static scanBanks() {
    const filePath = path.resolve((process.env.NODE_ENV == 'production') ? untildify('~/.electra-one/state/virus.json') : `${__dirname}/../state/virus.json`)
    const virusState = fs.existsSync(filePath) ? jsonfile.readFileSync(filePath) : {}

    const banks = []
    const bankPath = untildify(config.virus.bankPath)

    const bankFiles = glob.sync(`${bankPath}/**/*.mid`, {})

    let bankIdx = 0
    for (let bankFile of bankFiles) {
      const name = path.basename(bankFile, '.mid')
      const stats = fs.statSync(bankFile)
      const fileSizeInBytes = stats.size

      let prefix = ''
      let midfix = ''
      let suffix = ''
      if (name.indexOf(' - ') >= 0) {
        const parts = name.split(' - ')
        prefix = parts[0]
        midfix = parts[1]
      } else {
        midfix = name
      }
      const match = midfix.match(/^(.*[^\d])(\d+)$/)
      if (match) {
        midfix = match[1].trim()
        suffix = match[2]
      } else {
        const match = midfix.match(/^(.*\s)(\w)$/)
        if (match) {
          midfix = match[1].trim()
          suffix = match[2]
        }
      }
      if (midfix.substr(-1) == 'v') {
        midfix = midfix.substr(0, midfix.length - 1).trim()
      }
      if (midfix.substr(-4) == 'vol.') {
        midfix = midfix.substr(0, midfix.length - 4).trim()
      }
      if (prefix) {
        const words = prefix.split(' ')
        prefix = ''
        for (let word of words) {
          prefix += word.substr(0, 1).toUpperCase()
        }
      }
      if (prefix) {
        prefix = prefix.trim() + '.'
      }
      if (midfix) {
        midfix = midfix.trim()
      }
      if (suffix) {
        suffix = '.' + suffix.trim()
      }
      midfix = midfix.substr(0, 14 - (prefix.length + suffix.length)).trim()

      const short = prefix + midfix + suffix

      const presetInBankSize = 527
      const presets = Math.floor(fileSizeInBytes / presetInBankSize)

      const fileBuffer = fs.readFileSync(bankFile)
      const hashSum = crypto.createHash('sha256')
      hashSum.update(fileBuffer)

      const hash = hashSum.digest('hex')

      banks.push({index: bankIdx++, filename:bankFile.substr(bankPath.length + 1), name, short, size:fileSizeInBytes, presets, residu: fileSizeInBytes - (presets * presetInBankSize), hash})
    }
    banks.sort((a, b) =>{
      return a.short.localeCompare(b.short)
    })

    _.set(virusState, 'bank', banks)

    jsonfile.writeFileSync(filePath, virusState, { flag: 'w', spaces: 2 })
    debug('scan %y', filePath)

    for (let b in banks) {
      for (let c in banks) {
        if (b != c && !banks[c].seen) {
          if (banks[b].hash == banks[c].hash) {
            debug('Simular hash: %y & %y', banks[b].filename, banks[c].filename)
            banks[c].seen = true
          }
        }
      }
    }
  }

  static getBanks() {
    const filePath = path.resolve((process.env.NODE_ENV == 'production') ? untildify('~/.electra-one/state/virus.json') : `${__dirname}/../state/virus.json`)
    if (fs.existsSync(filePath)) {
      const virusState = jsonfile.readFileSync(filePath)
      return _.get(virusState, 'bank')
    }
  }

  static getBank(bankIdx) {
    const banks = Virus.getBanks()
    if (banks) {
      if (bankIdx < banks.length) {
        return banks[bankIdx]
      }
    }
  }

  static getPreset(bankPath, program) {
    let filename = bankPath
    if (program >= 0 && program < 128) {
      if (typeof bankPath === 'number' && bankPath >= 0) {
        const banks = Virus.getBanks()
        if (banks) {
          if (bankPath < banks.length) {
            filename = banks[bankPath].filename
            bankPath = untildify(config.virus.bankPath) + '/' + banks[bankPath].filename
          }
        } else {
          return
        }
      }
      if (fs.existsSync(bankPath)) {
        const binary = fs.readFileSync(bankPath)

        const presetInBankOffset = 0x22
        const nameOffset = 112 + 128
        const nameLength = 10
        const presetInBankSize = 527

        if ((presetInBankOffset + (presetInBankSize * program)) < binary.length) {
          const name = binary.slice(presetInBankOffset + (presetInBankSize * program) + nameOffset, presetInBankOffset + (presetInBankSize * program) + nameOffset + nameLength).toString().trim()
          const offsets = [(0 * 128) + 0, (1 * 128) + 0, (2 * 128) + 2, (3 * 128) + 2]
          return {
            filename,
            program,
            name,
            page: [
              binary.slice(presetInBankOffset + (presetInBankSize * program) + offsets[0], presetInBankOffset + (presetInBankSize * program) + offsets[0] + 128).toString('hex').toUpperCase(),
              binary.slice(presetInBankOffset + (presetInBankSize * program) + offsets[1], presetInBankOffset + (presetInBankSize * program) + offsets[1] + 128).toString('hex').toUpperCase(),
              binary.slice(presetInBankOffset + (presetInBankSize * program) + offsets[2], presetInBankOffset + (presetInBankSize * program) + offsets[2] + 128).toString('hex').toUpperCase(),
              binary.slice(presetInBankOffset + (presetInBankSize * program) + offsets[3], presetInBankOffset + (presetInBankSize * program) + offsets[3] + 128).toString('hex').toUpperCase(),
            ],
          }
        }
      }
    }
  }

  static checksum(deviceID, messageID, bankNumber, programNumber, bytes) {
    return (deviceID + messageID + bankNumber + programNumber + bytes.reduce((a, b) => a + b, 0)) & 0x7F
  }

  static presetToSysEx(part, preset, bank, program) {
    debug ('toSysex part %y bank %y program %y Preset %y', part, bank, program, preset)

    const bytes = [0xF0, 0x00, 0x20, 0x33, 0x01, 0x10, 0x10, 0x00, part - 1]

    const offset = [9 + (0 * 128), 9 + (1 * 128), 9 + (2 * 128) + 2, 9 + (3 * 128) + 2]
    for (let p = 0; p < 4; p++) {
      const buf = Buffer.from(preset.page[p], 'hex')
      for (const pair of buf.entries()) {
        bytes[offset[p] + pair[0]] = pair[1]
      }
    }

    if (typeof bank == 'number' && bank >= 0 && bank < 128) {
      bytes[9 + 2] = bank
    }
    if (typeof program == 'number' && program >= 0 && program < 128) {
      bytes[9 + 3] = program
    }
    bytes[9 + 256 + 0] = Virus.checksum(0x10, 0x10, 0x00, part - 1, bytes.slice(9, 9 + 256))
    bytes[9 + 256 + 1] = 0xF7
    bytes.push(0xF7)
    return bytes
  }

  static getPresetPageParameter(preset, page, offset) {
    if (preset && Array.isArray(preset.page) && page < preset.page.length) {
      return parseInt(preset.page[page].substr(offset * 2, 2), 16)
    }
  }

  static setPresetPageParameter(preset, page, offset, value) {
    if (preset && page >= 0 && page < 4) {
      parseInt(preset.page[page].substr(offset * 2, 2), 16)
      preset.page[page] = preset.page[page].substr(0, offset * 2) + (('0' + value.toString(16).toUpperCase()).slice(-2)) + preset.page[page].substr(offset * 2 + 2)
      return true
    }
  }
}

module.exports = Virus