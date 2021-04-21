const easymidi = require('easymidi')
const sleep = require('sleep')
const yves = require('../lib/yves')
const _ = require('lodash')
const config = require('config')
const os = require('os')
const fs = require('fs-extra')
const jsonfile = require('jsonfile')

const ElectraOne = require('../lib/electraOne')


let mappedMidiChannel = 0

function readState() {
  const filePath = `${__dirname}/../state/router.json`
  if (fs.existsSync(filePath)) {
    const state = jsonfile.readFileSync(filePath)
    if (state.mappedMidiChannel) {
      mappedMidiChannel = state.mappedMidiChannel
    }
  }
}

readState()

function writeState() {
  const state = { mappedMidiChannel }
  jsonfile.writeFileSync(`${__dirname}/../state/router.json`, state, { flag: 'w', spaces: 2 })
}



function handleIncoming(from,options) {
  const electraOneMidiChannel = 0

  return (msg) => {

/*    debug('handleIncoming: %s %y',from,msg)*/
    const outputMidiName = (from == options.electraOne) ? 'virus-ti' : options.electraOne
    const midiOutput = ElectraOne.output(outputMidiName, true)
    const mapToElectraOne = (from == options.virusTi)
    if (midiOutput) {
      switch (msg._type) {
      case 'cc':
        if ( (mapToElectraOne && msg.channel == mappedMidiChannel) || (!mapToElectraOne && msg.channel == electraOneMidiChannel) ) {
          midiOutput.send('cc',{channel: mapToElectraOne ? electraOneMidiChannel : mappedMidiChannel, controller: msg.controller, value: msg.value})
          debug('Applied MIDI mapped channel %y to CC %d for %y',(mapToElectraOne ? electraOneMidiChannel : mappedMidiChannel)+1,msg.controller,outputMidiName)
        }
        break
      case 'sysex':
        if (msg.bytes && msg.bytes.length==5 && msg.bytes[0]==0xF0 && msg.bytes[1]==0x7D && msg.bytes[2]==0x20 && msg.bytes[4]==0xF7) {
          mappedMidiChannel = msg.bytes[3]
          writeState()
          debug('Set MIDI mapped channel: %y',mappedMidiChannel + 1)
        } else {
          if (msg.bytes && msg.bytes.length==11 && msg.bytes[0]==0xF0 && msg.bytes[1]==0x00 && msg.bytes[2]==0x20 && msg.bytes[3]==0x33 && msg.bytes[4]==0x01 && msg.bytes[6]>=0x6E && msg.bytes[6]<=0x71 && msg.bytes[7]==(mapToElectraOne?mappedMidiChannel:electraOneMidiChannel) && msg.bytes[10]==0xF7) {
            msg.bytes[7] = ( mapToElectraOne ? electraOneMidiChannel : mappedMidiChannel )
            debug('Applied MIDI mapped channel %y to SysEx for %y',msg.bytes[7]+1,outputMidiName)
            midiOutput.send('sysex',msg.bytes)
          }
        }
        break
      default:
        // Do nothing
        break
      }
    } else {
      console.error(`Unable to connect to MIDI output '${outputMidiname}'`)
    }
  }
}

function setupInputHandlers(options) {
  const midiInput_electraOne = ElectraOne.input(options.electraOne, true)
  midiInput_electraOne.on('message', handleIncoming(options.electraOne,options) )

  const midiInput_virusTI = ElectraOne.input(options.virusTi, true)
  midiInput_virusTI.on('message', handleIncoming(options.virusTi,options) )
}


function setupMidi(options) {
  setupInputHandlers(options)
}

function routerConsole(name, sub, options) {
/*  debug('options: %y',options)*/
  setupMidi(options)
}

module.exports = {
  name: 'router',
  description: 'Start router for Easy One <-> Virus TI',
  handler: routerConsole,
}
