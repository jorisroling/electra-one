#!/usr/bin/env NODE_ENV=production node

/*process.env.SUPPRESS_NO_CONFIG_WARNING = '1'*/
process.env.NODE_CONFIG_DIR = `${__dirname}/config`

const args = require('args')

const yves = require('./lib/yves')

const pkg = require('./package.json')

args
  .option('electra-one-ctrl', 'Electra One MIDI CTRL interface name','electra-one-ctrl')
  .option('electra-one', 'Electra One MIDI interface name','electra-one-1')
  .option('virus-ti', 'Virus TI MIDI interface name','virus-ti')
  .option('filename', 'Filename to process')


const commands = require('./lib/commands')

Object.keys(commands).forEach( command => {
  args.command(commands[command].name, commands[command].description, commands[command].handler, commands[command].aliases)
})

args.parse(process.argv,{name:pkg.name})

