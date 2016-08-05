export default function formatOrder(order) {
  return Object.keys(order).map((field) => {
    return field + ':' + order[field];
  }).join(';');
}
