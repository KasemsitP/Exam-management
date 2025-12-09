// KeyManagementPage.tsx
import { ShowIfCan } from "@/components/auth/ShowIfCan";
import { useKeyManagement } from "./hooks/useKeyManagement";

import KeyHeader from "./components/KeyHeader";
import KeyCreateCard from "./components/KeyCreateCard";
import ActiveKeysCard from "./components/ActiveKeysCard";
import EncryptionCard from "./components/EncryptionCard";

export default function KeyManagementPage() {
  const {
    activeCampaign,
    activeKeys,
    keyStatus,
    keyManagementError,
    sessions,
    prerequisites,
    encryptionStatus,
    lastBulkEncryptionStats,

    keyInput,
    setKeyInput,
    selectedSessionId,

    isLoading,
    canGenerate,
    isEncryptionLoading,
    canEncrypt,

    handleSaveKey,
    handleDeleteKey,
    handleSessionChange,
    handleRunBulkEncryption,
  } = useKeyManagement();

  return (
    <ShowIfCan anyOf={["manage_keys"]}>
      <div className="container-fluid px-3 px-sm-4 py-4">
        <KeyHeader activeCampaign={activeCampaign} />

        <KeyCreateCard
          keyInput={keyInput}
          onKeyInputChange={setKeyInput}
          canGenerate={canGenerate}
          isLoading={isLoading}
          hasActiveCampaign={!!activeCampaign}
          activeKeyCount={activeKeys.length}
          onSaveKey={handleSaveKey}
        />

        <ActiveKeysCard
          activeKeys={activeKeys}
          keyStatus={keyStatus}
          isLoading={isLoading}
          onDeleteKey={handleDeleteKey}
        />

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
        />
      </div>
    </ShowIfCan>
  );
}
