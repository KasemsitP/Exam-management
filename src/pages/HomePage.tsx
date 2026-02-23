// src/pages/HomePage.tsx
import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "@/store/hook";
import { selectActiveCampaign } from "@/store/slices/examData.slice";
import { selectCurrentUser } from "@/store/slices/auth.slice";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Lock,
  Users,
  BarChart3,
  BookOpen,
} from "lucide-react";

type Role = "admin" | "manager" | "staff" | "grader" | "unknown";

type Step = {
  title: string;
  desc: string;
  icon?: React.ReactNode;
  path?: string;
};

type QuickLink = {
  label: string;
  path: string;
  icon?: React.ReactNode;
};

function pickRole(rawRoles: unknown): Role {
  const rolesArr: string[] = Array.isArray(rawRoles)
    ? rawRoles.map(String)
    : typeof rawRoles === "string"
      ? [rawRoles]
      : [];

  const r = rolesArr.map((x) => x.toLowerCase());
  if (r.includes("admin")) return "admin";
  if (r.includes("manager")) return "manager";
  if (r.includes("staff")) return "staff";
  if (r.includes("grader")) return "grader";
  return "unknown";
}

const GUIDE: Record<
  Role,
  { title: string; subtitle: string; steps: Step[]; links: QuickLink[] }
