export function ok(res, data, message = "OK", status = 200) {
  return res.status(status).json({ success: true, message, data });
}

export function accepted(res, data, message = "Accepted") {
  return ok(res, data, message, 202);
}

export function fail(res, status, message, details) {
  return res.status(status).json({
    success: false,
    message,
    details: details ?? null,
  });
}
