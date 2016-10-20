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
    this._list.query(request, (listError, filter, order) => {
      if (listError) {
        callback(ScolaError.fromError(listError, '400 invalid_input'));
        return;
      }

      this._authorize(filter, order, request, (authError) => {
        if (authError) {
          callback(ScolaError.fromError(authError, '401 invalid_auth'));
          return;
        }

        this._page.data((cacheError, cacheData) => {
          if (cacheError) {
            callback(cacheError);
            return;
          }

          if (cacheData && force !== true) {
            callback(null, cacheData, this._page);
            return;
          }

          const limit = {
            offset: this._page.index() * this._list.count(),
            count: this._list.count()
          };

          this._query(filter, order, limit, request, (queryError, queryData) => {
            this._handleQuery(queryError, queryData, filter, order, limit,
              request, callback);
          });
        });
      });
    });
  }

  _handleQuery(queryError, queryData, filter, order, limit, request, callback) {
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
