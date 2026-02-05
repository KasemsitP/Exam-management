// src/pages/campaigns/hooks/useCampaignsPage.ts
import { useEffect, useMemo, useState } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { useToast } from "@/components/ui/use-toast";
import { useAppDispatch, useAppSelector } from "@/store/hook";
import {
  fetchInitialExamData,
  selectCampaigns,
  selectExamDataStatus,
  ExamCampaign,
  CampaignSession,
  CampaignSubject,
  createCampaignThunk,
  updateCampaignThunk,
  deleteCampaignThunk,
  createSessionThunk,
  deleteSessionThunk,
  createSubjectThunk,
  deleteSubjectThunk,
  sessionUpdated,
  subjectUpdated,
} from "@/store/slices/examData.slice";
import { showSuccess } from "@/components/ui/successAlert";
import { showError } from "@/components/ui/ErrorAlert";
import { selectAllSubjects, fetchSubjectsThunk } from "@/store/slices/subjects.slice";
import Swal from "sweetalert2"
import axios from "axios";
/* -------------------------------------------------------------------------- */
/*  Types for forms & view                                                     */
/* -------------------------------------------------------------------------- */

export interface CampaignFormValues {
  year_be: string;
  site: string
  campaign_size: string
  name: string;
  isActive: boolean;
}

export interface SessionFormValues {
  label: string;
  examDate: string;
  note?: string;
}

