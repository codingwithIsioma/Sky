const searchInput = document.getElementById("searchInput");
const searchResultContainer = document.querySelector(".search-results");
const locationInformationContainer = document.querySelector(
  ".information-container",
);
const statsContainer = document.querySelector(".stats-container");

// ============================ UI DISPLAY FUNCTIONS ==========================
// Display search suggestions
const displaySearchResults = (results) => {
  let resultHTML = "";
  results.map((result) => {
    resultHTML += `
            <div class="result-item" data-lon="${result.longitude}" data-lat="${result.latitude}" data-name="${result.name}" data-country="${result.country}">
              📍
              <p id="result-city">${result.name}</p>
              <p id="result-country">${result.country ? result.country : ""}</p>
            </div>
        `;
  });
  searchResultContainer.innerHTML = resultHTML;
  searchResultContainer.style.display = "block";
};

// Update the DOM with current weather data
const displayCurrentWeather = (data, cityName, country) => {
  const currentTemperature = data.current.temperature_2m;
  const apparentTemperature = data.current.apparent_temperature;
  const currentWeatherCode = data.current.weather_code;
  const weatherDescription = getWeatherDescription(currentWeatherCode);
  const currentDate = data.current.time;
  const getDate = customDate(currentDate);

  let displayDetails = `
    <div class="city-details">
        <div class="location-details">
            <div class="location-dot"></div>
            <div class="location-name">${cityName}, ${country ? country : ""}</div>
        </div>
        <div class="location-date">${getDate}</div>
    </div>
    <div class="temp">
        <h1 class="temp-value">${Math.round(currentTemperature)}</h1>
        <div class="temp-deg">°C</div>
    </div>
        <div class="weather-condition">${weatherDescription.desc}</div>
        <div class="feels-like">
          Feels like <span class="feels-like-temp">${Math.round(apparentTemperature)}</span
          ><span class="feels-like-temp">°C</span>
    </div>
    `;

  locationInformationContainer.innerHTML = displayDetails;
};

// Update the DOM with the stats data
const displayWeatherStats = (data) => {
  const currentHumidity = data.current.relative_humidity_2m;
  const currentWindSpeed = data.current.wind_speed_10m;
  const uvIndex = data.daily.uv_index_max[0];
  const uvIndexDesc = getUVIndex(Math.round(uvIndex));
  const currentVisibility = data.hourly.visibility[0];
  const visibilityInKM = currentVisibility / 1000;

  let displayStats = `
        <div class="stat-item">
          <div class="stat-tag">HUMIDITY</div>
          <div class="stat-value"><span id="humidity-value">${currentHumidity}</span>%</div>
        </div>
        <div class="stat-item">
          <div class="stat-tag">WIND</div>
          <div class="stat-value"><span id="wind-value">${Math.round(currentWindSpeed)}</span>km/h</div>
        </div>
        <div class="stat-item">
          <div class="stat-tag">UV INDEX</div>
          <div class="stat-value"><span id="uvIndex-value">${uvIndexDesc}</span></div>
        </div>
        <div class="stat-item">
          <div class="stat-tag">VISIBILITY</div>
          <div class="stat-value"><span id="visibility-value">${Math.round(visibilityInKM)}</span>km</div>
        </div>
  `;
  statsContainer.innerHTML = displayStats;
};

// Update the DOM with hourly weather data
const displayHourlyForecast = () => {};

// Update the DOM with 7-day forecast
const displayForecast = (daily) => {};

