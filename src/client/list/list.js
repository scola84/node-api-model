import EventEmitter from 'events';
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
    this._lifetime = null;
    this._interval = null;

    this._connection = null;
    this._validate = null;
    this._meta = null;
    this._select = null;

    this._subscribed = null;

    this._filter = '';
    this._order = '';
    this._count = 15;

    this._pages = new Map();

    this._handleOpen = () => this._open();
  }

  destroy(cache) {
    this._unbindConnection();

    this._pages.forEach((page) => {
      page.destroy(cache);
    });

    this._pages.clear();
    clearInterval(this._interval);

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

  lifetime(lifetime) {
    if (typeof lifetime === 'undefined') {
      return this._lifetime;
    }

    this._lifetime = lifetime;
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

  validate(validate) {
    if (typeof validate === 'undefined') {
      return this._validate;
    }

    this._validate = validate;
    return this;
  }

  filter(filter) {
    if (filter === true) {
      return parseFilter(this._filter);
    }

    if (typeof filter === 'undefined') {
      return this._filter;
    }

    this._filter = filter;
    return this;
  }

  order(order) {
    if (order === true) {
      return parseOrder(this._order);
    }

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

  key() {
    return '/' + this._name + '/' + this._id;
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

      callback(null, data);
    });
  }

  subscribe(subscribed) {
    this._subscribed = subscribed;

    this._connection.request({
      method: 'SUB',
      path: '/' + this._name,
      query: {
        filter: this._filter,
        order: this._order
      }
    }).end(subscribed);

    return this;
  }

  meta() {
    if (!this._meta) {
      this._meta = new MetaRequest()
        .list(this)
        .validate(this._validate);
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
        .cache(this._cache)
        .lifetime(this._lifetime)
        .validate(this._validate));
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
    this._connection.addListener('open', this._handleOpen);
  }

  _unbindConnection() {
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
    this._cache.get(this.key(), (error, cacheData) => {
      if (error) {
        callback(error);
        return;
      }

      cacheData = Object.assign({}, cacheData);
      cacheData = applyDiff(cacheData, diff.meta);

      this._cache.set(this.key(), cacheData, this._lifetime, (cacheError) => {
        if (cacheError) {
          callback(cacheError);
          return;
        }

        this.emit(action, diff, cacheData);
        this.emit('change', action, diff, cacheData);

        callback(null, diff, cacheData);
      });
    });
  }

  _keepalive() {
    this._cache.touch(this.key(), this._lifetime);
  }
}
