loadAPI(10)

const CONTROLLER_SCRIPT_VERSION = '1.02'
const CONTROLLER_BASE_NAME = 'Bacara'
const CONTROLLER_SCRIPT_NAME = `${CONTROLLER_BASE_NAME} Control` //  v${CONTROLLER_SCRIPT_VERSION}
host.setShouldFailOnDeprecatedUse(true)
host.defineController('Bonboa', CONTROLLER_SCRIPT_NAME, CONTROLLER_SCRIPT_VERSION, '7f4b4851-911b-4dbf-a6a7-ee7801296ce3', 'Joris Röling')

host.defineMidiPorts(2, 2)

if (host.platformIsWindows()) {
  host.addDeviceNameBasedDiscoveryPair(['Electra Controller', 'MIDIIN3 (Electra Controller)'], ['Electra Controller', 'MIDIOUT3 (Electra Controller)'])
} else if (host.platformIsMac()) {
  host.addDeviceNameBasedDiscoveryPair(['Electra Controller Electra Port 1', 'Electra Controller Electra CTRL'], ['Electra Controller Electra Port 1', 'Electra Controller Electra CTRL'])
} else if (host.platformIsLinux()) {
  host.addDeviceNameBasedDiscoveryPair(['Electra Controller Electra Port 1', 'Electra Controller Electra CTRL'], ['Electra Controller Electra Port 1', 'Electra Controller Electra CTRL'])
}

let active = false
const highRes = true
const layoutColumns = true


let remoteControlsBank = null
let cursorTrack = null

const COLOR_WHITE = 'FFFFFF'
const COLOR_RED = 'F45C51'
const COLOR_YELLOW = 'F49500'
const COLOR_BLUE = '529DEC'
const COLOR_GREEN = '03A598'
const COLOR_MAGENTA = 'C44795'


let E1_PRESET_NAME = 'Bacara'
let E1_CC_MSB = [3, 9, 14, 15, 16, 17, 18, 19]
let E1_CC_LSB = []
const E1_PLAY_CC = 64
const E1_STOP_CC = 65
const E1_RECORD_CC = 66

let transport

const E1_PAGE_NAME_CTRL_ID = 217
const E1_PAGE_CTRL_ID = 229
const remoteControlIDs = [218, 219, 220, 221, 224, 225, 226, 227]
const sendControlIDs = [241, 242, 243, 244, 245, 246, 247, 248, 249, 250, 251, 252]

const E1_MAX_LABEL_LENGTH = 14
const E1_PAGE_CC = 100
const E1_MAX_PAGE_COUNT = 12
const E1_PAGE_COUNT = 12
let pageCount = E1_PAGE_COUNT
let presetName = E1_PRESET_NAME
const E1_MAX_SEND_COUNT = 12
const E1_SEND_CC = 20

const E1_PREVIOUS_PAGE_CC = 80
const E1_NEXT_PAGE_CC = 81

for (let a = 0; a < E1_CC_MSB.length; a++) {
  if (E1_CC_MSB[a] < 32) {
    E1_CC_LSB.push(E1_CC_MSB[a] + 32)
  }
}

const LAYOUT_COLUMNS_MAP = [0, 4, 1, 5, 2, 6, 3, 7]
const REVERSE_LAYOUT_COLUMNS_MAP = [0, 2, 4, 6, 1, 3, 5, 7]


const remoteValues = []
const remoteNames = []

const remoteCache = []
function clearRemoteCache() {
  for (let i = 0; i < E1_MAX_PAGE_COUNT; i++) {
    remoteCache[i] = {name:'', visible:false, state:-1}
  }
}
clearRemoteCache()


const sendValues = []
const sendCache = []
function clearSendCache() {
  for (let i = 0; i < E1_MAX_SEND_COUNT; i++) {
    if (active) {
      sendCache[i] = {name:'', visible:true, state:-1}
      showSend(i, '')
    }
    sendCache[i] = {name:'', visible:false, color:COLOR_YELLOW, state:-1}
  }
}
clearSendCache()

function doObject(object, f) {
  return function() {
    f.apply(object, arguments)
  }
}

function padZero(str) {
  if (!str) {
    str = ''
  }
  while (str.length < 2) {
    str = '0' + str
  }
  return str
}

function num2hex(num) {
  return padZero(num.toString(16).toUpperCase())
}

function str2hex(str) {
  let arr1 = []
  for (let n = 0, l = str.length; n < l; n++) {
    let hex = padZero(Number(str.charCodeAt(n)).toString(16).toUpperCase())
    arr1.push(hex)
  }
  return arr1.join(' ')
}

