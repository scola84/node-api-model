import { ScolaError } from '@scola/error';
import Request from '../request';

export default class DeleteRequest extends Request {
  execute(callback = () => {}) {
    this._request(callback);
  }

  _request(callback) {
    const request = this._object.connection().request({
      method: 'DELETE',
      path: this._object.path()
    }, (response) => {
      this._handleResponse(request, response, callback);
    });

    request.once('error', (error) => {
      this._handleError(error);
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

    callback(null, null, this._object);
  }

  _handleError(error, source, callback) {
    source.removeAllListeners();
    callback(error);
  }
}
