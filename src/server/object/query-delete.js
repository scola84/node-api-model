import Query from './query';

export default class DeleteQuery extends Query {
  execute(request, callback) {
    this._query(request, (error) => {
      this._handleQuery(error, callback);
    });
  }

  _handleQuery(error, callback) {
    if (error) {
      if (callback) {
        callback(error);
      }

      return;
    }

    this._object.notifyPeers('delete');

    if (callback) {
      callback(null, this._object);
    }
  }
}
