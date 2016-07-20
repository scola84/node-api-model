import EventEmitter from 'events';
import apply from '../helper/apply';

export default class ClientObject extends EventEmitter {
  constructor() {
    super();

    this._id = null;
    this._name = null;
    this._model = null;
    this._connection = null;
    this._validate = null;
    this._data = null;
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

  validate(validate) {
    if (typeof validate === 'undefined') {
      return this._validate;
    }

    this._validate = validate;
    return this;
  }

  get(name, callback = null) {
    if (callback === null) {
      return this._data && this._data[name];
    }

    return this.select((data) => {
      callback(null, data[name]);
    });
  }

  set(name, value) {
    this._data = this._data || {};
    this._data[name] = value;

    return this;
  }

  subscribe(action) {
    this._connection.request({
      method: 'SUB',
      path: '/' + this._name + '/' + this._id
    }).end(action);

    return this;
  }

  select(callback) {
    if (this._data !== null) {
      callback(null, this._data);
      return;
    }

    this._connection.request({
      path: '/' + this._name + '/' + this._id
    }, (response) => {
      response.on('data', (data) => {
        if (response.statusCode === 200) {
          this._data = data;
          callback(null, data);
          return;
        }

        response.on('data', () => {
          callback(new Error(response.statusCode));
        });
      });
    }).end();
  }

  insert(callback) {
    this._connection.request({
      method: 'POST',
      path: '/' + this._name
    }, (response) => {
      if (response.statusCode === 201) {
        callback();
        return;
      }

      response.on('data', () => {
        callback(new Error(response.statusCode));
      });
    }).end(this._data);
  }

  update(callback) {
    this._connection.request({
      method: 'PUT',
      path: '/' + this._name + '/' + this._id
    }, (response) => {
      if (response.statusCode === 200) {
        callback();
        return;
      }

      response.on('data', () => {
        callback(new Error(response.statusCode));
      });
    }).end(this._data);
  }

  delete(callback) {
    this._connection.request({
      method: 'DELETE',
      path: '/' + this._name + '/' + this._id
    }, (response) => {
      if (response.statusCode === 200) {
        callback();
        return;
      }

      response.on('data', () => {
        callback(new Error(response.statusCode));
      });
    }).end();
  }

  change(action, diff) {
    if (action === 'update') {
      this._data = apply(this._data, diff);
    }

    if (action === 'delete') {
      this._model.object({
        id: this._id
      }, false);
    }

    this.emit('change', action);
  }
}
