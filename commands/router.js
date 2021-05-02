const easymidi = require('easymidi')
const sleep = require('sleep')
const yves = require('../lib/yves')
const _ = require('lodash')
const config = require('config')
const os = require('os')
const fs = require('fs-extra')
const path = require('path')
const untildify = require('untildify')
const jsonfile = require('jsonfile')

const ElectraOne = require('../lib/electraOne')


let mapping = {
  "part": 1,
}

function setMapping(key,value) {
  mapping[key] = value
}

function getMapping(key) {
  const pair = key.split(':')
  const mapped = mapping[pair[0]]
  switch (pair[1]) {
  case '+1':
    return mapped + 1
  case '-1':
    return mapped - 1
  default:
    return mapped
  }
}

function doMapping(bytes) {
  return bytes.map( byte => (typeof byte == "string") ? getMapping(byte) : byte )
}


function readState() {
  const filePath = path.resolve((process.env.NODE_ENV=='production')?untildify(`~/.electra-one/state/router.json`):`${__dirname}/../state/router.json`)
  if (fs.existsSync(filePath)) {
    const state = jsonfile.readFileSync(filePath)
    if (state.mapping) {
      mapping = state.mapping
    }
  }
}



function writeState() {
  const filePath = path.resolve((process.env.NODE_ENV=='production')?untildify(`~/.electra-one/state/router.json`):`${__dirname}/../state/router.json`)
  fs.ensureDirSync(path.dirname(filePath))
  const state = { mapping }
  jsonfile.writeFileSync(filePath, state, { flag: 'w', spaces: 2 })
}


let sendSingleRequestLastTime
let receivedSingleRequestLastTime
const electraOneMidiChannel = 0
let sendSingleRequestTimeoutID
const sendSingleRequestTimeoutTime = 500

let sendSingleDumpLastTime
let sendSingleDumpTimeoutID
const sendSingleDumpTimeoutTime = 1000

function sendSingleDump(midiOutput, bytes) {
  const now = Date.now()

  function sendSingleDumpSysEx(midiOutput, bytes) {
/*    debug('sendSingleDumpSysEx now: %y  diff: %y',now,(now - sendSingleDumpLastTime))*/
    midiOutput.send('sysex',bytes)
    sendSingleDumpLastTime = Date.now()
    sendSingleDumpTimeoutID=null
  }

  clearTimeout(sendSingleDumpTimeoutID)
  const timeout = sendSingleDumpLastTime ? ((sendSingleDumpTimeoutTime<(now-sendSingleDumpLastTime)) ? 0 : Math.max(sendSingleDumpTimeoutTime-(now-sendSingleDumpLastTime),0) ) : 0
//  debug('sendSingleDump timeout: %y  now: %y  last: %y  diff: %y  tres: %y',timeout,now,sendSingleDumpLastTime,(now-sendSingleDumpLastTime),sendSingleDumpTimeoutTime)
  sendSingleRequestDumpID = setTimeout( sendSingleDumpSysEx, timeout, midiOutput, bytes)
}


function sendSingleRequest(midiOutput) {
  const now = Date.now()

  function sendSingleRequestSysEx(midiOutput,bytes) {
/*    debug('sendSingleRequestSysEx now: %y  diff: %y diff2: %y',now,(now - sendSingleRequestLastTime),(now - receivedSingleRequestLastTime))*/
    midiOutput.send('sysex',bytes)
    sendSingleRequestLastTime = Date.now()
    sendSingleRequestTimeoutID=null
  }

  clearTimeout(sendSingleRequestTimeoutID)
  const timeout = sendSingleRequestTimeoutTime ? ((sendSingleRequestTimeoutTime<(now-sendSingleRequestLastTime)) ? 0 : Math.max(sendSingleRequestTimeoutTime-(now-sendSingleRequestLastTime),0) ) : 0
//  debug('sendSingleRequest timeout: %y',timeout)
  const bytes = [0xF0,0x00,0x20,0x33,0x01,0x00,0x30,0x00,getMapping('part:-1'),0xF7]
  sendSingleRequestTimeoutID = setTimeout( sendSingleRequestSysEx, sendSingleRequestTimeoutTime, midiOutput, bytes)
}

