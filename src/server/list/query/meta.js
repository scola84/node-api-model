import { ScolaError } from '@scola/error';
import Query from '../query';

export default class MetaQuery extends Query {
  constructor() {
    super();
    this._type = null;
  }

  type(value) {
    this._type = value;
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

        this._list.data((cacheError, cacheData) => {
          if (cacheError) {
            callback(cacheError);
            return;
          }

          if (cacheData && force !== true) {
            callback(null, cacheData, this._list);
            return;
          }

          this._query(filter, order, request, (queryError, queryData) => {
            this._handleQuery(queryError, queryData, filter, order,
              request, callback);
          });
        });
      });
    });
  }

  _handleQuery(queryError, queryData, filter, order, request, callback) {
    if (queryError) {
      callback(ScolaError.fromError(queryError, '500 invalid_query'));
      return;
    }

    this._list.data(queryData, (listError) => {
      callback(listError, queryData, this._list);
    });
  }
}
