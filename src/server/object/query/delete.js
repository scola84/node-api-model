import { ScolaError } from '@scola/error';
import Query from '../query';

export default class DeleteQuery extends Query {
  execute(request, callback = () => {}) {
    this._query(request, (error) => {
      this._handleQuery(error, callback);
    });
  }

  _handleQuery(error, callback) {
    if (error) {
      callback(ScolaError.fromError(error, '500 invalid_query'));
      return;
    }

    this._object.notifyPeers('delete');
    callback(null, null, this._object);
  }
}
