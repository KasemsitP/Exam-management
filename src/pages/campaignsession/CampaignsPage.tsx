// src/pages/campaigns/CampaignsPage.tsx
import { ShowIfCan } from "@/components/auth/ShowIfCan";
import { useCampaignsPage } from "./hooks/useCampaignsPage";
import { CampaignFiltersCard } from "./components/CampaignFiltersCard";
import { CampaignList } from "./components/CampaignList";
import {
  CampaignModal,
  SessionModal,
  SessionFormModal,
  SubjectModal,
} from "./components/CampaignModals";

export default function CampaignsPage() {
  const {
    visibleCampaigns,
    sessionCount,
    textFilter,
    pagedCampaigns,
    pagination,
    setTextFilter,
    dateFilter,
    setDateFilter,
    resetFilters,
    allSubjects,
    campaignDialog,
    sessionDialog,
    subjectDialog,
    sessionsModal,
    actions,
  } = useCampaignsPage();

  return (
    <ShowIfCan permission="manage_subjects">
      <div className="container-fluid px-3 px-sm-4 py-3 gap-1 d-flex flex-column">
        <CampaignFiltersCard
          textFilter={textFilter}
          onTextFilterChange={setTextFilter}
          dateFilter={dateFilter}
          onDateFilterChange={setDateFilter}
          sessionCount={sessionCount}
          onResetFilters={resetFilters}
          onCreateCampaign={() => actions.openCampaignDialog()}
        />
        <CampaignList
          visibleCampaigns={pagedCampaigns}
          onEditCampaign={actions.openCampaignDialog}
          onDeleteCampaign={actions.confirmAndRemoveCampaign}
          onActiveCampaign={actions.handleToggleActive}
          onOpenSessions={actions.openSessionsModal}
          onCreateCampaign={() => actions.openCampaignDialog()}
        />

        {/* ---- Campaign create/edit modal ---- */}
        <CampaignModal
          open={campaignDialog.open}
          editingCampaignName={campaignDialog.editingCampaign?.name ?? null}
          form={campaignDialog.form}
          onOpenChange={campaignDialog.onOpenChange}
          onSubmit={campaignDialog.onSubmit}
        />

        {/* ---- Sessions overview modal (ตารางวันสอบ + วิชาซ้อน) ---- */}
        <SessionModal
          open={sessionsModal.open}
          campaign={sessionsModal.campaign}
          onOpenChange={sessionsModal.onOpenChange}
          sessionForm={sessionDialog.form}
          sessionContext={sessionDialog.context}
          onSessionFormOpenChange={sessionDialog.onOpenChange}
          onSessionSubmit={sessionDialog.onSubmit}
          onOpenSessionDialog={actions.openSessionDialog}
          onDeleteSession={actions.confirmAndRemoveSession}
          onOpenSubjectDialog={actions.openSubjectDialog}
          onDeleteSubject={actions.confirmAndRemoveSubject}
        />

        {/* ---- Session create/edit form modal ---- */}
        <SessionFormModal
          open={sessionDialog.open}
          context={sessionDialog.context}
          form={sessionDialog.form}
          onOpenChange={sessionDialog.onOpenChange}
          onSubmit={sessionDialog.onSubmit}
        />

        {/* ---- Subject create/edit modal ---- */}
        <SubjectModal
          open={subjectDialog.open}
          context={subjectDialog.context}
          form={subjectDialog.form}
          onOpenChange={subjectDialog.onOpenChange}
          onSubmit={subjectDialog.onSubmit}
          allSubjects={allSubjects}
        />
      </div>
    </ShowIfCan>
  );
}