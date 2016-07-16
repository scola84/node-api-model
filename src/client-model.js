import EventEmitter from 'events';
import ClientPage from './client-page';

export default class ClientModel extends EventEmitter {
  constructor() {
    super();

    this._connection = null;

    this._name = null;
    this._size = 15;
    this._id = null;

    this._filter = '';
    this._order = '';
    this._register = null;

    this._meta = {
      groups: [],
      total: 0
    };

    this._pages = {};
  }

  connection(connection) {
    if (typeof connection === 'undefined') {
      return this._connection;
    }

    this._connection = connection;
    return this;
  }

  name(name) {
    if (typeof name === 'undefined') {
      return this._name;
    }

    this._name = name;
    return this;
  }

  size(size) {
    if (typeof size === 'undefined') {
      return this._size;
    }

    this._size = size;
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

  id(id) {
    if (typeof id === 'undefined') {
      if (this._id === null) {
        this._id = this._name + this._filter + this._order;
      }

      return this._id;
    }

    this._id = id;
    return this;
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
    if (typeof groups === 'function' || typeof groups === 'undefined') {
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
    if (typeof total === 'function' || typeof total === 'undefined') {
      return this._total(total);
    }

    this._meta.total = total;
    this.emit('total', total);

    return this;
  }

  page(page) {
    if (typeof this._pages[page] === 'undefined') {
      this._pages[page] = new ClientPage()
        .model(this)
        .index(page);
    }

    return this._pages[page];
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
    if (typeof callback === 'undefined') {
      return this._meta.groups;
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
        this._size = data.size;
        this.groups(data.groups);
        callback(data.groups);
      });
    }).end();

    return this;
  }

  _total(callback) {
    if (typeof callback === 'undefined') {
      return this._meta.total;
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
        this._size = data.size;
        this.total(data.total);
        callback(data.total);
      });
    }).end();

    return this;
  }
}
