import SelectQuery from './query-select';
import InsertQuery from './query-insert';
import UpdateQuery from './query-update';
import DeleteQuery from './query-delete';
import applyDiff from '../../helper/apply-diff';

export default class ServerObject {
  constructor() {
    this._id = null;
    this._name = null;
    this._model = null;
    this._connection = null;

    this._authorize = null;
    this._validate = null;

    this._select = null;
    this._insert = null;
    this._update = null;
    this._delete = null;

    this._data = null;

    this._connections = new Set();
    this._handleClose = (e, c) => this.subscribe(c, false);
  }

  destroy() {
    this._connections
      .forEach((connection) => this._unbindConnection(connection));
    this._connections.clear();

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
    return this;
  }

  authorize(authorize) {
    if (typeof authorize === 'undefined') {
      return this._authorize;
    }

    this._authorize = authorize;
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

  subscribe(request, action) {
    if (action === true) {
      this._connections.add(request.connection);
      this._bindConnection(request.connection);
    } else if (action === false) {
      this._connections.delete(request.connection);
    }

    return this;
  }

  select(select) {
    if (typeof select === 'undefined') {
      return this._select;
    }

    if (typeof select === 'function') {
      this._select = new SelectQuery()
        .object(this)
        .query(select);
    }

    return this;
  }

  insert(insert) {
    if (typeof insert === 'undefined') {
      return this._insert;
    }

    if (typeof insert === 'function') {
      this._insert = new InsertQuery()
        .object(this)
        .query(insert)
        .validate(this._validate);
    }

    return this;
  }

  update(update) {
    if (typeof update === 'undefined') {
      return this._update;
    }

    if (typeof update === 'function') {
      this._update = new UpdateQuery()
        .object(this)
        .query(update)
        .validate(this._validate);
    }

    return this;
  }

  delete(del) {
    if (typeof del === 'undefined') {
      return this._delete;
    }

    if (typeof del === 'function') {
      this._delete = new DeleteQuery()
        .object(this)
        .query(del);
    }

    return this;
  }

  change(action, diff) {
    this.notifyClients(action, diff);

    if (action === 'update') {
      this._data = applyDiff(Object.assign({}, this._data), diff);
    }

    if (action === 'delete') {
      this.destroy();
    }

    return this;
  }

  notifyClients(action, diff) {
    this._connections.forEach((connection) => {
      connection.request({
        method: 'PUB',
        path: '/' + this._name + '/' + this._id
      }).end({
        action,
        diff
      });
    });

    return this;
  }

  notifyPeers(action, diff) {
    if (!this._connection) {
      return this;
    }

    this._connection.request({
      method: 'PUB',
      path: '/' + this._name + '/' + this._id
    }).end({
      action,
      diff
    });

    return this;
  }

  _bindConnection(connection) {
    connection.once('close', this._handleClose);
  }

  _unbindConnection(connection) {
    connection.removeListener('close', this._handleClose);
  }
}
