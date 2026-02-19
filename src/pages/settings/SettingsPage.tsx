// KeyManagementPage.tsx
import { ShowIfCan } from "@/components/auth/ShowIfCan";
import React, { useEffect, useState } from "react";
import { selectIsSystemLocked, selectActiveCampaign, fetchInitialExamData } from "@/store/slices/examData.slice";
import { useAppDispatch, useAppSelector } from "@/store/hook";
import axios from "axios";
import Swal from "sweetalert2";

export default function SettingsPage() {
  const dispatch = useAppDispatch();
  const locked = useAppSelector(selectIsSystemLocked);
  const activeCampaign = useAppSelector(selectActiveCampaign);
  const [loading, setLoading] = useState(false);

  // 1. เปลี่ยนมาใช้ boolean เพื่อผูกกับปุ่ม Toggle (true = เปิด, false = ปิด)
  const [isCampActive, setIsCampActive] = useState<boolean>(false);
  const [isQrActive, setIsQrActive] = useState<boolean>(false);

  useEffect(() => {
    dispatch(fetchInitialExamData());
  }, [dispatch]);

  useEffect(() => {
    if (activeCampaign?.id) {
      loadsStatus();
    }
  }, [activeCampaign]);

  const loadsStatus = async () => {
    if (!activeCampaign?.id) return;

    try {
      const { data } = await axios.get(
        `api/settings/campaign/${activeCampaign.id}`
      );

      const loaded = data?.data ?? {};
      console.log(loaded)

      const campList = Array.isArray(loaded.campStatus) ? loaded.campStatus : [];

      // เช็คสถานะรอบสอบ
      const hasActiveCampaign = campList.some((item: any) => item.is_active === 1);
      setIsCampActive(hasActiveCampaign);

      const QRactive = loaded.QRStatus
      setIsQrActive(QRactive);  
      console.log(QRactive)

    } catch (err) {
      console.error("Load status error:", err);
    }
  };

  const handleCampToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!activeCampaign?.id) return; // เช็คเพื่อป้องกัน error ถ้ายังไม่มี activeCampaign

    const ok = await Swal.fire({
      icon: "warning",
      title: "ยืนยันการเปลี่ยนสถานะรอบสอบ",
      text: `คุณแน่ใจหรือไม่ว่าต้องการ${e.target.checked ? "เปิด" : "ปิด"}รอบสอบนี้?`,
      showCancelButton: true,
      confirmButtonText: "ยืนยัน",
      cancelButtonText: "ยกเลิก",
    });
    if (!ok.isConfirmed) {
      e.preventDefault();
      return;
    }

    const newValue = e.target.checked;
    const previousValue = isCampActive; // เก็บค่าเดิมไว้เผื่อ API พัง

    const TextCheckCamp = !e.target.checked ? "เปิดใช้งานรอบสอบนี้" : "ปิดใช้งานรอบสอบนี้";
    // const TextCheckQR = e.target.checked ? "เปิดใช้งานคิวอาร์โค้ด" : "ปิดใช้งานคิวอาร์โค้ด";


    console.log(e.target.checked, "Toggle Camp Status");

    setIsCampActive(newValue);

    try {
      const result = await axios.patch(`api/settings/set/active/campaign/${activeCampaign.id}`)
      if (result.data?.success) {
        await Swal.fire({
          icon: "success",
          title: `${TextCheckCamp}สำเร็จ`,
          timer: 1500,
          showConfirmButton: false
        });
      }
      console.log("Update Campaign Status to:", newValue);
      loadsStatus()
      fetchInitialExamData();
    } catch (error) {
      console.error("Failed to update campaign status:", error);
      setIsCampActive(previousValue);
      await Swal.fire({
        icon: "error",
        title: `ไม่สามารถ${TextCheckCamp}ได้`,
        text: "กรุณาลองใหม่อีกครั้ง",
      });
      loadsStatus()
      fetchInitialExamData();
    }
  };

  const handleQrToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!activeCampaign?.id) return; // เช็คเพื่อป้องกัน error ถ้ายังไม่มี activeCampaign

    // สร้างตัวแปรเก็บสถานะไว้ก่อน จะได้ไม่งงเวลาดึงไปสร้างประโยคแจ้งเตือน
    const isChecking = e.target.checked;
    const actionText = isChecking ? "เปิด" : "ปิด";
    const TextCheckQR = isChecking ? "เปิดใช้งานคิวอาร์โค้ด" : "ปิดใช้งานคิวอาร์โค้ด";

    const ok = await Swal.fire({
      icon: "warning",
      title: "ยืนยันการเปลี่ยนสถานะคิวอาร์โค้ด",
      text: `คุณแน่ใจหรือไม่ว่าต้องการ${actionText}คิวอาร์โค้ด?`,
      showCancelButton: true,
      confirmButtonText: "ยืนยัน",
      cancelButtonText: "ยกเลิก",
    });

    if (!ok.isConfirmed) {
      e.preventDefault();
      return;
    }

    const newValue = isChecking;
    const previousValue = isQrActive; // เก็บค่าเดิมไว้เผื่อ API พัง

    console.log(newValue, "Toggle QR Status");

    setIsQrActive(newValue);

    try {
      const result = await axios.patch(`api/settings/set/active/keys/${activeCampaign.id}`)
      if (result.data?.success) {
        await Swal.fire({
          icon: "success",
          title: `${TextCheckQR}สำเร็จ`,
          timer: 1500,
          showConfirmButton: false
        });
      }

      console.log("Update QR Status to:", newValue);
      loadsStatus();
      dispatch(fetchInitialExamData());

    } catch (error) {
      console.error("Failed to update QR status:", error);
      setIsQrActive(previousValue);

      await Swal.fire({
        icon: "error",
        title: `ไม่สามารถ${TextCheckQR}ได้`,
        text: "กรุณาลองใหม่อีกครั้ง",
      });

      // ดึงข้อมูลใหม่เพื่อรีเฟรชหน้า
      loadsStatus();
      dispatch(fetchInitialExamData());
    }
  };
  return (
    <fieldset disabled={locked} style={{ opacity: locked ? 0.9 : 1 }}>
      <ShowIfCan anyOf={["manage_graders"]}>
        <div className="container-fluid px-3 px-sm-4 py-3 gap-4 d-flex flex-column">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white d-flex flex-column flex-lg-row align-items-start align-items-lg-center justify-content-between gap-2 gap-md-3">
              <div>
                <h5 className="mb-1 d-flex align-items-center gap-2 text-nowrap">
                  ตั้งค่ารอบสอบ
                </h5>
                <small className="text-muted d-block">
                  ตั้งค่ารอบสอบใน {activeCampaign?.name ?? "-"}
                </small>
              </div>
            </div>
            <div className="card-body p-2 p-sm-3 p-md-4">
              <div className="row g-2 g-sm-3">

                {/* Card 1: สถานะรอบสอบ */}
                <div className="col-12 col-md-6">
                  <div className="card shadow-none border h-100">
                    <div className="card-body p-2 p-sm-3">
                      <div className="small text-muted mb-2 mb-sm-3">สถานะรอบสอบ</div>

                      <div className="d-flex flex-row justify-content-between align-items-center border rounded px-2 px-sm-3 py-2 py-sm-3 gap-2">
                        {/* แสดงข้อความสถานะ */}
                        <span className={`badge ${isCampActive ? 'bg-success' : 'bg-secondary'} fs-6 py-1 px-2 py-sm-2 px-sm-3 text-nowrap`}>
                          {isCampActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                        </span>

                        {/* ปุ่ม Toggle สวิตช์ */}
                        <div
                          className="form-check form-switch mb-0 flex-shrink-0 toggle-switch-mobile"
                          style={{ transform: "scale(1.1)", transformOrigin: "right center" }}
                        >
                          <input
                            className="form-check-input shadow-none"
                            type="checkbox"
                            role="switch"
                            id="campToggleSwitch"
                            checked={isCampActive}
                            onChange={handleCampToggle}
                            style={{ cursor: "pointer" }}
                          />
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

                {/* Card 2: สถานะคิวอาร์โค้ด */}
                <div className="col-12 col-md-6">
                  <div className="card shadow-none border h-100">
                    <div className="card-body p-2 p-sm-3">
                      <div className="small text-muted mb-2 mb-sm-3">
                        สถานะคิวอาร์โค้ด
                      </div>

                      <div className="d-flex flex-row justify-content-between align-items-center border rounded px-2 px-sm-3 py-2 py-sm-3 gap-2">
                        {/* แสดงข้อความสถานะ */}
                        <span className={`badge ${isQrActive ? 'bg-success' : 'bg-secondary'} fs-6 py-1 px-2 py-sm-2 px-sm-3 text-nowrap`}>
                          {isQrActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                        </span>

                        {/* ปุ่ม Toggle สวิตช์ */}
                        <div
                          className="form-check form-switch mb-0 flex-shrink-0 toggle-switch-mobile"
                          style={{ transform: "scale(1.1)", transformOrigin: "right center" }}
                        >
                          <input
                            className="form-check-input shadow-none"
                            type="checkbox"
                            role="switch"
                            id="qrToggleSwitch"
                            checked={isQrActive}
                            onChange={handleQrToggle}
                            style={{ cursor: "pointer" }}
                          />
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </ShowIfCan>
      <style>{`
        @media (min-width: 768px) {
          .toggle-switch-mobile {
            transform: scale(1.5) !important;
          }
        }
      `}</style>
    </fieldset>
  );
}