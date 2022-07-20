const pkg = require('../package.json')
const debugPrefix = pkg.name

const customWrapper = require('../lib/custom')

module.exports = customWrapper({
  debug: Object.prototype.hasOwnProperty.call(process.env, 'DEBUG') ? process.env.DEBUG : `${debugPrefix}:bacara,${debugPrefix}:bacara:error,${debugPrefix}:error:*`,
  "options": {
    "electra": "electra-one-port-2",
    "electraOneCtrl": "electra-one-ctrl",
    "scenario": "default",
    "clock": "bacara",
    "transpose": "bacara",
    "transposeChannel": 15,
    "osc": "torso-t1",
    "general": "bacara",
    "generalChannel": 1,
    "remote": null,
    "remoteChannel": 1,
    "bank": 0,
    "slot": 0,
    "id": 0,
    "name": "",
    "presetName": {
      "bacara": "Bacara Richie"
    }
  },
  "electra": {
    "checkPresetVia": "none",
    "presetName": {
      "bacara": "Bacara Richie"
    }
  },
  "osc": {
    "devices": {
      "torso-t1": {
        "address": "0.0.0.0",
        "port": "8000"
      }
    }
  },
  "devices": {
    devices: {
      'bacara': {
        model: 'Bacara',
        manufacturer: 'Me',
        channels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
        port: 'bacara',
        electraOne: {
          port: 2,
        },
      },
    },
  },
  "midi": {
    "ports": {
      "electra-one-port-1": {
        "darwin": "Electra Controller A Electra Port 1"
      },
      "electra-one-port-2": {
        "darwin": "Electra Controller A Electra Port 2"
      },
      "electra-one-ctrl": {
        "darwin": "Electra Controller A Electra CTRL"
      }
    }
  },
  "preset": {
    "midi": {
      "ports": {
        "input": [
          {
            "name": "Bacara",
            "short": "Bacara",
            "device": "bacara"
          }
        ],
        "output": [
          {
            "name": "Bacara",
            "short": "Bacara",
            "device": "bacara"
          }
        ]
      }
    }
  }

})
