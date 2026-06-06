const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const HOTELS_DIR = path.join(ROOT, "hotels");

function walkHtmlFiles(dir, list = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkHtmlFiles(full, list);
    else if (entry.name.endsWith(".html")) list.push(full);
  }
  return list;
}

function cleanup(content) {
  content = content.replace(
    /roomTypeSelect\.addEventListener\("change", function\(\) \{\s*\n\s*updateBookingSummary\(\);\s*\n\s*loadWishState\(\);\s*\n\s*\}\);/g,
    `roomTypeSelect.addEventListener("change", function() {
  updateRoomAvailabilityUI();
  updateBookingSummary();
  loadWishState();
});`
  );

  content = content.replace(
    /  roomTypeSelect\.addEventListener\("change", function\(\) \{\s*\n\s*updateBookingSummary\(\);\s*\n\s*loadWishState\(\);\s*\n\s*\}\);\s*\n\}/g,
    `  roomTypeSelect.addEventListener("change", function() {
    updateRoomAvailabilityUI();
    updateBookingSummary();
    loadWishState();
  });
}`
  );

  content = content.replace(
    /\nif \(typeof roomTypeSelect !== "undefined" && roomTypeSelect\) \{\s*\n\s*roomTypeSelect\.addEventListener\("change", function\(\) \{\s*\n\s*updateRoomAvailabilityUI\(\);\s*\n\s*updateBookingSummary\(\);\s*\n\s*\}\);\s*\n\}\s*\nupdateRoomAvailabilityUI\(\);/g,
    "\nupdateRoomAvailabilityUI();"
  );

  return content;
}

walkHtmlFiles(HOTELS_DIR).forEach(function(filePath) {
  const before = fs.readFileSync(filePath, "utf8");
  const after = cleanup(before);
  if (after !== before) {
    fs.writeFileSync(filePath, after, "utf8");
    console.log("Listener cleaned:", path.relative(ROOT, filePath));
  }
});
