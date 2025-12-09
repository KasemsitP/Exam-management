// hooks/useKeyManagement.ts
import { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hook";
import { useToast } from "@/components/ui/use-toast";

import {
  fetchKeysForCampaign,
  saveNewKey,
  deleteKey,
  clearActiveKeys,
  selectAllActiveKeys,
  selectKeyManagementStatus,
  selectKeyManagementError,
  checkEncryptionPrerequisites,
  clearEncryptionResult,
  runBulkEncryptionForSession,
  selectEncryptionStatus,
  selectLastBulkEncryptionStats,
  selectPrerequisites,
} from "@/store/slices/key.slice";

import {
  selectActiveCampaign,
  selectActiveCampaignSessions,
} from "@/store/slices/examData.slice";

const parseCampaignId = (id: string): number => Number(id.replace("camp-", ""));
const parseSessionId = (id: string): number => Number(id.replace("sess-", ""));

export const useKeyManagement = () => {
  const { toast } = useToast();
  const dispatch = useAppDispatch();

  // --- Redux state ---
  const activeCampaign = useAppSelector(selectActiveCampaign);
  const activeKeys = useAppSelector(selectAllActiveKeys);
  const keyStatus = useAppSelector(selectKeyManagementStatus);
  const keyManagementError = useAppSelector(selectKeyManagementError);
  const sessions = useAppSelector(selectActiveCampaignSessions) as any[];
  const prerequisites = useAppSelector(selectPrerequisites);
  const encryptionStatus = useAppSelector(selectEncryptionStatus);
  const lastBulkEncryptionStats = useAppSelector(selectLastBulkEncryptionStats);

  // --- Local state ---
  const [keyInput, setKeyInput] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");

  const numericCampaignId = activeCampaign
    ? parseCampaignId(activeCampaign.id)
    : null;

  const isLoading = keyStatus === "loading";
  const canGenerate = !isLoading && activeKeys.length < 2;
  const isEncryptionLoading = encryptionStatus === "loading";
  const canEncrypt =
    !!prerequisites?.hasTwoKeys && !!prerequisites?.hasImportedUsers;

  // --- Fetch keys & prerequisites ---
  useEffect(() => {
    if (activeCampaign && numericCampaignId) {
      dispatch(fetchKeysForCampaign(numericCampaignId));
      dispatch(checkEncryptionPrerequisites(numericCampaignId));
    }
    return () => {
      dispatch(clearActiveKeys());
    };
  }, [activeCampaign, numericCampaignId, dispatch]);

  // --- Default session select ---
  useEffect(() => {
    if (sessions.length > 0 && !selectedSessionId) {
      setSelectedSessionId(sessions[0].id);
    }
  }, [sessions, selectedSessionId]);

  // --- Handlers ---
  const handleSaveKey = () => {
    if (!numericCampaignId) {
      toast({ title: "กรุณาเลือก Campaign ก่อน", variant: "destructive" });
      return;
    }
    if (!keyInput.trim()) {
      toast({ title: "กรุณากรอกคีย์ (Secret)", variant: "destructive" });
      return;
    }
    if (!canGenerate) {
      toast({
        title: "รอบสอบนี้มีคีย์ครบ 2 อันแล้ว",
        variant: "destructive",
      });
      return;
    }

    dispatch(
      saveNewKey({
        campaignId: numericCampaignId,
        key: keyInput.trim(),
      })
    ).then(() => {
      dispatch(checkEncryptionPrerequisites(numericCampaignId));
    });

    setKeyInput("");
  };

  const handleDeleteKey = (keyId: number) => {
    if (!window.confirm(`ยืนยันการลบคีย์ ID: ${keyId} ?`)) return;
    dispatch(deleteKey(keyId)).then(() => {
      if (numericCampaignId) {
        dispatch(checkEncryptionPrerequisites(numericCampaignId));
      }
    });
  };

  const handleSessionChange = (sessionId: string) => {
    setSelectedSessionId(sessionId);
  };

  const handleRunBulkEncryption = () => {
    if (!numericCampaignId || !selectedSessionId || !canEncrypt) {
      toast({
        title: "ข้อมูลไม่ครบ",
        description: "กรุณาเลือก Session และตรวจสอบว่าคีย์/ข้อมูล พร้อม",
        variant: "destructive",
      });
      return;
    }

    dispatch(clearEncryptionResult());
    dispatch(
      runBulkEncryptionForSession({
        campaignId: numericCampaignId,
        sessionId: parseSessionId(selectedSessionId),
      })
    ).then((result: any) => {
      if (result.meta.requestStatus === "fulfilled") {
        toast({
          title: "เข้ารหัสสำเร็จ!",
          description: `เข้ารหัสผู้สอบ ${result.payload.usersEncrypted} คน ใน Session นี้`,
        });
      } else {
        toast({
          title: "เข้ารหัสล้มเหลว",
          description: result.payload as string,
          variant: "destructive",
        });
      }
    });
  };

  const prerequisitesCards = useMemo(
    () => ({
      hasTwoKeys: prerequisites?.hasTwoKeys ?? false,
      hasImportedUsers: prerequisites?.hasImportedUsers ?? false,
    }),
    [prerequisites]
  );

  return {
    // redux-ish
    activeCampaign,
    activeKeys,
    keyStatus,
    keyManagementError,
    sessions,
    prerequisites: prerequisitesCards,
    encryptionStatus,
    lastBulkEncryptionStats,

    // local
    keyInput,
    setKeyInput,
    selectedSessionId,
    setSelectedSessionId,

    // derived
    numericCampaignId,
    isLoading,
    canGenerate,
    isEncryptionLoading,
    canEncrypt,

    // handlers
    handleSaveKey,
    handleDeleteKey,
    handleSessionChange,
    handleRunBulkEncryption,
  };
};