function handleIncoming(from,to,targetElectraOne,options) {
  return (msg) => {
/*   debug('handleIncoming: %s %y',from,msg)*/
    const midiOutput = ElectraOne.output(to)

//    const targetElectraOne = (from == options.virusTi)
    if (midiOutput) {
      switch (msg._type) {
      case 'cc':
        if (options.channels.indexOf(msg.channel+1)>=0) {
          if (options.portMap=='virus-ti' && (targetElectraOne && msg.channel == getMapping('part:-1')) || (!targetElectraOne && msg.channel == electraOneMidiChannel) ) {
            midiOutput.send('cc',{channel: targetElectraOne ? electraOneMidiChannel : getMapping('part:-1'), controller: msg.controller, value: msg.value})
            debug('Part mapping %y applied to CC %d (value %d) for %y',(targetElectraOne ? (electraOneMidiChannel+1) : getMapping('part')),msg.controller,msg.value,to)
          } else {
            debug('Forwarding CC %d (value %d) on channel %d for %y',msg.controller,msg.value,msg.channel+1,to)
            midiOutput.send('cc',msg)
          }
        }
        break
      case 'sysex':
        if (options.portMap=='virus-ti' && msg.bytes) {

          /* Query Part Change Custom SysEx */
          if (msg.bytes.length==5 && msg.bytes[0]==0xF0 && msg.bytes[1]==0x7D && msg.bytes[2]==0x21 && msg.bytes[3]==0xF7) {
            debug('Get mapped part: %y by %y',getMapping('part'),from)

            const midiOutput2 = ElectraOne.output(from)

            midiOutput2.send('sysex',[0xF0, 0x7D, 0x20, getMapping('part'), 0xF7])

          /* Part Change Custom SysEx */
          } else if (msg.bytes.length==5 && msg.bytes[0]==0xF0 && msg.bytes[1]==0x7D && msg.bytes[2]==0x20 && msg.bytes[4]==0xF7) {
            setMapping('part',msg.bytes[3])
            writeState()
            debug('Set mapped part: %y by %y',getMapping('part'),from)

            receivedSingleRequestLastTime = Date.now()
            sendSingleRequest(midiOutput)

/*          } else if (msg.bytes.length==11 && msg.bytes[0]==0xF0 && msg.bytes[1]==0x00 && msg.bytes[2]==0x20 && msg.bytes[3]==0x33 && msg.bytes[4]==0x01 && msg.bytes[6]==0x72 && msg.bytes[10]==0xF7) {
//            F0 00 20 33 01 00 72 00  1D 00 F7
            setMapping('part',msg.bytes[7]+1)
            debug('Set mapped part: %y by %y',getMapping('part'),from)

            sendSingleRequest(midiOutput)
*/
            /* Single SysEx Parameterchange F0 00 20 33 01 XX (6E - 72) YY */
          } else if (msg.bytes.length==11 && msg.bytes[0]==0xF0 && msg.bytes[1]==0x00 && msg.bytes[2]==0x20 && msg.bytes[3]==0x33 && msg.bytes[4]==0x01 /* &&  msg.bytes[5]==0x00 */ && msg.bytes[6]>=0x6E && msg.bytes[6]<=0x72 && msg.bytes[7]==(targetElectraOne?getMapping('part:-1'):electraOneMidiChannel) && msg.bytes[10]==0xF7) {
            const page = String.fromCharCode(65 + ((msg.bytes[6] + (msg.bytes[6] < 0x70 ? 4 /* 5 */ : 0) ) - 0x70 ) )
            let info = `page ${page} parameter ${msg.bytes[8]} (0x${msg.bytes[8].toString(16).toUpperCase()}) value ${msg.bytes[9]}`

            // F0 00 20 33 01 XX 72 00  21 32 F7 => preset change
            // F0 00 20 33 01 XX 72 00  20 1A F7 => bank change
            if (msg.bytes[6]==0x72 && (msg.bytes[8]==0x20 || msg.bytes[8]==0x21)) {
              debug('Patch or Bank change, Single Request back')
              receivedSingleRequestLastTime = Date.now()
              sendSingleRequest(ElectraOne.output(from))

              // F0 00 20 33 01 XX 72 01  1D 02 F7
            } else if (msg.bytes[6]==0x72 && msg.bytes[8]==0x1D) {
              debug('Part change, Single Request back')
              setMapping('part',msg.bytes[7]+1)
              writeState()
              midiOutput.send('sysex',[0xF0, 0x7D, 0x20, getMapping('part'), 0xF7])
              receivedSingleRequestLastTime = Date.now()
              sendSingleRequest(ElectraOne.output(from))
            } else {
              msg.bytes[7] = ( targetElectraOne ? electraOneMidiChannel : getMapping('part:-1') )
              debug('Part mapping %y applied %s to SysEx Parameterchange for %y',msg.bytes[7]+1,info,to)
              midiOutput.send('sysex',msg.bytes)
            }

            /* Single Request F0 00 20 33 01 XX 30 00 YY */
          } else if (msg.bytes.length==11 && msg.bytes[0]==0xF0 && msg.bytes[1]==0x00 && msg.bytes[2]==0x20 && msg.bytes[3]==0x33 && msg.bytes[4]==0x01 /* &&  msg.bytes[5]==0x00 */ && msg.bytes[6]>=0x6E && msg.bytes[6]<=0x72 && msg.bytes[10]==0xF7) {
            if (msg.bytes[6]==0x72 && msg.bytes[8]==0x1D) {
              debug('Part change to %y, Single Request back',msg.bytes[9]+1)
              setMapping('part',msg.bytes[9]+1)
              writeState()
              midiOutput.send('sysex',[0xF0, 0x7D, 0x20, getMapping('part'), 0xF7])
              receivedSingleRequestLastTime = Date.now()
              sendSingleRequest(ElectraOne.output(from))
            }
          } else if (msg.bytes.length==10 && msg.bytes[0]==0xF0 && msg.bytes[1]==0x00 && msg.bytes[2]==0x20 && msg.bytes[3]==0x33 && msg.bytes[4]==0x01 /* &&  msg.bytes[5]==0x00 */ && msg.bytes[6]==0x30 && msg.bytes[7]==0x00 /* && msg.bytes[8]==0x00 */) {
            msg.bytes[8] = ( targetElectraOne ? electraOneMidiChannel : getMapping('part:-1') )
            debug('Part mapping %y applied to Single Request SysEx to %y',msg.bytes[8],to)
//            midiOutput.send('sysex',msg.bytes)

            receivedSingleRequestLastTime = Date.now()
            sendSingleRequest(midiOutput)

            /* Single Dump Buffer F0 00 20 33 01 XX 10 00 YY */
          } else if (msg.bytes.length==524 && msg.bytes[0]==0xF0 && msg.bytes[1]==0x00 && msg.bytes[2]==0x20 && msg.bytes[3]==0x33 && msg.bytes[4]==0x01 /* &&  msg.bytes[5]==0x00 */ && msg.bytes[6]==0x10 && msg.bytes[7]==0x00 /* && msg.bytes[8]==0x00 */ ) {
            msg.bytes[8] = ( targetElectraOne ? electraOneMidiChannel : getMapping('part:-1'))
            debug('Part mapping %y applied to Single Dump SysEx to %y',msg.bytes[8]+1,to)
//            debug('Part mapping %y applied to Single Dump SysEx to %y (debug %d)',msg.bytes[8]+1,to,msg.bytes[286+10])

            sendSingleDump(midiOutput,msg.bytes)
          } else if (msg.bytes.length==11 && msg.bytes[0]==0xF0 && msg.bytes[1]==0x00 && msg.bytes[2]==0x20 && msg.bytes[3]==0x33 && msg.bytes[4]==0x01 /* &&  msg.bytes[5]==0x00 */ && msg.bytes[6]==0x72 && msg.bytes[7]==0x00 ) {
            // F0 00 20 33 01 XX 72 00  21 32 F7 => preset change
            // F0 00 20 33 01 XX 72 00  20 1A F7 => bank change
            debug('PC')
            receivedSingleRequestLastTime = Date.now()
            sendSingleRequest(midiOutput)

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
  if (scenario && scenario.actors) {
    const actors = Object.keys(scenario.actors)
    for (const actor of actors) {
      if (scenario.actors[actor].enabled && scenario.actors[actor].port && scenario.actors[actor].channels && scenario.actors[actor].channels.length) {
        const electraOnePortName = `electra-one-${scenario.actors[actor].port}`
        const midiInput_electraOne = ElectraOne.input(electraOnePortName, true)
        midiInput_electraOne.on('message', handleIncoming(electraOnePortName,actor,false,scenario.actors[actor]) )

        const midiInput_actor = ElectraOne.input(actor, true)
        midiInput_actor.on('message', handleIncoming(actor,electraOnePortName,true,scenario.actors[actor]) )

        if (scenario.actors[actor].initialize) {
          for (const init in scenario.actors[actor].initialize) {
            const midiOutput_init = ElectraOne.output(init)
            midiOutput_init.send('sysex',doMapping(scenario.actors[actor].initialize[init]))
          }
        }
      }
    }
  } else {
    console.error(`Unknown scenario "${options.scenario}"`)
  }
}

function routerConsole(name, sub, options) {
  readState()
  setupMidi(options)
}

module.exports = {
  name: 'router',
  description: 'Start router for Electra One <-> Virus TI',
  handler: routerConsole,
}
