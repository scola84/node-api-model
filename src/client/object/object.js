import EventEmitter from 'events';
import odiff from 'odiff';
import applyDiff from '../../helper/apply-diff';

export default class ClientObject extends EventEmitter {
  constructor() {
    super();

    this._id = null;
    this._name = null;
    this._model = null;
    this._connection = null;
    this._validate = null;

    this._subscribed = null;
    this._data = null;

    this._handleOpen = () => this._open();
  }

  destroy() {
    this._unbindConnection();

    if (this._subscribed) {
      this.subscribe(false);
    }

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

  subscribe(subscribed) {
    this._subscribed = subscribed;

    this._connection.request({
      method: 'SUB',
      path: '/' + this._name + '/' + this._id
    }).end(subscribed);

    return this;
  }

  select(callback) {
    if (this._data) {
      if (callback) {
        return callback(null, this._data);
      }

      return this._data;
    }

    const request = {
      path: '/' + this._name + '/' + this._id
    };

    this._connection
      .request(request, (response) => this._select(response, callback))
      .end();

    return this;
  }

  insert(data, callback) {
    this._validate(data, (error) => {
      if (error) {
        if (callback) {
          callback(error);
        }

        return;
      }

      const request = {
        method: 'POST',
        path: '/' + this._name
      };

      this._connection
        .request(request, (response) => this._insert(response, callback))
        .end(data);
    }, 'insert');
  }

  update(data, callback) {
    const changed = Object.assign({}, this._data, data);
    const diff = odiff(changed, this._data);

    if (diff.length === 0) {
      if (callback) {
        callback();
      }

      return;
    }

    this._validate(changed, (error) => {
      if (error) {
        if (callback) {
          callback(error);
        }

        return;
      }

      const request = {
        method: 'PUT',
        path: '/' + this._name + '/' + this._id
      };

      this._connection
        .request(request, (response) => this._update(response, callback))
        .end(changed);
    }, 'update');
  }

  delete(callback) {
    const request = {
      method: 'DELETE',
      path: '/' + this._name + '/' + this._id
    };

    this._connection
      .request(request, (response) => this._delete(response, callback))
      .end();
  }

  change(action, diff) {
    this.emit('change', action, diff);

    if (action === 'update') {
      this._data = applyDiff(Object.assign({}, this._data), diff);
    }

    if (action === 'delete') {
      this._subscribed = false;
      this.destroy();
    }
  }

  _bindConnection() {
    this._connection.addListener('open', this._handleOpen);
  }

  _unbindConnection() {
    this._connection.removeListener('open', this._handleOpen);
  }

  _open() {
    if (this._subscribed) {
      this.subscribe(true);
    }

    if (this._data) {
      this._data = null;
      this.select();
    }
  }

  _select(response, callback) {
    response.once('data', (data) => {
      const error = response.statusCode === 200 ?
        null : new Error(data);

      if (response.statusCode === 200) {
        this._data = data;
      }

      if (callback) {
        callback(error, this._data, this);
      }
    });
  }

  _insert(response, callback) {
    response.once('data', (data) => {
      const error = response.statusCode === 201 ?
        null : new Error(data);

      if (response.statusCode === 201) {
        this._id = response.headers.id;
        this._data = data;

        this._model.object({
          id: this._id,
          object: this
        }, 'insert');
      }

      if (callback) {
        callback(error, this._data, this);
      }
    });
  }

  _update(response, callback) {
    response.once('data', (data) => {
      const error = response.statusCode === 200 ?
        null : new Error(data);

      if (response.statusCode === 200) {
        this._data = data;
      }

      if (callback) {
        callback(error, this._data, this);
      }
    });
  }

  _delete(response, callback) {
    response.once('data', (data) => {
      const error = response.statusCode === 200 ?
        null : new Error(data);

      if (callback) {
        callback(error, this._data, this);
      }
    });
  }
}
