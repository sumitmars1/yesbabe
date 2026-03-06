interface FormatEmojiOptions {
    lightenParentheses?: boolean;
}

const createEmojiRegex = () =>
    new RegExp(
        [
            // Regular emoji, optionally joined by zero-width joiners
            "(?:\\p{Extended_Pictographic}(?:\\uFE0F|\\uFE0E)?(?:\\u200D\\p{Extended_Pictographic}(?:\\uFE0F|\\uFE0E)?)*)",
            // Flags (regional indicators)
            "(?:\\p{Regional_Indicator}{2})",
            // Keycap sequences (e.g., 1️⃣)
            "(?:[0-9#*]\\uFE0F?\\u20E3)",
        ].join("|"),
        "gu"
    );

const escapeHtml = (text: string): string =>
    text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

const applyBoldFormatting = (text: string): string =>
    text.replace(/\*\*([\s\S]+?)\*\*/g, (_, inner: string) => {
        return `<strong class="chat-text-strong">${inner}</strong>`;
    });

const wrapEmojis = (text: string): string => {
    const regex = createEmojiRegex();
    let result = "";
    let lastIndex = 0;

    for (const match of text.matchAll(regex)) {
        const emoji = match[0];
        const index = match.index ?? 0;
        result += text.slice(lastIndex, index);
        result += `<span class="emoji-glow">${emoji}</span>`;
        lastIndex = index + emoji.length;
    }

    result += text.slice(lastIndex);
    return result;
};

const lightenParenthesesContent = (html: string): string =>
    html.replace(/\(([^)]*)\)/g, (_, inner: string) => {
        return `<span class="ai-meta" style="opacity: 0.5;">(${inner})</span>`;
    });

/**
 * Convert plain text into HTML, wrapping emoji characters so they can be styled
 * with a glowing effect and slightly larger size via CSS. Optionally lightens parentheses content to match AI message tone.
 */
export const formatTextWithEmojis = (
    text: string | undefined | null,
    options: FormatEmojiOptions = {}
): string => {
    if (!text) return "";

    const escaped = escapeHtml(text);
    const withBold = applyBoldFormatting(escaped);
    const withEmoji = wrapEmojis(withBold);
    const maybeLightened = options.lightenParentheses
        ? lightenParenthesesContent(withEmoji)
        : withEmoji;

    return maybeLightened.replace(/\r?\n/g, "<br />");
};

export const containsEmoji = (text: string | undefined | null): boolean => {
    if (!text) return false;
    return createEmojiRegex().test(text);
};
