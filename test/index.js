const moment = require('moment');
const { expect } = require('chai');

const FiatRates = require('../index');
const { currencylayerToken = null, fixerToken = null } = require('../lib/tokens.js');

const mainConfig = Object.assign({}, require('../lib/config'));
const todayDate = moment().format(mainConfig.date.format);

// const config = {
//   currency: {
//     base: 'EUR',
//     symbols: ['EUR', 'USD', 'CAD', 'GBP', 'JPY']
//   },
//   api: {
//     currencylayer: {
//       access_key: currencylayerToken,
//     },
//     fixer: {
//       access_key: fixerToken,
//     },
//   },
// };
// const fiatRates = new FiatRates(config);
// const fiatRatesConfig = fiatRates.getConfig();

describe(`Test with default config, ${todayDate}`, () => {
  it('should get latest with main config settings', async () => {
    const data = await fiatRates.get();
    expect(data).to.have.property('base', fiatRatesConfig.currency.base);
    expect(data).to.have.property('rates');
    expect(data.rates).to.have.keys(fiatRatesConfig.currency.symbols);
    expect(data).to.have.property('requestDate', todayDate);
  });

  it('should return from cache for second time', async () => {
    const data = await fiatRates.get();
    expect(data).to.have.property('base', fiatRatesConfig.currency.base);
    expect(data).to.have.property('rates');
    expect(data.rates).to.have.keys(fiatRatesConfig.currency.symbols);
    expect(data).to.have.property('requestDate', todayDate);
    expect(data).to.have.property('source', 'cache');
  });
});

describe(`Test with custom config, ${todayDate}`, () => {
  // const config = {
  //   currency: {
  //     base: 'EUR',
  //     symbols: ['EUR', 'USD', 'CAD', 'GBP', 'JPY']
  //   },
  //   api: {
  //     currencylayer: {
  //       access_key: currencylayerToken,
  //     },
  //     fixer: {
  //       access_key: fixerToken,
  //     },
  //   },
  // };
  // const fr = new FiatRates(config);
  // console.log(fr.getConfig());

  it('should get latest with custom config', async () => {
    const data = await fiatRates.get();
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

describe.only(`FOR TESTING, ${todayDate}`, () => {
  const config = {
    cache: {
      enabled: true,
      daysToPreload: 3,
    },
    currency: {
      base: 'USD',
      symbols: ['EUR', 'USD', 'GBP', 'AUD'],
      valuesToFixed: false,
    },
    primaryApi: 'exchangeratesapi',
    secondaryApi: null,
  };
  const fr = new FiatRates(config);

  it('should get latest with base as Eur', async () => {
    // const data = await fr.get({baseValue: 10, date: '2019-01-17'});
    // console.log(fr.getConfig());
    const data = await fr.get({ date: '2019-01-19', baseValue: 10 });
    console.log('---------------');
    console.log(data);
    // expect(data).to.have.property('rates');
    // expect(data).to.have.property('base', config.currency.base);
    // expect(data.rates).to.have.keys(config.currency.symbols);
  });

  it('should get latest with base as Eur', async () => {
    // const data = await fr.get({baseValue: 10, date: '2019-01-17'});
    // console.log(fr.getConfig());
    const data = await fr.get({ date: '2019-01-20', baseValue: 20 });
    console.log('---------------');
    console.log(data);
    // expect(data).to.have.property('rates');
    // expect(data).to.have.property('base', config.currency.base);
    // expect(data.rates).to.have.keys(config.currency.symbols);
  });

  it('should get latest with base as Eur', async () => {
    // const data = await fr.get({baseValue: 10, date: '2019-01-17'});
    // console.log(fr.getConfig());
    const data = await fr.get({ date: '2019-01-20', baseValue: 30, symbols: ['CAD', 'PHP'] });
    console.log('---------------');
    console.log(data);
    // expect(data).to.have.property('rates');
    // expect(data).to.have.property('base', config.currency.base);
    // expect(data.rates).to.have.keys(config.currency.symbols);
  });

  // it('should get latest with base as USD', async () => {
  //   const data = await fr.get({baseValue: 10, date: '2019-01-17'});
  //   expect(data).to.have.property('rates');
  //   expect(data).to.have.property('base', config.currency.base);
  //   expect(data.rates).to.have.keys(config.currency.symbols);
  // });

  // it('should get get it from memory', async () => {
  //   const config = {
  //     currency: {
  //       base: 'USD',
  //       symbols: ['EUR', 'USD', 'GBP', 'AUD'],
  //     },
  //   };
  //   const fr = new FiatRates(config);
  //   const data = await fr.get();
  //   expect(data).to.have.property('rates');
  //   expect(data).to.have.property('base', config.currency.base);
  //   expect(data.rates).to.have.keys(config.currency.symbols);
  // });
});
