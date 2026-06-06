/**
 * ============================================================
 * booking-utils.js  —  DenousceBooking Shared Utilities
 * ============================================================
 *
 * File này chứa các hàm DÙNG CHUNG cho tất cả trang khách sạn:
 *
 *  1. generateBookingCode()   — sinh mã đặt phòng không trùng
 *  2. getRoomInventory()      — đọc số lượng phòng từ localStorage
 *  3. getRoomAvailable()      — lấy số phòng còn lại của 1 loại phòng
 *  4. decreaseRoomInventory() — trừ phòng khi đặt thành công
 *  5. increaseRoomInventory() — cộng lại phòng khi hủy
 *  6. isRoomAvailable()       — kiểm tra phòng còn hay hết
 *  7. getSelectedRoomCount()  — đọc số phòng khách chọn trên form
 *  8. syncRoomCountSelect()   — cập nhật selectbox số phòng theo tồn kho
 *
 * localStorage keys được dùng:
 *  - "bookingHistory"         — lịch sử tất cả đặt phòng (array)
 *  - "favoriteHotels"         — danh sách yêu thích (array)
 *  - "roomInventory"          — số lượng phòng còn lại (object)
 *  - "currentUser"            — user đang đăng nhập (object)
 * ============================================================
 */

// ────────────────────────────────────────────────────────────
// 1. SINH MÃ ĐẶT PHÒNG DUY NHẤT
// ────────────────────────────────────────────────────────────

/**
 * Sinh mã đặt phòng có dạng: BK-YYYYMMDD-XXXXXX
 * - YYYYMMDD: ngày hiện tại (ví dụ: 20260604)
 * - XXXXXX  : 6 ký tự ngẫu nhiên gồm chữ hoa + số
 *
 * Hàm đảm bảo mã KHÔNG trùng với bất kỳ mã nào đã có
 * trong bookingHistory bằng cách tái thử nếu trùng.
 *
 * @returns {string} Mã đặt phòng duy nhất, ví dụ: BK-20260604-A3F9K2
 */
function generateBookingCode() {
  // Lấy danh sách mã đã tồn tại để kiểm tra trùng
  var existingCodes = [];
  try {
    var history = JSON.parse(localStorage.getItem("bookingHistory") || "[]");
    if (Array.isArray(history)) {
      existingCodes = history.map(function(item) {
        return item.bookingCode || "";
      });
    }
  } catch (e) {
    existingCodes = [];
  }

  // Tạo phần ngày: YYYYMMDD
  var now = new Date();
  var yyyy = now.getFullYear();
  var mm   = String(now.getMonth() + 1).padStart(2, "0");
  var dd   = String(now.getDate()).padStart(2, "0");
  var datePart = "" + yyyy + mm + dd; // ví dụ: "20260604"

  // Ký tự dùng để tạo phần ngẫu nhiên (chữ hoa + số, dễ đọc)
  var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // bỏ 0/O/1/I dễ nhầm

  // Thử tạo mã, tối đa 20 lần để đảm bảo không trùng
  var maxAttempts = 20;
  for (var attempt = 0; attempt < maxAttempts; attempt++) {
    // Tạo 6 ký tự ngẫu nhiên
    var randomPart = "";
    for (var i = 0; i < 6; i++) {
      var index = Math.floor(Math.random() * chars.length);
      randomPart += chars[index];
    }

    var code = "BK-" + datePart + "-" + randomPart;
    // Ví dụ: "BK-20260604-A3F9K2"

    // Kiểm tra xem mã này đã tồn tại chưa
    if (existingCodes.indexOf(code) === -1) {
      return code; // Mã chưa bị trùng → trả về
    }
  }

  // Fallback cực hiếm: thêm timestamp milliseconds để chắc chắn không trùng
  return "BK-" + datePart + "-" + now.getTime().toString(36).toUpperCase().slice(-6);
}


// ────────────────────────────────────────────────────────────
// 2. QUẢN LÝ SỐ LƯỢNG PHÒNG (INVENTORY)
// ────────────────────────────────────────────────────────────

/**
 * KEY trong localStorage lưu số lượng phòng.
 * Cấu trúc JSON: { "HotelCode|RoomName": currentCount, ... }
 * Ví dụ: { "DN001|Premium King Room": 4, "DN001|Family Room": 6 }
 */
var INVENTORY_KEY = "roomInventory";

/**
 * Đọc toàn bộ inventory từ localStorage.
 * @returns {object} Object chứa inventory hiện tại
 */
function getRoomInventory() {
  try {
    var data = JSON.parse(localStorage.getItem(INVENTORY_KEY) || "{}");
    return (typeof data === "object" && data !== null && !Array.isArray(data)) ? data : {};
  } catch (e) {
    return {};
  }
}

/**
 * Lưu inventory vào localStorage.
 * @param {object} inventory - Object inventory cần lưu
 */
