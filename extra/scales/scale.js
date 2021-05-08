const parser = require('xml2json');
const yves = require('./lib/yves')
const jsonfile = require('jsonfile')


// /Applications/Ableton Live 11 Beta.app/Contents/App-Resources/Core Library/Devices/MIDI Effects/Scale/8-Tone Spanish.adv
const file = "./scale.xml"

const fs = require('fs');
const xml = fs.readFileSync(file,{encoding:'utf8'});

/*console.log(xml)*/

/*var xml = "<foo attr=\"value\">bar</foo>";*/
/*console.log("input -> %s", xml)*/

// xml to json
var json = JSON.parse(parser.toJson(xml))

yves(json)

const scales = jsonfile.readFileSync('./scales.json')

const name = json.Ableton.MidiScale.UserName.Value
yves(name)
const mapping = []
for (let i=0;i<12;i++) {
  mapping.push(parseInt(json.Ableton.MidiScale['Mapping.'+i].Manual.Value))
}
scales.scales.push({name,mapping})
jsonfile.writeFileSync('./scales.json', scales, { flag: 'w', spaces: 2 })


/*console.log("to json -> %s", json);*/

/*// json to xml
var xml2 = parser.toXml(json);
console.log("back to xml -> %s", xml2)*/