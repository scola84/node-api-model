import odiff from 'odiff';
import apply from '../helper/apply';

export default class ServerObject {
  constructor() {
    this._id = null;
    this._name = null;
    this._model = null;
    this._connection = null;
    this._authorize = null;
    this._validate = null;

    this._select = null;
    this._insert = null;
    this._update = null;
    this._delete = null;

    this._data = null;
    this._copy = null;

    this._connections = new Set();
    this._handleClose = (e, c) => this.subscribe(c, false);
  }

  destroy() {
    this._connections
      .forEach((connection) => this._unbindConnection(connection));
    this._connections.clear();

    this._model.object({
      id: this._id
    }, 'delete');
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

  connection(connection) {
    if (typeof connection === 'undefined') {
      return this._connection;
    }

    this._connection = connection;
    return this;
  }

  authorize(authorize) {
    if (typeof authorize === 'undefined') {
      return this._authorize;
    }

    this._authorize = authorize;
    return this;
  }

  validate(validate) {
    if (typeof validate === 'undefined') {
      return this._validate;
    }

    this._validate = validate;
    return this;
  }

  get(name, callback) {
    if (typeof callback === 'undefined') {
      return this._data && this._data[name];
    }

    return this.select((data) => {
      callback(data && data[name]);
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
      this._bindConnection(connection);
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

    if (this._data) {
      if (callback) {
        callback(null, this._data);
      }

      return this;
    }

    this._select(this._id, (error, data) => {
      if (!error) {
        this._data = Object.assign({}, data);
        this._copy = Object.assign({}, data);
      }

      callback(error, data);
    });

    return this;
  }

  insert(callback) {
    if (!this._insert) {
      this._insert = callback;
      return this;
    }

    this._insert(this._data, (error, id) => {
      if (!error) {
        this._id = id;

        this._model.object({
          id,
          object: this
        }, 'insert');

        if (this._connection) {
          this._notifyPeers('insert');
        }
      }

      if (callback) {
        callback(error, this._data, id);
      }
    });

    return this;
  }

  update(callback) {
    if (!this._update) {
      this._update = callback;
      return this;
    }

    if (!this._copy) {
      return callback(new Error('Object not loaded'));
    }

    this._update(this._id, this._data, (error) => {
      let diff = null;

      if (!error) {
        diff = odiff(this._copy, this._data);
        this._copy = Object.assign({}, this._data);

        if (this._connection) {
          this._notifyPeers('update', diff);
        }
      }

      if (callback) {
        callback(error, this._data);
      }
    });

    return this;
  }

  delete(callback) {
    if (!this._delete) {
      this._delete = callback;
      return this;
    }

    this._delete(this._id, (error) => {
      if (!error && this._connection) {
        this._notifyPeers('delete');
      }

      if (callback) {
        callback(error);
      }
    });

    return this;
  }

  change(action, diff) {
    if (action === 'update') {
      this._data = apply(Object.assign({}, this._data), diff);
      this._copy = Object.assign({}, this._data);
    }

    if (action === 'delete') {
      this.destroy();
    }

    this._notifyClients(action, diff);
    return this;
  }

  _bindConnection(connection) {
    connection.once('close', this._handleClose);
  }

  _unbindConnection(connection) {
    connection.removeListener('close', this._handleClose);
  }

  _notifyClients(action, diff) {
    this._connections.forEach((connection) => {
      connection.request({
        method: 'PUB',
        path: '/' + this._name + '/' + this._id
      }).end({
        action,
        diff
      });
    });
  }

  _notifyPeers(action, diff) {
    this._connection.request({
      method: 'PUB',
      path: '/' + this._name + '/' + this._id
    }).end({
      action,
      diff
    });
  }
}
