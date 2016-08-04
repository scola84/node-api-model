import Query from '../query';

export default class SelectQuery extends Query {
  constructor() {
    super();
    this._page = null;
  }

  page(page) {
    if (typeof page === 'undefined') {
      return this._page;
    }

    this._page = page;
    return this;
  }

  execute(callback, force) {
    this._page.data((error, data) => {
      if (error) {
        callback(error);
        return;
      }

      if (data && force !== true) {
        callback(null, data, this._page);
        return;
      }

      const filter = this._list.filter(true);
      const order = this._list.order(true);

      this._validate(filter, order, (filterError, orderError) => {
        this._handleValidate(filterError, orderError, filter, order, callback);
      });
    });
  }

  _handleValidate(filterError, orderError, filter, order, callback) {
    if (filterError || orderError) {
      callback(new Error('400 invalid_input ' +
        (filterError || orderError).message));
      return;
    }

    const limit = {
      offset: this._page.index() * this._list.count(),
      count: this._list.count()
    };

    this._query(filter, order, limit, (error, data) => {
      this._handleQuery(error, data, callback);
    });
  }

  _handleQuery(error, data, callback) {
    if (error) {
      callback(new Error('500 invalid_query ' + error.message));
      return;
    }

    if (data.length === 0) {
      this._page.destroy(true);
      callback(null, data, this._page);
      return;
    }

    this._page.data(data, (pageError) => {
      callback(pageError, data, this._page);
    });
  }
}
