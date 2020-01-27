const { Interval } = require('luxon');

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

const asRainEvent = (t) => {
  const duration = Interval
    .fromDateTimes(t.from, t.to)
    .toDuration(['hours', 'minutes'])
    .toObject();
  const s = t.from.toObject();
  const start = [s.year, s.month, s.day, s.hour, s.minute];

  const maxPrecipitation = t.precipitation
    .reduce((a, b) => (a > b ? a : b));

  return {
    title: `Rain ${maxPrecipitation}`,
    start: start,
    duration: duration,
  };
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

const getRainEvents = forecast =>
  forecast
    .filter(hasRain)
    .reduce(concatRain, [])
    .map(asRainEvent);

module.exports.getRainEvents = getRainEvents;
