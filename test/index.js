const moment = require('moment');
const { expect } = require('chai');

const FiatRates = require('../index');
const { currencylayerToken = null, fixerToken = null } = require('../lib/tokens.js');

const mainConfig = Object.assign({}, require('../lib/config'));
const todayDate = moment().format(mainConfig.date.format);

describe.only(`Test with default config, ${todayDate}`, () => {
  const config = {
    api: {
      currencylayer: {
        access_key: currencylayerToken,
      },
      fixer: {
        access_key: fixerToken,
      },
    },
  };
  const fr = new FiatRates(config);

  it('should get latest with main config settings', async () => {
    const frConfig = fr.getConfig();
    const data = await fr.get();
    expect(data).to.have.property('base', frConfig.currency.base);
    expect(data).to.have.property('rates');
    expect(data.rates).to.have.keys(frConfig.currency.symbols);
    expect(data).to.have.property('requestDate', todayDate);
  });

  it('should return from cache for second time', async () => {
    const data = await fr.get();
    expect(data).to.have.property('source', 'cache');
  });

  // it('should return from db for new instance and from cache for old instance', async () => {
  //   const fr2 = new FiatRates(config);
  //   const data = await fr.get();
  //   expect(data).to.have.property('source', 'cache');
  //   const data2 = await fr2.get();
  //   expect(data2).to.have.property('source', 'db');
  // });
});

describe.only(`Test with custom config, ${todayDate}`, () => {
  const config = {
    currency: {
      base: 'EUR',
      symbols: ['EUR', 'USD', 'CAD', 'GBP', 'JPY']
    },
    api: {
      currencylayer: {
        access_key: currencylayerToken,
      },
      fixer: {
        access_key: fixerToken,
      },
    },
  };
  const fr = new FiatRates(config);

  it('should get latest with custom config', async () => {
    const data = await fr.get();
    expect(data).to.have.property('base', config.currency.base);
    expect(data).to.have.property('rates');
    expect(data.rates).to.have.keys(config.currency.symbols);
    expect(data).to.have.property('requestDate', todayDate);
  });

});

// describe(`Test get() with custom config, ${todayDate}`, () => {
//   const config = {
//     currency: {
//       base: 'USD',
//       symbols: ['EUR', 'USD', 'GBP', 'AUD'],
//       valuesToFixed: false,
//     },
//     localStorage: {
//       enabled: true,
//     },
//     primaryApi: 'exchangeratesapi',
//     secondaryApi: 'fixer',
//   };
//   it('should get latest with base as USD', async () => {
//     const config = {
//       currency: {
//         base: 'USD',
//         symbols: ['EUR', 'USD', 'GBP', 'AUD'],
//       },
//     };
//     const fr = new FiatRates(config);
//     const data = await fr.get();
//     expect(data).to.have.property('rates');
//     expect(data).to.have.property('base', config.currency.base);
//     expect(data.rates).to.have.keys(config.currency.symbols);
//     // TODO uncomment this, once functionality is written
//     // expect(data.date).to.be.equal(todayDate);
//   });
//
//   it('should get latest with base as EUR', async () => {
//     const config = {
//       currency: {
//         base: 'EUR',
//         symbols: ['EUR', 'USD', 'GBP', 'AUD'],
//       },
//     };
//     const fr = new FiatRates(config);
//     const data = await fr.get();
//     expect(data).to.have.property('rates');
//     expect(data).to.have.property('base', config.currency.base);
//     expect(data.rates).to.have.keys(config.currency.symbols);
//     console.log('=====================');
//     console.log(config);
//     // TODO uncomment this, once functionality is written
//     // expect(data.date).to.be.equal(todayDate);
//   });
//
//   it('should get latest with base as GBP', async () => {
//     const config = {
//       currency: {
//         base: 'GBP',
//         symbols: ['EUR', 'USD', 'GBP', 'AUD'],
//       },
//     };
//     const fr = new FiatRates(config);
//     const data = await fr.get();
//     expect(data).to.have.property('rates');
//     expect(data).to.have.property('base', config.currency.base);
//     expect(data.rates).to.have.keys(config.currency.symbols);
//     // TODO uncomment this, once functionality is written
//     // expect(data.date).to.be.equal(todayDate);
//   });
//
//   it('should get latest with base as AUD', async () => {
//     const config = {
//       currency: {
//         base: 'AUD',
//         symbols: ['EUR', 'USD', 'GBP', 'AUD'],
//       },
//     };
//     const fr = new FiatRates(config);
//     const data = await fr.get();
//     expect(data).to.have.property('rates');
//     expect(data).to.have.property('base', config.currency.base);
//     expect(data.rates).to.have.keys(config.currency.symbols);
//     // TODO uncomment this, once functionality is written
//     // expect(data.date).to.be.equal(todayDate);
//   });
// });
//
// describe(`Test get() with custom config and baseValue, ${todayDate}`, () => {
//   it('should get latest with base as USD and have values calculated', async () => {
//     const config = {
//       currency: {
//         base: 'USD',
//         symbols: ['EUR', 'USD', 'GBP', 'AUD'],
//       },
//     };
//     const baseValue = 10;
//     const fr = new FiatRates(config);
//     const data = await fr.get({
//       baseValue,
//     });
//     expect(data).to.have.property('rates');
//     expect(data).to.have.property('base', config.currency.base);
//     expect(data.rates).to.have.keys(config.currency.symbols);
//     expect(data).to.have.property('baseValue', baseValue);
//     expect(data).to.have.property('values');
//     expect(data.values).to.have.keys(config.currency.symbols);
//
//     // TODO uncomment this, once functionality is written
//     // expect(data.date).to.be.equal(todayDate);
//   });
// });

// describe(`FOR TESTING, ${todayDate}`, () => {
//   const config = {
//     currency: {
//       base: 'USD',
//       symbols: ['EUR', 'USD', 'GBP', 'AUD'],
//       valuesToFixed: false,
//     },
//     localStorage: {
//       enabled: true,
//     },
//     primaryApi: 'exchangeratesapi',
//     secondaryApi: 'fixer',
//   };
//   const fr = new FiatRates(config);
//
//   it('should get latest with base as Eur', async () => {
//     // const data = await fr.get({baseValue: 10, date: '2019-01-17'});
//     // console.log(fr.getConfig());
//     const data = await fr.get({ baseValue: 10 });
//     console.log('---------------');
//     console.log(data);
//     // expect(data).to.have.property('rates');
//     // expect(data).to.have.property('base', config.currency.base);
//     // expect(data.rates).to.have.keys(config.currency.symbols);
//   });
//
//   // it('should get latest with base as USD', async () => {
//   //   const data = await fr.get({baseValue: 10, date: '2019-01-17'});
//   //   expect(data).to.have.property('rates');
//   //   expect(data).to.have.property('base', config.currency.base);
//   //   expect(data.rates).to.have.keys(config.currency.symbols);
//   // });
//
//   // it('should get get it from memory', async () => {
//   //   const config = {
//   //     currency: {
//   //       base: 'USD',
//   //       symbols: ['EUR', 'USD', 'GBP', 'AUD'],
//   //     },
//   //   };
//   //   const fr = new FiatRates(config);
//   //   const data = await fr.get();
//   //   expect(data).to.have.property('rates');
//   //   expect(data).to.have.property('base', config.currency.base);
//   //   expect(data.rates).to.have.keys(config.currency.symbols);
//   // });
// });
