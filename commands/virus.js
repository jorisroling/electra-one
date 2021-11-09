const config = require('config')
const virus = require('../lib/virus')

const yves = require('../lib/yves')
const pkg = require('../package.json')
const debugError = yves.debugger(`${pkg.name.replace(/^@/, '')}:${(require('change-case').paramCase(require('path').basename(__filename, '.js'))).replace(/-/g, ':')}:error`)
const _ = require('lodash')

const { table } = require('table')
const chalk = require('chalk')
const labelColor = chalk.hex('#FF8800')
const dimColor = chalk.hex('#222')

let args

const Midi = require('../lib/midi/midi')

function virusTools(name, sub, options) {

  if (options.verbose) {
    debugError('options %y', _.fromPairs(_.toPairs(options).filter(a => a[0].length > 1 )) )
    debugError('config %y', config.util.toObject(config))
  }

  //    debug('sub %y',sub)

  switch (sub && sub.length > 0 && sub[0] && sub[0].toLowerCase()) {
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
  handler: virusTools,
  examples: [
    {usage:'electra-one virus preset search <search pattern>', description:'Search preset in Virus TI banks'},
  ],
  aliases:[]
}