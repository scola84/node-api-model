import { ScolaError } from '@scola/error';
import Query from '../query';

export default class SelectQuery extends Query {
  execute(request, callback) {
    this._object.data((objectError, cacheData) => {
      if (objectError) {
        callback(objectError);
        return;
      }

      if (cacheData) {
        this._authorize(cacheData, request, (authError) => {
          if (authError) {
            callback(ScolaError.fromError(authError, '401 invalid_auth'));
            return;
          }

          callback(null, cacheData, this._object);
        });

        return;
      }

      this._query(request, (queryError, queryData) => {
        this._handleQuery(queryError, queryData, request, callback);
      });
    });
  }

  _handleQuery(queryError, queryData, request, callback) {
    if (queryError) {
      callback(ScolaError.fromError(queryError, '500 invalid_query'));
      return;
    }

    if (!queryData) {
      callback(new ScolaError('404 invalid_object ' + this._object.path()));
      return;
    }

    this._authorize(queryData, request, (authError) => {
      if (authError) {
        callback(ScolaError.fromError(authError, '401 invalid_auth'));
        return;
      }

      this._object.data(queryData, (objectError) => {
        callback(objectError, queryData, this._object);
      });
    });
  }
}
