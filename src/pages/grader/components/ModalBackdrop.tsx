// src/pages/accounts/components/ModalBackdrop.tsx
export default function ModalBackdrop({ open }: { open: boolean }) {
  if (!open) return null;
  return <div className="modal-backdrop show" style={{ zIndex: 1050 }} />;
}
