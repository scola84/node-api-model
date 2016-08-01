import odiff from 'odiff';
import ServerPage from './page';
import GroupsQuery from './query/groups';
import TotalQuery from './query/total';
import parseFilter from '../../helper/parse-filter';
import parseOrder from '../../helper/parse-order';

export default class ServerList {
  constructor() {
    this._id = null;
    this._name = null;
    this._cache = null;
    this._lifetime = null;

    this._validate = null;
    this._select = null;
    this._groups = null;
    this._total = null;

    this._filter = '';
    this._order = '';
    this._count = 15;

    this._pages = new Map();

    this._connections = new Set();
    this._handleClose = (e, c) => this.subscribe(c, false);
  }

  destroy(cache) {
    this._connections.forEach((connection) => {
      this._unbindConnection(connection);
    });

    this._pages.forEach((page) => {
      page.destroy(cache);
    });

    this._connections.clear();
    this._pages.clear();

    clearInterval(this._interval);
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

  cache(cache, lifetime) {
    if (typeof cache === 'undefined') {
      return this._cache;
    }

    this._cache = cache;
    this._lifetime = lifetime;

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
      this._subscribe(connection);
    } else if (action === false) {
      this._unsubscribe(connection);
    }

    return this;
  }

  key() {
    return '/' + this._name + '/' + this._id;
  }

  meta(name, data, callback = () => {}) {
    this._cache.get(this.key(), (error, cacheData) => {
      if (typeof data === 'function') {
        data(error, error || !cacheData ? null : cacheData[name]);
        return;
      }

      if (error) {
        callback(error);
        return;
      }

      cacheData = cacheData || {};
      cacheData[name] = data;

      this._cache.set(this.key(), cacheData, this._lifetime, (cacheError) => {
        if (cacheError) {
          callback(cacheError);
          return;
        }

        this._interval = setInterval(this._keepalive.bind(this),
          this._lifetime * 0.9);

        callback();
      });
    });
  }

  page(index, action) {
    index = Number(index);

    if (action === false) {
      this._pages.delete(index);
      return this;
    }

    if (!this._pages.has(index)) {
      this._pages.set(index, new ServerPage()
        .index(index)
        .list(this)
        .cache(this._cache, this._lifetime)
        .validate(this._validate)
        .select(this._select));
    }

    return this._pages.get(index);
  }

  change(action, diff, id, callback = () => {}) {
    this._changePages(action, diff, id, (error, pageDiffs) => {
      if (error) {
        callback(error);
        return;
      }

      this._cache.get(this.key(), (cacheError, data) => {
        if (cacheError) {
          callback(cacheError);
          return;
        }

        diff = {
          id,
          pages: pageDiffs
        };

        if (typeof data.groups !== 'undefined') {
          this._changeGroups(action, diff, callback);
        } else if (typeof data.total !== 'undefined') {
          this._changeTotal(action, diff, callback);
        }
      });
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

  _subscribe(connection) {
    this._connections.add(connection);
    this._bindConnection(connection);
  }

  _unsubscribe(connection) {
    this._connections.delete(connection);
    this._unbindConnection(connection);

    if (this._connections.size === 0) {
      this.destroy(false);
    }
  }

  _changePages(action, diff, id, callback) {
    const pageDiffs = {};
    let count = 0;

    this._pages.forEach((page, index) => {
      page.change(action, diff, id, (error, pageDiff, data) => {
        if (error) {
          callback(error);
          return;
        }

        index = Number(index);
        count += 1;

        if (data.length === 0) {
          pageDiffs[index] = false;
        } else if (pageDiff.length > 0) {
          pageDiffs[index] = pageDiff;
        }

        if (count === this._pages.size) {
          callback(null, pageDiffs);
        }
      });
    });
  }

  _changeGroups(action, diff, callback) {
    this.meta('groups', (error, cacheData) => {
      if (error) {
        callback(error);
        return;
      }

      this.groups().execute((groupsError, queryData) => {
        if (groupsError) {
          callback(groupsError);
          return;
        }

        diff.groups = odiff(cacheData, queryData);

        this.notifyClients(action, diff);
        callback(null, diff);
      }, true);
    });
  }

  _changeTotal(action, diff, callback) {
    this.total().execute((error, data) => {
      if (error) {
        callback(error);
        return;
      }

      diff.total = data;

      this.notifyClients(action, diff);
      callback(null, diff);
    }, true);
  }

  _keepalive() {
    this._cache.touch(this.key(), this._lifetime);
  }
}
