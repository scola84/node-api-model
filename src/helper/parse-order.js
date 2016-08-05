export default function parseOrder(order) {
  order = order.length > 0 ? order.split(';') : [];

  return order.reduce((fields, part) => {
    const [field, direction] = part.split(':');
    fields[field] = direction;
    return fields;
  }, {});
}
