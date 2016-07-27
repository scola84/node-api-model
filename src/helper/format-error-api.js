function formatValues(values) {
  return Object.keys(values).map((name) => {
    return values[name];
  }).join(',');
}

export default function formatError(error) {
  const fields = error.fields || {};
  const values = error.values || {};

  let text = '';

  Object.keys(fields).forEach((field) => {
    text += field;
    text += '=';

    fields[field].forEach((reason) => {
      text += reason;
      text += values[field] && values[field][reason] ?
        ':' + formatValues(values[field][reason]) : '';
      text += ';';
    });
  });

  return text;
}
