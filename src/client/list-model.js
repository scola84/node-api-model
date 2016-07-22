import ClientList from './list';

export default class ClientListModel {
  constructor() {
    this._name = null;
    this._model = null;
    this._connection = null;
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
