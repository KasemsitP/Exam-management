import { useEffect, useMemo, useState } from "react";
import { Lock, KeyRound, KeySquare, ShieldCheck, Unlock, Hash, Shield } from "lucide-react";

import { useToast } from "@/components/ui/use-toast";
import { ShowIfCan } from "@/components/auth/ShowIfCan";
import { useAppSelector } from "@/store/hook";
import { selectActiveCampaign, selectActiveCampaignSessions } from "@/store/slices/examData.slice";

const STORAGE_KEY = "examflow_active_daily_key";

const canUseBase64 = typeof btoa === "function" && typeof atob === "function";

function safeLocalStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

const toHex = (bytes: Uint8Array): string =>
  Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

const fromHex = (hex: string): Uint8Array => {
  const cleaned = hex.replace(/[^0-9a-f]/gi, "");
  if (cleaned.length < 2) return new Uint8Array();
  const pairs = cleaned.match(/.{1,2}/g) ?? [];
  return new Uint8Array(pairs.map((pair) => parseInt(pair, 16)));
};

const encodeText = (value: string): Uint8Array<ArrayBuffer> => {
  if (typeof TextEncoder !== "undefined") {
    const encoded = new TextEncoder().encode(value);
    const buffer = encoded.buffer.slice(encoded.byteOffset, encoded.byteOffset + encoded.byteLength);
    return new Uint8Array(buffer);
  }
  const buffer = new ArrayBuffer(value.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < value.length; i++) {
    view[i] = value.charCodeAt(i) & 0xff;
  }
  return view;
};

const decodeText = (bytes: Uint8Array): string => {
  if (typeof TextDecoder !== "undefined") {
    return new TextDecoder().decode(bytes);
  }
  let output = "";
  bytes.forEach((byte) => {
    output += String.fromCharCode(byte);
  });
  return output;
};

const fromBase64 = (input: string): Uint8Array => {
  if (!input) return new Uint8Array();
  if (canUseBase64) {
    const binary = atob(input);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
  return fromHex(input);
};

const toBase64 = (bytes: Uint8Array): string => {
  if (canUseBase64) {
    let binary = "";
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return btoa(binary);
  }
  return toHex(bytes);
};

const xorBytes = (data: Uint8Array, key: Uint8Array): Uint8Array => {
  if (!key.length) return data;
  const result = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    result[i] = data[i] ^ key[i % key.length];
  }
  return result;
};

const hashString = async (input: string): Promise<string> => {
  if (typeof crypto !== "undefined" && crypto.subtle && typeof TextEncoder !== "undefined") {
    const digest = await crypto.subtle.digest("SHA-256", encodeText(input));
    return toHex(new Uint8Array(digest));
  }
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  const basic = hash.toString(16).padStart(8, "0");
  return basic.repeat(8).slice(0, 64);
};

async function deriveDailyKey(keyA: string, keyB: string, tweak: string): Promise<string> {
  return hashString(`${keyA}::${keyB}::${tweak}`);
}

async function setActiveDailyKey(key: string): Promise<void> {
  const storage = safeLocalStorage();
  storage?.setItem(STORAGE_KEY, key);
}

function clearActiveDailyKey(): void {
  const storage = safeLocalStorage();
  storage?.removeItem(STORAGE_KEY);
}

async function getActiveDailyKey(): Promise<string | null> {
  const storage = safeLocalStorage();
  return storage?.getItem(STORAGE_KEY) ?? null;
}

async function encryptUserId(userId: string, keyHex: string): Promise<string> {
  const payload = encodeText(userId);
  const key = fromHex(keyHex);
  const cipher = xorBytes(payload, key);
  return toBase64(cipher);
}

async function decryptUserId(ciphertext: string, keyHex: string): Promise<string> {
  const key = fromHex(keyHex);
  const cipher = fromBase64(ciphertext);
  const plain = xorBytes(cipher, key);
  return decodeText(plain);
}

