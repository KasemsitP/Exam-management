// src/pages/bags/components/ComposeBagModal.tsx
import { Scanner, boundingBox } from "@yudiel/react-qr-scanner";
import { Loader2, X, DatabaseZap } from "lucide-react";

interface ComposeBagModalProps {
  open: boolean;
  composeBag: any | null;
  onClose: () => void;
  canScan: boolean;
  isSealed: boolean;
  scannerEnabled: boolean;
  deviceId?: string;
  manualCode: string;
  onManualCodeChange: (v: string) => void;
  onManualAdd: () => void;
  onScan: (raw: string) => void;
  onCapacityChange: (value: number) => void;
  onRemoveCode: (code: string) => void;
  onClearCodes: () => void;
  onFinalize: () => void;
  bagStatus: string;
  bookletsInBag: any[];
}

export default function ComposeBagModal({
  open,
  composeBag,
  onClose,
  canScan,
  isSealed,
  scannerEnabled,
  deviceId,
  manualCode,
  onManualCodeChange,
  onManualAdd,
  onScan,
  onCapacityChange,
  onRemoveCode,
  onClearCodes,
  onFinalize,
  bagStatus,
  bookletsInBag,
}: ComposeBagModalProps) {
  return (
    <div
      className={`modal ${open ? "show" : ""}`}
      style={{ display: open ? "block" : "none" }}
      aria-modal={open}
      role="dialog"
    >
      <div className="modal-dialog modal-dialog-centered modal-xl">
        <div className="modal-content">
          {composeBag && (
            <>
              <div className="modal-header">
                <h6 className="modal-title">
                  สแกนสมุดคำตอบ : {composeBag.id}{" "}
                  <span className="fw-normal text-muted">
                    ({composeBag.scanned.length}/{composeBag.capacity})
                  </span>
                </h6>
                <button
                  type="button"
                  className="btn-close"
                  onClick={onClose}
                />
              </div>

              <div className="modal-body">
                <div className="row g-3">
                  {/* Left: scanned list */}
                  <div className="col-lg-7">
                    <div className="card border-0 shadow-sm">
                      <div className="card-header bg-white">
                        <h6 className="mb-1">
                          รายการสแกนแล้ว (QR Payloads)
                        </h6>
                        <small className="text-muted">
                          วิชา {composeBag.subjectCode ?? "-"} ·{" "}
                          {composeBag.subjectName ?? "ไม่ระบุ"} · รอบ{" "}
                          {composeBag.sessionLabel}
                        </small>
                      </div>
                      <div className="card-body">
                        <div className="d-flex align-items-center justify-content-between small text-muted mb-2">
                          <span>จำนวนที่ต้องการ</span>
                          <div className="d-flex align-items-center gap-2">
                            <input
                              type="number"
                              min={1}
                              value={composeBag.capacity}
                              onChange={(e) =>
                                onCapacityChange(Number(e.target.value))
                              }
                              className="form-control form-control-sm text-end"
                              style={{ width: 90 }}
                            />
                            <span>เล่ม</span>
                          </div>
                        </div>

                        <div
                          className="border rounded overflow-auto"
                          style={{ maxHeight: 240 }}
                        >
                          <ul className="list-group list-group-flush">
                            {isSealed
                              ? bookletsInBag.map((bk: any) => (
                                  <li
                                    key={bk.id}
                                    className="list-group-item"
                                  >
                                    <div className="d-flex flex-column">
                                      <span className="fw-medium">
                                        {bk.userCode} — {bk.fullName}
                                      </span>
                                      <span
                                        className="small text-muted text-truncate"
                                        style={{ maxWidth: "100%" }}
                                      >
                                        {bk.qrPayload}
                                      </span>
                                    </div>
                                  </li>
                                ))
                              : composeBag.scanned.map((code: string) => (
                                  <li
                                    key={code}
                                    className="list-group-item d-flex align-items-center justify-content-between"
                                  >
                                    <span
                                      className="fw-medium text-truncate"
                                      style={{ maxWidth: "80%" }}
                                    >
                                      {code}
                                    </span>
                                    <button
                                      className="btn btn-link text-danger p-1"
                                      onClick={() => onRemoveCode(code)}
                                      title="ลบ"
                                    >
                                      <X size={16} />
                                    </button>
                                  </li>
                                ))}

                            {(!isSealed &&
                              composeBag.scanned.length === 0) ||
                            (isSealed && bookletsInBag.length === 0) ? (
                              <li className="list-group-item text-center text-muted">
                                ยังไม่มีการสแกน QR Code
                              </li>
                            ) : null}
                          </ul>
                        </div>

                        <div className="d-flex justify-content-between small mt-2">
                          <span className="text-muted">
                            ครบ {composeBag.capacity} เล่มหรือไม่
                          </span>
                          <span
                            className={
                              composeBag.scanned.length >=
                              composeBag.capacity
                                ? "text-success"
                                : "text-warning"
                            }
                          >
                            {composeBag.scanned.length >=
                            composeBag.capacity
                              ? "ครบแล้ว"
                              : "ยังไม่ครบ"}
                          </span>
                        </div>
                        <div className="d-flex justify-content-end mt-2">
                          <button
                            className="btn btn-link"
                            onClick={onClearCodes}
                          >
                            ล้างทั้งหมด
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: scanner & manual add */}
                  <div className="col-lg-5">
                    <div className="card border-0 shadow-sm">
                      <div className="card-header bg-white">
                        <h6 className="mb-1">สแกนเพิ่ม (QR Payload)</h6>
                        <small className="text-muted">
                          สแกน QR Code ที่เข้ารหัสจากใบเซ็นชื่อ
                        </small>
                      </div>
                      <div className="card-body">
                        <div className="mb-3">
                          <label className="form-label small text-uppercase text-muted">
                            สแกนด้วยกล้อง
                          </label>
                          <div className="rounded border bg-black overflow-hidden">
                            {canScan && scannerEnabled ? (
                              <Scanner
                                formats={["qr_code"]}
                                constraints={
                                  deviceId ? { deviceId } : undefined
                                }
                                onScan={(detected) =>
                                  detected?.[0]?.rawValue &&
                                  onScan(detected[0].rawValue)
                                }
                                onError={(error) =>
                                  console.log(`onError: ${error}`)
                                }
                                styles={{
                                  container: {
                                    height: "400px",
                                    width: "100%",
                                  },
                                }}
                                components={{
                                  onOff: true,
                                  torch: true,
                                  zoom: true,
                                  finder: true,
                                  tracker: boundingBox,
                                }}
                                allowMultiple={false}
                                scanDelay={1000}
                              />
                            ) : (
                              <div
                                className="d-flex align-items-center justify-content-center text-muted"
                                style={{ height: 400 }}
                              >
                                <Loader2
                                  size={24}
                                  className="me-2 spin-animation"
                                />{" "}
                                รีเซ็ตกล้อง...
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="mb-2">
                          <label className="form-label small text-uppercase text-muted">
                            เพิ่มรหัสด้วยตนเอง
                          </label>
                          <div className="d-flex gap-2">
                            <input
                              className="form-control"
                              value={manualCode}
                              onChange={(e) =>
                                onManualCodeChange(e.target.value)
                              }
                              placeholder="กรอก QR code"
                              disabled={!canScan}
                            />
                            <button
                              className="btn btn-outline-secondary"
                              onClick={onManualAdd}
                              disabled={!canScan}
                            >
                              เพิ่ม
                            </button>
                          </div>
                        </div>

                        {composeBag.scanned.length <
                          composeBag.capacity && (
                          <div className="alert alert-warning py-2 small mb-0">
                            ยังขาด{" "}
                            {composeBag.capacity -
                              composeBag.scanned.length}{" "}
                            เล่ม
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  className="btn btn-outline-secondary"
                  onClick={onClose}
                >
                  ยกเลิก
                </button>
                <button
                  className="btn btn-primary d-inline-flex align-items-center gap-2"
                  onClick={onFinalize}
                  disabled={!canScan}
                >
                  {bagStatus === "loading" ? (
                    <Loader2 size={16} className="spin-animation" />
                  ) : (
                    <DatabaseZap size={16} />
                  )}
                  บันทึกข้อมูล
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
