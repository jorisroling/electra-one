const Interface = require('./interface')


class Machine  {

  constructor(name) {
    this.name = name
    this.interface = new Interface(name)
  }


  connect(options) { // electra-one-2
    debug('options %y', options)

    this.interface.connect(options.electra, 'surface')
    this.interface.connect(options.general, 'external')
  }
}


module.exports = Machine
/*
const tst = new Machine('acid.v2')
tst.interface.read()
tst.interface.write()

debug('Interface transpose INT: %y', tst.interface.getParameter('transpose'))
debug('Interface transpose SUR: %y', tst.interface.getParameter('transpose', 'surface'))
debug('Interface transpose EXT: %y', tst.interface.getParameter('transpose', 'external'))
debug('Interface transpose MOD: %y', tst.interface.getParameter('transpose', 'modulated'))
debug('Interface transpose ELM: %y', tst.interface.getElement('transpose'))
*/