//to make sure if the evironment is not production and its a development environment
//OPENWEATHER_API_KEY = 583f79a173f1abb5b205b7bfdefe11c9
/*import express from 'express';
import path from 'path';
import weatherData from './weatherdata.js'*/
const express = require('express');
const path = require('path');
const hbs = require('hbs');
const nano = require('nano')
const app = express();
const weatherData = require('./weatherdata.js')
const weatherForecastData = require('./futureWeather.js')


//initializa a port
const port = process.env.PORT || 2000;

//Determoine the path
const publicPath = path.join(__dirname, "./public");
//determine the path of the index folder
const viewsPath = path.join(__dirname, "./templates/views");
const partialsPath = path.join(__dirname, "./templates/partials");

//hbs is view engine
app.set("view engine", "hbs");
app.set("views", viewsPath);
app.use(express.static(publicPath));
//hbs view engine. partials has reuadle html attributes
hbs.registerPartials(partialsPath);

//no need to pass the path of index again as i tis taken care by app.set(views,viewPath)
app.get('/', (req, res) =>{
    res.render('index', {title:'weather app'});
});
//end pint to print Live weather
app.get("/weather" ,(req,res)=>{
    if(!req.query.address){
        return res.send('Address is required')
    }
    weatherData(req.query.address,(error,result)=>{
        if(error){
            return res.send(error);
        }
        res.send(result);
    }) ;
})
//Endpoint for forcast/future weather
app.get("/futureweather", (req, res) => {
    if (!req.query.lat || !req.query.lon) {
      return res.send("Latitude and Longitude are required");
    }
  
    const latitude = req.query.lat;
    const longitude = req.query.lon;
  
    weatherForecastData(latitude, longitude, (error, result) => {
      if (error) {
        return res.send(error);
      }
      res.send(result);
    });
  });



//database configuraton
const user ='alfa', password ='alfa';
const dbName ='weather_history';
//bind with couch db
const db = nano(`http://${user}:${password}@127.0.0.1:5984`).db.use(dbName);
app.use(express.json());

//end point to save the data on DB
app.post('/saveWeatherData', (req,res)=>{
  const weatherData = req.body;
  db.insert(weatherData)
    .then((body) =>{
      res.json({success:true, data:body});
    })
    .catch((err) =>{
      console.error('Error saving weather data to CouchDB:', err.message);
      res.json({ success: false, message: 'Error saving weather data to CouchDB' });
    })
})
app.get('/retrieveWeatherData', (req, res) => {
  db.list('weather', 'byType', {
    key: 'weather_data',
    include_docs: true
  })
    .then(weatherDataResult => {
      const documents = weatherDataResult.rows
       // .filter(row => !row._id.startsWith('_design/')) // Exclude design documents
        .map(row => row.doc);
      console.log('Transformed data', documents);
      res.json({ success: true, weatherData: documents });
    })
    .catch(error => {
      console.error('Error retrieving documents:', error);
      res.status(500).json({ success: false, message: 'Error occurred' });
    });
});



//not found route
app.get('*',(req,res) =>{
  res.render ('404',{title:'Page not found'});
})

app.listen(port, () =>{
    console.log('server is listening on port :'+port);
})