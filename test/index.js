const path = require('path');
const { expect } = require('chai');

const FiatRates = require('../index');
const { currencylayerToken = null, fixerToken = null } = require('../lib/tokens.js');

const fr = new FiatRates();
const todayDate = fr.getLatestDate(true);

describe(`Test with default config, ${todayDate}`, function() {
  const config = {
    cache: {
      persist: {
        pathToDir: path.resolve('./test/'),
      },
    },
    api: { currencylayer: { access_key: currencylayerToken }, fixer: { access_key: fixerToken } },
  };
  const fiatRates = new FiatRates(config);
  const fiatRatesConfig = fiatRates.getConfig();

  it('should get latest with main config settings', async function() {
    const data = await fiatRates.get();
    expect(data).to.have.property('base', fiatRatesConfig.currency.base);
    expect(data).to.have.property('rates');
    expect(data.rates).to.have.keys(fiatRatesConfig.currency.symbols);
    expect(data).to.have.property('requestDate', todayDate);
    expect(data).to.have.property('originalSource', fiatRatesConfig.primaryApi);
    expect(data).to.have.property('source');
  });

  it('should return from cache for the second time', async function() {
    const data = await fiatRates.get();
    expect(data).to.have.property('base', fiatRatesConfig.currency.base);
    expect(data).to.have.property('rates');
    expect(data.rates).to.have.keys(fiatRatesConfig.currency.symbols);
    expect(data).to.have.property('requestDate', todayDate);
    expect(data).to.have.property('originalSource', fiatRatesConfig.primaryApi);
    expect(data).to.have.property('source', 'cache');
  });

  it('should return for requested date', async function() {
    const date = '2019-01-22';
    const data = await fiatRates.get({ date });
    expect(data).to.have.property('base', fiatRatesConfig.currency.base);
    expect(data).to.have.property('rates');
    expect(data.rates).to.have.keys(fiatRatesConfig.currency.symbols);
    expect(data).to.have.property('date', date);
    expect(data).to.have.property('requestDate', date);
    expect(data).to.have.property('originalSource', fiatRatesConfig.primaryApi);
  });

  it('should return with custom symbols', async function() {
    const symbols = ['PHP', 'CAD', 'EUR', 'DKK'];
    const data = await fiatRates.get({ symbols });
    expect(data).to.have.property('base', fiatRatesConfig.currency.base);
    expect(data).to.have.property('rates');
    expect(data.rates).to.have.keys(symbols);
    expect(data).to.have.property('source', 'cache');
  });

  it('should return with different base', async function() {
    const base = 'DKK';
    const data = await fiatRates.get({ base });
    expect(data).to.have.property('base', base);
    expect(data).to.have.property('rates');
    expect(data.rates).to.have.keys(fiatRatesConfig.currency.symbols);
    expect(data).to.have.property('source', 'cache');
  });

  it('should return with baseValue', async function() {
    const baseValue = 10;
    const data = await fiatRates.get({ baseValue });
    expect(data).to.have.property('base', fiatRatesConfig.currency.base);
    expect(data).to.have.property('rates');
    expect(data.rates).to.have.keys(fiatRatesConfig.currency.symbols);
    expect(data).to.have.property('source', 'cache');
    expect(data).to.have.property('baseValue', baseValue);
    expect(data).to.have.property('values');
    expect(data.values).to.have.keys(fiatRatesConfig.currency.symbols);
    expect(data.values).to.have.property(
      fiatRatesConfig.currency.base,
      baseValue.toFixed(fiatRatesConfig.currency.valuesToFixed)
    );
  });
});

describe(`Test with custom config, ${todayDate}`, function() {
  const config = {
    cache: {
      persist: {
        clearOnStartup: true,
        pathToDir: path.resolve('./test/'),
      },
    },
    currency: {
      base: 'DKK',
      symbols: ['DKK', 'NOK', 'USD', 'EUR', 'GBP', 'JPY'],
      valuesToFixed: false,
    },
    primaryApi: 'exchangeratesapi',
    // secondaryApi: 'currencylayer',
    api: { currencylayer: { access_key: currencylayerToken }, fixer: { access_key: fixerToken } },
  };
  const fiatRates = new FiatRates(config);

  it('should get latest with main config settings', async function() {
    const data = await fiatRates.get();
    expect(data).to.have.property('base', config.currency.base);
    expect(data).to.have.property('rates');
    expect(data.rates).to.have.keys(config.currency.symbols);
    expect(data).to.have.property('requestDate', todayDate);
    expect(data).to.have.property('originalSource', config.primaryApi);
    expect(data).to.have.property('source');
    expect(data.source).to.be.not.equal('cache');
  });

  it('should return from cache for the second time', async function() {
    const data = await fiatRates.get();
    expect(data).to.have.property('base', config.currency.base);
    expect(data).to.have.property('rates');
    expect(data.rates).to.have.keys(config.currency.symbols);
    expect(data).to.have.property('requestDate', todayDate);
    expect(data).to.have.property('originalSource', config.primaryApi);
    expect(data).to.have.property('source', 'cache');
  });

  it('should return for requested date', async function() {
    const date = '2019-01-22';
    const data = await fiatRates.get({ date });
    expect(data).to.have.property('base', config.currency.base);
    expect(data).to.have.property('rates');
    expect(data.rates).to.have.keys(config.currency.symbols);
    expect(data).to.have.property('date', date);
    expect(data).to.have.property('requestDate', date);
    expect(data).to.have.property('originalSource', config.primaryApi);
  });

  it('should return with custom symbols', async function() {
    const symbols = ['PHP', 'CAD', 'EUR', 'DKK'];
    const data = await fiatRates.get({ symbols });
    expect(data).to.have.property('base', config.currency.base);
    expect(data).to.have.property('rates');
    expect(data.rates).to.have.keys(symbols);
    expect(data).to.have.property('source', 'cache');
  });

  it('should return with different base', async function() {
    const base = 'DKK';
    const data = await fiatRates.get({ base });
    expect(data).to.have.property('base', base);
    expect(data).to.have.property('rates');
    expect(data.rates).to.have.keys(config.currency.symbols);
    expect(data).to.have.property('source', 'cache');
  });

  it('should return with baseValue', async function() {
    const baseValue = 10;
    const data = await fiatRates.get({ baseValue });
    expect(data).to.have.property('base', config.currency.base);
    expect(data).to.have.property('rates');
    expect(data.rates).to.have.keys(config.currency.symbols);
    expect(data).to.have.property('source', 'cache');
    expect(data).to.have.property('baseValue', baseValue);
    expect(data).to.have.property('values');
    expect(data.values).to.have.keys(config.currency.symbols);
    expect(data.values).to.have.property(config.currency.base);
    expect(data.values[config.currency.base]).to.be.equal(baseValue);
  });
});
