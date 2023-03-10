import axios from 'axios';

const host = process.env.NODE_ENV === 'development' ? 'localhost' : '192.168.43.203';

async function piQuery(method, params) {
  return axios.post(`https://${host}/api/${method}`, params)
    .then(response => {
      if (response.data.status === 'error') throw new Error(response.data.message);
      return response.data.response;
    })
    .catch(err =>  {
      console.error('[piQuery]', `${err.name}:`, err.message, params);
      throw err;
    });
}

export default piQuery