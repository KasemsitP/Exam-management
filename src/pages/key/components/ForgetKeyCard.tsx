import { useEffect, useRef, useState } from "react";

interface ForgeyKeys {
    forgetKey: string,
    setForgetKey: (key: string) => void,
    modalforgetKey: boolean,
    setModalForgetKey: (modal: boolean) => void,
    handleForgetKey: (key: string) => void,
    accountFullName: string

}

function ModalBackdrop({ open }: { open: boolean }) {
    if (!open) return null;
    return <div className="modal-backdrop show" style={{ zIndex: 1050 }} />;


}

export default function ForgetKeyCard({
    forgetKey,
    setForgetKey,
    modalforgetKey,
    setModalForgetKey,
    handleForgetKey,
    accountFullName,
}: ForgeyKeys) {

    const passwordRef = useRef<HTMLInputElement>(null);
    const [showKey, setShowKey] = useState(false);
    const [countdown, setCountdown] = useState(60);

    useEffect(() => {
        if (modalforgetKey) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [modalforgetKey]);
    useEffect(() => {
        if (!forgetKey) return;

        setCountdown(60);

        const interval = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    setForgetKey("");
                    setShowKey(false);
                    return 60;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [forgetKey]);

    const onClose = () => {
        setModalForgetKey(false);
        if (passwordRef.current) {
            passwordRef.current.value = "";
        }
        setForgetKey("");
    };

    const onSubmit = () => {
        const password = passwordRef.current?.value || "";
        if (!password.trim()) return;

        handleForgetKey(password);
    };

    return (
        <>
            <ModalBackdrop open={modalforgetKey} />

            <div
                className={`modal ${modalforgetKey ? "show" : ""}`}
                style={{ display: modalforgetKey ? "block" : "none" }}
                role="dialog"
                aria-modal={modalforgetKey}
            >
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">

                        <div className="modal-header">
                            <h6 className="modal-title">
                                กู้คืนคีย์ของ {accountFullName}
                            </h6>
                            <button type="button" className="btn-close" onClick={onClose} />
                        </div>

                        <div className="modal-body">
                            <div className="mb-3">
                                <label className="form-label">กรอกรหัสผ่านเพื่อกู้คืนคีย์</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    ref={passwordRef}
                                    placeholder="กรอกรหัสผ่านของคุณ"
                                    disabled={!!forgetKey}
                                />
                            </div>

                            {!forgetKey && (
                                <div className="alert alert-warning small mb-0">
                                    การกู้คืนคีย์ต้องใช้รหัสผ่านของผู้จัดการคีย์
                                </div>
                            )}
                            {forgetKey && (
                                <div className="mt-3">
                                    <label className="form-label">คีย์ที่กู้คืนได้</label>

                                    <div className="input-group">
                                        <input
                                            type={showKey ? "text" : "password"}
                                            className="form-control"
                                            value={forgetKey}
                                            readOnly
                                        />

                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary"
                                            onClick={() => setShowKey(!showKey)}
                                        >
                                            {showKey ? "ซ่อน" : "แสดง"}
                                        </button>
                                    </div>
                                </div>
                            )}
                            {forgetKey && (
                                <div className="text-danger small mt-2">
                                    คีย์จะหมดอายุใน {countdown} วินาที
                                </div>
                            )}


                        </div>
                        <div className="modal-footer">
                            <button
                                className="btn btn-outline-secondary"
                                onClick={onClose}
                            >
                                ยกเลิก
                            </button>

                            <button
                                className="btn btn-danger"
                                onClick={onSubmit}
                                disabled={!!forgetKey}
                            >
                                กู้คืนคีย์
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </>
    );
}