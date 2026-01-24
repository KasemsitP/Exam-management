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
    actions,
  } = useCampaignsPage();

  return (
    <ShowIfCan permission="manage_subjects">
      <div className="flex-grow-1 overflow-auto p-2 p-sm-3 p-lg-4">
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
          // visibleCampaigns={visibleCampaigns}
          visibleCampaigns={pagedCampaigns}
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
<div className="position-fixed bottom-0 start-0 w-100 bg-white border-top p-3 z-3">
  <div className="d-flex flex-column flex-sm-row gap-2 align-items-sm-center justify-content-between">
    <div className="text-muted small">
      ทั้งหมด {pagination.totalCampaigns} แคมเปญ • หน้า {pagination.page} / {pagination.totalPages}
    </div>

    <div className="d-flex gap-2 align-items-center">
      <div className="btn-group btn-group-sm">
        <button
          className="btn btn-outline-secondary"
          disabled={pagination.page <= 1}
          onClick={() => pagination.setPage((p) => Math.max(1, p - 1))}
        >
          ก่อนหน้า
        </button>

        <button className="btn btn-outline-secondary" disabled>
          {pagination.page}/{pagination.totalPages}
        </button>

        <button
          className="btn btn-outline-secondary"
          disabled={pagination.page >= pagination.totalPages}
          onClick={() =>
            pagination.setPage((p) =>
              Math.min(pagination.totalPages, p + 1)
            )
          }
        >
          ถัดไป
        </button>
      </div>
    </div>
  </div>
</div>


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
          allSubjects={allSubjects}
        />
      </div>
    </ShowIfCan>
  );
}
