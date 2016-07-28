import Query from './query';

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

  execute(callback) {
    if (this._page.data()) {
      if (callback) {
        callback(null, this._page.data());
      }

      return;
    }

    const filter = this._list.filter(true);
    const order = this._list.order(true);

    this._validate(filter, order, (filterError, orderError) => {
      this._handleValidate(filterError, orderError, filter, order, callback);
    });
  }

  _handleValidate(filterError, orderError, filter, order, callback) {
    if (filterError || orderError) {
      if (callback) {
        callback(filterError || orderError);
      }

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
      if (callback) {
        callback(error);
      }

      return;
    }

    this._page.data(data);

    if (callback) {
      callback(null, data);
    }
  }
}
