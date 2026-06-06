/**
 * Sửa selectbox Số phòng: thêm HTML còn thiếu + đồng bộ style mới.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const HOTELS_DIR = path.join(ROOT, "hotels");

const ROOM_COUNT_HTML = `
        <div class="book-field book-room-count" id="roomCountField">
          <span class="book-field-label">Số phòng</span>
          <div class="book-field-select-wrap">
            <i class="fas fa-bed book-field-icon"></i>
            <select id="roomCountSelect" class="book-field-select" aria-label="Số phòng">
              <option value="1" selected>1 phòng</option>
            </select>
          </div>
        </div>
`;

const OLD_BLOCK_RE = /\s*<div class="book-guests" id="roomCountField">[\s\S]*?<\/div>\s*\n\s*<\/div>\s*\n/;

function walkHtmlFiles(dir, list = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkHtmlFiles(full, list);
    else if (entry.name.endsWith(".html")) list.push(full);
  }
  return list;
}

function insertRoomCountBlock(content) {
  if (OLD_BLOCK_RE.test(content)) {
    content = content.replace(OLD_BLOCK_RE, "\n" + ROOM_COUNT_HTML + "\n");
  }

  if (content.includes('id="roomCountSelect"')) {
    return content;
  }

  const patterns = [
    /(<div id="roomAvailableNotice"[\s\S]*?<\/div>)\s*\n(\s*<button[^>]*btn-book-now)/,
    /(<div id="roomAvailableNotice"[\s\S]*?<\/div>)\s*\n(\s*<button id="btnBookNow")/,
    /(<div id="roomAvailableNotice"[\s\S]*?<\/div>)(\s*<button[^>]*btn-book-now)/,
  ];

  for (const re of patterns) {
    if (re.test(content)) {
      return content.replace(re, "$1\n" + ROOM_COUNT_HTML + "\n$2");
    }
  }

  return content;
}

function ensureRoomCountListener(content) {
  if (content.includes('getElementById("roomCountSelect")')) {
    return content;
  }

  return content.replace(
    /(if \(guestSelect\) guestSelect\.addEventListener\("change", updateBookingSummary\);\s*\n)/,
    `$1
var roomCountSelect = document.getElementById("roomCountSelect");
if (roomCountSelect) roomCountSelect.addEventListener("change", updateBookingSummary);
`
  ).replace(
    /(guestSelect\.addEventListener\("change", updateBookingSummary\);\s*\n)/,
    `$1
var roomCountSelect = document.getElementById("roomCountSelect");
if (roomCountSelect) roomCountSelect.addEventListener("change", updateBookingSummary);
`
  );
}

walkHtmlFiles(HOTELS_DIR).forEach(function(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  const before = content;
  content = insertRoomCountBlock(content);
  content = ensureRoomCountListener(content);
  if (content !== before) {
    fs.writeFileSync(filePath, content, "utf8");
    console.log("Fixed selectbox:", path.relative(ROOT, filePath));
  }
});

console.log("Selectbox fix done.");