export interface SubjectFormValues {
  subjectId: string;
  code: string;
  name: string;
  startTime: string;
  endTime: string;
  questions: number;
}
export interface VisibleCampaign {
  campaign: ExamCampaign;
  sessions: CampaignSession[];
  matchesCampaignOnly: boolean;
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const formatDateForInput = (date: string | Date) => {
  const d = new Date(date);
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  const year = d.getFullYear();
  return `${year}-${month}-${day}`;
};

const getErrorMessage = (error: unknown) => {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  return "Unexpected error occurred";
};

/* -------------------------------------------------------------------------- */
/*  Hook                                                                       */
/* -------------------------------------------------------------------------- */

export function useCampaignsPage() {
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  const campaigns = useAppSelector(selectCampaigns);
  const status = useAppSelector(selectExamDataStatus);
  const allSubjects = useAppSelector(selectAllSubjects);

  // โหลด initial data
  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchInitialExamData());

    }
    dispatch(fetchSubjectsThunk());

  }, [dispatch, status]);



  /* ------------------------------ Filters & UI ----------------------------- */

  const [textFilter, setTextFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const [campaignDialogOpen, setCampaignDialogOpen] = useState(false);
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false);

  const [editingCampaign, setEditingCampaign] = useState<ExamCampaign | null>(
    null
  );

  const [sessionContext, setSessionContext] = useState<{
    campaignId: string;
    session: CampaignSession | null;
  } | null>(null);

  const [subjectContext, setSubjectContext] = useState<{
    campaignId: string;
    sessionId: string;
    subject: CampaignSubject | null;
  } | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(1); // ปรับได้: 5/10/20




  /* ------------------------------ Forms setup ------------------------------ */

  const campaignForm = useForm<CampaignFormValues>({
    defaultValues: {
      campaign_size: "",
      site: "",
      year_be: "",
      name: "",
      isActive: true, // boolean
    },
  });

  const sessionForm = useForm<SessionFormValues>({
    defaultValues: {
      label: "",
      examDate: "",
      note: "",
    },
  });


  const subjectForm: UseFormReturn<SubjectFormValues> = useForm({
    defaultValues: {
      subjectId: "",
      code: "",
      name: "",
      startTime: "14:00",
      endTime: "18:00",
      questions: 0,
    },
  });


  /* ------------------------------- Reset forms ----------------------------- */

  const resetCampaignForm = (campaign?: ExamCampaign | null) => {
    if (campaign) {
      // campaignForm.reset({
      //   code: campaign.code,
      //   name: campaign.name,
      //   startDate: formatDateForInput(campaign.startDate),
      //   endDate: formatDateForInput(campaign.endDate),
      //   description: campaign.description ?? "",
      //   isActive: campaign.isActive,
      // });
    } else {
      campaignForm.reset({
        campaign_size: "",
        site: "",
        year_be: "",
        name: "",
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
        subjectId: "", // ยังไม่ map กลับ master ก็ปล่อยว่างไปก่อน
        code: subject.code,
        name: subject.name,
        startTime: subject.startTime,
        endTime: subject.endTime,
        questions: subject.questions,
      });
    } else {
      subjectForm.reset({
        subjectId: "",
        code: "",
        name: "",
        startTime: "14:00",
        endTime: "18:00",
        questions: 0,
      });
    }
  };


  /* ------------------------------ Open dialogs ----------------------------- */

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

  /* ------------------------------ Filtering logic -------------------------- */

  const visibleCampaigns: VisibleCampaign[] = useMemo(() => {
    const keyword = textFilter.trim().toLowerCase();

    return campaigns
      .map<VisibleCampaign | null>((campaign) => {
        const campaignMatches = keyword
          ? campaign.name.toLowerCase().includes(keyword.toLowerCase())
          : true;

        const sessions = campaign.sessions.filter((session) => {
          const dateMatch = dateFilter ? session.examDate === dateFilter : true;
          const textTargets = [
            session.label,
            session.note ?? "",
            ...session.subjects.flatMap((subject) => [
              subject.code,
              subject.name,
            ]),
          ].map((entry) => entry.toLowerCase());
          const sessionMatches = keyword
            ? textTargets.some((value) => value.includes(keyword))
            : true;
          return dateMatch && sessionMatches;
        });

        if (!keyword && !dateFilter) {
          return {
            campaign,
            sessions: campaign.sessions,
            matchesCampaignOnly: false,
          };
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

  const sessionCount = useMemo(
    () => visibleCampaigns.reduce((total, item) => total + item.sessions.length, 0),
    [visibleCampaigns]
  );

  useEffect(() => {
    setPage(1);
  }, [textFilter, dateFilter, pageSize]);



  const totalCampaigns = visibleCampaigns.length;

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(totalCampaigns / pageSize));
  }, [totalCampaigns, pageSize]);

  const pagedCampaigns = useMemo(() => {
    const start = (page - 1) * pageSize;
    return visibleCampaigns.slice(start, start + pageSize);
  }, [visibleCampaigns, page, pageSize]);

  /* ------------------------------- Submit handlers ------------------------- */

  const handleCampaignSubmit = async (values: CampaignFormValues) => {
    // const normalizedCode = values.code.trim().toUpperCase();
    const name_value = values.campaign_size + " " + values.year_be
    console.log(name_value)
    if (editingCampaign) {
      try {
        await dispatch(
          updateCampaignThunk({
            ...editingCampaign,
            site: values.site,
            campaign_size: values.campaign_size,
            year_be: values.year_be,
            name: name_value,
            isActive: values.isActive,
          })
        ).unwrap();
        showSuccess("อัปเดตรอบสอบเรียบร้อย", values.name);
        setCampaignDialogOpen(false);
      } catch (error) {
        showError("ไม่สามารถอัปเดตรอบสอบได้", getErrorMessage(error));
        setCampaignDialogOpen(false);
      }
    } else {
      try {
        await dispatch(
          createCampaignThunk({
            site: values.site,
            campaign_size: values.campaign_size,
            year_be: values.year_be,
            name: name_value,
            isActive: values.isActive,
          })
        ).unwrap();
        showSuccess("สร้างรอบสอบใหม่เรียบร้อย", values.name);
        setCampaignDialogOpen(false);
      } catch (error) {

        Swal.fire({
          icon: "error",
          title: "สร้างแคมเปญไม่สำเร็จ",
          text: getErrorMessage(error),
          confirmButtonText: "ตกลง",
        });
      }
    }
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
      Swal.fire({
        icon: "success",
        title: "อัปเดตเซสชันเรียบร้อย",
        text: values.label,
        confirmButtonText: "ตกลง",
      });
      setSessionDialogOpen(false);
      return;
    }

    try {
      const parentCampaign = campaigns.find(
        (c) => c.id === sessionContext.campaignId
      );
      await dispatch(
        createSessionThunk({
          campaignId: sessionContext.campaignId,
          label: values.label,
          examDate: values.examDate,
          note: values.note,
          dayNo: (parentCampaign?.sessions.length ?? 0) + 1,
        })
      ).unwrap();
      Swal.fire({
        icon: "success",
        title: "สร้างเซสชันใหม่เรียบร้อย",
        text: values.label,
        confirmButtonText: "ตกลง",
      });
      setSessionDialogOpen(false);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "ไม่สามารถสร้างเซสชันได้",
        text: getErrorMessage(error),
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#dc2626",
      });
    }
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
          },
        })
      );


      Swal.fire({
        icon: "success",
        title: "อัปเดตรายวิชาเรียบร้อย",
        text: values.name,
        confirmButtonText: "ตกลง",
      });

      setSubjectDialogOpen(false);
      return;
    }

    try {
      const parentCampaign = campaigns.find(
        (c) => c.id === subjectContext.campaignId
      );
      const parentSession = parentCampaign?.sessions.find(
        (s) => s.id === subjectContext.sessionId
      );
      const sessionDate =
        parentSession?.examDate ?? new Date().toISOString().slice(0, 10);

      await dispatch(
        createSubjectThunk({
          campaignId: subjectContext.campaignId,
          subjectId: Number(values.subjectId),
          sessionId: subjectContext.sessionId,
          sessionDate,
          code: values.code,
          name: values.name,
          startTime: values.startTime,
          endTime: values.endTime,
          questions: Number(values.questions),
          bookletRange: "",
          orderNo: (parentSession?.subjects.length ?? 0) + 1,
        })
      ).unwrap();

      Swal.fire({
        icon: "success",
        title: "สร้างรายวิชาใหม่เรียบร้อย",
        text: values.name,
        confirmButtonText: "ตกลง",
      });
      setSubjectDialogOpen(false);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "สร้างรายวิชาไม่สำเร็จ",
        text: getErrorMessage(error),
        confirmButtonText: "ตกลง",
      });
    }
  };

  /* ------------------------------- Delete handlers ------------------------- */

  const confirmAndRemoveCampaign = async (campaign: ExamCampaign) => {
    const result = await Swal.fire({
      title: "คำเตือน",
      text: `ต้องการลบรอบสอบ "${campaign.name}" ใช่หรือไม่?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ลบเลย",
      cancelButtonText: "ยกเลิก",
    });

    if (!result.isConfirmed) {
      return;
    }
    try {
      await dispatch(deleteCampaignThunk(campaign.id)).unwrap();
      Swal.fire({
        icon: "success",
        title: "ลบแคมเปญเรียบร้อย",
        text: campaign.name,
        confirmButtonText: "ตกลง",
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "ลบแคมเปญไม่สำเร็จ",
        text: getErrorMessage(error),
        confirmButtonText: "ตกลง",
      });
    }
  };

  const confirmAndRemoveSession = async (
    campaignId: string,
    session: CampaignSession
  ) => {
    const result = await Swal.fire({
      title: "คำเตือน",
      text: `ต้องการลบเซสชั่น "${session.label}" ใช่หรือไม่?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ลบเลย",
      cancelButtonText: "ยกเลิก",
    });

    if (!result.isConfirmed) {
      return;
    }
    try {
      await dispatch(
        deleteSessionThunk({ campaignId, sessionId: session.id })
      ).unwrap();
      Swal.fire({
        icon: "success",
        title: "ลบเซสชันเรียบร้อย",
        text: session.label,
        confirmButtonText: "ตกลง",
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "ลบเซสชันไม่สำเร็จ",
        text: getErrorMessage(error),
        confirmButtonText: "ตกลง",
      });
    }
  };

  const confirmAndRemoveSubject = async (
    campaignId: string,
    sessionId: string,
    subject: CampaignSubject
  ) => {
    console.log(campaignId)
    const result = await Swal.fire({
      title: "คำเตือน",
      text: `ต้องการลบรายวิชา "${subject.name}" ใช่หรือไม่?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ลบเลย",
      cancelButtonText: "ยกเลิก",
    });

    if (!result.isConfirmed) {
      return;
    }
    try {
      await dispatch(
        deleteSubjectThunk({ campaignId, sessionId, subjectId: subject.id })
      ).unwrap();
      Swal.fire({
        icon: "success",
        title: "ลบรายวิชาเรียบร้อย",
        text: subject.name,
        confirmButtonText: "ตกลง",
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "ลบรายวิชาไม่สำเร็จ",
        text: getErrorMessage(error),
        confirmButtonText: "ตกลง",
      });
    }
  };


const handleToggleActive = async (campaign: ExamCampaign) => {
  const willActivate = !campaign.isActive;

  // ถ้าจะ "เปิด" และมีตัวอื่น active อยู่แล้ว → กันไว้ฝั่งหน้าเว็บก่อน
  if (willActivate) {
    const hasOtherActive = campaigns.some(
      (c) => c.isActive && c.id !== campaign.id
    );
    if (hasOtherActive) {
      await Swal.fire({
        icon: "error",
        title: "ไม่สามารถเปิดใช้งานรอบสอบนี้",
        text: "กรุณาปิดรอบสอบที่กำลัง Active อยู่ก่อน",
        confirmButtonText: "ตกลง",
      });
      return;
    }
  }

  const confirmResult = await Swal.fire({
    icon: "warning",
    title: willActivate ? "ยืนยันเปิดใช้งานรอบสอบ" : "ยืนยันปิดใช้งานรอบสอบ",
    text: willActivate
      ? `คุณต้องการเปิดใช้งานรอบสอบ "${campaign.name}" ใช่หรือไม่?`
      : `คุณต้องการปิดใช้งานรอบสอบ "${campaign.name}" ใช่หรือไม่?`,
    showCancelButton: true,
    confirmButtonText: "ยืนยัน",
    cancelButtonText: "ยกเลิก",
    confirmButtonColor: willActivate ? "#16A34A" : "#DC2626",
  });

  if (!confirmResult.isConfirmed) return;

  try {
    //  ยิง axios ตรง ๆ ไม่ผ่าน thunk
    await axios.post(`/api/exam/active/${campaign.id}`);

    await Swal.fire({
      icon: "success",
      title: willActivate ? "เปิดใช้งานสำเร็จ" : "ปิดใช้งานสำเร็จ",
      text: `รอบสอบ "${campaign.name}" ถูก${willActivate ? "เปิดใช้งาน" : "ปิดใช้งาน"}แล้ว`,
      timer: 1500,
      showConfirmButton: false,
    });

    //  รีโหลดข้อมูลจาก backend อีกทีให้ state redux sync (ใช้ thunk ตัวเดิมได้)
    dispatch(fetchInitialExamData());
  } catch (err: any) {
    console.error(err);
    await Swal.fire({
      icon: "error",
      title: "ไม่สามารถเปลี่ยนสถานะรอบสอบได้",
      text:
        err?.response?.data?.message ??
        "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง",
      confirmButtonText: "ตกลง",
    });
  }
};

  /* ------------------------------- Dialog close handlers ------------------- */

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

  /* ------------------------------- Return API ------------------------------ */

  return {
    // data
    campaigns,
    visibleCampaigns,
    pagedCampaigns,
    sessionCount,
    allSubjects,

    // filters
    textFilter,
    setTextFilter,
    dateFilter,
    setDateFilter,
    resetFilters,

    // dialogs + forms
    campaignDialog: {
      open: campaignDialogOpen,
      editingCampaign,
      form: campaignForm,
      onOpenChange: handleCampaignDialogChange,
      onSubmit: handleCampaignSubmit,
    },
    sessionDialog: {
      open: sessionDialogOpen,
      context: sessionContext,
      form: sessionForm,
      onOpenChange: handleSessionDialogChange,
      onSubmit: handleSessionSubmit,
    },
    subjectDialog: {
      open: subjectDialogOpen,
      context: subjectContext,
      form: subjectForm,
      onOpenChange: handleSubjectDialogChange,
      onSubmit: handleSubjectSubmit,
    },
    pagination: {
      page,
      setPage,
      pageSize,
      setPageSize,
      totalPages,
      totalCampaigns,
    },

    // actions for UI
    actions: {
      openCampaignDialog,
      openSessionDialog,
      openSubjectDialog,
      confirmAndRemoveCampaign,
      confirmAndRemoveSession,
      confirmAndRemoveSubject,
      handleToggleActive,
    },
  };
}
