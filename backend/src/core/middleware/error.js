export function notFound(req, res, next) {
  res.status(404);
  next(new Error(`Not Found - ${req.originalUrl}`));
}

export function errorHandler(err, req, res, _next) {
  const status =
    res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  console.error(`[${req.method} ${req.originalUrl}]`, err);
  res.status(status).json({
    message: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
}
