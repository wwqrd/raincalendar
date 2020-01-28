const xml2js = require('xml2js');
const axios = require('axios');
const { DateTime } = require('luxon');

const parseXml = (data) =>
  new Promise((resolve, reject) => {
    const parser = new xml2js.Parser();

    parser.parseString(data, (err, result) => {
      if (err) { reject(err); return; }
      resolve(result);
    });
  });

class WeatherService {
  constructor(baseUrl) {
    this.client = axios.create({
      baseURL: baseUrl,
    });
  }

  get(url = '') {
    return this.client.get(url)
      .then((res) => {
        return parseXml(res.data);
      });
  }

  // e.g. United_Kingdom/England/London
  forecastHourByHour(location) {
    if (!location) { return Promise.reject('No `location` specified'); }
    const endpointUrl = `/place/${process.env.REGION}/${location}/forecast_hour_by_hour.xml`;

    return this.get(endpointUrl)
      .then((data) => {
        const forecast = data.weatherdata.forecast[0].tabular[0].time;

        const pF = forecast.map(t => ({
          from: DateTime.fromISO(t.$.from),
          to: DateTime.fromISO(t.$.to),
          summary: t.symbol[0].$.name,
          precipitation: parseFloat(t.precipitation[0].$.value),
          windDirection: t.windDirection[0].$.code,
          windSpeed: parseFloat(t.windSpeed[0].$.mps),
          temperature: parseFloat(t.temperature[0].$.value),
          pressure: parseFloat(t.pressure[0].$.value),
        }));

        return pF;
      });
  }
}

module.exports = WeatherService;