export default function KeyManagementPage() {
  const { toast } = useToast();
  const activeCampaign = useAppSelector(selectActiveCampaign);
  const sessions = useAppSelector(selectActiveCampaignSessions);

  const [keyA, setKeyA] = useState("");
  const [keyB, setKeyB] = useState("");
  const [tweak, setTweak] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState("");

  const [activeKeyPreview, setActiveKeyPreview] = useState("");

  const [userId, setUserId] = useState("U0001");
  const [cipherText, setCipherText] = useState("");
  const [plainText, setPlainText] = useState("");

  const sessionOptions = useMemo(
    () =>
      sessions.map((session) => ({
        id: session.id,
        label: session.label ?? "ไม่ระบุรอบสอบ",
        date: session.examDate ?? null,
      })),
    [sessions]
  );

  useEffect(() => {
    if (!sessionOptions.length) return;
    if (!selectedSessionId || !sessionOptions.some((o) => o.id === selectedSessionId)) {
      setSelectedSessionId(sessionOptions[0].id);
    }
  }, [sessionOptions, selectedSessionId]);

  useEffect(() => {
    if (!tweak && selectedSessionId) setTweak(selectedSessionId);
  }, [selectedSessionId, tweak]);

  const composeTweak = () => (tweak.trim() ? tweak.trim() : new Date().toISOString().slice(0, 10));

  const handleActivate = async () => {
    if (!keyA.trim() || !keyB.trim()) {
      toast({
        title: "กรอกคีย์ให้ครบ",
        description: "กรุณากรอก Key A และ Key B ก่อนเปิดใช้งาน",
        variant: "destructive",
      });
      return;
    }
    const derivedKey = await deriveDailyKey(keyA.trim(), keyB.trim(), composeTweak());
    await setActiveDailyKey(derivedKey);
    setActiveKeyPreview(derivedKey);
    toast({
      title: "เปิดใช้งานคีย์สำเร็จ",
      description: "ระบบจะใช้คีย์นี้ในการเข้ารหัส / ถอดรหัส QR Code",
    });
  };

  const handleDeactivate = () => {
    clearActiveDailyKey();
    setActiveKeyPreview("");
    toast({ title: "ปิดใช้งานคีย์แล้ว" });
  };

  const handleEncrypt = async () => {
    const key = await getActiveDailyKey();
    if (!key) {
      toast({
        title: "ยังไม่ได้ Activate คีย์",
        description: "กรุณาเปิดใช้งานคีย์ก่อนทดลองเข้ารหัส",
        variant: "destructive",
      });
      return;
    }
    if (!userId.trim()) {
      toast({ title: "กรอก userID ก่อน", variant: "destructive" });
      return;
    }
    const ct = await encryptUserId(userId.trim(), key);
    setCipherText(ct);
    toast({ title: "เข้ารหัสเรียบร้อย" });
  };

  const handleDecrypt = async () => {
    const key = await getActiveDailyKey();
    if (!key) {
      toast({
        title: "ยังไม่ได้ Activate คีย์",
        description: "กรุณาเปิดใช้งานคีย์ก่อนทดลองถอดรหัส",
        variant: "destructive",
      });
      return;
    }
    if (!cipherText.trim()) {
      toast({ title: "กรอก ciphertext ก่อน", variant: "destructive" });
      return;
    }
    try {
      const pt = await decryptUserId(cipherText.trim(), key);
      setPlainText(pt);
      toast({ title: "ถอดรหัสสำเร็จ" });
    } catch {
      setPlainText("");
      toast({
        title: "ถอดรหัสไม่สำเร็จ",
        description: "รูปแบบ ciphertext ไม่ถูกต้อง",
        variant: "destructive",
      });
    }
  };

  const statusActive = Boolean(activeKeyPreview);

  return (
    <ShowIfCan anyOf={["manage_keys"]}>
      <div className="container-fluid px-3 px-sm-4 py-4">
        {/* Header */}
        <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-sm-between gap-3 mb-4">
          <div className="d-flex align-items-start gap-3">
            <div className="rounded-circle bg-primary-subtle p-2 text-primary d-inline-flex">
              <Lock size={24} />
            </div>
            <div>
              <h1 className="h4 mb-1">
                Key Management <span className="text-muted">(2 Keys)</span>
              </h1>
              {activeCampaign && (
                <div className="small text-muted">
                  สนามสอบ: <span className="fw-semibold text-body">{activeCampaign.name}</span>
                </div>
              )}
            </div>
          </div>
          <span className={`badge d-inline-flex align-items-center gap-1 ${statusActive ? "text-bg-success" : "text-bg-secondary"}`}>
            <Shield size={14} />
            {statusActive ? "Active" : "Inactive"}
          </span>
        </div>

        {/* Card: กรอกคีย์หลัก */}
        <div className="card shadow-sm mb-4">
          <div className="card-header bg-white">
            <div className="d-flex align-items-center gap-2">
              <KeyRound className="text-primary" size={18} />
              <h6 className="mb-0">กรอกคีย์หลัก</h6>
            </div>
          </div>
          <div className="card-body">
            <div className="row g-4">
              <div className="col-md-6">
                <label className="form-label small d-flex align-items-center gap-2">
                  <KeyRound className="text-primary" size={16} />
                  Key A (ผู้ดูแลคนที่ 1)
                </label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="กรอกคีย์จากผู้ดูแลคนที่ 1"
                  value={keyA}
                  onChange={(e) => setKeyA(e.target.value)}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label small d-flex align-items-center gap-2">
                  <KeySquare className="text-primary" size={16} />
                  Key B (ผู้ดูแลคนที่ 2)
                </label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="กรอกคีย์จากผู้ดูแลคนที่ 2"
                  value={keyB}
                  onChange={(e) => setKeyB(e.target.value)}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label small d-flex align-items-center gap-2">
                  <Hash className="text-primary" size={16} />
                  Tweak / Session
                </label>
                <input
                  className="form-control"
                  placeholder="เช่น sess-day1 หรือ 2025-05-01"
                  value={tweak}
                  onChange={(e) => setTweak(e.target.value)}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label small">เลือกรอบสอบจากระบบ</label>
                <select
                  className="form-select"
                  value={selectedSessionId}
                  onChange={(e) => {
                    setSelectedSessionId(e.target.value);
                    setTweak(e.target.value);
                  }}
                >
                  {sessionOptions.length === 0 && <option value="">ไม่มีข้อมูลรอบสอบ</option>}
                  {sessionOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label} · {s.date ? new Date(s.date).toLocaleDateString("th-TH") : "-"}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="d-flex flex-wrap align-items-center gap-2 mt-3">
              <button className="btn btn-primary d-inline-flex align-items-center gap-2" onClick={handleActivate}>
                <ShieldCheck size={16} />
                Activate คีย์
              </button>
              <button className="btn btn-outline-secondary d-inline-flex align-items-center gap-2" onClick={handleDeactivate}>
                <Unlock size={16} />
                Inactive
              </button>

              {activeKeyPreview && (
                <div className="small text-muted text-break ms-sm-2">
                  คีย์ที่ใช้งาน (mock): {activeKeyPreview.slice(0, 32)}…
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card: ทดลองเข้ารหัส / ถอดรหัส */}
        <div className="card shadow-sm">
          <div className="card-header bg-white">
            <div className="d-flex align-items-center gap-2">
              <Lock className="text-primary" size={18} />
              <h6 className="mb-0">ทดลองเข้ารหัส / ถอดรหัส userID</h6>
            </div>
          </div>
          <div className="card-body">
            <div className="row g-4">
              <div className="col-md-4">
                <label className="form-label small">userID (เช่น SID / National ID)</label>
                <input className="form-control" value={userId} onChange={(e) => setUserId(e.target.value)} />
              </div>
              <div className="col-md-4">
                <label className="form-label small">ciphertext (ผลลัพธ์หลังเข้ารหัส)</label>
                <input className="form-control" value={cipherText} onChange={(e) => setCipherText(e.target.value)} />
              </div>
              <div className="col-md-4">
                <label className="form-label small">plaintext ที่ถอดรหัสได้</label>
                <input className="form-control" value={plainText} readOnly />
              </div>
            </div>

            <div className="d-flex gap-2 mt-3">
              <button className="btn btn-primary" onClick={handleEncrypt}>
                เข้ารหัส
              </button>
              <button className="btn btn-outline-secondary" onClick={handleDecrypt}>
                ถอดรหัส
              </button>
            </div>

            <div className="small text-muted mt-2">
              รูปแบบ ciphertext (mock): <code>base64(iv).base64(ciphertext)</code>
            </div>
          </div>
        </div>
      </div>
    </ShowIfCan>
  );
}



