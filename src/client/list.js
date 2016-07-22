import EventEmitter from 'events';
import ClientPage from './page';
import apply from '../helper/apply';

export default class ClientList extends EventEmitter {
  constructor() {
    super();

    this._id = null;
    this._name = null;
    this._model = null;
    this._connection = null;
    this._subscribed = null;

    this._filter = '';
    this._order = '';
    this._count = 15;

    this._meta = new Map();
    this._pages = new Map();

    this._handleOpen = () => this._open();
  }

  destroy() {
    this._unbindConnection();

    if (this._subscribed) {
      this.subscribe(false);
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

  connection(connection) {
    if (typeof connection === 'undefined') {
      return this._connection;
    }

    this._connection = connection;
    this._bindConnection();

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

  count(count) {
    if (typeof count === 'undefined') {
      return this._count;
    }

    this._count = count;
    return this;
  }

  subscribe(subscribed) {
    this._subscribed = subscribed;

    this._connection.request({
      method: 'SUB',
      path: '/' + this._name
    }).end(subscribed);

    return this;
  }

  groups(groups) {
    if (typeof groups === 'undefined') {
      return this._meta.get('groups');
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

    this._meta.set('groups', groups);
    this.total(total);

    return this;
  }

  total(total) {
    if (typeof total === 'undefined') {
      return this._meta.get('total');
    }

    if (typeof total === 'function') {
      return this._total(total);
    }

    this._meta.set('total', total);
    return this;
  }

  page(index) {
    if (!this._pages.has(index)) {
      this._pages.set(index, new ClientPage()
        .list(this)
        .index(index));
    }

    return this._pages.get(index);
  }

  change(action, diff) {
    if (diff.groups) {
      this.groups(apply(this._meta.get('groups'), diff.groups));
    } else if (diff.total) {
      this.total(diff.total);
    }

    const pages = Object.keys(diff.pages);
    let page = null;

    pages.forEach((index) => {
      page = this._pages.get(Number(index));

      if (page) {
        page.change(action, diff.pages[index]);
      }
    });

    this.emit('change', action, pages);
    return this;
  }

  _bindConnection() {
    this._connection.addListener('open', this._handleOpen);
  }

  _unbindConnection() {
    this._connection.removeListener('open', this._handleOpen);
  }

  _groups(callback) {
    if (this._meta.has('groups')) {
      if (callback) {
        callback(null, this._meta.get('groups'));
      }

      return;
    }

    const request = {
      path: '/' + this._name,
      query: {
        filter: this._filter,
        order: this._order,
        meta: 'groups'
      }
    };

    this._connection
      .request(request, (response) => this.__groups(response, callback))
      .end();
  }

  __groups(response, callback) {
    response.once('data', (data) => {
      const error = response.statusCode === 200 ?
        null : new Error(response.statusCode);

      if (response.statusCode === 200 && data) {
        this._count = data.count;
        this.groups(data.groups);
      }

      if (callback) {
        callback(error, data.groups);
      }
    });
  }

  _total(callback) {
    if (this._meta.has('total')) {
      if (callback) {
        callback(this._meta.get('total'));
      }

      return;
    }

    const request = {
      path: '/' + this._name,
      query: {
        filter: this._filter,
        order: this._order,
        meta: 'total'
      }
    };

    this._connection
      .request(request, (response) => this.__total(response, callback))
      .end();
  }

  __total(response, callback) {
    response.once('data', (data) => {
      const error = response.statusCode === 200 ?
        null : new Error(response.statusCode);

      if (response.statusCode === 200 && data) {
        this._count = data.count;
        this.total(data.total);
      }

      if (callback) {
        callback(error, data.total);
      }
    });
  }

  _open() {
    if (this._subscribed) {
      this.subscribe(true);
    }

    if (this._meta.has('groups')) {
      this._meta.delete('groups');
      this._groups();
    }

    if (this._meta.has('total')) {
      this._meta.delete('total');
      this._total();
    }
  }
}
