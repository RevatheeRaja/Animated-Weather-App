// '/weather'
var weatherApi = '/weather';
var futureApi = '/futureweather';

// *******DOM Mapping
const weatherForm = document.querySelector('form');
// text input
const search = document.querySelector('input');
const searchBox = document.getElementById('searchBox');
const weatherIcon = document.querySelector('.weatherIcon i');
const weatherStatus = document.querySelector('.status');
const weatherLocation = document.querySelector('.location');
const weatherTemperature = document.querySelector('.Temperature');
const weatherFeels = document.querySelector('.Feels_Like');
const weatherWind = document.querySelector('.Wind');
const weatherHumidity = document.querySelector('.Humidity');
const weatherDate = document.querySelector('.default_date');
const weatherDay = document.querySelector('.default_day');
const listContent = document.querySelector('.list_content ul');

const currentDate = new Date();
const options = { month: 'long' };
const monthName = currentDate.toLocaleString('en-US', options);
weatherDate.textContent = currentDate.getDate() + ', ' + monthName;

const dayOptions = { weekday: 'long' };
const dayName = currentDate.toLocaleString('en-US', dayOptions);
weatherDay.textContent = dayName;

// using google map to find the city
const autocomplete = new google.maps.places.Autocomplete(searchBox);

autocomplete.addListener('place_changed', function () {
  const selectedPlace = autocomplete.getPlace();

  if (!selectedPlace.geometry) {
    console.error('No details available for input:', selectedPlace.name);
    return;
  }

  const selectedCity = selectedPlace.name;
  showData(selectedCity);
  const latitude = selectedPlace.geometry.location.lat();
  const longitude = selectedPlace.geometry.location.lng();

  getFutureData(latitude, longitude);
});

// load animated icon
const weatherIconsMapping = {
  '01d': 'day.svg',
  '01n': 'night.svg',
  '02d': 'cloudy-day-1.svg',
  '02n': 'cloudy-night-1.svg',
  '03d': 'cloudy-day-2.svg',
  '03n': 'cloudy-night-2.svg',
  '04d': 'cloudy-day-3.svg',
  '04n': 'cloudy-night-3.svg',
  '09d': 'rainy-5.svg',
  '09n': 'rainy-5.svg',
  '10d': 'rainy-6.svg',
  '10n': 'rainy-6.svg',
  '11d': 'thunder.svg',
  '11n': 'thunder.svg',
  '13d': 'snowy-1.svg',
  '13n': 'snowy-6.svg',
  '50d': 'cloudy.svg',
  '50n': 'cloudy.svg',
};

const updateWeatherIcon = (weatherIcon, imgElement) => {
  const iconMapping = weatherIconsMapping[weatherIcon];
  if (iconMapping) {
    imgElement.src = `./assets/icons/animated/${iconMapping}`;
    console.log(imgElement.src);
  } else {
    console.warn('No mapping found for weather icon:', imgElement);
  }
};
//save data to DB
const saveToCouchDB = (city, description, temp) => {
  const currentDate = new Date();
  const formattedDate = currentDate.toISOString();
  const weatherData = {
    type: 'weather_data',
    date: formattedDate,
    city,
    description,
    temp,
  };
  console.log(weatherData);
 const  newweatherData =  JSON.stringify(weatherData);
 console.log(newweatherData);
  // Make a POST request to save weather data to CouchDB
  fetch('/saveWeatherData', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: newweatherData,
  })
    .then(
      (response) => response.json()
      )
    .then((responseData) => {
      if (responseData.success) {
        console.log('Weather data saved successfully to CouchDB:', responseData.data);
      } else {
        console.error('Error saving weather data to CouchDB:', responseData.message);
      }
    })
    .catch((error) => {
      console.error('Error saving weather data to CouchDB:', error.message);
    });
};

const showData = (city) => {
  getWeatherData(city, (result) => {
    console.log(result);
    if (result.cod == 200) {
      var imgElement = document.querySelector('#weatherImage');
      let iconCode = result?.weather[0]?.icon;
      updateWeatherIcon(iconCode, imgElement);
      console.log(iconCode);
      weatherStatus.textContent = result?.name;
      weatherTemperature.textContent = (result?.main?.temp - 273.5).toFixed(2) + String.fromCharCode(176);
      weatherFeels.textContent = (result?.main?.feels_like - 273.5).toFixed(2) + String.fromCharCode(176);
      weatherLocation.textContent = result?.weather[0]?.description?.toUpperCase();
      weatherWind.textContent = result?.wind?.speed + ' ' + 'km/hr';
      weatherHumidity.textContent = result?.main?.humidity + '%';
      //save the JSON to couchDB
      saveToCouchDB(result?.name, result?.weather[0]?.description, (result?.main?.temp - 273.5).toFixed(2));
    } else {
      weatherStatus.textContent = 'City not found.';
      imgElement.src = './assets/icons/animated/day.svg';
    }
  });
};