> = {
  admin: {
    title: "คู่มือสำหรับผู้ดูแลระบบ (Admin)",
    subtitle: "จัดการโครงสร้างรอบสอบ ผู้ใช้ และตรวจความพร้อมก่อนปล่อยผล",
    steps: [
      {
        title: "สร้างรอบสอบ",
        desc: "สร้างรอบสอบ เช่น สนามใหญ่ 2568 , วันที่สอบ เช่น วันที่ 1 , 2 , 3 และเลือกรายวิชาที่ต้องการให้วันนั้นๆสอบ",
        icon: "",
        path: "/campaignsession",
      },
      {
        title: "สร้างรายวิชาและหัวข้อในแต่ละวิชา",
        desc: "สร้างรายวิชา เช่น กฎหมายพิเศษและภาษาอังกฤษ จากนั้นสามารถสร้างหัวข้อและคะแนนเต็มในแต่ละหัวข้อได้ เช่น กฎหมายรัฐธรรมนูญ 10 คะแนน ",
        icon: "",
        path: "/campaignsession",
      },
      {
        title: "นำเข้าข้อมูลผู้เข้าสอบ",
        desc: "ตรวจสอบและนำเข้าข้อมูลผู้เข้าสอบตามกำหนด",
        icon: "",
        path: "/import",
      },
      {
        title: "จัดที่นั่งสอบ",
        desc: "สามารถสร้างห้องสอบและจัดที่นั่งให้ผู้เข้าสอบได้",
        icon: "",
        path: "/seats",
      },
      {
        title: "ตั้งค่า",
        desc: "สามารถตั้งค่าระบบ เช่น เปิดการใช้งานระบบสแกนคิวอาร์โค้ดของ Role เจ้าหน้าที่ได้",
        icon: "",
        path: "/dashboard",
      },
      {
        title: "สร้างผู้ตรวจและกำหนดข้อที่ตรวจ",
        desc: "สร้างผู้ตรวจและกำหนดข้อที่ผู้ตรวจคนนั้นได้รับ",
        icon: "",
        path: "/dashboard",
      },
      {
        title: "ปลดล็อก/ปล่อยผลสอบ",
        desc: "ทำได้เมื่อทุกเงื่อนไขพร้อมเท่านั้น",
        icon: "",
        path: "/unlock",
      },
      {
        title: "ออกใบสรุป",
        desc: "สามารถออกใบสรุปได้ เช่น คะแนนรายถุง",
        icon: "",
        path: "/unlock",
      },
      {
        title: "รีเซตคะแนน",
        desc: "สามารถรีเซตคะแนนได้เมื่อพบว่าคะแนนต่างกันเกินเกณฑ์และต้องการให้ผู้ตรวจแก้ไขคะแนนใหม่",
        icon: "",
        path: "/unlock",
      },
    ],
    links: [
      { label: "Dashboard", path: "/dashboard", icon: <BarChart3 size={18} /> },
      {
        label: "Campaigns",
        path: "/campaignsession",
        icon: <BookOpen size={18} />,
      },
      { label: "Key Management", path: "/keys", icon: <Lock size={18} /> },
      { label: "Unlock / Release", path: "/unlock", icon: <CheckCircle2 size={18} /> },
    ],
  },

  manager: {
    title: "คู่มือสำหรับผู้จัดการคีย์ (Manager)",
    subtitle: "ดูภาพรวม ความพร้อม และแก้ปัญหาก่อนปล่อยผล",
    steps: [
      {
        title: "กำหนดคีย์สำหรับการเข้ารหัสคิวอาร์โค้ด",
        desc: "คีย์ต้องมี 2 คีย์ขึ้นไป (ผู้จัดการคีย์คนที่ 1 และคนที่ 2) ถึงจะสามารถเข้ารหัสคิวอาร์โค้ดได้",
        icon: <ClipboardList size={18} />,
      },
      {
        title: "การเข้ารหัสเพื่อสร้างคิวอาร์โค้ด",
        desc: "ผู้จัดการคีย์คนสุดท้ายสามารถกดเข้ารหัสเพื่อสร้างคิวอาร์โค้ดสำหรับผู้เข้าสอบได้",
        icon: <CheckCircle2 size={18} />,
      },
    ],
    links: [
      { label: "Dashboard", path: "/dashboard", icon: <BarChart3 size={18} /> },
      { label: "Seats", path: "/seats", icon: <ClipboardList size={18} /> },
      { label: "Keys", path: "/keys", icon: <Lock size={18} /> },
      { label: "Unlock", path: "/unlock", icon: <CheckCircle2 size={18} /> },
    ],
  },

  staff: {
    title: "คู่มือสำหรับเจ้าหน้าที่ (Staff)",
    subtitle: "งานเตรียมสอบ: นำเข้า/จัดที่นั่ง/จัดถุง/เอกสาร",
    steps: [
      {
        title: "นำเข้าข้อมูลผู้เข้าสอบ",
        desc: "นำเข้ารายการผู้เข้าสอบจาก csv ตามฟอร์แมตที่กำหนด",
        icon: <Users size={18} />,
      },
      {
        title: "จัดสรรที่นั่งสอบ",
        desc: "จัดสรรที่นั่งสอบโดยผู้เข้าสอบนามสกุลเดียวจะไม่นั่งข้างกัน",
        icon: <ClipboardList size={18} />,
      },
      {
        title: "จัดถุงข้อสอบ",
        desc: "สร้างถุง สแกนคิวอาร์โค้ดผู้เข้าสอบเพื่อจัดใส่ถุง ปิดถุงนำส่ง",
        icon: <ClipboardList size={18} />,
      },
      {
        title: "ส่งออกใบหรือเอกสารต่างๆได้",
        desc: "-",
        icon: <Lock size={18} />,
      },
    ],
    links: [
      { label: "Import", path: "/import", icon: <Users size={18} /> },
      { label: "Seats", path: "/seats", icon: <ClipboardList size={18} /> },
      { label: "Bags", path: "/bags", icon: <ClipboardList size={18} /> },
      { label: "Print/QR", path: "/print", icon: <Lock size={18} /> },
    ],
  },

  grader: {
    title: "คู่มือสำหรับผู้ตรวจข้อสอบ (Grader)",
    subtitle: "ตรวจคะแนนตามงานที่ได้รับ และส่งคะแนนให้ครบ",
    steps: [
      {
        title: "เข้าหน้าตรวจคะแนน",
        desc: "เริ่มตรวจตามรายการที่ถูกมอบหมายให้ตรวจได้",
        icon: <ClipboardList size={18} />,
      },
      {
        title: "สแกนคิวอาร์โค้ดเพื่อตรวจข้อสอบ",
        desc: "สแกนเพื่อดึงข้อสอบมาจากฐานข้อมูล",
        icon: <Lock size={18} />,
      },
      {
        title: "กดบันทึกคะแนน",
        desc: "คะแนนจะถูกบันทึกทันที",
        icon: <CheckCircle2 size={18} />,
      },
    ],
    links: [
      { label: "Grading", path: "/grading", icon: <ClipboardList size={18} /> },
      { label: "Disputes", path: "/disputes", icon: <BarChart3 size={18} /> },
    ],
  },

  unknown: {
    title: "เริ่มต้นใช้งานระบบ",
    subtitle: "เลือกเมนูด้านซ้ายเพื่อเริ่มใช้งาน หรือไปหน้า Dashboard เพื่อดูภาพรวม",
    steps: [
      {
        title: "ไปหน้า Dashboard",
        desc: "ดูความคืบหน้าและสถานะรวม",
        icon: <BarChart3 size={18} />,
        path: "/dashboard",
      },
      { title: "ตรวจสิทธิ์ผู้ใช้", desc: "หากเมนูไม่ขึ้น ให้ติดต่อผู้ดูแล", icon: <Users size={18} /> },
    ],
    links: [{ label: "Dashboard", path: "/dashboard", icon: <BarChart3 size={18} /> }],
  },
};

