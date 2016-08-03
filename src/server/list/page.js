import odiff from 'odiff';
import SelectQuery from './query/select';

export default class ServerPage {
  constructor() {
    this._index = null;
    this._list = null;
    this._cache = null;

    this._validate = null;
    this._select = null;
  }

  destroy(cache) {
    this._list.page(this._index, false);

    if (cache === true) {
      this._cache.delete(this.path());
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

  cache(cache) {
    if (typeof cache === 'undefined') {
      return this._cache;
    }

    this._cache = cache;
    return this;
  }

  validate(validate) {
    if (typeof validate === 'undefined') {
      return this._validate;
    }

    this._validate = validate;
    return this;
  }

  path() {
    return this._list.path() + '/' + this._index;
  }

  data(data, callback = () => {}) {
    if (typeof data === 'function') {
      this._cache.get(this.path(), data);
      return;
    }

    this._cache.set(this.path(), data, (error) => {
      if (error) {
        callback(error);
        return;
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
