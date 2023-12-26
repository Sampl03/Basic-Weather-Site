export { searchCityByName, fetchWeather }

function createQueryParams(parameters) {
    let results = []

    for (let paramName in parameters) {
        let paramValue = parameters[paramName];
        results.push(`${encodeURI(paramName)}=${encodeURI(paramValue)}`)
    }

    if (results.length == 0)
        return "";

    return "?" + results.join("&");
}

/* Finds the name, latitude, longitude, subregion (provicne/state/etc) and country of a location given a name fragment */
async function searchCityByName(name) {
    let queryString = createQueryParams({
        "name": name,
        "count": 1
    })
    const response = await fetch("https://geocoding-api.open-meteo.com/v1/search" + queryString)
    if (!response.ok) return null;

    const jsonResults = await response.json();
    if ((jsonResults.results ?? []).length != 1) return null;

    let cityResult= jsonResults.results[0];

    return {
        "api_id": cityResult.id,
        "name": cityResult.name,
        "lat": cityResult.latitude,
        "lon": cityResult.longitude,
        "subregion": cityResult.admin1,
        "country": cityResult.country
    }
}

async function fetchWeather(latitude, longitude) {
    let queryString = createQueryParams({
        "latitude": latitude,
        "longitude": longitude,
        "timezone": "auto",
        "forecast_days": 1,
        "current": "temperature_2m,apparent_temperature,precipitation,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m",
        "hourly": "temperature_2m,apparent_temperature,precipitation_probability,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m"
    })
    const response = await fetch("https://api.open-meteo.com/v1/forecast" + queryString)
    if (!response.ok) return null;

    const jsonResult = await response.json();

    let weatherResult = {
        "timezone": jsonResult.timezone_abbreviation,
        "time": new Date(jsonResult.current.time),
        "current": {
            "temp": jsonResult.current.temperature_2m,
            "feels_like": jsonResult.current.apparent_temperature,
            "weather_code": jsonResult.current.weather_code,
            "description": weatherdescriptions[jsonResult.current.weather_code],
            "wind_speed": jsonResult.current.wind_speed_10m,
            "wind_direction": jsonResult.current.wind_direction_10m,
            "precipitation": jsonResult.current.precipitation,
            "cloud_cover": jsonResult.current.cloud_cover
        },
        "day_hourly": [

        ]
    }

    for (let hour = 0; hour < 24; hour++) {
        weatherResult.day_hourly.push({
            "time": new Date(jsonResult.hourly.time[hour]),
            "weather_code": jsonResult.hourly.weather_code[hour],
            "description": weatherdescriptions[jsonResult.hourly.weather_code[hour]],
            "temp": jsonResult.hourly.temperature_2m[hour],
            "feels_like": jsonResult.hourly.apparent_temperature[hour],
            "precipitation_prob": jsonResult.hourly.precipitation_probability[hour],
            "cloud_cover": jsonResult.hourly.cloud_cover[hour],
            "wind_speed": jsonResult.hourly.wind_speed_10m[hour],
            "wind_direction": jsonResult.hourly.wind_direction_10m[hour],
        })
    }

    return weatherResult
}

let weatherdescriptions = {
    0: "Clear",
    1: "Mainly Clear",
    2: "Partly Cloudy",
    3: "Cloudy",
    45: "Fog",
    48: "Rime Fog",
    51: "Light Drizzle",
    53: "Moderate Drizzle",
    55: "Dense Drizzle",
    56: "Light Freezing Drizzle",
    57: "Heavy Freezing Drizzle",
    61: "Slight Rain",
    63: "Moderate Rain",
    65: "Heavy Rain",
    66: "Light Freezing Rain",
    67: "Heavy Freezing Rain",
    71: "Slight Snow",
    73: "Moderate Snow",
    75: "Heavy Snow",
    77: "Snow Grains",
    80: "Slight Rain Showers",
    81: "Moderate Rain Showers",
    82: "Violent Rain Showers",
    85: "Slight Snow Showers",
    86: "Heavy Snow Showers",
    95: "Thunderstorm",
    96: "Thunderstorm with Hail",
    99: "Heavy Thunderstorm with Hail"
}