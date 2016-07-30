import Query from '../query';

export default class DeleteQuery extends Query {
  execute(request, callback = () => {}) {
    this._query(request, (error) => {
      this._handleQuery(error, callback);
    });
  }

  _handleQuery(error, callback) {
    if (error) {
      callback(new Error('500 query_failed ' + error.message));
      return;
    }

    this._object.notifyPeers('delete');
    callback(null, null, this._object);
  }
}
