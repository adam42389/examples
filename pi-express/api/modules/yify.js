const path = require('path');
const axios = require('axios');
const Zip = require('adm-zip');
const chardet = require('chardet');
const iconv = require('iconv-lite');

const yifyHost = 'https://yifysubtitles.org';

class yify {
  static async search(language, imdbid) {
    await new Promise(resolve => {setTimeout(() => resolve(1), 300);});
 
    let filmPageRes;
    try {
      filmPageRes = await axios.get(`${yifyHost}/movie-imdb/${imdbid}`);
    }
    catch {
      return;
    }

    const userLang = language[0].toLowerCase();
    let downloadPageUrl;

    for (const line of filmPageRes.data.split('\n')) {
      if (!line.includes('<a href="/subtitles')) continue;

      const link = yifyHost+line.slice(line.indexOf('<a href="') + 9, line.indexOf('"><span'));  
      const filmLang = link.split('-').slice(-3, -2)[0];

      if (filmLang === userLang) {
        downloadPageUrl = link;
        break;
      }
    }

    if (!downloadPageUrl) return;
    
    await new Promise(resolve => {setTimeout(() => resolve(1), 300);});
    const downloadPageRes = await axios.get(downloadPageUrl);
    let downloadZipUrl;

    for (const line of downloadPageRes.data.split('\n')) {
      if (!line.includes('<a class="btn-icon download-subtitle')) continue;
      const start = line.indexOf('" href="') + 8;
      const end = line.indexOf('"><span');
      downloadZipUrl = yifyHost+line.slice(start, end);  
      break;
    }

    if (!downloadZipUrl) throw new Error('Invalid subtitle download page.');
    return downloadZipUrl;
  }

  static async download(url) {
    if (url.slice(-4) !== '.zip') throw new Error('Invalid URL.');
    
    await new Promise(resolve => {setTimeout(() => resolve(1), 300);});
    const response = await axios(url, {responseType: 'arraybuffer'}); 
   
    const zipFile = new Zip(response.data); 
    const zipEntries = zipFile.getEntries();

    let srtEntry;
    for (const entry of zipEntries) {
      if (path.extname(entry.entryName) === '.srt') {
        srtEntry = entry;
        break;
      }
    }
    if (!srtEntry) throw new Error('Cannot extract subtitle file from zip.');
  
    const subBuffer = srtEntry.getData();
    const encoding = chardet.detect(subBuffer);
    const subtitleStr = iconv.decode(subBuffer, encoding);
    return subtitleStr;
  }
}

module.exports = yify; 