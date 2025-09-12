export const FRONTMATTER_REGEX = /^\s*?---\n([\s\S]*?)\n---/g;

export const BLOCKREF_REGEX = /(\^\w+(\n|$))/g;

export const CODE_FENCE_REGEX = /`(.*?)`/g;

export const CODEBLOCK_REGEX = /```.*?\n[\s\S]+?```/g;

export const EXCALIDRAW_REGEX = /:\[\[(\d*?,\d*?)\],.*?\]\]/g;

export const TRANSCLUDED_SVG_REGEX =
	/!\[\[(.*?)(\.(svg))\|(.*?)\]\]|!\[\[(.*?)(\.(svg))\]\]/g;

export const DATAVIEW_LINK_TARGET_BLANK_REGEX =
	/target=["']_blank["'] rel=["']noopener["']/g;

export const DATAVIEW_FIELD_REGEX = /^([^:]+)::\s(.*?)$/gm;

export const DATAVIEW_INLINE_FIELD_REGEX =
	/\[([^:\][]+)::\s(.*?)\]|\(([^:)(]+)::\s(.*?)\)/g;

// Matches a wikilink to a file: `[[linkpath.svg|Display Text]]`
// 1. Optional prefix `!`
// 2. Open braces `[[`
// 3. Arbitrary link text, disallow closing `]` brace
// 4. Any blob file extension
// 5. Optional `|` followed by display text
// 6. Closing braces `]]`
export const LINKED_WIKILINK_FILE_REGEX =
	/!?\[\[[^\]]*?\.(png|jpg|jpeg|gif|webp|mp4|mkv|mov|avi|mp3|wav|ogg|pdf)\|(.*?)[^\]]*?\]\]|!?\[\[[^\]]*?\.(png|jpg|jpeg|gif|webp|mp4|mkv|mov|avi|mp3|wav|ogg|pdf)\]\]/g;

// Matches a markdown link to a file: `[Link text](linkpath.svg)`
// 1. Optional prefix `!`
// 2. Open brace `[`
// 3. Arbitrary link text, disallow closing `]` brace
// 4. Any blob file extension
// 5. Optional `|` followed by display text
// 6. Closing braces `]]`
export const LINKED_MD_FILE_REGEX =
	/!?\[[^\]]*?\]\([^)]*?\.(png|jpg|jpeg|gif|webp|mp4|mkv|mov|avi|mp3|wav|ogg|pdf)\)/g;
