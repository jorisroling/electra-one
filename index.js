#!/usr/bin/env NODE_ENV=production node

/*process.env.SUPPRESS_NO_CONFIG_WARNING = '1'*/
process.env.NODE_CONFIG_DIR = `${__dirname}/config`

const args = require('args')

const yves = require('./lib/yves')

const pkg = require('./package.json')

args
 .option('electra-one-ctrl', 'Electra One MIDI CTRL interface name','electra-one-ctrl')
//  .option('electra-one', 'Electra One MIDI interface name','electra-one-1')
//  .option('virus-ti', 'Virus TI MIDI interface name','virus-ti')
  .option('filename', 'Filename to process')
  .option('scenario', 'Routing Scenario','default')
  .option('page', 'Page ID to operate on, this options can be used more than once. Use \'electra-one page list --filename preset.epr\' to show available Page ID\'s')

//  .example('electra-one page swap --page 1 --page 2', 'Swap two pages in a Preset File (.epr)')

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
args.parse(process.argv,{name:pkg.name,args})

