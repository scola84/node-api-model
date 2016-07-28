import ClientObject from './object';

export default class ClientObjectModel {
  constructor() {
    this._name = null;
    this._model = null;
    this._connection = null;

    this._validate = (d, c) => c();
  }

  name(name) {
    this._name = name;
    return this;
  }

  model(model) {
    this._model = model;
    return this;
  }

  connection(connection) {
    this._connection = connection;
    return this;
  }

  validate(validate) {
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
