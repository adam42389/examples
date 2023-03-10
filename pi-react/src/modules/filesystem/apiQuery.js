import axios from 'axios';

async function apiQuery(url, options, delayMS = 0) { 
  if (delayMS) await new Promise(resolve => {setTimeout(() => resolve(1), delayMS);});

  if (!options) options = {};
  if (!options.method) options.method = 'GET';
  options.url = url;

  return axios.request(options)
    .then(response => {
      return response.data;
    })
    .catch(err =>  {
      console.error('[apiQuery]', `${err.name}:`, err.message, url, options);
      throw err;
    }); 
} 

export default apiQuery;