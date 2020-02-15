const { DateTime } = require('luxon');

const getMock = defaults => merge => ({ ...defaults, ...merge });

const getMockForecastItem = getMock({ precipitation: 0 });

const getMockForecast = (precipitation = []) => {
  const now = DateTime.local();
  return precipitation.map((p, i) => {
    return getMockForecastItem({
      precipitation: p,
      from: now.plus({ hours: i }),
      to: now.plus({ hours: i + 1 }),
    });
  });
};

module.exports = {
  getMock,
  getMockForecastItem,
  getMockForecast,
};
