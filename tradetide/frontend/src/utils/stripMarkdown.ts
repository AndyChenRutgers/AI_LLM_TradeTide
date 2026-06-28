/** Strip markdown syntax and return plain text — for preview snippets. */
export function stripMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, "")          // fenced code blocks
    .replace(/`([^`]+)`/g, "$1")             // inline code
    .replace(/#{1,6}\s+/g, "")              // headings
    .replace(/\*\*(.+?)\*\*/gs, "$1")        // bold
    .replace(/\*(.+?)\*/gs, "$1")            // italic
    .replace(/__(.+?)__/gs, "$1")            // bold (alt)
    .replace(/_(.+?)_/gs, "$1")              // italic (alt)
    .replace(/^\s*[-*+]\s+/gm, "")          // unordered list markers
    .replace(/^\s*\d+\.\s+/gm, "")          // ordered list markers
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")     // links — keep text
    .replace(/^---+$/gm, "")                 // horizontal rules
    .replace(/\|[^\n]+\|/g, "")             // table rows
    .replace(/\n{2,}/g, " — ")              // paragraph breaks → dash
    .replace(/\n/g, " ")                     // remaining newlines
    .replace(/\s{2,}/g, " ")                 // collapse whitespace
    .trim();
}
