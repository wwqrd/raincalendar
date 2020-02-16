const test = require('tape');
const { getMockForecastItem, getMockForecast } = require('./helpers');
const {
  hasRain,
  getRainType,
  concatRain,
} = require('../getForecastAsCalendar');

test('getRainType()', (t) => {
  t.plan(4);

  t.equal(getRainType(0), null);
  t.equal(getRainType(0.1), 'Light');
  t.equal(getRainType(2.5), 'Moderate');
  t.equal(getRainType(5), 'Heavy');
});

test('hasRain()', (t) => {
  t.plan(2);

  t.equal(hasRain(getMockForecastItem({ precipitation: 0 })), false);
  t.equal(hasRain(getMockForecastItem({ precipitation: 1 })), true);
});

test('[].filter(hasRain)', (t) => {

  const mockForecast = getMockForecast(
    [0, 0.1, 0.5, 0, 3]
  );

  const subject = mockForecast.filter(hasRain);

  t.plan(1);

  t.looseEqual(subject.map(({ precipitation }) => precipitation), [0.1, 0.5, 3]);
});

test('concatRain()', (t) => {
  const mockForecast = getMockForecast(
    [0, 1, 1, 3, 4, 5, 6, 1, 2]
  );

  const expectedOutput = [
    { precipitation: [ 1, 1 ] },
    { precipitation: [ 3, 4 ] },
    { precipitation: [ 5, 6 ] },
    { precipitation: [ 1, 2 ] }
  ];

  const subject = mockForecast
    .filter(hasRain)
    .reduce(concatRain, [])
    .map(({ from, to, ...t }) => t);

  t.plan(1);

  t.looseEqual(subject, expectedOutput);
});

test.skip('forecastAsEvent()');

test.skip('getRainForecast()');

test.skip('getForecastAsCalendar()');
