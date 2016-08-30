import EventEmitter from 'events';
import series from 'async/series';
import eachOf from 'async/eachOf';
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
    this._unbindConnection();

    this._pages.forEach((page) => {
      page.destroy(cache);
    });

    this._pages.clear();

    if (cache === true) {
      this._cache.delete(this.key());
    }

    if (this._subscribed) {
      this.subscribe(false);
    }
  }

  id(id) {
    if (typeof id === 'undefined') {
      return this._id;
    }

    this._id = id;
    return this;
  }

  name(name) {
    if (typeof name === 'undefined') {
      return this._name;
    }

    this._name = name;
    return this;
  }

  model(model) {
    if (typeof model === 'undefined') {
      return this._model;
    }

    this._model = model;
    return this;
  }

  cache(cache) {
    if (typeof cache === 'undefined') {
      return this._cache;
    }

    this._cache = cache;
    return this;
  }

  connection(connection) {
    if (typeof connection === 'undefined') {
      return this._connection;
    }

    this._connection = connection;
    this._bindConnection();

    return this;
  }

  filter(filter) {
    if (typeof filter === 'undefined') {
      return this._filter;
    }

    this._filter = filter;
    return this;
  }

  order(order) {
    if (typeof order === 'undefined') {
      return this._order;
    }

    this._order = order;
    return this;
  }

  count(count) {
    if (typeof count === 'undefined') {
      return this._count;
    }

    this._count = count;
    return this;
  }

  translate(translate) {
    this._translate = translate;
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

      callback(null, data);
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

  change(action, diff, callback = () => {}) {
    const pages = [...this._pages.values()];
    const indices = [...this._pages.keys()];

    eachOf(pages, (page, index, eachCallback) => {
      if (diff.pages[indices[index]]) {
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

  _open() {
    this.meta().execute((error) => {
      if (error) {
        return;
      }

      if (this._subscribed) {
        this.subscribe(true);
      }
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
