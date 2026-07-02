const body = document.querySelector(".body");
const skyGradient = document.querySelector(".sky-gradient");
const searchInput = document.getElementById("searchInput");
const searchResultContainer = document.querySelector(".search-results");
const toggleTemperature = document.querySelector(".toggle-temperature");
const locationInformationContainer = document.querySelector(
  ".information-container",
);
const statsContainer = document.querySelector(".stats-container");
const hourlyContainer = document.querySelector(".hourly-container");
const weeklyContainer = document.querySelector(".weekly-container");

let currentUnit;
let currentWeatherResponse = null;

// ============================ UI DISPLAY FUNCTIONS ==========================
// Display search suggestions
const displaySearchResults = (results) => {
  let resultHTML = "";
  results.map((result) => {
    resultHTML += `
            <div class="result-item" data-lon="${result.longitude}" data-lat="${result.latitude}" data-name="${result.name}" data-country="${result.country}">
              📍
              <p id="result-city">${result.name}</p>
              <p id="result-country">${result.admin1 ? result.admin1.slice(0, 15) + ", " : ""}${result.country ? result.country : ""}</p>
            </div>
        `;
  });
  searchResultContainer.innerHTML = resultHTML;
  searchResultContainer.style.display = "block";
};

// Display sky gradient according to wmo code
const displaySkyGradient = (data) => {
  const isNightOrDay = data.is_day;
  const wmoCode = data.weather_code;
  const getWeatherColor = getWeatherDescription(wmoCode);

  if (isNightOrDay === 0) {
    skyGradient.style.background =
      "radial-gradient(ellipse at 50% 0%, #2c3e55 0%, transparent 70%)";
  } else if (isNightOrDay === 1) {
    skyGradient.style.background = `radial-gradient(ellipse at 50% 0%, ${getWeatherColor.color} 0%, transparent 70%)`;
  }
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
          Feels like <span class="feels-like-temp" id="feels-temp">${Math.round(apparentTemperature)}</span
          ><span class="feels-like-temp" id="feels-deg">°C</span>
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
  const currentVisibility = data.current.visibility;
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
const displayHourlyForecast = (data) => {
  const getLocationTime = data.current.time;
  const currentTimeInHourlyFormat = convertCurrentTime(getLocationTime);
  const hourlyTime = [...data.hourly.time];
  const findCurrentTimeIndex = hourlyTime.findIndex(
    (hour) => hour === currentTimeInHourlyFormat,
  );
  const hourlyWeatherCode = [...data.hourly.weather_code];
  const hourlyTemperature = [...data.hourly.temperature_2m];
  const hourlyPrecipitation = [...data.hourly.precipitation_probability];
  let newHourlyTime = hourlyTime.splice(findCurrentTimeIndex, 24);
  newHourlyTime = convertTimeToMeridian(newHourlyTime);
  newHourlyTime[0] = "Now";
  let newHourlyWeatherCode = hourlyWeatherCode.splice(findCurrentTimeIndex, 24);
  newHourlyWeatherCode = convertWeatherCode(newHourlyWeatherCode);
  const newHourlyTemperature = hourlyTemperature.splice(
    findCurrentTimeIndex,
    24,
  );
  const newHourlyPrecipitation = hourlyPrecipitation.splice(
    findCurrentTimeIndex,
    24,
  );

  let displayHourly = "";
  for (let i = 0; i < 24; i++) {
    displayHourly += `
          <div class="hourly-item ${i === 0 ? "active" : ""}">
            <div class="hourly-time">${newHourlyTime[i]}</div>
            <div class="hourly-icon">${newHourlyWeatherCode[i].icon}</div>
            <div class="hourly-temp">${Math.round(newHourlyTemperature[i])}°C</div>
            <div class="hourly-rain">${newHourlyPrecipitation[i] !== 0 ? Math.round(newHourlyPrecipitation[i]) + "%" : ""}</div>
          </div>
    `;
  }

  hourlyContainer.innerHTML = displayHourly;
};

// Update the DOM with 7-day forecast
const displayForecast = (daily) => {
  const dailyDate = daily.time;
  const getCustomDates = dailyDate.map((date) => forecastCustomDate(date));
  getCustomDates[0] = "Today";
  const dailyWeatherCode = daily.weather_code;
  const getDailyWeatherIconAndDescription =
    convertWeatherCode(dailyWeatherCode);
  const dailyRainPercentage = daily.precipitation_probability_max;
  const dailyTemperatureMax = daily.temperature_2m_max;
  const dailyTemperatureMin = daily.temperature_2m_min;

  let forecastHTML = "";
  for (let i = 0; i < 7; i++) {
    forecastHTML += `
          <div class="weekly-item">
            <div class="weekly-date">${getCustomDates[i]}</div>
            <div class="weekly-weather-information">
              <div class="weekly-weather-icon">${getDailyWeatherIconAndDescription[i].icon}</div>
              <div class="weekly-weather-description">${getDailyWeatherIconAndDescription[i].desc}</div>
            </div>
            <div class="weekly-rain-percentage">
              <div class="rain-progress">
                <div class="bar" style="width: ${Math.round(dailyRainPercentage[i])}%"></div>
              </div>
              <div class="rain-percentage">${Math.round(dailyRainPercentage[i])}%</div>
            </div>
            <div class="weekly-high-low">
              <div class="weekly-high">${Math.round(dailyTemperatureMax[i])}°</div>
              <div class="weekly-low">${Math.round(dailyTemperatureMin[i])}°</div>
            </div>
          </div>
    `;
  }
  weeklyContainer.innerHTML = forecastHTML;
};

// Update the DOM with cel or fah temperature
const displayCelOrFah = (data) => {
  // DOM elements
  const mainTemp = document.querySelector(".temp-value");
  const mainTempDeg = document.querySelector(".temp-deg");
  const feelsLikeTemp = document.querySelector("#feels-temp");
  const feelsLikeTempDeg = document.querySelector("#feels-deg");
  const hourlyTemp = document.querySelectorAll(".hourly-temp");
  const weeklyTempMax = document.querySelectorAll(".weekly-high");
  const weeklyTempMin = document.querySelectorAll(".weekly-low");
  // fetch data from api
  const currentTemperature = data.current.temperature_2m;
  const currentApparentTemperature = data.current.apparent_temperature;
  const forecastHighestTemp = data.daily.temperature_2m_max;
  const forecastLowestTemp = data.daily.temperature_2m_min;
  // get the next 24 hours temp from current time
  const getLocationTime = data.current.time;
  const currentTimeInHourlyFormat = convertCurrentTime(getLocationTime);
  const hourlyTime = [...data.hourly.time];
  const findCurrentTimeIndex = hourlyTime.findIndex(
    (hour) => hour === currentTimeInHourlyFormat,
  );
  let hourlyTemperature = [...data.hourly.temperature_2m];
  hourlyTemperature = hourlyTemperature.splice(findCurrentTimeIndex, 24);
  // convert values to fahrenheit
  const currentTemperatureInFahrenheit =
    convertToFahrenheit(currentTemperature);
  const currentApparentTemperatureInFahrenheit = convertToFahrenheit(
    currentApparentTemperature,
  );
  const newHourlyTemperatureInFahrenheit = hourlyTemperature.map((temp) => {
    return convertToFahrenheit(temp);
  });
  const forecastHighestTempInFahrenheit = forecastHighestTemp.map((temp) => {
    return convertToFahrenheit(temp);
  });
  const forecastLowestTempInFahrenheit = forecastLowestTemp.map((temp) => {
    return convertToFahrenheit(temp);
  });

  // update to DOM
  if (currentUnit === "fahrenheit") {
    toggleTemperature.textContent = "°C / °F";
    mainTemp.textContent = `${Math.round(currentTemperature)}`;
    mainTempDeg.textContent = "°C";
    feelsLikeTemp.textContent = `${Math.round(currentApparentTemperature)}`;
    feelsLikeTempDeg.textContent = "°C";
    for (let i = 0; i < 7; i++) {
      weeklyTempMax[i].textContent = `${Math.round(forecastHighestTemp[i])}°`;
      weeklyTempMin[i].textContent = `${Math.round(forecastLowestTemp[i])}°`;
    }
    for (let i = 0; i < 24; i++) {
      hourlyTemp[i].textContent = `${Math.round(hourlyTemperature[i])}°C`;
    }
    currentUnit = "celsius";
    return;
  } else if (currentUnit === "celsius") {
    toggleTemperature.textContent = "°F / °C";
    mainTemp.textContent = `${Math.round(currentTemperatureInFahrenheit)}`;
    mainTempDeg.textContent = "°F";
    feelsLikeTemp.textContent = `${Math.round(currentApparentTemperatureInFahrenheit)}`;
    feelsLikeTempDeg.textContent = "°F";
    for (let i = 0; i < 7; i++) {
      weeklyTempMax[i].textContent =
        `${Math.round(forecastHighestTempInFahrenheit[i])}°`;
      weeklyTempMin[i].textContent =
        `${Math.round(forecastLowestTempInFahrenheit[i])}°`;
    }
    for (let i = 0; i < 24; i++) {
      hourlyTemp[i].textContent =
        `${Math.round(newHourlyTemperatureInFahrenheit[i])}°F`;
    }
    currentUnit = "fahrenheit";
    return;
  }
};

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
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max,precipitation_probability_max&hourly=temperature_2m,weather_code,precipitation_probability&current=temperature_2m,apparent_temperature,relative_humidity_2m,is_day,wind_speed_10m,weather_code,visibility&timezone=auto&forecast_days=7`;
    const response = await fetch(weatherUrl);
    if (!response.ok) {
      throw new Error("There was an error in fetching data.");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
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
  if (!suggestion) return;
  try {
    const cityName = suggestion.dataset.name;
    const countryName = suggestion.dataset.country;
    const latitude = suggestion.dataset.lat;
    const longitude = suggestion.dataset.lon;
    const weatherResponse = await getWeather(latitude, longitude);
    if (weatherResponse) {
      searchResultContainer.style.display = "none";
      searchInput.value = "";
      currentUnit = "celsius";
      currentWeatherResponse = weatherResponse;
      displaySkyGradient(weatherResponse.current);
      displayCurrentWeather(weatherResponse, cityName, countryName);
      displayWeatherStats(weatherResponse);
      displayHourlyForecast(weatherResponse);
      displayForecast(weatherResponse.daily);
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
  handleSuggestionSearch(e.target.closest(".result-item"));
});

// Handles the toggle from cel to fah and vice versa
toggleTemperature.addEventListener("click", () => {
  if (currentWeatherResponse) {
    displayCelOrFah(currentWeatherResponse);
  }
});

// scrollintoview effect
hourlyContainer.addEventListener("click", (e) => {
  const card = e.target.closest(".hourly-item");
  if (card) {
    card.scrollIntoView({
      behaviour: "smooth",
      inline: "center",
      block: "nearest",
    });
  }
});

body.addEventListener("click", (e) => {
  if (!e.target.closest(".search-results")) {
    searchResultContainer.style.display = "none";
  }
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
const forecastCustomDate = (date) => {
  const newDate = new Date(date);
  const customizedDate = newDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  return customizedDate;
};
// Returns the weather icon for the next 7 days
const convertWeatherCode = (codes) => {
  const weatherCodes = codes.map((code) => {
    return getWeatherDescription(code);
  });
  return weatherCodes;
};
// Return the current time in hourly format
const convertCurrentTime = (time) => {
  let convertCurrentTime = time.split(":");
  if (
    convertCurrentTime[1] === "15" ||
    convertCurrentTime[1] === "30" ||
    convertCurrentTime[1] === "45"
  ) {
    convertCurrentTime[1] = "00";
  }
  convertCurrentTime = convertCurrentTime.join(":");
  return convertCurrentTime;
};
// Return time in "6am" format
const convertTimeToMeridian = (times) => {
  const newTimes = times.map((time) => {
    const hour = parseInt(time.split("T")[1].split(":")[0]);
    let fullTime;
    if (hour === 0) {
      fullTime = "12am";
    }
    if (hour === 12) {
      fullTime = "12pm";
    }
    if (hour >= 1 && hour < 12) {
      fullTime = `${hour}am`;
    } else if (hour > 12) {
      fullTime = `${hour - 12}pm`;
    }
    return fullTime;
  });
  return newTimes;
};
// Convert to Fah
const convertToFahrenheit = (celsius) => {
  const result = celsius * 1.8 + 32;
  return result;
};
