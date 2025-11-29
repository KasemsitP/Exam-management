import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hook";
import { showLoginSuccessAlert, showLoginSuccessAlertWithData } from "@/components/ui/successAlert";
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
      {/* --- Background Decorations --- */}
      <div className="position-absolute top-0 start-0 w-100 h-100 pointer-events-none" style={{ zIndex: 0 }}>
        <div 
          className="position-absolute rounded-circle"
          style={{
            top: "-10%",
            left: "-5%",
            width: "40vw",
            height: "40vw",
            background: "radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(255,255,255,0) 70%)", // สีม่วงจางๆ
            filter: "blur(50px)",
          }}
        />
        <div 
          className="position-absolute rounded-circle"
          style={{
            bottom: "-15%",
            right: "-10%",
            width: "45vw",
            height: "45vw",
            background: "radial-gradient(circle, rgba(168, 85, 247, 0.1) 0%, rgba(255,255,255,0) 70%)", // สีม่วงชมพูจางๆ
            filter: "blur(60px)",
          }}
        />
      </div>

      {/* --- Main Content --- */}
      <div className="position-relative d-flex flex-column align-items-center w-100 px-3" style={{ zIndex: 10, maxWidth: "420px" }}>
        
        {/* 1. Logo Section */}
        <div className="mb-4 text-center">
            <div 
              className="bg-white rounded-circle shadow-sm d-flex align-items-center justify-content-center mx-auto mb-3"
              style={{ width: '80px', height: '80px', border: '1px solid #f0f0f0' }}
            >
              {/* เปลี่ยนเป็นไอคอนการศึกษา สีม่วง */}
              <GraduationCap size={40} color="#4f46e5" />
            </div>
        </div>

        {/* 2. Login Card */}
        <div 
          className="card border-0 w-100 shadow-lg"
          style={{ 
            borderRadius: "20px",
            backgroundColor: "#ffffff",
            boxShadow: "0 20px 60px rgba(60, 60, 100, 0.05)" 
          }}
        >
          <div className="card-body p-4 pt-5 pb-5">
            
            <div className="text-center mb-4">
              <h4 className="fw-bold text-dark mb-1">
                ระบบจัดการข้อสอบ
              </h4>
              <p className="text-muted small">
                ระบบจัดการข้อสอบและคลังข้อสอบออนไลน์
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="d-grid gap-3">
              
              {/* Username */}
              <div>
                <div 
                  className="d-flex align-items-center px-3 rounded-3 transition-all"
                  style={{ 
                    backgroundColor: "#f4f6fa", // พื้นหลัง Input สีเทาอ่อน
                    border: activeField === 'username' ? '1px solid #6366f1' : '1px solid transparent',
                    height: '50px',
                    transition: 'border 0.2s ease'
                  }}
                >
                   <User size={18} className="text-secondary opacity-50 me-2" />
                   <input
                    id="username"
                    className="form-control bg-transparent border-0 p-0 shadow-none text-dark"
                    placeholder="ชื่อผู้ใช้งาน / Username"
                    style={{ fontSize: '0.95rem' }}
                    onFocus={() => setActiveField('username')}
                    onBlur={() => setActiveField(null)}
                    {...register("username", { required: true })}
                   />
                </div>
              </div>

              {/* Password */}
              <div>
                <div 
                  className="d-flex align-items-center px-3 rounded-3 transition-all"
                  style={{ 
                    backgroundColor: "#f4f6fa",
                    border: activeField === 'password' ? '1px solid #6366f1' : '1px solid transparent',
                    height: '50px',
                    transition: 'border 0.2s ease'
                  }}
                >
                   <Lock size={18} className="text-secondary opacity-50 me-2" />
                   <input
                    id="password"
                    type="password"
                    className="form-control bg-transparent border-0 p-0 shadow-none text-dark"
                    placeholder="รหัสผ่าน / Password"
                    style={{ fontSize: '0.95rem' }}
                    onFocus={() => setActiveField('password')}
                    onBlur={() => setActiveField(null)}
                    {...register("password", { required: true })}
                   />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="alert alert-danger py-2 px-3 small rounded-3 border-0 bg-danger bg-opacity-10 text-danger mb-0 d-flex align-items-center">
                  <span className="me-2">⚠️</span> {error}
                </div>
              )}

              {/* Button */}
              <button
                type="submit"
                className="btn btn-primary btn-lg w-100 rounded-3 mt-3 fw-semibold border-0"
                disabled={status === "loading"}
                style={{ 
                  backgroundColor: "#6366f1", // Indigo Color
                  backgroundImage: "linear-gradient(to right, #6366f1, #8b5cf6)", // Gradient ม่วง-คราม
                  height: '50px',
                  boxShadow: "0 4px 15px rgba(99, 102, 241, 0.35)",
                  fontSize: '1rem'
                }}
              >
                {status === "loading" ? (
                  <>
                    <Loader2 className="animate-spin me-2 inline" size={18} />
                    กำลังตรวจสอบ...
                  </>
                ) : (
                  "เข้าสู่ระบบ"
                )}
              </button>

            </form>

            {/* Links */}
            <div className="mt-4 pt-2 text-center border-top">
                <div className="d-flex justify-content-center gap-3 mt-3">
                  <a href="#" className="text-decoration-none small text-secondary hover-primary">
                    <BookOpen size={14} className="me-1 mb-1" />
                    คู่มือการใช้งาน
                  </a>
                  <span className="text-muted opacity-25">|</span>
                  <a href="#" className="text-decoration-none small text-secondary hover-primary">
                    ลืมรหัสผ่าน?
                  </a>
                </div>
            </div>

          </div>
        </div>

        {/* Footer Text */}
        <div className="mt-4 text-center">
             <button 
                onClick={handleBypass} 
                className="btn btn-sm text-secondary opacity-25 hover-opacity-100"
                style={{ fontSize: '0.7rem' }}
             >
                Developer Mode
             </button>
        </div>
      </div>
    </div>
  );
}