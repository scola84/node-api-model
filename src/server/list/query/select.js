import { ScolaError } from '@scola/error';
import Query from '../query';

export default class SelectQuery extends Query {
  constructor() {
    super();
    this._page = null;
  }

  page(value) {
    if (typeof value === 'undefined') {
      return this._page;
    }

    this._page = value;
    return this;
  }

  execute(request, callback, force) {
    this._page.data((cacheError, cacheData) => {
      this._handleData(cacheError, cacheData, callback, force);
    });
  }

  _handleData(cacheError, cacheData, callback, force) {
    if (cacheError) {
      callback(cacheError);
      return;
    }

    if (cacheData && force !== true) {
      callback(null, cacheData, this._page);
      return;
    }

    const filter = this._list.filter();
    const order = this._list.order();

    const limit = {
      offset: this._page.index() * this._list.count(),
      count: this._list.count()
    };

    this._query(filter, order, limit, (queryError, queryData) => {
      this._handleQuery(queryError, queryData, callback);
    });
  }

  _handleQuery(queryError, queryData, callback) {
    if (queryError) {
      callback(ScolaError.fromError(queryError, '500 invalid_query'));
      return;
    }

    if (queryData.length === 0) {
      this._page.destroy(true);
      callback(null, queryData, this._page);
      return;
    }

    this._page.data(queryData, (pageError) => {
      callback(pageError, queryData, this._page);
    });
  }
}
