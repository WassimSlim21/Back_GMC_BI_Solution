const jwt = require("jsonwebtoken");
module.exports = (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(401).send("Bearer token is required for authentication");
  }
  const token = req.headers.authorization.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.TOKEN_KEY);
    req.decoded = decoded;
  } catch (err) {
    return res.status(403).send("Invalid Token");
  }
  return next();
};
