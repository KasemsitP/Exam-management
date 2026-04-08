// KeyManagementPage.tsx
import { ShowIfCan } from "@/components/auth/ShowIfCan";
import { useKeyManagement } from "./hooks/useKeyManagement";
import { OverlayLoader } from "@/components/ui/Loading";

import KeyHeader from "./components/KeyHeader";
import KeyCreateCard from "./components/KeyCreateCard";
import ForgetKeyCard from "./components/ForgetKeyCard";
import NoLinkedCard from "./components/nolinkedCard";
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
    selectedSessionId,
    headerSummary,
    isLoading,
    isInitialLoading,
    canGenerate,
    initialKeyValue,
    isEncryptionLoading,
    canEncrypt,
    myKeyRef,
    myKeyId,
    managerName,

    handleSaveKey,
    handleDeleteKey,
    handleSessionChange,
    handleRunBulkEncryption,


    //keysforget
    forgetKey,
    setForgetKey,
    modalforgetKey,
    setModalForgetKey,
    handleForgetKey,
    accountFullName,
    openForgetKeyModal,
    manager_order,
    islinkedsession

  } = useKeyManagement();

  // Show loading overlay while initial data is loading
  if (isInitialLoading) {
    return <OverlayLoader open={true} label="" />;
  }

  return (
    <fieldset disabled={locked} style={{ opacity: locked ? 0.9 : 1 }}>

      <ShowIfCan anyOf={["manage_keys"]}>
        {islinkedsession ? (
                  <div className="container-fluid px-3 px-sm-4 py-3 gap-1 d-flex flex-column">
          <KeyHeader activeCampaign={activeCampaign}
            headerSummary={headerSummary}
          />


          <KeyCreateCard
            initialKeyValue={initialKeyValue}
            myKeyRef={myKeyRef}
            myKeyId={myKeyId}
            onSaveKey={handleSaveKey}
            onDeleteKey={handleDeleteKey}
            onForgetKey={openForgetKeyModal}
            canGenerate={canGenerate}
            isLoading={isLoading}
            hasActiveCampaign={!!activeCampaign}
            hasTwoKeys={prerequisites.hasTwoKeys}
            managerName={managerName}
            onRunBulkEncryption={handleRunBulkEncryption}
            headerSummary={headerSummary}
            manager_order={manager_order}
          />
          <ForgetKeyCard
            forgetKey={forgetKey}
            setForgetKey={setForgetKey}
            modalforgetKey={modalforgetKey}
            setModalForgetKey={setModalForgetKey}
            handleForgetKey={handleForgetKey}
            accountFullName={accountFullName}
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
        ) : (    
          <NoLinkedCard islinkedsession={islinkedsession} />
        )}

      </ShowIfCan>
    </fieldset>
  );
}

