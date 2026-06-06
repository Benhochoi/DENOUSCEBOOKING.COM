/**
 * Move #roomCountField to sit directly below the room type / package select (before .book-summary).
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const HOTELS_DIR = path.join(ROOT, "hotels");

function extractRoomCountBlock(content) {
  const marker = '<div class="book-field book-room-count" id="roomCountField">';
  const start = content.indexOf(marker);
  if (start === -1) return null;

  let depth = 0;
  const divRe = /<div\b[^>]*>|<\/div>/gi;
  divRe.lastIndex = start;
  let end = -1;
  let match;
  while ((match = divRe.exec(content))) {
    if (match[0].startsWith("</")) {
      depth--;
      if (depth === 0) {
        end = divRe.lastIndex;
        break;
      }
    } else {
      depth++;
    }
  }
  if (end === -1) return null;

  let block = content.slice(start, end);
  const trailing = content.slice(end).match(/^\s*\n/);
  if (trailing) block += trailing[0];
  return block;
}

function walkHtmlFiles(dir, list = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkHtmlFiles(full, list);
    else if (entry.name.endsWith(".html")) list.push(full);
  }
  return list;
}

function moveRoomCountField(content) {
  if (!content.includes('id="roomCountSelect"')) return null;

  const block = extractRoomCountBlock(content);
  if (!block) return null;

  const summaryIdx = content.indexOf('<div class="book-summary">');
  if (summaryIdx === -1) return null;

  const beforeSummary = content.slice(0, summaryIdx);
  if (beforeSummary.includes('id="roomCountField"')) {
    return null;
  }

  let updated = content.replace(block, "");
  const insertAt = updated.indexOf('<div class="book-summary">');
  if (insertAt === -1) return null;

  updated =
    updated.slice(0, insertAt) + block + updated.slice(insertAt);
  return updated === content ? null : updated;
}

let changed = 0;
for (const file of walkHtmlFiles(HOTELS_DIR)) {
  const content = fs.readFileSync(file, "utf8");
  const updated = moveRoomCountField(content);
  if (updated) {
    fs.writeFileSync(file, updated, "utf8");
    changed++;
    console.log("Updated:", path.relative(ROOT, file));
  }
}
console.log("Done. Files updated:", changed);
