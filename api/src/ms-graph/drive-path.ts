export function normalizeDrivePath(path: string | undefined) {
  const realPath = (path || "").trim().replace(/^\/+/, "").replace(/\/+$/, "");
  if (!realPath) {
    return "";
  }

  return `/${realPath}`;
}

export function rootDriveItemPath(path: string | undefined) {
  const normalizedPath = normalizeDrivePath(path);
  return `/v1.0/me/drive/root${normalizedPath ? `:${normalizedPath}:` : ""}`;
}
