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
      defaultBase: 'USD',
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
    // TODO implement this as a fallback for exchangeratesapi
    // ecb: {
    //   endpoint: 'https://www.ecb.europa.eu/stats/eurofxref',
    //   methods: {
    //     getLatest: {
    //       method: 'GET',
    //       path: '/eurofxref-daily.xml',
    //     },
    //     getLast90Days: {
    //       method: 'GET',
    //       path: '/eurofxref-hist-90d.xml',
    //     },
    //     getAll: {
    //       method: 'GET',
    //       path: '/eurofxref-hist.xml',
    //     },
    //   },
    // },
  },
};
