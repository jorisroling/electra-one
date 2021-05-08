const changeCase = require('change-case')
const config = require('config')
const _ = require('lodash')
const os = require('os')

const Acid = require('../lib/acid')
const pkg = require('../package.json')
const easymidi = require('easymidi')
const escapeRegexString = require('escape-regex-string')

const inputDevices = {}
const outputDevices = {}

const jsonic = require('jsonic')
const path = require('path')
const fs = require('fs')
const { devices } = require('./devices')
const sleep = require('sleep')
const settings = require('../lib/settings')

const counters = {}


class Bacara  {
  static pretty(text) {
    return changeCase.capitalCase(text)
  }
  static input(name, match = false) {
    let virtual = false

    if (name) {
      const tmp = _.get(config,`midi.ports.${name.toLowerCase()}.${os.platform()}`,name)
      if (tmp) {
        match = false
        name = tmp
      }
    }
    if (inputDevices[name]) return inputDevices[name]

    if (name) {
      const midiInputNames = easymidi.getInputs()
      let inputNamesMatching = midiInputNames.filter( inputName => match ? inputName.match(escapeRegexString(name)) : (inputName == name) )
      if (inputNamesMatching.length > 1) inputNamesMatching = midiInputNames.filter( inputName => (inputName == name) )
      if (!inputNamesMatching || inputNamesMatching.length != 1) {
        debug(midiInputNames)
        console.error(`No (unambiguous) input port found with: ${name}`,inputNamesMatching)
        process.exit(1)
      }
      name = inputNamesMatching[0]
    } else {
      name = Bacara.pretty(pkg.name)
      virtual = true
    }
    if (!inputDevices[name]) {
      debug('Input: %y',name,match)
      inputDevices[name] = new easymidi.Input(name, virtual)
    }
    return inputDevices[name]
  }
  static output(name, match = false) {
    let virtual = false

    if (name) {
      const tmp = _.get(config,`midi.ports.${name.toLowerCase()}.${os.platform()}`,name)
      if (tmp) {
        match = false
        name = tmp
      }
    }
    if (outputDevices[name]) return outputDevices[name]

    if (name) {
      const midiOutputNames = easymidi.getOutputs()
      let outputNamesMatching = midiOutputNames.filter( outputName => match ? outputName.match(escapeRegexString(name)) : (outputName == name) )
      if (outputNamesMatching.length > 1) outputNamesMatching = midiOutputNames.filter( outputName => (outputName == name) )
      if (!outputNamesMatching || outputNamesMatching.length != 1) {
        debug(midiOutputNames)
        console.error(`No (unambiguous) output port found with: ${name}`,outputNamesMatching)
        process.exit(1)
      }
      name = outputNamesMatching[0]
    } else {
      name = Bacara.pretty(pkg.name)
      virtual = true
    }
    if (!outputDevices[name]) {
      debug('Output: %y',name,match)
      outputDevices[name] = new easymidi.Output(name, virtual)
    }
    return outputDevices[name]
  }

  static pad(n, width, z) {
    z = z || '0'
    n = n + ''
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n
  }


  static toObject(args) {
    if (args.indexOf(':') >= 0) {
      try {
        return jsonic(args)
      } catch (e) {
        console.error(`Unable to parse: ${args}`)
        process.exit(1)
      }
    } else {
      return args.trim()
    }
  }

