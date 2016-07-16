export default class ServerPage {
  constructor() {
    this._model = null;
    this._index = null;
    this._data = null;
    this._connections = new Set();
  }

  model(model) {
    this._model = model;
    return this;
  }

  index(index) {
    this._index = index;
    return this;
  }

  data(callback) {
    if (this._data === null) {
      this._load(callback);
    } else {
      callback(null, this._data);
    }
  }

  register(connection, action) {
    if (action === true) {
      this._connections.add(connection);
    } else if (action === false) {
      this._connections.delete(connection);
    }
  }

  _load(callback) {
    const parameters = {
      filter: this._model.filter(true),
      order: this._model.order(true),
      limit: {
        offset: this._index * this._model.size(),
        limit: this._model.size()
      }
    };

    this._model.items(parameters, (error, result) => {
      console.log(error, result);
      
      if (error) {
        callback(error);
        return;
      }

      this._data = result;
      callback(null, result);
    });
  }
}
