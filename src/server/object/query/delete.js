import { ScolaError } from '@scola/error';
import Query from '../query';

export default class DeleteQuery extends Query {
  request(value, callback = () => {}) {
    this._object.data((objectError, cacheData) => {
      if (objectError) {
        callback(objectError);
        return;
      }

      this._authorize(cacheData, value, (authError) => {
        this._handleAuthorize(authError, cacheData, value, callback);
      });
    });
  }

  _handleAuthorize(authError, request, callback) {
    if (authError) {
      callback(ScolaError.fromError(authError, '401 invalid_auth'));
      return;
    }

    this._query(request, (queryError) => {
      this._handleQuery(queryError, callback);
    });
  }

  _handleQuery(queryError, callback) {
    if (queryError) {
      callback(ScolaError.fromError(queryError, '500 invalid_query'));
      return;
    }

    this._object.notifyPeers('delete');
    callback(null, null, this._object);
  }
}
