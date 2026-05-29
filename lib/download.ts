// Small helpers for the admin export. No backend, just browser downloads.

export function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "application/json" });
  triggerDownload(filename, URL.createObjectURL(blob));
}

export function downloadFile(filename: string, file: Blob) {
  triggerDownload(filename, URL.createObjectURL(file));
}

function triggerDownload(filename: string, href: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 4000);
}

export function sanitizeFilename(name: string) {
  return name.replace(/[^a-z0-9.\-_]/gi, "-").toLowerCase();
}
