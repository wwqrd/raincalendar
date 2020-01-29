const Hapi = require('@hapi/hapi');
const CatboxMemory = require('@hapi/catbox-memory');
const WeatherService = require('./WeatherService');
const { getRainForecast, forecastAsCalendar } = require('./helpers');

if (process.env.NODE_ENV === 'development') {
  const Replay  = require('replay');
}

const weatherService = new WeatherService(process.env.BASE_URL);

const rainForecast = async (location) => {
  const forecast = await weatherService.forecastHourByHour(location);

  const rainForecast = getRainForecast(forecast);

  return rainForecast;
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

    server.method('rainForecast', rainForecast, {
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
        'Ensure `BASE_URL` and `REGION` is defined in environment variables. Go to `/rain/{location}`.',
    });

    const rainRoute = async (request, h) => {
      const { value, cached } = await server.methods.rainForecast(request.params.location);

      const lastModified = cached ? new Date(cached.stored) : new Date();

      switch(true) {
        case request.params.format === 'json': {
          const response = h.response(value)
          response.type('text/ical');
          response.header('Last-modified', lastModified.toUTCString());
          return response;
        }
        default: {
          const calendar = forecastAsCalendar(value);
          const response = h.response(calendar)
          response.type('text/ical');
          response.header('Last-modified', lastModified.toUTCString());
          return response;
        }
      }
    }

    server.route({
      method: 'GET',
      path: '/rain/{location}',
      handler: rainRoute,
      options: {
        cache: {
          expiresIn: 1000 * 60 * 30, // 30min
          privacy: 'public'
        }
      },
    });

    server.route({
      method: 'GET',
      path: '/rain/{location}.{format}',
      handler: rainRoute,
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
