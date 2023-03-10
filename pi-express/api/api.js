const apiModules = {
  file: require('./file.js'),
  kodi: require('./kodi.js'),
  subtitle: require('./subtitle.js'),
}

async function api(req, res) {
  const method = req.params.method;
  const group = req.params.group;

  if (!apiModules[group]) throw new Error('Invalid class.');
  if (!apiModules[group][method]) throw new Error('Invalid method.');

  try {
    return await apiModules[group][method](req.method === 'POST' ? req.body : null);
  }
  catch (err) {
    err.message = `[${group}/${method}] ${err.message}`;
    throw err;
  }
}

module.exports = api;