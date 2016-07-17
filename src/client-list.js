import EventEmitter from 'events';
import ClientPage from './client-page';

export default class ClientList extends EventEmitter {
  constructor() {
    super();

    this._id = '';
    this._name = '';
    this._filter = '';
    this._order = '';
    this._count = 15;

    this._register = null;

    this._meta = {};
    this._pages = {};

    this._connection = null;
  }

  connection(connection) {
    if (typeof connection === 'undefined') {
      return this._connection;
    }

    this._connection = connection;
    return this;
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

  filter(filter) {
    if (typeof filter === 'undefined') {
      return this._filter;
    }

    this._filter = filter;
    return this;
  }

  order(order) {
    if (typeof order === 'undefined') {
      return this._order;
    }

    this._order = order;
    return this;
  }

  count() {
    return this._count;
  }

  register(register) {
    if (typeof register === 'undefined') {
      return this._register;
    }

    if (register === false) {
      this._unregister();
    }

    this._register = register;
    return this;
  }

  groups(groups) {
    if (typeof groups === 'undefined') {
      return this._meta.groups;
    }

    if (typeof groups === 'function') {
      return this._groups(groups);
    }

    let total = 0;

    groups.forEach((group) => {
      group.begin = total;
      group.end = total + group.total;
      total = group.end;
    });

    this._meta.groups = groups;
    this.total(total);
    this.emit('update', groups);

    return this;
  }

  total(total) {
    if (typeof total === 'undefined') {
      return this._meta.total;
    }

    if (typeof total === 'function') {
      return this._total(total);
    }

    this._meta.total = total;
    this.emit('total', total);

    return this;
  }

  page(index) {
    if (typeof this._pages[index] === 'undefined') {
      this._pages[index] = new ClientPage()
        .model(this)
        .index(index);
    }

    return this._pages[index];
  }

  _unregister() {
    this._connection.request({
      path: '/' + this._name,
      query: {
        filter: this._filter,
        order: this._order,
        unregister: 'model'
      }
    });
  }

  _groups(callback) {
    if (this._meta.groups) {
      callback(this._meta.groups);
      return;
    }

    this._connection.request({
      path: '/' + this._name,
      query: {
        filter: this._filter,
        order: this._order,
        register: this._register ? 'model' : null,
        meta: 'groups'
      }
    }, (response) => {
      response.on('data', (data) => {
        this._count = data.count;
        this.groups(data.groups);
        callback(data.groups);
      });
    }).end();
  }

  _total(callback) {
    if (this._meta.total) {
      callback(this._meta.total);
      return;
    }

    this._connection.request({
      path: '/' + this._name,
      query: {
        filter: this._filter,
        order: this._order,
        register: this._register ? 'model' : null,
        meta: 'total'
      }
    }, (response) => {
      response.on('data', (data) => {
        this._count = data.count;
        this.total(data.total);
        callback(data.total);
      });
    }).end();
  }
}