// ============================ ASYNC FUNCTIONS ===========================
// Get coordinates for a city name
async function getCoordinates(city) {
  try {
    const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=10&language=en&format=json`;
    const response = await fetch(geocodingUrl);
    if (!response.ok) {
      throw new Error("There was an error in fetching data.");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    throw new Error(error);
  }
}

// Fetch current weather, hourly forecast and 7-day forecast
async function getWeather(lat, lon) {
  try {
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,rain_sum,uv_index_max&hourly=temperature_2m,rain,weather_code,visibility&current=temperature_2m,apparent_temperature,relative_humidity_2m,is_day,wind_speed_10m,weather_code`;
    const response = await fetch(weatherUrl);
    if (!response.ok) {
      throw new Error("There was an error in fetching data.");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    throw new Error(error);
  }
}

// Main function triggered by the Search field
async function getSuggestions(city) {
  try {
    const geoData = await getCoordinates(city);
    if (geoData.results) {
      const geoResults = geoData.results.slice(0, 5);
      displaySearchResults(geoResults);
    } else {
      searchResultContainer.style.display = "none";
    }
  } catch (error) {
    throw new Error(error);
  }
}

// Fetch the data for the clicked suggestion
async function handleSuggestionSearch(suggestion) {
  try {
    const cityName = suggestion.target.dataset.name;
    const countryName = suggestion.target.dataset.country;
    const latitude = suggestion.target.dataset.lat;
    const longitude = suggestion.target.dataset.lon;
    const weatherResponse = await getWeather(latitude, longitude);
    if (weatherResponse) {
      searchResultContainer.style.display = "none";
      searchInput.value = "";
      displayCurrentWeather(weatherResponse, cityName, countryName);
      displayWeatherStats(weatherResponse);
    }
  } catch (error) {
    throw new Error(error);
  }
}

// ============================ EVENT LISTENER FUNCTIONS ==========================
// Main event listener for search field
searchInput.addEventListener("input", (e) => {
  const searchValue = e.target.value;
  if (!searchValue) {
    searchResultContainer.style.display = "none";
    return;
  }
  getSuggestions(searchValue);
});

// Handles the click of any of the suggested search result
searchResultContainer.addEventListener("click", (e) => {
  handleSuggestionSearch(e);
});

// ============================ HELPER FUNCTIONS ========================
// Convert a WMO weather code to description and icon
const getWeatherDescription = (code) => {
  if (code === 0) {
    return { desc: "Clear sky", icon: "☀️", color: "#aed6f1" };
  } else if (code === 1) {
    return { desc: "Mainly clear", icon: "🌤️", color: "#aed6f1" };
  } else if (code === 2) {
    return { desc: "Partly cloudy", icon: "🌥️", color: "#c8d8e4" };
  } else if (code === 3) {
    return { desc: "Overcast", icon: "☁️", color: "#9aaab8" };
  } else if (code === 45) {
    return { desc: "Fog", icon: "🌫️", color: "#c2cdd4" };
  } else if (code === 48) {
    return { desc: "Icy fog", icon: "🌫️", color: "#c2cdd4" };
  } else if (code === 51) {
    return { desc: "Light drizzle", icon: "🌦️", color: "#8fa8bc" };
  } else if (code === 53) {
    return { desc: "Drizzle", icon: "🌦️", color: "#8fa8bc" };
  } else if (code === 55) {
    return { desc: "Heavy drizzle", icon: "🌧️", color: "#8fa8bc" };
  } else if (code === 61) {
    return { desc: "Light rain", icon: "🌧️", color: "#7a8fa3" };
  } else if (code === 63) {
    return { desc: "Rain", icon: "🌧️", color: "#7a8fa3" };
  } else if (code === 65) {
    return { desc: "Heavy rain", icon: "🌧️", color: "#7a8fa3" };
  } else if (code === 71) {
    return { desc: "Light snow", icon: "🌨️", color: "#d8e8f0" };
  } else if (code === 73) {
    return { desc: "Snow", icon: "❄️", color: "#d8e8f0" };
  } else if (code === 75) {
    return { desc: "Heavy snow", icon: "❄️", color: "#d8e8f0" };
  } else if (code === 80 || code === 81) {
    return { desc: "Rain showers", icon: "🌦️", color: "#6a8499" };
  } else if (code === 82) {
    return { desc: "Violent showers", icon: "🌧️", color: "#6a8499" };
  } else if (code === 95 || code === 96 || code === 99) {
    return { desc: "Thunderstorm", icon: "⛈️", color: "#4a4060" };
  } else {
    return "";
  }
};
// Convert UV index code to description
const getUVIndex = (code) => {
  if (code === 1 || code === 2) {
    return "Low";
  } else if (code === 3 || code === 4 || code === 5) {
    return "Moderate";
  } else if (code === 6 || code === 7) {
    return "High";
  } else if (code === 8 || code === 9 || code === 10) {
    return "Very High";
  } else if (code >= 11) {
    return "Extreme";
  } else {
    return "";
  }
};
// Customize date
const customDate = (date) => {
  const newDate = new Date(date);
  let customizedDate = newDate.toUTCString();
  customizedDate = customizedDate.split(" ").splice(0, 3).join(" ");
  return customizedDate;
};
