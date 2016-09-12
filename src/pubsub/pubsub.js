export default class PubSub {
  constructor() {
    this._connections = {};
  }

  subscribe(name, connection, action) {
    this._connections[name] = this._connections[name] || new Set();

    if (action === true) {
      this._connections[name].add(connection);

      connection.once('close', () => {
        this.subscribe(name, connection, false);
      });
    } else if (action === false) {
      this._connection[name].delete(connection);
    }

    return this;
  }

  publish(name, connection, path, data) {
    this._connections[name] = this._connections[name] || new Set();

    if (!this._connections[name].has(connection)) {
      return this;
    }

    this._connections[name].forEach((target) => {
      target.request()
        .method('PUB')
        .path(path)
        .once('error', () => {})
        .end(data);
    });

    return this;
  }
}
