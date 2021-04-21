const easymidi = require('easymidi')
const sleep = require('sleep')
const yves = require('../lib/yves')
const _ = require('lodash')
const config = require('config')
const os = require('os')

const ElectraOne = require('../lib/electraOne')

//const { devices } = require('../lib/devices')
//const jsonfile = require('jsonfile')
const fs = require('fs-extra')
//const escapeRegexString = require('escape-regex-string')


function handleNamedSysEx(midiName) {

  return function handleSysEx(msg) {

    const manufacturerID = ((msg.bytes[1] & 0x7F) << 14) | ((msg.bytes[2] & 0x7F) << 7) | ((msg.bytes[3] & 0x7F) << 0)
    const messageClass = msg.bytes[4]

    const productID = ((msg.bytes[5] & 0x7F) << 7) | ((msg.bytes[6] & 0x7F) << 0)
    const serial = ((msg.bytes[7] & 0x7F) << 28) | ((msg.bytes[7] & 0x7F) << 21) | ((msg.bytes[9] & 0x7F) << 14) | ((msg.bytes[10] & 0x7F) << 7) | ((msg.bytes[11] & 0x7F) << 0)
    const msgTransactionID = ((msg.bytes[12] & 0x7F) << 7) | ((msg.bytes[13] & 0x7F) << 0)
    const commandFlags = ((msg.bytes[14] & 0x7F) << 7) | ((msg.bytes[15] & 0x7F) << 0)
    const command = (commandFlags >> 0) & 0x03FF
    const flags = (commandFlags >> 10) & 0x0F
    const dataLength = ((msg.bytes[16] & 0x7F) << 7) | ((msg.bytes[17] & 0x7F) << 0)

    const transactionDevice = Object.keys(midiDevices).reduce( (dev, name) => {
      const index = midiDevices[name].transactions.indexOf(msgTransactionID)
      if ( index >= 0) {
        midiDevices[name].transactions.splice(index,1)
        return name
      } else {
        return dev
      }
    })
    if (manufacturerID == devices.icm4.manufactererID ) {
      switch (command) {
      case 0x02: { // RetDevice
        if (transactionDevice) {
          if (!initResponse) {
            midiDevices[transactionDevice].protocol = ((msg.bytes[18] & 0x7F) << 0)
            midiDevices[transactionDevice].mode = ((msg.bytes[19] & 0x7F) << 0)

            // command 0x03 = GetCommandList
            const inq = [ 0xF0, 0x00, 0x01, 0x73, 0x7E, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,  (transactionID >> 7) & 0x7F, (transactionID >> 0) & 0x7F, 0x40, 0x03, 0x00, 0x00, 0x00, 0xF7]
            midiDevices[transactionDevice].transactions.push(transactionID++)
            midiDevices[transactionDevice].output.send('sysex',sysexChecksum(inq))
            initResponse = true
          }
        }
      }
        break
      case 0x04: { // RetCommandList
        if (transactionDevice) {
          midiDevices[transactionDevice].commands = []
          for (let c = 0; c < dataLength; c += 2) {
            midiDevices[transactionDevice].commands.push( ((msg.bytes[18 + c] & 0x7F) << 7) | ((msg.bytes[19 + c] & 0x7F) << 0) )
          }

          // command 0x20 = GetMIDIInfo
          const inq = [ 0xF0, 0x00, 0x01, 0x73, 0x7E, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,  (transactionID >> 7) & 0x7F, (transactionID >> 0) & 0x7F, 0x40, 0x20, 0x00, 0x00, 0x00, 0xF7]
          midiDevices[transactionDevice].transactions.push(transactionID++)
          midiDevices[transactionDevice].output.send('sysex',sysexChecksum(inq))

        }
      }
        break
      case 0x06: { // RetInfoList
        if (transactionDevice) {
          midiDevices[transactionDevice].infoList = []
          for (let c = 0; c < dataLength; c += 2) {
            midiDevices[transactionDevice].infoList.push( { id: (msg.bytes[18 + c] & 0x7F), max:(msg.bytes[19 + c] & 0x7F) } )
          }

          // command 0x09 = GetResetList
          const inq = [ 0xF0, 0x00, 0x01, 0x73, 0x7E, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,  (transactionID >> 7) & 0x7F, (transactionID >> 0) & 0x7F, 0x40, 0x09, 0x00, 0x00, 0x00, 0xF7]
          midiDevices[transactionDevice].transactions.push(transactionID++)
          midiDevices[transactionDevice].output.send('sysex',sysexChecksum(inq))

        }
      }
        break
      case 0x08: { // RetInfo
        if (transactionDevice) {

          const infoID = (msg.bytes[18] & 0x7F)
          let type
          let next
          switch (infoID) {
          case 0x01:
            type = 'accessory'
            next = 0x02
            break
          case 0x02:
            type = 'manufacturer'
            next = 0x03
            break
          case 0x03:
            type = 'model'
            next = 0x04
            break
          case 0x04:
            type = 'serial'
            next = 0x05
            break
          case 0x05:
            type = 'firmware'
            next = 0x06
            break
          case 0x06:
            type = 'hardware'
            next = 0x10
            break
          case 0x10:
            type = 'device'
            break
          }
          if (type) {
            midiDevices[transactionDevice][type] = ''
            for (let c = 0; c < dataLength - 1; c++) {
              midiDevices[transactionDevice][type] += String.fromCharCode((msg.bytes[19 + c] & 0x7F))
            }
          }

          if (next) {
            // command 0x07 = GetInfo for <next>
            const inq = [ 0xF0, 0x00, 0x01, 0x73, 0x7E, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,  (transactionID >> 7) & 0x7F, (transactionID >> 0) & 0x7F, 0x40, 0x07, 0x00, 0x01, next, 0x00, 0xF7]
            midiDevices[transactionDevice].transactions.push(transactionID++)
            midiDevices[transactionDevice].output.send('sysex',sysexChecksum(inq))
          } else {
            // command 0x22 = GetMIDIPortInfo
            const inq = [ 0xF0, 0x00, 0x01, 0x73, 0x7E, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,  (transactionID >> 7) & 0x7F, (transactionID >> 0) & 0x7F, 0x40, 0x22, 0x00, 0x02, 0x00, 0x01, 0x00, 0xF7]
            midiDevices[transactionDevice].transactions.push(transactionID++)
            midiDevices[transactionDevice].output.send('sysex',sysexChecksum(inq))
          }
        }
      }
        break
      case 0x0A: { // RetResetList
        if (transactionDevice) {
          midiDevices[transactionDevice].resetList = []
          for (let c = 0; c < dataLength; c++) {
            midiDevices[transactionDevice].resetList.push( (msg.bytes[18 + c] & 0x7F) )
          }

          // command 0x0B = GetSaveRestoreList
          const inq = [ 0xF0, 0x00, 0x01, 0x73, 0x7E, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,  (transactionID >> 7) & 0x7F, (transactionID >> 0) & 0x7F, 0x40, 0x0B, 0x00, 0x00, 0x00, 0xF7]
          midiDevices[transactionDevice].transactions.push(transactionID++)
          midiDevices[transactionDevice].output.send('sysex',sysexChecksum(inq))
        }
      }
        break
      case 0x0C: { // RetSaveRestoreList
        if (transactionDevice) {
          midiDevices[transactionDevice].saveRestoreList = []
          for (let c = 0; c < dataLength; c++) {
            midiDevices[transactionDevice].saveRestoreList.push( (msg.bytes[18 + c] & 0x7F) )
          }

          // command 0x0D = GetEthernetPortInfo
          const inq = [ 0xF0, 0x00, 0x01, 0x73, 0x7E, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,  (transactionID >> 7) & 0x7F, (transactionID >> 0) & 0x7F, 0x40, 0x0D, 0x00, 0x02, 0x00, 0x01, 0x00, 0xF7]
          midiDevices[transactionDevice].transactions.push(transactionID++)
          midiDevices[transactionDevice].output.send('sysex',sysexChecksum(inq))
        }
      }
        break
      case 0x0E: { // RetEthernetPortInfo
        if (transactionDevice) {

          const commandVersion = msg.bytes[18] & 0x7F

          // command 0x07 = GetInfo for infoID1
          const inq = [ 0xF0, 0x00, 0x01, 0x73, 0x7E, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,  (transactionID >> 7) & 0x7F, (transactionID >> 0) & 0x7F, 0x40, 0x07, 0x00, 0x01, 0x01, 0x00, 0xF7]
          midiDevices[transactionDevice].transactions.push(transactionID++)
          midiDevices[transactionDevice].output.send('sysex',sysexChecksum(inq))
        }
      }
        break
      case 0x0F: { // ACK
        const commandOrigin = msg.bytes.slice(18,18 + 2)
        const errorCode = msg.bytes.slice(20,20 + 1)
        switch (errorCode) {
        case 0x00:
          console.log('ACK: no error')
          break
        case 0x01:
          console.log('ACK: unknown command')
          break
        case 0x02:
          console.log('ACK: malformed message')
          break
        case 0x03:
          console.log('ACK: command failed')
          break
        }
      }
        break
      case 0x21: { // RetMIDIInfo
        if (transactionDevice) {

          const commandVersion = msg.bytes[18] & 0x7F

          if (commandVersion == 1) {
            midiDevices[transactionDevice].midiPorts = ((msg.bytes[19] & 0x7F) << 7) | ((msg.bytes[20] & 0x7F) << 0)
            midiDevices[transactionDevice].communicationPort = ((msg.bytes[21] & 0x7F) << 7) | ((msg.bytes[22] & 0x7F) << 0)
            midiDevices[transactionDevice].info = {
              din: {
                jacks:msg.bytes[23] & 0x7F,
              },
              usb: {
                device: {
                  jacks: msg.bytes[24] & 0x7F,
                  ports: msg.bytes[27] & 0x7F,
                },
                host: {
                  jacks:msg.bytes[25] & 0x7F,
                  ports: msg.bytes[28] & 0x7F,
                },
              },
              ethernet: {
                jacks:msg.bytes[26] & 0x7F,
                sessions: msg.bytes[29] & 0x7F,
                connections: msg.bytes[30] & 0x7F,
              },
            }
          }

          // command 0x05 = GetInfoList
          const inq = [ 0xF0, 0x00, 0x01, 0x73, 0x7E, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,  (transactionID >> 7) & 0x7F, (transactionID >> 0) & 0x7F, 0x40, 0x05, 0x00, 0x00, 0x00, 0xF7]
          midiDevices[transactionDevice].transactions.push(transactionID++)
          midiDevices[transactionDevice].output.send('sysex',sysexChecksum(inq))
        }
      }
        break
      case 0x23: { // RetMIDIPortInfo
        if (transactionDevice) {

          const commandVersion = msg.bytes[18] & 0x7F

          if (commandVersion == 1 || commandVersion == 2) {
            if (!midiDevices[transactionDevice].midiPortInfo) {
              midiDevices[transactionDevice].midiPortInfo = {}
            }
            let portID = ((msg.bytes[19] & 0x7F) << 7) | ((msg.bytes[20] & 0x7F) << 0)
            if (!midiDevices[transactionDevice].midiPortInfo[portID]) {
              midiDevices[transactionDevice].midiPortInfo[portID] = {}
            }

            midiDevices[transactionDevice].midiPortInfo[portID].portID = portID
            midiDevices[transactionDevice].midiPortInfo[portID].type = msg.bytes[21] & 0x7F
            switch (midiDevices[transactionDevice].midiPortInfo[portID].type) {
            case 1: {//DIN
              midiDevices[transactionDevice].midiPortInfo[portID].din = {
                jack: msg.bytes[22] & 0x7F
              }
            }
              break
            case 2: {// USB Device
              if (!midiDevices[transactionDevice].midiPortInfo[portID].usb) {
                midiDevices[transactionDevice].midiPortInfo[portID].usb = {}
              }
              midiDevices[transactionDevice].midiPortInfo[portID].usb.device = {
                jack: msg.bytes[22] & 0x7F,
                port: msg.bytes[23] & 0x7F,
              }
            }
              break
            case 3: {// USB Host
              if (!midiDevices[transactionDevice].midiPortInfo[portID].usb) {
                midiDevices[transactionDevice].midiPortInfo[portID].usb = {}
              }
              midiDevices[transactionDevice].midiPortInfo[portID].usb.host = {
                jack: msg.bytes[22] & 0x7F,
                port: msg.bytes[23] & 0x7F,
              }
            }
              break
            case 4: {// Ethernet
              midiDevices[transactionDevice].midiPortInfo[portID].ethernet = {
                jack: msg.bytes[22] & 0x7F,
                session: msg.bytes[23] & 0x7F,
              }
            }
              break
            case 5: {// Control
              midiDevices[transactionDevice].midiPortInfo[portID].control = {
                port: msg.bytes[22] & 0x7F,
                type: msg.bytes[23] & 0x7F,
              }
            }
              break
            }
            midiDevices[transactionDevice].midiPortInfo[portID].maxPartName = msg.bytes[26] & 0x7F
            midiDevices[transactionDevice].midiPortInfo[portID].flags = msg.bytes[27] & 0x7F

            midiDevices[transactionDevice].midiPortInfo[portID].portName = ''
            for (let c = 10; c < dataLength; c++) {
              midiDevices[transactionDevice].midiPortInfo[portID].portName += String.fromCharCode(msg.bytes[18 + c] & 0x7F)
            }


            if (portID < 0x40) {
              portID++
              // command 0x22 = GetMIDIPortInfo
              const inq = [ 0xF0, 0x00, 0x01, 0x73, 0x7E, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, (transactionID >> 7) & 0x7F, (transactionID >> 0) & 0x7F, 0x40, 0x22, 0x00, 0x02, (portID >> 7) & 0x7F, (portID >> 0) & 0x7F, 0x00, 0xF7]
              midiDevices[transactionDevice].transactions.push(transactionID++)
              midiDevices[transactionDevice].output.send('sysex',sysexChecksum(inq))
            } else {
              // command 0x28 = GetMIDIPortRoute for poert 1
              const inq = [ 0xF0, 0x00, 0x01, 0x73, 0x7E, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,  (transactionID >> 7) & 0x7F, (transactionID >> 0) & 0x7F, 0x40, 0x28, 0x00, 0x02, 0x00, 0x01, 0x00, 0xF7]
              midiDevices[transactionDevice].transactions.push(transactionID++)
              midiDevices[transactionDevice].output.send('sysex',sysexChecksum(inq))
            }
          }
        }
      }
        break
      case 0x25: {// RetMIDIPortFilter
        if (transactionDevice) {
          const commandVersion = msg.bytes[18] & 0x7F

          if (commandVersion == 1) {
            let portID = ((msg.bytes[19] & 0x7F) << 7) | ((msg.bytes[20] & 0x7F) << 0)

            let filterType = ((msg.bytes[21] & 0x7F) << 0) //(input = 1, output = 2)
            let maxFilters = ((msg.bytes[22] & 0x7F) << 0)
            const filter = {events:[]}
            if (msg.bytes[23] & (1 << 0)) {
              filter.events.push('reset')
            }
            if (msg.bytes[24] & (1 << 6)) {
              filter.events.push('active sensing')
            }
            if (msg.bytes[24] & (1 << 5)) {
              filter.events.push('realtime')
            }
            if (msg.bytes[24] & (1 << 4)) {
              filter.events.push('tune request')
            }
            if (msg.bytes[24] & (1 << 3)) {
              filter.events.push('song select')
            }
            if (msg.bytes[24] & (1 << 2)) {
              filter.events.push('song position')
            }
            if (msg.bytes[24] & (1 << 1)) {
              filter.events.push('time code')
            }
            if (msg.bytes[24] & (1 << 0)) {
              filter.events.push('sysex')
            }

            for (let r = 0; r < 16; r += 1) {
              const channel = []
              if (msg.bytes[25 + r] & (1 << 5)) {
                channel.push('pitch bend')
              }
              if (msg.bytes[25 + r] & (1 << 4)) {
                channel.push('channel aftertouch')
              }
              if (msg.bytes[25 + r] & (1 << 3)) {
                channel.push('program change')
              }
              if (msg.bytes[25 + r] & (1 << 2)) {
                channel.push('control change')
              }
              if (msg.bytes[25 + r] & (1 << 1)) {
                channel.push('poly aftertouch')
              }
              if (msg.bytes[25 + r] & (1 << 0)) {
                channel.push('note')
              }
              /*              if (channel.length) {*/
              if (!filter.channels) {
                filter.channels = {}
              }
              if (!filter.channels['channel_' + (r + 1)]) {
                filter.channels['channel_' + (r + 1)] = {}
              }
              /*                if (channel.length) {*/
              filter.channels['channel_' + (r + 1)].events = channel
              /*                }*/
              /*              }*/
            }

            for (let r = 0; r < (maxFilters * 5) && r < (dataLength - 41); r += 5) {
              const controller = (msg.bytes[41 + r + 4] & 0x7F)
              for (let c = 0; c < 16; c++) {
                if (msg.bytes[41 + r + (3 - Math.floor(c / 4))] & (1 << (c % 4))) {
                  if (!filter.channels) {
                    filter.channels = {}
                  }
                  if (!filter.channels['channel_' + (c + 1)]) {
                    filter.channels['channel_' + (c + 1)] = {}
                  }
                  if (!filter.channels['channel_' + (c + 1)].controllers) {
                    filter.channels['channel_' + (c + 1)].controllers = []
                  }
                  filter.channels['channel_' + (c + 1)].controllers.push(controller)
                }
              }
            }

            if (!midiDevices[transactionDevice].midiPortInfo) {
              midiDevices[transactionDevice].midiPortInfo = {}
            }
            if (!midiDevices[transactionDevice].midiPortInfo[portID]) {
              midiDevices[transactionDevice].midiPortInfo[portID] = {}
            }
            if (!midiDevices[transactionDevice].midiPortInfo[portID].filter) {
              midiDevices[transactionDevice].midiPortInfo[portID].filter = {}
            }
            midiDevices[transactionDevice].midiPortInfo[portID].filter[filterType == 1 ? 'input' : 'output'] = filter


            if (portID < 0x40 || filterType < 2) {
              if (filterType < 2) {
                filterType++
              } else {
                portID++
                filterType = 1
              }
              // command 0x24 = GetMIDIPortRoute for next port
              const inq = [ 0xF0, 0x00, 0x01, 0x73, 0x7E, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,  (transactionID >> 7) & 0x7F, (transactionID >> 0) & 0x7F, 0x40, 0x24, 0x00, 0x03, (portID >> 7) & 0x7F, (portID >> 0) & 0x7F, filterType, 0x00, 0xF7]
              midiDevices[transactionDevice].transactions.push(transactionID++)
              midiDevices[transactionDevice].output.send('sysex',sysexChecksum(inq))
            } else {

              // command 0x26 = GetMIDIPortRemap for port 1 remap 1
              const inq = [ 0xF0, 0x00, 0x01, 0x73, 0x7E, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,  (transactionID >> 7) & 0x7F, (transactionID >> 0) & 0x7F, 0x40, 0x26, 0x00, 0x03, 0x00, 0x01, 0x01, 0x00, 0xF7]
              midiDevices[transactionDevice].transactions.push(transactionID++)
              midiDevices[transactionDevice].output.send('sysex',sysexChecksum(inq))
            }
          }
        }
      }
        break
      case 0x27: {// RetMIDIPortRemap
        if (transactionDevice) {
          const commandVersion = msg.bytes[18] & 0x7F

          if (commandVersion == 1) {
            let portID = ((msg.bytes[19] & 0x7F) << 7) | ((msg.bytes[20] & 0x7F) << 0)

            let remapType = ((msg.bytes[21] & 0x7F) << 0) //(input = 1, output = 2)
            let maxRemaps = ((msg.bytes[22] & 0x7F) << 0)
            const remap = {}
            for (let r = 0; r < 32; r += 2) {
              const channel = {channel:-1,events:[]}
              if (msg.bytes[23 + r] & (1 << 5)) {
                channel.events.push('pitch bend')
              }
              if (msg.bytes[23 + r] & (1 << 4)) {
                channel.events.push('channel aftertouch')
              }
              if (msg.bytes[23 + r] & (1 << 3)) {
                channel.events.push('program change')
              }
              if (msg.bytes[23 + r] & (1 << 2)) {
                channel.events.push('control change')
              }
              if (msg.bytes[23 + r] & (1 << 1)) {
                channel.events.push('poly aftertouch')
              }
              if (msg.bytes[23 + r] & (1 << 0)) {
                channel.events.push('note')
              }
              channel.channel = (msg.bytes[24 + r] & 0xF) + 1
              if (channel.events.length || channel.target) {
                if (!remap.channels) {
                  remap.channels = {}
                }
                remap.channels['channel_' + ((r / 2) + 1)] = channel
              }
            }

            for (let r = 0; r < (maxRemaps * 6) && r < (dataLength - 55); r += 6) {
              const remapCC = {}
              const sourceControl = (msg.bytes[55 + r + 4] & 0x7F)
              const targetControl = (msg.bytes[55 + r + 5] & 0x7F)
              for (let c = 0; c < 16; c++) {
                if (msg.bytes[55 + r + (3 - Math.floor(c / 4))] & (1 << (c % 4))) {
                  if (!remap.channels) {
                    remap.channels = {}
                  }
                  if (!remap.channels['channel_' + (c + 1)]) {
                    remap.channels['channel_' + (c + 1)] = {}
                  }
                  if (!remap.channels['channel_' + (c + 1)].controllers) {
                    remap.channels['channel_' + (c + 1)].controllers = {}
                  }
                  if (!remap.channels['channel_' + (c + 1)].controllers[sourceControl]) {
                    remap.channels['channel_' + (c + 1)].controllers[sourceControl] = {}
                  }
                  remap.channels['channel_' + (c + 1)].controllers[sourceControl].controller = targetControl
                }
              }
            }

            if (!midiDevices[transactionDevice].midiPortInfo) {
              midiDevices[transactionDevice].midiPortInfo = {}
            }
            if (!midiDevices[transactionDevice].midiPortInfo[portID]) {
              midiDevices[transactionDevice].midiPortInfo[portID] = {}
            }
            if (!midiDevices[transactionDevice].midiPortInfo[portID].remap) {
              midiDevices[transactionDevice].midiPortInfo[portID].remap = {}
            }
            midiDevices[transactionDevice].midiPortInfo[portID].remap[remapType == 1 ? 'input' : 'output'] = remap


            if (portID < 0x40 || remapType < 2) {
              if (remapType < 2) {
                remapType++
              } else {
                portID++
                remapType = 1
              }
              // command 0x26 = GetMIDIPortRemap for next port & next remapType
              const inq = [ 0xF0, 0x00, 0x01, 0x73, 0x7E, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,  (transactionID >> 7) & 0x7F, (transactionID >> 0) & 0x7F, 0x40, 0x26, 0x00, 0x03, (portID >> 7) & 0x7F, (portID >> 0) & 0x7F, remapType, 0x00, 0xF7]
              midiDevices[transactionDevice].transactions.push(transactionID++)
              midiDevices[transactionDevice].output.send('sysex',sysexChecksum(inq))
            } else {

              /*              yves({midiDevices})*/
              //DONE
              console.log(`Routing via ${midiOutputName}...`)
              renderRouterConsole(midiOutputName)
            }
          }
        }
      }
        break
      case 0x29: {// RetMIDIPortRoute
        if (transactionDevice) {
          const commandVersion = msg.bytes[18] & 0x7F

          if (commandVersion == 1) {
            let portID = ((msg.bytes[19] & 0x7F) << 7) | ((msg.bytes[20] & 0x7F) << 0)

            const routing = []
            for (let r = 0; r < (dataLength - 3); r++) {
              for (let bit = 0; bit < 4; bit++) {
                if ((msg.bytes[21 + r] & (1 << bit))) {
                  routing.push(((r * 4) + bit) + 1)
                }
              }
            }

            if (!midiDevices[transactionDevice].midiPortInfo) {
              midiDevices[transactionDevice].midiPortInfo = {}
            }
            if (!midiDevices[transactionDevice].midiPortInfo[portID]) {
              midiDevices[transactionDevice].midiPortInfo[portID] = {}
            }
            midiDevices[transactionDevice].midiPortInfo[portID].routing = routing


            if (portID < 0x40) {
              portID++
              // command 0x28 = GetMIDIPortRoute for next port 1
              const inq = [ 0xF0, 0x00, 0x01, 0x73, 0x7E, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,  (transactionID >> 7) & 0x7F, (transactionID >> 0) & 0x7F, 0x40, 0x28, 0x00, 0x02, (portID >> 7) & 0x7F, (portID >> 0) & 0x7F, 0x00, 0xF7]
              midiDevices[transactionDevice].transactions.push(transactionID++)
              midiDevices[transactionDevice].output.send('sysex',sysexChecksum(inq))
            } else {
              // command 0x24 = GetMIDIPortFilter  for port 1 type 1
              const inq = [ 0xF0, 0x00, 0x01, 0x73, 0x7E, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,  (transactionID >> 7) & 0x7F, (transactionID >> 0) & 0x7F, 0x40, 0x24, 0x00, 0x03, 0x00, 0x01, 0x01, 0x00, 0xF7]
              midiDevices[transactionDevice].transactions.push(transactionID++)
              midiDevices[transactionDevice].output.send('sysex',sysexChecksum(inq))
            }
          }
        }
      }
        break
      default:
        break
      }

    } else {
      console.log(`Other manufacturer: ${manufacturerID}`)
    }
  }
}

