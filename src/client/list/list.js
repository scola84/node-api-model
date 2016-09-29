import series from 'async/series';
import eachOf from 'async/eachOf';
import { EventEmitter } from 'events';
import MetaRequest from './request/meta';
import ClientPage from './page';
import applyDiff from '../../helper/apply-diff';
import parseFilter from '../../helper/parse-filter';
import parseOrder from '../../helper/parse-order';

export default class ClientList extends EventEmitter {
  constructor() {
    super();

    this._id = null;
    this._name = null;
    this._model = null;

    this._cache = null;
    this._connection = null;

    this._translate = null;
    this._validateFilter = null;
    this._validateOrder = null;

    this._meta = null;
    this._select = null;

    this._subscribed = null;

    this._filter = '';
    this._order = '';
    this._count = 15;

    this._query = null;
    this._pages = new Map();

    this._handleOpen = () => this._open();
  }

  destroy(cache) {
    this._model.list({
      id: this._id
    }, 'delete');

    this._unbindConnection();

    this._pages.forEach((page) => {
      page.destroy(cache);
    });

    this._pages.clear();

    if (cache === true && this._cache) {
      this._cache.delete(this.key());
    }

    if (this._subscribed === true) {
      this.subscribe(false);
    }
  }

  id(value) {
    if (typeof value === 'undefined') {
      return this._id;
    }

    this._id = value;
    return this;
  }

  name(value) {
    if (typeof value === 'undefined') {
      return this._name;
    }

    this._name = value;
    return this;
  }

  model(value) {
    if (typeof value === 'undefined') {
      return this._model;
    }

    this._model = value;
    return this;
  }

  cache(value) {
    if (typeof value === 'undefined') {
      return this._cache;
    }

    this._cache = value;
    return this;
  }

  connection(value) {
    if (typeof value === 'undefined') {
      return this._connection;
    }

    this._connection = value;
    this._bindConnection();

    return this;
  }

  filter(value) {
    if (typeof value === 'undefined') {
      return this._filter;
    }

    this._filter = value;
    return this;
  }

  order(value) {
    if (typeof value === 'undefined') {
      return this._order;
    }

    this._order = value;
    return this;
  }

  count(value) {
    if (typeof value === 'undefined') {
      return this._count;
    }

    this._count = value;
    return this;
  }

  translate(value) {
    this._translate = value;
    return this;
  }

  validate(filter, order) {
    this._validateFilter = filter;
    this._validateOrder = order;

    return this;
  }

  query(callback) {
    if (this._query) {
      callback(null, this._query.filter, this._query.order);
      return;
    }

    const filter = parseFilter(this._filter);
    const order = parseOrder(this._order);

    series([
      (asyncCallback) => this._validateFilter(filter, asyncCallback),
      (asyncCallback) => this._validateOrder(order, asyncCallback)
    ], (error) => {
      if (error) {
        callback(error);
        return;
      }

      this._query = {
        filter: this._filter,
        order: this._order
      };

      callback(null, this._query.filter, this._query.order);
    });
  }

  path() {
    return '/' + this._name;
  }

  key() {
    return this.path() + '/' + this._id;
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

      callback(null, value);
    });
  }

  subscribe(subscribed) {
    this._subscribed = subscribed;

    this._connection.request()
      .method('SUB')
      .path(this.path())
      .query({
        filter: this.filter(),
        order: this.order()
      })
      .once('error', () => {})
      .end(subscribed);

    return this;
  }

  meta() {
    if (!this._meta) {
      this._meta = new MetaRequest()
        .list(this);
    }

    return this._meta;
  }

  page(index, action) {
    index = Number(index);

    if (action === false) {
      this._pages.delete(index);
      return this;
    }

    if (!this._pages.has(index)) {
      this._pages.set(index, new ClientPage()
        .index(index)
        .list(this)
        .cache(this._cache));
    }

    return this._pages.get(index);
  }

  fetch(callback = () => {}) {
    this.meta().execute((error) => {
      if (error) {
        callback(error);
        return;
      }

      const pages = Array.from(this._pages.values());

      eachOf(pages, (page, index, eachCallback) => {
        page.fetch(eachCallback);
      }, callback);
    }, true);

    return this;
  }

  change(action, diff, callback = () => {}) {
    if (!this._cache) {
      callback();
      return;
    }

    const pages = Array.from(this._pages.values());
    const indices = Array.from(this._pages.keys());

    eachOf(pages, (page, index, eachCallback) => {
      if (typeof diff.pages[indices[index]] !== 'undefined') {
        page.change(action, diff.pages[indices[index]], eachCallback);
      } else {
        eachCallback();
      }
    }, (error) => {
      if (error) {
        callback(error);
        return;
      }

      this._changeMeta(action, diff, callback);
    });
  }

  _bindConnection() {
    this._connection.setMaxListeners(this._connection.getMaxListeners() + 1);
    this._connection.addListener('open', this._handleOpen);
  }

  _unbindConnection() {
    this._connection.setMaxListeners(this._connection.getMaxListeners() - 1);
    this._connection.removeListener('open', this._handleOpen);
  }

  _open(event) {
    this.meta().execute((error) => {
      if (error) {
        return;
      }

      if (this._subscribed) {
        this.subscribe(true);
      }

      this.emit('open', event);
    }, true);
  }

  _changeMeta(action, diff, callback) {
    this._cache.get(this.key(), (error, data) => {
      if (error) {
        callback(error);
        return;
      }

      data = Object.assign({}, data);
      data = applyDiff(data, diff.meta);

      this._cache.set(this.key(), data, (cacheError) => {
        if (cacheError) {
          callback(cacheError);
          return;
        }

        this.emit('change', {
          action,
          data,
          diff
        });

        callback(null, diff, data);
      });
    });
  }
}
