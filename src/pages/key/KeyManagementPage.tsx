// KeyManagementPage.tsx
import { ShowIfCan } from "@/components/auth/ShowIfCan";
import { useKeyManagement } from "./hooks/useKeyManagement";

import KeyHeader from "./components/KeyHeader";
import KeyCreateCard from "./components/KeyCreateCard";
import ActiveKeysCard from "./components/ActiveKeysCard";
import EncryptionCard from "./components/EncryptionCard";
import { selectIsSystemLocked } from "@/store/slices/examData.slice";
import { useAppSelector } from "@/store/hook";

export default function KeyManagementPage() {
  const locked = useAppSelector(selectIsSystemLocked);
  const {
    activeCampaign,
    activeKeys,
    keyStatus,
    keyManagementError,
    sessions,
    prerequisites,
    encryptionStatus,
    lastBulkEncryptionStats,
    IshasKey,
    firstKey,
    secondKey,
    firstKeyId,
    secondKeyId,
    selectedSessionId,
    headerSummary,
    isLoading,
    canGenerate,
    isEncryptionLoading,
    canEncrypt,
    manager1,
    manager2,
    setFirstKey,
    setSecondKey,
    handleSaveFirstKey,
    handleSaveSecondKey,
    handleSaveKey,
    handleDeleteKey,
    handleSessionChange,
    handleRunBulkEncryption,

  } = useKeyManagement();

  return (
    <fieldset disabled={locked} style={{ opacity: locked ? 0.9 : 1 }}>

      <ShowIfCan anyOf={["manage_keys"]}>
       <div className="container-fluid px-3 px-sm-4 py-3 gap-1 d-flex flex-column">
          <KeyHeader activeCampaign={activeCampaign}
            headerSummary={headerSummary}
          />


          <KeyCreateCard
            firstKey={firstKey}
            secondKey={secondKey}
            firstKeyId={firstKeyId}
            secondKeyId={secondKeyId}
            onFirstKeyChange={setFirstKey}
            onSecondKeyChange={setSecondKey}
            onSaveFirstKey={handleSaveFirstKey}
            onSaveSecondKey={handleSaveSecondKey}
            onDeleteKey={handleDeleteKey}
            canGenerate={canGenerate}
            isLoading={isLoading}
            hasActiveCampaign={!!activeCampaign}
            activeKeyCount={activeKeys.length}
            manager1={manager1}
            manager2={manager2}
            onRunBulkEncryption={handleRunBulkEncryption}
            headerSummary={headerSummary}
          />

          {/* <ActiveKeysCard
          activeKeys={activeKeys}
          keyStatus={keyStatus}
          isLoading={isLoading}
          onDeleteKey={handleDeleteKey}
        />  */}
          {/* 
        <EncryptionCard
          activeKeysCount={activeKeys.length}
          prerequisites={prerequisites}
          sessions={sessions}
          selectedSessionId={selectedSessionId}
          onSessionChange={handleSessionChange}
          canEncrypt={canEncrypt}
          isEncryptionLoading={isEncryptionLoading}
          encryptionStatus={encryptionStatus}
          lastBulkEncryptionStats={lastBulkEncryptionStats}
          keyManagementError={keyManagementError}
          onRunBulkEncryption={handleRunBulkEncryption}
        /> */}
        </div>


      </ShowIfCan>
    </fieldset>
  );
}

