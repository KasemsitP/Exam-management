// src/pages/exam/ExamRoomsPage.tsx
import { ShowIfCan } from "@/components/auth/ShowIfCan";
import { useExamRooms } from "./hooks/useExamRooms";
import RoomsHeader from "./components/RoomsHeader";
import RoomsTable from "./components/RoomsTable";
import RoomFormModal from "./components/RoomFormModal";
import NoSessionPlaceholder from "./components/NoSessionPlaceholder";

export default function ExamRoomsPage() {
  const {
    activeCampaign,
    sessions,
    selectedSessionId,
    setSelectedSessionId,
    selectedSessionLabel,
    summary,
    filteredRooms,
    loading,
    searchTerm,
    setSearchTerm,
    modal,
    handleRemove,
    handleSubmit,
  } = useExamRooms();

  if (!activeCampaign || sessions.length === 0) {
    return (
      <ShowIfCan permission="manage_rooms">
        <NoSessionPlaceholder />
      </ShowIfCan>
    );
  }

  return (
    <ShowIfCan permission="manage_rooms">
      <div className="d-flex flex-column gap-4">
        <RoomsHeader
          activeCampaign={activeCampaign}
          sessions={sessions}
          selectedSessionId={selectedSessionId}
          onChangeSession={setSelectedSessionId}
          searchTerm={searchTerm}
          onChangeSearch={setSearchTerm}
          onCreate={modal.openCreate}
          summary={summary}
        />

        <RoomsTable
          selectedSessionLabel={selectedSessionLabel}
          rooms={filteredRooms}
          loading={loading}
          onEdit={modal.openEdit}
          onRemove={handleRemove}
        />

        <RoomFormModal
          open={modal.open}
          sessions={sessions}
          selectedSessionId={selectedSessionId}
          editingRoom={modal.editingRoom}
          loading={loading}
          onSubmit={handleSubmit}
          onClose={modal.close}
        />
      </div>
    </ShowIfCan>
  );
}
