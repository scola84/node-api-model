import ServerListModel from './list-model';
import ServerObjectModel from './object-model';

export default class ServerModel {
  constructor() {
    this._name = null;
    this._connection = null;

    this._lists = new Map();
    this._objects = new Map();
  }

  name(name) {
    if (typeof name === 'undefined') {
      return this._name;
    }

    this._name = name;
    return this;
  }

  connection(connection) {
    if (typeof connection === 'undefined') {
      return this._connection;
    }

    this._connection = connection;
    return this;
  }

  subscribe(action) {
    this._connection.request({
      method: 'SUB',
      path: '/' + this._name
    }).end(action);
  }

  lists() {
    return this._lists;
  }

  list(params) {
    if (typeof params === 'undefined') {
      this._list = new ServerListModel()
        .model(this);
      return this._list;
    }

    params = Object.assign({
      filter: '',
      order: ''
    }, params);

    const id = params.id || params.filter + params.order;

    if (!this._lists.has(id)) {
      this._lists.set(id, this._list.create(id, params));
    }

    return this._lists.get(id);
  }

  object(params, action) {
    if (typeof params === 'undefined') {
      this._object = new ServerObjectModel()
        .model(this);
      return this._object;
    }

    if (action === false) {
      this._objects.delete(params.id);
      return this;
    }

    if (!this._objects.has(params.id)) {
      this._objects.set(params.id, this._object.create(params.id));
    }

    return this._objects.get(params.id);
  }
}
