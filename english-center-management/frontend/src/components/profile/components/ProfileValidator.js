export const validateProfileForm = (formData) => {
  const errors = {};

  const fullName = formData.fullName?.trim() || "";
  const email = formData.email?.trim() || "";
  const phoneNumberRaw = formData.phoneNumber?.trim() || "";

  // Validate full name
  if (!fullName) {
    errors.fullName = "Vui lòng nhập họ tên";
  } else if (fullName.length < 2) {
    errors.fullName = "Họ tên phải có ít nhất 2 ký tự";
  } else if (fullName.length > 30) {
    errors.fullName = "Họ tên không được vượt quá 30 ký tự";
  } else {
    const nameRegex = /^[\p{L}\s]+$/u;
    if (!nameRegex.test(fullName)) {
      errors.fullName = "Họ tên không được chứa số hoặc ký tự đặc biệt";
    }
  }

  // Validate email
  if (!email) {
    errors.email = "Vui lòng nhập email";
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.email = "Email không hợp lệ";
    }
  }

  // Validate phone number (Vietnam)
  if (phoneNumberRaw) {
    let phoneNumber = phoneNumberRaw.replace(/\s/g, "");

    if (phoneNumber.startsWith("+84")) {
      phoneNumber = "0" + phoneNumber.slice(3);
    }

    const phoneRegex = /^0[3-9][0-9]{8}$/;

    if (!phoneRegex.test(phoneNumber)) {
      errors.phoneNumber =
        "Số điện thoại không hợp lệ (ví dụ: 0912345678 hoặc +84912345678)";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateFileUpload = (file) => {
  const errors = [];

  if (!file) {
    return { isValid: true, errors: [] };
  }

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
  ];

  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!allowedTypes.includes(file.type)) {
    errors.push("Chỉ chấp nhận các định dạng: JPG, PNG, GIF, WebP");
  }

  if (file.size > maxSize) {
    errors.push("Kích thước file không vượt quá 5MB");
  }

  if (file.name.length > 100) {
    errors.push("Tên file quá dài");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};