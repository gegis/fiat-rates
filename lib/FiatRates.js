const axios = require('axios');
const moment = require('moment-timezone');
const _ = require('lodash');
const objectAssignDeep = require('object-assign-deep');
const flatCache = require('flat-cache');
const ResponseHelper = require('./ResponseHelper');

const config = require('./config');

class FiatRates {
  constructor(options) {
    this.config = Object.assign({}, objectAssignDeep(config, options));
    const { cache: cacheConfig } = this.config;
    this.logger = this.config.logger || this.getLogger();
    this.cacheEnabled = cacheConfig.enabled;
    this.cachePersistEnabled = cacheConfig.persist.enabled;
    if (this.cachePersistEnabled && cacheConfig.persist.clearOnStartup) {
      this.clearCache();
    }
    if (this.cachePersistEnabled && cacheConfig.persist.pathToDir) {
      this.cache = flatCache.load(cacheConfig.persist.cacheId, cacheConfig.persist.pathToDir);
    } else {
      this.cache = flatCache.load(cacheConfig.persist.cacheId);
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
    // must be after api(s) have been specified
    if (this.cacheEnabled && cacheConfig.daysToPreload && cacheConfig.daysToPreload > 0) {
      // Do not await and pause the loading process!
      this.preCacheRates(cacheConfig.daysToPreload).catch(e => {
        this.logger.error(e);
      });
    }
  }

  getConfig() {
    return this.config;
  }

  clearCache() {
    const { cache: cacheConfig } = this.config;
    flatCache.clearCacheById(cacheConfig.persist.cacheId, cacheConfig.persist.pathToDir);
  }

  clearAllCache() {
    const { cache: cacheConfig } = this.config;
    flatCache.clearAll(cacheConfig.persist.pathToDir);
  }

  removeDateFromCache(date) {
    if (this.cacheEnabled && this.cachePersistEnabled && date) {
      this.cache.removeKey(date);
      this.cache.save(true);
    }
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

  async preCacheRates(days) {
    const { base } = this.config.currency;
    let date = this.getLatestDate();
    for (let day = days; day > 0; day--) {
      // Passing only base in symbols array, it will cache all availableSymbols anyway
      await this.getByDate(date.format(this.config.date.format), base, [base]);
      date = date.subtract(1, 'days');
    }
  }

  getLatestDate(formatDate = false) {
    const { format, timezone, minutesToDelay } = this.config.date;
    const latest = moment().tz(timezone);
    if (minutesToDelay) {
      latest.subtract(minutesToDelay, 'minutes');
    }
    if (formatDate) {
      return latest.format(format);
    }
    return latest;
  }

  async get(options = {}) {
    let latestDate = this.getLatestDate(true);
    let {
      base = this.config.currency.base,
      symbols = this.config.currency.symbols,
      baseValue = null,
      date = latestDate,
    } = options;

    // Do not allow future dates
    if (date > latestDate) {
      date = latestDate;
    }

    const data = await this.getByDate(date, base, symbols);

    if (baseValue || baseValue === 0) {
      this.calculateValues(data, baseValue);
    }

    return data;
  }

  async getByDate(date, base, symbols) {
    const { primaryApi, secondaryApi } = this.config;
    let data = null;
    let secondaryData = null;
    let secondaryApiCalled = false;

    // Try to get from cache first
    if (this.cacheEnabled) {
      // Need to make a copy, otherwise modifying data it modifies cache data
      data = Object.assign({}, this.cache.getKey(date));
      if (data && data.base && data.rates) {
        data.source = 'cache';
        if (data.base !== base) {
          this.convertBase(data, base);
        }
      } else {
        data = null;
      }
    }

    // It is not in cache, try primary api:
    if (!data) {
      try {
        data = await this.getByDateFromApi(primaryApi, date, base);
        if (data) {
          data.source = primaryApi;
        }
      } catch (e) {
        this.logger.error(e);
        //Failed to get from primary api, try from secondary api:
        if (secondaryApi) {
          try {
            secondaryApiCalled = true;
            data = await this.getByDateFromApi(secondaryApi, date, base);
            if (data) {
              data.source = secondaryApi;
            }
          } catch (e) {
            this.logger.error(e);
          }
        }
      }

      // If no data and secondary was not called yet - calle secondary
      // If primary api did not return requested date info and secondary was not called yet, call secondary api now:
      if (
        (!data && secondaryApi && !secondaryApiCalled) ||
        (data && data.date && data.date !== date && secondaryApi && !secondaryApiCalled)
      ) {
        try {
          // Do not overwrite data yet, as this call might fail and have data set to null;
          secondaryData = await this.getByDateFromApi(secondaryApi, date, base);
          if (secondaryData && secondaryData.date === date) {
            secondaryData.source = secondaryApi;
            data = secondaryData;
          }
        } catch (e) {
          this.logger.error(e);
        }
      }

      this.updateCache(date, data);
    }

    this.extractRequestedSymbols(data, symbols);
    return data;
  }

  updateCache(date, data) {
    let newData;
    if (data && this.cacheEnabled) {
      newData = Object.assign({}, data);
      // For caching date is taken from requested and not from response data date,
      // otherwise it will always be hitting api and getting same info (in case of no ECB updates on weekend)
      this.cache.setKey(date, newData);
      if (this.cachePersistEnabled) {
        // True saves non visited as well.
        this.cache.save(true);
      }
    }
  }

  extractRequestedSymbols(data, symbols) {
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
    // requestBase is used to remove base from availableSymbols for exchangeratesapi request
    const requestBase = apiConfig.requestKeys.base ? base : apiConfig.defaultBase;
    // Copy all symbols for further modification
    let availableSymbols = this.config.currency.availableSymbols.slice();
    let baseIndex, response, data = null;

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

    if (response.data && response.data[apiConfig.responseKeys.rates]) {
      data = {
        rates: response.data[apiConfig.responseKeys.rates],
        base: response.data[apiConfig.responseKeys.base],
        date: response.data[apiConfig.responseKeys.date],
        requestDate: date,
        originalSource: apiName,
      };

      this.normalizeSymbols(data);

      if (data.base !== base) {
        this.convertBase(data, base);
      }
    }

    return data;
  }

  // Some apis prepend base symbol next to each symbol, so it normalizes all if needed
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
      if (!data.rates.hasOwnProperty(data.base)) {
        data.rates[data.base] = 1;
      }
    }
    return data;
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
    const { currency } = this.config;
    if (typeof baseValue === 'string') {
      baseValue = parseFloat(baseValue);
    }
    if ((baseValue || baseValue === 0) && data && data.rates) {
      data.baseValue = baseValue;
      data.values = {};
      for (let symbol in data.rates) {
        if (data.rates.hasOwnProperty(symbol)) {
          value = baseValue * data.rates[symbol];
          if (currency.valuesToFixed) {
            value = value.toFixed(currency.valuesToFixed);
          }
          data.values[symbol] = value;
        }
      }
      if (currency.valuesToFixed) {
        data.values[data.base] = baseValue.toFixed(currency.valuesToFixed);
      } else {
        data.values[data.base] = baseValue;
      }
    }
  }
}

module.exports = FiatRates;
