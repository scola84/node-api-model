import Request from '../request';

export default class GroupsRequest extends Request {
  execute(callback = () => {}) {
    if (this._list.meta('groups')) {
      callback(null, this._list.meta('groups'));
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
      if (callback) {
        callback(filterError || orderError);
      }

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
      null : new Error(data);

    if (response.statusCode === 200) {
      this._list.count(data.count);
      this._list.meta('groups', data.groups);
    }

    callback(error, data.groups, this._list);
  }

  _handleError(error, response, callback) {
    response.removeAllListeners();
    callback(error);
  }
}
