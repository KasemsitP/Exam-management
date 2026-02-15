// src/pages/bags/components/ComposeBagModal.tsx
import { Scanner, boundingBox } from "@yudiel/react-qr-scanner";
import { Loader2, X, DatabaseZap } from "lucide-react";

interface ComposeBagModalProps {
    open: boolean;
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
    scannedPayloads: string[];
    scannedDate: Date[];
    bagStatus: string;
    bookletsInBag: any[];
    mode?: "existing" | "draft";
}

export default function ComposeBagModal({
    open,
    onClose,
    canScan,
    isSealed,
    scannerEnabled,
    deviceId,
    manualCode,
    onManualCodeChange,
    onManualAdd,
    onScan,
    onRemoveCode,
    scannedPayloads,
    onClearCodes,
    onFinalize,
    bagStatus,
    bookletsInBag,
    scannedDate,
}: ComposeBagModalProps) {
    if (!open) return null;
    return (
        <div
            className={`modal ${open ? "show" : ""}`}
            style={{ display: open ? "block" : "none" }}
            aria-modal={open}
            role="dialog"
        >
            <div className="modal-dialog modal-dialog-centered modal-xl">
                <div className="modal-content">
                    <div className="modal-header">
                        <h6 className="modal-title">สแกนสมุดคำตอบ</h6>
                        <button
                            type="button"
                            className="btn-close"
                            onClick={onClose}
                        />
                    </div>

                    <div className="modal-body">
                        <div className="row g-3">
                            {/* Left */}
                            <div className="col-lg-7">
                                <div className="card border-0 shadow-sm">
                                    <div className="card-header bg-white">
                                        <h6 className="mb-1">
                                            รายการที่้สแกนแล้ว ({scannedPayloads.length} ชุด)
                                        </h6>
                                    </div>

                                    <div className="card-body">
                                        <div
                                            className="border rounded overflow-auto"
                                            style={{ maxHeight: 240 }}
                                        >
                                            <div className="table-responsive">
                                                <table className="table table-sm table-striped align-middle">
                                                    <thead className="table-light">
                                                        <tr>
                                                            <th style={{ width: 80 }}>ลำดับ</th>
                                                            <th>Payload</th>
                                                            <th style={{ width: 150 }}>วัน/เวลา</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {scannedPayloads.map((code, index) => (
                                                            <tr key={`${code}-${index}`}>
                                                                <td>{index + 1}</td>
                                                                <td className="text-truncate" style={{ maxWidth: 300 }}>
                                                                    {code}
                                                                </td>
                                                                <td className="text-muted">
                                                                    {scannedDate[index]?.toLocaleTimeString("th-TH")}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>


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

                            {/* Right */}
                            <div className="col-lg-5">
                                <div className="card border-0 shadow-sm">
                                    <div className="card-header bg-white">
                                        <h6 className="mb-1">สแกนเพิ่ม (QR Payload)</h6>
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
                                                            deviceId
                                                                ? { deviceId }
                                                                : undefined
                                                        }
                                                        onScan={(detected) =>
                                                            detected?.[0]?.rawValue &&
                                                            onScan(detected[0].rawValue)
                                                        }
                                                        onError={(error) =>
                                                            console.log(error)
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
                                                    />
                                                ) : (
                                                    <div
                                                        className="d-flex align-items-center justify-content-center text-muted"
                                                        style={{ height: 400 }}
                                                    >
                                                        <Loader2
                                                            size={24}
                                                            className="me-2 spin-animation"
                                                        />
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
                            disabled={!canScan || bagStatus === "loading"}
                        >
                            {bagStatus === "loading" ? (
                                <Loader2 size={16} className="spin-animation" />
                            ) : (
                                <DatabaseZap size={16} />
                            )}
                            บันทึกข้อมูล
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
