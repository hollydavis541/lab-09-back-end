'use strict';

require('dotenv').config();

//Dependencies and setup
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const pg = require('pg');
const PORT = process.env.PORT || 3000;
const app = express();
app.use(cors());
const Location = require('./modules/locations');
const Weather = require('./modules/weather');

//Configure Database
const client = new pg.Client(process.env.DATABASE_URL);
client.on('err', err => console.error(err));

//Errors
function notFoundHandler(request,response) {
  response.status(404).send('huh?');
}
function errorHandler(error,request,response) {
  response.status(500).send(error);
}

//Constructor Functions
// function Location(query, data){
//   this.search_query = query;
//   this.formatted_query = data.formatted_address;
//   this.latitude = data.geometry.location.lat;
//   this.longitude = data.geometry.location.lng;
// }

// //Define a prototype function to save data to DB
// Location.prototype.save = function(){
//   const SQL = `INSERT INTO locations
//   (search_query, formatted_query, latitude, longitude)
//   VALUES ($1, $2, $3, $4)
//   RETURNING *`;

//   let values = Object.values(this);
//   return client.query(SQL, values);
// };

// //My Static Constructor Functions

// Location.fetchLocation = function (query){
//   const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${process.env.GEOCODE_API_KEY}`;

//   return superagent.get(url)
//     .then( result=> {
//       if(!result.body.results.length) {throw 'No data';}
//       let location = new Location(query, result.body.results[0]);
//       return location.save()
//         .then( result => {
//           location.id = result.rows[0].id; //update, delete...etc...
//           return location;
//         });
//     });
// };

// Location.lookup();

// Location.lookup = (handler) => {
//   const SQL = `SELECT * FROM locations WHERE search_query=$1`;
//   const values = [handler.query];

//   return client.query(SQL, values)
//     .then( results => {
//       if (results.rowCount > 0){
//         handler.cacheHit(results);
//       }else {
//         handler.cacheMiss();
//       }
//     })
//     .catch(console.error);
// };

// function Weather(day) {
//   this.forecast = day.summary;
//   this.time = new Date(day.time * 1000).toString().slice(0,15);
// }

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

function Yelp(review) {
  this.name = review.name;
  this.rating = review.rating;
  this.price = review.price;
  this.url = review.url;
  this.image_url = review.image_url;
  this.created_at = Date.now();
}

function Trail(trail) {
  this.name = trail.name;
  this.location = trail.location;
  this.length = trail.length;
  this.stars = trail.stars;
  this.star_votes = trail.starVotes;
  this.summary = trail.summary;
  this.trail_url = trail.url;
  this.conditions = trail.conditionStatus;
  this.condition_date = trail.conditionDate;
  this.condition_time = trail.conditionDate;
  this.created_at = Date.now();
}

// API Routes

app.get('/location', getLocation);
app.get('/weather', Weather.getWeather);
app.get('/movies', getMovies);
app.get('/yelp', getYelp);
app.get('/trails', getTrails);

//Route Handlers

function getLocation(request,response) {

  const locationHandler = {
    query: request.query.data,

    cacheHit: (results) => {
      console.log('Got data from DB');
      response.send(results.rows[0]);
    },

    cacheMiss: () => {
      console.log('No data in DB, fetching...');
      Location.fetchLocation(request.query.data)
        .then( data => response.send(data));
    }
  };
  Location.lookup(locationHandler);
}

// function getWeather(request, response) {
//   const url = `https://api.darksky.net/forecast/${process.env.WEATHER_API_KEY}/${request.query.data.latitude},${request.query.data.longitude}`;
//   superagent.get(url)
//     .then( data => {
//       const weatherSummaries = data.body.daily.data.map(day => {
//         return new Weather(day);
//       });
//       response.status(200).json(weatherSummaries);
//     })
//     .catch( ()=> {
//       errorHandler('No weather for you!', request, response);
//     });
// }

function getMovies(request, response) {
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

function getYelp(request, response) {
  const url = `https://api.yelp.com/v3/businesses/search?latitude=${request.query.data.latitude}&longitude=${request.query.data.longitude}`;
  return superagent.get(url)
    .set('Authorization', `Bearer ${process.env.YELP_API_KEY}`)
    .then(result => {
      const yelpSummaries = result.body.businesses.map(review => {
        const summary = new Yelp(review);
        // summary.save(location.id);
        return summary;
      });
      response.status(200).json(yelpSummaries);
    })
    .catch( ()=> {
      errorHandler('No movies for you!', request, response);
    });
}

function getTrails(request, response) {
  const url = `https://www.hikingproject.com/data/get-trails?lat=${request.query.data.latitude}&lon=${request.query.data.longitude}&key=${process.env.TRAIL_API_KEY}`
  superagent.get(url)
    .then( data => {
      const trailSummaries = data.body.trails.map(trail => {
        const summary = new Trail(trail);
        return summary
      });
      response.status(200).json(trailSummaries);
    })
    .catch( ()=> {
      errorHandler('No trails for you!', request, response);
    });
}

app.use('*', notFoundHandler);
app.use(errorHandler);

// HELPER FUNCTIONS

// Make sure the server is listening for requests
client.connect()
  .then( ()=> {
    app.listen(PORT, ()=> {
      console.log('server and db are up, listening on port ', PORT);
    });
  });
