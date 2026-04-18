// src/pages/grader-score-summary/GraderScoreSummaryPage.tsx
import axios from "axios";
import { useEffect, useState, useCallback, useMemo } from "react";
import Swal from "sweetalert2";
import { Loader2, Printer } from "lucide-react";

import { useAppSelector, useAppDispatch } from "@/store/hook";
import {
  selectActiveCampaign,
  selectIsSystemLocked,
} from "@/store/slices/examData.slice";
import { selectCurrentUser } from "@/store/slices/auth.slice";
import {
  fetchGradersForCampaignThunk,
  selectGradersForCampaign,
  selectGradersStatus,
  selectAssignmentsForGrader,
} from "@/store/slices/graders.slice";
import { DeleteCamp } from "@/utils/camp";
import type { GradedBagSummary } from "./types";

export default function GraderScoreSummaryPage() {
  const dispatch = useAppDispatch();
  const activeCampaign = useAppSelector(selectActiveCampaign);
  const locked = useAppSelector(selectIsSystemLocked);
  const user = useAppSelector(selectCurrentUser);

  const [rows, setRows] = useState<GradedBagSummary[]>([]);
  const [loading, setLoading] = useState(false);
  //const [printingBagId, setPrintingBagId] = useState<number | null>(null);
  const [printingKey, setPrintingKey] = useState<string | null>(null);
  const [selectedBag, setSelectedBag] = useState<string>("");

  const bagOptions = useMemo(
    () =>
      Array.from(
        new Set(rows.map((r) => String(r.bagNo ?? "")).filter((v) => v !== ""))
      ).sort((a, b) => Number(a) - Number(b)),
    [rows]
  );

  const filteredRows = useMemo(
    () =>
      selectedBag
        ? rows.filter((r) => String(r.bagNo) === selectedBag)
        : rows,
    [rows, selectedBag]
  );

  const campaignNumericId = activeCampaign?.id
    ? Number(DeleteCamp(String(activeCampaign.id)))
    : null;

  const accountId = user ? Number(user.id) : null;
  const gradersStatus = useAppSelector(selectGradersStatus);
  const graders = useAppSelector(selectGradersForCampaign(campaignNumericId));

  const graderProfile = useMemo(() => {
    if (!user || !graders || graders.length === 0) return null;
    const userId = String(user.id);
    return graders.find((g: any) => String(g.account_id) === userId) ?? null;
  }, [graders, user]);

  const graderId = graderProfile?.grader_id ?? null;

  // Fetch graders for campaign
  useEffect(() => {
    if (activeCampaign && gradersStatus === "idle") {
      dispatch(
        fetchGradersForCampaignThunk(
          activeCampaign.id ? Number(DeleteCamp(activeCampaign.id)) : null
        )
      );
    }
  }, [activeCampaign, gradersStatus, dispatch]);

  const reloadRows = useCallback(async () => {
    if (!campaignNumericId || !graderId) return;
    try {
      const { data } = await axios.get<GradedBagSummary[]>(
        `/api/graders/confirmed-bags/${campaignNumericId}/${graderId}`
      );
      setRows(data);
    } catch (err: any) {
      console.error(err);
      Swal.fire("Error", "โหลดข้อมูลไม่สำเร็จ", "error");
    }
  }, [campaignNumericId, graderId]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        await reloadRows();
      } catch (error) {
        console.error("Failed to load initial data:", error);
      } finally {
        setLoading(false);
      }
    };
    if (graderId) init();
  }, [reloadRows, graderId]);

  const handlePrint = async (row: GradedBagSummary) => {
    const key = `${row.bagId}-${row.questionNo}`;
    setPrintingKey(key);

    try {
      Swal.fire({
        title: "กำลังสร้างเอกสาร...",
        text: "กรุณารอสักครู่",
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => Swal.showLoading(),
      });

      const res = await axios.get(
        `/api/graders/bags/${row.bagId}/score-payload/${row.questionNo}/${graderId}/pdf`,
        { responseType: "blob" }
      );

      Swal.close();

      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "ไม่สามารถพิมพ์เอกสารได้",
        text: error?.response?.data?.message || "เกิดข้อผิดพลาด",
      });
    } finally {
      setPrintingKey(null);
    }
  };
  // Group by bagNo for display
  const groupedByBag = useMemo(() => {
    const map = new Map<
      number,
      { bagNo: number; bagId: number; items: GradedBagSummary[] }
    >();
    for (const row of filteredRows) {
      if (!map.has(row.bagNo)) {
        map.set(row.bagNo, { bagNo: row.bagNo, bagId: row.bagId, items: [] });
      }
      map.get(row.bagNo)!.items.push(row);
    }
    return Array.from(map.values()).sort((a, b) => a.bagNo - b.bagNo);
  }, [filteredRows]);

  if (!graderProfile) {
    return (
      <div className="container-fluid px-3 px-sm-4 py-4">
        <div className="card text-center p-4" style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.12)" }}>
          <p className="text-muted mb-0">
            {gradersStatus === "loading"
              ? "กำลังโหลดข้อมูลผู้ตรวจ..."
              : "ไม่พบข้อมูลผู้ตรวจสำหรับบัญชีนี้"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <fieldset disabled={locked} style={{ opacity: locked ? 0.9 : 1 }}>
      <div className="d-flex flex-column gap-4">
        <div className="container-fluid px-3 px-sm-4 py-3 gap-4 d-flex flex-column">
          {/* Header Card */}
          <div
            className="card mb-3"
            style={{
              boxShadow:
                "0 4px 12px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08)",
            }}
          >
            <div className="card-header bg-white">
              <div className="d-flex justify-content-between align-items-center admin-reset-header-row">
                <div>
                  <h5 className="mb-1">เอกสารสรุปคะแนน</h5>
                  <small className="text-muted">
                    รายการถุงที่ตรวจเสร็จแล้ว สามารถพิมพ์เอกสารสรุปคะแนนได้
                  </small>
                </div>
                <div className="d-flex align-items-center gap-3 admin-reset-filter-wrap gss-filter-wrap">
                  <div className="text-end gss-grader-name">
                    {/* <small className="text-muted d-block">ผู้ตรวจ</small> */}
                    <span className="fw-semibold">{graderProfile.grader_name}</span>
                  </div>
                  <div className="d-flex align-items-center gap-2 gss-select-group">
                    <label
                      className="small text-muted mb-0"
                      style={{ whiteSpace: "nowrap" }}
                    >
                      เลือกถุง:
                    </label>
                    <select
                      className="form-select form-select-sm admin-reset-bag-select gss-select"
                      style={{ minWidth: 160 }}
                      value={selectedBag}
                      onChange={(e) => setSelectedBag(e.target.value)}
                    >
                      <option value="">ทั้งหมด</option>
                      {bagOptions.map((b) => (
                        <option key={b} value={b}>
                          ถุงที่  {b}
                        </option>
                      ))}
                    </select>
                    {/* {selectedBag && (
                      <button
                        type="button"
                        className="btn btn-link btn-sm p-0 text-muted text-decoration-none"
                        onClick={() => setSelectedBag("")}
                      >
                        ล้าง
                      </button>
                    )} */}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="text-center p-4">
              <Loader2 className="spin-animation" /> กำลังโหลด...
            </div>
          ) : filteredRows.length === 0 ? (
            <p className="text-center p-4 text-muted">
              {rows.length === 0
                ? "ยังไม่มีถุงที่ตรวจเสร็จแล้ว"
                : "ไม่มีข้อมูลสำหรับถุงที่เลือก"}
            </p>
          ) : (
            <div
              className="card"
              style={{
                boxShadow:
                  "0 4px 12px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08)",
              }}
            >
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-sm table-hover align-middle text-nowrap mb-0 gss-table">
                    <thead className="table-light">
                      <tr>
                        <th className="text-center">เลขถุง</th>
                        <th className="text-center">วิชา</th>
                        <th className="text-center">ข้อ</th>
                        <th className="text-center">หัวข้อ</th>
                        <th className="text-center">จำนวนที่ตรวจ</th>
                        <th className="text-center">วันที่ยืนยัน</th>
                        <th className="text-center">พิมพ์เอกสาร</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupedByBag.map((group) =>
                        group.items.map((row, idx) => {
                          const rowKey = `${row.bagId}-${row.questionNo}`;

                          return (
                            <tr key={rowKey}>
                              <td className="text-center fw-semibold">{row.bagNo}</td>

                              <td className="text-center">
                                <div>{row.subjectName}</div>
                                <small className="text-muted">รหัสวิชา: {row.subjectCode}</small>
                              </td>

                              <td className="text-center">{row.questionNo}</td>

                              <td className="text-center">{row.questionLabel ?? "-"}</td>

                              <td className="text-center">{row.totalScored}</td>

                              <td className="text-center">
                                {row.confirmedAt
                                  ? new Date(row.confirmedAt).toLocaleString("th-TH", {
                                    dateStyle: "short",
                                    timeStyle: "short",
                                  })
                                  : "-"}
                              </td>

                              <td className="text-center">
                                <button
                                  className="btn btn-sm btn-success d-inline-flex align-items-center gap-1"
                                  onClick={() => handlePrint(row)}
                                  disabled={printingKey === rowKey}
                                >
                                  {printingKey === rowKey ? (
                                    <div className="d-flex align-items-center gap-1">
                                      {/* <Loader2 size={14} className="spin-animation" /> */}
                                      <Printer size={14} />
                                      <span>กำลังสร้าง...</span>
                                    </div>
                                  ) : (
                                    <div className="d-flex align-items-center gap-1">
                                      <Printer size={14} />
                                      <span>พิมพ์คะแนน</span>
                                    </div>
                                    
                                  )}

                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </fieldset>
  );
}