function readState() {
  const filePath = `${__dirname}/../state/router.json`
  if (fs.existsSync(filePath)) {
    const state = jsonfile.readFileSync(filePath)
    if (state.selectedRouterPage) {
      selectedRouterPage = state.selectedRouterPage
    }
    if (state.selectedRouterStrip) {
      selectedRouterStrip = state.selectedRouterStrip
    }
  }
}

readState()

function writeState() {
  const state = { selectedRouterPage, selectedRouterStrip }
  jsonfile.writeFileSync(`${__dirname}/../state/router.json`, state, { flag: 'w', spaces: 2 })
}


let midiOutputNames
let midiInputNames

let midiOutputName
let midiOutputs = []
let midiInputs = []


function setupInputHandlers(options) {
  midiInputNames = easymidi.getInputs()
  midiInputs.forEach( input => input.close() )
  midiInputs = midiInputNames.map (name => {
    const input = new easymidi.Input(name)
    if (!midiDevices[name]) {
      midiDevices[name] = {name,transactions:[]}
    }
    midiDevices[name].input = input
    input.on('sysex', handleNamedSysEx(name) )
    input.on('cc', handleNamedCC(name) )
    input.on('message', handleNamedMessage(name) )
    return input
  })
}

function setupOutputHandlers(options) {
  midiOutputNames = easymidi.getOutputs()

  let outputNamesMatching
  if (options.midi) {
    outputNamesMatching = midiOutputNames.filter( outputName => outputName.match(escapeRegexString(_.get(config,`midi.ports.${options.midi.toLowerCase()}.${os.platform()}`,options.midi))) )

    if (!outputNamesMatching || outputNamesMatching.length != 1) {
      console.error(`No (unambiguous) output port found with: ${options.midi} or ${_.get(config,`midi.ports.${options.midi.toLowerCase()}.${os.platform()}`,options.midi)}`)
      process.exit(1)
    }
    midiOutputName = outputNamesMatching[0]
  }

  midiOutputs.forEach( output => output.close() )
  midiOutputs = midiOutputNames.map (name => {
    const output = new easymidi.Output(name)

    if (!midiDevices[name]) {
      midiDevices[name] = {name,transactions:[]}
    }
    midiDevices[name].output = output

    return output
  })
}

function setupMidi(options) {
  midiDevices = {}
  setupOutputHandlers(options)
  setupInputHandlers(options)
  startInquiry()
}

function routerConsole(name, sub, options) {
  setupMidi(options)

  if (options.midi) {
    const inputNamesMatching = midiInputNames.filter( inputName => inputName.match(escapeRegexString(_.get(config,`midi.ports.${options.midi.toLowerCase()}.${os.platform()}`,options.midi))) )

    if (!inputNamesMatching || inputNamesMatching.length != 1) {
      console.error(`No (unambiguous) input port found with: ${options.midi} or ${_.get(config,`midi.ports.${options.midi.toLowerCase()}.${os.platform()}`,options.midi)}`)
      process.exit(1)
    }
  }


  if (!midiOutputName) {
    midiInputs.forEach( input => input.close() )
  }
}

module.exports = {
  name: 'router',
  description: 'Start router for Easy One <-> Virus TI',
  handler: routerConsole,
}
