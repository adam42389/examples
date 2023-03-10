const fs = require('fs/promises');
const path = require('path');
const parser = require('fast-xml-parser');
const he = require('he');
const validate = require('./modules/validate.js');
const resolvePath = require('./modules/resolvePath.js');

const videoExt = ['.mp4', '.mkv', '.avi', '.m4v', '.flv', '.mpg', 'webm'];
const subExt = ['.idx', '.sub', '.srt', '.ass', '.lrc', '.smi'];
const xmlOptions = {
    ignoreAttributes : false,
    attrValueProcessor: a => he.decode(a, {isAttributeValue: true}),
    tagValueProcessor: a => he.decode(a),
  };

const minVideoSize = process.env.NODE_ENV === 'development' ? 10 : 100000000;

class file {
  static path() {
    return {path: resolvePath.library()};
  }

  static async rename(params) {
    validate(params.rename, ['obj+']);

    for (const task of params.rename) {
      validate(task, {from: 'str+', to: 'str+'});
      const fullFrom = await resolvePath.exists(task.from);
      const fullTo = resolvePath.absolute(task.to);
      await fs.rename(fullFrom, fullTo);
    }
  }

  static async delete(params) {
    validate(params.delete, ['str+']);
    for (const relPath of params.delete) {
      try {
        const fullPath = await resolvePath.exists(relPath);
        await fs.rm(fullPath, {recursive: true});
      }
      catch {}
    }
  }

  static async language(params) {
    validate(params, {directory: 'str+', languages: 'arr+'});
    for (const codes of params.languages) {
      validate(codes, ['str+']);
      if (codes.length !== 3) throw new Error('Invalid parameters');
    }
    const fullDir = await resolvePath.exists(params.directory, true);
    await fs.writeFile(`${fullDir}/.language`, JSON.stringify(params.languages));
  }

  static async library() {
    const baseDirs = await resolvePath.list('/');
    let films = [];

    for (const filmDir of baseDirs) {
      let dirFiles =  await resolvePath.list(filmDir);
  
      let film = {
        dir: filmDir,
        files: {
          video: [],
          sub: [],
          jpg: [],
          nfo: null,
          other: []
        },
        languages: [],
      }

      for (const file of dirFiles) {
        const ext = path.extname(file);
   
        if (file === '/.language') {
          const langFilePath = resolvePath.absolute(`${filmDir}/.language`);
          
          try {
            const languageFile = await fs.readFile(langFilePath, 'utf8');
            const filmLanguages = JSON.parse(languageFile);
            if (!Array.isArray(filmLanguages)) throw new Error();
            film.languages = filmLanguages; 
          }
          catch {
            try {
              fs.unlink(langFilePath);
            }
            catch {}
          }
          continue;
        }

        if (ext === '.jpg') {
          film.files.jpg.push(file);
          continue;
        }

        if (ext === '.nfo') {
          try {
            const nfoFile = await fs.readFile(resolvePath.absolute(`${filmDir}/${file}`), 'utf8');
            const nfo = parser.parse(nfoFile, xmlOptions);
            if (!nfo.movie) throw new Error();

            film.title = nfo.movie.title;
            film.year = nfo.movie.year;
        
            if (!nfo.movie.uniqueid.length) nfo.movie.uniqueid = [nfo.movie.uniqueid];

            for (const id of nfo.movie.uniqueid) {
              if (id["@_type"] === 'imdb') film.imdbid = id["#text"];
              if (id["@_type"] === 'tmdb') film.tmdbid = id["#text"];
            }
            
            film.files.nfo = file;
          }
          catch {
            film.files.other.push(file);
          }  
          continue;
        }
        
        if (videoExt.includes(ext)) {
          const stat = await fs.stat(resolvePath.absolute(filmDir+file));
          if (stat.size > minVideoSize) film.files.video.push(file);
          else film.files.other.push(file);
          continue
        }
        
        if (subExt.includes(ext)) {
          film.files.sub.push(file);
          continue;
        }

        film.files.other.push(file);
      }
      films.push(film);
    }
    return films;
  }
}

module.exports = file;