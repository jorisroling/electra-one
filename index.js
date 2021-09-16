#!/usr/bin/env NODE_ENV=production node

/*process.env.SUPPRESS_NO_CONFIG_WARNING = '1'*/
process.env.NODE_CONFIG_DIR = `${__dirname}/config`

const args = require('args')

const yves = require('./lib/yves')

const pkg = require('./package.json')

args
  .option('electra-one-ctrl', 'Electra One MIDI CTRL interface name', 'electra-one-ctrl')
  .option('scenario', 'Routing Scenario', 'default')
  .option('page', 'Page ID to operate on, this options can be used more than once. Use \'electra-one page list --filename preset.epr\' to show available Page ID\'s')

  .option('electra', 'Electra One MIDI interface name (part)', 'electra-one-port-2')
  .option('clock', 'Clock Input MIDI interface name (part)', 'bacara')

  .option('transpose', 'Transpose Input MIDI interface name (part)', 'komplete-kontrol')
  .option('transposeChannel', 'Transpose Input Channel (1-16)', 1)

  .option('general', 'General Input MIDI interface name (part)', 'lightpad-block')
  .option('generalChannel', 'General Input Channel (1-16)', 1)

  .option('remote', 'Remote Input MIDI interface name (part)', 'thouch-block')
  .option('remoteChannel', 'Remote Input Channel (1-16)', 1)

  .option('bank', 'For upload & remove commands: Specify a bank as <1-6>', 0)
  .option('slot', 'For upload & remove commands: Specify a slot as <1-12>', 0)

  .option('lua', 'LUA command for direct execution')

  .option('template', 'Process Template Preset File path')
  .option('filename', 'Process Output Filename')

  .option('id', 'Control Update ID', 0)
  .option('name', 'Control Update Name', '')
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

