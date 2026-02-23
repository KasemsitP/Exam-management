import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hook";
import { showLoginSuccessAlert, showLoginSuccessAlertWithData } from "@/components/ui/successAlert";
import Logo from "../assets/kmutnblogo.png";
import { EyeOff  , Eye} from "lucide-react";
import {
  login,
  selectAuthError,
  selectAuthStatus,
  selectCurrentUser,
  setAuthenticated,
  AuthUser,
  Role
} from "@/store/slices/auth.slice";
import { showError } from "@/components/ui/ErrorAlert";

interface LoginFormValues {
  username: string;
  password: string;
}

export default function Login() {
  const dispatch = useAppDispatch();
  const status = useAppSelector(selectAuthStatus);
  const error = useAppSelector(selectAuthError);
  const user = useAppSelector(selectCurrentUser);
  const [showPassword, setShowPassword] = useState(false);

  const { handleSubmit, register } = useForm<LoginFormValues>({
    defaultValues: { username: "", password: "" },
  });

  const navigate = useNavigate();
  const location = useLocation();


  const onSubmit = async (values: LoginFormValues) => {
    if (status === "loading") return;

    const resultAction = await dispatch(login(values));

    if (login.fulfilled.match(resultAction)) {
      showLoginSuccessAlert(resultAction.payload.name);
      navigate("/home", { replace: true });
    }

    if (login.rejected.match(resultAction)) {
      const errorMessage =
        resultAction.payload || "ชื่อผู้ใช้หรือรหัสผ่านผิด";

      showError("ล็อคอินไม่สำเร็จ", errorMessage);
    }
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
    navigate("/home", { replace: true });
  };

  const isLoading = status === "loading"; //  สร้างตัวแปรเช็คสถานะโหล
  return (
    <div
      className="min-vh-100 w-100 d-flex flex-column align-items-center justify-content-center position-relative overflow-hidden"
      style={{
        backgroundColor: "#f8faff",
        fontFamily: "'Sarabun', 'Inter', sans-serif"
      }}
    >
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
              placeholder="Username"
              disabled={isLoading} //  ล็อคช่องพิมพ์ตอนกำลังโหลด
              {...register("username", { required: true })}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="password" className="form-label fw-semibold">
              รหัสผ่าน
            </label>

            <div className="position-relative">
              <input
                type={showPassword ? "text" : "password"}
                className="form-control pe-5"
                id="password"
                placeholder="Password"
                disabled={isLoading}
                {...register("password", { required: true })}
              />

              <button
                type="button"
                className="btn p-0 border-0 bg-transparent position-absolute end-0 me-3"
                style={{
                  top: "50%",
                  transform: "translateY(-50%)",
                  cursor: "pointer"
                }}
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? (<EyeOff size={20} className="text-muted" />) : (
                  <Eye size={20} className="text-muted" />
                )}
              </button>
            </div>
          </div>


          <div className="d-flex justify-content-end align-items-center mb-4">
            <a href="#" className="text-decoration-none">
              {` `}
            </a>
          </div>

          {/*  ป้องกันการกดปุ่มเบิ้ล และโชว์สถานะโหลด */}
          <button
            type="submit"
            className="btn btn-success w-100 py-2 rounded-3"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                กำลังเข้าสู่ระบบ...
              </>
            ) : (
              "เข้าสู่ระบบ"
            )}
          </button>
        </form>
      </div>

      {/*  ป้องกันปุ่มหลุดไปบน Production ด้วย import.meta.env.DEV */}
      {import.meta.env.DEV && (
        <div className="mt-4 text-center">
          <button
            onClick={handleBypass}
            className="btn btn-sm text-secondary opacity-25 hover-opacity-100"
            style={{ fontSize: '0.7rem' }}
          >
            Developer Mode
          </button>
        </div>
      )}
    </div>
  );
}