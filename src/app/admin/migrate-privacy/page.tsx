"use client";

import { useState } from "react";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteField,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";

// 一次性搬移工具:把舊資料整理成新的隱私結構。重複執行不會出錯。
// 完成後請把 app/admin/migrate-privacy 這個資料夾整個刪掉。
export default function MigratePrivacyPage() {
  const [log, setLog] = useState<string[]>([]);
  const [running, setRunning] = useState(false);

  function append(line: string) {
    setLog((prev) => [...prev, line]);
  }

  async function handleMigrate() {
    setRunning(true);
    setLog([]);
    try {
      const [schedSnap, enrollSnap, elderSnap, evalSnap, userSnap] = await Promise.all([
        getDocs(collection(db, "schedules")),
        getDocs(collection(db, "enrollments")),
        getDocs(collection(db, "elders")),
        getDocs(collection(db, "evaluations")),
        getDocs(collection(db, "users")),
      ]);

      const schedules = new Map(schedSnap.docs.map((d) => [d.id, d.data()]));
      const uidByEmail = new Map(userSnap.docs.map((d) => [d.data().email, d.id]));

      // 1. 報名紀錄:補上據點與講師(資料庫規則靠它們限制誰能讀),順便統計匿名反應數
      const counts: Record<string, Record<string, number>> = {};
      const scheduleIdsByElder: Record<string, string[]> = {};
      let enrollFixed = 0;
      for (const d of enrollSnap.docs) {
        const e = d.data();
        const s = schedules.get(e.scheduleId);
        if (s) {
          await updateDoc(d.ref, { locationId: s.locationId, instructorId: s.instructorId });
          enrollFixed++;
        }
        if (e.status === "enrolled") {
          (scheduleIdsByElder[e.elderId] ??= []).push(e.scheduleId);
          if (e.reaction) {
            counts[e.scheduleId] ??= { happy: 0, neutral: 0, sad: 0 };
            counts[e.scheduleId][e.reaction] = (counts[e.scheduleId][e.reaction] ?? 0) + 1;
          }
        }
      }
      append(`報名紀錄:${enrollFixed} 筆已補上據點與講師`);

      // 2. 排班:寫入匿名反應統計;講師回報搬到私密集合;確認者 email 改成帳號 ID
      let reportsMoved = 0;
      for (const d of schedSnap.docs) {
        const s = d.data();
        const update: Record<string, unknown> = {
          reactionCounts: counts[d.id] ?? { happy: 0, neutral: 0, sad: 0 },
        };
        if (s.instructorReport !== undefined || s.improvementNote !== undefined) {
          await setDoc(
            doc(db, "instructor_reports", d.id),
            {
              instructorId: s.instructorId,
              locationId: s.locationId,
              instructorReport: s.instructorReport ?? "",
              improvementNote: s.improvementNote ?? "",
              instructorReportedAt: s.instructorReportedAt ?? null,
            },
            { merge: true }
          );
          update.instructorReport = deleteField();
          update.improvementNote = deleteField();
          update.instructorReportedAt = deleteField();
          reportsMoved++;
        }
        if (typeof s.confirmedBy === "string" && s.confirmedBy.includes("@")) {
          update.confirmedBy = uidByEmail.get(s.confirmedBy) ?? deleteField();
        }
        await updateDoc(d.ref, update);
      }
      append(`排班:${schedSnap.size} 堂課已寫入匿名反應統計,${reportsMoved} 份講師回報已搬到私密資料`);

      // 3. 長者:年齡與備註搬到私密資料;建立專屬連結代碼
      let tokensCreated = 0;
      let privateMoved = 0;
      for (const d of elderSnap.docs) {
        const e = d.data();
        const update: Record<string, unknown> = {};
        if (e.age !== undefined || e.notes !== undefined) {
          await setDoc(
            doc(db, "elder_private", d.id),
            { age: e.age ?? "", notes: e.notes ?? "", familyUid: e.familyUid },
            { merge: true }
          );
          update.age = deleteField();
          update.notes = deleteField();
          privateMoved++;
        }
        let token: string = e.viewToken;
        if (!token) {
          token = crypto.randomUUID().replace(/-/g, "");
          update.viewToken = token;
          tokensCreated++;
        }
        await setDoc(doc(db, "elder_views", token), {
          name: e.name,
          familyUid: e.familyUid,
          scheduleIds: scheduleIdsByElder[d.id] ?? [],
        });
        if (Object.keys(update).length > 0) await updateDoc(d.ref, update);
      }
      append(
        `長者:${elderSnap.size} 位,${privateMoved} 位的年齡與備註已搬到私密資料,新建 ${tokensCreated} 組專屬連結代碼`
      );

      // 4. 家屬分享:會公開顯示,拿掉長者姓名與舊的星等欄位
      for (const d of evalSnap.docs) {
        await updateDoc(d.ref, {
          elderName: deleteField(),
          attendeeName: deleteField(),
          rating: deleteField(),
        });
      }
      append(`家屬分享:${evalSnap.size} 筆已移除長者姓名`);

      append("全部完成!舊的長者專屬連結已失效,請家屬到「我的長者」重新複製。");
    } catch (err) {
      console.error(err);
      append("搬移失敗,請打開瀏覽器 console 看詳細錯誤訊息");
    } finally {
      setRunning(false);
    }
  }

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="p-8 space-y-4 max-w-xl">
        <h1 className="text-xl font-bold">一次性隱私資料搬移工具</h1>
        <p className="text-sm text-muted-foreground">
          把報名紀錄、長者資料、講師回報、家屬分享整理成新的隱私結構。重複執行不會出錯。
          完成後請把 app/admin/migrate-privacy 這個資料夾整個刪掉。
        </p>
        <Button onClick={handleMigrate} disabled={running}>
          {running ? "搬移中..." : "開始搬移"}
        </Button>
        {log.length > 0 && (
          <ul className="text-sm space-y-1 list-disc pl-5">
            {log.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        )}
      </div>
    </ProtectedRoute>
  );
}
