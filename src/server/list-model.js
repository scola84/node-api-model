import ServerList from './list';

export default class ServerListModel {
  constructor() {
    this._name = null;
    this._groups = null;
    this._total = null;
    this._select = null;
  }

  name(name) {
    this._name = name;
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
      .name(this._name)
      .groups(this._groups)
      .total(this._total)
      .select(this._select)
      .filter(params.filter)
      .order(params.order);
  }
}
