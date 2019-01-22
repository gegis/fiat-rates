const axios = require('axios');
const moment = require('moment');
const _ = require('lodash');
const objectAssignDeep = require('object-assign-deep');
const Datastore = require('nedb');
const ResponseHelper = require('./ResponseHelper');

const config = require('./config');

class FiatRates {
  constructor(options) {
    this.config = objectAssignDeep(config, options);
    this.logger = this.config.logger || this.getLogger();
    this.cache = {};
    this.db = null;
    this.cacheEnabled = this.config.cache.enabled;
    if (this.config.localStorage.enabled) {
      this.setupLocalDb();
    }
    if (this.cacheEnabled && this.config.cache.daysToPreload) {
      // Do not await!
      this.preloadToCache(this.config.cache.daysToPreload).catch(e => {
        this.logger.error(e);
      });
    }
    this.api = {};
    this.api[this.config.primaryApi] = axios.create({
      baseURL: this.config.api[this.config.primaryApi].endpoint,
      timeout: this.config.api[this.config.primaryApi].timeout,
    });
    if (this.config.secondaryApi) {
      this.api[this.config.secondaryApi] = axios.create({
        baseURL: this.config.api[this.config.secondaryApi].endpoint,
        timeout: this.config.api[this.config.secondaryApi].timeout,
      });
    }
  }

  getConfig() {
    return this.config;
  }

  getLogger() {
    return {
      log: console.log, // eslint-disable-line no-console
      info: console.info, // eslint-disable-line no-console
      debug: console.debug, // eslint-disable-line no-console
      warn: console.warn, // eslint-disable-line no-console
      error: console.error, // eslint-disable-line no-console
    };
  }

  setupLocalDb() {
    if (this.config.localStorage.engine === 'nedb') {
      this.setupNedb();
    }
  }

  setupNedb() {
    try {
      this.db = new Datastore(this.config.localStorage.options);
    } catch (e) {
      this.logger.error(e);
    }
  }

  async preloadToCache(days) {
    const { base } = this.config.currency;
    let date = moment();
    for (let day = days; day > 0; day--) {
      date = date.subtract(1, 'days');
      // Passing only base in symbols array, it will cache all availableSymbols anyway
      await this.getByDate(date.format(this.config.date.format), base, [base]);
    }
  }

  async get(options = {}) {
    const {
      base = this.config.currency.base,
      symbols = this.config.currency.symbols,
      baseValue = null,
      date = moment().format(config.date.format),
    } = options;

    const data = await this.getByDate(date, base, symbols);

    if (baseValue) {
      this.calculateValues(data, baseValue);
    }

    return data;
  }

  async getByDate(date, base, symbols) {
    console.log('WE WANT ' + base);
    let data = null;
    let secondaryData = null;
    let secondaryApiCalled = false;

    // Try to get from cache first
    if (this.cache[date] && this.cache[date][base] && this.cache[date][base].rates) {
      data = this.cache[date][base];
      if (data) {
        data.source = 'cache';
      }
    } else {
      // It is not in cache, try from db, if db is setup:
      if (this.db) {
        try {
          data = await this.findInDb(date, base);
          if (data) {
            data.source = 'db';
          }
        } catch (e) {
          this.logger.error(e);
        }
      }

      // It is not in db, try primary api:
      if (!data) {
        try {
          data = await this.getByDateFromApi(this.config.primaryApi, date, base);
          if (data) {
            data.source = this.config.primaryApi;
          }
        } catch (e) {
          this.logger.error(e);
          //Failed to get from primary api, try from secondary api:
          if (this.config.secondaryApi) {
            try {
              secondaryApiCalled = true;
              data = await this.getByDateFromApi(this.config.secondaryApi, date, base);
              if (data) {
                data.source = this.config.secondaryApi;
              }
            } catch (e) {
              this.logger.error(e);
            }
          }
        }

        // If primary api did not return requested date info and secondary was not called yet, call secondary api now:
        if (data && data.date && data.date !== date && !secondaryApiCalled && this.config.secondaryApi) {
          try {
            // Do not overwrite data yet, as this call might fail and have data null;
            secondaryData = await this.getByDateFromApi(this.config.secondaryApi, date, base);
            if (secondaryData) {
              secondaryData.source = this.config.secondaryApi;
              data = secondaryData;
            }
          } catch (e) {
            this.logger.error(e);
          }
        }
      }
    }
    this.cacheRates(date, data);
    this.saveRates(date, data);
    this.modifyReturnSymbols(data, symbols);
    return data;
  }

  findInDb(date, base) {
    return new Promise((resolve, reject) => {
      this.db.findOne({ requestDate: date, base: base }, (err, doc) => {
        if (err) {
          reject(err);
        }
        if (doc) {
          if (doc.hasOwnProperty('_id')) {
            delete doc._id;
          }
          resolve(doc);
        } else {
          // Let's see if we have other base for the day and we can convert it
          this.db.findOne({ requestDate: date }, (err, doc) => {
            if (err) {
              reject(err);
            }
            if (doc) {
              if (doc.hasOwnProperty('_id')) {
                delete doc._id;
              }
              if (doc.base !== base) {
                this.convertBase(doc, base);
              }
            }
            resolve(doc);
          });
        }
      });
    });
  }

