/**
 * Bổ sung các patch còn thiếu sau patch-room-count.js
 */
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

function fixRoomLineLabel(content) {
  content = content.replace(
    /(<strong class="room-night-price">\$\{formatCurrencyVND\(total\.room\.pricePerNight\)\}<\/strong> × \$\{total\.nights\} đêm)/g,
    "$1 × ${total.roomCount} phòng"
  );
  content = content.replace(
    /(<strong class="room-night-price">\$\{formatCurrencyVND\(calculation\.room\.pricePerNight\)\}<\/strong> × \$\{calculation\.nights\} đêm)/g,
    "$1 × ${calculation.roomCount} phòng"
  );
  content = content.replace(
    /(<strong class="room-night-price">\$\{formatCurrencyVND\(total\.basePricePerNight\)\}<\/strong> × \$\{total\.nights\} đêm)/g,
    "$1 × ${total.roomCount} phòng"
  );
  return content;
}

function fixSyncRoomCountSelect(content) {
  if (content.includes("syncRoomCountSelect(available)")) return content;

  return content.replace(
    /(var available\s*=\s*getRoomAvailable\([^\)]+\);\s*\n)(\s*var notice\s*=)/g,
    "$1  syncRoomCountSelect(available);\n  var roomCountField = document.getElementById(\"roomCountField\");\n  if (roomCountField) roomCountField.style.display = available <= 0 ? \"none\" : \"\";\n$2"
  );
}

function fixCordialStyleSaveValidation(content) {
  return content.replace(
    /const selectedRoomNameNow = getSelectedRoomName\(\);\s*\n\s*if \(!isRoomAvailable\(bookingInfo\.hotelCode, selectedRoomNameNow\)\) \{\s*\n\s*alert\("Rất tiếc! Phòng \\" \+ selectedRoomNameNow \+ \\" đã hết\. Vui lòng chọn loại phòng khác\."\);\s*\n\s*return;\s*\n\s*\}/g,
    `const selectedRoomNameNow = getSelectedRoomName();
  const roomCountToBook = getSelectedRoomCount();
  const availableNow = getRoomAvailable(bookingInfo.hotelCode, selectedRoomNameNow, defaultRoomCounts[selectedRoomNameNow] || 5);
  if (availableNow <= 0) {
    alert("Rất tiếc! Phòng \\"" + selectedRoomNameNow + "\\" đã hết. Vui lòng chọn loại phòng khác.");
    return;
  }
  if (roomCountToBook > availableNow) {
    alert("Số phòng bạn chọn (" + roomCountToBook + ") vượt quá số phòng còn trống (" + availableNow + "). Vui lòng chọn lại.");
    return;
  }`
  );
}

function fixBookingItemRoomCount(content) {
  if (content.includes("guestCount: guestSelection.totalGuests,")) {
    content = content.replace(
      /(guestCount: guestSelection\.totalGuests,\s*\n)(\s*bookingTime:)/g,
      "$1    roomCount: total.roomCount || getSelectedRoomCount(),\n    roomsBooked: total.roomCount || getSelectedRoomCount(),\n$2"
    );
  }
  return content;
}

function fixDuplicateListeners(content) {
  return content.replace(
    /var roomCountSelect = document\.getElementById\("roomCountSelect"\);\s*\nif \(roomCountSelect\) roomCountSelect\.addEventListener\("change", updateBookingSummary\);\s*\nvar roomCountSelect = document\.getElementById\("roomCountSelect"\);\s*\nif \(roomCountSelect\) roomCountSelect\.addEventListener\("change", updateBookingSummary\);/g,
    `var roomCountSelect = document.getElementById("roomCountSelect");
if (roomCountSelect) roomCountSelect.addEventListener("change", updateBookingSummary);`
  );
}

function fixRoomTypeListener(content) {
  return content.replace(
    /roomTypeSelect\.addEventListener\("change", function\(\) \{\s*\n\s*updateBookingSummary\(\);\s*\n\s*renderWishState\(\);\s*\n\s*\}\);/g,
    `roomTypeSelect.addEventListener("change", function() {
    updateRoomAvailabilityUI();
    updateBookingSummary();
    renderWishState();
  });`
  );
}

function fixInitOrder(content) {
  if (content.includes("updateRoomAvailabilityUI();\nupdateBookingSummary();")) return content;

  return content.replace(
    /(updateBookingSummary\(\);\s*\nrenderHeaderUser\(\);[\s\S]*?initRoomInventory[\s\S]*?updateRoomAvailabilityUI\(\);)/,
    (block) => block.replace(/^updateBookingSummary\(\);\s*\n/, "").replace(/updateRoomAvailabilityUI\(\);\s*$/, "updateRoomAvailabilityUI();\nupdateBookingSummary();")
  ).replace(
    /(updateBookingSummary\(\);\s*\nrenderAuthBox\(\);[\s\S]*?updateRoomAvailabilityUI\(\);)/,
    (block) => block.replace(/^updateBookingSummary\(\);\s*\n/, "").replace(/updateRoomAvailabilityUI\(\);\s*$/, "updateRoomAvailabilityUI();\nupdateBookingSummary();")
  );
}

function patchFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  const before = content;

  content = fixRoomLineLabel(content);
  content = fixSyncRoomCountSelect(content);
  content = fixCordialStyleSaveValidation(content);
  content = fixBookingItemRoomCount(content);
  content = fixDuplicateListeners(content);
  content = fixRoomTypeListener(content);
  content = fixInitOrder(content);

  if (content !== before) {
    fs.writeFileSync(filePath, content, "utf8");
    console.log("Fixed:", path.relative(ROOT, filePath));
  }
}

walkHtmlFiles(HOTELS_DIR).forEach(patchFile);
console.log("Fix pass done.");
