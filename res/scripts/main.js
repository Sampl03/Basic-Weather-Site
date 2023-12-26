import * as wapi from "./modules/weatherapi.js"

/* Fetch DOM elements for UI */
window.ui = {
    "searchbox": document.getElementById("searchbox"),
    "searcherror": document.getElementById("searcherror"),
    "weatherdata": {
        "section": document.getElementById("weatherdata"),
        "location": document.getElementById("location"),
        "coordinates": {
            "latitude": document.getElementById("latitude"),
            "longitude": document.getElementById("longitude")
        },
        "querytime": document.getElementById("querytime"),
        "currentweather": {
            "weathercode": document.getElementById("weathercode"),
            "temperature": document.getElementById("temperature"),
            "feelslike": document.getElementById("feelslike"),
            "wind": document.getElementById("wind"),
            "cloudcover": document.getElementById("cloudcover"),
            "precipitation": document.getElementById("precipitation")
        },
        "hourlyweather": document.getElementById("hourlyweather")
    },
}

window.searchCity = async function() {
    let cityText = ui.searchbox.value.trim();

    let searchResult = await wapi.searchCityByName(cityText);
    if (searchResult == null) {
        hideResult();
        if (cityText !== "") {
            ui.searcherror.textContent = `Could not find city "${cityText}"`;
            setTimeout(() => ui.searcherror.textContent = "", 2000);
        }
        return;
    }

    displayResult(searchResult);
}

function hideResult() {
    document.body.scrollIntoView();
    ui.weatherdata.section.style.opacity = 0;
}

async function displayResult(result) {
    // set Location and Coordinates
    ui.weatherdata.location.textContent = result.name;
    ui.weatherdata.coordinates.latitude.textContent = latitudeToText(result.lat);
    ui.weatherdata.coordinates.longitude.textContent = longitudeToText(result.lon);

    // fetch weather information
    let weather = await wapi.fetchWeather(result.lat, result.lon);

    // display current weather
    ui.weatherdata.querytime.textContent
        = `${stringifyTime(weather.time)} ${weather.timezone}`;
    ui.weatherdata.currentweather.weathercode.textContent
        = weather.current.description;
    ui.weatherdata.currentweather.temperature.textContent
        = Math.round(weather.current.temp);
    ui.weatherdata.currentweather.feelslike.textContent
        = Math.round(weather.current.feels_like);
    ui.weatherdata.currentweather.wind.textContent
        = windToText(weather.current.wind_speed, weather.current.wind_direction);
    ui.weatherdata.currentweather.precipitation.textContent
        = weather.current.precipitation;
    ui.weatherdata.currentweather.cloudcover.textContent
        = weather.current.cloud_cover;

    // set hourly weather table for the day
    resetHourlyWeatherTable(weather);

    // show Weather Data section
    ui.weatherdata.section.style.opacity = 1;
    ui.weatherdata.section.scrollIntoView();
}

function resetHourlyWeatherTable(weather) {
    // clear current entries
    while (ui.weatherdata.hourlyweather.firstChild)
        ui.weatherdata.hourlyweather.firstChild.remove();

    let hour_header = document.createElement("tr");
    hour_header.id = `hweather-header`;
    hour_header.innerHTML = `
    <th>Hour</th>
    <th>Description</th>
    <th>Temperature</th>
    <th>Chance of<br>Precipitation</th>
    <th>Cloud<br>Cover</th>
    <th>Wind</th>
    `
    ui.weatherdata.hourlyweather.appendChild(hour_header);

    // create a new row with the data
    for (let hour=0; hour<24; hour++) {
        let hour_data = weather.day_hourly[hour];
        
        let hour_row = document.createElement("tr");
        hour_row.id = `hweather-row-${hour}h`;
        hour_row.className = "hourly-weather-row"

        // hour
        let row_time = document.createElement("td");
        row_time.className = "hourly-row-time";

        if (hour == weather.time.getHours()) {
            row_time.textContent = "NOW";
            hour_row.classList.add("weather-now");
        } else {
            row_time.textContent = `${hour}h`;
        }

        // weather description
        let row_description = document.createElement("td");
        row_description.className = "hourly-row-description";
        row_description.textContent = hour_data.description;

        // temperature
        let row_temp = document.createElement("td");
        row_temp.className = "hourly-row-temperature";

        row_temp.innerHTML = `
        <span class="tempmeasure">${Math.round(hour_data.temp)}</span>,
        feels like <span class="tempmeasure">${Math.round(hour_data.feels_like)}</span>
        `;

        // precipitation likelihood
        let row_precipitation = document.createElement("td");
        row_precipitation.className = "hourly-row-precipitation percentmeasure";
        row_precipitation.textContent = hour_data.precipitation_prob;
        
        // cloud cover
        let row_cloud_cover = document.createElement("td");
        row_cloud_cover.className = "hourly-row-cloud-cover percentmeasure";
        row_cloud_cover.innerHTML = hour_data.cloud_cover;
        
        // wind
        let row_wind = document.createElement("td");
        row_wind.className = "hourly-row-wind";
        row_wind.textContent = windToText(hour_data.wind_speed, hour_data.wind_direction);

        hour_row.appendChild(row_time);
        hour_row.appendChild(row_description);
        hour_row.appendChild(row_temp);
        hour_row.appendChild(row_precipitation);
        hour_row.appendChild(row_cloud_cover);
        hour_row.appendChild(row_wind);
        ui.weatherdata.hourlyweather.appendChild(hour_row);
    }
}

function stringifyTime(date) {
    return `${date.getHours()}h${date.getMinutes().toString().padStart(2, '0')}`;
}

function degreeToDMS(degrees) {
    let temp = degrees;

    degrees = Math.trunc(temp);
    temp = (temp - degrees) * 60;
    let minutes = Math.trunc(temp);
    temp = (temp - minutes) * 60;
    let seconds = Math.round(temp * 100) % 100

    return `${degrees}° ${minutes}' ${seconds}"`
}

function latitudeToText(lat) {
    let dms = degreeToDMS(Math.abs(lat));
    return dms + ` ${lat >= 0 ? 'N' : 'S'}`;
}

function longitudeToText(lon) {
    let dms = degreeToDMS(Math.abs(lon));
    return dms + ` ${lon >= 0 ? 'E' : 'W'}`;
}

function windToText(speed, direction) {
    const directions = [
        "N", "NNE", "NE", "ENE",
        "E", "ESE", "SE", "SSE",
        "S", "SSW", "SW", "WSW",
        "W", "WNW", "NW", "NNW"]
    
    const wind_speed = Math.round(speed)
    const wind_direction = directions[Math.round(direction / 360 * directions.length) % directions.length]
    return `${wind_speed} km/h ${wind_direction}`
}