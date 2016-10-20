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

  _handleError(requestError, request, callback) {
    request.removeAllListeners();
    callback(ScolaError.fromError(requestError, '400 invalid_request'));
  }

  _handleData(data, request, callback) {
    request.removeAllListeners();

    this._validate(data, request, (validatorError) => {
      this._handleValidate(validatorError, data, request, callback);
    });
  }

  _handleValidate(validatorError, data, request, callback) {
    if (validatorError) {
      callback(ScolaError.fromError(validatorError, '400 invalid_input'));
      return;
    }

    this._authorize(data, request, (authError) => {
      this._handleAuthorize(authError, data, request, callback);
    });
  }

  _handleAuthorize(authError, data, request, callback) {
    if (authError) {
      callback(ScolaError.fromError(authError, '401 invalid_auth'));
      return;
    }

    this._query(data, request, (queryError, queryData, id) => {
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
