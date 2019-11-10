require('dotenv').config();

//Dependencies and setup
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const pg = require('pg');
const app = express();
app.use(cors());

//Configure Database
const client = new pg.Client(process.env.DATABASE_URL);
client.on('err', err => console.error(err));

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

Trail.getTrails = (request, response) => {
  const url = `https://cors-anywhere.herokuapp.com/https://www.hikingproject.com/data/get-trails?lat=${request.query.data.latitude}&lon=${request.query.data.longitude}&key=${process.env.TRAIL_API_KEY}`
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

client.connect();

module.exports = Trail;
