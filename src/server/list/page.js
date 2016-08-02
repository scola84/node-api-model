import odiff from 'odiff';
import SelectQuery from './query/select';

export default class ServerPage {
  constructor() {
    this._index = null;
    this._list = null;

    this._cache = null;
    this._lifetime = null;
    this._interval = null;

    this._validate = null;
    this._select = null;
  }

  destroy(cache) {
    clearInterval(this._interval);
    this._list.page(this._index, false);

    if (cache === true) {
      this._cache.delete(this.key());
    }
  }

  index(index) {
    if (typeof index === 'undefined') {
      return this._index;
    }

    this._index = index;
    return this;
  }

  list(list) {
    if (typeof list === 'undefined') {
      return this._list;
    }

    this._list = list;
    return this;
  }

  cache(cache, lifetime) {
    if (typeof cache === 'undefined') {
      return this._cache;
    }

    this._cache = cache;
    this._lifetime = lifetime;

    return this;
  }

  validate(validate) {
    if (typeof validate === 'undefined') {
      return this._validate;
    }

    this._validate = validate;
    return this;
  }

  key() {
    return this._list.key() + '/' + this._index;
  }

  data(data, callback = () => {}) {
    if (typeof data === 'function') {
      this._cache.get(this.key(), data);
      return;
    }

    this._cache.set(this.key(), data, this._lifetime, (error) => {
      if (error) {
        callback(error);
        return;
      }

      if (this._lifetime) {
        this._interval = setInterval(this._keepalive.bind(this),
          this._lifetime * 0.9);
      }

      callback();
    });
  }

  select(select) {
    if (typeof select === 'undefined') {
      return this._select;
    }

    this._select = new SelectQuery()
      .list(this._list)
      .page(this)
      .query(select)
      .validate(this._validate);

    return this;
  }

  change(callback) {
    this._cache.get(this.key(), (error, cacheData) => {
      if (error) {
        callback(error);
        return;
      }

      this.select().execute((queryError, data) => {
        if (queryError) {
          callback(queryError);
          return;
        }

        callback(null, odiff(cacheData, data), data);
      }, true);
    });
  }

  _keepalive() {
    this._cache.touch(this.key(), this._lifetime);
  }
}
