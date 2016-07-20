import ClientList from './list';

export default class ClientListModel {
  constructor() {
    this._name = null;
    this._model = null;
    this._connection = null;
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

  create(id, params) {
    return new ClientList()
      .id(id)
      .name(this._name)
      .model(this._model)
      .connection(this._connection)
      .filter(params.filter)
      .order(params.order);
  }
}
