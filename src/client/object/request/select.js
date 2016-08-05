import { ScolaError } from '@scola/error';
import Request from '../request';

export default class SelectRequest extends Request {
  execute(callback = () => {}, force) {
    this._object.data((error, data) => {
      if (error) {
        callback(error);
        return;
      }

      if (data && force !== true) {
        callback(null, data, this._object);
        return;
      }

      this._request(callback);
    });
  }

  _request(callback) {
    const request = this._object.connection().request({
      path: this._object.path()
    }, (response) => {
      this._handleResponse(request, response, callback);
    });

    request.once('error', (error) => {
      this._handleError(error, request, callback);
    });

    request.end();
  }

  _handleResponse(request, response, callback) {
    request.removeAllListeners();

    response.once('data', (data) => {
      this._handleData(data, response, callback);
    });

    response.once('error', (error) => {
      this._handleError(error, response, callback);
    });
  }

  _handleData(data, response, callback) {
    response.removeAllListeners();

    if (response.statusCode !== 200) {
      callback(new ScolaError(data));
      return;
    }

    this._object.data(data, (error) => {
      callback(error, data, this._object);
    });
  }

  _handleError(error, source, callback) {
    source.removeAllListeners();
    callback(error);
  }
}
