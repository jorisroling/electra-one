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
          debug('Applied MIDI mapped channel %y to CC %d (value %d) for %y',(mapToElectraOne ? electraOneMidiChannel : mappedMidiChannel)+1,msg.controller,msg.value,outputMidiName)
        } else {
          midiOutput.send('cc',msg)
        }
        break
      case 'sysex':
        if (msg.bytes && msg.bytes.length==5 && msg.bytes[0]==0xF0 && msg.bytes[1]==0x7D && msg.bytes[2]==0x20 && msg.bytes[4]==0xF7) {
          mappedMidiChannel = msg.bytes[3]
          writeState()
          debug('Set MIDI mapped channel: %y',mappedMidiChannel + 1)
          /* Single SysEx Parameter F0 00 20 33 01 XX (6E - 72) YY */
        } else if (msg.bytes && msg.bytes.length==11 && msg.bytes[0]==0xF0 && msg.bytes[1]==0x00 && msg.bytes[2]==0x20 && msg.bytes[3]==0x33 && msg.bytes[4]==0x01 /* &&  msg.bytes[5]==0x00 */ && msg.bytes[6]>=0x6E && msg.bytes[6]<=0x72 && msg.bytes[7]==(mapToElectraOne?mappedMidiChannel:electraOneMidiChannel) && msg.bytes[10]==0xF7) {
          msg.bytes[7] = ( mapToElectraOne ? electraOneMidiChannel : mappedMidiChannel )
          const page = String.fromCharCode(65 + ((msg.bytes[6] + (msg.bytes[6] < 0x70 ? 4 /* 5 */ : 0) ) - 0x70 ) )
          let info = `page ${page} parameter ${msg.bytes[8]} (0x${msg.bytes[8].toString(16).toUpperCase()}) value ${msg.bytes[9]}`
          debug('Applied MIDI mapped channel %y %s to SysEx for %y',msg.bytes[7]+1,info,outputMidiName)
          midiOutput.send('sysex',msg.bytes)
          /* Single Dump Buffer F0 00 20 33 01 XX 10 00 00 */
        } else if (msg.bytes && msg.bytes.length==524 && msg.bytes[0]==0xF0 && msg.bytes[1]==0x00 && msg.bytes[2]==0x20 && msg.bytes[3]==0x33 && msg.bytes[4]==0x01 /* &&  msg.bytes[5]==0x00 */ && msg.bytes[6]==0x10 && msg.bytes[7]==0x00 && msg.bytes[8]==0x00) {
          debug('Forwarding Single Dump SysEx to %y (%d)',outputMidiName,msg.bytes[286+10])
          midiOutput.send('sysex',msg.bytes)
        } else {
          debug('Forwarding SysEx to %y',outputMidiName)
          midiOutput.send('sysex',msg.bytes)
        }
        debug('SysEx Bytes %y',msg.bytes.length)
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

  readState()

  const midiOutput = ElectraOne.output(options.electraOne, true)
  if (midiOutput) {
    midiOutput.send('sysex',[0xF0, 0x7D, 0x20, mappedMidiChannel, 0xF7])
    debug('Initialise Electra One MIDI mapped channel %y',mappedMidiChannel)
  }

  setupMidi(options)
}

module.exports = {
  name: 'router',
  description: 'Start router for Electra One <-> Virus TI',
  handler: routerConsole,
}
