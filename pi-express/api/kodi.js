const axios = require('axios');
const path = require('path');
const fs = require('fs/promises');
const Jimp = require('jimp');
const WebSocket = require('ws');
const validate = require('./modules/validate.js');
const filmDataTally = require('./modules/filmDataTally.js');

const kodiHost = process.env.NODE_ENV === 'development' ? 'raspberrypi' : 'localhost';
const libraryPathProd = require('./modules/filmLibraryPath.json');
const filmAppDir = path.resolve(__dirname, '../public/film/');
const tmdbHost = 'https://api.themoviedb.org/3';
const tmdbPosterHost = 'https://image.tmdb.org/t/p/original';
const tmdbApiKey = 'XXXXXXXXXXXXXXXXXXX';

class kodi {
  static async getVolume() {
    return await _rpc('Application.GetProperties', {properties: ['volume']});
  }
  
  static async setVolume(params) {
    validate(params, {volume: 'int'});
    const volume = Math.max(Math.min(params.volume, 100), 0);
    return await _rpc('Application.SetVolume', {volume});
  }

  static async clean() {
    await _rpc('VideoLibrary.Clean');
  }

  static async scan() {    
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(`ws://${kodiHost}:9090/jsonrpc`);
      
      ws.on('open', () => {
        ws.send(JSON.stringify({jsonrpc: '2.0', id: '1', method: 'VideoLibrary.Scan'}));
      });

      ws.on('error', err => {
        ws.terminate();
        reject(new Error(err.message));
      });

      ws.on('message', msg => {
        const data = JSON.parse(msg);
        if (data.method === 'VideoLibrary.OnScanFinished') {
          ws.terminate();
          resolve();
        }
      });

      setTimeout(() => {
        ws.terminate();
        reject(new Error('Timeout (20 minutes).'));
      }, 1200000);
    });
  }

  static async film(params) {
    validate(params, {id: 'int+'});
    await _rpc('Player.Open', {item: {movieid: params.id}});
  }

  static async music(params) {
    validate(params, {ids: 'arr+'});
    validate(params.ids, ['int+']);
    
    params.ids = params.ids.map(id =>{
      return {songid: id}
    })

    await _rpc('Player.Stop', {playerid: 0});
    await _rpc('Playlist.Clear', {playlistid: 0});
    await _rpc('Playlist.Add', {playlistid: 0, item: params.ids});
    await _rpc('Player.Open', {item: {playlistid: 0}});
  }

  static async nfo() {
    const params = {
        options: {
          overwrite: false,
          actorthumbs: true,
          images: true
        }
      }
    await _rpc('VideoLibrary.Export', params);
  }

  static async viewed() {
    const params = {
      filter: {
        field: 'playcount',
        operator: 'greaterthan',
        value: '0'
      },
      properties: ['file', 'year'],
    };
    
    let viewedFilms = await _rpc('VideoLibrary.GetMovies', params);
    if (viewedFilms.limits.end === 0) return []; 
    const libraryPathLen = libraryPathProd.length;

    viewedFilms = viewedFilms.movies.flatMap(film => {
      if (film.file.substring(0, libraryPathLen) !== libraryPathProd) return [];
      return [{
        title: `${film.label} (${film.year})`,
        path: path.dirname(film.file.substring(libraryPathLen)),
      }];
    });

    return viewedFilms;
  }

  static async database() {
    const params = {
      filter: {
        field: 'path',
        operator: 'startswith',
        value: libraryPathProd,
      },
      properties: ['year', 'genre', 'runtime', 'plot', 'country', 'art', 'file', 'imdbnumber'],
    };
    let filmData = await _rpc('VideoLibrary.GetMovies', params);

    const issues = [];
    const films = [];
   
    const postersPath = path.join(filmAppDir, '/posters');
    try {
      await fs.access(postersPath);
    } catch {
      await fs.mkdir(postersPath);
    }

    let posterList = await fs.readdir(postersPath);
    
    filmData.movies.sort((a, b) => {
      if (a.label < b.label) return -1;
      if (a.label > b.label)return 1;
      return 0;
    });

    for (const film of filmData.movies) {
      const filmName = `${film.label} (${film.year})`;

      if (!film.genre.length) {
        issues.push(`'${filmName}' has no genre.`);
        continue;
      }
      if (!film.country) {
        issues.push(`'${filmName}' has no country.`);
        continue;
      }

      const details = {
        country: film.country[0] === 'United States of America' ? 'United States' : film.country[0],
        genre: film.genre,
        title: film.label,
        id: film.movieid,
        plot: film.plot,
        runtime: Math.ceil(film.runtime / 60),
        year: film.year,
        poster: `${_clean(`${film.label.replaceAll(' ', '_').replaceAll('?', '_')}_${film.year}`)}.jpg`,
      };

      const index = posterList.indexOf(details.poster);
      if (index !== -1) {
        posterList.splice(index, 1);
        films.push(details);
        continue;
      }
      
      const diskPosterPath = film.file.replace(path.extname(film.file), '-poster.jpg');
      const appPosterPath = path.join(postersPath, details.poster);

      try {
        await fs.access(diskPosterPath);
        await fs.copyFile(diskPosterPath, appPosterPath);
        films.push(details);
        continue;
      } catch {}

      if (film.art.poster) {
        const dbPosterPath = decodeURIComponent(film.art.poster).slice(8, -1);
        
        try {
          if (dbPosterPath.substring(0, 4) === 'http') await _downloadImage(dbPosterPath, diskPosterPath);
          else await fs.copyFile(dbPosterPath, diskPosterPath);
          await fs.copyFile(diskPosterPath, appPosterPath);
          films.push(details);
          continue;
        } catch {}
      }

      try {
        let url = tmdbHost;
        if (film.imdbnumber) url += `/find/${film.imdbnumber}?api_key=${tmdbApiKey}&external_source=imdb_id`;
        else  url += `/search/movie?api_key=${tmdbApiKey}&query=${film.label}&year=${film.year}`;
        
        const response = await axios.get(url);
        let posterPath;
        if (film.imdbnumber)  posterPath = response.data?.movie_results[0]?.poster_path;
        else posterPath = response.data?.results[0]?.poster_path;
        if (!posterPath) throw new Error('Poster search no result');

        await _downloadImage(tmdbPosterHost+posterPath, diskPosterPath);
        await fs.copyFile(diskPosterPath, appPosterPath);
        films.push(details);
        continue;
      } catch {}

      issues.push(`'${filmName}' has no poster.  Save to: ${diskPosterPath}`);
    };

    for (const extraFile of posterList) {
      await fs.unlink(path.join(postersPath, extraFile));
    }

    const fullData = filmDataTally(films);
    await fs.writeFile(path.join(filmAppDir, 'data.json'), JSON.stringify(fullData)); 
    return {issues};
  }
}

async function _rpc(method, params) {
  let data = {method, jsonrpc: '2.0', id: '1'};
  if (params) data.params = params;

  return axios({
    method: 'post',
    url: `http://${kodiHost}:8080/jsonrpc`,
    data: data,
  })
  .then(function (response) {
    if (response.data.error) throw new Error(`JSONRPC: ${response.data.error.message}`);
    return response.data.result;
  });
}

async function _downloadImage(url, localPath) {
  const image = await Jimp.read(url);
  image.resize(Jimp.AUTO, 540);
  await image.writeAsync(localPath);
}

function _clean(name) {
    return name.normalize("NFD").replace(/\?|:|[\u0300-\u036f]/g, "").replace(/\/|\*/g, " ").replaceAll('–', '-');
}

module.exports = kodi;