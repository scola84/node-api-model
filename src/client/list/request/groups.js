import ModelError from '../../error';
import Request from '../request';

export default class GroupsRequest extends Request {
  execute(callback = () => {}) {
    if (this._list.meta('groups')) {
      callback(null, this._list.meta('groups'), this._list);
      return;
    }

    const filter = this._list.filter(true);
    const order = this._list.order(true);

    this._validate(filter, order, (filterError, orderError) => {
      this._handleValidate(filterError, orderError, filter, order, callback);
    });
  }

  _handleValidate(filterError, orderError, filter, order, callback) {
    if (filterError || orderError) {
      callback(filterError || orderError);
      return;
    }

    this._request(callback);
  }

  _request(callback) {
    const request = {
      path: '/' + this._list.name(),
      query: {
        filter: this._list.filter(),
        order: this._list.order(),
        meta: 'groups'
      }
    };

    this._list.connection()
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

    if (response.statusCode === 200) {
      this._list.meta('groups', data);
    }

    callback(error, data, this._list);
  }

  _handleError(error, response, callback) {
    response.removeAllListeners();
    callback(error);
  }
}
