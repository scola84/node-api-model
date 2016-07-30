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

  execute(callback = () => {}) {
    if (this._page.data()) {
      callback(null, this._page.data(), this._page);
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
      callback(new Error('400 input_invalid ' +
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
      callback(new Error('500 query_failed ' + error.message));
      return;
    }

    this._page.data(data);
    callback(null, data, this._page);
  }
}
