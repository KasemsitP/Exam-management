// src/pages/bag-handover/BagHandoverPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { useToast } from "@/components/ui/use-toast";
import { ShowIfCan } from "@/components/auth/ShowIfCan";
import { useAppDispatch, useAppSelector } from "@/store/hook";

import {
  selectActiveCampaign,
  selectActiveCampaignSessions,
} from "@/store/slices/examData.slice";
import { selectCurrentUser } from "@/store/slices/auth.slice";

import {
  selectBagsForCampaign,
  fetchBagsForCampaignThunk,
} from "@/store/slices/bags.slice";

import {
  selectGradersForCampaign,
  fetchGradersForCampaignThunk,
} from "@/store/slices/graders.slice";

import {
  fetchBagHandoverForCampaign,
  selectBagLocksForCampaign,
  selectBagLogsForCampaign,
  returnBagThunk,
  registerBagToGraderThunk,
  fetchBagProgressThunk,
  selectBagProgress,
  checkGraderHistoryThunk,
  selectCurrentGraderCheck,

} from "@/store/slices/bagHandover.slice";

import {
  fetchRecordThunk,
  selectGradingRecords,
  selectIsGradingLoading,
  selectGradingError,
} from "@/store/slices/grading.slice";

import BagHandoverHeader from "./components/BagHandoverHeader";
import BagHandoverCheckinCard from "./components/BagHandoverCheckinCard";
import BagLocksTable from "./components/BagLocksTable";
import BagLogsCard from "./components/BagLogsCard";
import GradingHistoryCard from "./components/GradingHistoryCard";
import ActiveLocksCard from "./components/ActivelockCard";

import type {
  CheckoutFormValues,
  SessionSummary,
  BagSummary,
  GraderSummary,
  BagLogRecord,
  GradingRecord,
  BagLock,
} from "./bagHandover.types";

