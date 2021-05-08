const _ = require('lodash')

const path = require('path')
const glob = require('glob')

const devices = {}
const deviceFiles = glob.sync(path.join(__dirname,'..','devices') + '/*.js', {})
for (let f = 0; f < deviceFiles.length; f++) {
  const name = path.basename(deviceFiles[f], '.js')
  devices[name] = require(deviceFiles[f])
}


const CC = {}
const NRPN = {}
const leaveMembers = ['cc','nrpn'/*,'min','max'*/]



function parameterPaths(obj, prev, deviceKey) {
  if (typeof obj == 'object') {
    const leaveKeys = Object.keys(obj).filter( key => leaveMembers.indexOf(key) >= 0 )
    if (leaveKeys && leaveKeys.length) {
      if (!devices[deviceKey].flatList) {
        devices[deviceKey].flatList = []
      }
      devices[deviceKey].flatList.push(prev)
    }
    const parameterKeys = Object.keys(obj).filter( key => leaveMembers.indexOf(key) == -1 )
    parameterKeys.forEach( key => parameterPaths(obj[key],`${prev}${prev ? '.' : ''}${key}`,deviceKey) )
  }
}

function processDeviceParameters() {
  const deviceKeys = Object.keys(devices)
  if (!Object.keys(CC).length && !Object.keys(NRPN).length) {
    deviceKeys.forEach( deviceKey => {
      /*    devices[deviceKey].flatList=[]*/
      const parameters = devices[deviceKey].parameters
      if (parameters) {
        parameterPaths(parameters,'',deviceKey)
        if (devices[deviceKey].flatList) {
          devices[deviceKey].flatList.forEach( parameter => {
            const par = _.get(devices,`${deviceKey}.parameters.${parameter}`)
            if (par) {
              const cc_msb = _.get(par,'cc.msb',par.cc)
              if (typeof cc_msb != 'undefined') {
                if (!CC[cc_msb]) {
                  CC[cc_msb] = 0
                }
                CC[cc_msb]++
                const cc_lsb = _.get(par,'cc.lsb')
                if (typeof cc_lsb != 'undefined') {
                  if (!CC[cc_lsb]) {
                    CC[cc_lsb] = 0
                  }
                  CC[cc_lsb]++
                }
              }
              const nrpn_msb = _.get(par,'nrpn.msb')
              if (typeof nrpn_msb != 'undefined') {
                if (!NRPN[nrpn_msb]) {
                  NRPN[nrpn_msb] = {}
                }
                const nrpn_lsb = _.get(par,'nrpn.lsb')
                if (typeof nrpn_lsb != 'undefined') {
                  if (!NRPN[nrpn_msb][nrpn_lsb]) {
                    NRPN[nrpn_msb][nrpn_lsb] = 0
                  }
                  NRPN[nrpn_msb][nrpn_lsb]++
                }
              }
            }
          })
        }
      }
    })
  }
}

processDeviceParameters()

function matchParam(device, cc_msb, cc_lsb, nrpn_msb, nrpn_lsb) {
  const result = []
  const deviceKeys = Object.keys(devices)
  deviceKeys.forEach( deviceKey => {
    if (deviceKey != device) {
      const parameters = devices[deviceKey].parameters
      if (parameters) {
        if (devices[deviceKey].flatList) {
          devices[deviceKey].flatList.forEach( parameter => {
            const par = _.get(devices,`${deviceKey}.parameters.${parameter}`)
            if (par) {
              const cc_m = _.get(par,'cc.msb',par.cc)
              const cc_l = _.get(par,'cc.lsb')
              const nrpn_m = _.get(par,'nrpn.msb')
              const nrpn_l = _.get(par,'nrpn.lsb')
              if (
                (typeof cc_msb != 'undefined' && typeof cc_m != 'undefined' && cc_msb === cc_m)
                || (typeof cc_lsb != 'undefined' && typeof cc_l != 'undefined' && cc_lsb === cc_l)
                || ( (typeof nrpn_msb != 'undefined' && typeof nrpn_m != 'undefined' && nrpn_msb === nrpn_m)
                  && (typeof nrpn_lsb != 'undefined' && typeof nrpn_l != 'undefined' && nrpn_lsb === nrpn_l) ) ) {
                const report = {device:deviceKey,parameter}
                if (par.cc) {
                  report.cc = par.cc
                }
                if (par.nrpn) {
                  report.nrpn = {msb:par.nrpn.msb,lsb:par.nrpn.lsb}
                }
                result.push(report)
              }
            }
          })
        }
      }
    }
  })
  return result
}



//const { devices } = require('../lib/devices')
/*const _ = require('lodash')*/
const yves = require('../lib/yves')

/*yves(devices)
process.exit()
*/

function deviceCCs(deviceKey) {
  const result = []
  const parameters = devices[deviceKey].parameters
  if (parameters) {
    if (devices[deviceKey].flatList) {
      /*      debug(devices[deviceKey])*/
      devices[deviceKey].flatList.forEach( parameter => {
        const idx = _.get(devices[deviceKey],`parameters.${parameter}.cc`)
        result[idx] = parameter
      })
    }
  }
  return result
}


module.exports = {
  devices,
  matchParam,
  deviceCCs,
  CC,
  NRPN,
}