function saveRoomInventory(inventory) {
  try {
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));
  } catch (e) {
    // localStorage đầy hoặc lỗi - bỏ qua
  }
}

/**
 * Tạo khóa tra cứu inventory cho một loại phòng.
 * Khóa = "HotelCode|RoomName"
 * Ví dụ: "DN001|Premium King Room"
 *
 * @param {string} hotelCode  - Mã khách sạn (ví dụ: "DN001")
 * @param {string} roomName   - Tên loại phòng
 * @returns {string} Khóa inventory
 */
function buildInventoryKey(hotelCode, roomName) {
  return hotelCode + "|" + roomName;
}

/**
 * Khởi tạo inventory cho một khách sạn nếu chưa tồn tại.
 * Chỉ ghi giá trị mặc định nếu key chưa có trong localStorage.
 *
 * @param {string} hotelCode    - Mã khách sạn
 * @param {object} defaultCounts - Object { roomName: defaultCount }
 *   Ví dụ: { "Premium King Room": 5, "Family Room": 4 }
 */
function initRoomInventory(hotelCode, defaultCounts) {
  var inventory = getRoomInventory();
  var hasChanged = false;

  Object.keys(defaultCounts).forEach(function(roomName) {
    var key = buildInventoryKey(hotelCode, roomName);
    // Chỉ khởi tạo nếu chưa có — không ghi đè số đã bị trừ
    if (!(key in inventory)) {
      inventory[key] = defaultCounts[roomName];
      hasChanged = true;
    }
  });

  if (hasChanged) {
    saveRoomInventory(inventory);
  }
}

/**
 * Lấy số phòng còn lại của một loại phòng.
 *
 * @param {string} hotelCode  - Mã khách sạn
 * @param {string} roomName   - Tên loại phòng
 * @param {number} defaultVal - Giá trị mặc định nếu chưa khởi tạo
 * @returns {number} Số phòng còn lại (>= 0)
 */
function getRoomAvailable(hotelCode, roomName, defaultVal) {
  var inventory = getRoomInventory();
  var key = buildInventoryKey(hotelCode, roomName);
  if (key in inventory) {
    return Math.max(0, Number(inventory[key]) || 0);
  }
  return Math.max(0, Number(defaultVal) || 5); // mặc định 5 nếu chưa init
}

/**
 * Trừ n phòng khi đặt thành công.
 * Không cho phép xuống dưới 0.
 *
 * @param {string} hotelCode  - Mã khách sạn
 * @param {string} roomName   - Tên loại phòng
 * @param {number} count      - Số phòng cần trừ (mặc định 1)
 * @returns {boolean} true nếu trừ thành công, false nếu không đủ phòng
 */
function decreaseRoomInventoryByCount(hotelCode, roomName, count) {
  var inventory = getRoomInventory();
  var key = buildInventoryKey(hotelCode, roomName);
  var current = key in inventory ? Number(inventory[key]) : 5;
  var roomsToBook = Math.max(1, Number(count) || 1);

  if (current < roomsToBook) {
    return false;
  }

  inventory[key] = current - roomsToBook;
  saveRoomInventory(inventory);
  return true;
}

/**
 * Trừ 1 phòng khi đặt thành công (tương thích code cũ).
 */
function decreaseRoomInventory(hotelCode, roomName) {
  return decreaseRoomInventoryByCount(hotelCode, roomName, 1);
}

/**
 * Cộng lại n phòng khi hủy đặt.
 * Không cho phép vượt quá số phòng ban đầu (maxCount).
 *
 * @param {string} hotelCode  - Mã khách sạn
 * @param {string} roomName   - Tên loại phòng
 * @param {number} count      - Số phòng cần cộng lại (mặc định 1)
 * @param {number} maxCount   - Số phòng tối đa (số phòng ban đầu)
 */
function increaseRoomInventoryByCount(hotelCode, roomName, count, maxCount) {
  var inventory = getRoomInventory();
  var key = buildInventoryKey(hotelCode, roomName);
  var current = key in inventory ? Number(inventory[key]) : 0;
  var max = Number(maxCount) || 6;
  var roomsToRestore = Math.max(1, Number(count) || 1);

  inventory[key] = Math.min(max, current + roomsToRestore);
  saveRoomInventory(inventory);
}

/**
 * Cộng lại 1 phòng khi hủy đặt (tương thích code cũ).
 */
function increaseRoomInventory(hotelCode, roomName, maxCount) {
  increaseRoomInventoryByCount(hotelCode, roomName, 1, maxCount);
}

// ────────────────────────────────────────────────────────────
// 3. SELECTBOX SỐ PHÒNG TRÊN FORM ĐẶT PHÒNG
// ────────────────────────────────────────────────────────────

