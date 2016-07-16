import EventEmitter from 'events';

export default class ClientPage extends EventEmitter {
  constructor() {
    super();

    this._model = null;
    this._index = null;
    this._data = null;
  }

  model(model) {
    this._model = model;
    return this;
  }

  index(index) {
    this._index = index;
    return this;
  }

  data(data) {
    if (typeof data === 'function') {
      return this._load(data);
    }

    this._data = data;
    this.emit('data', this._data);

    return this;
  }

  _load(callback) {
    if (this._data) {
      callback(this._data);
      return;
    }

    this._model.connection().request({
      path: '/' + this._model.name(),
      query: {
        filter: this._model.filter(),
        order: this._model.order(),
        register: this._model.register() ? 'page' : null,
        page: this._index
      }
    }, (response) => {
      response.on('data', (data) => {
        this._data = data;
        callback(data);
      });
    }).end();
  }
}
