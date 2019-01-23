# Currency Exchange Rates

## Description
A module to get currency (fiat money) exchange rates, as well as convert the base value.

It also caches and persists the cache for all results (as historical rates should never change),
which decreases response times drastically, helps for api feeds like `https://exchangeratesapi.io`
to exist for free and for feeds from `https://fixer.io` and `https://currencylayer.com` to stay under
free tier (1000 requests/month for free).

`primaryApi` by default is set to `'exchangeratesapi'`, which retrievs rates from European Central Bank (ECB),
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
```
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
About flat-cache and cache-persist

## TODO
If https://exchangeratesapi.io is down - implement a fallback to retrieve rates from:
- https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml
- https://www.ecb.europa.eu/stats/eurofxref/eurofxref-hist-90d.xml
- https://www.ecb.europa.eu/stats/eurofxref/eurofxref-hist.xml