  static prepare_BCR2000(tmpl,options) {
    const commands = {
      include(args) {
        const filepath = `${path.dirname(options.template)}/${args.trim()}.txt`
        if (fs.existsSync(filepath)) {
          const preset = fs.readFileSync(filepath,'utf8')
          return Bacara.prepare_BCR2000(preset,options)
        } else {
          return `# include ${args}: ${filepath} not found`
        }
      },
      counter(args) {
        if (!Object.prototype.hasOwnProperty.call(counters,args)) {
          counters[args] = 0
        }
        counters[args]++
        return counters[args]
      },
      group(args) {
        const params = Bacara.toObject(args)
        if (params.group === 'top') {
          params.group = 5
        }
        if (params.group === 'middle') {
          params.group = 6
        }
        if (params.group === 'bottom') {
          params.group = 7
        }
        return ((params.group - 1) * 8) + params.encoder
      },
      sysex(args) {
        const names = args.split('+').map( name => name.trim() )
        const result = []
        names.forEach( name => {
          const file = `${__dirname}/../sysex/${name}.txt`
          if (fs.existsSync(file)) {
            const data = fs.readFileSync(file,'utf8')
            const lines = data.split('\n')
            lines.forEach ( line => {
              const bytes = line.substr(4,48).split(/\s/).filter( byte => !!byte).map(byte => `$${byte}`).forEach( byte => {
                result.push(byte)
              })
            })
          } else {
            console.error(`Unknown Sysex file: ${file}`)
            process.exit(1)
          }
        })
        return result.join(' ')
      },
      name(args) {
        const params = Bacara.toObject(args)
        let nm
        if (typeof params == 'string' && devices[params]) {
          nm =  `${devices[params].manufacturer} ${devices[params].model}`
        } else if (params.device && devices[params.device]) {
          nm =  `${devices[params.device].manufacturer} ${devices[params.device].model}`
        } else if (params.manufacturer || params.model) {
          nm =  `${params.manufacturer} ${params.model}`
        } else {
          nm = params
        }
        return (nm.trim() + ' '.repeat(24)).substr(0,24)
      },
      encoder(args) {
        const params = Bacara.toObject(args)
        /*      yves({params,args})*/
        const parameterPath = `${params.device}.parameters.${params.parameter}`
        const parameter = _.get(devices, parameterPath)
        if (params.device && !parameter) {
          console.error(`Unknown ${params.device} parameter: ${params.parameter}`)
          process.exit(1)
        }
        let type = params.type ? params.type.toLowerCase() : _.get(settings, `${params.device}.paramType`, 'cc')
        if (parameter && !parameter[type]) {
          const newType = (type == 'cc') ? 'nrpn' : 'cc'
          if (!parameter[newType]) {
            console.error(`Unknown parameter type: ${type}  (and no alternative) for parameter ${params.parameter}`)
            process.exit(1)
          }
          type = newType
        }
        const typeNumber = (parameter ? (type == 'cc')
          ? _.get(parameter, `${type}.msb`, parameter ? parameter[type] : null)
          : ((_.get(parameter, `${type}.msb`) << 7) | _.get(parameter, `${type}.lsb`)) :
          Object.prototype.hasOwnProperty.call(params,'number') ? params.number : (((params.msb & 0x7F) << 7) | ((params.lsb & 0x7F) << 0))
        )

        let mid = ''
        if (/^\d+$/.test(params.track)) {
          mid = `${typeof params.track != 'string' ? 'track.' : ''}${params.track}`
        } else {
          mid = `${params.track}`
        }
        const channelPath = `${params.device}.${mid}.channel`
        const channel = params.track ? _.get(settings, channelPath) : params.channel
        if (!channel) {
          console.error(`Unknown channel: ${channelPath} in [encoder ${args}]`)
          process.exit(1)
        }
        const min = Object.prototype.hasOwnProperty.call(params,'min') ? params.min : (_.get(parameter, `${type}.min`, parameter && Object.prototype.hasOwnProperty.call(parameter,'min') ? parameter.min : 0))
        const max = Object.prototype.hasOwnProperty.call(params,'max') ? params.max : (_.get(parameter, `${type}.max`, parameter && Object.prototype.hasOwnProperty.call(parameter,'max') ? parameter.max : 127))
        const mode = `${params.mode ? params.mode : 'absolute'}${max > 127 ? '/14' : ''}`
        const resolution = max <= 127 ? config.encoder.resolution.low : config.encoder.resolution.high
        const dfault = Object.prototype.hasOwnProperty.call(params,'default') ? params.default : (parameter ? (parameter.min ? parameter.min : 0) : 0)
        if (params.group === 'top') {
          params.group = 5
        }
        if (params.group === 'middle') {
          params.group = 6
        }
        if (params.group === 'bottom') {
          params.group = 7
        }
        const encoder = ( params.group ? ((params.group - 1) * 8) : 0 ) + params.encoder

        const template = `# encoder ${args}
$encoder ${encoder}
  .easypar ${type.toUpperCase()} ${channel} ${typeNumber} ${min} ${max} ${mode}
  .showvalue ${params.showvalue ? params.showvalue : (config.encoder.showvalue ? 'on' : 'off')}
  .mode ${params.leds ? params.leds : config.encoder.mode}
  .resolution ${params.resolution ? params.resolution : resolution}
  .default ${dfault}
`
        return Bacara.prepare_BCR2000(template,options)
      },
      button(args) {
        const params = Bacara.toObject(args)
        const parameter = _.get(devices, `${params.device}.parameters.${params.parameter}`)
        let type = params.type ? params.type.toLowerCase() : _.get(settings, `${params.device}.paramType`, 'cc')
        if (parameter && !parameter[type]) {
          const newType = (type == 'cc') ? 'nrpn' : 'cc'
          if (!parameter[newType]) {
            console.error(`Unknown parameter type: ${type}  (and no alternative) for parameter ${params.parameter}`)
            process.exit(1)
          }
          type = newType
        }

        let typeNumber = (parameter ? (type == 'cc')
          ? _.get(parameter, `${type}.msb`, parameter ? parameter[type] : null)
          : ((_.get(parameter, `${type}.msb`) << 7) | _.get(parameter, `${type}.lsb`))
          : (Object.prototype.hasOwnProperty.call(params,'number') ? params.number : (((params.msb & 0x7F) << 7) | ((params.lsb & 0x7F) << 0)))
        )

        let channel
        if (!params.sysex) {
          let mid = ''
          if (/^\d+$/.test(params.track)) {
            mid = `${typeof params.track != 'string' ? 'track.' : ''}${params.track}`
          } else {
            mid = `${params.track}`
          }
          const channelPath = `${params.device}.${mid}.channel`
          channel = params.track ? _.get(settings, channelPath) : params.channel
          if (!channel) {
            console.error(`Unknown channel: ${channelPath} in [button ${args}]`)
            process.exit(1)
          }
        }
        const mode = `${params.mode ? params.mode : 'increment'}`

        const minName = 'min'
        const maxName = 'max'
        const minDefault = 0
        const maxDefault = 127
        let min = Object.prototype.hasOwnProperty.call(params,minName) ? params[minName] : (_.get(parameter, `${type}.${minName}`, parameter && Object.prototype.hasOwnProperty.call(parameter,minName) ? parameter[minName] : minDefault))
        let max = Object.prototype.hasOwnProperty.call(params,maxName) ? params[maxName] : (_.get(parameter, `${type}.${maxName}`, parameter && Object.prototype.hasOwnProperty.call(parameter,maxName) ? parameter[maxName] : maxDefault))

        const omin = min
        const omax = max

        const inverse = Object.prototype.hasOwnProperty.call(params,'inverse') ? params.inverse : (mode == 'increment')
        if (inverse) {
          const tmp = max
          max = min
          min = tmp
        }

        //      const dfault = Object.prototype.hasOwnProperty.call(params,'default') ? params.default : (parameter ? ( inverse ? (parameter.max ? parameter.max : 127) : (parameter.min ? parameter.min : 0) ) : null )
        const dfault = Object.prototype.hasOwnProperty.call(params,'default') ? params.default : min
        const increment = (params.increment ? params.increment : (mode == 'increment' ? 1 : '') )
        if (params.group === 'encoder') {
          params.group = 0
        }
        if (params.group === 'upper') {
          params.group = 5
        }
        if (params.group === 'lower') {
          params.group = 6
        }
        if (params.group === 'user') {
          params.group = 7
        }
        if (params.group === 'function') {
          params.group = 7; params.button += 4
        }
        if (params.group === 'group') {
          params.group = 8
        }
        if (params.group === 'footswitch') {
          params.group = 8; params.button += 4
        }
        if (params.group === 'preset') {
          params.group = 8; params.button += 6
        }
        const button = ( params.group ? ((params.group - 1) * 8) : 0 ) + params.button
        const sysex = params.sysex ? commands.sysex(params.sysex) : null
        const sysexTemplate = `# button ${args}
$button ${button}
  .showvalue on
  .default 0
  .mode down
  .minmax 0 0
  .tx ${sysex}
`
            const template = `# button ${args}
$button ${button}
  .easypar ${type.toUpperCase()} ${channel} ${typeNumber} ${min} ${max} ${mode} ${increment}
  .showvalue on
  .minmax ${omin} ${omax}
  .default ${dfault}
`
        return Bacara.prepare_BCR2000(sysex ? sysexTemplate : template,options)
      },
    }

    function substitute(p) {
      let r = p.replace(/\$\{config.([\w.-]+)}/g, function (match, term) {
        return _.get(config, term, match)
      })

      r = r.replace(/\$\{([\w.-]+)}/g, function (match, term) {
        return _.get(devices, term, match)
      })

      r = r.replace(/#\s*\[\s*(\w+)\s*(.*)\s*]/g, function (match, command, args) {
        return ''
      })

      r = r.replace(/\[\s*(\w+)\s*(.*)\s*]/g, function (match, command, args) {
        if (commands[command]) {
          return commands[command](args)
        } else {
          throw new Error(`No such command: ${command}`)
        }
      })

      if (_.startsWith(r, '/') && _.endsWith(r, '/')) {
        return new RegExp(_.trim(r, '/'))
      }
      return r
    }

