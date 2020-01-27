const { Interval } = require('luxon');

const hasRain = t => t.precipitation > 0;

const concatForecast = (memo, t) => {
  if (memo.length === 0) {
    return [{
      ...t,
      precipitation: [t.precipitation],
    }];
  }

  const rest = memo.slice(0, -1);
  const [last] = memo.slice(-1);

  if (!t.from.equals(last.to)) {
    return memo;
  }

  const precipitation = [].concat(last.precipitation).concat(t.precipitation);

  return [
    ...rest,
    {
      ...last,
      precipitation: precipitation,
      to: t.to,
    },
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

const getRainEvents = forecast =>
  forecast
    .filter(hasRain)
    .reduce(concatForecast, [])
    .map(asRainEvent);

module.exports.getRainEvents = getRainEvents;
