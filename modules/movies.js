require('dotenv').config();
const superagent = require('superagent');
const pg = require('pg');

const client = new pg.Client(process.env.DATABASE_URL);
client.on('err', err => console.error(err));

function Movies(movie) {
  this.title = movie.title;
  this.overview = movie.overview;
  this.average_votes = movie.vote_average;
  this.total_votes = movie.vote_count;
  this.image_url = `https://image.tmdb.org/t/p/original${movie.poster_path}`;
  this.popularity = movie.popularity;
  this.released_on = movie.release_date;
  this.created_on = Date.now();
}

Movies.getMovies = (request, response) => {
  const url = `https://api.themoviedb.org/3/movie/now_playing?api_key=${process.env.MOVIE_API_KEY}`;
  superagent.get(url)
    .then( data => {
      const movieSummaries = data.body.results.map(movie => {
        return new Movies(movie);
      });
      response.status(200).json(movieSummaries);
    })
    .catch( ()=> {
      errorHandler('No movies for you!', request, response);
    });
}

client.connect();

module.exports = Movies;
