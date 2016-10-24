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

  execute(request, callback, force) {
    this._list.data((cacheError, cacheData) => {
      this._handleData(cacheError, cacheData, callback, force);
    });
  }

  _handleData(cacheError, cacheData, callback, force) {
    if (cacheError) {
      callback(cacheError);
      return;
    }

    if (cacheData && force !== true) {
      callback(null, cacheData, this._list);
      return;
    }

    const filter = this._list.filter();
    const order = this._list.order();

    this._query(filter, order, (queryError, queryData) => {
      this._handleQuery(queryError, queryData, callback);
    });
  }

  _handleQuery(queryError, queryData, callback) {
    if (queryError) {
      callback(ScolaError.fromError(queryError, '500 invalid_query'));
      return;
    }

    this._list.data(queryData, (listError) => {
      callback(listError, queryData, this._list);
    });
  }
}
