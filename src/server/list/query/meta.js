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

  request(value, callback, force) {
    this._list.query(value, (listError, filter, order) => {
      if (listError) {
        callback(ScolaError.fromError(listError, '400 invalid_input'));
        return;
      }

      if (value === null) {
        this._list.data((cacheError, cacheData) => {
          this._handleData(cacheError, cacheData, filter, order, value,
            callback, force);
        });

        return;
      }

      this._authorize(filter, order, value, (authError) => {
        if (authError) {
          callback(ScolaError.fromError(authError, '401 invalid_auth'));
          return;
        }

        this._list.data((cacheError, cacheData) => {
          this._handleData(cacheError, cacheData, filter, order, value,
            callback, force);
        });
      });
    });
  }

  _handleData(cacheError, cacheData, filter, order, request, callback, force) {
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