  modifyReturnSymbols(data, symbols) {
    let newRates = {};
    if (data && data.rates && symbols) {
      symbols.map(symbol => {
        if (data.rates.hasOwnProperty(symbol)) {
          newRates[symbol] = data.rates[symbol];
        }
      });
      data.rates = newRates;
    }
  }

  async getByDateFromApi(apiName, date, base) {
    const params = {};
    const apiConfig = this.config.api[apiName];
    const { getByDate } = apiConfig.methods;
    // requestBase is used to remove base from availableSymbols
    const requestBase = apiConfig.requestKeys.base ? base : apiConfig.defaultBase;
    // Copy all symbols for modification
    let availableSymbols = this.config.currency.availableSymbols.slice();
    let baseIndex, data, response;

    if (apiConfig.access_key) {
      params.access_key = apiConfig.access_key;
    }
    if (apiConfig.requestKeys.base) {
      params[apiConfig.requestKeys.base] = base;
    }
    if (availableSymbols && apiConfig.requestKeys.symbols) {
      baseIndex = availableSymbols.indexOf(requestBase);
      // A known bug for exchangeratesapi, if params symbols contain base symbol, it throws an error
      if (apiName === 'exchangeratesapi' && baseIndex !== -1) {
        availableSymbols.splice(baseIndex, 1);
      }
      params[apiConfig.requestKeys.symbols] = availableSymbols.join(',');
    }
    if (apiConfig.requestKeys.date) {
      params[apiConfig.requestKeys.date] = date;
    }

    response = await this.api[apiName]({
      method: getByDate.method,
      url: getByDate.path.replace(':date', date),
      params,
    }).catch(e => {
      // TODO handle specific errors;
      throw ResponseHelper.parseError(e);
    });
    console.log(response.data);
    if (response.data && response.data[apiConfig.responseKeys.rates]) {
      data = {
        rates: response.data[apiConfig.responseKeys.rates],
        base: response.data[apiConfig.responseKeys.base],
        date: response.data[apiConfig.responseKeys.date],
        requestDate: date,
      };

      this.normalizeSymbols(data);

      if (data.base !== base) {
        this.convertBase(data, base);
      }
    }
    console.log(data);
    return data;
  }

  normalizeSymbols(data) {
    let newRates = {};
    let replaceRates = false;
    if (data && data.rates && data.base) {
      for (let symbol in data.rates) {
        if (symbol && symbol.length > 3) {
          replaceRates = true;
          newRates[symbol.replace(data.base, '')] = data.rates[symbol];
        } else {
          break;
        }
      }
      if (replaceRates) {
        data.rates = newRates;
      }
    }
    return data;
  }

  cacheRates(date, data) {
    let newData;
    if (data && this.cacheEnabled) {
      newData = Object.assign({}, data);
      if (!this.cache.hasOwnProperty(data.requestDate)) {
        this.cache[newData.requestDate] = {};
      }
      // For caching date is taken from requested and not from response data date,
      // otherwise it will always be hitting api and getting same info (in case of no ECB updates on weekend)
      this.cache[newData.requestDate][newData.base] = newData;
    }
  }

  saveRates(date, data) {
    let newData;
    if (data && this.db) {
      console.log('upserting db');
      newData = Object.assign({}, data);
      console.log({ requestDate: newData.requestDate, base: newData.base });
      console.log(newData);
      this.db.update({ requestDate: newData.requestDate, base: newData.base }, newData, { upsert: true });
    }
  }

  convertBase(data, newBase) {
    let newRates;
    data.rates[data.base] = 1;
    newRates = this.recalculateBaseRates(data.rates, data.base, newBase);
    if (_.size(newRates) > 0) {
      data.rates = newRates;
      data.base = newBase;
    }
    return data;
  }

  recalculateBaseRates(rates, baseFrom, baseTo) {
    const newRates = {};
    let newBaseRate = null;

    if (rates && baseFrom && baseTo && rates[baseTo]) {
      newBaseRate = rates[baseTo];
      for (let symbol in rates) {
        if (rates.hasOwnProperty(symbol)) {
          newRates[symbol] = rates[symbol] / newBaseRate;
        }
      }
    } else {
      throw new Error('Could not find new base within the rates');
    }

    return newRates;
  }

  calculateValues(data, baseValue) {
    let value;
    if (baseValue && data && data.rates) {
      data.baseValue = baseValue;
      data.values = {};
      for (let symbol in data.rates) {
        value = baseValue * data.rates[symbol];
        if (this.config.currency.valuesToFixed) {
          value = value.toFixed(this.config.currency.valuesToFixed);
        }
        data.values[symbol] = value;
      }
      if (this.config.currency.valuesToFixed) {
        data.values[data.base] = baseValue.toFixed(this.config.currency.valuesToFixed);
      } else {
        data.values[data.base] = baseValue;
      }
    }
  }
}

module.exports = FiatRates;
