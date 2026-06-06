/**
 * Thêm selectbox "Số phòng" và cập nhật logic tính giá / inventory cho tất cả trang khách sạn.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const HOTELS_DIR = path.join(ROOT, "hotels");

const ROOM_COUNT_HTML = `
        <div class="book-guests" id="roomCountField">
          <i class="fas fa-bed"></i>
          <div class="book-guests-inner">
            <span class="bg-label">Số phòng</span>
            <div class="bg-val">
              <select id="roomCountSelect">
                <option value="1" selected>1 phòng</option>
              </select>
            </div>
          </div>
        </div>
`;

function walkHtmlFiles(dir, list = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkHtmlFiles(full, list);
    else if (entry.name.endsWith(".html")) list.push(full);
  }
  return list;
}

function addRoomCountHtml(content) {
  if (content.includes('id="roomCountSelect"')) return content;
  return content.replace(
    /(<div id="roomAvailableNotice"[\s\S]*?<\/div>)\s*\n+(\s*<button class="btn-book-now")/,
    "$1\n" + ROOM_COUNT_HTML + "\n$2"
  );
}

function patchRoomSubtotal(content) {
  if (content.includes("getSelectedRoomCount()")) return content;

  content = content.replace(
    /const roomSubtotal = room\.pricePerNight \* nights;/g,
    `const roomCount = getSelectedRoomCount();
  const roomSubtotal = room.pricePerNight * nights * roomCount;`
  );

  content = content.replace(
    /const roomSubtotal = Math\.round\(basePricePerNight \* nights\);/g,
    `const roomCount = getSelectedRoomCount();
  const roomSubtotal = Math.round(basePricePerNight * nights * roomCount);`
  );

  content = content.replace(
    /const breakfastTotal = Math\.round\(\(bookingInfo\.breakfastPrice \|\| 0\) \* nights\);/g,
    "const breakfastTotal = Math.round((bookingInfo.breakfastPrice || 0) * nights * roomCount);"
  );

  content = content.replace(
    /const breakfastTotal = bookingInfo\.breakfastPrice \* nights;/g,
    "const breakfastTotal = bookingInfo.breakfastPrice * nights * roomCount;"
  );

  content = content.replace(
    /const serviceTotal = bookingInfo\.breakfastPrice \* nights;/g,
    "const serviceTotal = bookingInfo.breakfastPrice * nights * roomCount;"
  );

  content = content.replace(
    /bookingInfo\.discountPerNight\s*\?\s*bookingInfo\.discountPerNight \* nights/g,
    "bookingInfo.discountPerNight ? bookingInfo.discountPerNight * nights * roomCount"
  );

  return content;
}

function addRoomCountToReturn(content) {
  if (content.includes("roomCount: roomCount") || content.includes("roomCount,")) return content;

  const returnBlocks = [
    /(return \{\s*\n\s*room,\s*\n\s*nights,)/g,
    /(return \{\s*\n\s*selectedRoom: selectedRoom,\s*\n\s*basePricePerNight: basePricePerNight,)/g,
  ];

  for (const re of returnBlocks) {
    if (re.test(content)) {
      content = content.replace(re, "$1\n    roomCount,");
      break;
    }
  }

  return content;
}

function patchRoomLineLabel(content) {
  content = content.replace(
    /`\$\{formatCurrencyVND\(total\.room\.pricePerNight\)\}<\/strong> × \$\{total\.nights\} đêm`/g,
    "`${formatCurrencyVND(total.room.pricePerNight)}</strong> × ${total.nights} đêm × ${total.roomCount} phòng`"
  );

  content = content.replace(
    /`\$\{formatCurrencyVND\(calculation\.room\.pricePerNight\)\}<\/strong> × \$\{calculation\.nights\} đêm`/g,
    "`${formatCurrencyVND(calculation.room.pricePerNight)}</strong> × ${calculation.nights} đêm × ${calculation.roomCount} phòng`"
  );

  content = content.replace(
    /`\$\{formatCurrencyVND\(total\.basePricePerNight\)\}<\/strong> × \$\{total\.nights\} đêm`/g,
    "`${formatCurrencyVND(total.basePricePerNight)}</strong> × ${total.nights} đêm × ${total.roomCount} phòng`"
  );

  return content;
}

function patchSaveBookingValidation(content) {
  if (content.includes("roomCountToBook")) return content;

  content = content.replace(
    /var selectedRoomNameNow = getSelectedRoomName\(\);\s*\n\s*if \(!isRoomAvailable\(bookingInfo\.hotelCode, selectedRoomNameNow\)\) \{\s*\n\s*alert\('Rất tiếc! Phòng "' \+ selectedRoomNameNow \+ '" đã hết\. Vui lòng chọn loại phòng khác\.'\);\s*\n\s*return;\s*\n\s*\}/g,
    `var selectedRoomNameNow = getSelectedRoomName();
  var roomCountToBook = getSelectedRoomCount();
  var availableNow = getRoomAvailable(bookingInfo.hotelCode, selectedRoomNameNow, defaultRoomCounts[selectedRoomNameNow] || 5);
  if (availableNow <= 0) {
    alert('Rất tiếc! Phòng "' + selectedRoomNameNow + '" đã hết. Vui lòng chọn loại phòng khác.');
    return;
  }
  if (roomCountToBook > availableNow) {
    alert('Số phòng bạn chọn (' + roomCountToBook + ') vượt quá số phòng còn trống (' + availableNow + '). Vui lòng chọn lại.');
    return;
  }`
  );

  content = content.replace(
    /var promoRoomName = bookingInfo\.roomName;\s*\n\s*if \(!isRoomAvailable\(bookingInfo\.hotelCode, promoRoomName\)\) \{\s*\n\s*alert\('Rất tiếc! Gói ưu đãi này đã hết\. Vui lòng quay lại sau\.'\);\s*\n\s*return;\s*\n\s*\}/g,
    `var promoRoomName = bookingInfo.roomName;
  var roomCountToBook = getSelectedRoomCount();
  var availableNow = getRoomAvailable(bookingInfo.hotelCode, promoRoomName, defaultRoomCounts[promoRoomName] || 5);
  if (availableNow <= 0) {
    alert('Rất tiếc! Gói ưu đãi này đã hết. Vui lòng quay lại sau.');
    return;
  }
  if (roomCountToBook > availableNow) {
    alert('Số gói bạn chọn (' + roomCountToBook + ') vượt quá số gói còn trống (' + availableNow + '). Vui lòng chọn lại.');
    return;
  }`
  );

  return content;
}

function patchDecreaseInventory(content) {
  content = content.replace(
    /decreaseRoomInventory\(bookingInfo\.hotelCode, total\.room\.roomName\);/g,
    "decreaseRoomInventoryByCount(bookingInfo.hotelCode, total.room.roomName, total.roomCount || getSelectedRoomCount());"
  );

  content = content.replace(
    /decreaseRoomInventory\(bookingInfo\.hotelCode, calculation\.room\.roomName\);/g,
    "decreaseRoomInventoryByCount(bookingInfo.hotelCode, calculation.room.roomName, calculation.roomCount || getSelectedRoomCount());"
  );

  content = content.replace(
    /decreaseRoomInventory\(bookingInfo\.hotelCode, selectedRoom\.roomName\);/g,
    "decreaseRoomInventoryByCount(bookingInfo.hotelCode, selectedRoom.roomName, total.roomCount || getSelectedRoomCount());"
  );

  content = content.replace(
    /decreaseRoomInventory\(bookingInfo\.hotelCode, bookingInfo\.roomName\);/g,
    "decreaseRoomInventoryByCount(bookingInfo.hotelCode, bookingInfo.roomName, totals.roomCount || getSelectedRoomCount());"
  );

  return content;
}

function patchBookingRecord(content) {
  if (content.includes("roomCount: total.roomCount") || content.includes("roomCount: calculation.roomCount") || content.includes("roomCount: totals.roomCount")) {
    return content;
  }

  content = content.replace(
    /(guestCount: guests\.guestCount,\s*\n)/g,
    "$1    roomCount: total.roomCount || getSelectedRoomCount(),\n    roomsBooked: total.roomCount || getSelectedRoomCount(),\n"
  );

  content = content.replace(
    /(guestCount: guests\.guestCount,\s*\n)(?=.*?calculation)/gs,
    "$1    roomCount: calculation.roomCount || getSelectedRoomCount(),\n    roomsBooked: calculation.roomCount || getSelectedRoomCount(),\n"
  );

  content = content.replace(
    /(guestCount: total\.guestCount,\s*\n)/g,
    "$1    roomCount: total.roomCount || getSelectedRoomCount(),\n    roomsBooked: total.roomCount || getSelectedRoomCount(),\n"
  );

  content = content.replace(
    /(guestCount: totals\.lockedGuests\.guestCount,\s*\n)/g,
    "$1    roomCount: totals.roomCount || getSelectedRoomCount(),\n    roomsBooked: totals.roomCount || getSelectedRoomCount(),\n"
  );

  content = content.replace(
    /(guestCount: guestSelection\.guestCount,\s*\n)/g,
    "$1    roomCount: total.roomCount || getSelectedRoomCount(),\n    roomsBooked: total.roomCount || getSelectedRoomCount(),\n"
  );

  return content;
}

function patchUpdateRoomAvailabilityUI(content) {
  if (content.includes("syncRoomCountSelect(available)")) return content;

  return content.replace(
    /(var available = getRoomAvailable\([^\)]+\);\s*\n)(\s*var notice = document\.getElementById\("roomAvailableNotice"\);)/g,
    "$1  syncRoomCountSelect(available);\n  var roomCountField = document.getElementById(\"roomCountField\");\n  if (roomCountField) roomCountField.style.display = available <= 0 ? \"none\" : \"\";\n$2"
  );
}

function patchRoomTypeChangeListener(content) {
  return content.replace(
    /roomTypeSelect\.addEventListener\("change", function\(\) \{\s*\n\s*updateRoomAvailabilityUI\(\);\s*\n\s*\}\);/g,
    `roomTypeSelect.addEventListener("change", function() {
    updateRoomAvailabilityUI();
    updateBookingSummary();
  });`
  );
}

function patchRoomCountListener(content) {
  if (content.includes('getElementById("roomCountSelect")')) return content;

  content = content.replace(
    /(guestSelect\.addEventListener\("change", updateBookingSummary\);\s*\n)/,
    `$1
var roomCountSelect = document.getElementById("roomCountSelect");
if (roomCountSelect) roomCountSelect.addEventListener("change", updateBookingSummary);
`
  );

  content = content.replace(
    /(if \(guestSelect\) guestSelect\.addEventListener\("change", updateBookingSummary\);\s*\n)/,
    `$1
var roomCountSelect = document.getElementById("roomCountSelect");
if (roomCountSelect) roomCountSelect.addEventListener("change", updateBookingSummary);
`
  );

  return content;
}

function patchInitOrder(content) {
  return content.replace(
    /updateBookingSummary\(\);\s*\n(renderAuthBox\(\);[\s\S]*?loadWishState\(\);[\s\S]*?initRoomInventory[\s\S]*?updateRoomAvailabilityUI\(\);)/,
    "updateRoomAvailabilityUI();\nupdateBookingSummary();\n$1"
  ).replace(
    /updateBookingSummary\(\);\s*\nrenderAuthBox\(\);\s*\nloadWishState\(\);\s*\n[\s\S]*?updateRoomAvailabilityUI\(\);/,
    (match) => match.replace(/^updateBookingSummary\(\);\s*\n/, "").replace(/updateRoomAvailabilityUI\(\);\s*$/, "updateRoomAvailabilityUI();\nupdateBookingSummary();")
  );
}

function patchPromoCalculate(content) {
  if (!content.includes("packageRoomSubtotal: bookingInfo.packageRoomSubtotal")) return content;
  if (content.includes("roomCount = getSelectedRoomCount()")) return content;

  return content.replace(
    /function calculateBookingTotal\(\) \{\s*\n\s*const today = new Date\(\);/,
    `function calculateBookingTotal() {
  const roomCount = getSelectedRoomCount();
  const today = new Date();`
  ).replace(
    /packageRoomSubtotal: bookingInfo\.packageRoomSubtotal,/,
    `roomCount: roomCount,
    packageRoomSubtotal: bookingInfo.packageRoomSubtotal * roomCount,`
  ).replace(
    /taxAndServiceFee: bookingInfo\.taxAndServiceFee,/,
    "taxAndServiceFee: Math.round(bookingInfo.taxAndServiceFee * roomCount),"
  ).replace(
    /originalTotal: bookingInfo\.originalTotal,/,
    "originalTotal: bookingInfo.originalTotal * roomCount,"
  ).replace(
    /discountAmount: Math\.round\(bookingInfo\.originalTotal \* bookingInfo\.discountRate\),/,
    "discountAmount: Math.round(bookingInfo.originalTotal * bookingInfo.discountRate * roomCount),"
  ).replace(
    /total: bookingInfo\.finalTotal/,
    "total: bookingInfo.finalTotal * roomCount"
  );
}

function patchPromoSummaryLabel(content) {
  if (!content.includes("setText('packageLabel'")) return content;
  return content.replace(
    /setText\('packageLabel', `Giá phòng gói \$\{totals\.nights\} ngày`\);/,
    "setText('packageLabel', `Giá phòng gói ${totals.nights} ngày × ${totals.roomCount} phòng`);"
  );
}

function patchPromoListener(content) {
  if (content.includes("roomCountSelect")) return content;
  return content.replace(
    /updateBookingSummary\(\);\s*\nrenderAuthBox\(\);/,
    `updateBookingSummary();
var roomCountSelect = document.getElementById("roomCountSelect");
if (roomCountSelect) roomCountSelect.addEventListener("change", updateBookingSummary);
renderAuthBox();`
  ).replace(
    /updateRoomAvailabilityUI\(\);\s*\n<\/script>/,
    `updateRoomAvailabilityUI();
updateBookingSummary();
</script>`
  );
}

function patchFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  const before = content;

  content = addRoomCountHtml(content);
  content = patchRoomSubtotal(content);
  content = addRoomCountToReturn(content);
  content = patchRoomLineLabel(content);
  content = patchSaveBookingValidation(content);
  content = patchDecreaseInventory(content);
  content = patchBookingRecord(content);
  content = patchUpdateRoomAvailabilityUI(content);
  content = patchRoomTypeChangeListener(content);
  content = patchRoomCountListener(content);
  content = patchInitOrder(content);
  content = patchPromoCalculate(content);
  content = patchPromoSummaryLabel(content);
  content = patchPromoListener(content);

  if (content !== before) {
    fs.writeFileSync(filePath, content, "utf8");
    console.log("Patched:", path.relative(ROOT, filePath));
  }
}

walkHtmlFiles(HOTELS_DIR).forEach(patchFile);
console.log("Done.");
