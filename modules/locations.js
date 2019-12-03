require('dotenv').config();
const superagent = require('superagent');
const pg = require('pg');

const client = new pg.Client(process.env.DATABASE_URL);
client.on('err', err => console.error(err));

function Location(query, data){
  this.search_query = query;
  this.formatted_query = data.formatted_address;
  this.latitude = data.geometry.location.lat;
  this.longitude = data.geometry.location.lng;
  this.created_at = Date.now();
}

//Define a prototype function to save data to DB
Location.prototype.save = function(){
  const SQL = `INSERT INTO locations
  (search_query, formatted_query, latitude, longitude, created_at)
  VALUES ($1, $2, $3, $4, $5)
  RETURNING *`;

  let values = Object.values(this);
  return client.query(SQL, values);
};

//My Static Constructor Functions

Location.fetchLocation = function (query){
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${process.env.GEOCODE_API_KEY}`;

  return superagent.get(url)
    .then( result=> {
      if(!result.body.results.length) {throw 'No data';}
      let location = new Location(query, result.body.results[0]);
      return location.save()
        .then( result => {
          location.id = result.rows[0].id; //update, delete...etc...
          return location;
        });
    });
};

// function deleteLocation(request, response) {
//   // const SQL = `DELETE FROM locations WHERE search_query='bend, or';`
//   const SQL = `DELETE FROM locations WHERE search_query='${results.rows[0].search_query}';`
//   client.query(SQL);
// }

Location.lookup = (handler) => {
  const SQL = `SELECT * FROM locations WHERE search_query=$1`;
  const values = [handler.query];

  return client.query(SQL, values)
    .then( results => {
      // console.log(results.rows[0].search_query);
      // let dataAge = Date.now() - (results.rows[0].created_at);
      // console.log(dataAge);
      // console.log(results.rows[0].created_at);
      if (results.rowCount > 0 && (Date.now() - (results.rows[0].created_at)) < 360){
        console.log('Got data from DB');
        handler.cacheHit(results);
      } else if (results.rowCount > 0 && (Date.now() - (results.rows[0].created_at)) >= 360) {
        console.log('In DB, but too old, fetching new info from API');
        // `DELETE FROM locations WHERE search_query=$1;`;
        // deleteLocation();
        const sqlDelete = `DELETE FROM locations WHERE search_query='${results.rows[0].search_query}';`
        client.query(sqlDelete);
        handler.cacheMiss();
      } else {
        console.log('No data in DB, fetching...');
        handler.cacheMiss();
      }
    })
    .catch(console.error);
};

client.connect()

module.exports = Location;