export default function HomePage() {
  const navigate = useNavigate();
  const activeCampaign = useAppSelector(selectActiveCampaign);
  const currentUser = useAppSelector(selectCurrentUser);
  const roles = currentUser?.roles ?? [];
  
  const role = useMemo(() => pickRole((currentUser as any)?.roles), [currentUser]);
  const guide = GUIDE[role];

  const roleLabel = useMemo(() => {
    switch (role) {
      case "admin":
        return "ผู้ดูแลระบบ (Admin)";
      case "manager":
        return "ผู้จัดการคีย์ (Manager)";
      case "staff":
        return "เจ้าหน้าที่ (Staff)";
      case "grader":
        return "ผู้ตรวจข้อสอบ (Grader)";
      default:
        return "ไม่ทราบบทบาท";
    }
  }, [role]);

  const userName =
    (currentUser as any)?.name ||
    (currentUser as any)?.full_name ||
    (currentUser as any)?.username ||
    "ไม่ทราบชื่อ";

  return (
    <div
      className="container-fluid px-3 px-md-4 py-4"
      style={{ background: "#f6f7fb", minHeight: "calc(100vh - 56px)" }}
    >
      {/* Header (เรียบๆ เหมือนรูป) */}
      <div 
        className="card mb-4"
        style={{
          border: 0,
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08)",
          background: "linear-gradient(135deg, #ffffff 0%, #fafafa 100%)"
        }}
      >
        <div className="card-body">
          <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
            <div>
              <h5 className=" mb-1">หน้าแรก</h5>
              <div className="text-muted small">
                {guide.title}
              </div>
            </div>
          </div>
        </div>
      </div>

       {/* style={{ borderLeft: "4px solid #22C55E", borderTop: "3px solid #22C55E", transition: "transform 0.2s, box-shadow 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(34,197,94,0.15)"; }} onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = ""; }} */}

      {/* Status row (เรียบๆ) */}
      <div className="row g-3 mb-4">
        <div className="col-lg-6"> 
          <div 
            className="card h-100"
            style={{
              border: 0,
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.12), 0 1px 4px rgba(0, 0, 0, 0.08)",
              transition: 'transform 0.2s ease, box-shadow 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = "0 6px 16px rgba(0, 0, 0, 0.15), 0 3px 8px rgba(0, 0, 0, 0.10)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.12), 0 1px 4px rgba(0, 0, 0, 0.08)";
            }}
          >
            <div className="card-body">
              <div className="text-muted small mb-1">ผู้ใช้</div>
              <div className="fw-semibold">{userName}</div>
              <div className="text-muted small">บทบาท: {roleLabel}</div>
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div 
            className="card h-100"
            style={{
              border: 0,
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.12), 0 1px 4px rgba(0, 0, 0, 0.08)",
              transition: 'transform 0.2s ease, box-shadow 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = "0 6px 16px rgba(0, 0, 0, 0.15), 0 3px 8px rgba(0, 0, 0, 0.10)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.12), 0 1px 4px rgba(0, 0, 0, 0.08)";
            }}
          >
            <div className="card-body">
              <div className="text-muted small mb-1">รอบสอบที่กำลังใช้งาน</div>
              <div className="fw-semibold">
                {activeCampaign?.name || "ยังไม่ได้เลือกแคมเปญ"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="row g-3">
        {/* Steps -> ทำเป็นตารางแบบหน้าอื่น */}
        <div className="col-lg-12">
          <div 
            className="card"
            style={{
              border: 0,
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08)"
            }}
          >
            <div 
              className="card-body"
              style={{
                background: "linear-gradient(180deg, #fafafa 0%, #ffffff 100%)"
              }}
            >
              <div className="d-flex align-items-baseline justify-content-between mb-3">
                <div>
                  <div className="fw-bold">ลำดับการใช้งานระบบ</div>
                  <div className="text-muted small">แนะนำตามบทบาท</div>
                </div>
              </div>

              <div className="table-responsive">
                <table className="table mb-0 align-middle text-nowrap">
                  <thead
                    style={{
                      backgroundColor: "#f5f5f5",
                      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.08)"
                    }}
                  >
                    <tr className="align-middle">
                      <th style={{ width: 70 }} className="text-center">ลำดับ</th>
                      <th style={{ width: 46 }}></th>
                      <th>รายการ</th>
                      <th className=" d-md-table-cell">รายละเอียด</th>
                    </tr>
                  </thead>

                  <tbody>
                    {guide.steps.map((s, idx) => {
                      const clickable = Boolean(s.path);
                      return (
                        <tr 
                          key={idx} 
                          style={{ 
                            opacity: clickable ? 1 : 1,
                            cursor: clickable ? 'pointer' : 'default',
                            transition: 'background-color 0.2s ease'
                          }}
                          onClick={() => clickable && s.path && navigate(s.path)}
                          onMouseEnter={(e) => {
                            if (clickable) {
                              e.currentTarget.style.backgroundColor = "#f9f9f9";
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <td className="text-center">{idx + 1}</td>

                          <td>
                            <span className="text-muted">
                              {s.icon ?? <CheckCircle2 size={18} />}
                            </span>
                          </td>

                          <td className="fw-semibold">{s.title}</td>

                          <td className="text-muted small  d-md-table-cell">
                            {s.desc}
                          </td>
                          {/* 
                          <td className="text-center">
                            <button
                              className={`btn btn-sm ${clickable ? "btn-outline-primary" : "btn-outline-secondary"
                                }`}
                              onClick={() => s.path && navigate(s.path)}
                              disabled={!clickable}
                            >
                              ไปหน้า <ArrowRight size={16} className="ms-1" />
                            </button>
                          </td> */}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
}