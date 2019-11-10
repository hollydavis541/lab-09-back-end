'use strict';

require('dotenv').config();

//Dependencies and setup
const express = require('express');
const cors = require('cors');
const pg = require('pg');
const PORT = process.env.PORT || 3000;
const app = express();
app.use(cors());
const Location = require('./modules/locations');
const Weather = require('./modules/weather');
const Movies = require('./modules/movies');
const Yelp = require('./modules/yelp');
const Trail = require('./modules/trails');

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

// API Routes

app.get('/location', getLocation);
app.get('/weather', Weather.getWeather);
app.get('/movies', Movies.getMovies);
app.get('/yelp', Yelp.getYelp);
app.get('/trails', Trail.getTrails);

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
