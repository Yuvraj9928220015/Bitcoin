const geoip = require("geoip-lite");

module.exports = function currencyMiddleware(req, res, next) {
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  const geo = geoip.lookup(ip) || {};
  const country = geo.country || "US";

  const map = { IN: "INR", US: "USD" };
  req.clientCurrency = map[country] || "USD";

  next();
};
