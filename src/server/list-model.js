import ServerList from './list';

export default class ServerListModel {
  constructor() {
    this._model = null;
    this._groups = null;
    this._total = null;
    this._select = null;
  }

  model(model) {
    this._model = model;
    return this;
  }

  groups(groups) {
    this._groups = groups;
    return this;
  }

  total(total) {
    this._total = total;
    return this;
  }

  select(select) {
    this._select = select;
    return this;
  }

  create(id, params) {
    return new ServerList()
      .id(id)
      .filter(params.filter)
      .order(params.order)
      .model(this._model)
      .groups(this._groups)
      .total(this._total)
      .select(this._select);
  }
}
