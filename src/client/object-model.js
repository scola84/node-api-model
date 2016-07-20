import ClientObject from './object';

export default class ClientObjectModel {
  constructor() {
    this._name = null;
    this._model = null;
    this._connection = null;
    this._validate = null;
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

  create(id) {
    return new ClientObject()
      .id(id)
      .name(this._name)
      .model(this._model)
      .connection(this._connection)
      .validate(this._validate);
  }
}
