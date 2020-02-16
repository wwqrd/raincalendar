const ics = require('ics');
const { Interval } = require('luxon');
const sparkline = require('sparkline');

const hasRain = t => t.precipitation > 0;

const getRainType = (precipitation) => {
  if (precipitation >= 5) { return 'Heavy'; }
  if (precipitation >= 2.5) { return 'Moderate'; }
  if (precipitation > 0) { return 'Light'; }
  return null;
};

const defaultJoin = (a, b) => ({ ...b, ...a });

const defaultRule = (item, previous) => item.from.equals(previous.to)

const concatForecast = (join = defaultJoin, rule = defaultRule) =>
  (memo, t) => {
    if (memo.length === 0) { return [join(t)]; }

    const rest = memo.slice(0, -1);
    const [previous] = memo.slice(-1);

    // if doesn't match rule, add it as a new item
    if (!rule(t, previous)) { return [...memo, join(t)]; }

    // otherwise join it with the last entry
    const combined = join(t, previous);

    return [...rest, combined];
  };

const concatRain = concatForecast(
  (a, b) => {
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
  },
  (item, previous) => {
    const isConsecutive = item.from.equals(previous.to);
    const matchCategory = getRainType(previous.precipitation[0]) === getRainType(item.precipitation);
    return isConsecutive && matchCategory;
  },
);

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
  const rainSpark = sparkline(t.precipitation.map(i => i * 10));
  const rainType = getRainType(t.precipitation[0]);

  return {
    title: `${rainType} rain (${minMax.max}mm max)`,
    description: `Hourly: ${rainSpark} ${minMax.min}mm - ${minMax.max}mm. Weather forecast from Yr, delivered by the Norwegian Meteorological Institute and the NRK.`,
    start: start,
    duration: duration,
  };
};

const getRainEvents = forecast =>
  forecast
    .filter(hasRain)
    .reduce(concatRain, [])
    .map(forecastAsEvent);

const getForecastAsCalendar = events => {
  const calendar = ics.createEvents(events);

  return calendar.value;
};

module.exports = {
  hasRain,
  getRainType,
  concatRain,
  forecastAsEvent,
  getRainEvents,
  getForecastAsCalendar,
}
