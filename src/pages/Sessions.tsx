
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
  BadgePlus,
  CalendarDays,
  Clock,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAppDispatch, useAppSelector } from "@/store/hook";
import {
  campaignUpdated,
  fetchInitialExamData,
  selectCampaigns,
  selectExamDataStatus,
  sessionUpdated,
  subjectUpdated,
  createCampaignThunk,
  deleteCampaignThunk,
  createSessionThunk,
  deleteSessionThunk,
  createSubjectThunk,
  deleteSubjectThunk,
  ExamCampaign,
  CampaignSession,
  CampaignSubject,
} from "@/store/slices/examData.slice";
import { ShowIfCan } from "@/components/auth/ShowIfCan";

interface CampaignFormValues {
  code: string;
  name: string;
  startDate: string;
  endDate: string;
  description?: string;
  isActive: boolean;
}

interface SessionFormValues {
  label: string;
  examDate: string;
  note?: string;
}

interface SubjectFormValues {
  code: string;
  name: string;
  startTime: string;
  endTime: string;
  questions: number;
  bookletRange: string;
}

interface VisibleCampaign {
  campaign: ExamCampaign;
  sessions: CampaignSession[];
  matchesCampaignOnly: boolean;
}

const formatDate = (date: string) => {
  if (!date) return "-";
  try {
    return new Date(date).toLocaleDateString("th-TH", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return date;
  }
};

const getErrorMessage = (error: unknown) => {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  return "Unexpected error occurred";
};

export default function CampaignsPage() {
  const campaigns = useAppSelector(selectCampaigns);
  const status = useAppSelector(selectExamDataStatus);
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchInitialExamData());
    }
  }, [dispatch, status]);

  const [textFilter, setTextFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const [campaignDialogOpen, setCampaignDialogOpen] = useState(false);
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false);

  const [editingCampaign, setEditingCampaign] = useState<ExamCampaign | null>(null);
  const [sessionContext, setSessionContext] = useState<{
    campaignId: string;
    session: CampaignSession | null;
  } | null>(null);
  const [subjectContext, setSubjectContext] = useState<{
    campaignId: string;
    sessionId: string;
    subject: CampaignSubject | null;
  } | null>(null);

  const campaignForm = useForm<CampaignFormValues>({
    defaultValues: {
      code: "",
      name: "",
      startDate: "",
      endDate: "",
      description: "",
      isActive: true,
    },
  });

  const sessionForm = useForm<SessionFormValues>({
    defaultValues: {
      label: "",
      examDate: "",
      note: "",
    },
  });

  const subjectForm = useForm<SubjectFormValues>({
    defaultValues: {
      code: "",
      name: "",
      startTime: "09:00",
      endTime: "13:00",
      questions: 4,
      bookletRange: "",
    },
  });

  const resetCampaignForm = (campaign?: ExamCampaign | null) => {
    if (campaign) {
      campaignForm.reset({
        code: campaign.code,
        name: campaign.name,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
        description: campaign.description ?? "",
        isActive: campaign.isActive,
      });
    } else {
      campaignForm.reset({
        code: "",
        name: "",
        startDate: "",
        endDate: "",
        description: "",
        isActive: true,
      });
    }
  };

  const resetSessionForm = (session?: CampaignSession | null) => {
    if (session) {
      sessionForm.reset({
        label: session.label,
        examDate: session.examDate,
        note: session.note ?? "",
      });
    } else {
      sessionForm.reset({
        label: "",
        examDate: "",
        note: "",
      });
    }
  };

  const resetSubjectForm = (subject?: CampaignSubject | null) => {
    if (subject) {
      subjectForm.reset({
        code: subject.code,
        name: subject.name,
        startTime: subject.startTime,
        endTime: subject.endTime,
        questions: subject.questions,
        bookletRange: subject.bookletRange,
      });
    } else {
      subjectForm.reset({
        code: "",
        name: "",
        startTime: "09:00",
        endTime: "13:00",
        questions: 4,
        bookletRange: "",
      });
    }
  };

  const openCampaignDialog = (campaign?: ExamCampaign) => {
    setEditingCampaign(campaign ?? null);
    resetCampaignForm(campaign ?? null);
    setCampaignDialogOpen(true);
  };

  const openSessionDialog = (campaignId: string, session?: CampaignSession) => {
    setSessionContext({ campaignId, session: session ?? null });
    resetSessionForm(session ?? null);
    setSessionDialogOpen(true);
  };

  const openSubjectDialog = (
    campaignId: string,
    sessionId: string,
    subject?: CampaignSubject
  ) => {
    setSubjectContext({ campaignId, sessionId, subject: subject ?? null });
    resetSubjectForm(subject ?? null);
    setSubjectDialogOpen(true);
  };

  const visibleCampaigns: VisibleCampaign[] = useMemo(() => {
    const keyword = textFilter.trim().toLowerCase();

    return campaigns
      .map<VisibleCampaign | null>((campaign) => {
        const campaignMatches = keyword
          ? campaign.name.toLowerCase().includes(keyword) ||
            campaign.description?.toLowerCase().includes(keyword)
          : true;

        const sessions = campaign.sessions.filter((session) => {
          const dateMatch = dateFilter ? session.examDate === dateFilter : true;
          const textTargets = [
            session.label,
            session.note ?? "",
            ...session.subjects.flatMap((subject) => [subject.code, subject.name]),
          ].map((entry) => entry.toLowerCase());
          const sessionMatches = keyword ? textTargets.some((value) => value.includes(keyword)) : true;
          return dateMatch && sessionMatches;
        });

        if (!keyword && !dateFilter) {
          return { campaign, sessions: campaign.sessions, matchesCampaignOnly: false };
        }

        if (sessions.length > 0) {
          return { campaign, sessions, matchesCampaignOnly: false };
        }

        if (campaignMatches) {
          return { campaign, sessions: [], matchesCampaignOnly: true };
        }

        return null;
      })
      .filter((item): item is VisibleCampaign => item !== null);
  }, [campaigns, textFilter, dateFilter]);

  const handleCampaignSubmit = async (values: CampaignFormValues) => {
    const normalizedCode = values.code.trim().toUpperCase();
    if (editingCampaign) {
      dispatch(
        campaignUpdated({
          ...editingCampaign,
          code: normalizedCode,
          name: values.name,
          startDate: values.startDate,
          endDate: values.endDate,
          description: values.description,
          isActive: values.isActive,
        })
      );
      toast({ title: "อัปเดตแคมเปญเรียบร้อย", description: values.name });
    } else {
      try {
        await dispatch(
          createCampaignThunk({
            code: normalizedCode,
            name: values.name,
            startDate: values.startDate,
            endDate: values.endDate,
            description: values.description,
            isActive: values.isActive,
          })
        ).unwrap();
        toast({
          title: "สร้างแคมเปญใหม่เรียบร้อย",
          description: values.name,
        });
        setCampaignDialogOpen(false);
        return;
      } catch (error) {
        toast({
          title: "Failed to create campaign",
          description: getErrorMessage(error),
          variant: "destructive",
        });
        return;
      }
    }
    setCampaignDialogOpen(false);
  };

  const handleSessionSubmit = async (values: SessionFormValues) => {
    if (!sessionContext) return;
    if (sessionContext.session) {
      dispatch(
        sessionUpdated({
          campaignId: sessionContext.campaignId,
          session: {
            ...sessionContext.session,
            label: values.label,
            examDate: values.examDate,
            note: values.note,
          },
        })
      );
      toast({ title: "อัปเดตเซสชันเรียบร้อย", description: values.label });
    } else {
      try {
        const parentCampaign = campaigns.find((c) => c.id === sessionContext.campaignId);
        await dispatch(
          createSessionThunk({
            campaignId: sessionContext.campaignId,
            label: values.label,
            examDate: values.examDate,
            note: values.note,
            dayNo: (parentCampaign?.sessions.length ?? 0) + 1,
          })
        ).unwrap();
        toast({
          title: "สร้างเซสชันใหม่เรียบร้อย",
          description: values.label,
        });
        setSessionDialogOpen(false);
        return;
      } catch (error) {
        toast({
          title: "Failed to create session",
          description: getErrorMessage(error),
          variant: "destructive",
        });
        return;
      }
    }
    setSessionDialogOpen(false);
  };

  const handleSubjectSubmit = async (values: SubjectFormValues) => {
    if (!subjectContext) return;
    if (subjectContext.subject) {
      dispatch(
        subjectUpdated({
          campaignId: subjectContext.campaignId,
          sessionId: subjectContext.sessionId,
          subject: {
            ...subjectContext.subject,
            code: values.code,
            name: values.name,
            startTime: values.startTime,
            endTime: values.endTime,
            questions: Number(values.questions),
            bookletRange: values.bookletRange,
          },
        })
      );
      toast({ title: "?????????????????????", description: values.name });
      setSubjectDialogOpen(false);
      return;
    }

    try {
      const parentCampaign = campaigns.find((c) => c.id === subjectContext.campaignId);
      const parentSession = parentCampaign?.sessions.find((s) => s.id === subjectContext.sessionId);
      const sessionDate = parentSession?.examDate ?? new Date().toISOString().slice(0, 10);
      await dispatch(
        createSubjectThunk({
          campaignId: subjectContext.campaignId,
          sessionId: subjectContext.sessionId,
          sessionDate,
          code: values.code,
          name: values.name,
          startTime: values.startTime,
          endTime: values.endTime,
          questions: Number(values.questions),
          bookletRange: values.bookletRange,
          orderNo: (parentSession?.subjects.length ?? 0) + 1,
        })
      ).unwrap();
      toast({ title: "?????????????????????", description: values.name });
      setSubjectDialogOpen(false);
    } catch (error) {
      toast({
        title: "Failed to create subject",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const confirmAndRemoveCampaign = async (campaign: ExamCampaign) => {
    if (!window.confirm(`ต้องการลบแคมเปญ "${campaign.name}" ใช่หรือไม่?`)) {
      return;
    }
    try {
      await dispatch(deleteCampaignThunk(campaign.id)).unwrap();
      toast({ title: "ลบแคมเปญเรียบร้อย", description: campaign.name, variant: "destructive" });
    } catch (error) {
      toast({ title: "Failed to delete campaign", description: getErrorMessage(error), variant: "destructive" });
    }
  };
  const confirmAndRemoveSession = async (campaignId: string, session: CampaignSession) => {
    if (!window.confirm(`ต้องการลบเซสชัน "${session.label}" ใช่หรือไม่?`)) {
      return;
    }
    try {
      await dispatch(deleteSessionThunk({ campaignId, sessionId: session.id })).unwrap();
      toast({ title: "ลบเซสชันเรียบร้อย", description: session.label, variant: "destructive" });
    } catch (error) {
      toast({ title: "Failed to delete session", description: getErrorMessage(error), variant: "destructive" });
    }
  };
  const confirmAndRemoveSubject = async (
    campaignId: string,
    sessionId: string,
    subject: CampaignSubject
  ) => {
    if (!window.confirm(`??????????????? "${subject.name}" ???????`)) {
      return;
    }
    try {
      await dispatch(
        deleteSubjectThunk({ campaignId, sessionId, subjectId: subject.id })
      ).unwrap();
      toast({ title: "?????????????", description: subject.name, variant: "destructive" });
    } catch (error) {
      toast({
        title: "Failed to delete subject",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const resetFilters = () => {
    setTextFilter("");
    setDateFilter("");
  };

  const handleCampaignDialogChange = (open: boolean) => {
    setCampaignDialogOpen(open);
    if (!open) {
      setEditingCampaign(null);
      resetCampaignForm(null);
    }
  };

  const handleSessionDialogChange = (open: boolean) => {
    setSessionDialogOpen(open);
    if (!open) {
      setSessionContext(null);
      resetSessionForm(null);
    }
  };

  const handleSubjectDialogChange = (open: boolean) => {
    setSubjectDialogOpen(open);
    if (!open) {
      setSubjectContext(null);
      resetSubjectForm(null);
    }
  };

  const sessionCount = visibleCampaigns.reduce((total, item) => total + item.sessions.length, 0);

  return (
    <div className="container py-4">

      {/* Top Filters Card */}
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-white">
          <div className="d-flex flex-column flex-lg-row gap-3 align-items-start align-items-lg-center justify-content-lg-between">
            <div>
              <h5 className="card-title mb-1">สร้างรอบสอบและวันที่สอบ</h5>
              <p className="card-text text-muted mb-0">
                Campaign และ Session การสอบ
              </p>
            </div>
            <ShowIfCan permission="manage_subjects">
              <button className="btn btn-primary d-inline-flex align-items-center gap-2" onClick={() => openCampaignDialog()}>
                <Plus size={16} />
                สร้างแคมเปญใหม่
              </button>
            </ShowIfCan>
          </div>
        </div>

        <div className="card-body">
          <div className="row g-3">
            <div className="col-lg-6">
              <label htmlFor="search" className="form-label text-uppercase small text-muted mb-1">
                ค้นหา
              </label>
              <div className="position-relative">
                <Search className="position-absolute" size={16} style={{ left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--bs-secondary-color)" }} />
                <input
                  id="search"
                  className="form-control ps-5"
                  value={textFilter}
                  onChange={(e) => setTextFilter(e.target.value)}
                  placeholder="ค้นหาแคมเปญ / เซสชัน / รายวิชา"
                />
              </div>
            </div>

            <div className="col-lg-3">
              <label htmlFor="date" className="form-label text-uppercase small text-muted mb-1">
                วันที่สอ
              </label>
              <input
                id="date"
                type="date"
                className="form-control"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>

            <div className="col-lg-3 d-flex align-items-end justify-content-end gap-2">
              <button className="btn btn-outline-secondary" onClick={resetFilters}>
                ล้างตัวกรอง
              </button>
              <span className="badge text-bg-light d-inline-flex align-items-center gap-1">
                <CalendarDays size={14} />
                {sessionCount} เซสชัน
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Campaign list */}
      <div className="d-flex flex-column gap-3">
        {visibleCampaigns.length === 0 && (
          <div className="card border-0">
            <div className="card-body text-center border border-dashed rounded-3 p-5 text-muted">
              ไม่พบข้อมูลแคมเปญหรือรายการที่ค้นหาตรงตามเงื่อนไข
            </div>
          </div>
        )}

        {visibleCampaigns.map(({ campaign, sessions, matchesCampaignOnly }) => (
          <div key={campaign.id} className="card shadow-sm">
            <div className="card-header bg-light d-flex flex-column flex-lg-row gap-3 align-items-start align-items-lg-center justify-content-lg-between">
              <div>
                <div className="d-flex align-items-center gap-2">
                  <h6 className="mb-0">{campaign.name}</h6>
                  <span className="badge text-bg-light d-inline-flex align-items-center gap-1">
                    <CalendarDays size={14} />
                    {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}
                  </span>
                </div>
                {campaign.description && (
                  <p className="mb-0 mt-1 text-muted small">{campaign.description}</p>
                )}
              </div>

              <ShowIfCan permission="manage_subjects">
                <div className="d-flex flex-wrap gap-2">
                  <button className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2" onClick={() => openCampaignDialog(campaign)}>
                    <Pencil size={14} />
                    แก้ไข
                  </button>
                  <button
                    className="btn btn-danger btn-sm d-inline-flex align-items-center gap-2"
                    onClick={() => void confirmAndRemoveCampaign(campaign)}
                  >
                    <Trash2 size={14} />
                    ลบ
                  </button>
                  <button className="btn btn-primary btn-sm d-inline-flex align-items-center gap-2" onClick={() => openSessionDialog(campaign.id)}>
                    <BadgePlus size={14} />
                    เพิ่มเซสชัน
                  </button>
                </div>
              </ShowIfCan>
            </div>

            <div className="card-body bg-body-tertiary">
              {sessions.length === 0 && matchesCampaignOnly && (
                <div className="border border-dashed rounded-3 p-4 text-center text-muted small">
                  แคมเปญนี้ไม่มีรายการที่ตรงกับเงื่อนไข / กรุณาเพิ่มเซสชัน
                </div>
              )}

              {sessions.map((session) => (
                <div key={session.id} className="border rounded-3 bg-white p-4 mb-3">
                  <div className="d-flex flex-column flex-sm-row gap-3 align-items-start align-items-sm-center justify-content-sm-between">
                    <div>
                      <div className="d-flex flex-wrap align-items-center gap-2">
                        <h6 className="mb-0">{session.label}</h6>
                        <span className="badge text-bg-secondary d-inline-flex align-items-center gap-1">
                          <MoreHorizontal size={14} />
                          {session.subjects.length} วิชา
                        </span>
                      </div>
                      <p className="mb-0 mt-1 small text-muted">วันที่สอบ: {formatDate(session.examDate)}</p>
                    </div>

                    <ShowIfCan permission="manage_subjects">
                      <div className="d-flex flex-wrap gap-2">
                        <button className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2" onClick={() => openSessionDialog(campaign.id, session)}>
                          <Pencil size={14} />
                          แก้ไข
                        </button>
                        <button
                          className="btn btn-danger btn-sm d-inline-flex align-items-center gap-2"
                          onClick={() => confirmAndRemoveSession(campaign.id, session)}
                        >
                          <Trash2 size={14} />
                          ลบ
                        </button>
                        <button
                          className="btn btn-primary btn-sm d-inline-flex align-items-center gap-2"
                          onClick={() => openSubjectDialog(campaign.id, session.id)}
                        >
                          <Plus size={14} />
                          เพิ่มรายวิชา
                        </button>
                      </div>
                    </ShowIfCan>
                  </div>

                  <div className="table-responsive mt-3">
                    <table className="table align-middle table-hover">
                      <thead className="table-light text-muted small">
                        <tr>
                          <th>รหัสวิชา</th>
                          <th>ชื่อนวิชา</th>
                          <th className="text-nowrap">เวลา</th>
                          <th className="text-center text-nowrap">จำนวนข้อ</th>
                          <th className="text-nowrap">ชุดเล่มข้อสอบ</th>
                          <th className="text-end">การจัดการ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {session.subjects.map((subject) => (
                          <tr key={subject.id}>
                            <td className="fw-medium">{subject.code}</td>
                            <td>
                              <div>{subject.name}</div>
                              <div className="small text-muted d-flex align-items-center gap-1">
                                <Clock size={12} />
                                {subject.startTime} - {subject.endTime}
                              </div>
                            </td>
                            <td className="small">
                              {subject.startTime} - {subject.endTime}
                            </td>
                            <td className="text-center">{subject.questions}</td>
                            <td>{subject.bookletRange || "-"}</td>
                            <td>
                              <div className="d-flex justify-content-end gap-2">
                                <button
                                  className="btn btn-link p-0"
                                  onClick={() => openSubjectDialog(campaign.id, session.id, subject)}
                                  aria-label="แก้ไขรายวิชา"
                                >
                                  <Pencil size={16} />
                                </button>
                                <button
                                  className="btn btn-link text-danger p-0"
                                  onClick={() =>
                                    void confirmAndRemoveSubject(campaign.id, session.id, subject)
                                  }
                                  aria-label="ลบรายวิชา"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}

                        {session.subjects.length === 0 && (
                          <tr>
                            <td colSpan={6} className="text-center text-muted py-4">
                              ยังไม่มีรายวิชาในเซสชันนี้ กรุณาเพิ่มรายวิชา
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Campaign Modal */}
      {campaignDialogOpen && (
        <>
          <div className="modal fade show d-block" role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h6 className="modal-title">{editingCampaign ? "แก้ไขแคมเปญ" : "สร้างแคมเปญใหม่"}</h6>
                  <button type="button" className="btn-close" onClick={() => handleCampaignDialogChange(false)} />
                </div>
                <form onSubmit={campaignForm.handleSubmit(handleCampaignSubmit)}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label htmlFor="campaign-code" className="form-label">Campaign code</label>
                      <input
                        id="campaign-code"
                        className="form-control"
                        placeholder="e.g. Y68-T2 or 2568A"
                        {...campaignForm.register("code", { required: true })}
                      />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="campaign-name" className="form-label">ชื่อแคมเปญ</label>
                      <input id="campaign-name" className="form-control" {...campaignForm.register("name", { required: true })} />
                    </div>
                    <div className="row g-3">
                      <div className="col-sm-6">
                        <label htmlFor="campaign-start" className="form-label">วันที่เริ่มต้น</label>
                        <input id="campaign-start" type="date" className="form-control" {...campaignForm.register("startDate", { required: true })} />
                      </div>
                      <div className="col-sm-6">
                        <label htmlFor="campaign-end" className="form-label">วันที่สิ้นสุด</label>
                        <input id="campaign-end" type="date" className="form-control" {...campaignForm.register("endDate", { required: true })} />
                      </div>
                    </div>
                    <div className="mt-3">
                      <label htmlFor="campaign-desc" className="form-label">รายละเอียดเพิ่มเติม</label>
                      <input id="campaign-desc" className="form-control" placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)" {...campaignForm.register("description")} />
                    </div>
                    <div className="form-check form-switch mt-3">
                      <input id="campaign-active" type="checkbox" className="form-check-input" {...campaignForm.register("isActive")} />
                      <label className="form-check-label" htmlFor="campaign-active">Active campaign</label>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-outline-secondary" onClick={() => handleCampaignDialogChange(false)}>ยกเลิก</button>
                    <button type="submit" className="btn btn-primary">
                      {editingCampaign ? "บันทึกการแก้ไข" : "สร้างแคมเปญ"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" onClick={() => handleCampaignDialogChange(false)} />
        </>
      )}

      {/* Session Modal */}
      {sessionDialogOpen && (
        <>
          <div className="modal fade show d-block" role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h6 className="modal-title">{sessionContext?.session ? "แก้ไขเซสชัน" : "เพิ่มเซสชันใหม่"}</h6>
                  <button type="button" className="btn-close" onClick={() => handleSessionDialogChange(false)} />
                </div>
                <form onSubmit={sessionForm.handleSubmit(handleSessionSubmit)}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label htmlFor="session-label" className="form-label">ชื่อเซสชัน / รอบสอบ</label>
                      <input id="session-label" className="form-control" {...sessionForm.register("label", { required: true })} />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="session-date" className="form-label">วันที่สอบ</label>
                      <input id="session-date" type="date" className="form-control" {...sessionForm.register("examDate", { required: true })} />
                    </div>
                    <div>
                      <label htmlFor="session-note" className="form-label">หมายเหตุ</label>
                      <input id="session-note" className="form-control" placeholder="เช่น ห้องสอบ / หมายเหตุเพิ่มเติม" {...sessionForm.register("note")} />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-outline-secondary" onClick={() => handleSessionDialogChange(false)}>ยกเลิก</button>
                    <button type="submit" className="btn btn-primary">
                      {sessionContext?.session ? "บันทึกการแก้ไข" : "เพิ่มเซสชัน"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" onClick={() => handleSessionDialogChange(false)} />
        </>
      )}

      {/* Subject Modal */}
      {subjectDialogOpen && (
        <>
          <div className="modal fade show d-block" role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h6 className="modal-title">{subjectContext?.subject ? "แก้ไขรายวิชา" : "เพิ่มรายวิชา"}</h6>
                  <button type="button" className="btn-close" onClick={() => handleSubjectDialogChange(false)} />
                </div>
                <form onSubmit={subjectForm.handleSubmit(handleSubjectSubmit)}>
                  <div className="modal-body">
                    <div className="row g-3">
                      <div className="col-sm-6">
                        <label htmlFor="subject-code" className="form-label">รหัสวิชา</label>
                        <input id="subject-code" className="form-control" {...subjectForm.register("code", { required: true })} />
                      </div>
                      <div className="col-sm-6">
                        <label htmlFor="subject-questions" className="form-label">จำนวนข้อ</label>
                        <input
                          id="subject-questions"
                          type="number"
                          min={1}
                          className="form-control"
                          {...subjectForm.register("questions", { valueAsNumber: true })}
                        />
                      </div>
                    </div>

                    <div className="mt-3">
                      <label htmlFor="subject-name" className="form-label">ชื่อวิชา</label>
                      <input id="subject-name" className="form-control" {...subjectForm.register("name", { required: true })} />
                    </div>

                    <div className="row g-3 mt-1">
                      <div className="col-sm-6">
                        <label htmlFor="subject-start" className="form-label">เวลาเริ่ม</label>
                        <input id="subject-start" type="time" className="form-control" {...subjectForm.register("startTime", { required: true })} />
                      </div>
                      <div className="col-sm-6">
                        <label htmlFor="subject-end" className="form-label">เวลาสิ้นสุด</label>
                        <input id="subject-end" type="time" className="form-control" {...subjectForm.register("endTime", { required: true })} />
                      </div>
                    </div>

                    <div className="mt-3">
                      <label htmlFor="subject-range" className="form-label">ชุดหมายเล่มข้อสอบ (เช่น 1-6)</label>
                      <input id="subject-range" className="form-control" {...subjectForm.register("bookletRange")} />
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button type="button" className="btn btn-outline-secondary" onClick={() => handleSubjectDialogChange(false)}>ยกเลิก</button>
                    <button type="submit" className="btn btn-primary">
                      {subjectContext?.subject ? "บันทึกการแก้ไข" : "เพิ่มรายวิชา"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" onClick={() => handleSubjectDialogChange(false)} />
        </>
      )}
    </div>
  );
}



