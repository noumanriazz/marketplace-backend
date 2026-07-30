/**
 * Reads the client IP from a request, supporting reverse proxies.
 * Always returns only the first IP when multiple are present.
 *
 * @param {import("express").Request} req
 * @returns {string|null}
 */
const getClientIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];

  if (forwarded) {
    const firstIp = String(forwarded).split(",")[0].trim();

    if (firstIp) {
      return firstIp;
    }
  }

  const realIp = req.headers["x-real-ip"];

  if (realIp) {
    const firstIp = String(realIp).split(",")[0].trim();

    if (firstIp) {
      return firstIp;
    }
  }

  return req.ip || req.socket?.remoteAddress || null;
};

module.exports = {
  getClientIp,
};
