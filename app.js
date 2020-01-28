const Hapi = require('@hapi/hapi');
const CatboxMemory = require('@hapi/catbox-memory');
const ics = require('ics');
const WeatherService = require('./WeatherService');
const { getRainEvents } = require('./helpers');

if (process.env.NODE_ENV === 'development') {
  const Replay  = require('replay');
}

const weatherService = new WeatherService(process.env.BASE_URL);

const rainCal = async (location) => {
  const forecast = await weatherService.forecastHourByHour(location);

  const rainEvents = getRainEvents(forecast);

  const calendar = ics.createEvents(rainEvents);

  console.log(calendar.value);

  return calendar.value;
}

const init = async () => {
    const server = Hapi.server({
      port: 3000,
      host: 'localhost',
      cache: [
        {
          name: 'calendar',
          provider: {
            constructor: CatboxMemory,
            options: {
              maxByteSize: 10485760, // 10MB
            }
          }
        }
      ],
    });

    server.method('rainCal', rainCal, {
      cache: {
        cache: 'calendar',
        expiresIn: 1000 * 60 * 60, // 1hr
        generateTimeout: 2000,
        getDecoratedValue: true,
      }
    });

    server.route({
      method: 'GET',
      path: '/',
      handler: async (request, h) =>
        'Ensure `BASE_URL` is defined in environment variables. Go to `/rain/{location}`.',
    });

    server.route({
      method: 'GET',
      path: '/rain/{location}',
      handler: async (request, h) => {
        const { value, cached } = await server.methods.rainCal(request.params.location);

        const lastModified = cached ? new Date(cached.stored) : new Date();

        const response = h.response(value)
        response.header('Last-modified', lastModified.toUTCString());
        response.type('text/ical');

        return response;
      },
      options: {
        cache: {
          expiresIn: 1000 * 60 * 30, // 30min
          privacy: 'public'
        }
      },
    });

    await server.start();
    console.log('Server running on port 3000');
};

init();
