// ImportCsvPage.tsx
import { ShowIfCan } from "@/components/auth/ShowIfCan";
import { Upload } from "lucide-react";

import { useUserImport } from "./hooks/useUserImport";

import ImportHeader from "./components/ImportHeader";
import ImportControls from "./components/ImportControls";
import ImportAlerts from "./components/ImportAlerts";
import ImportPreviewCard from "./components/ImportPreviewCard";
import { selectIsSystemLocked } from "@/store/slices/examData.slice";
import { useAppSelector } from "@/store/hook";

export default function ImportCsvPage() {
  const locked = useAppSelector(selectIsSystemLocked);
  const {
    activeCampaign,
    importStatus,
    importError,
    supportsImport,
    isImporting,
    fileName,
    encoding,
    setEncoding,
    previewRows,
    setPreviewRows,
    parsed,
    error,
    excelSheetNames,
    excelSelectedSheet,
    setExcelSelectedSheet,
    preview,
    summaryText,
    statsText,
    handleFile,
    handleConfirm,
    resetState
  } = useUserImport();

  return (
    <fieldset disabled={locked} style={{ opacity: locked ? 0.9 : 1 }}>
    <ShowIfCan permission="importcsv">
     <div className="container-fluid px-3 px-sm-4 py-3 gap-1 d-flex flex-column">
        <ImportHeader />

        <div className="card mt-3" style={{ border: 0, boxShadow: "0 4px 12px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08)" }}>
          <div className="card-body">
            <ImportControls
              activeCampaign={activeCampaign}
              supportsImport={supportsImport}
              fileName={fileName}
              encoding={encoding}
              onEncodingChange={setEncoding}
              previewRows={previewRows}
              onPreviewRowsChange={setPreviewRows}
              excelSheetNames={excelSheetNames}
              excelSelectedSheet={excelSelectedSheet}
              onSheetChange={setExcelSelectedSheet}
              onFileChange={handleFile}
              resetState={resetState}
            />
          </div>
        </div>

        <ImportAlerts
          supportsImport={supportsImport}
          error={error}
          importStatus={importStatus}
          importError={importError}
          statsText={statsText}
        />

        {parsed && (
          <ImportPreviewCard
            parsed={parsed}
            preview={preview}
            previewRows={previewRows}
            supportsImport={supportsImport}
            isImporting={isImporting}
            summaryText={summaryText}
            statsText={statsText}
            onConfirm={handleConfirm}
          />
        )}
      </div>
    </ShowIfCan>
    </fieldset>
  );
}
