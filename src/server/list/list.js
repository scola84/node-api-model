import eachOf from 'async/eachOf';
import odiff from 'odiff';
import ServerPage from './page';
import MetaQuery from './query/meta';
import parseFilter from '../../helper/parse-filter';
import parseOrder from '../../helper/parse-order';

export default class ServerList {
  constructor() {
    this._id = null;
    this._name = null;

    this._cache = null;

    this._validate = null;
    this._meta = null;
    this._select = null;

    this._filter = '';
    this._order = '';
    this._count = 15;

    this._pages = new Map();

    this._connections = new Set();
    this._handleClose = (e, c) => this.subscribe(c, false);
  }

  destroy(cache) {
    this._connections.forEach((connection) => {
      this._unbindConnection(connection);
    });

    this._pages.forEach((page) => {
      page.destroy(cache);
    });

    this._connections.clear();
    this._pages.clear();
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

  select(select) {
    if (typeof select === 'undefined') {
      return this._select;
    }

    this._select = select;
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

    this._cache.set(this.key(), data, (error) => {
      if (error) {
        callback(error);
        return;
      }

      callback(null, data);
    });
  }

  subscribe(connection, action) {
    if (action === true) {
      this._subscribe(connection);
    } else if (action === false) {
      this._unsubscribe(connection);
    }

    return this;
  }

  meta(meta) {
    if (typeof meta === 'undefined') {
      return this._meta;
    }

    this._meta = new MetaQuery()
      .list(this)
      .query(meta)
      .validate(this._validate);

    return this;
  }

  page(index, action) {
    index = Number(index);

    if (action === false) {
      this._pages.delete(index);
      return this;
    }

    if (!this._pages.has(index)) {
      this._pages.set(index, new ServerPage()
        .index(index)
        .list(this)
        .cache(this._cache)
        .validate(this._validate)
        .select(this._select));
    }

    return this._pages.get(index);
  }

  change(action, diff, id, callback = () => {}) {
    const pageDiffs = {};
    const pages = [...this._pages.values()];
    const indices = [...this._pages.keys()];

    eachOf(pages, (page, index, eachCallback) => {
      this._handleChange(pageDiffs, page, indices[index], eachCallback);
    }, (error) => {
      if (error) {
        callback(error);
        return;
      }

      diff = {
        id,
        pages: pageDiffs
      };

      this._changeMeta(action, diff, callback);
    });
  }

  _changeMeta(action, diff, callback) {
    this.meta().execute((error, cacheData) => {
      if (error) {
        callback(error);
        return;
      }

      this.meta().execute((metaError, data) => {
        if (metaError) {
          callback(metaError);
          return;
        }

        diff.meta = odiff(cacheData, data);

        this.notifyClients(action, diff);
        callback(null, diff);
      }, true);
    });
  }

  notifyClients(action, diff) {
    this._connections.forEach((connection) => {
      connection.request({
        method: 'PUB',
        path: '/' + this._name,
        query: {
          id: this._id
        }
      }).end({
        action,
        diff
      });
    });
  }

  _bindConnection(connection) {
    connection.once('close', this._handleClose);
  }

  _unbindConnection(connection) {
    connection.removeListener('close', this._handleClose);
  }

  _subscribe(connection) {
    this._connections.add(connection);
    this._bindConnection(connection);
  }

  _unsubscribe(connection) {
    this._connections.delete(connection);
    this._unbindConnection(connection);

    if (this._connections.size === 0) {
      this.destroy(false);
    }
  }

  _handleChange(pageDiffs, page, index, callback) {
    page.change((error, pageDiff, data) => {
      if (error) {
        callback(error);
        return;
      }

      index = Number(index);

      if (data.length === 0) {
        pageDiffs[index] = false;
      } else if (pageDiff.length > 0) {
        pageDiffs[index] = pageDiff;
      }

      callback();
    });
  }
}
