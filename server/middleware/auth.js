const { expressjwt: jwt } = require('express-jwt');
const jwks = require('jwks-rsa');

const authMiddleware = jwt({
  secret: jwks.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`
  }),
  audience: process.env.AUTH0_AUDIENCE,
  issuer: `https://${process.env.AUTH0_DOMAIN}/`,
  algorithms: ['RS256'],
  requestProperty: 'user',
  getToken: function fromHeaderOrQuerystring(req) {
    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
      return req.headers.authorization.split(' ')[1];
    }
    return null;
  },
  verify: (decoded, done) => {
    const audience = process.env.AUTH0_AUDIENCE;
    if (Array.isArray(decoded.aud)) {
      if (decoded.aud.includes(audience)) {
        return done(null, decoded);
      }
    } else if (decoded.aud === audience) {
      return done(null, decoded);
    }
    return done(new Error('Invalid audience'));
  }
});

const handleAuthError = (err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    console.error('Auth Error Details:', {
      name: err.name,
      message: err.message,
      code: err.code,
      status: err.status
    });

    return res.status(401).json({
      success: false,
      message: 'Authentication failed',
      error: err.message
    });
  }
  next(err);
};

const extractUser = (req, res, next) => {
  if (req.user && req.user.sub) {
    req.user.auth0Id = req.user.sub;
  }
  next();
};

module.exports = {
  authMiddleware,
  handleAuthError,
  extractUser
};
