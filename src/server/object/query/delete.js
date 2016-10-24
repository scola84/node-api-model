import { ScolaError } from '@scola/error';
import Query from '../query';

export default class DeleteQuery extends Query {
  execute(request, callback = () => {}) {
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
