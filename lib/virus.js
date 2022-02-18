const debug = require('yves').debugger(require('../package.json').name + ':lib:' + (require('change-case').paramCase(require('path').basename(__filename, '.js'))).replace(/-/g, ':'))
const config = require('config')
const glob = require('glob')
const path = require('path')
const untildify = require('untildify')

const fs = require('fs-extra')
const _ = require('lodash')

const crypto = require('crypto')

const Bacara = require('./bacara')
const jsonfile = require('jsonfile')

const Random = require('../lib/random')
const Midi = require('./midi/midi')

const yves = require('../lib/yves')
const pkg = require('../package.json')
const debugVirusPreset = yves.debugger(`${pkg.name.replace(/^@/, '')}:${(require('change-case').paramCase(require('path').basename(__filename, '.js'))).replace(/-/g, ':')}:virus:preset`)

const categoryOffsets = [123, 124]
const minimatch = require('minimatch')

const { table } = require('table')
const chalk = require('chalk')
const labelColor = chalk.hex('#FF8800')
const dimColor = chalk.hex('#222')


const virusStateFilePath = path.resolve((process.env.NODE_ENV == 'production') ? untildify('~/.electra-one/state/virus.json') : `${__dirname}/../state/virus.json`)

let virusState

function bacaraEmit(portName, part, type, value, origin) {
  Bacara.event().emit('change', portName, part, type, value, origin, path.basename(__filename, '.js'))
}

class Virus {

  constructor(portName) {
    this.portName = Midi.normalisePortName(portName)
  }


  static readState() {
    if (!virusState) {
      try {
        virusState = fs.existsSync(virusStateFilePath) ? jsonfile.readFileSync(virusStateFilePath) : {}
      } catch (e) {
        return null
      }
    }
    return virusState
  }

  static writeState(state) {
    if (state) {
      virusState = state
    }
    fs.ensureDirSync(path.dirname(virusStateFilePath))
    jsonfile.writeFileSync(virusStateFilePath, virusState, { flag: 'w', spaces: 2 })
  }

  static getState(path, dflt) {
    Virus.readState()
    return _.get(virusState, path, dflt)
  }

  static setState(path, value) {
    Virus.readState()
    _.set(virusState, path, value)
  }

