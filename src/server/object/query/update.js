import odiff from 'odiff';
import { ScolaError } from '@scola/error';
import Query from '../query';

export default class UpdateQuery extends Query {
  execute(request, callback = () => {}) {
    this._object.data((objectError, cacheData) => {
      if (objectError) {
        callback(objectError);
        return;
      }

      const data = Object.assign({}, cacheData, request.data());
      const diff = odiff(cacheData, data);

      if (diff.length === 0) {
        callback();
        return;
      }

      request.data(data);

      this._query(request, (queryError, queryData) => {
        this._handleQuery(queryError, queryData, diff, callback);
      });
    });
  }

  _handleQuery(queryError, queryData, diff, callback) {
    if (queryError) {
      callback(ScolaError.fromError(queryError, '500 invalid_query'));
      return;
    }

    this._object.data(queryData, (objectError) => {
      if (objectError) {
        callback(objectError);
        return;
      }

      this._object.notifyPeers('update', diff);
      callback(null, queryData, this._object);
    });
  }
}
