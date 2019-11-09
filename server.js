'use strict';

//Load environment variables from the .env file
require('dotenv').config();

//Dependencies and Setup
const express = require('express'); //Express is a package that enhances Node.js
const cors = require('cors'); //Cross-Origin Resource Sharing defines origins for sharing for security reasons
const superagent = require('superagent'); //superagent handles API requests
const pg = require('pg'); //postgres allows for database creation
const PORT = process.env.PORT || 3000; //Sets the port indicated in the .env file and a fallback port if that's not found
const app = express(); //Sets "app" to the express function
app.use(cors()); //Tells Express to use the cors package

//Configure Database
const client = new pg.Client(process.env.DATABASE_URL); //Sets "client" to the city_explorer database object (city_explorer is the database references in the URL in the .env)
client.on('err', err => console.error(err)); //If there is an error connecting to the data, this function logs that error

//Error Handlers
function notFoundHandler(request,response) {
  response.status(404).send('huh?');
}
function errorHandler(error,request,response) {
  response.status(500).send(error);
}

//Location Constructor
function Location(query, data){
  this.search_query = query; //Returns "search_query: 'madras, or'," when "Madras, OR" searched for on site (this Madras instantiation happens in the Location.fetchLocation function below)
  this.formatted_query = data.formatted_address; //Returns "'Madras, OR 97741, USA'"
  this.latitude = data.geometry.location.lat; //Returns "44.6334544" for Madras
  this.longitude = data.geometry.location.lng; //Returns "-121.1294872" for Madras
}

//Location prototype constructor function that saves instantiated location to the database (called in Location.fetchLocation below if not aleady in database)
Location.prototype.save = function(){
  const SQL = `INSERT INTO locations
  (search_query, formatted_query, latitude, longitude)
  VALUES ($1, $2, $3, $4)
  RETURNING *`; //Adds searched for location as a new row in the locations table
  let values = Object.values(this);
  return client.query(SQL, values);
};

//Location static constructor function that gets information from the API
Location.fetchLocation = function (query){
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${process.env.GEOCODE_API_KEY}`;
  return superagent.get(url)
    .then( result => {
      //if what's returned from the API is empty, throw a 'No data' message (e.g. if you enter "jkjkjk" in location you will get this message in the terminal)
      if(!result.body.results.length) {throw 'No data';}
      let location = new Location(query, result.body.results[0]); //"body" is indicating entirety of what superagent gets from the API; "results" is the name of the first key in the geocoding data itself as seen in the sample here (https://developers.google.com/maps/documentation/geocoding/start); [0] is because you're only searching for one location at a time, so there's nothing after index zero
      return location.save()//Uses the function above to add a row to the database for the location
        .then( result => {
          location.id = result.rows[0].id; //Sets the location ID column for the new location row in the table (the number is auto-incremented via "serial" in the schema)
          return location;
        });
    });
};

//Location static constructor function that checks to see if searched for location is already in the table
Location.lookup = (handler) => {
  const SQL = `SELECT * FROM locations WHERE search_query=$1`; //$1 is what was searched for on the site (e.g. 'madras, or')
  const values = [handler.query]; //Returns "[ 'madras, or' ]" - QUESTION: Why does this need to be an array? The postgres documentation about client.query isn't clear to me
  return client.query(SQL, values)
    .then( results => {
      if (results.rowCount > 0){ //If the location is already in the database, the results.rowCount for the location will equal 1; if not in the database it will equal 0
        handler.cacheHit(results); //Uses cacheHit function to log "Got data from DB" to the console
      } else {
        handler.cacheMiss(); ////Uses cacheMiss function to log "No data in DB, fetching..." to the console
      }
    })
    .catch(console.error);
};

//Weather Constructor
function Weather(day) {
  this.forecast = day.summary;
  this.time = new Date(day.time * 1000).toString().slice(0,15);
}

//Movies Constructor
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

//Yelp Constructor
function Yelp(review) {
  this.name = review.name;
  this.rating = review.rating;
  this.price = review.price;
  this.url = review.url;
  this.image_url = review.image_url;
  this.created_at = Date.now();
}

//API Routes
app.get('/location', getLocation);
app.get('/weather', getWeather);
app.get('/movies', getMovies);
app.get('/yelp', getYelp);

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

function getWeather(request, response) {
  const url = `https://api.darksky.net/forecast/${process.env.WEATHER_API_KEY}/${request.query.data.latitude},${request.query.data.longitude}`;
  superagent.get(url)
    .then( data => {
      const weatherSummaries = data.body.daily.data.map(day => {
        return new Weather(day);
      });
      response.status(200).json(weatherSummaries);
    })
    .catch( ()=> {
      errorHandler('No weather for you!', request, response);
    });
}

function getMovies(request, response) {
  const url = `https://api.themoviedb.org/3/movie/now_playing?api_key=${process.env.MOVIE_API_KEY}`;
  superagent.get(url)
    .then( data => {
      const movieSummaries = data.body.results.map(movie => {
        return new Movies(movie);
      });
      console.log(movieSummaries);
      response.status(200).json(movieSummaries);
    })
    .catch( ()=> {
      errorHandler('No movies for you!', request, response);
    });
}

function getYelp(request, response) {
  const url = `https://api.yelp.com/v3/businesses/search?location=${request.query.data.search_query}`;
  console.log(url);
  superagent.get(url)
    .set('Authorization', `Bearer ${process.env.YELP_API_KEY}`)
    .then(result => {
      const yelpSummaries = result.body.businesses.map(review => {
        const summary = new Yelp(review);
        // console.log(summary);
        return summary;
      });
      return yelpSummaries;
    })
    .catch( ()=> {
      errorHandler('No movies for you!', request, response);
    });
}

app.use('*', notFoundHandler);
app.use(errorHandler);

// Make sure the server is listening for requests
client.connect()
  .then( ()=> {
    app.listen(PORT, ()=> {
      console.log('server and db are up, listening on port', PORT);
    });
  });


