function end(field, value, fields) {
  if (value) {
    fields[field] = fields[field] || [];
    fields[field].push(value);
  }

  return fields;
}

export default function parseFilter(filter, translate) {
  let fields = {};
  let field = '';
  let value = '';
  let enclosed = false;
  let i = 0;

  for (; i < filter.length; i += 1) {
    if (filter[i] === '"') {
      enclosed = !enclosed;
    } else if (filter[i] === ' ') {
      if (enclosed === true) {
        value += filter[i];
      } else if (enclosed === false) {
        fields = end(field, value, fields);
        value = '';
        field = '';
      }
    } else if (filter[i] === ':') {
      field = translate ? translate(value) : value;
      value = '';
    } else {
      value += filter[i];
    }
  }

  return end(field, value, fields);
}
