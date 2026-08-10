export function apiError(error: unknown, fallback = "Unexpected error") {
  const message = error instanceof Error ? error.message : fallback;
  const unavailable = /D1 binding|no such table|database/i.test(message);
  return Response.json(
    { error: unavailable ? "Marketplace data is being prepared. Please try again shortly." : message },
    { status: unavailable ? 503 : 500 },
  );
}

export function unauthorized() {
  return Response.json({ error: "Sign in is required" }, { status: 401 });
}

export function forbidden() {
  return Response.json({ error: "You do not have permission for this action" }, { status: 403 });
}
