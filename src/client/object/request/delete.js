import ModelError from '../../error';
import Request from '../request';

export default class SelectRequest extends Request {
  execute(callback = () => {}) {
    this._request(callback);
  }

  _request(callback) {
    const request = {
      method: 'DELETE',
      path: '/' + this._object.name() + '/' + this._object.id()
    };

    this._object.connection()
      .request(request, (response) => {
        this._handleResponse(response, callback);
      })
      .end();
  }

  _handleResponse(response, callback) {
    response.once('data', (data) => {
      this._handleData(data, response, callback);
    });

    response.once('error', (error) => {
      this._handleError(error, response, callback);
    });
  }

  _handleData(data, response, callback) {
    response.removeAllListeners();

    const error = response.statusCode === 200 ?
      null : new ModelError(data, response.statusCode);

    callback(error, this._object.data(), this._object);
  }

  _handleError(error, response, callback) {
    response.removeAllListeners();
    callback(error);
  }
}
