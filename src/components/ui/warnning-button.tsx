import Swal from 'sweetalert2';

interface WarningButtonProps {
  title?: string;
  text?: string;
  confirmButtonText?: string;
}

export const WarningButton: React.FC<WarningButtonProps> = ({
  title = 'คำเตือน!',
  text = 'คุณแน่ใจหรือไม่?',
  confirmButtonText = 'รับทราบ!',
}) => {
  const handleClick = () => {
    Swal.fire({
      title,
      text,
      icon: 'warning', // เปลี่ยนเป็น warning
      confirmButtonText,
    });
  };

  return (
    <div>
      <button className="btn btn-warning" onClick={handleClick}>
        กดปุ่มนี้สิ
      </button>
    </div>
  );
};
