import { ScolaError } from '@scola/error';
import Query from '../query';

export default class MetaQuery extends Query {
  constructor() {
    super();
    this._type = null;
  }

  type(value) {
    this._type = value;
    return this;
  }

  execute(callback, force) {
    this._list.data((error, data) => {
      if (error) {
        callback(error);
        return;
      }

      if (data && force !== true) {
        callback(null, data, this._list);
        return;
      }

      this._list.query((listError, filter, order) => {
        if (listError) {
          callback(new ScolaError('400 invalid_input ' + listError.message));
          return;
        }

        this._query(filter, order, (queryError, queryData) => {
          this._handleQuery(queryError, queryData, callback);
        });
      });
    });
  }

  _handleQuery(error, data, callback) {
    if (error) {
      callback(new ScolaError('500 invalid_query ' + error.message));
      return;
    }

    this._list.data(data, (listError) => {
      callback(listError, data, this._list);
    });
  }
}
