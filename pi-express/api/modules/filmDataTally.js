function filmDataTally(filmList) {
  const genreList = [];
  const countryList = [];

  filmList.forEach((film, filmIndex) => {
    if (!countryList.includes(film.country)) countryList.push(film.country);
     
    film.genre.forEach(filmGenre => {
      if (!genreList.includes(filmGenre)) genreList.push(filmGenre);
    });
  });

  countryList.sort();
  genreList.sort();
  const numCountries = countryList.length;
  const numGenres = genreList.length;

  const tally = {
    country: new Array(numCountries).fill(0),
    genre: new Array(numGenres).fill(0),
    countryGenre: new Array(numCountries),
    genreCountry: new Array(numGenres),
  };

  const ids = {
    country: new Array(numCountries),
    genre: new Array(numGenres),
    countryGenre: new Array(numCountries),
  }; 

  filmList.forEach((film, filmIndex) => {
    const countryId = countryList.indexOf(film.country);
    tally.country[countryId]++;
    if (!ids.country[countryId]) ids.country[countryId] = [];
    ids.country[countryId].push(filmIndex);

    film.genre.forEach(filmGenre => {
      const genreId = genreList.indexOf(filmGenre);
      tally.genre[genreId]++;
      if (!ids.genre[genreId]) ids.genre[genreId] = [];
      ids.genre[genreId].push(filmIndex);
    });
  });
  
  ids.country.forEach((countryFilmIndexes, countryIndex) => {
    const countryTally = new Array(numGenres);
    const countryGenres = new Array(numGenres);
    
    ids.genre.forEach((genreFilmIndexes, genreIndex) => {
      const ids = [];
      
      countryFilmIndexes.forEach(filmIndex => {
        if (genreFilmIndexes.includes(filmIndex)) ids.push(filmIndex);
      });
      
      countryGenres[genreIndex] = ids.length ? ids : null;
      countryTally[genreIndex] = ids.length;
    });
    
    tally.countryGenre[countryIndex] = countryTally;
    ids.countryGenre[countryIndex] = countryGenres;
  })

  ids.genre.forEach((genreFilmIndexes, genreIndex) => {
    const genreTally = new Array(numCountries);

    ids.country.forEach((countryFilmIndexes, countryIndex) => {
      let countryTally = 0;

      genreFilmIndexes.forEach(filmIndex => {
        if (countryFilmIndexes.includes(filmIndex)) countryTally++;
      });

      genreTally[countryIndex] = countryTally;
    }); 

    tally.genreCountry[genreIndex] = genreTally;
  });

  return {
    total: filmList.length,
    films: filmList,
    labels: {country: countryList, genre: genreList},
    tally: tally,
    ids: ids,
  };
}

module.exports = filmDataTally;