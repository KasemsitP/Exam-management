import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hook";
import { showLoginSuccessAlert, showLoginSuccessAlertWithData } from "@/components/ui/successAlert";
import Logo from "../assets/kmutnblogo.png"
import {
  login,
  selectAuthError,
  selectAuthStatus,
  selectCurrentUser,
  setAuthenticated,
  AuthUser,
  Role
} from "@/store/slices/auth.slice";
import { User, Lock, Loader2, GraduationCap, BookOpen } from "lucide-react"; // ใช้ไอคอนการศึกษา

interface LoginFormValues {
  username: string;
  password: string;
}

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

  // State สำหรับลูกเล่นตอนกดช่องกรอกข้อมูล
  const [activeField, setActiveField] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated" && user) {
      showLoginSuccessAlert(user.name);
      const redirect = (location.state as { from?: { pathname?: string } } | undefined)?.from?.pathname;
      navigate(redirect ?? "/dashboard", { replace: true });
    }
  }, [status, user, navigate, location.state]);

  const onSubmit = (values: LoginFormValues) => {
    dispatch(login(values));
  };

  const handleBypass = () => {
    const mockUser: AuthUser = {
      id: "u-1",
      name: "Admin User",
      username: "admin",
      roles: ["admin"] as Role[],
      avatar: "AU",
    };
    dispatch(setAuthenticated(mockUser));
    showLoginSuccessAlertWithData(mockUser.name, "โหมด bypass");
    navigate("/dashboard", { replace: true });
  };

  return (
    <div
      className="min-vh-100 w-100 d-flex flex-column align-items-center justify-content-center position-relative overflow-hidden"
      style={{
        backgroundColor: "#f8faff", // พื้นหลังโทนสว่างสบายตา
        fontFamily: "'Sarabun', 'Inter', sans-serif"
      }}
    >

      {/* --- Main Content --- */}
      <div
        className="card mx-auto mt-5 p-4"
        style={{
          maxWidth: '500px',
          width: '100%',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}
      >

        <div className="text-center mb-3">
          <img
            src={Logo}
            alt="Logo"
            style={{ width: '100px', height: 'auto' }}
          />
        </div>


        <h5 className="text-center mb-4" style={{ fontWeight: '500' }}>
          ระบบจัดการข้อสอบเพื่อหน่วยงานทางด้านความยุติธรรม
        </h5>

        <form onSubmit={handleSubmit(onSubmit)}>

          <div className="mb-3">
            <label htmlFor="username" className="form-label fw-semibold">
              ชื่อผู้ใช้งาน
            </label>
            <input
              type="text"
              className="form-control"
              id="username"
              placeholder="Username "
              onFocus={() => setActiveField('username')}
              onBlur={() => setActiveField(null)}
              {...register("username", { required: true })}
            />
          </div>
          <div className="mb-3 position-relative">
            <label htmlFor="password" className="form-label fw-semibold">
              รหัสผ่าน
            </label>
            <input
              type='password'
              className="form-control"
              id="password"
              placeholder="Password"
              onFocus={() => setActiveField('password')}
              onBlur={() => setActiveField(null)}
              {...register("password", { required: true })}
            />
          </div>


          <div className="d-flex justify-content-between align-items-center mb-4">
            <div className="form-check">
              {/* <input className="form-check-input" type="checkbox" id="remember" />
              <label className="form-check-label" htmlFor="remember">
                จดจำข้อมูลของฉัน
              </label> */}
            </div>
            <a href="#" className="text-decoration-none">
              ลืมรหัสผ่าน
            </a>
          </div>


          <button type="submit" className="btn btn-success w-100 py-2 rounded-3">
            เข้าสู่ระบบ
          </button>
        </form>
      </div>




      {/* Footer Text */}
      <div className="mt-4 text-center">
        <button
          onClick={handleBypass}
          className="btn btn-spm text-secondary opacity-25 hover-opacity-100"
          style={{ fontSize: '0.7rem' }}
        >
          Developer Mode
        </button>
      </div>
    </div>
  );
}