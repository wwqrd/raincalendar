const Hapi = require('@hapi/hapi');
const ics = require('ics');
const WeatherService = require('./WeatherService');
const { getRainEvents } = require('./helpers');

if (process.env.NODE_ENV === 'development') {
  const Replay  = require('replay');
}

const init = async () => {
    const server = Hapi.server({
        port: 3000,
        host: 'localhost'
    });

    const weatherService = new WeatherService(process.env.BASE_URL);

    server.route({
      method: 'GET',
      path: '/',
      handler: async (request, h) => 'go to /rain/{location}',
    });

    server.route({
      method: 'GET',
      path: '/rain/{location*3}',
      handler: async (request, h) => {
        const forecast = await weatherService.forecastHourByHour(request.params.location);

        const rainEvents = getRainEvents(forecast);

        const calendar = ics.createEvents(rainEvents);

        const response = h.response(calendar.value);
        response.type('text/ical');

        return response;
      },
    });

    await server.start();
    console.log('Server running on port 3000');
};

init();