function showSend(index, name, color = COLOR_YELLOW) {
  const json = {
    name: name.substr(0, E1_MAX_LABEL_LENGTH),
    visible: (name && name.trim().length) ? true : false,
    color: color,
  }
  //  println('showSend('+index+','+name+') json '+JSON.stringify(json))
  if (index >= 0 && index <= sendControlIDs.length && (sendCache[index].name !== json.name || sendCache[index].visible !== json.visible || sendCache[index].color !== json.color)) {
    const ctrlId = sendControlIDs[index]
    const data = `F0 00 21 45 14 07 ${num2hex(ctrlId & 0x7F)} ${num2hex(ctrlId >> 7)} ${str2hex(JSON.stringify(json))} F7`
    host.getMidiOutPort(1).sendSysex(data)
    sendCache[index].name = json.name
    sendCache[index].visible = json.visible
    sendCache[index].color = json.color
  }
}

function showPages(value) {
//  println('showPages '+value+  ' pageCount '+pageCount)
  const remoteNames = remoteControlsBank.pageNames().get()

  for (let i = 0; i < E1_MAX_PAGE_COUNT; i++) {
    const state = i < pageCount ? ((i == value) ? 127 : 0) : 0
    //  println('state('+i+')  '+state)
    //  println('remoteCache('+i+')  '+remoteCache[i].state)
    if (remoteCache[i].state !== state ) {
      sendMidi(0xB0, E1_PAGE_CC + i, state )
      remoteCache[i].state = state
    }
    const name = (remoteNames && i < remoteNames.length) ? remoteNames[i] : ''
    const json = {
      name: name.substr(0, E1_MAX_LABEL_LENGTH),
      visible: ((i < pageCount) && name && name.trim().length) ? true : false
    }
    //  println('remoteCache('+i+')  name '+remoteCache[i].name+ '  visible '+remoteCache[i].visible+  '  json '+JSON.stringify(json))
    if (remoteCache[i].name !== json.name || remoteCache[i].visible !== json.visible) {
      const ctrlId = E1_PAGE_CTRL_ID + i
      const data = `F0 00 21 45 14 07 ${num2hex(ctrlId & 0x7F)} ${num2hex(ctrlId >> 7)} ${str2hex(JSON.stringify(json))} F7`
      host.getMidiOutPort(1).sendSysex(data)
      remoteCache[i].name = json.name
      remoteCache[i].visible = json.visible
      /*    } else {*/
      /*      println(`remoteCache hit ${i}`)*/
    }
  }
  if (value >= 0) {
    const name = (remoteNames && value < remoteNames.length) ? remoteNames[value] : ''
    const json = {
      name: name.substr(0, E1_MAX_LABEL_LENGTH),
      visible: (name && name.trim().length) ? true : false
    }
    const ctrlId = E1_PAGE_NAME_CTRL_ID
    const data = `F0 00 21 45 14 07 ${num2hex(ctrlId & 0x7F)} ${num2hex(ctrlId >> 7)} ${str2hex(JSON.stringify(json))} F7`
    host.getMidiOutPort(1).sendSysex(data)
  }
}


