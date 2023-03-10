import piQuery from '../piQuery.js';

class Subtitle {
  static async search(language, imdbid, tmdbid, videoPath) {
    if ((!imdbid && !tmdbid) || !language) throw new Error('Missing parameters.');

    imdbid = imdbid || '';
    tmdbid = tmdbid || 0;
    
    const cache = Subtitle._getCache(language, imdbid, tmdbid);
    if (cache) return cache.result;

    const result = await piQuery('subtitle/search', {imdbid, tmdbid, language, filename: videoPath});
    Subtitle._setCache(language, imdbid, tmdbid, result);
    return result;
  }

  static async download(savePath, searchResult) {
    try {
      await piQuery('subtitle/download', {path: savePath, source: searchResult.source, value: searchResult.value}); 
    }
    catch {}
  }

  static _getCache(language, imdbid, tmdbid) {
    const key = `sub-${language[1]}-${imdbid}-${tmdbid}`;
    return JSON.parse(localStorage.getItem(key));
  }

  static _setCache(language, imdbid, tmdbid, result) {
    const key = `sub-${language[1]}-${imdbid}-${tmdbid}`;
    localStorage.setItem(key, JSON.stringify({result}));
  }
}

export default Subtitle;