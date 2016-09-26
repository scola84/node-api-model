import { StringDecoder } from 'string_decoder';
import { ScolaError } from '@scola/error';
import Request from '../request';

export default class DeleteRequest extends Request {
  execute(callback = () => {}) {
    this._request(callback);
  }

  _request(callback) {
    const request = this._object.connection().request()
      .method('DELETE')
      .path(this._object.path())
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

    callback(null, null, this._object);
  }
}
