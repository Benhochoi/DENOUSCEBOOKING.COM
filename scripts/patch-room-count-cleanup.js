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
    /updateRoomAvailabilityUI\(\);\s*\nupdateBookingSummary\(\);\s*\n\s*updateBookingSummary\(\);/g,
    "updateRoomAvailabilityUI();\n    updateBookingSummary();"
  );

  content = content.replace(
    /updateRoomAvailabilityUI\(\);\s*\n\s*\n<\/script>/g,
    "updateRoomAvailabilityUI();\nupdateBookingSummary();\n\n</script>"
  );

  return content;
}

walkHtmlFiles(HOTELS_DIR).forEach(function(filePath) {
  const before = fs.readFileSync(filePath, "utf8");
  const after = cleanup(before);
  if (after !== before) {
    fs.writeFileSync(filePath, after, "utf8");
    console.log("Cleaned:", path.relative(ROOT, filePath));
  }
});
