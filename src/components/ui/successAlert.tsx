import Swal from "sweetalert2";

export function showLoginSuccessAlert(userName: string) {
  return Swal.fire({
    title: 'เข้าสู่ระบบสำเร็จ',
    text: `ยินดีต้อนรับกลับ ${userName}`,
    icon: 'success',
    showConfirmButton: false,
    timer: 1500,
  });
}

export function showLoginSuccessAlertWithData(userName: string, description: string) {
  return Swal.fire({
    title: `เข้าสู่ระบบสำเร็จ ${description}`,
    text: `ยินดีต้อนรับกลับ ${userName} `,
    icon: 'success',
    showConfirmButton: false,
    timer: 1500,
  });
}

export function showSuccess(title: string, text: string) {
  return Swal.fire({
    title: `${title}`,
    text: `${text} `,
    icon: 'success',
    showConfirmButton: false,
    timer: 1500,
  });
}