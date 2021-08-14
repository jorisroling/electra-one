loadAPI(7);

host.setShouldFailOnDeprecatedUse(true);
host.defineController("Bonboa", "Electra One Control", "1.01", "7f4b4851-911b-4dbf-a6a7-ee7801296ce1", "Joris Röling");

host.defineMidiPorts(2, 2);

if (host.platformIsWindows()) {
  host.addDeviceNameBasedDiscoveryPair(["Electra Controller Electra Port 1","Electra Controller Electra CTRL"], ["Electra Controller Electra Port 1","Electra Controller Electra CTRL"]);
} else if (host.platformIsMac()) {
  host.addDeviceNameBasedDiscoveryPair(["Electra Controller Electra Port 1","Electra Controller Electra CTRL"], ["Electra Controller Electra Port 1","Electra Controller Electra CTRL"]);
} else if (host.platformIsLinux()) {
  host.addDeviceNameBasedDiscoveryPair(["Electra Controller Electra Port 1","Electra Controller Electra CTRL"], ["Electra Controller Electra Port 1","Electra Controller Electra CTRL"]);
}

var remoteControlsBank = null;

var E1_CC_MSB = [3, 9, 14, 15, 16, 17, 18, 19];

var E1_CC_LSB = [];

for (var a = 0; a < E1_CC_MSB.length; a++)
if (E1_CC_MSB[a] < 32) E1_CC_LSB.push(E1_CC_MSB[a] + 32)

var BOOLEAN_OPTIONS = [ "Off", "On" ];
var LAYOUT_COLUMNS_MAP = [0, 4, 1, 5, 2, 6, 3, 7];
var REVERSE_LAYOUT_COLUMNS_MAP = [0, 2, 4, 6, 1,3, 5, 7];

var LAYOUT_OPTIONS = [ "Rows", "Columns" ];

function doObject (object, f)
{
  return function () {
        f.apply (object, arguments);
    };
}

var highRes = true;
var layoutColumns = true;

var translateWithMap = true;

function init() {
  var controls=[];
  for (var c=0;c<128;c++) controls.push(i+'')
  var preferences = host.getPreferences ();

  preferences.getEnumSetting ("Enable", "High Resolution", BOOLEAN_OPTIONS, BOOLEAN_OPTIONS[1]).addValueObserver (function (value) {
    highRes = value == BOOLEAN_OPTIONS[1];
  });
  /* preferences.getEnumSetting ("Layout", "Button Order", LAYOUT_OPTIONS, LAYOUT_OPTIONS[layoutColumns?1:0]).addValueObserver (function (value) {
    layoutColumns = (value == LAYOUT_OPTIONS[1]);
  }); */

  host.getMidiInPort(0).setMidiCallback(handleMidi);

  var cursorTrack = host.createCursorTrack("E1_CURSOR_TRACK", "Cursor Track", 0, 0, true);

  var cursorDevice = cursorTrack.createCursorDevice("E1_CURSOR_DEVICE", "Cursor Device", 0, CursorDeviceFollowMode.FOLLOW_SELECTION);

  remoteControlsBank = cursorDevice.createCursorRemoteControlsPage(8);
  remoteControlsBank.selectedPageIndex().markInterested();

  function padZero(str) {
    if (!str) str=''
    while (str.length<2) str='0'+str
    return str
  }

  function num2hex(num) {
    return padZero(num.toString(16).toUpperCase());
  }

  function str2hex(str) {
	  var arr1 = [];
	  for (var n = 0, l = str.length; n < l; n ++) {
		  var hex = padZero(Number(str.charCodeAt(n)).toString(16).toUpperCase());
		  arr1.push(hex);
	  }
	  return arr1.join(' ');
  }

  function setupParameter(i) {
    const parameter = remoteControlsBank.getParameter(i);
    parameter.markInterested();
    parameter.setIndication(true);

    parameter.value().addValueObserver (function (value) {
      const idx = (layoutColumns ? REVERSE_LAYOUT_COLUMNS_MAP[i] : i);

      if (values[idx] != (value * 16383)) {
        sendMidi(0xB0,E1_CC_MSB[idx],((value * 16383) >> 7) & 0x7F);
        if (highRes) sendMidi(0xB0,E1_CC_LSB[idx],((value * 16383) >> 0) & 0x7F);
      }
    });

    parameter.name().addValueObserver(function(name) {

      var json = {
        "name": name,
        "visible" : !!name.trim().length
      }
      var ctrlId = (i < 4) ? (14 + i) : (16 + i)
      var data = `F0 00 21 45 14 07 ${num2hex(ctrlId & 0x7F)} ${num2hex(ctrlId >> 7)} ${str2hex(JSON.stringify(json))} F7`;
      host.getMidiOutPort(1).sendSysex(data)
    })
  }

  for (var i = 0; i < remoteControlsBank.getParameterCount(); i++) {
    setupParameter(i);
  }

  cursorDevice.isEnabled().markInterested();
  cursorDevice.isWindowOpen().markInterested();

  println("Electra One Control initialized!");
}

const values = [];

function handleMidi(status, data1, data2) {
  if (isChannelController(status)) {
    var idx = E1_CC_MSB.indexOf(data1);
    if (idx >= 0) {
      values[idx] = (values[idx] & (0x7F << 0)) | (data2 << 7);
      remoteControlsBank.getParameter(layoutColumns ? LAYOUT_COLUMNS_MAP[idx] : idx).set(values[idx], 16384);
    } else if (highRes) {
      idx = E1_CC_LSB.indexOf(data1);
      if (idx >= 0) {
        values[idx] = (values[idx] & (0x7F << 7)) | (data2 << 0);
        remoteControlsBank.getParameter(layoutColumns ? LAYOUT_COLUMNS_MAP[idx] : idx).set(values[idx], 16384);
      }
    }
  }
  return false;
}

function flush() {
}

function exit() {
  println("Electra One Control exited!");
}
