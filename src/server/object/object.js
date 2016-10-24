import SelectQuery from './query/select';
import InsertQuery from './query/insert';
import UpdateQuery from './query/update';
import DeleteQuery from './query/delete';
import applyDiff from '../../helper/apply-diff';

export default class ServerObject {
  constructor() {
    this._id = null;
    this._name = null;
    this._model = null;

    this._cache = null;
    this._connection = null;

    this._select = null;
    this._insert = null;
    this._update = null;
    this._delete = null;

    this._connections = new Set();
    this._handleClose = (e) => this.subscribe(e.connection, false);
  }

  destroy(cache) {
    this._model.object({
      id: this._id
    }, 'delete');

    this._connections.forEach((connection) => {
      this._unbindConnection(connection);
    });

    this._connections.clear();

    if (cache === true && this._cache) {
      this._cache.delete(this.path());
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

  select(query) {
    if (typeof query === 'undefined') {
      return this._select;
    }

    if (typeof query === 'function') {
      this._select = new SelectQuery()
        .object(this)
        .query(query);
    }

    return this;
  }

  insert(query) {
    if (typeof query === 'undefined') {
      return this._insert;
    }

    if (typeof query === 'function') {
      this._insert = new InsertQuery()
        .object(this)
        .query(query);
    }

    return this;
  }

  update(query) {
    if (typeof query === 'undefined') {
      return this._update;
    }

    if (typeof query === 'function') {
      this._update = new UpdateQuery()
        .object(this)
        .query(query);
    }

    return this;
  }

  delete(query) {
    if (typeof query === 'undefined') {
      return this._delete;
    }

    if (typeof query === 'function') {
      this._delete = new DeleteQuery()
        .object(this)
        .query(query);
    }

    return this;
  }

  change(action, diff, callback = () => {}) {
    if (action === 'update') {
      this._changeUpdate(diff, callback);
    }

    if (action === 'delete') {
      this._changeDelete(callback);
    }

    return this;
  }

  notifyClients(action, diff) {
    this._connections.forEach((connection) => {
      connection.request()
        .method('PUB')
        .path(this.path())
        .once('error', () => {})
        .end({
          action,
          diff
        });
    });

    return this;
  }

  notifyPeers(action, diff) {
    if (!this._connection) {
      return this;
    }

    this._connection.request()
      .method('PUB')
      .path(this.path())
      .once('error', () => {})
      .end({
        action,
        diff
      });

    return this;
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

  _changeUpdate(diff, callback) {
    if (!this._cache) {
      callback();
      return;
    }

    this._cache.get(this.path(), (error, cacheData) => {
      if (error) {
        callback(error);
        return;
      }

      cacheData = Object.assign({}, cacheData);
      cacheData = applyDiff(cacheData, diff);

      this._cache.set(this.path(), cacheData, (cacheError) => {
        if (cacheError) {
          callback(cacheError);
          return;
        }

        callback(null, cacheData);
        this.notifyClients('update', diff);
      });
    });
  }

  _changeDelete(callback) {
    this.notifyClients('delete');
    this.destroy(true);
    callback();
  }
}