  sendPreset(part, bank, program, virusPreset) {
    if (part >= 1 && part <= 16) {
      if (virusPreset) {
        /*        debug('sendPreset %y %y %y %y',part, bank, program, virusPreset)*/

        let stateDiff = false
        if (virusPreset.name && virusPreset.name.length && Array.isArray(virusPreset.page) && virusPreset.page.length == 4) {
          for (let p = 0; p < virusPreset.page.length; p++) {
            if (virusPreset.page[p] && virusPreset.page[p].length == 256) {
              if (Virus.getState(`virus.part.${part - 1}.page.${p}`) !== virusPreset.page[p]) {
                stateDiff = true
              }
              /*              debug('DIFF %y %y  %y',stateDiff,Virus.getState(`virus.part.${part-1}.page.${p}`),virusPreset.page[p])*/
            }
          }
        }
        const bytes = Virus.presetToSysEx(part, virusPreset, bank, program)
        if (bytes) {
          if (stateDiff) {
            debug ('Preset part %y bank %y program %y name %y (%y, %y) filename %y', part, bank, program, virusPreset.name, Virus.categoryName(Virus.getPresetPageParameter(virusPreset, 1, categoryOffsets[0])), Virus.categoryName(Virus.getPresetPageParameter(virusPreset, 1, categoryOffsets[1])), virusPreset.filename)
            debug('Send Virus Preset over MIDI %y for part %y', virusPreset.name, part)
            Midi.send('virus-ti', 'sysex', bytes)
            Virus.setState(`virus.part.${part - 1}`, virusPreset)
            Virus.writeState()
          } else {
            debug('NOT re-Send Virus Preset over MIDI %y for part %y', virusPreset.name, part)
          }

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
            //debug('patchName part %y %y', part, patchName)

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
                if (reflectCallback) {
                  reflectCallback(part, preset)
                }
              }
            }
          }
        }
      }
    }
  }


  static scanBanks() {
    const banks = []
    if (!_.get(config, 'virus.bankPath')) {
      return
    }

    const bankPath = untildify(_.get(config, 'virus.bankPath'))

    const bankFiles = glob.sync(`${bankPath}/**/*.mid`, {})
    const libraryCategories = {
      'Off': 0,
      'Acid': 0,
      'Arpeggiator': 0,
      'Atomizer': 0,
      'Bass': 0,
      'Classic': 0,
      'Decay': 0,
      'Digital': 0,
      'Drums': 0,
      'EFX': 0,
      'FM': 0,
      'Input': 0,
      'Lead': 0,
      'Organ': 0,
      'Pad': 0,
      'Percussion': 0,
      'Piano': 0,
      'Pluck': 0,
      'String': 0,
      'Vocoder': 0,
      'Favorites 1': 0,
      'Favorites 2': 0,
      'Favorites 3': 0,
    }

    let ditchedCount = 0
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
      let presetCount = Math.floor(fileSizeInBytes / presetInBankSize)

      const fileBuffer = fs.readFileSync(bankFile)
      const hashSum = crypto.createHash('sha256')
      hashSum.update(fileBuffer)

      const hash = hashSum.digest('hex')


      const presets = []
      let nonEmptyFound = false
      const ditched = {}
      for (let p = presetCount - 1; p >= 0; p--) {
        /*        debug('bankFile %y %y',bankFile,p)*/
        const preset = Virus.getPreset(bankFile, p)
        if (preset) {
          if (nonEmptyFound || (!preset.name.match(/^\s*\W\s*init\s*\W\s*$/i) && !preset.name.match(/empty/i))) {
            nonEmptyFound = true
            presets.unshift({index:p, name:preset.name})

            categoryOffsets.forEach(categoryOffset => {
              const catName = Virus.categoryName(Virus.getPresetPageParameter(preset, 1, categoryOffset))
              if (catName) {
                _.set(libraryCategories, catName, _.get(libraryCategories, catName, 0) + 1)
              }
            })
            Virus.categoryName(Virus.getPresetPageParameter(preset, 1, categoryOffsets[1]))
          } else {
            //          debug('Ditched preset with name %y',preset.name)
            _.set(ditched, preset.name, _.get(ditched, preset.name, 0) + 1)
            presetCount--
            ditchedCount++
          }
        } else {
          presetCount--
          ditchedCount++
        }
      }
      if (presetCount > 0) {
        banks.push({index: bankIdx++, filename:bankFile.substr(bankPath.length + 1), name, short, /*size:fileSizeInBytes,*/ presetCount, /*residu: fileSizeInBytes - (presetCount * presetInBankSize),*/ hash})
        if (Object.keys(ditched).length) {
          debug('Ditched presets in %y %y', bankFile.substr(bankPath.length + 1), ditched)
        }
      } else {
        debug('Skipped for not having presets: %y only these preset names where found: %y', bankFile.substr(bankPath.length + 1), ditched)
      }
    }
    debug('Ditched presets %y', ditchedCount)
    debug('Banks %y', banks.length)
    banks.sort((a, b) =>{
      return a.short.localeCompare(b.short)
    })

    Bacara.setPresetState('virus.library.banks', banks)

    const cnt = banks.reduce((partial_sum, bank) => partial_sum + bank.presetCount, 0)
    Bacara.setPresetState('virus.library.presetCount', cnt)
    debug('Presets %y', cnt)
    Bacara.setPresetState('virus.library.categories', libraryCategories)

    debug('Scan stored in %y', Bacara.presetStateFilename())

    for (let b in banks) {
      for (let c in banks) {
        if (b != c && !banks[c].seen) {
          if (banks[b].hash == banks[c].hash) {
            debug('Similar hash: %y & %y', banks[b].filename, banks[c].filename)
            banks[c].seen = true
          }
        }
      }
    }

    return banks
  }

  static searchBanks(namePart) {
    const banks = []
    if (!_.get(config, 'virus.bankPath')) {
      return
    }

    const bankPath = untildify(_.get(config, 'virus.bankPath'))

    const result = []
    const bankFiles = glob.sync(`${bankPath}/**/*.mid`, {})
    let bankIdx = 0
    for (let bankFile of bankFiles) {
      const name = path.basename(bankFile, '.mid')
      const stats = fs.statSync(bankFile)
      const fileSizeInBytes = stats.size


      const presetInBankSize = 527
      let presetCount = Math.floor(fileSizeInBytes / presetInBankSize)

      const fileBuffer = fs.readFileSync(bankFile)


      for (let p = 0; p < presetCount; p++) {
        const preset = Virus.getPreset(bankFile, p)
        if (preset) {
          if ((!preset.name.match(/^\s*\W\s*init\s*\W\s*$/i) && !preset.name.match(/empty/i))) {
            if (minimatch(preset.name, `*${namePart}*`, {noglobstar:true, noext:true, nocomment:true, nocase:true})) {
              /*              debug('bank %y preset %y', bankFile, preset.name)*/
              result.push({bank:bankFile, preset:preset.name, index:p})
            }
          }
        }
      }
    }
    return result
  }

  static getBanks(callback) {
    if (callback) {
      callback(Bacara.getPresetState('virus.library.banks'))
    } else {
      return Bacara.getPresetState('virus.library.banks')
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

  static getPreset(bankPath, program, callback) {
    let filename = bankPath

    function getPreset2() {
      if (fs.existsSync(bankPath)) {

        const handleData = (binary) => {
          //          if (err) throw err;
          const presetInBankOffset = 0x22
          const nameOffset = 112 + 128
          const nameLength = 10
          const presetInBankSize = 527

          if ((presetInBankOffset + (presetInBankSize * program)) < binary.length) {
            const name = binary.slice(presetInBankOffset + (presetInBankSize * program) + nameOffset, presetInBankOffset + (presetInBankSize * program) + nameOffset + nameLength).toString().trim()
            const offsets = [(0 * 128) + 0, (1 * 128) + 0, (2 * 128) + 2, (3 * 128) + 2]
            const result = {
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
            if (callback) {
              callback(result)
            } else {
              return result
            }
          }
        }
        if (callback) {
          fs.readFile(bankPath, (err, data) => handleData(data) )
        } else {
          return handleData(fs.readFileSync(bankPath))
        }
      }
    }

    if (program >= 0 && program < 128) {
      if (typeof bankPath === 'number' && bankPath >= 0) {
        if (callback) {
          Virus.getBanks(banks => {
            if (banks) {
              /*              const data = [['Bank', 'Short', 'Presets',dimColor('Index')]]

              for (let m = 0; m < banks.length; m++) {
                data.push([`${labelColor(banks[m].filename)}`, `${labelColor(banks[m].short)}`, `${labelColor(banks[m].presetCount)}`, `${dimColor(banks[m].index)}`])
              }
              const output = table(data, {})
              console.log(output)
*/
              if (bankPath < banks.length) {
                filename = banks[bankPath].filename
                bankPath = untildify(_.get(config, 'virus.bankPath')) + '/' + banks[bankPath].filename
                getPreset2()
              }
            }
          })
        } else {
          const banks = Virus.getBanks()
          if (banks) {
            if (bankPath < banks.length) {
              filename = banks[bankPath].filename
              bankPath = untildify(_.get(config, 'virus.bankPath')) + '/' + banks[bankPath].filename
              return getPreset2()
            }
          }
        }
      } else {
        return getPreset2()
      }
    }
  }

  static checksum(deviceID, messageID, bankNumber, programNumber, bytes) {
    return (deviceID + messageID + bankNumber + programNumber + bytes.reduce((a, b) => a + b, 0)) & 0x7F
  }

  static presetToSysEx(part, preset, bank, program) {
    //    debug ('Preset part %y bank %y program %y name %y (%y, %y) filename %y', part, bank, program, preset.name, Virus.categoryName(Virus.getPresetPageParameter(preset, 1, categoryOffsets[0])), Virus.categoryName(Virus.getPresetPageParameter(preset, 1, categoryOffsets[1])), preset.filename)

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

  static searchCategory(category, direction, bank, program, callback) {
    if (!direction) {
      direction = Random.getRandomInt(1) ? 1 : -1
    }
    //    debug('Search category %y (%y) direction %y  bank %y  program %y', category, Virus.categoryName(category), direction > 0 ? 'up' : 'down', bank, program)
    debug('Search category %y (of total %y) direction %y  from bank %y  program %y onward', Virus.categoryName(category), Bacara.getPresetState(`virus.library.categories.${Virus.categoryName(category)}`), direction > 0 ? 'up' : 'down', bank, program)
    Virus.getBanks( banks => {
      if (banks) {
        bank = (bank >= 0) ? bank : 0
        if (bank < 0 || bank >= banks.length) {
          if (direction > 0) {
            bank = 0
          } else {
            bank = banks.length - 1
          }
        }
        if (bank >= 0 && bank < banks.length) {
          let bankInfo = banks[bank]
          if (bankInfo) {
            if (program >= bankInfo.presetCount) {
              if (direction > 0) {
                bank++
                if (bank >= banks.length) {
                  bank = 0
                }
                bankInfo = banks[bank]
                program = 0
              } else {
                program = bankInfo.presetCount - 1
              }
            }
            if (program < 0 ) {
              if (direction > 0) {
                program = 0
              } else {
                bank--
                if (bank < 0) {
                  bank = banks.length - 1
                }
                bankInfo = banks[bank]
                program = bankInfo.presetCount - 1
              }
            }

            let preset
            let count = 0
            do {
              program += direction
              if (program >= bankInfo.presetCount) {
                if (direction > 0) {
                  bank++
                  if (bank >= banks.length) {
                    bank = 0
                  }
                  bankInfo = banks[bank]
                  program = 0
                } else {
                  program = bankInfo.presetCount - 1
                }
              }
              if (program < 0 ) {
                if (direction > 0) {
                  program = 0
                } else {
                  bank--
                  if (bank < 0) {
                    bank = banks.length - 1
                  }
                  bankInfo = banks[bank]
                  program = bankInfo.presetCount - 1
                }
              }
              preset = Virus.getPreset(bank, program)
              count++
              /*          debug('do %y category %y  direction %y  bank %y  program %y cat1 %y  cat2 %y  preset %y',count,category,direction,bank,program,preset && Virus.getPresetPageParameter(preset,1,categoryOffsets[0]), preset && Virus.getPresetPageParameter(preset,1,categoryOffsets[1]),preset)*/
            } while ((!preset || (Virus.getPresetPageParameter(preset, 1, categoryOffsets[0]) != category && Virus.getPresetPageParameter(preset, 1, categoryOffsets[1]) != category)) && count < (banks.length * 128))

            if (preset && (Virus.getPresetPageParameter(preset, 1, categoryOffsets[0]) == category || Virus.getPresetPageParameter(preset, 1, categoryOffsets[1]) == category) && count < (banks.length * 128)) {
              debug('searchCategory misses %y', count - 1)
              callback(bank, program)
            }
          }
        }
      }
    })
  }

  static randomBankAndProgram(callback) {
    Virus.getBanks( banks => {
      if (banks && banks.length) {
        const bank = Random.getRandomInt(banks.length - 1)
        const program = Random.getRandomInt(banks[bank].presetCount - 1)
        callback && callback(bank, program)
      }
    })
  }

  static categoryName(cat) {
    const categories = [ 'Off', 'Lead', 'Bass', 'Pad', 'Decay', 'Pluck', 'Acid', 'Classic', 'Arpeggiator', 'EFX', 'Drums', 'Percussion', 'Input', 'Vocoder', 'Favorites 1', 'Favorites 2', 'Favorites 3', 'Organ', 'Piano', 'String', 'FM', 'Digital', 'Atomizer']
    if (cat >= 0 && cat < categories.length) {
      return categories[cat]
    }
  }

}

/*if (!fs.existsSync(filePath)) {
  Virus.scanBanks()
}
*/

module.exports = Virus

/*

0 Off
6 Acid
8 Arpeggiator
22 Atomizer
2 Bass
7 Classic
4 Decay
21 Digital
10 Drums
9 EFX
20 FM
12 Input
1 Lead
17 Organ
3 Pad
11 Percussion
18 Piano
5 Pluck
19 String
13 Vocoder
14 Favorites 1
15 Favorites 2
16 Favorites 3



0 Off
1 Lead
2 Bass
3 Pad
4 Decay
5 Pluck
6 Acid
7 Classic
8 Arpeggiator
9 EFX
10 Drums
11 Percussion
12 Input
13 Vocoder
14 Favorites 1
15 Favorites 2
16 Favorites 3
17 Organ
18 Piano
19 String
20 FM
21 Digital
22 Atomizer

*/
