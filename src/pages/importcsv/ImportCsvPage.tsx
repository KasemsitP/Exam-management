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
  } = useUserImport();

  return (
    <fieldset disabled={locked} style={{ opacity: locked ? 0.9 : 1 }}>
    <ShowIfCan permission="importcsv">
      <div className="flex-grow-1 overflow-auto p-2 p-sm-3 p-lg-4">
        <ImportHeader />

        <div className="card shadow-sm mb-4">
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
