import apiQuery from './apiQuery.js';
import languages from '../languages.json';

const tmdbHost = 'https://api.themoviedb.org/3';
const tmdbApiKey = 'XXXXXXXXXXXXXXXXXXX';
const omdbHost = 'https://www.omdbapi.com';
const omdbApiKey = 'XXXXXXXXXXXXXXXXXXX';

async function getLanguage(imdbid, tmdbid) {
  if (!imdbid && !tmdbid) throw new Error('Missing parameters.');

  const cache = _getCache(imdbid, tmdbid);
  if (cache) return cache;

  let tmdbResolved = tmdbid;

  if (!tmdbid) {
    const idUrl = `${tmdbHost}/find/${imdbid}?api_key=${tmdbApiKey}&external_source=imdb_id`;
    let idResponse = await apiQuery(idUrl);
    if (!idResponse?.movie_results.length) throw new Error('Invalid IMDB ID.');
    tmdbResolved = idResponse.movie_results[0].id;
  }

  const tmdbUrl = `${tmdbHost}/movie/${tmdbResolved}?api_key=${tmdbApiKey}`;
  let tmdbResponse = await apiQuery(tmdbUrl);
  if (!tmdbResponse) throw new Error('Invalid TMDB ID.'); 

  const filmLanguages = [];

  if (tmdbResponse?.spoken_languages.length) {
    for (const langData of tmdbResponse.spoken_languages) {
      for (const codes of languages) {
        if (codes[2] === langData.iso_639_1) {
          filmLanguages.push(codes);
          break;
        }
      }
    }
  }
  else if (tmdbResponse.original_language) {
    for (const codes of languages) {
      if (codes[2] === tmdbResponse.original_language) {
        filmLanguages.push(codes);
        break;
      }
    }
  }

  if (!filmLanguages.length && imdbid) {
    const url = `${omdbHost}/?apikey=${omdbApiKey}&i=${imdbid}`;
    const omdbResponse = await apiQuery(url, null, 300);
   
    if (omdbResponse.Error) throw new Error(omdbResponse.Error);
    const omdbLanguages = omdbResponse?.Language.split(', ');

    if (omdbLanguages.length) {
      for (const langFull of omdbLanguages) {
        for (const codes of languages) {
          if (codes[0] === langFull) {
            filmLanguages.push(codes);
            break;
          }
        }
      }
    } 
  }

  _setCache(imdbid, tmdbid, filmLanguages);
  return filmLanguages;
}

function _getCache(imdbid, tmdbid) {
  const key = `lan-${imdbid}-${tmdbid}`;
  return JSON.parse(localStorage.getItem(key));
}

function _setCache(imdbid, tmdbid, filmLanguages) {
  const key = `lan-${imdbid}-${tmdbid}`;
  localStorage.setItem(key, JSON.stringify(filmLanguages));
}

export default getLanguage;