import eachOf from 'async/eachOf';
import odiff from 'odiff';
import ServerPage from './page';
import MetaQuery from './query/meta';

export default class ServerList {
  constructor() {
    this._id = null;
    this._name = null;
    this._model = null;
    this._cache = null;

    this._meta = null;
    this._select = null;

    this._filter = '';
    this._order = '';
    this._count = 15;

    this._query = null;
    this._pages = new Map();

    this._connections = new Set();
    this._handleClose = (e) => this.subscribe(e.connection, false);
  }

  destroy(cache) {
    this._model.list({
      id: this._id
    }, 'delete');

    this._connections.forEach((connection) => {
      this._unbindConnection(connection);
    });

    this._pages.forEach((page) => {
      page.destroy(cache);
    });

    this._connections.clear();
    this._pages.clear();
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

  select(value) {
    if (typeof value === 'undefined') {
      return this._select;
    }

    this._select = value;
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

  path() {
    return '/' + this._name + '/' + this._id;
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
      this._cache.get(this.path(), callback);
      return;
    }

    this._cache.set(this.path(), value, (error) => {
      if (error) {
        callback(error);
        return;
      }

      callback(null, value);
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

  meta(value) {
    if (typeof value === 'undefined') {
      return this._meta;
    }

    this._meta = new MetaQuery()
      .list(this)
      .query(value);

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
        .select(this._select));
    }

    return this._pages.get(index);
  }

  change(action, diff, id, callback = () => {}) {
    if (!this._cache) {
      callback();
      return;
    }

    const pageDiffs = {};
    const pages = Array.from(this._pages.values());
    const indices = Array.from(this._pages.keys());

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

  notifyClients(action, diff) {
    this._connections.forEach((connection) => {
      connection.request()
        .method('PUB')
        .path('/' + this._name)
        .query({
          id: this._id
        })
        .once('error', () => {})
        .end({
          action,
          diff
        });
    });
  }

  _bindConnection(connection) {
    connection.setMaxListeners(connection.getMaxListeners() + 1);
    connection.once('close', this._handleClose);
  }

  _unbindConnection(connection) {
    connection.setMaxListeners(connection.getMaxListeners() - 1);
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

  _changeMeta(action, diff, callback) {
    this.meta().execute(null, (error, cacheData) => {
      if (error) {
        callback(error);
        return;
      }

      this.meta().execute(null, (metaError, data) => {
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
}