function init() {
  transport = host.createTransport()

  transport.isPlaying().addValueObserver( value => {
    //println('TRSNP play '+value)
    sendMidi(0xB0, E1_PLAY_CC, value ? 1 : 0)
  })

  transport.isArrangerRecordEnabled().addValueObserver( value => {
    //println('TRSNP record '+value)
    sendMidi(0xB0, E1_RECORD_CC, value ? 1 : 0)
  })

  let controls = []
  for (let c = 0; c < 128; c++) {
    controls.push(c + '')
  }
  let preferences = host.getPreferences()

  /*
  preferences.getNumberSetting(`Quick Access`, 'Remote Control Pages', 0, E1_MAX_PAGE_COUNT, 1, 'buttons', E1_PAGE_COUNT).addValueObserver(function(value) {
    pageCount = Math.round(value * E1_MAX_PAGE_COUNT);

    if (active) {
      showPages( remoteControlsBank.selectedPageIndex().get() )
    }
  });

  preferences.getStringSetting(`Preset Name`, 'Electra One Preset', 20, E1_PRESET_NAME).addValueObserver(function(value) {
    presetName = value;

    active = false
    // Patch Request
    host.getMidiOutPort(1).sendSysex(`F0 00 21 45 02 01 F7`)

  });

  for (let c=0;c<8;c++) {
    preferences.getNumberSetting(`Remote Control Parameter #${c+1}`, `${CONTROLLER_BASE_NAME} IDs`, 1, 432, 1, 'control', remoteControlIDs[c]).addValueObserver(function(value) {
      remoteControlIDs[c] = value;
    });
  }
*/
  host.getMidiInPort(0).setMidiCallback(handleMidi)
  host.getMidiInPort(0).setSysexCallback(handleSysExMidi)
  host.getMidiInPort(1).setSysexCallback(handleSysExMidi)


  cursorTrack = host.createCursorTrack('E1_CURSOR_TRACK', 'Cursor Track', E1_MAX_SEND_COUNT, 0, true)

  for (let s = 0; s < E1_MAX_SEND_COUNT; s++) {
    cursorTrack.getSend(s).value().addValueObserver((value) => {
      //println('Send '+s+' value '+value)

      if (active) {
        if (sendValues[s] != (value * 16383)) {
          //println('Send MIDI '+s+' value '+value)
          sendMidi(0xB0, E1_SEND_CC + s, ((value * 16383) >> 7) & 0x7F)
          if (highRes) {
            sendMidi(0xB0, E1_SEND_CC + s + 32, ((value * 16383) >> 0) & 0x7F)
          }
        }
      }
      sendValues[s] = value
    })
    cursorTrack.getSend(s).name().addValueObserver((name) => {
      //      println('Send '+s+' name '+name)

      showSend(s, name, sendCache[s].color)
    })
    cursorTrack.getSend(s).isPreFader().addValueObserver((preFader) => {
      //      println('Send '+s+' preFader '+preFader)
      showSend(s, sendCache[s].name, preFader ? COLOR_BLUE : COLOR_YELLOW)
    })
  }

  //let sendBank = host.createEffectTrackBank(12,0)

  let cursorDevice = cursorTrack.createCursorDevice('E1_CURSOR_DEVICE', 'Cursor Device', 0, CursorDeviceFollowMode.FOLLOW_SELECTION)

  remoteControlsBank = cursorDevice.createCursorRemoteControlsPage(8)

  //remoteControlsBank.pageNames().markInterested();
  remoteControlsBank.pageNames().addValueObserver(function(value) {
    if (active) {
      showPages( remoteControlsBank.selectedPageIndex().get() )
    }
  })

  remoteControlsBank.selectedPageIndex().addValueObserver(function(value) {
    if (active) {
      if (value >= 0 && !remoteControlsBank.pageNames().isEmpty()) {
        showPages(value)
      }
    }
  })

  function setupParameter(i) {
    const parameter = remoteControlsBank.getParameter(i)
    parameter.markInterested()
    parameter.setIndication(true)

    parameter.value().addValueObserver(function(value) {
      const idx = (layoutColumns ? REVERSE_LAYOUT_COLUMNS_MAP[i] : i)
      if (active) {
        if (remoteValues[idx] != (value * 16383)) {
          sendMidi(0xB0, E1_CC_MSB[idx], ((value * 16383) >> 7) & 0x7F)
          if (highRes) {
            sendMidi(0xB0, E1_CC_LSB[idx], ((value * 16383) >> 0) & 0x7F)
          }
        }
      }
      remoteValues[idx] = value
    })

    parameter.name().addValueObserver(function(name) {
      const idx = (layoutColumns ? REVERSE_LAYOUT_COLUMNS_MAP[i] : i)
      remoteNames[i] = name
      if (active) {
        const json = {
          name: name ? name.substr(0, E1_MAX_LABEL_LENGTH) : `Parameter #${i + 1}`,
          visible: (name && name.trim().length) ? true : false
        }
        //        println(`name [${json.name}] visible [${json.visible}] ${JSON.stringify(json)} ${str2hex(JSON.stringify(json))}`)
        const ctrlId = remoteControlIDs[i]
        const data = `F0 00 21 45 14 07 ${num2hex(ctrlId & 0x7F)} ${num2hex(ctrlId >> 7)} ${str2hex(JSON.stringify(json))} F7`
        host.getMidiOutPort(1).sendSysex(data)
      }
    })
  }

  for (let i = 0; i < remoteControlsBank.getParameterCount(); i++) {
    setupParameter(i)
  }

  cursorDevice.isEnabled().markInterested()
  cursorDevice.isWindowOpen().markInterested()

  /* Patch Request */
  host.getMidiOutPort(1).sendSysex('F0 00 21 45 02 01 F7')

  println(`${CONTROLLER_SCRIPT_NAME} v${CONTROLLER_SCRIPT_VERSION} initialized!`)
}

