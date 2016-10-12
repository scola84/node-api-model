import { EventEmitter } from 'events';
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
    this._model.object({
      id: this._id
    }, 'delete');

    this._unbindConnection();

    if (this._subscribed === true) {
      this.subscribe(false);
    }

    if (cache === true && this._cache) {
      this._cache.delete(this.path());
    }
  }

  id(value) {
    if (typeof value === 'undefined') {
      return this._id;
    }

    this._id = value;
    return this;
  }

  name(value) {
    if (typeof value === 'undefined') {
      return this._name;
    }

    this._name = value;
    return this;
  }

  model(value) {
    if (typeof value === 'undefined') {
      return this._model;
    }

    this._model = value;
    return this;
  }

  cache(value) {
    if (typeof value === 'undefined') {
      return this._cache;
    }

    this._cache = value;
    return this;
  }

  connection(value) {
    if (typeof value === 'undefined') {
      return this._connection;
    }

    this._connection = value;
    this._bindConnection();

    return this;
  }

  validate(value) {
    if (typeof value === 'undefined') {
      return this._validate;
    }

    this._validate = value;
    return this;
  }

  path() {
    return '/' + this._name + '/' + this._id;
  }

  data(value, callback = () => {}) {
    if (typeof value === 'function') {
      callback = value;
    }

    if (!this._cache) {
      callback();
      return;
    }

    if (value === callback) {
      this._cache.get(this.path(), value);
      return;
    }

    this._cache.set(this.path(), value, (error) => {
      if (error) {
        callback(error);
        return;
      }

      callback(null, value);
    });
  }

  subscribe(subscribed) {
    this._subscribed = subscribed;

    this._connection.request()
      .method('SUB')
      .path(this.path())
      .once('error', () => {})
      .end(subscribed);

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

  fetch(callback) {
    this.select().execute(callback, true);
    return this;
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
    this._connection.setMaxListeners(this._connection.getMaxListeners() + 1);
    this._connection.addListener('open', this._handleOpen);
  }

  _unbindConnection() {
    this._connection.setMaxListeners(this._connection.getMaxListeners() - 1);
    this._connection.removeListener('open', this._handleOpen);
  }

  _changeUpdate(diff, callback) {
    if (!this._cache) {
      callback();
      return;
    }

    this._cache.get(this.path(), (error, data) => {
      if (error) {
        callback(error);
        return;
      }

      data = Object.assign({}, data);
      data = applyDiff(data, diff);

      this._cache.set(this.path(), data, (cacheError) => {
        if (cacheError) {
          callback(cacheError);
          return;
        }

        this.emit('change', {
          action: 'update',
          data,
          diff
        });

        callback(null, diff, data);
      });
    });
  }

  _changeDelete(diff, callback) {
    this.emit('change', {
      action: 'delete',
      diff
    });

    this._subscribed = false;
    this.destroy(true);

    callback(null, diff);
  }

  _open(event) {
    if (!this._select) {
      return;
    }

    this.select().execute((error) => {
      if (error) {
        return;
      }

      if (this._subscribed) {
        this.subscribe(true);
      }

      this.emit('open', event);
    }, true);
  }
}