export default function BagHandoverPage() {
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  // ---------- Redux selectors ----------
  const activeCampaign = useAppSelector(selectActiveCampaign);
  const sessions = useAppSelector(
    selectActiveCampaignSessions
  ) as SessionSummary[];

  const bags = useAppSelector(
    selectBagsForCampaign(activeCampaign?.id ?? null)
  ) as BagSummary[];

  const graders = useAppSelector(
    selectGradersForCampaign(
      activeCampaign ? Number(activeCampaign.id) : null
    )
  ) as GraderSummary[];

  const locks = useAppSelector(
    selectBagLocksForCampaign(activeCampaign?.id ?? null)
  ) as BagLock[];

  const logs = useAppSelector(
    selectBagLogsForCampaign(activeCampaign?.id ?? null)
  ) as BagLogRecord[];

  const operator = useAppSelector(selectCurrentUser);

  const gradingRecords = useAppSelector(
    selectGradingRecords
  ) as GradingRecord[];
  const gradingLoading = useAppSelector(selectIsGradingLoading);
  const gradingError = useAppSelector(selectGradingError);

  // ---------- Local state / form ----------
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSessionId, setFilterSessionId] = useState<string>("all");
  const [selectedBagId, setSelectedBagId] = useState<string>("");

  const form = useForm<CheckoutFormValues>({
    defaultValues: { sessionId: "", bagId: "", graderId: "", note: "" },
  });

  // ---------- Effects ----------

  // Fetch graders
  useEffect(() => {
    if (activeCampaign) {
      dispatch(
        fetchGradersForCampaignThunk(
          activeCampaign.id ? Number(activeCampaign.id) : null
        )
      );
    }
  }, [activeCampaign, dispatch]);

  // Fetch handover locks/logs
  useEffect(() => {
    if (!activeCampaign) return;
    dispatch(
      fetchBagHandoverForCampaign({
        campaignId: activeCampaign.id,
      })
    );
  }, [activeCampaign, dispatch]);


  // Default session
  useEffect(() => {
    if (!sessions.length) return;
    const defaultSessionId = sessions[0]?.id?.toString() ?? "";
    form.setValue("sessionId", defaultSessionId);
    setFilterSessionId(defaultSessionId || "all");
  }, [sessions, form]);

  // Fetch bags
  useEffect(() => {
    if (activeCampaign) {
      dispatch(fetchBagsForCampaignThunk(activeCampaign.id));
    }
  }, [dispatch, activeCampaign]);

  // ---------- Memoized helpers ----------

  const bagMap = useMemo(() => {
    return bags.reduce<Record<string, BagSummary>>((map, bag) => {
      map[String(bag.id)] = bag;
      return map;
    }, {});
  }, [bags]);

  const filteredBags = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const sessionFiltered =
      filterSessionId === "all"
        ? bags
        : bags.filter((bag) => String(bag.sessionId) === filterSessionId);

    if (!term) return sessionFiltered;

    return sessionFiltered.filter((bag) => {
      const subjectText = `${bag.subjectCode ?? ""} ${bag.subjectName ?? ""
        }`.toLowerCase();
      return (
        String(bag.id).toLowerCase().includes(term) ||
        (bag.sessionLabel ?? "").toLowerCase().includes(term) ||
        subjectText.includes(term)
      );
    });
  }, [bags, searchTerm, filterSessionId]);

  const currentLock: BagLock | null = useMemo(() => {
    if (!selectedBagId || !activeCampaign) return null;
    return (
      locks.find((lock) => String(lock.bagId) === String(selectedBagId)) ??
      null
    );
  }, [locks, selectedBagId, activeCampaign]);

  const currentBag = useMemo(() => {
    if (!selectedBagId) return undefined;
    return bags.find(
      (b) => String(b.bag_no) === String(selectedBagId)
    );
  }, [selectedBagId, bags]);


  const sessionIdInForm = form.watch("sessionId");
  const bagsForSelectedSession = useMemo(() => {
    if (!sessionIdInForm) return [];
    return bags.filter(
      (bag) => String(bag.sessionId) === String(sessionIdInForm)
    );
  }, [bags, sessionIdInForm]);

  const graderIdInForm = form.watch("graderId");
  const graderIdForHistory = useMemo(() => {
    if (graderIdInForm) return graderIdInForm;
    if (currentLock?.graderId) return String(currentLock.graderId);
    return null;
  }, [graderIdInForm, currentLock]);

  useEffect(() => {
    if (selectedBagId) {
      dispatch(fetchBagProgressThunk(Number(selectedBagId)));
    }
  }, [selectedBagId, dispatch]);

  // Fetch grading history when grader changes
  useEffect(() => {
    if (currentBag) {
      dispatch(fetchBagProgressThunk(Number(currentBag.id)));
    }
  }, [currentBag, dispatch]); // เปลี่ยน dependency เป็น currentBag

  // ✅ แก้ไข: ดึงข้อมูลจาก Selector ด้วย PK เช่นกัน
  const progress = useAppSelector(selectBagProgress(currentBag?.id ?? ""));
  const graderCheckResult = useAppSelector(selectCurrentGraderCheck);

  // 2. Logic การยิงเช็คเมื่อ form เปลี่ยน (graderId หรือ bagId เปลี่ยน)
  useEffect(() => {
    if (graderIdInForm && currentBag) {
      dispatch(
        checkGraderHistoryThunk({
          graderId: Number(graderIdInForm),
          bagId: Number(currentBag.id),
        })
      );
    }
  }, [graderIdInForm, currentBag, dispatch]);

  // ---------- Handlers ----------

  const handleRegisterBag = (values: CheckoutFormValues) => {
    if (!activeCampaign || !operator) {
      toast({
        title: "ไม่พบข้อมูลแคมเปญหรือผู้ใช้งาน",
        variant: "destructive",
      });
      return;
    }
    if (!values.sessionId || !values.bagId || !values.graderId) {
      toast({
        title: "กรุณาเลือกรอบสอบ ถุง และผู้ตรวจ",
        variant: "destructive",
      });
      return;
    }

    if (
      locks.some((lock) => String(lock.bagId) === String(values.bagId))
    ) {
      toast({
        title: "ถุงนี้อยู่ระหว่างการตรวจ",
        description: "กรุณารับคืนก่อนส่งมอบให้ผู้อื่น",
        variant: "destructive",
      });
      return;
    }

    const grader = graders.find(
      (item: any) => String(item.account_id) === values.graderId
    );
    if (!grader) {
      toast({ title: "ไม่พบข้อมูลผู้ตรวจ", variant: "destructive" });
      return;
    }

    // const graderName =
    //   grader.grader_name ??
    //   grader.name ??
    //   `${grader.first_name ?? ""} ${grader.last_name ?? ""}`.trim() ||
    //   `Grader #${grader.account_id}`;
    const graderName =
      grader.grader_name ??
      `Grader #${grader.account_id}`;

    dispatch(
      registerBagToGraderThunk({
        campaignId: activeCampaign.id,
        bagId: values.bagId,
        graderId: values.graderId,
        graderName,
        operatorId: Number(operator.id),
        operatorName: operator.name,
        note: values.note,
      })
    )
      .unwrap()
      .then(() => {
        const bag = bagMap[values.bagId];
        const bagNo = bag?.bag_no ?? values.bagId;

        toast({
          title: "ลงทะเบียนส่งมอบเรียบร้อย",
          description: `${graderName} ได้รับถุง ${String(bagNo).padStart(
            3,
            "0"
          )}`,
        });

        setSelectedBagId(values.bagId);
        form.reset({
          sessionId: values.sessionId,
          bagId: "",
          graderId: "",
          note: "",
        });
      })
      .catch((err) => {
        toast({
          title: "ไม่สามารถลงทะเบียนส่งมอบถุงได้",
          description: String(err),
          variant: "destructive",
        });
      });
  };

  const handleReturnBag = () => {
    if (!activeCampaign || !operator) {
      toast({
        title: "ไม่พบข้อมูลแคมเปญหรือผู้ใช้งาน",
        variant: "destructive",
      });
      return;
    }
    if (!currentLock) {
      toast({
        title: "ถุงนี้ยังไม่ได้ลงทะเบียน",
        description: "กรุณาเลือกถุงที่กำลังใช้งานอยู่",
        variant: "destructive",
      });
      return;
    }

    // ✅ ตรงนี้สำคัญ: เอา bag จาก bagMap มาแปลงเป็น sessionId + bag_no
    const bag = currentBag;
    if (!bag) {
      toast({
        title: "ไม่พบบันทึกถุงในระบบ",
        variant: "destructive",
      });
      return;
    }

    const sessionId = Number(bag.sessionId);
    const bagNo = Number(bag.bag_no);

    console.log("returnBag params:", {
      campaignId: activeCampaign.id,
      sessionId,
      bagNo,
      operatorId: Number(operator.id),
    });

    dispatch(
      returnBagThunk({
        campaignId: activeCampaign.id,
        sessionId,
        bagNo,
        operatorId: Number(operator.id),
      })
    )
      .unwrap()
      .then(() => {
        toast({
          title: "รับคืนถุงเรียบร้อย",
          description: `ถุง ${String(bagNo).padStart(3, "0")} กลับสู่สถานะว่าง`,
        });
      })
      .catch((err) => {
        toast({
          title: "ไม่สามารถรับคืนถุงได้",
          description: String(err),
          variant: "destructive",
        });
      });
  };

  // ---------- Render ----------

  return (
    <ShowIfCan permission="manage_bags">
      {!activeCampaign ? (
        <div className="border border-2 border-dashed rounded-4 p-5 text-center text-muted">
          ยังไม่มีข้อมูลแคมเปญ กรุณาเลือกแคมเปญเพื่อจัดการการส่งมอบถุง
        </div>
      ) : (
        <div className="d-flex flex-column gap-4">
          {/* <BagHandoverHeader
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          /> */}

          <BagHandoverCheckinCard
            form={form}
            sessions={sessions}
            locks={locks}
            bagsForSelectedSession={bagsForSelectedSession}
            currentLock={currentLock}
            currentBag={currentBag}
            operator={operator}
            sessionIdInForm={sessionIdInForm}
            selectedBagId={selectedBagId}
            graders={graders}
            onRegister={handleRegisterBag}
            onReturn={handleReturnBag}
            setFilterSessionId={setFilterSessionId}
            setSelectedBagId={setSelectedBagId}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />

          <div className="row g-4">
            <div className="col-lg-7">
              <BagLocksTable
                filteredBags={filteredBags}
                locks={locks}
                selectedBagId={selectedBagId}
                onSelectBagId={setSelectedBagId}
                bagProgress={progress}
                graderCheck={graderCheckResult}
              />
            </div>

            <div className="col-lg-5 d-flex flex-column gap-3">
              <ActiveLocksCard
                locks={locks}
                bags={bags}
                selectedBagId={selectedBagId}
                onSelectBagId={(id) => {
                  setSelectedBagId(id);
                  // ดันค่าไปใน form ด้วย จะช่วยให้ check-out ง่าย
                  const bag = bags.find(
                    (b) => String(b.bag_no) === String(id)
                  );
                  if (bag) {
                    form.setValue("sessionId", String(bag.sessionId));
                    form.setValue("bagId", String(bag.bag_no));
                  }
                }}
                bagProgress={progress}
              />
              <BagLogsCard
                logs={logs}
                bagMap={bagMap}
                onSelectBagId={setSelectedBagId}
              />
            </div>
          </div>
        </div>
      )}
    </ShowIfCan>
  );
}
