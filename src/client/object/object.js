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
    this._connection = null;
    this._validate = null;

    this._select = null;
    this._insert = null;
    this._update = null;
    this._delete = null;

    this._subscribed = null;
    this._data = null;

    this._handleOpen = () => this._open();
  }

  destroy() {
    this._unbindConnection();

    if (this._subscribed) {
      this.subscribe(false);
    }

    this._model.object({
      id: this._id
    }, 'delete');
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

  data(data) {
    if (typeof data === 'undefined') {
      return this._data;
    }

    this._data = data;
    return this;
  }

  get(name) {
    return this._data && this._data[name];
  }

  subscribe(subscribed) {
    this._subscribed = subscribed;

    this._connection.request({
      method: 'SUB',
      path: '/' + this._name + '/' + this._id
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

  change(action, diff) {
    if (action === 'update') {
      this._data = applyDiff(Object.assign({}, this._data), diff);
    }

    if (action === 'delete') {
      this._subscribed = false;
      this.destroy();
    }

    this.emit('change', action, diff, this._data);
  }

  _bindConnection() {
    this._connection.addListener('open', this._handleOpen);
  }

  _unbindConnection() {
    this._connection.removeListener('open', this._handleOpen);
  }

  _open() {
    if (this._subscribed) {
      this.subscribe(true);
    }

    if (this._data) {
      this._data = null;
      this.select().execute();
    }
  }
}
