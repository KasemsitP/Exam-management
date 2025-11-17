import Swal from "sweetalert2";



export function showError(title: string, text: string) {
  return Swal.fire({
    title: `${title}`,
    text: `${text} `,
    icon: 'error',
    showConfirmButton: false,
    timer: 1500,
  });
}