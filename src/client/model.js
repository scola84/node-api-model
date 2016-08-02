import sha1 from 'sha1';
import ClientListModel from './list/model';
import ClientObjectModel from './object/model';

export default class ClientModel {
  constructor() {
    this._name = null;
    this._cache = null;
    this._connection = null;

    this._lists = new Map();
    this._objects = new Map();
  }

  name(name) {
    this._name = name;
    return this;
  }

  cache(cache) {
    this._cache = cache;
    return this;
  }

  connection(connection) {
    this._connection = connection;
    return this;
  }

  list(params) {
    if (typeof params === 'undefined') {
      this._list = new ClientListModel()
        .name(this._name)
        .model(this)
        .cache(this._cache)
        .connection(this._connection);
      return this._list;
    }

    params = Object.assign({
      filter: '',
      order: ''
    }, params);

    const id = params.id || sha1(params.filter + params.order);

    if (!this._lists.has(id)) {
      this._lists.set(id, this._list.create(id, params));
    }

    return this._lists.get(id);
  }

  object(params, action) {
    if (typeof params === 'undefined') {
      if (this._object) {
        return this._object.create(null);
      }

      this._object = new ClientObjectModel()
        .name(this._name)
        .model(this)
        .cache(this._cache)
        .connection(this._connection);

      return this._object;
    }

    const id = String(params.id);

    if (action === 'insert') {
      this._objects.set(id, params.object);
      return this;
    }

    if (action === 'delete') {
      this._objects.delete(id);
      return this;
    }

    if (!this._objects.has(id)) {
      this._objects.set(id, this._object.create(id));
    }

    return this._objects.get(id);
  }
}
