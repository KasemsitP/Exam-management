import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { useAppDispatch, useAppSelector } from "@/store/hook";
import {
  login,
  selectAuthError,
  selectAuthStatus,
  selectCurrentUser,
} from "@/store/slices/auth.slice";

interface LoginFormValues {
  username: string;
  password: string;
}

const SAMPLE_USERS = [
  { username: "admin", password: "admin123", role: "ผู้ดูแลระบบ" },
  { username: "staff", password: "staff123", role: "เจ้าหน้าที่สนามสอบ" },
  { username: "proctor", password: "proctor123", role: "กรรมการคุมสอบ" },
  { username: "grader", password: "grader123", role: "ผู้ตรวจข้อสอบ" },
];

export default function Login() {
  const dispatch = useAppDispatch();
  const status = useAppSelector(selectAuthStatus);
  const error = useAppSelector(selectAuthError);
  const user = useAppSelector(selectCurrentUser);

  const { handleSubmit, register } = useForm<LoginFormValues>({
    defaultValues: { username: "", password: "" },
  });

  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (status === "authenticated" && user) {
      toast({
        title: "เข้าสู่ระบบสำเร็จ",
        description: `ยินดีต้อนรับกลับ ${user.name}`,
      });
      const redirect = (location.state as { from?: { pathname?: string } } | undefined)?.from
        ?.pathname;
      navigate(redirect ?? "/dashboard", { replace: true });
    }
  }, [status, user, navigate, toast, location.state]);

  const onSubmit = (values: LoginFormValues) => {
    dispatch(login(values));
  };

  return (
    <div className="min-vh-100 w-100 d-flex align-items-center justify-content-center position-relative overflow-hidden px-3 px-md-5 py-5">
      <div className="position-absolute top-0 start-0 w-100 h-100 opacity-50 pointer-events-none">
          <div
            className="position-absolute rounded-circle border"
            style={{
              right: "5rem",
              bottom: "3rem",
              width: "10rem",
              height: "10rem",
              borderColor: "rgba(14,165,233,0.2)",
            }}
          />
          <div
            className="position-absolute rounded-circle"
            style={{
              left: "25%",
              bottom: "-10rem",
              width: "22rem",
              height: "22rem",
              background: "rgba(14,165,233,0.15)",
              filter: "blur(32px)",
            }}
          />
          <div
            className="position-absolute rounded-circle"
            style={{
              right: "33%",
              top: "-12rem",
              width: "18rem",
              height: "18rem",
              background: "rgba(16,185,129,0.2)",
              filter: "blur(32px)",
            }}
          />
      </div>

      <div
          className="card border-0 shadow-lg position-relative w-100"
          style={{ backdropFilter: "blur(8px)", maxWidth: 540 }}
        >
          <div className="card-body p-4 p-md-5">
            <div className="text-center mb-4">
              <h1 className="h4 fw-semibold mb-1 text-body">เข้าสู่ระบบศูนย์ควบคุมการสอบ</h1>
              <p className="text-muted mb-0">
                ระบุชื่อผู้ใช้และรหัสผ่านที่ได้รับ เพื่อเข้าใช้งานแพลตฟอร์มบริหารสนามสอบ
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="d-grid gap-3">
              <div>
                <label htmlFor="username" className="form-label">
                  ชื่อผู้ใช้ / อีเมล
                </label>
                <input
                  id="username"
                  className="form-control form-control-lg"
                  placeholder="ระบุชื่อผู้ใช้"
                  {...register("username", { required: true })}
                />
              </div>

              <div>
                <label htmlFor="password" className="form-label">
                  รหัสผ่าน
                </label>
                <input
                  id="password"
                  type="password"
                  className="form-control form-control-lg"
                  placeholder="ระบุรหัสผ่าน"
                  {...register("password", { required: true })}
                />
              </div>

              {error && (
                <div className="alert alert-danger mb-0" role="alert">
                  {error}
                </div>
              )}

              <div className="d-flex justify-content-between small text-muted">
                <span>ลืมรหัสผ่าน?</span>
                <span>ติดต่อผู้ดูแลระบบ</span>
              </div>

              <div
                className="p-3 rounded-3"
                style={{
                  border: "1px dashed rgba(16,185,129,0.5)",
                  background: "rgba(236,253,245,0.8)",
                  color: "#065f46",
                }}
              >
                <p className="fw-semibold mb-2" style={{ color: "#064e3b" }}>
                  บัญชีตัวอย่างสำหรับการสาธิต
                </p>
                <div className="row g-1">
                  {SAMPLE_USERS.map((demo) => (
                    <div key={demo.username} className="col-12 col-sm-6">
                      <span className="fw-medium" style={{ color: "#064e3b" }}>
                        {demo.username}
                      </span>{" "}
                      / {demo.password}{" "}
                      <span style={{ color: "#059669" }}>({demo.role})</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-success btn-lg w-100 shadow"
                disabled={status === "loading"}
                style={{ boxShadow: "0 10px 24px rgba(16,185,129,0.3)" }}
              >
                {status === "loading" ? "กำลังตรวจสอบข้อมูล..." : "เข้าสู่ระบบ"}
              </button>

              <p className="text-center small text-muted mb-0">
                &copy; {new Date().getFullYear()} ExamFlow Control Center
              </p>
            </form>
          </div>
      </div>
    </div>
  );
}


