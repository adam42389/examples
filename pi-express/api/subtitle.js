const fs = require('fs/promises');
const path = require('path');
const yify = require('./modules/yify.js');
const opensubtitles = require('./modules/opensubtitles.js');
const validate = require('./modules/validate.js');
const srtClean = require('./modules/srtClean.js');
const resolvePath = require('./modules/resolvePath.js');

class subtitle {
  static async search(params) {
    validate(params, {imdbid: 'str', tmdbid: 'int', filename: 'str+', language: 'arr+'});
    validate(params.language, ['str+']);

    if (params.imdbid) {
      try {
        const url = await yify.search(params.language, params.imdbid);
        if (url) return {source: 'yify', value: url};
      }
      catch {}
    }
    
    try {
        const fileId = await opensubtitles.search(params.language, params.imdbid, params.tmdbid, params.filename);
        if (fileId) return {source: 'os', value: fileId};
      }
    catch {}

    return {source: null, value: null};
  }

  static async download(params) {
    validate(params, {source: 'str+', path: 'str+'});    
    let subtitleStr;

    switch (params.source) {
      case 'yify':
        validate(params.value, 'str+');  
        subtitleStr = await yify.download(params.value);
        break;
      case 'os':
        validate(params.value, 'int+'); 
        subtitleStr = await opensubtitles.download(params.value);
        break;
      default:
        throw new Error('Invalid subtitle source');
    }

    subtitleStr = srtClean(subtitleStr);
    const fullPath = resolvePath.absolute(params.path);
    if (path.extname(fullPath) !== '.srt')  throw new Error('Subtitle file must be .srt');
    await fs.writeFile(fullPath, subtitleStr);   
  }
}

module.exports = subtitle; 