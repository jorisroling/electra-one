const config = require('config')
const virus = require('../lib/virus')

const Bacara = require('../lib/bacara')
const yves = require('../lib/yves')
const pkg = require('../package.json')
const debugError = yves.debugger(`${pkg.name.replace(/^@/, '')}:${(require('change-case').paramCase(require('path').basename(__filename, '.js'))).replace(/-/g, ':')}:error`)

let args

const Midi = require('../lib/midi/midi')

function generateSetup(name, sub, options) {

  Midi.setupVirtualPorts(config.list.virtual)

  if (options.verbose) {
    debugError('options %y', _.fromPairs(_.toPairs(options).filter(a => a[0].length > 1 )) )
    debugError('config %y', config.util.toObject(config))
  }
  if (options.custom && options.custom.length) {
    Bacara.setPresetStateFilename(options.custom[options.custom.length-1])
  }

  Bacara.scanMidiPorts()
  virus.scanBanks()

  process.exit(0)
}

module.exports = {
  setup(a) {
    args = a
  },
  name: 'setup',
  description: 'Generate Custom Setup',
  handler: generateSetup,
  examples: [
    {usage:'electra-one setup --custom custom.json', description:'Generates Custom Setup'},
  ],
  aliases:[]
}