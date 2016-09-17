import { ScolaError } from '@scola/error';
import Query from '../query';

export default class InsertQuery extends Query {
  execute(request, callback = () => {}) {
    request.once('data', (data) => {
      this._handleData(data, request, callback);
    });

    request.once('error', (error) => {
      this._handleError(error, request, callback);
    });
  }

  _handleError(error, request, callback) {
    request.removeAllListeners();
    callback(new ScolaError('400 invalid_request ' + error.message));
  }

  _handleData(data, request, callback) {
    request.removeAllListeners();

    this._validate(data, request, (error) => {
      this._handleValidate(error, data, request, callback);
    });
  }

  _handleValidate(error, data, request, callback) {
    if (error) {
      callback(new ScolaError('400 invalid_input ' + error.message));
      return;
    }

    this._query(data, request, (queryError, id) => {
      this._handleQuery(queryError, id, data, callback);
    });
  }

  _handleQuery(error, id, data, callback) {
    if (error) {
      callback(new ScolaError('500 invalid_query ' + error.message));
      return;
    }

    if (!id) {
      callback();
      return;
    }

    this._object
      .id(id)
      .data(data, (objectError) => {
        if (objectError) {
          callback(objectError);
          return;
        }

        this._object.model().object({
          id,
          object: this._object
        }, 'insert');

        this._object.notifyPeers('insert');
        callback(null, data, this._object);
      });
  }
}
