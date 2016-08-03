import EventEmitter from 'events';
import SelectRequest from './request/select';
import InsertRequest from './request/insert';
import UpdateRequest from './request/update';
import DeleteRequest from './request/delete';
import applyDiff from '../../helper/apply-diff';

export default class ClientObject extends EventEmitter {
  constructor() {
    super();

    this._id = null;
    this._name = null;
    this._model = null;

    this._cache = null;
    this._lifetime = null;
    this._interval = null;

    this._connection = null;
    this._validate = null;

    this._select = null;
    this._insert = null;
    this._update = null;
    this._delete = null;

    this._subscribed = null;

    this._handleOpen = () => this._open();
  }

  destroy(cache) {
    this._unbindConnection();
    clearInterval(this._interval);

    if (this._subscribed) {
      this.subscribe(false);
    }

    this._model.object({
      id: this._id
    }, 'delete');

    if (cache === true) {
      this._cache.delete(this.key());
    }
  }

  id(id) {
    if (typeof id === 'undefined') {
      return this._id;
    }

    this._id = id;
    return this;
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

  cache(cache) {
    if (typeof cache === 'undefined') {
      return this._cache;
    }

    this._cache = cache;
    return this;
  }

  lifetime(lifetime) {
    if (typeof lifetime === 'undefined') {
      return this._lifetime;
    }

    this._lifetime = lifetime;
    return this;
  }

  connection(connection) {
    if (typeof connection === 'undefined') {
      return this._connection;
    }

    this._connection = connection;
    this._bindConnection();

    return this;
  }

  validate(validate) {
    if (typeof validate === 'undefined') {
      return this._validate;
    }

    this._validate = validate;
    return this;
  }

  key() {
    return '/' + this._name + '/' + this._id;
  }

  data(data, callback = () => {}) {
    if (typeof data === 'function') {
      this._cache.get(this.key(), data);
      return;
    }

    this._cache.set(this.key(), data, this._lifetime, (error) => {
      if (error) {
        callback(error);
        return;
      }

      if (this._lifetime) {
        this._interval = setInterval(this._keepalive.bind(this),
          this._lifetime * 0.9);
      }

      callback(null, data);
    });
  }

  subscribe(subscribed) {
    this._subscribed = subscribed;

    this._connection.request({
      method: 'SUB',
      path: this.key()
    }).end(subscribed);

    return this;
  }

  select() {
    if (!this._select) {
      this._select = new SelectRequest()
        .object(this);
    }

    return this._select;
  }

  insert() {
    if (!this._insert) {
      this._insert = new InsertRequest()
        .object(this)
        .validate(this._validate);
    }

    return this._insert;
  }

  update() {
    if (!this._update) {
      this._update = new UpdateRequest()
        .object(this)
        .validate(this._validate);
    }

    return this._update;
  }

  delete() {
    if (!this._delete) {
      this._delete = new DeleteRequest()
        .object(this);
    }

    return this._delete;
  }

  change(action, diff, callback = () => {}) {
    if (action === 'update') {
      this._changeUpdate(diff, callback);
    }

    if (action === 'delete') {
      this._changeDelete(diff, callback);
    }

    return this;
  }

  _bindConnection() {
    this._connection.addListener('open', this._handleOpen);
  }

  _unbindConnection() {
    this._connection.removeListener('open', this._handleOpen);
  }

  _changeUpdate(diff, callback) {
    this._cache.get(this.key(), (error, cacheData) => {
      if (error) {
        callback(error);
        return;
      }

      cacheData = Object.assign({}, cacheData);
      cacheData = applyDiff(cacheData, diff);

      this._cache.set(this.key(), cacheData, this._lifetime, (cacheError) => {
        if (cacheError) {
          callback(cacheError);
          return;
        }

        this.emit('update', diff, cacheData);
        this.emit('change', 'update', diff, cacheData);

        callback(null, diff, cacheData);
      });
    });
  }

  _changeDelete(diff, callback) {
    this.emit('delete', diff);
    this.emit('change', 'delete', diff);

    this._subscribed = false;
    this.destroy(true);

    callback(null, diff);
  }

  _open() {
    if (this._subscribed) {
      this.subscribe(true);
    }

    this.select().execute(null, true);
  }

  _keepalive() {
    this._cache.touch(this.key(), this._lifetime);
  }
}
