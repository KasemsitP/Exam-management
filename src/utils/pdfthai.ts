// src/utils/pdf-thai-font.ts
import pdfMake from "pdfmake/build/pdfmake";

function bufToBase64(buf: ArrayBuffer) {
  let s = "";
  const bytes = new Uint8Array(buf);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    s += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk) as any);
  }
  return btoa(s);
}

export async function ensureThaiFontsLoaded() {
  // โหลดครั้งเดียว
  if ((pdfMake as any)._thaiFontsLoaded) return;

  const files = [
    ["THSarabunNew.ttf", "/fonts/THSarabunNew.ttf"],
    ["THSarabunNew-Bold.ttf", "/fonts/THSarabunNew-Bold.ttf"],
    ["THSarabunNew-Italic.ttf", "/fonts/THSarabunNew-Italic.ttf"],
    ["THSarabunNew-BoldItalic.ttf", "/fonts/THSarabunNew-BoldItalic.ttf"],
  ] as const;

  const entries = await Promise.all(
    files.map(async ([name, url]) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Font not found: ${url}`);
      const b64 = bufToBase64(await res.arrayBuffer());
      return [name, b64] as const;
    })
  );

  (pdfMake as any).vfs = Object.fromEntries(entries);
  (pdfMake as any).fonts = {
    THSarabun: {
      normal: "THSarabunNew.ttf",
      bold: "THSarabunNew-Bold.ttf",
      italics: "THSarabunNew-Italic.ttf",
      bolditalics: "THSarabunNew-BoldItalic.ttf",
    },
  };
  (pdfMake as any)._thaiFontsLoaded = true;
}
