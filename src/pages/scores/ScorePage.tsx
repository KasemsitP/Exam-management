import React, { useEffect, useMemo, useState } from "react";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  Filter,
  FileText,
  Users,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hook";
import {
  selectActiveCampaign,
  selectActiveCampaignSessions,
} from "@/store/slices/examData.slice";
import axios from "axios";
import { fetchBagsForCampaignThunk } from "@/store/slices/bags.slice";

import type {
  BagScoreBagSummary,
  BagScoresApiResponse,
  BagBookletScore,
  BagQuestionScoreRow,
} from "./types";

type ViewMode = "score" | "grader";

export default function BagScoresPage() {
  const dispatch = useAppDispatch();
  const activeCampaign = useAppSelector(selectActiveCampaign);
  useAppSelector(selectActiveCampaignSessions); // แค่ให้ selector run

  const [bags, setBags] = useState<BagScoreBagSummary[]>([]);
  const [loadingBags, setLoadingBags] = useState(false);
  const [errorBags, setErrorBags] = useState<string | null>(null);

  const [selectedSessionId, setSelectedSessionId] = useState<string>("all");
  const [selectedBagId, setSelectedBagId] = useState<number | null>(null);

  const [bagScores, setBagScores] = useState<BagScoresApiResponse | null>(null);
  const [loadingScores, setLoadingScores] = useState(false);
  const [errorScores, setErrorScores] = useState<string | null>(null);

  // โหมดแสดงผลคะแนน / ชื่อผู้ตรวจ
  const [viewMode, setViewMode] = useState<ViewMode>("score");

  // -----------------------------
  // 1) โหลดถุงทั้งหมดของ campaign
  // -----------------------------
  useEffect(() => {
    if (!activeCampaign) return;

    setLoadingBags(true);
    setErrorBags(null);

    dispatch(fetchBagsForCampaignThunk(activeCampaign.id))
      .unwrap()
      .then((rawBags: any[]) => {
        const mapped: BagScoreBagSummary[] = rawBags.map((b) => ({
          bagId: Number(b.id),
          bagNo: Number(b.bag_no),
          campaignId: Number(b.campaignId),
          sessionId: Number(b.sessionId),
          sessionLabel: b.sessionLabel,
          subjectId: b.subjectId ?? 0,
          subjectName: b.subjectName ?? "",
          status: b.status,
          scannedCount: Number(b.scannedCount ?? 0),
        }));
        setBags(mapped);
      })
      .catch((err: any) => {
        console.error(err);
        setErrorBags(err?.message ?? "โหลดข้อมูลถุงไม่สำเร็จ");
        setBags([]);
      })
      .finally(() => setLoadingBags(false));
  }, [activeCampaign, dispatch]);

  // -----------------------------
  // 2) Filter ตาม session + เลือกถุง
  // -----------------------------
  const sessionOptions = useMemo(() => {
    const map = new Map<number, string>();
    for (const b of bags) {
      if (!map.has(b.sessionId)) map.set(b.sessionId, b.sessionLabel);
    }
    return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
  }, [bags]);

  const filteredBags = useMemo(() => {
    if (selectedSessionId === "all") return bags;
    const sid = Number(selectedSessionId);
    return bags.filter((b) => b.sessionId === sid);
  }, [bags, selectedSessionId]);

  const currentBagIndex = useMemo(() => {
    if (!selectedBagId) return -1;
    return filteredBags.findIndex((b) => b.bagId === selectedBagId);
  }, [filteredBags, selectedBagId]);

  const selectedBag =
    currentBagIndex >= 0 ? filteredBags[currentBagIndex] : null;

  // auto เลือกถุงแรกของ filter นั้น ๆ
  useEffect(() => {
    if (filteredBags.length === 0) {
      setSelectedBagId(null);
      return;
    }
    const stillExists = filteredBags.some((b) => b.bagId === selectedBagId);
    if (!selectedBagId || !stillExists) {
      setSelectedBagId(filteredBags[0].bagId);
    }
  }, [filteredBags, selectedBagId]);

  const handleNavigateBag = (direction: "prev" | "next") => {
    if (currentBagIndex === -1) return;
    let newIndex = currentBagIndex;
    if (direction === "prev") newIndex = Math.max(0, currentBagIndex - 1);
    if (direction === "next")
      newIndex = Math.min(filteredBags.length - 1, currentBagIndex + 1);

    if (newIndex !== currentBagIndex) {
      setSelectedBagId(filteredBags[newIndex].bagId);
    }
  };

  // -----------------------------
  // 3) โหลดคะแนนของถุงที่เลือก
  // -----------------------------
  useEffect(() => {
    if (!selectedBagId || !activeCampaign) return;

    let cancelled = false;

    const fetchScores = async () => {
      setLoadingScores(true);
      setErrorScores(null);
      setBagScores(null);

      try {
        const res = await axios.get<BagScoresApiResponse>(
          `http://localhost:8000/api/reports/bags/${selectedBagId}/scores`,
          { params: { campaignId: activeCampaign.id } }
        );
        if (cancelled) return;
        setBagScores(res.data);
      } catch (err: any) {
        if (cancelled) return;
        console.error(err);
        setErrorScores(
          err?.response?.data?.message ?? "โหลดคะแนนของถุงนี้ไม่สำเร็จ"
        );
        setBagScores(null);
      } finally {
        if (!cancelled) setLoadingScores(false);
      }
    };

    fetchScores();
    return () => {
      cancelled = true;
    };
  }, [selectedBagId, activeCampaign?.id]);

  // -----------------------------
  // 4) header ข้อสอบ + helper
  // -----------------------------
  const headerQuestions: { questionNo: number; label: string }[] = useMemo(() => {
    if (!bagScores || !bagScores.booklets.length) return [];
    const first = bagScores.booklets[0];

    const byNo = new Map<number, BagQuestionScoreRow>();
    for (const q of first.questions) byNo.set(q.questionNo, q);

    const maxQ =
      bagScores.questionCount || first.questionCount || first.questions.length;

    const arr: { questionNo: number; label: string }[] = [];
    for (let q = 1; q <= maxQ; q++) {
      const qRow = byNo.get(q);
      arr.push({
        questionNo: q,
        label: qRow?.label ?? `ข้อ ${q}`,
      });
    }
    return arr;
  }, [bagScores]);

  const formatScore = (v: number | string | null | undefined) => {
    if (v === null || v === undefined) return "-";
    const num = Number(v);
    if (Number.isNaN(num)) return String(v);
    return num.toFixed(2);
  };

  const calcTotalForBooklet = (bk: BagBookletScore) => {
    return bk.questions.reduce((sum, q) => {
      const v = q.finalScore;
      return sum + (v == null ? 0 : Number(v));
    }, 0);
  };

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <div className="container-fluid px-3 px-sm-4 py-3">
      {/* BAR ด้านบน: filter + เปลี่ยนถุง */}
      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body py-2">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
            {/* filter session */}
            <div className="d-flex flex-wrap align-items-center gap-2">
              <span className="text-muted small d-flex align-items-center">
                {/* <Filter size={16} className="me-1" /> */}
                Session
              </span>
              <select
                className="form-select form-select-sm"
                style={{ width: 220 }}
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
              >
                <option value="all">ทุก session</option>
                {sessionOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label || `Session ${s.id}`}
                  </option>
                ))}
              </select>
              <span className="small text-muted ms-1">
                ถุงทั้งหมด {filteredBags.length} ใบ
              </span>
            </div>

            {/* เลือกถุง + next / prev + โหมดแสดงผล */}
  {/* เลือกถุง + next/prev + โหมดแสดงผล */}
