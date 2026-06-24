const XML_ESCAPE_REPLACEMENTS: Record<string, string> = {
  '"': "&quot;",
  "&": "&amp;",
  "'": "&apos;",
  "<": "&lt;",
  ">": "&gt;",
};

export function escapeXml(value: string) {
  return value.replace(
    /["&'<>]/g,
    (char) => XML_ESCAPE_REPLACEMENTS[char] || char
  );
}

export function xmlResponse(body: string, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/xml");

  return new Response(body, {
    ...init,
    headers,
  });
}
