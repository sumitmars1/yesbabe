export const SUGGESTED_REPLY_MARKER = "%%%";
export const SUGGESTED_REPLY_PHOTO_MARKER = ",photo";

const SUGGESTED_REPLY_PREFIX_RE = /^(?:%{3}\s*)+/;
const SUGGESTED_REPLY_PHOTO_MARKER_RE = /\s*,photo\s*$/i;

export const stripSuggestionPhotoMarker = (input: string) => {
  return String(input ?? "").replace(SUGGESTED_REPLY_PHOTO_MARKER_RE, "").trim();
};

export const normalizeSuggestedReplyText = (input: string) => {
  const text = String(input ?? "").trim().replace(SUGGESTED_REPLY_PREFIX_RE, "").trim();
  if (!text) return "";
  return stripSuggestionPhotoMarker(text);
};

export const appendSuggestionPhotoMarker = (input: string) => {
  const rawText = String(input ?? "").trim().replace(SUGGESTED_REPLY_PREFIX_RE, "").trim();
  if (!rawText) return "";
  if (SUGGESTED_REPLY_PHOTO_MARKER_RE.test(rawText)) return rawText;
  return `${stripSuggestionPhotoMarker(rawText)}${SUGGESTED_REPLY_PHOTO_MARKER}`;
};

export const stripSuggestedReplies = (input: string) => {
  const text = String(input ?? "");
  const firstMarkerIndex = text.indexOf(SUGGESTED_REPLY_MARKER);
  const bodyText =
    firstMarkerIndex === -1 ? text : text.slice(0, firstMarkerIndex).replace(/\s+$/, "");
  return stripSuggestionPhotoMarker(bodyText);
};
