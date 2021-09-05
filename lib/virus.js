const debug = require('yves').debugger(require('../package.json').name + ':lib:' + (require('change-case').paramCase(require('path').basename(__filename, '.js'))).replace(/-/g, ':'))
const config = require('config')
const glob = require('glob')
const path = require('path')
const untildify = require('untildify')

const fs = require('fs-extra')
const jsonfile = require('jsonfile')
const _ = require('lodash')

const crypto = require('crypto')



const Virus = {

  scanBanks() {
    const filePath = path.resolve((process.env.NODE_ENV == 'production') ? untildify(`~/.electra-one/state/virus.json`) : `${__dirname}/../state/virus.json`)
    const virusState = fs.existsSync(filePath) ? jsonfile.readFileSync(filePath) : {}

    const banks = []
    const bankPath = untildify(config.virus.bankPath)
    /*    debug('Virus Bank Path %y',bankPath)*/

    const bankFiles = glob.sync(`${bankPath}/**/*.mid`, {})

    //    debug('Bank Files %y',bankFiles)
    let bankIdx = 0
    for (let bankFile of bankFiles) {
      //      let name = bankFile.substr(path.length+1)
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

      /*      debug('Names prefix [%y] midfix [%y] suffix [%y]  short [%y]',prefix,midfix,suffix,short)*/
      const presetInBankSize = 527
      const presets = Math.floor(fileSizeInBytes / presetInBankSize)

      const fileBuffer = fs.readFileSync(bankFile)
      const hashSum = crypto.createHash('sha256')
      hashSum.update(fileBuffer)

      const hash = hashSum.digest('hex');

      banks.push({index: bankIdx++,filename:bankFile.substr(bankPath.length+1), name, short, size:fileSizeInBytes, presets, residu: fileSizeInBytes - (presets*presetInBankSize), hash})
    }
    banks.sort((a, b) =>{
      return a.short.localeCompare(b.short)
    })

    _.set(virusState,'bank',banks)

    jsonfile.writeFileSync(filePath, virusState, { flag: 'w', spaces: 2 })
    debug('scan %y',filePath)

    for (let b in banks) {
      for (let c in banks) {
        if (b != c && !banks[c].seen) {
          if (banks[b].hash == banks[c].hash) {
            debug('Simular hash: %y & %y',banks[b].filename,banks[c].filename)
            banks[c].seen=true
          }
        }
      }
    }
  },

  getBanks() {
    const filePath = path.resolve((process.env.NODE_ENV == 'production') ? untildify(`~/.electra-one/state/virus.json`) : `${__dirname}/../state/virus.json`)
    if (fs.existsSync(filePath)) {
      const virusState = jsonfile.readFileSync(filePath)
      return _.get(virusState,'bank')
    }
  },

  getBank(bankIdx) {
    const banks = Virus.getBanks()
    if (banks) {
      if (bankIdx < banks.length) {
        return banks[bankIdx]
      }
    }
  },

  getPreset(bankPath, program) {
    let filename = bankPath
    if (program>=0 && program<128) {
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
          const offsets = [(0 * 128) + 0, (1 * 128) + 0, (2 * 128) + 2, (3 * 128) + 1]
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
  },

  checksum(deviceID, messageID, bankNumber, programNumber, bytes) {
    return (deviceID + messageID + bankNumber + programNumber + bytes.reduce((a, b) => a + b, 0)) & 0x7F
  },

  toSysEx(part, preset, bank, program) {
    debug ('Preset %y', preset)

    const bytes = [0xF0, 0x00, 0x20, 0x33, 0x01, 0x10, 0x10, 0x00, part - 1]

    const offset = [9 + (0 * 128), 9 + (1 * 128), 9 + (2 * 128) + 2, 9 + (3 * 128) + 2]
    for (let p = 0; p < 4; p++) {
      const buf = Buffer.from(preset.page[p], 'hex')
      for (const pair of buf.entries()) {
        bytes[offset[p] + pair[0]] = pair[1]
      }
    }

    bytes[9 + 2] = bank
    bytes[9 + 3] = program
    bytes[9 + 256 + 0] = Virus.checksum(0x10, 0x10, 0x00, part - 1, bytes.slice(9, 9 + 256))
    bytes[9 + 256 + 1] = 0xF7
//    bytes.push(Virus.checksum(0x10, 0x10, 0x00, part - 1, bytes.slice(9 + 256 + 2, 9 + 256 + 2 + 256)))
    bytes.push(0xF7)
    return bytes
  },

  test() {
    const bankPath = '/Users/joris/Documents/Presets/Access Virus/Howard Scarr - Allstars Set 2012.mid'

    const binary = fs.readFileSync(bankPath)

    const presetInBankOffset = 0x22
    const nameOffset = 112 + 128
    const nameLength = 10
    const presetInBankSize = 527

    /* page b
    const testOffset = (1*128) + 0
    const testLength = 4
*/

    /* page c
    const testOffset = (2*128) + 2
    const testLength = 4
*/

    /* page D
    const testOffset = (3*128) + 1
    const testLength = 4
*/

    const testOffset = (3 * 128) + 1 + 120
    const testLength = 4
    let p = 0
    while ((presetInBankOffset + (presetInBankSize * p)) < binary.length) {
      const name = binary.slice(presetInBankOffset + (presetInBankSize * p) + nameOffset, presetInBankOffset + (presetInBankSize * p) + nameOffset + nameLength).toString()
      const chunk = binary.slice(presetInBankOffset + (presetInBankSize * p) + testOffset, presetInBankOffset + (presetInBankSize * p) + testOffset + testLength).toString('hex').toUpperCase()
      debug('preset %y name %y  bytes %y', p, name, chunk)
      p++
    }

  }

}

/*const n=Virus.getBankNames()
debug('Banks %y',n)
//Virus.test()
const p = Virus.getPreset('/Users/joris/Documents/Presets/Access Virus/JJR.mid',0)
debug('Preset %y',p)
*/
module.exports = Virus