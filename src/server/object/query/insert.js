import { ScolaError } from '@scola/error';
import Query from '../query';

export default class InsertQuery extends Query {
  execute(request, callback = () => {}) {
    this._query(request, (queryError, queryData, id) => {
      this._handleQuery(queryError, queryData, id, callback);
    });
  }

  _handleQuery(queryError, queryData, id, callback) {
    if (queryError) {
      callback(ScolaError.fromError(queryError, '500 invalid_query'));
      return;
    }

    if (!id) {
      callback(null, queryData);
      return;
    }

    this._object
      .id(id)
      .data(queryData, (objectError) => {
        if (objectError) {
          callback(objectError);
          return;
        }

        this._object.model().object({
          id,
          object: this._object
        }, 'insert');

        this._object.notifyPeers('insert');
        callback(null, queryData, this._object);
      });
  }
}