    function transform (obj) {
      if (obj === undefined || obj === null) {
        return obj
      }
      if (_.isBuffer(obj)) {
        return substitute(obj.toString())
      }
      if (_.isString(obj)) {
        return substitute(obj)
      }
      if (_.isArray(obj)) {
        return _.map(obj, transform)
      }
      if (_.isPlainObject(obj)) {
        return _.mapValues(obj, transform)
      }
      return obj
    }

    return transform(tmpl).replace(/^\s+\$/gm,'$')
  }

  static instruct_BCR2000(text,options) {
    if (options.midi === true) {
      options.midi = 'BCR2000'
    }

    const midiOutputNames = easymidi.getOutputs()

    const outputNamesMatching = midiOutputNames.filter( outputName => outputName.match(options.midi) )

    if (!outputNamesMatching || outputNamesMatching.length != 1) {
      console.error(`No (unambiguous) output port found with: ${options.midi}`)
      process.exit(1)
    }

    console.error(`Sending to: ${outputNamesMatching[0]}`)
    const midiOutput = new easymidi.Output(outputNamesMatching[0])

    const bc_hdr = [
      0xF0,   /* sysex start - 0xf0 */
      0x00,   /* manufacturer ID 1 - 0x00 */
      0x20,   /* manufacturer ID 2 - 0x20 */
      0x32,   /* manufacturer ID 3 - 0x32 */
      options.deviceId,   /* device ID */
      options.modelId,   /* model ID - 0x15 for BCR2000 */
      0x20,   /* command - 0x20 for patch data */
      0x00,   /* block number high byte */
      0x00,   /* block number low byte */
      0xF7,   /* sysex end - 0xf7 */
    ]

    const lines = text.split(/\n/g).map( line => line.replace(/[#;].*$/,'').trim() ).filter( line => line && line.length )
    let blockNumber = 0
    for (let line of lines) {
      if (blockNumber && options.delay) {
        sleep.msleep(options.delay)
      }
      const blockData = line.split('').map( char => char.charCodeAt(0) )

      let bytes = bc_hdr.slice(0, bc_hdr.length - 3) // all except last 3 bytes
      bytes.push( (blockNumber >> 7) & 0x7F )
      bytes.push( (blockNumber >> 0) & 0x7F )
      bytes = bytes.concat(blockData)
      bytes.push(0xF7) // End Of Sysex

      process.stdout.write('.')
      midiOutput.send('sysex',bytes)
      blockNumber++
    }
    console.log('')
    console.log('done')
  }


}

module.exports = Bacara