/**
 * Chuẩn hóa tính giá đặt phòng:
 * - Nhân tiền phòng / dịch vụ theo số phòng
 * - Ưu đãi DenousceBooking 10% (trừ hotels/muc-uu-dai)
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

function patchRegularHotel(content) {
  let updated = content;
  let changed = false;

  function replace(oldText, newText, label) {
    if (!updated.includes(oldText)) return;
    updated = updated.split(oldText).join(newText);
    changed = true;
  }

  replace("discountRate: 0.05,", "discountRate: 0.10,");
  replace("Ưu đãi DenousceBooking (5%)", "Ưu đãi DenousceBooking (10%)");

  replace(
    "const serviceTotal = bookingInfo.servicePricePerGuestPerNight * guests.guestCount * nights;",
    "const serviceTotal = bookingInfo.servicePricePerGuestPerNight * guests.guestCount * nights * roomCount;"
  );

  replace(
    "const serviceTotal = (bookingInfo.breakfastPrice || 0) * nights;",
    "const serviceTotal = (bookingInfo.breakfastPrice || 0) * nights * roomCount;"
  );

  // calculateBookingTotal: thêm roomCount vào return (sau nights,)
  if (
    updated.includes("function calculateBookingTotal()") &&
    updated.includes("const roomCount = getSelectedRoomCount();") &&
    !updated.includes("    roomCount,\n    checkinValue")
  ) {
    updated = updated.replace(
      /(function calculateBookingTotal\(\)[\s\S]*?const roomCount = getSelectedRoomCount\(\);[\s\S]*?nights,\n)(\s*)(checkinValue|guests)/,
      (match, head, indent, nextKey) => {
        if (head.includes("roomCount,")) return match;
        changed = true;
        return head + indent + "roomCount,\n" + indent + nextKey;
      }
    );
  }

  // HCM: bỏ discountAlreadyApplied, luôn giảm 10% trên tiền phòng (đã nhân số phòng)
  const hcmDiscountBlock =
    /const originalSubtotal = room\.originalPricePerNight \* nights;\n\s*const appliedSaving[\s\S]*?const totalPrice = bookingInfo\.discountAlreadyApplied\n\s*\? roomSubtotal \+ taxAmount\n\s*: Math\.max\(0, roomSubtotal \+ taxAmount - discountAmount\);/;

  if (hcmDiscountBlock.test(updated)) {
    updated = updated.replace(
      hcmDiscountBlock,
      `const originalSubtotal = room.originalPricePerNight * nights * roomCount;
  const taxAmount = bookingInfo.taxIncluded ? 0 : Math.round(roomSubtotal * bookingInfo.taxRate);
  const discountAmount = Math.round(roomSubtotal * bookingInfo.discountRate);
  const totalPrice = Math.max(0, roomSubtotal + taxAmount - discountAmount);`
    );
    changed = true;
  }

  replace("discountAlreadyApplied: true,\n  discountRate: 0.1", "discountRate: 0.10");
  replace("discountAlreadyApplied: true,\n  discountRate: 0.52", "discountRate: 0.10");
  replace("discountAlreadyApplied: true,\n  discountRate: 0.40", "discountRate: 0.10");
  replace("discountAlreadyApplied: true,\n  discountRate: 0.61", "discountRate: 0.10");

  const discountLabelBlock =
    /document\.getElementById\("discountLabel"\)\.textContent =\n\s*bookingInfo\.discountAlreadyApplied\n\s*\? `Ưu đãi đã áp dụng \(\$\{savingPercent\}%\)`\n\s*: `Ưu đãi DenousceBooking \(\$\{Math\.round\(bookingInfo\.discountRate \* 100\)\}%\)`;/;

  if (discountLabelBlock.test(updated)) {
    updated = updated.replace(
      discountLabelBlock,
      'document.getElementById("discountLabel").textContent =\n    `Ưu đãi DenousceBooking (${Math.round(bookingInfo.discountRate * 100)}%)`;'
    );
    changed = true;
  }

  // Nhãn bữa sáng: hiển thị số phòng khi > 0
  replace(
    "`${bookingInfo.serviceName} ${formatCurrencyVND(bookingInfo.servicePricePerGuestPerNight)} × ${total.guests.guestText} × ${total.nights} ngày`",
    "`${bookingInfo.serviceName} ${formatCurrencyVND(bookingInfo.servicePricePerGuestPerNight)} × ${total.guests.guestText} × ${total.nights} ngày × ${total.roomCount || getSelectedRoomCount()} phòng`"
  );

  return changed ? updated : null;
}

let count = 0;
for (const file of walkHtmlFiles(HOTELS_DIR)) {
  if (file.includes(`${path.sep}muc-uu-dai${path.sep}`)) continue;

  const content = fs.readFileSync(file, "utf8");
  const updated = patchRegularHotel(content);
  if (updated) {
    fs.writeFileSync(file, updated, "utf8");
    count++;
    console.log("Updated:", path.relative(ROOT, file));
  }
}
console.log("Done. Files updated:", count);
