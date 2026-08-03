const IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".bmp",
  ".tiff",
  ".heic",
]);

const VIDEO_EXTENSIONS = new Set([".mp4", ".mkv", ".avi", ".mov", ".wmv", ".webm", ".m4v"]);

const AUDIO_EXTENSIONS = new Set([".mp3", ".wav", ".flac", ".aac", ".ogg"]);

const MIME_TYPES = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".bmp": "image/bmp",
  ".tiff": "image/tiff",

  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".m4v": "video/x-m4v",
  ".mov": "video/quicktime",
  ".avi": "video/x-msvideo",
  ".mkv": "video/x-matroska",
  ".wmv": "video/x-ms-wmv",

  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".flac": "audio/flac",
  ".aac": "audio/aac",
};

function normalizeExtension(extension) {
  return extension.toLowerCase();
}

function getMediaType(extension) {
  const normalizedExtension = normalizeExtension(extension);

  if (IMAGE_EXTENSIONS.has(normalizedExtension)) {
    return "image";
  }

  if (VIDEO_EXTENSIONS.has(normalizedExtension)) {
    return "video";
  }

  if (AUDIO_EXTENSIONS.has(normalizedExtension)) {
    return "audio";
  }

  return "other";
}

function getMimeType(extension) {
  const normalizedExtension = normalizeExtension(extension);

  return MIME_TYPES[normalizedExtension] || "application/octet-stream";
}

export { getMediaType, getMimeType };
