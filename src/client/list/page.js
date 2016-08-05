import applyDiff from '../../helper/apply-diff';
import SelectRequest from './request/select';

export default class ClientPage {
  constructor() {
    this._index = null;
    this._list = null;
    this._cache = null;
    this._select = null;

    this._handleOpen = () => this._open();
  }

  destroy(cache) {
    this._unbindConnection();

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
    this._bindConnection();

    return this;
  }

  cache(cache) {
    if (typeof cache === 'undefined') {
      return this._cache;
    }

    this._cache = cache;
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

    this._cache.set(this.key(), data, (error) => {
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

  change(action, diff, callback = () => {}) {
    if (diff === false) {
      this.destroy(true);
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

  _bindConnection() {
    this._list.connection()
      .setMaxListeners(this._list.connection().getMaxListeners() + 1);
    this._list.connection().addListener('open', this._handleOpen);
  }

  _unbindConnection() {
    this._list.connection()
      .setMaxListeners(this._list.connection().getMaxListeners() - 1);
    this._list.connection().removeListener('open', this._handleOpen);
  }

  _open() {
    this.select().execute(() => {}, true);
  }
}
