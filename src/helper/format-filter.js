function formatValue(value) {
  if (typeof value === 'number') {
    return value;
  } else if (!isNaN(value) || value.indexOf(' ') !== -1) {
    return '"' + value + '"';
  }

  return value;
}

export default function formatFilter(filter) {
  return Object.keys(filter).map((key) => {
    return key +
      (key ? ':' : '') +
      filter[key].map(formatValue).join(' ');
  }).join(' ');
}
