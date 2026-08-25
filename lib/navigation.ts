export function safeRelativePath(value: unknown, fallback = "/dashboard") {
  const path=String(value||"");
  return /^\/(?!\/)[^\r\n\\]*$/.test(path) ? path : fallback;
}
