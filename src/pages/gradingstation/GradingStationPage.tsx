// GradingStationPage.tsx
import { ShowIfCan } from "@/components/auth/ShowIfCan";
import { useGradingStation } from "./hooks/useGradingStation";
import { OverlayLoader } from "@/components/ui/Loading";

import GradingHeader from "./components/GradingHeader";
import NoProfileCard from "./components/NoProfileCard";
import NoAssignmentCard from "./components/NoAssignmentCard";
import ScannerPanel from "./components/ScannerPanel";
import RecentScoresCard from "./components/RecentScoresCard";
import ConfirmSaveModal from "./components/ConfirmSaveModal";


export default function GradingStationPage() {
  const {
    user,
    graderProfile,
    gradersStatus,
    activeAssignment,
    isLoading,
    isInitialLoading,
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
    setQuestionNo,
    questionNo,

    // handlers
    setPauseAfterSuccess,
    setCooldownMs,
    toggleScanner,
    toggleFacingMode,
    handleClear,
    setManualPayload,
    verifyManualPayload,
    setScore,
   // handleConfirmScore,
    handleSaveScore,
    handleScan,
    closeConfirmModal,
    // requestCameraPermission
    questionMaxScore,


    lastSlotId,
    bagNo,
    QRActive,
    IsScanned,
    random_number,

    draftScores,
    draftBagInfo,
    isDraftLoading,
    confirmAllDraftScores,
    IsHasbag,
    issueScoreFormPdf
  } = useGradingStation();

  // Show loading overlay while initial data is loading
  if (isInitialLoading) {
    return <OverlayLoader open={true} label="" />;
  }

  return (
    <ShowIfCan permission="grade_exams">
      <div className="container-fluid px-3 px-sm-4 py-4">
        {/* Header */}
        <GradingHeader
          user={user}
          graderProfile={graderProfile}
          activeAssignment={activeAssignment}
          gradersStatus={gradersStatus}
          gradersAssignment={gradersAssignment}
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
                onConfirmScore={handleSaveScore}
                onScan={handleScan}
                recent={gradersAssignment}
                questionNo={questionNo}
                setQuestionNo={setQuestionNo}
                slotId={lastSlotId}
                bagNo={bagNo}
                //setQuestionMaxScore={setQuestionMaxScore}
                QrActive={QRActive}
                QuestionMaxScore={questionMaxScore}
                  IsScanned={IsScanned}
                  random_number={random_number}
                  ishasbag={IsHasbag}
              />
            </div>

            {/* Right: Recent */}
            <div className="col-lg-5">
              <RecentScoresCard
                issueScoreFormPdf={issueScoreFormPdf}
                draftScores={draftScores}
                bagInfo={draftBagInfo}
                isDraftLoading={isDraftLoading}
                onConfirmAll={(editedScores) => {
                  if (activeAssignment?.grader_id) {
                    confirmAllDraftScores(activeAssignment.grader_id, editedScores);
                  }
                }}
              />
            </div>
          </div>
        )}

        {/* Confirm Modal */}
        {/* <ConfirmSaveModal
          open={isConfirmOpen}
          scanData={scanData}
          score={score}
          isLoading={isLoading}
          onClose={closeConfirmModal}
          onConfirm={handleSaveScore}
        /> */}
      </div>
    </ShowIfCan>
  );
}