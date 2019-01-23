const FiatRates = require('../index');
const { currencylayerToken = null, fixerToken = null } = require('../lib/tokens.js');

const base = 'USD';
const daysToPreload = 1;
const clearOnStartup = false;


const fiatRates = new FiatRates();
console.log(fiatRates.cache);
process.exit(0);

const config1 = {
  cache: {
    daysToPreload,
    persist: {
      clearOnStartup,
      cacheId: 'exchangeratesapi-rates.json',
    },
  },
  currency: {
    base,
  },
  primaryApi: 'exchangeratesapi',
  secondaryApi: null,
  api: { currencylayer: { access_key: currencylayerToken }, fixer: { access_key: fixerToken } },
};
const fiatRates1 = new FiatRates(config1);
console.log(fiatRates1.cache);

const config2 = {
  cache: {
    daysToPreload,
    persist: {
      clearOnStartup,
      cacheId: 'fixer-rates.json',
    },
  },
  currency: {
    base,
  },
  primaryApi: 'fixer',
  secondaryApi: null,
  api: { currencylayer: { access_key: currencylayerToken }, fixer: { access_key: fixerToken } },
};
const fiatRates2 = new FiatRates(config2);
console.log(fiatRates2.cache);

const config3 = {
  cache: {
    daysToPreload,
    persist: {
      clearOnStartup,
      cacheId: 'currencylayer-rates.json',
    },
  },
  currency: {
    base,
  },
  primaryApi: 'currencylayer',
  secondaryApi: null,
  api: { currencylayer: { access_key: currencylayerToken }, fixer: { access_key: fixerToken } },
};
const fiatRates3 = new FiatRates(config3);
console.log(fiatRates3.cache);