/**
 * Đọc số phòng khách đang chọn trên form (#roomCountSelect).
 * @returns {number} Số phòng (>= 1)
 */
function getSelectedRoomCount() {
  var select = document.getElementById("roomCountSelect");
  if (!select || select.disabled) {
    return 1;
  }
  var value = parseInt(select.value, 10);
  return value >= 1 && !isNaN(value) ? value : 1;
}

/**
 * Cập nhật các option trong selectbox số phòng theo số phòng còn trống.
 * Không cho chọn vượt quá maxAvailable.
 *
 * @param {number} maxAvailable - Số phòng còn trống tối đa
 */
function syncRoomCountSelect(maxAvailable) {
  var select = document.getElementById("roomCountSelect");
  var field = document.getElementById("roomCountField");
  if (!select) {
    return;
  }

  var available = Math.max(0, Number(maxAvailable) || 0);
  var previous = select.value ? parseInt(select.value, 10) : 1;
  if (isNaN(previous) || previous < 1) {
    previous = 1;
  }

  select.innerHTML = "";

  if (available <= 0) {
    select.disabled = true;
    var emptyOption = document.createElement("option");
    emptyOption.value = "0";
    emptyOption.textContent = "Hết phòng";
    select.appendChild(emptyOption);
    if (field) {
      field.style.display = "none";
    }
    return;
  }

  select.disabled = false;
  if (field) {
    field.style.display = "";
  }

  for (var i = 1; i <= available; i++) {
    var option = document.createElement("option");
    option.value = String(i);
    option.textContent = i + " phòng";
    select.appendChild(option);
  }

  select.value = String(Math.min(previous, available));
}

/**
 * Kiểm tra xem loại phòng còn phòng để đặt không.
 *
 * @param {string} hotelCode  - Mã khách sạn
 * @param {string} roomName   - Tên loại phòng
 * @returns {boolean} true nếu còn phòng, false nếu hết
 */
function isRoomAvailable(hotelCode, roomName) {
  return getRoomAvailable(hotelCode, roomName, 5) > 0;
}

// ────────────────────────────────────────────────────────────
// 4. TÍNH TIỀN ĐẶT PHÒNG CHUẨN (NHÂN SỐ PHÒNG + ƯU ĐÃI %)
// ────────────────────────────────────────────────────────────

/** Tỷ lệ ưu đãi DenousceBooking mặc định cho khách sạn thường (không thuộc mục ưu đãi). */
var STANDARD_BOOKING_DISCOUNT_RATE = 0.1;

/**
 * Tính các khoản tiền trên form đặt phòng.
 * Tiền phòng = giá/đêm × số đêm × số phòng; ưu đãi % áp dụng trên tiền phòng.
 *
 * @param {object} params
 * @param {number} params.pricePerNight
 * @param {number} params.nights
 * @param {number} params.roomCount
 * @param {number} [params.taxRate]
 * @param {number} [params.discountRate]
 * @param {number} [params.servicePricePerGuestPerNight]
 * @param {number} [params.guestCount]
 * @param {number} [params.breakfastPrice]
 * @param {boolean} [params.taxIncluded]
 * @param {boolean} [params.taxOnService]
 * @returns {object}
 */
function computeStandardBookingTotals(params) {
  var nights = Math.max(1, Number(params.nights) || 1);
  var roomCount = Math.max(1, Number(params.roomCount) || 1);
  var pricePerNight = Number(params.pricePerNight) || 0;
  var roomSubtotal = Math.round(pricePerNight * nights * roomCount);

  var serviceTotal = 0;
  if (Number(params.servicePricePerGuestPerNight) > 0) {
    serviceTotal = Math.round(
      Number(params.servicePricePerGuestPerNight) *
        Math.max(0, Number(params.guestCount) || 0) *
        nights *
        roomCount
    );
  } else if (Number(params.breakfastPrice) > 0) {
    serviceTotal = Math.round(Number(params.breakfastPrice) * nights * roomCount);
  }

  var taxRate = Number(params.taxRate) || 0;
  var taxOnService = params.taxOnService !== false;
  var taxBase = taxOnService ? roomSubtotal + serviceTotal : roomSubtotal;
  var taxAmount = params.taxIncluded ? 0 : Math.round(taxBase * taxRate);

  var discountRate =
    params.discountRate != null
      ? Number(params.discountRate)
      : STANDARD_BOOKING_DISCOUNT_RATE;
  var discountAmount = Math.round(roomSubtotal * discountRate);
  var totalPrice = Math.max(0, roomSubtotal + serviceTotal + taxAmount - discountAmount);

  return {
    nights: nights,
    roomCount: roomCount,
    roomSubtotal: roomSubtotal,
    serviceTotal: serviceTotal,
    taxAmount: taxAmount,
    discountAmount: discountAmount,
    totalPrice: totalPrice,
    discountRate: discountRate
  };
}
