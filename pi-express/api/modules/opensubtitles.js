const fs = require('fs/promises');
const path = require('path');
const ptn = require('parse-torrent-name');
const OSDbHash = require("osdb-hash");
const axios = require('axios');

const resolvePath = require('./resolvePath.js');

const osHost = 'https://api.opensubtitles.com/api/v1';
const osApiKey = 'XXXXXXXXXXXXXXXXXXX';

class opensubtitles {
  static async search(language, imdbid, tmdbid, filename) {

    let year;
    let query;
    let hash;
    
    if (filename) {
      query = path.basename(filename).toLowerCase();
      
      try {
        year = ptn(query).year;
        hash = await opensubtitles._hash(filename);
      }
      catch {}
    }

    let url = `${osHost}/subtitles?`;
    if (imdbid) url += `imdb_id=${parseInt(imdbid.replace('tt', '')).toString()}&`;
    url += `language=${language[1]}`;
    if (hash) url += `&moviehash=${hash}`;
    if (query) url += `&query=${query}`;
    if (tmdbid) url += `&tmdb_id=${tmdbid.toString()}`;
    url += '&type=movie';
    if (year) url += `&year=${year}`;

    await new Promise(resolve => {setTimeout(() => resolve(1), 300);});
    const response = await axios.request({
      method: 'GET',
      url,
      headers: {'api-key': osApiKey} 
    });

    if (!response.data.total_count) throw new Error('No subtitle found.');

    const subFileId = opensubtitles._findBest(response.data.data, language);
    if (!subFileId) throw new Error('No subtitle found.');

    return subFileId;
  }

  static async download(file_id) {
    await new Promise(resolve => {setTimeout(() => resolve(1), 300);});
    const details = await axios.request({
      method: 'POST',
      url: `${osHost}/download`,
      headers: {
        'api-key': osApiKey,
        accept: '*/*'
      },
      data: {file_id}
    });

    await new Promise(resolve => {setTimeout(() => resolve(1), 300);});
    const subtitleStr = await axios.get(details.data.link);
    return subtitleStr.data;
  }

  static async _hash(filename) {
    const fullPath = await resolvePath.exists(filename);
    const stat = await fs.stat(fullPath);
    if (stat.size < 32000000) return;

    try {
      const osdb = new OSDbHash(fullPath);
      const hash = await osdb.compute();
      return  hash;
    }
    catch {}
  }
  
  static _findBest(results, language) {
    let bestScore = 0;
    let bestIndex = -1;

    results.forEach((result, subIndex) => {
      const subtitle = result.attributes;
      if (subtitle.language !== language[2]) return;

      let score = results.length - subIndex;
      if (subtitle.moviehash_match) score += 5;
      if (subtitle.from_trusted) score += 1;

      if (score > bestScore) {
        bestScore = score;
        bestIndex = subIndex;
      }
    });

    if (bestIndex === -1) return null;
    return results[bestIndex].attributes.files[0].file_id;
  }
}

module.exports = opensubtitles; 