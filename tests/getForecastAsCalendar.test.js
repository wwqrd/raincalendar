const test = require('tape');
const { getMockForecastItem, getMockForecast } = require('./helpers');
const {
  hasRain,
  getRainCategory,
  concatRain,
} = require('../getForecastAsCalendar');

test('getRainCategory()', (t) => {
  t.plan(5);

  t.equal(getRainCategory(0), 0);
  t.equal(getRainCategory(0.1), 1);
  t.equal(getRainCategory(0.2), 2);
  t.equal(getRainCategory(0.5), 3);
  t.equal(getRainCategory(1), 4);
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
    [0, 0.1, 0.1, 0.2, 0.3, 0.5, 0.6, 1, 2]
  );

  const expectedOutput = [
    { precipitation: [ 0.1, 0.1 ] },
    { precipitation: [ 0.2, 0.3 ] },
    { precipitation: [ 0.5, 0.6 ] },
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
