import odiff from 'odiff';
import ModelError from '../../error';
import Request from '../request';

export default class UpdateRequest extends Request {
  execute(data, callback = () => {}) {
    const changed = Object.assign({}, this._object.data(), data);
    const diff = odiff(this._object.data(), changed);

    if (diff.length === 0) {
      callback();
      return;
    }

    this._validate(data, (error) => {
      this._handleValidate(error, data, callback);
    });
  }

  _handleValidate(error, data, callback) {
    if (error) {
      callback(error);
      return;
    }

    this._request(data, callback);
  }

  _request(data, callback) {
    const request = {
      method: 'PUT',
      path: '/' + this._object.name() + '/' + this._object.id()
    };

    this._object.connection()
      .request(request, (response) => {
        this._handleResponse(response, callback);
      })
      .end(data);
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

    if (response.statusCode === 200) {
      this._object.data(data);
    }

    callback(error, this._data, this._object);
  }

  _handleError(error, response, callback) {
    response.removeAllListeners();
    callback(error);
  }
}
