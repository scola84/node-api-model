import EventEmitter from 'events';
import ClientPage from './page';
import GroupsRequest from './request/groups';
import TotalRequest from './request/total';
import applyDiff from '../../helper/apply-diff';
import parseFilter from '../../helper/parse-filter';
import parseOrder from '../../helper/parse-order';

export default class ClientList extends EventEmitter {
  constructor() {
    super();

    this._id = null;
    this._name = null;
    this._model = null;
    this._connection = null;
    this._validate = null;

    this._groups = null;
    this._total = null;
    this._select = null;

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

  validate(validate) {
    if (typeof validate === 'undefined') {
      return this._validate;
    }

    this._validate = validate;
    return this;
  }

  filter(filter) {
    if (filter === true) {
      return parseFilter(this._filter);
    }

    if (typeof filter === 'undefined') {
      return this._filter;
    }

    this._filter = filter;
    return this;
  }

  order(order) {
    if (order === true) {
      return parseOrder(this._order);
    }

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
      path: '/' + this._name,
      query: {
        filter: this._filter,
        order: this._order
      }
    }).end(subscribed);

    return this;
  }

  groups() {
    if (!this._groups) {
      this._groups = new GroupsRequest()
        .list(this)
        .validate(this._validate);
    }

    return this._groups;
  }

  total() {
    if (!this._total) {
      this._total = new TotalRequest()
        .list(this)
        .validate(this._validate);
    }

    return this._total;
  }

  meta(name, data) {
    if (typeof data === 'undefined') {
      return this._meta.get(name);
    }

    if (name === 'groups') {
      let total = 0;

      data.forEach((group) => {
        group.begin = total;
        group.end = total + group.total;
        total = group.end;
      });

      this._meta.set('total', total);
    }

    this._meta.set(name, data);
    return this;
  }

  page(index, action) {
    index = Number(index);

    if (action === false) {
      this._pages.delete(index);
      return this;
    }

    if (!this._pages.has(index)) {
      this._pages.set(index, new ClientPage()
        .index(index)
        .list(this)
        .validate(this._validate));
    }

    return this._pages.get(index);
  }

  change(action, diff) {
    if (diff.groups) {
      this.meta('groups', applyDiff(this.meta('groups'), diff.groups));
    } else if (diff.total) {
      this.meta('total', diff.total);
    }

    const indices = Object.keys(diff.pages);
    let page = null;

    indices.forEach((index) => {
      index = Number(index);
      page = this._pages.get(index);

      if (page) {
        page.change(action, diff.pages[index]);
      }
    });

    this.emit('change', action, diff, indices);
    return this;
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

    if (this._meta.has('groups')) {
      this._meta.delete('groups');
      this._meta.delete('total');
      this.groups().execute();
    }

    if (this._meta.has('total')) {
      this._meta.delete('total');
      this.total().execute();
    }
  }
}