const getWeatherData = (city, callback) => {
  const locationApi = weatherApi + '?address=' + city;
  fetch(locationApi).then((response) => {
    response.json().then((response) => {
      callback(response);
    });
  });
};

const getFutureData = (lat, log) => {
  const futureWeatherApi = `${futureApi}?lat=${lat}&lon=${log}`;
  fetch(futureWeatherApi).then((response) => {
    response.json().then((response) => {
      console.log(response);
      displayForecast(response.list);
    });
  });
};

const displayForecast = (forecastData) => {
  const forecastItems = listContent.querySelectorAll('li');

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const currentDate = new Date();
  const todayIndex = currentDate.getDay(); // Get the index of today

  forecastData.slice(1, 5).forEach((forecast, index) => {
    const iconElement = forecastItems[index].querySelector('img');
    const dayTempElement = forecastItems[index].querySelector('.day_temp');
    const daySpanElement = forecastItems[index].querySelector('span');

    if (iconElement && dayTempElement && daySpanElement) {
      const dayOfWeekIndex = (todayIndex + index + 1) % 7; // Start from the next day
      const dayOfWeek = daysOfWeek[dayOfWeekIndex];

      iconElement.src = `https://openweathermap.org/img/wn/${forecast.weather[0].icon}@2x.png`;
      iconElement.alt = 'Weather Icon';

      const dayTemp = forecast.main.temp;
      const dayTempCelsius = (dayTemp - 273.15).toFixed(2);
      dayTempElement.textContent = `${dayTempCelsius}°C`;

      daySpanElement.textContent = dayOfWeek;
    }
  });
};


//history table


// Dummy data for the search history
const dummySearchHistory = [
    { city: 'New York', description: 'Clear Sky', date: '2023-09-19', temperature: '25°C' },
    { city: 'Paris', description: 'Rainy', date: '2023-09-20', temperature: '18°C' },
    { city: 'Tokyo', description: 'Partly Cloudy', date: '2023-09-21', temperature: '22°C' },
    { city: 'Sydney', description: 'Sunny', date: '2023-09-22', temperature: '30°C' },
  ];
  
  // Function to display search history in the table
  const displaySearchHistory = (searchHistory) => {
    const tableBody = document.querySelector('.history-table tbody');
    clearTable(tableBody);
  
    searchHistory.forEach((record) => {
      const row = createTableRow(record);
      tableBody.appendChild(row);
    });
  };
  
  // Function to clear table rows
  const clearTable = (tableBody) => {
    while (tableBody.firstChild) {
      tableBody.removeChild(tableBody.firstChild);
    }
  };
  
  // Function to create a table row
  const createTableRow = (record) => {
    const row = document.createElement('tr');
  
    const cityCell = document.createElement('td');
    cityCell.textContent = record.city;
    row.appendChild(cityCell);
  
    const descriptionCell = document.createElement('td');
    descriptionCell.textContent = record.description;
    row.appendChild(descriptionCell);
  
    const dateCell = document.createElement('td');
    dateCell.textContent = record.date;
    row.appendChild(dateCell);
  
    const temperatureCell = document.createElement('td');
    temperatureCell.textContent = record.temperature;
    row.appendChild(temperatureCell);
  
    return row;
  };
  
  // Call the function with the dummy data
  //displaySearchHistory(dummySearchHistory);
  const fetchRecentWeatherData = () => {
  fetch('/retrieveWeatherData')
    .then(response => response.json())
    .then(data => {
      console.log('Raw Weather data from DB:', data); // Log the raw response
      if (data.success) {
        console.log('Weather data from DB:', data.weatherData);
        const transformedData = data.weatherData.map(entry => ({
          temp: entry.temp,
          city: entry.city,
          description: entry.description,
          date: entry.date
        }));
        console.log('Transformed data:', transformedData);
      } else {
        console.error('Error fetching recent weather data', data.message);
      }
    })
    .catch(error => {
      console.error('Error:', error);
    });
};

  
  
  
  document.addEventListener('DOMContentLoaded', ()=> {
    const searchHistoryLink = document.querySelector('.history-link');
    const historyTable = document.querySelector('.history-table');
  
    // Toggle the active class on click
    searchHistoryLink.addEventListener('click', ()=> {
      historyTable.classList.toggle('active');

      //fetch recent weather data when the class becomes active
      if(historyTable.classList.contains('active')){
        fetchRecentWeatherData();
      }
    });
  });  

