export default function parseOrder(orders) {
  orders = orders.length > 0 ? orders.split(';') : [];

  return orders.reduce((fields, order) => {
    const [field, direction] = order.split(':');
    fields[field] = direction;
  }, {});
}
