// src/pages/campaigns/CampaignsPage.tsx
import { ShowIfCan } from "@/components/auth/ShowIfCan";
import { useCampaignsPage } from "./hooks/useCampaignsPage";
import { CampaignFiltersCard } from "./components/CampaignFiltersCard";
import { CampaignList } from "./components/CampaignList";
import {
  CampaignModal,
  SessionModal,
  SubjectModal,
} from "./components/CampaignModals";

export default function CampaignsPage() {
  const {
    visibleCampaigns,
    sessionCount,
    textFilter,
    setTextFilter,
    dateFilter,
    setDateFilter,
    resetFilters,
    campaignDialog,
    sessionDialog,
    subjectDialog,
    actions,
  } = useCampaignsPage();

  return (
    <ShowIfCan permission="manage_subjects">
      <div className="container py-4">
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
          visibleCampaigns={visibleCampaigns}
          onEditCampaign={actions.openCampaignDialog}
          onDeleteCampaign={actions.confirmAndRemoveCampaign}
          onCreateSession={(campaignId) =>
            actions.openSessionDialog(campaignId)
          }
          onEditSession={(campaignId, session) =>
            actions.openSessionDialog(campaignId, session)
          }
          onDeleteSession={actions.confirmAndRemoveSession}
          onCreateSubject={(campaignId, sessionId) =>
            actions.openSubjectDialog(campaignId, sessionId)
          }
          onEditSubject={(campaignId, sessionId, subject) =>
            actions.openSubjectDialog(campaignId, sessionId, subject)
          }
          onDeleteSubject={actions.confirmAndRemoveSubject}
        />

        <CampaignModal
          open={campaignDialog.open}
          editingCampaignName={campaignDialog.editingCampaign?.name ?? null}
          form={campaignDialog.form}
          onOpenChange={campaignDialog.onOpenChange}
          onSubmit={campaignDialog.onSubmit}
        />

        <SessionModal
          open={sessionDialog.open}
          context={sessionDialog.context}
          form={sessionDialog.form}
          onOpenChange={sessionDialog.onOpenChange}
          onSubmit={sessionDialog.onSubmit}
        />

        <SubjectModal
          open={subjectDialog.open}
          context={subjectDialog.context}
          form={subjectDialog.form}
          onOpenChange={subjectDialog.onOpenChange}
          onSubmit={subjectDialog.onSubmit}
        />
      </div>
    </ShowIfCan>
  );
}
