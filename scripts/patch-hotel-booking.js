/**
 * Cập nhật các trang khách sạn chưa dùng booking-utils.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const HOTELS_DIR = path.join(ROOT, "hotels");

const STANDARD_FILES = [
  "phu-quoc/Grand-Ocean-Bay-Resort-PhuQuoc.html",
  "phu-quoc/Night-Sea-Hotel-PhuQuoc.html",
  "phu-quoc/jw-marriott-phu-quoc-emerald-bay.html",
  "phu-quoc/Azura-Resort-PhuQuoc.html",
  "phu-quoc/Dusit-Princess-Moonrise-PhuQuoc.html",
  "phu-quoc/Crystal-Apartment-Hillside-PhuQuoc.html",
  "ha-noi/la-passion-hanoi-hotel-spa.html",
  "ha-noi/sofitel-legend-metropole-ha-noi.html",
  "ha-noi/LHeritage-Premium-Hanoi-Central.html",
  "ha-noi/amira-hotel-hanoi.html",
  "ha-noi/Hanoi-Center-Silk-Classic-Hotel.html",
  "ha-noi/eliana-robusta-hotel-hanoi.html",
];

const PROMO_FILES = [
  "muc-uu-dai/vinpearl-wonderworld-phu-quoc-special-offer.html",
  "muc-uu-dai/risemount-premier-resort-da-nang-special-offer.html",
  "muc-uu-dai/pullman-phu-quoc-special-offer.html",
];

const UTILS_TAG = '<script src="../../asset/js/booking-utils.js"></script>';
const NOTICE_HTML =
  '        <div id="roomAvailableNotice" style="font-size:.78rem;font-weight:700;padding:8px 12px;border-radius:10px;margin-bottom:10px;background:#eff6ff;color:#1e40af;display:none;"></div>\n';

const INIT_BLOCK = `
initRoomInventory(bookingInfo.hotelCode, defaultRoomCounts);

function updateRoomAvailabilityUI() {
  var roomName = getSelectedRoomName ? getSelectedRoomName() : bookingInfo.defaultRoomName || bookingInfo.roomName;
  var available = getRoomAvailable(bookingInfo.hotelCode, roomName, defaultRoomCounts[roomName] || 5);
  var notice = document.getElementById("roomAvailableNotice");
  var btnBookNow = document.getElementById("btnBookNow");
  if (!notice) return;
  if (available <= 0) {
    notice.style.display = "block";
    notice.style.background = "#fef2f2";
    notice.style.color = "#b91c1c";
    notice.innerHTML = '<i class="fas fa-ban"></i> Phòng này đã hết. Vui lòng chọn loại phòng khác.';
    if (btnBookNow) { btnBookNow.disabled = true; btnBookNow.style.opacity = "0.45"; btnBookNow.style.cursor = "not-allowed"; }
  } else if (available <= 2) {
    notice.style.display = "block";
    notice.style.background = "#fff7ed";
    notice.style.color = "#c2410c";
    notice.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Chỉ còn <strong>' + available + ' phòng</strong> với loại này!';
    if (btnBookNow) { btnBookNow.disabled = false; btnBookNow.style.opacity = ""; btnBookNow.style.cursor = ""; }
  } else {
    notice.style.display = "block";
    notice.style.background = "#eff6ff";
    notice.style.color = "#1e40af";
    notice.innerHTML = '<i class="fas fa-check-circle"></i> Còn <strong>' + available + ' phòng</strong> trống.';
    if (btnBookNow) { btnBookNow.disabled = false; btnBookNow.style.opacity = ""; btnBookNow.style.cursor = ""; }
  }
}

if (typeof roomTypeSelect !== "undefined" && roomTypeSelect) {
  roomTypeSelect.addEventListener("change", function() {
    updateRoomAvailabilityUI();
  });
}
updateRoomAvailabilityUI();
`;

function extractRoomNames(content) {
  const match = content.match(/const roomPricing\s*=\s*\{([\s\S]*?)\n\};/);
  if (!match) return [];
  const keys = [];
  const re = /^\s*"([^"]+)":\s*\{/gm;
  let m;
  while ((m = re.exec(match[1])) !== null) {
    keys.push(m[1]);
  }
  return keys;
}

function buildDefaultRoomCounts(roomNames) {
  const counts = [6, 5, 4, 6, 5, 4, 6, 5];
  const lines = roomNames.map((name, i) => {
    const c = counts[i % counts.length];
    const safe = name.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    return `  "${safe}": ${c}`;
  });
  return `const defaultRoomCounts = {\n${lines.join(",\n")}\n};\n\n`;
}

function addUtilsScript(content) {
  if (content.includes("booking-utils.js")) return content;
  if (content.includes('<script src="../../data/cities.js">')) {
    return content.replace(
      '<script src="../../data/cities.js">',
      UTILS_TAG + "\n" + '<script src="../../data/cities.js">'
    );
  }
  return content.replace(/<script>\s*\nconst bookingInfo/, UTILS_TAG + "\n<script>\nconst bookingInfo");
}

function patchButtonHtml(content) {
  if (content.includes('id="roomAvailableNotice"')) return content;
  return content.replace(
    /(\s*)<button class="btn-book-now"([^>]*?)onclick="saveBooking\(\)">/,
    "$1" + NOTICE_HTML + '$1<button class="btn-book-now" id="btnBookNow"$2onclick="saveBooking()">'
  );
}

function patchCreateBookingCode(content) {
  return content.replace(
    /function createBookingCode\(\) \{[\s\S]*?\n\}/,
    "function createBookingCode() {\n  return generateBookingCode();\n}"
  );
}

function patchSaveBookingStandard(content) {
  if (content.includes("isRoomAvailable(bookingInfo.hotelCode")) return content;

  let c = content.replace(
    /function saveBooking\(\) \{\s*\n\s*const user = getCurrentUser\(\);/,
    `function saveBooking() {
  const user = getCurrentUser();`
  );

  c = c.replace(
    /(function saveBooking\(\) \{\s*\n\s*const user = getCurrentUser\(\);\s*\n\s*if \(!user\) \{[\s\S]*?return;\s*\n\s*\}\s*\n)(\s*const total = updateBookingSummary)/,
    `$1  var selectedRoomNameNow = getSelectedRoomName();
  if (!isRoomAvailable(bookingInfo.hotelCode, selectedRoomNameNow)) {
    alert('Rất tiếc! Phòng "' + selectedRoomNameNow + '" đã hết. Vui lòng chọn loại phòng khác.');
    return;
  }

$2`
  );

  if (!c.includes("defaultRoomCount:")) {
    c = c.replace(
      /(pricePerNight: total\.room\.pricePerNight,\s*\n)/,
      "$1    defaultRoomCount: defaultRoomCounts[total.room.roomName] || 5,\n"
    );
  }

  c = c.replace(
    /localStorage\.setItem\("bookingHistory", JSON\.stringify\(bookings\)\);\s*\n\s*document\.getElementById\("bookingRef"\)/,
    `localStorage.setItem("bookingHistory", JSON.stringify(bookings));
  decreaseRoomInventory(bookingInfo.hotelCode, total.room.roomName);
  updateRoomAvailabilityUI();
  document.getElementById("bookingRef")`
  );

  return c;
}

function patchInitBlock(content) {
  if (content.includes("initRoomInventory(bookingInfo.hotelCode")) return content;
  const roomNames = extractRoomNames(content);
  if (roomNames.length && !content.includes("const defaultRoomCounts")) {
    const insertAfter = content.match(/const roomPricing\s*=\s*\{[\s\S]*?\n\};\s*\n/);
    if (insertAfter) {
      content = content.replace(insertAfter[0], insertAfter[0] + "\n" + buildDefaultRoomCounts(roomNames));
    }
  }
  return content.replace(/(\n)(loadWishState\(\);|renderWishState\(\);)\s*\n<\/script>/, "$1$2\n" + INIT_BLOCK + "\n</script>");
}

function patchStandardFile(relPath) {
  const filePath = path.join(HOTELS_DIR, relPath);
  let content = fs.readFileSync(filePath, "utf8");
  content = addUtilsScript(content);
  content = patchButtonHtml(content);
  content = patchCreateBookingCode(content);
  const roomNames = extractRoomNames(content);
  if (roomNames.length && !content.includes("const defaultRoomCounts")) {
    const m = content.match(/const roomPricing\s*=\s*\{[\s\S]*?\n\};\s*\n/);
    if (m) content = content.replace(m[0], m[0] + "\n" + buildDefaultRoomCounts(roomNames));
  }
  content = patchSaveBookingStandard(content);
  content = patchInitBlock(content);
  fs.writeFileSync(filePath, content, "utf8");
  console.log("OK standard:", relPath);
}

function patchPromoFile(relPath) {
  const filePath = path.join(HOTELS_DIR, relPath);
  let content = fs.readFileSync(filePath, "utf8");
  content = addUtilsScript(content);

  if (!content.includes('id="roomAvailableNotice"')) {
    content = content.replace(
      /(\s*)<button class="btn-book-now"([^>]*?)onclick="saveBooking\(\)">/,
      "$1" + NOTICE_HTML + '$1<button class="btn-book-now" id="btnBookNow"$2onclick="saveBooking()">'
    );
  }

  content = patchCreateBookingCode(content);

  if (!content.includes("const defaultRoomCounts")) {
    const roomNameMatch = content.match(/roomName:\s*['"]([^'"]+)['"]/);
    const roomName = roomNameMatch ? roomNameMatch[1] : "Gói ưu đãi";
    const safe = roomName.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    const block = `const defaultRoomCounts = {\n  "${safe}": 5\n};\n\n`;
    content = content.replace(/(const bookingInfo = \{[\s\S]*?\};\s*\n)/, "$1\n" + block);
  }

  if (!content.includes("isRoomAvailable(bookingInfo.hotelCode")) {
    content = content.replace(
      /(function saveBooking\(\) \{\s*\n\s*const currentUser = getCurrentUser\(\);\s*\n\s*if \(!currentUser\) \{[\s\S]*?return;\s*\n\s*\}\s*\n)/,
      `$1  var promoRoomName = bookingInfo.roomName;
  if (!isRoomAvailable(bookingInfo.hotelCode, promoRoomName)) {
    alert('Rất tiếc! Gói ưu đãi này đã hết. Vui lòng quay lại sau.');
    return;
  }

`
    );
  }

  if (!content.includes("defaultRoomCount:")) {
    content = content.replace(
      /(pricePerNight: bookingInfo\.basePricePerNight,\s*\n)/,
      "$1    defaultRoomCount: defaultRoomCounts[bookingInfo.roomName] || 5,\n"
    );
  }

  if (!content.includes("decreaseRoomInventory")) {
    content = content.replace(
      /localStorage\.setItem\('bookingHistory', JSON\.stringify\(bookingHistory\)\);\s*\n\s*const ref = document\.getElementById\('bookingRef'\)/,
      `localStorage.setItem('bookingHistory', JSON.stringify(bookingHistory));
  decreaseRoomInventory(bookingInfo.hotelCode, bookingInfo.roomName);
  updateRoomAvailabilityUI();
  const ref = document.getElementById('bookingRef')`
    );
  }

  const promoInit = `
const defaultRoomCountsPromo = defaultRoomCounts;
initRoomInventory(bookingInfo.hotelCode, defaultRoomCountsPromo);

function getPromoRoomName() {
  return bookingInfo.roomName;
}

function updateRoomAvailabilityUI() {
  var roomName = getPromoRoomName();
  var available = getRoomAvailable(bookingInfo.hotelCode, roomName, defaultRoomCounts[roomName] || 5);
  var notice = document.getElementById("roomAvailableNotice");
  var btnBookNow = document.getElementById("btnBookNow");
  if (!notice) return;
  if (available <= 0) {
    notice.style.display = "block";
    notice.style.background = "#fef2f2";
    notice.style.color = "#b91c1c";
    notice.innerHTML = '<i class="fas fa-ban"></i> Phòng này đã hết.';
    if (btnBookNow) { btnBookNow.disabled = true; btnBookNow.style.opacity = "0.45"; btnBookNow.style.cursor = "not-allowed"; }
  } else if (available <= 2) {
    notice.style.display = "block";
    notice.style.background = "#fff7ed";
    notice.style.color = "#c2410c";
    notice.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Chỉ còn <strong>' + available + ' gói</strong>!';
    if (btnBookNow) { btnBookNow.disabled = false; btnBookNow.style.opacity = ""; btnBookNow.style.cursor = ""; }
  } else {
    notice.style.display = "block";
    notice.style.background = "#eff6ff";
    notice.style.color = "#1e40af";
    notice.innerHTML = '<i class="fas fa-check-circle"></i> Còn <strong>' + available + ' gói</strong> trống.';
    if (btnBookNow) { btnBookNow.disabled = false; btnBookNow.style.opacity = ""; btnBookNow.style.cursor = ""; }
  }
}
updateRoomAvailabilityUI();
`;

  if (!content.includes("initRoomInventory(bookingInfo.hotelCode")) {
    content = content.replace(
      /loadWishState\(\);\s*\n<\/script>/,
      "loadWishState();\n" + promoInit + "\n</script>"
    );
  }

  fs.writeFileSync(filePath, content, "utf8");
  console.log("OK promo:", relPath);
}

/** Sửa các file dùng biến history/calculation thay vì bookings/total */
function fixIncompleteSaveBooking(relPath) {
  const filePath = path.join(HOTELS_DIR, relPath);
  let content = fs.readFileSync(filePath, "utf8");
  if (content.includes("decreaseRoomInventory")) return;

  const roomVar = content.includes("const calculation = updateBookingSummary()")
    ? "calculation"
    : "total";

  if (!content.includes("isRoomAvailable(bookingInfo.hotelCode")) {
    content = content.replace(
      /(function saveBooking\(\) \{\s*\n\s*const currentUser = getCurrentUser\(\);\s*\n\s*if \(!currentUser\) \{[\s\S]*?return;\s*\n\s*\}\s*\n)/,
      `$1  var selectedRoomNameNow = getSelectedRoomName();
  if (!isRoomAvailable(bookingInfo.hotelCode, selectedRoomNameNow)) {
    alert('Rất tiếc! Phòng "' + selectedRoomNameNow + '" đã hết. Vui lòng chọn loại phòng khác.');
    return;
  }

`
    );
  }

  if (!content.includes("defaultRoomCount:")) {
    content = content.replace(
      new RegExp(`(pricePerNight: ${roomVar}\\.room\\.pricePerNight,\\s*\\n)`),
      `$1    defaultRoomCount: defaultRoomCounts[${roomVar}.room.roomName] || 5,\n`
    );
  }

  content = content.replace(
    /localStorage\.setItem\("bookingHistory", JSON\.stringify\((history|bookings|bookingHistory)\)\);\s*\n(\s*)(const reference|document\.getElementById\("bookingRef"\))/,
    `localStorage.setItem("bookingHistory", JSON.stringify($1));
  decreaseRoomInventory(bookingInfo.hotelCode, ${roomVar}.room.roomName);
  updateRoomAvailabilityUI();
$2$3`
  );

  fs.writeFileSync(filePath, content, "utf8");
  console.log("FIX saveBooking:", relPath);
}

const INCOMPLETE = [
  "ha-noi/LHeritage-Premium-Hanoi-Central.html",
  "ha-noi/sofitel-legend-metropole-ha-noi.html",
  "ha-noi/la-passion-hanoi-hotel-spa.html",
];

STANDARD_FILES.forEach(patchStandardFile);
PROMO_FILES.forEach(patchPromoFile);
INCOMPLETE.forEach(fixIncompleteSaveBooking);
