// Attachment URLs stored in the database are relative (e.g. "/uploads/xyz.png").
// VITE_SOCKET_URL is already the bare backend origin (no /api suffix), which is
// exactly what we need to prefix here.
const BACKEND_ORIGIN = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

export const getFileUrl = (relativeUrl) => {
  if (!relativeUrl) return "";
  if (relativeUrl.startsWith("http")) return relativeUrl; // already absolute
  return `${BACKEND_ORIGIN}${relativeUrl}`;
};

export const formatFileSize = (bytes) => {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const isImageFile = (mimetype) => mimetype?.startsWith("image/");
