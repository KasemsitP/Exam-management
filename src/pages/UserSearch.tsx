import { useEffect, useMemo, useState } from "react";
import { Search as SearchIcon, Users, Layers, ClipboardList, Filter } from "lucide-react";
import { ShowIfCan } from "@/components/auth/ShowIfCan";
import { useAppSelector } from "@/store/hook";
import { selectCampaigns, selectActiveCampaign } from "@/store/slices/examData.slice";
import {
  selectImportedSummary,
  selectUserSessionsForCampaign,
  selectUsersForCampaign,
} from "@/store/slices/users.slice";

export default function UserSearchPage() {
  const campaigns = useAppSelector(selectCampaigns);
  const activeCampaign = useAppSelector(selectActiveCampaign);
  const [campaignId, setCampaignId] = useState<string | null>(activeCampaign?.id ?? campaigns[0]?.id ?? null);
  const [sessionFilter, setSessionFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!campaignId && campaigns.length) setCampaignId(campaigns[0].id);
  }, [campaigns, campaignId]);

  const campaign = useMemo(
    () => campaigns.find((item) => item.id === campaignId) ?? null,
    [campaigns, campaignId]
  );
  const sessions = campaign?.sessions ?? [];

  useEffect(() => {
    if (sessionFilter !== "all" && sessions.every((s) => s.id !== sessionFilter)) {
      setSessionFilter("all");
    }
  }, [sessions, sessionFilter]);
  const users = useAppSelector(selectUsersForCampaign(campaignId));
  const userSessions = useAppSelector(selectUserSessionsForCampaign(campaignId));
  const summary = useAppSelector(selectImportedSummary(campaignId));
  const sessionMap = useMemo(() => {
    const map = new Map<string, string[]>();
    userSessions.forEach((link) => {
      const list = map.get(link.userId) ?? [];
      list.push(link.sessionId);
      map.set(link.userId, list);
    });
    return map;
  }, [userSessions]);

  const filteredUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return users.filter((user) => {
      const sessionsForUser = sessionMap.get(user.id) ?? [];
      const sessionMatch =
        sessionFilter === "all" || sessionsForUser.includes(sessionFilter) || sessions.length === 0;
      if (!sessionMatch) return false;
      if (!term) return true;

      const combined = [
        user.id,
        user.firstName,
        user.lastName,
        user.nationalId,
        user.row?.["username"],
        user.row?.["email"],
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return combined.includes(term);
    });
  }, [users, searchTerm, sessionFilter, sessionMap, sessions.length]);

  const totalUsers = summary?.totalUsers ?? 0;
  const totalAssignments = summary?.totalAssignments ?? 0;

  return (
    <ShowIfCan permission="manage_users">
      <div className="container py-4">

        {/* Hero / Controls */}
        <div className="rounded-4 border border-white-50 shadow-lg overflow-hidden mb-4"
             style={{ background: "linear-gradient(135deg, rgba(16,185,129,.12), rgba(20,184,166,.08))" }}>
          <div className="p-4 p-md-5 text-white"
               style={{ background: "linear-gradient(90deg, #059669, #10b981, #14b8a6)" }}>
            <p className="text-uppercase fw-semibold mb-1 opacity-75 small">à¸¨à¸¹à¸™à¸¢à¹Œà¸„à¹‰à¸™à¸«à¸²à¸œà¸¹à¹‰à¹€à¸‚à¹‰à¸²à¸ªà¸­à¸š</p>
            <h2 className="h4 fw-semibold mb-2">à¸„à¹‰à¸™à¸«à¸²à¸œà¸¹à¹‰à¹ƒà¸Šà¹‰à¸ˆà¸²à¸à¹à¸„à¸¡à¹€à¸›à¸à¹à¸¥à¸°à¸£à¸­à¸šà¸ªà¸­à¸š</h2>
            <p className="mb-4 opacity-90 small">
              à¹€à¸¥à¸·à¸­à¸à¹à¸„à¸¡à¹€à¸›à¸à¹à¸¥à¸°à¸£à¸°à¸šà¸¸à¸£à¸­à¸šà¸ªà¸­à¸šà¹€à¸žà¸·à¹ˆà¸­à¸„à¹‰à¸™à¸«à¸²à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸œà¸¹à¹‰à¹ƒà¸Šà¹‰à¹à¸¥à¸°à¸›à¸£à¸°à¸§à¸±à¸•à¸´à¸à¸²à¸£à¸ˆà¸±à¸šà¸„à¸¹à¹ˆà¸£à¸­à¸šà¸ªà¸­à¸šà¹„à¸”à¹‰à¹ƒà¸™à¸«à¸™à¹‰à¸²à¸ˆà¸­à¹€à¸”à¸µà¸¢à¸§
            </p>

            <div className="row g-2 g-md-3 align-items-stretch">
              <div className="col-12 col-md-4">
                <select
                  className="form-select form-select-lg bg-white bg-opacity-10 text-white border-0"
                  value={campaignId ?? ""}
                  onChange={(e) => setCampaignId(e.target.value)}
                >
                  {campaigns.map((camp) => (
                    <option key={camp.id} value={camp.id}>{camp.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-12 col-md-4">
                <select
                  className="form-select form-select-lg bg-white bg-opacity-10 text-white border-0"
                  value={sessionFilter}
                  onChange={(e) => setSessionFilter(e.target.value)}
                  disabled={!sessions.length}
                >
                  <option value="all">à¸—à¸¸à¸à¸£à¸­à¸šà¸ªà¸­à¸š</option>
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-12 col-md-4">
                <div className="position-relative">
                  <SearchIcon size={18}
                    className="position-absolute top-50 start-0 translate-middle-y ms-3 text-dark opacity-50" />
                  <input
                    className="form-control form-control-lg ps-5 shadow-sm"
                    placeholder="à¸„à¹‰à¸™à¸«à¸²à¹‚à¸”à¸¢à¸Šà¸·à¹ˆà¸­ à¸™à¸²à¸¡à¸ªà¸à¸¸à¸¥ à¸«à¸¡à¸²à¸¢à¹€à¸¥à¸‚à¸šà¸±à¸•à¸£ à¸«à¸£à¸·à¸­à¸£à¸«à¸±à¸ªà¸œà¸¹à¹‰à¹ƒà¸Šà¹‰"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="row g-3 mb-4">
          <div className="col-12 col-md-4">
            <div className="card shadow-sm h-100">
              <div className="card-body">
                <div className="text-muted small d-flex align-items-center gap-2 mb-1">
                  <Users size={16} className="text-primary" />
                  à¸œà¸¹à¹‰à¹ƒà¸Šà¹‰à¸—à¸±à¹‰à¸‡à¸«à¸¡à¸”
                </div>
                <div className="display-6 fw-semibold">{totalUsers.toLocaleString()}</div>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="card shadow-sm h-100">
              <div className="card-body">
                <div className="text-muted small d-flex align-items-center gap-2 mb-1">
                  <Layers size={16} className="text-primary" />
                  à¸à¸²à¸£à¸ˆà¸±à¸šà¸„à¸¹à¹ˆà¸£à¸­à¸šà¸ªà¸­à¸š
                </div>
                <div className="display-6 fw-semibold">{totalAssignments.toLocaleString()}</div>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="card shadow-sm h-100">
              <div className="card-body">
                <div className="text-muted small d-flex align-items-center gap-2 mb-1">
                  <ClipboardList size={16} className="text-primary" />
                  à¸ˆà¸³à¸™à¸§à¸™à¸œà¸¥à¸à¸²à¸£à¸„à¹‰à¸™à¸«à¸²
                </div>
                <div className="display-6 fw-semibold">{filteredUsers.length.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="card shadow-sm">
          <div className="card-header d-flex flex-column flex-sm-row align-items-sm-center justify-content-sm-between">
            <div>
              <h6 className="mb-1">à¸œà¸¥à¸à¸²à¸£à¸„à¹‰à¸™à¸«à¸²</h6>
              <div className="text-muted small">à¹à¸ªà¸”à¸‡à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸œà¸¹à¹‰à¹ƒà¸Šà¹‰à¸ªà¸³à¸«à¸£à¸±à¸šà¹à¸„à¸¡à¹€à¸›à¸ {campaign?.name ?? "-"}</div>
            </div>
            <div className="d-inline-flex align-items-center gap-2 rounded-pill border px-3 py-1 text-muted small">
              <Filter size={14} />
              {sessionFilter === "all"
                ? "à¸—à¸¸à¸à¸£à¸­à¸šà¸ªà¸­à¸š"
                : (sessions.find((s) => s.id === sessionFilter)?.label ?? "à¹„à¸¡à¹ˆà¸žà¸šà¸£à¸­à¸šà¸ªà¸­à¸š")}
            </div>
          </div>

          <div className="card-body">
            {filteredUsers.length === 0 ? (
              <div className="border border-dashed rounded-4 text-center text-muted p-5">
                à¹„à¸¡à¹ˆà¸¡à¸µà¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸œà¸¹à¹‰à¹ƒà¸Šà¹‰à¸—à¸µà¹ˆà¸•à¸£à¸‡à¸à¸±à¸šà¹€à¸‡à¸·à¹ˆà¸­à¸™à¹„à¸‚
              </div>
            ) : (
              <div className="table-responsive rounded-3 border">
                <table className="table align-middle table-hover mb-0">
                  <thead className="table-light text-muted small">
                    <tr className="text-uppercase">
                      <th>à¸£à¸«à¸±à¸ªà¸œà¸¹à¹‰à¹ƒà¸Šà¹‰</th>
                      <th>à¸Šà¸·à¹ˆà¸­ - à¸™à¸²à¸¡à¸ªà¸à¸¸à¸¥</th>
                      <th>à¸«à¸¡à¸²à¸¢à¹€à¸¥à¸‚à¸­à¹‰à¸²à¸‡à¸­à¸´à¸‡</th>
                      <th>à¸£à¸­à¸šà¸ªà¸­à¸šà¸—à¸µà¹ˆà¸ˆà¸±à¸šà¸„à¸¹à¹ˆ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => {
                      const sessionsForUser = sessionMap.get(user.id) ?? [];
                      return (
                        <tr key={user.id} className="text-body">
                          <td className="fw-semibold">{user.id}</td>
                          <td>
                            <div className="fw-medium">
                              {[user.firstName, user.lastName].filter(Boolean).join(" ") || "à¹„à¸¡à¹ˆà¸£à¸°à¸šà¸¸"}
                            </div>
                            {user.row?.email && (
                              <div className="small text-muted">{user.row.email}</div>
                            )}
                          </td>
                          <td>{user.nationalId ?? user.row?.["citizenId"] ?? "-"}</td>
                          <td>
                            <div className="d-flex flex-wrap gap-1">
                              {sessionsForUser.length === 0 && (
                                <span className="badge text-bg-light border">à¸¢à¸±à¸‡à¹„à¸¡à¹ˆà¸ˆà¸±à¸šà¸„à¸¹à¹ˆ</span>
                              )}
                              {sessionsForUser.map((sid) => {
                                const label = sessions.find((s) => s.id === sid)?.label ?? sid;
                                return (
                                  <span key={`${user.id}-${sid}`} className="badge text-bg-secondary">
                                    {label}
                                  </span>
                                );
                              })}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </ShowIfCan>
  );
}

