import sha1 from 'sha1';
import ServerListFactory from './list/factory';
import ServerObjectFactory from './object/factory';

export default class ServerModel {
  constructor() {
    this._name = null;
    this._cache = null;
    this._connection = null;

    this._list = null;
    this._object = null;

    this._lists = new Map();
    this._objects = new Map();
  }

  name(value) {
    this._name = value;
    return this;
  }

  cache(value) {
    this._cache = value;
    return this;
  }

  connection(value) {
    this._connection = value;
    return this;
  }

  subscribe(action) {
    this._connection.request()
      .method('SUB')
      .path('/' + this._name)
      .once('error', () => {})
      .end(action);

    return this;
  }

  lists() {
    return this._lists;
  }

  list(params, action) {
    if (typeof params === 'undefined') {
      this._list = new ServerListFactory()
        .name(this._name)
        .model(this)
        .cache(this._cache);
      return this._list;
    }

    params = Object.assign({
      filter: '',
      order: ''
    }, params);

    const id = params.id || sha1(params.filter + params.order);

    if (action === 'delete') {
      this._lists.delete(id);
      return this;
    }

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

      this._object = new ServerObjectFactory()
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
