import ServerFactory from './server-factory';

export default class ClientFactory extends ServerFactory {
  constructor(connection) {
    super();
    this._connection = connection;
  }

  _createList(name, query) {
    return super._createList(name, query)
      .connection(this._connection);
  }
}
