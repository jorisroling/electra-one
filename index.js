#!/usr/bin/env NODE_ENV=production node

/*process.env.SUPPRESS_NO_CONFIG_WARNING = '1'*/
process.env.NODE_CONFIG_DIR = `${__dirname}/config`

const args = require('args')

const yves = require('./lib/yves')

const pkg = require('./package.json')

const config = require('config')
const _ = require('lodash')

args
  .option('electraOneCtrl', 'Electra One MIDI CTRL interface name', _.get(config,'options.electraOneCtrl','electra-one-ctrl'))
  .option('scenario', 'Routing Scenario', _.get(config, 'options.scenario', 'default'))
  .option('page', 'Page ID to operate on, this options can be used more than once. Use \'electra-one page list --filename preset.epr\' to show available Page ID\'s')

  .option('electra', 'Electra One MIDI interface name (part)', _.get(config, 'options.electra', 'electra-one-port-2'))
  .option('clock', 'Clock Input MIDI interface name (part)', _.get(config, 'options.clock', 'tr-6s'))

  .option('transpose', 'Transpose Input MIDI interface name (part)', _.get(config, 'options.transpose', 'komplete-kontrol'))
  .option('transposeChannel', 'Transpose Input Channel (1-16)', _.get(config, 'options.transposeChannel', 1))

  .option('general', 'General Input MIDI interface name (part)', _.get(config, 'options.general', 'lightpad-block'))
  .option('generalChannel', 'General Input Channel (1-16)', _.get(config, 'options.generalChannel', 1))

  .option('remote', 'Remote Input MIDI interface name (part)', _.get(config, 'options.remote', 'thouch-block'))
  .option('remoteChannel', 'Remote Input Channel (1-16)', _.get(config, 'options.remoteChannel', 1))

  .option('bank', 'For upload & remove commands: Specify a bank as <1-6>', _.get(config, 'options.bank', 0))
  .option('slot', 'For upload & remove commands: Specify a slot as <1-12>', _.get(config, 'options.slot', 0))

  .option('lua', 'LUA command for direct execution')

  .option('template', 'Process Template Preset File path')
  .option('filename', 'Process Output Filename')

  .option('id', 'Control Update ID', _.get(config, 'options.id', 0))
  .option('name', 'Control Update Name', _.get(config, 'options.name', ''))
  .option('color', 'Control Update Color')
  .option('visible', 'Control Update Visible')

const commands = require('./lib/commands')

Object.keys(commands).forEach( command => {
  if (typeof commands[command].setup == 'function') {
    commands[command].setup(args)
  }
  if (Array.isArray(commands[command].examples)) {
    for (const e in commands[command].examples) {
      args.example(commands[command].examples[e].usage, commands[command].examples[e].description)
    }
  }
  args.command(commands[command].name, commands[command].description, commands[command].handler, commands[command].aliases)
})

if (process.argv.length == 2) {
  process.argv.push('help')
}
args.parse(process.argv, {name:pkg.name, args})

