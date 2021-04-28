const easymidi = require('easymidi')
const sleep = require('sleep')
const yves = require('../lib/yves')
const _ = require('lodash')
const config = require('config')
const os = require('os')
const fs = require('fs-extra')
const jsonfile = require('jsonfile')

const ElectraOne = require('../lib/electraOne')


let mappedPart = 1

function readState() {
  const filePath = `${__dirname}/../state/router.json`
  if (fs.existsSync(filePath)) {
    const state = jsonfile.readFileSync(filePath)
    if (state.mappedPart) {
      mappedPart = state.mappedPart
    }
  }
}



function writeState() {
  const state = { mappedPart }
  jsonfile.writeFileSync(`${__dirname}/../state/router.json`, state, { flag: 'w', spaces: 2 })
}



function handleIncoming(from,to,targetElectraOne,options) {
  const electraOneMidiChannel = 0

  return (msg) => {
//    debug('handleIncoming: %s %y',from,msg)
/*    const outputMidiName = (from == options.electraOne) ? 'virus-ti' : options.electraOne*/
    const midiOutput = ElectraOne.output(to)
//    const targetElectraOne = (from == options.virusTi)
    if (midiOutput) {
      switch (msg._type) {
      case 'cc':
        if (options.channels.indexOf(msg.channel+1)>=0) {
          if (options.portMap=='virus-ti' && (targetElectraOne && msg.channel == (mappedPart - 1)) || (!targetElectraOne && msg.channel == electraOneMidiChannel) ) {
            midiOutput.send('cc',{channel: targetElectraOne ? electraOneMidiChannel : (mappedPart-1), controller: msg.controller, value: msg.value})
            debug('Part mapping %y applied to CC %d (value %d) for %y',(targetElectraOne ? (electraOneMidiChannel+1) : mappedPart),msg.controller,msg.value,to)
          } else {
            debug('Forwarding CC %d (value %d) on channel %d for %y',msg.controller,msg.value,msg.channel+1,to)
            midiOutput.send('cc',msg)
          }
        }
        break
      case 'sysex':
        if (options.portMap=='virus-ti' && msg.bytes) {
          if (msg.bytes.length==5 && msg.bytes[0]==0xF0 && msg.bytes[1]==0x7D && msg.bytes[2]==0x20 && msg.bytes[4]==0xF7) {
            mappedPart = msg.bytes[3]
            writeState()
            debug('Set mapped part: %y',mappedPart)
            /* Single SysEx Parameterchange F0 00 20 33 01 XX (6E - 72) YY */
          } else if (msg.bytes.length==11 && msg.bytes[0]==0xF0 && msg.bytes[1]==0x00 && msg.bytes[2]==0x20 && msg.bytes[3]==0x33 && msg.bytes[4]==0x01 /* &&  msg.bytes[5]==0x00 */ && msg.bytes[6]>=0x6E && msg.bytes[6]<=0x72 && msg.bytes[7]==(targetElectraOne?(mappedPart-1):electraOneMidiChannel) && msg.bytes[10]==0xF7) {
            msg.bytes[7] = ( targetElectraOne ? electraOneMidiChannel : (mappedPart-1) )
            const page = String.fromCharCode(65 + ((msg.bytes[6] + (msg.bytes[6] < 0x70 ? 4 /* 5 */ : 0) ) - 0x70 ) )
            let info = `page ${page} parameter ${msg.bytes[8]} (0x${msg.bytes[8].toString(16).toUpperCase()}) value ${msg.bytes[9]}`
            debug('Part mapping %y applied %s to SysEx Parameterchange for %y',msg.bytes[7]+1,info,to)
            midiOutput.send('sysex',msg.bytes)

            /* Single Request F0 00 20 33 01 XX 30 00 YY */
          } else if (msg.bytes.length==10 && msg.bytes[0]==0xF0 && msg.bytes[1]==0x00 && msg.bytes[2]==0x20 && msg.bytes[3]==0x33 && msg.bytes[4]==0x01 /* &&  msg.bytes[5]==0x00 */ && msg.bytes[6]==0x30 && msg.bytes[7]==0x00 /* && msg.bytes[8]==0x00 */) {
            msg.bytes[8] = ( targetElectraOne ? electraOneMidiChannel : mappedPart )
            debug('Part mapping %y applied to Single Request SysEx to %y',msg.bytes[8],to)
            midiOutput.send('sysex',msg.bytes)

            /* Single Dump Buffer F0 00 20 33 01 XX 10 00 YY */
          } else if (msg.bytes.length==524 && msg.bytes[0]==0xF0 && msg.bytes[1]==0x00 && msg.bytes[2]==0x20 && msg.bytes[3]==0x33 && msg.bytes[4]==0x01 /* &&  msg.bytes[5]==0x00 */ && msg.bytes[6]==0x10 && msg.bytes[7]==0x00 /* && msg.bytes[8]==0x00 */ ) {
            msg.bytes[8] = ( targetElectraOne ? electraOneMidiChannel : mappedPart )
            debug('Part mapping %y applied to Single Dump SysEx to %y (debug %d)',msg.bytes[8]+1,to,msg.bytes[286+10])
            midiOutput.send('sysex',msg.bytes)
          }
        } else { /* Anything else */
          debug('Forwarding SysEx to %y',to)
          midiOutput.send('sysex',msg.bytes)
        }
/*        debug('SysEx Bytes %y',msg.bytes.length)*/
        break
      default:
        // Do nothing
        break
      }
    } else {
      console.error(`Unable to connect to MIDI output '${to}'`)
    }
  }
}

function setupMidi(options) {
  const scenario = _.get(config,`router.scenarios.${options.scenario}`)
  if (scenario) {
    const devices = Object.keys(scenario)
    for (const device of devices) {
      if (scenario[device].enabled && scenario[device].port && scenario[device].channels && scenario[device].channels.length) {
        const electraOnePortName = `electra-one-${scenario[device].port}`
        const midiInput_electraOne = ElectraOne.input(electraOnePortName, true)
        midiInput_electraOne.on('message', handleIncoming(electraOnePortName,device,false,scenario[device]) )

        const midiInput_device = ElectraOne.input(device, true)
        midiInput_device.on('message', handleIncoming(device,electraOnePortName,true,scenario[device]) )
      }
    }
  } else {
    console.error(`Unknown scenario "${options.scenario}"`)
  }
}

function routerConsole(name, sub, options) {
  readState()

  const midiOutput = ElectraOne.output(options.electraOne, true)
  if (midiOutput) {
    midiOutput.send('sysex',[0xF0, 0x7D, 0x20, mappedPart-1, 0xF7])
    debug('Initialise Electra One mapped part %y',mappedPart)
  }

  setupMidi(options)
}

module.exports = {
  name: 'router',
  description: 'Start router for Electra One <-> Virus TI',
  handler: routerConsole,
}