function handleMidi(status, data1, data2) {
  if (active) {
    if (isChannelController(status)) {
      if (E1_CC_MSB.indexOf(data1) >= 0) {
        let idx = E1_CC_MSB.indexOf(data1)
        remoteValues[idx] = (remoteValues[idx] & (0x7F << 0)) | (data2 << 7)
        if (!highRes) {
          remoteControlsBank.getParameter(layoutColumns ? LAYOUT_COLUMNS_MAP[idx] : idx).set(remoteValues[idx], 16384)
        }
      } else if (highRes && E1_CC_LSB.indexOf(data1) >= 0) {
        let idx = E1_CC_LSB.indexOf(data1)
        remoteValues[idx] = (remoteValues[idx] & (0x7F << 7)) | (data2 << 0)
        remoteControlsBank.getParameter(layoutColumns ? LAYOUT_COLUMNS_MAP[idx] : idx).set(remoteValues[idx], 16384)
      } else if (data1 >= E1_SEND_CC && data1 <= (E1_SEND_CC + E1_MAX_SEND_COUNT)) {
        let idx = data1 - E1_SEND_CC
        sendValues[idx] = (sendValues[idx] & (0x7F << 0)) | (data2 << 7)
        if (!highRes) {
          cursorTrack.getSend(idx).set(sendValues[idx], 16384)
        }
      } else if (highRes && data1 >= (E1_SEND_CC + 32) && data1 < (E1_SEND_CC + E1_MAX_SEND_COUNT + 32) ) {
        let idx = data1 - (E1_SEND_CC + 32)
        sendValues[idx] = (sendValues[idx] & (0x7F << 7)) | (data2 << 0)
        cursorTrack.getSend(idx).set(sendValues[idx], 16384)
      } else if (data1 == E1_PREVIOUS_PAGE_CC && data2) {
        remoteControlsBank.selectPreviousPage(true)
      } else if (data1 == E1_NEXT_PAGE_CC && data2) {
        remoteControlsBank.selectNextPage(true)
      } else if (data1 >= E1_PAGE_CC && data1 < (E1_PAGE_CC + pageCount)) {
        remoteControlsBank.selectedPageIndex().set(data1 - E1_PAGE_CC)
      } else if (data1 == E1_PLAY_CC) {
        if (data2) {
          transport.play()
        } else {
          transport.stop()
        }
      } else if (data1 == E1_STOP_CC && data2) {
        transport.stop()
        transport.rewind()
      } else if (data1 == E1_RECORD_CC) {
        if (data2) {
          transport.record()
        } else {
          transport.stop()
        }
      }
    }
  }
  return false
}

function handleSysExMidi(data) {
  if (data && data.substr(0, 8) === 'f0002145') {  // Electra One
    if (data.substr(8, 4) === '7e02') { //f00021457e02####f7 = Preset Switch
      //      println('Preset Switch')
      active = false
      host.getMidiOutPort(1).sendSysex('F0 00 21 45 02 01 F7')  /* Patch Request */
    }

    if (data.substr(8, 4) === '0101') { //f00021450101####f7 = Patch Response
      //      println('Patch Response')

      const headData = data.substr(12, 64 * 2)
      let head = ''
      for (let i = 0; i < headData.length; i += 2) {
        head += String.fromCharCode(parseInt(headData.substr(i, 2), 16))
      }

      const match = head.match(/,"name"\s*:\s*"([^"]*)",/)
      active = (match && match.length && match[1].trim() === presetName.trim())
      //      println('match '+(match && match[1]))
      //     println('active '+active)

      clearRemoteCache()
      clearSendCache()

      if (active) {
        for (let i = 0; i < 8; i++) {
          const idx = (layoutColumns ? REVERSE_LAYOUT_COLUMNS_MAP[i] : i)
          const value = remoteValues[idx]
          const name = remoteNames[idx] || ''

          sendMidi(0xB0, E1_CC_MSB[idx], ((value * 16383) >> 7) & 0x7F)
          if (highRes) {
            sendMidi(0xB0, E1_CC_LSB[idx], ((value * 16383) >> 0) & 0x7F)
          }

          const json = {
            name: name.substr(0, E1_MAX_LABEL_LENGTH),
            visible: (name && name.trim().length) ? true : false
          }
          const ctrlId = remoteControlIDs[i]
          const data = `F0 00 21 45 14 07 ${num2hex(ctrlId & 0x7F)} ${num2hex(ctrlId >> 7)} ${str2hex(JSON.stringify(json))} F7`
          host.getMidiOutPort(1).sendSysex(data)
        }
        showPages( remoteControlsBank.selectedPageIndex().get() )
      }


    }
  } else if (data && data.substr(0, 4) === 'f07d') {  // Non-commercial SysEx: Ours!
    if (data.substr(4, 4) === '0004') {
      //      println('reload')
      clearRemoteCache()
      if (active) {
        showPages( remoteControlsBank.selectedPageIndex().get() )
      }
      clearSendCache()
    }
  }
  return false
}

function flush() {}

function exit() {
  println(`${CONTROLLER_SCRIPT_NAME} v${CONTROLLER_SCRIPT_VERSION} exited!`)
}
