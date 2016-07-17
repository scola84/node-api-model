import ServerPage from './server-page';

export default class ServerList {
  constructor() {
    this._id = '';
    this._name = '';
    this._filter = '';
    this._order = '';
    this._count = 15;

    this._meta = {};
    this._pages = {};

    this._connections = new Set();
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
    if (filter === true) {
      return this._parseFilter(this._filter);
    }

    if (typeof filter === 'undefined') {
      return this._filter;
    }

    this._filter = filter;
    return this;
  }

  order(order) {
    if (order === true) {
      return this._parseOrder(this._order);
    }

    if (typeof order === 'undefined') {
      return this._order;
    }

    this._order = order;
    return this;
  }

  count() {
    return this._count;
  }

  register(connection, action) {
    if (action === true) {
      this._register(connection);
    } else if (action === false) {
      this._unregister(connection);
    }
  }

  items(parameters, callback) {
    this._items(parameters, callback);
  }

  groups(callback) {
    if (this._meta.groups) {
      callback(null, {
        count: this._count,
        groups: this._meta.groups
      });

      return;
    }

    const parameters = {
      filter: this._parseFilter(this.filter()),
      order: this._parseOrder(this.order())
    };

    this._groups(parameters, (error, data) => {
      if (error) {
        callback(error);
        return;
      }

      this._meta.groups = data;

      callback(null, {
        count: this._count,
        groups: this._meta.groups
      });
    });
  }

  total(callback) {
    if (this._meta.total) {
      callback(null, {
        count: this._count,
        total: this._meta.total
      });

      return;
    }

    const parameters = {
      filter: this._parseFilter(this.filter()),
      order: this._parseOrder(this.order())
    };

    this._total(parameters, (error, data) => {
      if (error) {
        callback(error);
        return;
      }

      this._meta.total = data.total;

      callback(null, {
        count: this._count,
        total: this._meta.total
      });
    });
  }

  page(page) {
    if (typeof this._pages[page] === 'undefined') {
      this._pages[page] = new ServerPage()
        .model(this)
        .index(page);
    }

    return this._pages[page];
  }

  _register(connection) {
    this._connections.add(connection);

    connection.on('close', () => {
      this._unregister(connection);
    });
  }

  _unregister(connection) {
    this._connections.delete(connection);

    Object.keys(this._pages).forEach((page) => {
      this._pages[page].register(connection, false);
    });
  }

  _parseFilter(filter) {
    const terms = {};

    let value = '';
    let field = '';
    let enclosed = false;

    for (let i = 0; i < filter.length; i += 1) {
      if (filter[i] === '"') {
        enclosed = !enclosed;
      } else if (filter[i] === ' ') {
        if (enclosed === true) {
          value += filter[i];
        } else if (enclosed === false) {
          if (value) {
            terms[value] = terms[value] || [];

            if (field) {
              terms[value].push(field);
            }
          }

          value = '';
          field = '';
        }
      } else if (filter[i] === ':') {
        field = value;
        value = '';
      } else {
        value += filter[i];
      }
    }

    if (value) {
      terms[value] = terms[value] || [];

      if (field) {
        terms[value].push(field);
      }
    }

    return terms;
  }

  _parseOrder(order) {
    let direction = '';

    if (order[0] === '-') {
      direction = 'desc';
    } else if (order[0] === '+') {
      direction = 'asc';
    }

    return {
      column: order.slice(1),
      direction
    };
  }
}
