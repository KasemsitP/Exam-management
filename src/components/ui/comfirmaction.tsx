import Swal from "sweetalert2";

export const confirmAction = async (opts: {
  title: string;
  text: string;
  confirmText: string;
  confirmColor?: string;
}) => {
  const res = await Swal.fire({
    title: opts.title,
    text: opts.text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: opts.confirmText,
    cancelButtonText: "ยกเลิก",
    confirmButtonColor: opts.confirmColor ?? "#2563EB",
    cancelButtonColor: "#64748B",
  });
  return res.isConfirmed;
};
