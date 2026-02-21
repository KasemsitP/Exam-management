import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./store";
import App from "./App.tsx";
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";
import axios from 'axios';
import "./App.css";
import { clearAuth } from "@/store/slices/auth.slice";
import Swal from "sweetalert2";

// //axios.defaults.baseURL = "http://localhost:8000";
// // axios.defaults.baseURL = "http://192.168.1.39:8000"; 
// axios.defaults.baseURL = "https://backend-exam-yy5g.onrender.com"; 
// axios.defaults.withCredentials = true; //  เพื่อให้ส่ง/รับ httpOnly cookie ได้


if (import.meta.env.DEV) {
  // ตอนรัน dev ในคอม (npm run dev) ให้ยิงไปที่ Backend พอร์ต 8000
  // (ถ้าจะเทสต์มือถือในวง LAN ก็เปลี่ยนเป็น IP แบบ http://192.168.1.X:8000 ตรงนี้ครับ)
  axios.defaults.baseURL = "http://localhost:8000"; 
} else {
  // ตอนรัน production (ที่ Build ไปใส่ Backend แล้ว) ให้เว้นว่างไว้ 
  // มันจะดึง Domain ปัจจุบันมาต่อหน้า /api ให้อัตโนมัติ
  axios.defaults.baseURL = ""; 
}

axios.defaults.withCredentials = true;
axios.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    const url: string = err?.config?.url ?? "";

    const isAuthEndpoint =
      url.includes("/api/auth/login") ||
      url.includes("/api/auth/me") ||
      url.includes("/api/auth/logout");

    if (!isAuthEndpoint && (status === 401 || status === 403)) {
      store.dispatch(clearAuth());
      Swal.fire({
        icon: "warning",
        title: "Session หมดอายุ",
        text: "กรุณาเข้าสู่ระบบใหม่",
        timer: 2000,
      });
    }

    return Promise.reject(err);
  }
);
createRoot(document.getElementById("root")!).render(
  <Provider store={store}>
    <App />
  </Provider>
);
