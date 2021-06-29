/*function remapOld(value, x1, y1, x2, y2) {
  let X1 = 0, Y1 = y1 - x1, X2 = 0, Y2 = y2 - x2
  return ((value - X1) * (Y2 - X2) / (Y1 - X1) + X2)
}

function remap(input, inputLow, inputHigh, outputLow, outputHigh) {
  return ((input - inputLow) / (inputHigh - inputLow)) * (outputHigh - outputLow) + outputLow
}

console.log(8000, -8192, 8191, -1.0, 1.0, remap(4000, -8192, 8191, -1.0, 1.0))

console.log(0.99, -1.0, 1.0, 0, 16383, remap(0.99, -1.0, 1.0, 0, 16383))

*/


const jsonfile = require('jsonfile')
require('./lib/yves')
const epr = jsonfile.readFileSync('./presets/Access Virus TI.epr')
//debug('epr %y',epr)
//const epr = require('./presets/Access Virus TI.epr')



for (let ctrl in epr.controls) {
  const control = epr.controls[ctrl]
  const parameter = control.values[0].message.parameterNumber
  const min = control.values[0].message.min
  const max = control.values[0].message.max
  const displayMin = control.values[0].min
  const displayMax = control.values[0].max
  const defaultValue = control.values[0].defaultValue
  let page = 'A'
  if (control.values[0].message.data) {
    const pageID = control.values[0].message.data[6]
    if (pageID) {
      if (pageID=='70') {
        page='A'
      } else if (pageID=='71') {
        page='B'
      } else if (pageID=='72') {
        page='C'
      } else if (pageID=='6E') {
        page='D'
      } else if (pageID=='6F') {
        page='E'
      } else if (pageID=='73') {
        page='F'
      } else {
        page='?:'+pageID
      }
    } else {
      page='?'
    }
  }
  const name = control.name
  debug('ctrl name %y page %y parameter %y min %y max %y displayMin %y displayMax %y defaultValue %y',name,page,parameter,min,max,displayMin,displayMax,defaultValue)

}