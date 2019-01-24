# Currency Exchange Rates

## Description
A module to get currency (fiat money) exchange rates, as well as convert the base value.

It also caches and persists the cache for all results (as historical rates should never change),
which decreases response times drastically, helps for api feeds like https://exchangeratesapi.io
to exist for free and for feeds from https://fixer.io and https://currencylayer.com to stay under
free tier (1000 requests/month for free).

`primaryApi` by default is set to `'exchangeratesapi'`, which retrieves rates from European Central Bank (ECB),
this feed is free for use, the only downside is that ECB does not update rates during the weekend.


`secondaryApi` by default is set to `null`, to let you start using this module, without any subscriptions
to `'fixer'` or `'currencylayer'`.


The idea behind `primaryApi` and `secondaryApi` is that if `secondaryApi` is null, it will always use
 only `primaryApi`, however if `secondaryApi` is specified it will use it in case when `primaryApi` fails
 or when `primaryApi` response rates date does not match requested date (in case of ECB).

## Install
```
npm i fiat-rates
```

## How to use
```javascript
const simple = async () => {
  const fiatRates = new FiatRates();
  const fiatRatesConfig = fiatRates.getConfig();
  let data;

  // See all config
  console.log(fiatRatesConfig);

  // Get latest currency rates data with default config
  data = await fiatRates.get();
  console.log(data);

  // Get latest currency rates data with default config but different base - 'GBP'
  data = await fiatRates.get({ base: 'GBP' });
  console.log(data);

  // Get currency rates data for 2019-01-21 with default config but different base - 'GBP'
  data = await fiatRates.get({ date: '2019-01-21', base: 'NOK' });
  console.log(data);

  // Custom symbols
  data = await fiatRates.get({ date: '2019-01-21', base: 'NOK', symbols: ['NOK', 'DKK', 'PHP'] });
  console.log(data);

  // Base value with calculations for requested symbols
  data = await fiatRates.get({ date: '2019-01-21', base: 'PHP', symbols: ['NOK', 'DKK', 'PHP'], baseValue: 10 });
  console.log(data);
};

const advanced = async () => {
  // Important thing in this config is enabling secondaryApi for more reliable results, primaryApi could be changed as well
  // Make sure that 'fixer' or 'currencylayer' access_key(s) are valid.
  const config = {
    currency: {
      base: 'GBP',
      symbols: ['USD', 'EUR', 'AUD', 'CAD', 'GBP', 'JPY'],
    },
    primaryApi: 'exchangeratesapi', // || 'fixer' || 'currencylayer'
    secondaryApi: 'fixer', // || 'currencylayer' || 'exchangeratesapi'
    api: { currencylayer: { access_key: '123' }, fixer: { access_key: '123' } },
  };
  const fiatRates = new FiatRates(config);
  const fiatRatesConfig = fiatRates.getConfig();
  let data;

  // You will see all default config with some overridden data from the config above (everything can be overridden)
  console.log(fiatRatesConfig);

  // Get latest currency rates data with custom config
  data = await fiatRates.get();
  console.log(data);

  // Custom date, base, symbols, baseValue
  data = await fiatRates.get({ date: '2019-01-21', base: 'PHP', symbols: ['NOK', 'DKK', 'PHP'], baseValue: 10 });
  console.log(data);
};

simple();
advanced();
```

## Important Notes
This module is using `flat-cache` module for caching and for persisting the cache on local file system.
By default it saves all data inside `./data/rates.json`, but you can override this with custom settings.
It is recommended to keep `cache` and `cache.persist` enabled as it will increase your application speed
and will save you a lot of bandwidth.


The default `cachId` which is `'rates.json'` within `./data` folder comes with rates preloaded from 2018-01-01
from fixer.io. You can find pre-loaded cache data from different apis within `./data` folder:
```
./data/exchangeratesapi-rates.json
./data/fixer-rates.json
./data/currencylayer-rates.json
./data/rates.json
```

