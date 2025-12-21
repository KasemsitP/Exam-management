// GradingStationPage.tsx
import { ShowIfCan } from "@/components/auth/ShowIfCan";
import { useGradingStation } from "./hooks/useGradingStation";

import GradingHeader from "./components/GradingHeader";
import NoProfileCard from "./components/NoProfileCard";
import NoAssignmentCard from "./components/NoAssignmentCard";
import ScannerPanel from "./components/ScannerPanel";
import RecentScoresCard from "./components/RecentScoresCard";
import ConfirmSaveModal from "./components/ConfirmSaveModal";
import AssignmentCard from "./components/AssignmentCard"

export default function GradingStationPage() {
  const {
    user,
    graderProfile,
    gradersStatus,
    activeAssignment,
    isLoading,
    gradersAssignment,
    // scanner state
    scanData,
    score,
    manualPayload,
    recent,
    scannerEnabled,
    pause,
    pauseAfterSuccess,
    cooldownMs,
    facingMode,
    isConfirmOpen,

    // handlers
    setPauseAfterSuccess,
    setCooldownMs,
    toggleScanner,
    toggleFacingMode,
    handleClear,
    setManualPayload,
    verifyManualPayload,
    setScore,
    handleConfirmScore,
    handleSaveScore,
    handleScan,
    closeConfirmModal,
    // requestCameraPermission
  } = useGradingStation();

  return (
    <ShowIfCan permission="grade_exams">
      <div className="container-fluid px-3 px-sm-4 py-4">
        {/* Header */}
        <GradingHeader
          user={user}
          graderProfile={graderProfile}
          activeAssignment={activeAssignment}
          gradersStatus={gradersStatus}
        />

        {/* Body: guard by profile & assignment */}
        {!graderProfile ? (
          <NoProfileCard gradersStatus={gradersStatus} />
        ) : !activeAssignment ? (
          <NoAssignmentCard gradersStatus={gradersStatus} />
        ) : (
          <div className="row g-4 mt-1">
            {/* Left: Scanner & Form */}
            <div className="col-lg-7">
              <ScannerPanel
              //  requestCameraPermission={requestCameraPermission}
                scanData={scanData}
                manualPayload={manualPayload}
                score={score}
                scannerEnabled={scannerEnabled}
                pause={pause}
                pauseAfterSuccess={pauseAfterSuccess}
                cooldownMs={cooldownMs}
                facingMode={facingMode}
                isLoading={isLoading}
                onChangePauseAfterSuccess={setPauseAfterSuccess}
                onChangeCooldown={setCooldownMs}
                onToggleScanner={toggleScanner}
                onToggleFacingMode={toggleFacingMode}
                onClear={handleClear}
                onChangeManualPayload={setManualPayload}
                onVerifyManualPayload={verifyManualPayload}
                onChangeScore={setScore}
                onConfirmScore={handleConfirmScore}
                onScan={handleScan}
              />
            </div>

            {/* Right: Recent */}
            <div className="col-lg-5">
              <div className="mb-4">
                <AssignmentCard recent={gradersAssignment} />
              </div>

              <div>
                <RecentScoresCard recent={recent} />
              </div>
            </div>
          </div>
        )}

        {/* Confirm Modal */}
        <ConfirmSaveModal
          open={isConfirmOpen}
          scanData={scanData}
          score={score}
          isLoading={isLoading}
          onClose={closeConfirmModal}
          onConfirm={handleSaveScore}
        />
      </div>
    </ShowIfCan>
  );
}
