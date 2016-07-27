export default function formatError(string, error, callback) {
  if (error instanceof Error) {
    return error.message;
  }

  const fields = error.fields || {};
  const values = error.values || {};

  let text = '';

  Object.keys(fields).forEach((field) => {
    text += string.format('scola.api-model.not_valid.field_begin', {
      field: callback ? callback(field) : field
    });

    fields[field].forEach((reason, index) => {
      text += index === 0 ? '' :
        string.format('scola.api-model.not_valid.delimiter' +
          (index === fields[field].length - 1 ? '_final' : '_middle'));
      text += string.format('scola.api-model.not_valid.iz_' + reason,
        values[field] && values[field][reason]);
    });

    text += string.format('scola.api-model.not_valid.field_end');
  });

  return text;
}