Don't forget that different timezones and different providers update feeds at different times, therefore
you can fine tune when current time is "today", by tweaking these settings:
```ecmascript 6
{
  date: {
    format: 'YYYY-MM-DD',
    timezone: 'Europe/Berlin',
    minutesToDelay: 60 * 17,
  },
}
```
For example, `fixer` and `currencylayer` is updated at GMT 00:05, `exchangeratesapi` only around 16:00 CET, so that's
why the settings above mean that when in Berlin is 17:00 and more - return today's date, otherwise yesterday's date.

Or for `fixer` and `currencylayer`:
 ```ecmascript 6
{
  date: {
    format: 'YYYY-MM-DD',
    timezone: 'Europe/London',
    minutesToDelay: 60,
  },
}
```

## Default Options
```javascript
const path = require('path');
module.exports = {
  cache: {
    enabled: true,
    daysToPreload: 0,
    persist: {
      enabled: true,
      clearOnStartup: false,
      pathToDir: path.resolve(__dirname, '../data'),
      cacheId: 'rates.json',
    },
  },
  currency: {
    base: 'USD',
    symbols: ['USD', 'EUR', 'AUD', 'CAD', 'GBP', 'JPY'],
    availableSymbols: [
      'PHP',
      'HUF',
      'IDR',
      'TRY',
      'RON',
      'ISK',
      'ILS',
      'CNY',
      'USD',
      'EUR',
      'PLN',
      'GBP',
      'CAD',
      'AUD',
      'MYR',
      'NZD',
      'CHF',
      'HRK',
      'SGD',
      'DKK',
      'BGN',
      'CZK',
      'BRL',
      'JPY',
      'KRW',
      'INR',
      'SEK',
      'MXN',
      'RUB',
      'HKD',
      'ZAR',
      'THB',
      'NOK',
    ],
    valuesToFixed: 2,
  },
  date: {
    format: 'YYYY-MM-DD',
    timezone: 'Europe/Berlin',
    minutesToDelay: 60 * 17,
  },
  primaryApi: 'exchangeratesapi',
  secondaryApi: null,
  api: {
    exchangeratesapi: {
      endpoint: 'https://api.exchangeratesapi.io',
      timeout: 5000,
      defaultBase: 'EUR',
      baseParamKey: 'base',
      symbolsParamKey: 'symbols',
      requestKeys: {
        base: 'base',
        symbols: 'symbols',
      },
      responseKeys: {
        base: 'base',
        date: 'date',
        rates: 'rates',
      },
      methods: {
        getLatest: {
          method: 'GET',
          path: '/latest',
        },
        getByDate: {
          method: 'GET',
          path: '/:date',
        },
      },
    },
    currencylayer: {
      endpoint: 'http://apilayer.net/api',
      timeout: 5000,
      access_key: '',
      defaultBase: 'EUR',
      requestKeys: {
        // base: 'source', // requires plan upgrade
        symbols: 'currencies',
        date: 'date',
      },
      responseKeys: {
        base: 'source',
        date: 'date',
        rates: 'quotes',
      },
      methods: {
        getLatest: {
          method: 'GET',
          path: '/live',
        },
        getByDate: {
          method: 'GET',
          path: '/historical',
        },
      },
    },
    fixer: {
      endpoint: 'http://data.fixer.io/api',
      timeout: 5000,
      access_key: '',
      defaultBase: 'EUR',
      requestKeys: {
        // base: 'base', // requires plan upgrade
        symbols: 'symbols',
      },
      responseKeys: {
        base: 'base',
        date: 'date',
        rates: 'rates',
      },
      methods: {
        getLatest: {
          method: 'GET',
          path: '/latest',
        },
        getByDate: {
          method: 'GET',
          path: '/:date',
        },
      },
    },
  },
};

```

## TODO
If https://exchangeratesapi.io is down - implement a fallback to retrieve rates from:
- https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml
- https://www.ecb.europa.eu/stats/eurofxref/eurofxref-hist-90d.xml
- https://www.ecb.europa.eu/stats/eurofxref/eurofxref-hist.xml

