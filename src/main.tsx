import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./store";
import App from "./App.tsx";
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";
import axios from 'axios';
import "./App.css";

 axios.defaults.baseURL = "http://localhost:8000"; 
// axios.defaults.baseURL = "http://192.168.1.39:8000"; 
 //axios.defaults.baseURL = "https://backend-exam-yy5g.onrender.com"; 
axios.defaults.withCredentials = true; //  เพื่อให้ส่ง/รับ httpOnly cookie ได้
createRoot(document.getElementById("root")!).render(
  <Provider store={store}>
    <App />
  </Provider>
);