<div className="d-flex flex-wrap align-items-center gap-2 justify-content-start justify-content-lg-end">
  <button
    type="button"
    className="btn btn-sm btn-outline-secondary"
    disabled={currentBagIndex <= 0}
    onClick={() => handleNavigateBag("prev")}
  >
    <ChevronLeft size={16} />
  </button>

  <div className="d-flex align-items-center gap-1 flex-grow-1 flex-md-grow-0">
    <span className="small text-muted">ถุง:</span>
    <select
      className="form-select form-select-sm w-100 w-md-auto"
      value={selectedBagId ?? ""}
      onChange={(e) => setSelectedBagId(Number(e.target.value))}
      disabled={filteredBags.length === 0}
    >
      {filteredBags.map((b, idx) => (
        <option key={b.bagId} value={b.bagId}>
          {idx + 1}. BAG{String(b.bagNo).padStart(3, "0")} – {b.sessionLabel}
        </option>
      ))}
      {filteredBags.length === 0 && <option value="">ไม่มีถุง</option>}
    </select>
  </div>

  <button
    type="button"
    className="btn btn-sm btn-outline-secondary"
    disabled={currentBagIndex === -1 || currentBagIndex >= filteredBags.length - 1}
    onClick={() => handleNavigateBag("next")}
  >
    <ChevronRight size={16} />
  </button>

  <button
    type="button"
    className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 w-100 w-md-auto"
    onClick={() => setViewMode((m) => (m === "score" ? "grader" : "score"))}
  >
    <Users size={14} />
    <span className="small">
      {viewMode === "score" ? "แสดงชื่อผู้ตรวจ" : "แสดงคะแนนตัวเลข"}
    </span>
  </button>
