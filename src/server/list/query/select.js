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

      this._list.query((listError, filter, order) => {
        if (listError) {
          callback(new ScolaError('400 invalid_input ' + listError.message));
          return;
        }

        const limit = {
          offset: this._page.index() * this._list.count(),
          count: this._list.count()
        };

        this._query(filter, order, limit, (queryError, queryData) => {
          this._handleQuery(queryError, queryData, callback);
        });
      });
    });
  }

  _handleQuery(error, data, callback) {
    if (error) {
      callback(new ScolaError('500 invalid_query ' + error.message));
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
