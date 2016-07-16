import ServerFactory from './server-factory';

export default class ClientFactory extends ServerFactory {
  constructor(connection) {
    super();
    this._connection = connection;
  }

  _create(name, query) {
    return super._create(name, query)
      .connection(this._connection);
  }
}
