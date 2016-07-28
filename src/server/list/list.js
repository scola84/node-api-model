import odiff from 'odiff';
import GroupsQuery from './query-groups';
import TotalQuery from './query-total';
import ServerPage from './page';
import parseFilter from '../../helper/parse-filter';
import parseOrder from '../../helper/parse-order';

export default class ServerList {
  constructor() {
    this._id = null;
    this._name = null;
    this._validate = null;

    this._select = null;
    this._groups = null;
    this._total = null;

    this._filter = '';
    this._order = '';
    this._count = 15;

    this._meta = new Map();
    this._pages = new Map();

    this._connections = new Set();
    this._handleClose = (e, c) => this.subscribe(c, false);
  }

  destroy() {
    this._connections
      .forEach((connection) => this._unbindConnection(connection));
    this._connections.clear();
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

  select(callback) {
    if (typeof callback === 'undefined') {
      return this._select;
    }

    this._select = callback;
    return this;
  }

  groups(groups) {
    if (typeof groups === 'undefined') {
      return this._groups;
    }

    this._groups = new GroupsQuery()
      .list(this)
      .query(groups)
      .validate(this._validate);

    return this;
  }

  total(total) {
    if (typeof total === 'undefined') {
      return this._total;
    }

    this._total = new TotalQuery()
      .list(this)
      .query(total)
      .validate(this._validate);

    return this;
  }

  subscribe(connection, action) {
    if (action === true) {
      this._connections.add(connection);
      this._bindConnection(connection);
    } else if (action === false) {
      this._connections.delete(connection);
    }

    return this;
  }

  meta(name, data) {
    if (typeof data === 'undefined') {
      return this._meta.get(name);
    }

    this._meta.set(name, data);
    return this;
  }

  page(index) {
    index = Number(index);

    if (!this._pages.has(index)) {
      this._pages.set(index, new ServerPage()
        .list(this)
        .index(index)
        .validate(this._validate)
        .select(this._select));
    }

    return this._pages.get(index);
  }

  change(action, diff, id, callback) {
    this._changePages(action, diff, id, (pageDiffs) => {
      if (this._meta.has('groups')) {
        this._changeGroups(action, pageDiffs, id, callback);
      } else if (this._meta.has('total')) {
        this._changeTotal(action, pageDiffs, id, callback);
      }
    });
  }

  notifyClients(action, diff) {
    this._connections.forEach((connection) => {
      connection.request({
        method: 'PUB',
        path: '/' + this._name,
        query: {
          id: this._id
        }
      }).end({
        action,
        diff
      });
    });
  }

  _bindConnection(connection) {
    connection.once('close', this._handleClose);
  }

  _unbindConnection(connection) {
    connection.removeListener('close', this._handleClose);
  }

  _changePages(action, diff, id, callback) {
    const pageDiffs = {};
    let count = 0;

    this._pages.forEach((page, index) => {
      page.change(action, diff, id, (pageDiff) => {
        index = Number(index);
        count += 1;

        if (pageDiff) {
          pageDiffs[index] = pageDiff;
        }

        if (count === this._pages.size) {
          callback(pageDiffs);
        }
      });
    });
  }

  _changeGroups(action, pageDiffs, id, callback) {
    const groups = this._meta.get('groups');
    this._meta.delete('groups');

    this.groups((error, data) => {
      let diff = null;

      if (!error) {
        diff = {
          id,
          pages: pageDiffs,
          groups: odiff(groups, data.groups)
        };

        this.notifyClients(action, diff);
      }

      if (callback) {
        callback(error, diff);
      }
    });
  }

  _changeTotal(action, pageDiffs, id, callback) {
    this._meta.delete('total');

    this.total((error, data) => {
      let diff = null;

      if (!error) {
        diff = {
          id,
          pages: pageDiffs,
          total: data.total
        };

        this.notifyClients(action, diff);
      }

      if (callback) {
        callback(error, diff);
      }
    });
  }
}
