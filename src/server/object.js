import odiff from 'odiff';
import apply from '../helper/apply';

export default class ServerObject {
  constructor() {
    this._model = null;
    this._id = null;

    this._select = null;
    this._insert = null;
    this._update = null;
    this._delete = null;

    this._data = null;
    this._copy = null;

    this._connections = new Map();
  }

  model(model) {
    if (typeof model === 'undefined') {
      return this._model;
    }

    this._model = model;
    return this;
  }

  id(id) {
    if (typeof id === 'undefined') {
      return this._id;
    }

    this._id = id;
    return this;
  }

  get(name, callback) {
    if (typeof callback === 'undefined') {
      return this._data && this._data[name];
    }

    return this.select((data) => {
      callback(data[name]);
    });
  }

  set(name, value) {
    this._data = this._data || {};
    this._data[name] = value;

    return this;
  }

  subscribe(connection, action) {
    if (action === true) {
      this._connections.add(connection);
    } else if (action === false) {
      this._connections.delete(connection);
    }

    return this;
  }

  select(callback) {
    if (!this._select) {
      this._select = callback;
      return this;
    }

    if (this._data !== null) {
      callback(null, this._data);
      return this;
    }

    this._select(this._id, (error, data) => {
      if (error) {
        callback(error);
        return;
      }

      this._data = Object.assign({}, data);
      this._copy = Object.assign({}, data);

      callback(null, data);
    });

    return this;
  }

  insert(callback) {
    if (!this._insert) {
      this._insert = callback;
      return this;
    }

    this._insert(this._data, callback);
    return this;
  }

  update(callback) {
    if (!this._update) {
      this._update = callback;
      return this;
    }

    this._update(this._id, this._data, (error, result) => {
      if (error) {
        callback(error);
        return;
      }

      callback(null, odiff(this._copy, this._data), result);
      this._copy = Object.assign({}, this._data);
    });

    return this;
  }

  delete(callback) {
    if (!this._delete) {
      this._delete = callback;
      return this;
    }

    this._delete(this._id, callback);
    return this;
  }

  change(action, diff) {
    if (action === 'update') {
      this._data = apply(this._data, diff);
      this._copy = Object.assign({}, this._data);
    }

    if (action === 'delete') {
      this._model.object({
        id: this._id
      }, false);
    }

    this._notify(action, diff);
    return this;
  }

  _notify(action, diff) {
    this._connections.forEach((connection) => {
      connection.request({
        method: 'PUB',
        path: '/' + this._model.name() + '/' + this._id
      }).end({
        action,
        diff
      });
    });
  }
}
