import { StringDecoder } from 'string_decoder';
import { ScolaError } from '@scola/error';
import Request from '../request';

export default class MetaRequest extends Request {
  execute(callback, force) {
    this._list.data((error, cacheData) => {
      if (error) {
        callback(error);
        return;
      }

      if (cacheData && force !== true) {
        callback(null, cacheData, this._list);
        return;
      }

      this._list.query((queryError, filter, order) => {
        if (queryError) {
          callback(queryError);
          return;
        }

        this._request(filter, order, callback);
      });
    });
  }

  _request(filter, order, callback) {
    const request = this._list.connection().request()
      .path(this._list.path())
      .query({
        filter,
        order
      })
      .once('error', (error) => {
        request.removeAllListeners();
        callback(new ScolaError('000 invalid_request ' + error.message));
      });

    request.end('', (response) => {
      if (response.status() === 0) {
        return;
      }

      request.removeAllListeners();
      this._handleResponse(response, callback);
    });
  }

  _handleResponse(response, callback) {
    response.once('data', (data) => {
      response.removeAllListeners();
      this._handleData(data, response, callback);
    });

    response.once('error', (error) => {
      response.removeAllListeners();
      callback(error);
    });
  }

  _handleData(data, response, callback) {
    if (response.status() !== 200) {
      callback(new ScolaError(new StringDecoder().write(data)));
      return;
    }

    this._list.data(data, (error) => {
      callback(error, data, this._list);
    });
  }
}
