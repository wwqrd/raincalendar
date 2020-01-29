const ics = require('ics');
const { Interval } = require('luxon');
const sparkline = require('sparkline');

const defaultJoin = (a, b) =>
  ({ ...b, ...a });
const hasRain = t => t.precipitation > 0;

const concatForecast = (join = defaultJoin) =>
  (memo, t) => {
    if (memo.length === 0) {
      return [join(t)];
    }

    const rest = memo.slice(0, -1);
    const [last] = memo.slice(-1);

    if (!t.from.equals(last.to)) {
      return memo;
    }

    const combined = join(t, last);

    return [
      ...rest,
      combined,
    ];
  };

const concatRain = concatForecast((a, b) => {
  if (!b) {
    return {
      ...a,
      precipitation: [a.precipitation],
    };
  }

  const precipitation = [...b.precipitation, a.precipitation];

  return {
    ...b,
    precipitation: precipitation,
    to: a.to,
  };
});

const forecastAsEvent = (t) => {
  const duration = Interval
    .fromDateTimes(t.from, t.to)
    .toDuration(['hours', 'minutes'])
    .toObject();
  const s = t.from.toObject();
  const start = [s.year, s.month, s.day, s.hour, s.minute];

  const minMax = t.precipitation
    .reduce(
      ({ min, max }, x) => ({
        min: x > min ? min : x,
        max: x < max ? max : x,
      }), { min: t.precipitation[0], max: t.precipitation[0] });
  const rainSpark = sparkline(t.precipitation);

  return {
    title: `Rain (${minMax.max}mm max)`,
    description: `Hourly: ${rainSpark} ${minMax.min}mm - ${minMax.max}mm`,
    start: start,
    duration: duration,
  };
};

const getRainForecast = forecast =>
  forecast
    .filter(hasRain)
    .reduce(concatRain, [])
    .map(forecastAsEvent);

const forecastAsCalendar = events => {
  const calendar = ics.createEvents(events);

  return calendar.value;
};

module.exports.getRainForecast = getRainForecast;
module.exports.forecastAsCalendar = forecastAsCalendar;
