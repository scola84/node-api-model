import applyDiff from '../../helper/apply-diff';
import SelectRequest from './request/select';

export default class ClientPage {
  constructor() {
    this._index = null;
    this._list = null;
    this._cache = null;
    this._select = null;
  }

  destroy(cache) {
    this._list.page(this._index, false);

    if (cache === true && this._cache) {
      this._cache.delete(this.key());
    }
  }

  index(value) {
    if (typeof value === 'undefined') {
      return this._index;
    }

    this._index = value;
    return this;
  }

  list(value) {
    if (typeof value === 'undefined') {
      return this._list;
    }

    this._list = value;
    return this;
  }

  cache(value) {
    if (typeof value === 'undefined') {
      return this._cache;
    }

    this._cache = value;
    return this;
  }

  key() {
    return this._list.key() + '/' + this._index;
  }

  data(value, callback = () => {}) {
    if (typeof value === 'function') {
      callback = value;
    }

    if (!this._cache) {
      callback();
      return;
    }

    if (value === callback) {
      this._cache.get(this.key(), value);
      return;
    }

    this._cache.set(this.key(), value, (error) => {
      if (error) {
        callback(error);
        return;
      }

      callback();
    });
  }

  select() {
    if (!this._select) {
      this._select = new SelectRequest()
        .list(this._list)
        .page(this);
    }

    return this._select;
  }

  fetch(callback = () => {}) {
    if (!this._select) {
      return;
    }

    this.select().execute(callback, true);
  }

  change(action, diff, callback = () => {}) {
    if (diff === false) {
      this.destroy(true);
      callback();
      return;
    }

    if (!this._cache) {
      callback();
      return;
    }

    this._cache.get(this.key(), (error, cacheData) => {
      if (error) {
        callback(error);
        return;
      }

      const newData = applyDiff(cacheData, diff);
      this._cache.set(this.key(), newData, callback);
    });
  }
}
