"use client";

import { useState } from "react";
import { collection, doc, getDocs, setDoc, updateDoc, deleteField } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";

// 一次性搬移工具:把舊的長者資料裡的「年齡、備註」搬到私密的 elder_private,
// 並從公開的 elders 中刪除這兩個欄位。執行完成後請刪除這個資料夾。
export default function MigrateEldersPage() {
  const [status, setStatus] = useState("");
  const [running, setRunning] = useState(false);

  async function handleMigrate() {
    setRunning(true);
    setStatus("搬移中...");
    try {
      const snap = await getDocs(collection(db, "elders"));
      let moved = 0;
      for (const d of snap.docs) {
        const data = d.data();
        const hasLegacy = data.age !== undefined || data.notes !== undefined;
        if (!hasLegacy) continue;

        await setDoc(
          doc(db, "elder_private", d.id),
          {
            age: data.age ?? "",
            notes: data.notes ?? "",
            familyUid: data.familyUid,
          },
          { merge: true }
        );
        await updateDoc(doc(db, "elders", d.id), {
          age: deleteField(),
          notes: deleteField(),
        });
        moved++;
      }
      setStatus(`完成:共 ${snap.size} 位長者,其中 ${moved} 位的年齡與備註已搬到私密資料。`);
    } catch (err) {
      console.error(err);
      setStatus("搬移失敗,請打開瀏覽器 console 看詳細錯誤訊息");
    } finally {
      setRunning(false);
    }
  }

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="p-8 space-y-4 max-w-lg">
        <h1 className="text-xl font-bold">一次性長者資料搬移工具</h1>
        <p className="text-sm text-muted-foreground">
          把現有長者資料裡的年齡與備註,從公開的 elders 搬到只有權限角色可讀的 elder_private。
          重複執行不會出錯。完成後請把 app/admin/migrate-elders 這個資料夾整個刪掉。
        </p>
        <Button onClick={handleMigrate} disabled={running}>
          {running ? "搬移中..." : "開始搬移"}
        </Button>
        {status && <p className="text-sm">{status}</p>}
      </div>
    </ProtectedRoute>
  );
}
