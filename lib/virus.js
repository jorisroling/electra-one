const debug = require('yves').debugger(require('../package.json').name + ':lib:' + (require('change-case').paramCase(require('path').basename(__filename, '.js'))).replace(/-/g, ':'))
const config = require('config')
const glob = require('glob')
const path = require('path')
const untildify = require('untildify')

const fs = require('fs-extra')


const Virus = {

  getBanks() {
    const result = []
    const bankPath = untildify(config.virus.bankPath)
    /*    debug('Virus Bank Path %y',bankPath)*/

    const bankFiles = glob.sync(`${bankPath}/**/*.mid`, {})

    //    debug('Bank Files %y',bankFiles)

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
      midfix = midfix.substr(0, 14 - (prefix.length + suffix.length))

      const short = prefix + midfix + suffix

      /*      debug('Names prefix [%y] midfix [%y] suffix [%y]  short [%y]',prefix,midfix,suffix,short)*/
      result.push({filename:bankFile, name, short, size:fileSizeInBytes, presets:Math.floor(fileSizeInBytes / 527)})
    }
    return result
  },

  getBank(bankIdx) {
    const banks = Virus.getBanks()
    if (bankIdx < banks.length) {
      return banks[bankIdx]
    }
  },

  getPreset(bankPath, presetNumber) {

    if (typeof bankPath === 'number' && bankPath >= 0) {
      const banks = Virus.getBanks()
      if (bankPath < banks.length) {
        bankPath = banks[bankPath].filename
      }
    }
    const binary = fs.readFileSync(bankPath)

    const presetInBankOffset = 0x22
    const nameOffset = 112 + 128
    const nameLength = 10
    const presetInBankSize = 527

    if ((presetInBankOffset + (presetInBankSize * presetNumber)) < binary.length) {
      const name = binary.slice(presetInBankOffset + (presetInBankSize * presetNumber) + nameOffset, presetInBankOffset + (presetInBankSize * presetNumber) + nameOffset + nameLength).toString().trim()
      const offsets = [(0 * 128) + 0, (1 * 128) + 0, (2 * 128) + 2, (3 * 128) + 1]
      return {
        filename:bankPath,
        number: presetNumber,
        name,
        page: [
          binary.slice(presetInBankOffset + (presetInBankSize * presetNumber) + offsets[0], presetInBankOffset + (presetInBankSize * presetNumber) + offsets[0] + 128).toString('hex').toUpperCase(),
          binary.slice(presetInBankOffset + (presetInBankSize * presetNumber) + offsets[1], presetInBankOffset + (presetInBankSize * presetNumber) + offsets[1] + 128).toString('hex').toUpperCase(),
          binary.slice(presetInBankOffset + (presetInBankSize * presetNumber) + offsets[2], presetInBankOffset + (presetInBankSize * presetNumber) + offsets[2] + 128).toString('hex').toUpperCase(),
          binary.slice(presetInBankOffset + (presetInBankSize * presetNumber) + offsets[3], presetInBankOffset + (presetInBankSize * presetNumber) + offsets[3] + 128).toString('hex').toUpperCase(),
        ],
      }
    }
  },

  toSysEx(portNames, preset) {
    debug ('send %y %y', portNames, preset)
  },

  test() {
    const bankPath = '/Users/joris/Documents/Presets/Access Virus/JJR.mid'

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