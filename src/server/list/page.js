import odiff from 'odiff';
import SelectQuery from './query/select';

export default class ServerPage {
  constructor() {
    this._index = null;
    this._list = null;
    this._cache = null;
    this._select = null;
  }

  destroy(cache) {
    this._list.page(this._index, false);

    if (cache === true) {
      this._cache.delete(this.path());
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

  path() {
    return this._list.path() + '/' + this._index;
  }

  data(value, callback = () => {}) {
    if (typeof value === 'function') {
      this._cache.get(this.path(), value);
      return;
    }

    this._cache.set(this.path(), value, (error) => {
      if (error) {
        callback(error);
        return;
      }

      callback();
    });
  }

  select(value) {
    if (typeof value === 'undefined') {
      return this._select;
    }

    this._select = new SelectQuery()
      .list(this._list)
      .page(this)
      .query(value);

    return this;
  }

  change(callback) {
    this._cache.get(this.path(), (error, cacheData) => {
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
}
