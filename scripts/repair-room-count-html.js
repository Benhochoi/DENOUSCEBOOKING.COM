const fs = require("fs");
const path = require("path");

const HOTELS_DIR = path.join(__dirname, "..", "hotels");
const BROKEN = '          </div> class="btn-book-now" id="btnBookNow" onclick="saveBooking()">';
const FIXED = `          </div>
        </div>

        <button class="btn-book-now" id="btnBookNow" onclick="saveBooking()">`;

function walk(dir, list = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, list);
    else if (entry.name.endsWith(".html")) list.push(full);
  }
  return list;
}

walk(HOTELS_DIR).forEach(function(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  if (!content.includes(BROKEN)) return;
  content = content.replace(BROKEN, FIXED);
  fs.writeFileSync(filePath, content, "utf8");
  console.log("Repaired:", path.relative(HOTELS_DIR, filePath));
});
