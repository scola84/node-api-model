function set(value, diff) {
  const path = [...diff.path];
  const end = path.pop();

  let target = value;

  path.forEach((key) => {
    target = target[key];
  });

  if (typeof end === 'undefined') {
    value = diff.val;
  } else if (typeof diff.val === 'undefined') {
    delete target[end];
  } else {
    target[end] = diff.val;
  }

  return value;
}

function add(value, diff) {
  let target = value;

  diff.path.forEach((key) => {
    target = target[key];
  });

  target.splice(diff.index, 0, ...diff.vals);

  return value;
}

function remove(value, diff) {
  let target = value;

  diff.path.forEach((key) => {
    target = target[key];
  });

  target.splice(diff.index, diff.num);

  return value;
}

export default function apply(value, diffs) {
  diffs.forEach((diff) => {
    switch (diff.type) {
      case 'set':
        value = set(value, diff);
        break;
      case 'add':
        value = add(value, diff);
        break;
      case 'rm':
        value = remove(value, diff);
        break;
    }
  });

  return value;
}