</div>

          </div>
        </div>
      </div>

      {/* เนื้อหาหลัก */}
      {loadingBags && (
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5">
            <Loader2 className="spinner-border mb-2" />
            <div className="text-muted small">กำลังโหลดข้อมูลถุง...</div>
          </div>
        </div>
      )}

      {errorBags && (
        <div className="alert alert-danger shadow-sm">{errorBags}</div>
      )}

      {!loadingBags && !errorBags && filteredBags.length === 0 && (
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5">
            <FileText className="text-muted mb-2" size={32} />
            <div className="text-muted">ไม่พบถุงข้อสอบในเงื่อนไขนี้</div>
          </div>
        </div>
      )}

      {!loadingBags && selectedBag && (
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white border-0 border-bottom">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
              <div>
                <h5 className="mb-0">
                  คะแนนตามรหัสสอบ – BAG
                  {String(selectedBag.bagNo).padStart(3, "0")}
                </h5>
                <div className="text-muted small mt-1 d-flex flex-wrap gap-3">
                  <span>รอบสอบ: {selectedBag.sessionLabel}</span>
                  <span>จำนวนชุดข้อสอบ: {selectedBag.scannedCount}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card-body p-0">
            {loadingScores && (
              <div className="text-center py-5">
                <Loader2 className="spinner-border mb-2" />
                <div className="text-muted small">กำลังโหลดคะแนน...</div>
              </div>
            )}

            {errorScores && !loadingScores && (
              <div className="text-center text-danger py-4">
                <div className="fw-semibold mb-1">โหลดคะแนนไม่สำเร็จ</div>
                <small>{errorScores}</small>
              </div>
            )}

            {!loadingScores &&
              !errorScores &&
              (!bagScores || !bagScores.booklets.length) && (
                <div className="text-center text-muted py-5">
                  ยังไม่มีคะแนนสำหรับถุงนี้
                </div>
              )}

            {/* Score Table */}
            {!loadingScores &&
              !errorScores &&
              bagScores &&
              bagScores.booklets.length > 0 && (
                <div
                  className="table-responsive"
                  style={{
                    maxHeight: "calc(100vh - 260px)",
                    overflowX: "auto",
                  }}
                >
                  <table
                    className="table table-sm mb-0"
                    style={{
                      borderCollapse: "collapse",
                      fontSize: "0.8rem",
                      width: "max-content",
                      minWidth: "100%",
                    }}
                  >
                    <thead>
                      {/* แถวที่ 1 : หัวข้อข้อสอบ + label */}
                      <tr>
                        <th
                          rowSpan={2}
                          className="align-middle text-center"
                          style={{
                            border: "1px solid #dee2e6",
                            backgroundColor: "#f8fafc",
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                          }}
                        >
                          รหัสสอบ
                        </th>

                        {headerQuestions.map((hq) => (
                          <th
                            key={hq.questionNo}
                            colSpan={viewMode === "score" ? 3 : 2}
                            className="text-center"
                            style={{
                              border: "1px solid #dee2e6",
                              backgroundColor: "#f8fafc",
                            }}
                          >
                            <div className="fw-semibold">
                              ข้อ {hq.questionNo}
                            </div>
                            <div
                              className="text-muted"
                              style={{
                                fontSize: "0.72rem",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {hq.label}
                            </div>
                          </th>
                        ))}

                        <th
                          rowSpan={2}
                          className="align-middle text-center"
                          style={{
                            border: "1px solid #dee2e6",
                            backgroundColor: "#e5f0ff",
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                          }}
                        >
                          คะแนนรวม
                        </th>
                      </tr>

                      {/* แถวที่ 2 : หัวคอลัมน์ย่อย */}
                      <tr>
                        {headerQuestions.map((hq) => (
                          <React.Fragment key={`subhead-${hq.questionNo}`}>
                            <th
                              className="text-center"
                              style={{
                                border: "1px solid #dee2e6",
                                backgroundColor: "#fdfdfd",
                              }}
                            >
                              {viewMode === "score" ? "คะแนน 1" : "ผู้ตรวจ 1"}
                            </th>
                            <th
                              className="text-center"
                              style={{
                                border: "1px solid #dee2e6",
                                backgroundColor: "#fdfdfd",
                              }}
                            >
                              {viewMode === "score" ? "คะแนน 2" : "ผู้ตรวจ 2"}
                            </th>

                            {viewMode === "score" && (
                              <th
                                className="text-center"
                                style={{
                                  border: "1px solid #dee2e6",
                                  backgroundColor: "#fdfdfd",
                                }}
                              >
                                รวม(ข้อ)
                              </th>
                            )}
                          </React.Fragment>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {bagScores.booklets.map((bk) => (
                        <tr key={bk.bookletId}>
                          {/* รหัสสอบ */}
                          <td
                            className="text-start"
                            style={{
                              border: "1px solid #dee2e6",
                              fontWeight: 600,
                              backgroundColor: "#ffffff",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {bk.examCode}
                          </td>

                          {/* รายข้อของเล่มนี้ */}
                          {headerQuestions.map((hq) => {
                            const q = bk.questions.find(
                              (qq) => qq.questionNo === hq.questionNo
                            );

                            const score1 = formatScore(q?.grader1Score ?? null);
                            const score2 = formatScore(q?.grader2Score ?? null);
                            const total = formatScore(q?.finalScore ?? null);

                            const name1 = q?.grader1Name || "-";
                            const name2 = q?.grader2Name || "-";

                            if (viewMode === "grader") {
                              return (
                                <React.Fragment
                                  key={`${bk.bookletId}-${hq.questionNo}`}
                                >
                                  <td
                                    className="text-start"
                                    style={{
                                      border: "1px solid #edeff2",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {name1}
                                  </td>
                                  <td
                                    className="text-start"
                                    style={{
                                      border: "1px solid #edeff2",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {name2}
                                  </td>
                                </React.Fragment>
                              );
                            }

                            return (
                              <React.Fragment
                                key={`${bk.bookletId}-${hq.questionNo}`}
                              >
                                <td
                                  className="text-end"
                                  style={{ border: "1px solid #edeff2" }}
                                >
                                  {score1}
                                </td>
                                <td
                                  className="text-end"
                                  style={{ border: "1px solid #edeff2" }}
                                >
                                  {score2}
                                </td>
                                <td
                                  className="text-end fw-semibold"
                                  style={{
                                    border: "1px solid #edeff2",
                                    backgroundColor: "#fafbff",
                                  }}
                                >
                                  {total}
                                </td>
                              </React.Fragment>
                            );
                          })}

                          {/* คะแนนรวมทั้งเล่ม */}
                          <td
                            className="text-end fw-bold"
                            style={{
                              border: "1px solid #dee2e6",
                              backgroundColor: "#e5f0ff",
                            }}
                          >
                            {formatScore(calcTotalForBooklet(bk))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
}
