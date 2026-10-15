"use client";

import * as React from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { PublicHeader } from "@/components/public-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

type ElderProfile = {
  id: string;
  name: string;
  age: string;
  notes: string;
  viewToken?: string;
};

// 長者專屬連結用的隨機代碼。跟長者 ID 分開,
// 這樣就算長者 ID 出現在其他資料裡,也沒辦法反查出長者姓名與課程
function newViewToken() {
  return crypto.randomUUID().replace(/-/g, "");
}

function MyEldersContent() {
  const { user } = useAuth();
  const [elders, setElders] = React.useState<ElderProfile[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [name, setName] = React.useState("");
  const [age, setAge] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  // 長者資料分三處存放:
  // - elders:姓名與專屬連結代碼,只有家屬本人與總院可讀
  // - elder_private:年齡與備註(健康、行動等敏感資訊),家屬本人、總院與據點人員可讀
  // - elder_views/{代碼}:長者專屬連結顯示用(姓名 + 已報名課程),知道代碼才讀得到
  const [publicElders, setPublicElders] = React.useState<{ id: string; name: string; viewToken?: string }[]>([]);
  const [privateInfo, setPrivateInfo] = React.useState<Record<string, { age: string; notes: string }>>({});

  React.useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "elders"), where("familyUid", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPublicElders(
        snapshot.docs.map((d) => ({ id: d.id, name: d.data().name, viewToken: d.data().viewToken }))
      );
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  React.useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "elder_private"), where("familyUid", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const map: Record<string, { age: string; notes: string }> = {};
      snapshot.docs.forEach((d) => {
        map[d.id] = { age: d.data().age ?? "", notes: d.data().notes ?? "" };
      });
      setPrivateInfo(map);
    });
    return () => unsubscribe();
  }, [user]);

  React.useEffect(() => {
    setElders(
      publicElders.map((e) => ({
        id: e.id,
        name: e.name,
        viewToken: e.viewToken,
        age: privateInfo[e.id]?.age ?? "",
        notes: privateInfo[e.id]?.notes ?? "",
      }))
    );
  }, [publicElders, privateInfo]);

  function openCreateDialog() {
    setEditingId(null);
    setName("");
    setAge("");
    setNotes("");
    setDialogOpen(true);
  }

  function openEditDialog(e: ElderProfile) {
    setEditingId(e.id);
    setName(e.name);
    setAge(e.age);
    setNotes(e.notes);
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!user || !name) {
      alert("請填寫長者姓名");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        const editing = elders.find((e) => e.id === editingId);
        await updateDoc(doc(db, "elders", editingId), { name });
        await setDoc(doc(db, "elder_private", editingId), { age, notes, familyUid: user.uid });
        // 改名時,專屬連結上顯示的名字也要一起更新
        if (editing?.viewToken) {
          await updateDoc(doc(db, "elder_views", editing.viewToken), { name });
        }
      } else {
        const viewToken = newViewToken();
        const ref = await addDoc(collection(db, "elders"), { name, familyUid: user.uid, viewToken });
        await setDoc(doc(db, "elder_private", ref.id), { age, notes, familyUid: user.uid });
        await setDoc(doc(db, "elder_views", viewToken), { name, familyUid: user.uid, scheduleIds: [] });
      }
      setDialogOpen(false);
    } catch (err) {
      console.error("儲存長者資料失敗:", err);
      alert("儲存失敗,請再試一次");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!editingId) return;
    if (!confirm("確定要刪除這位長者的資料嗎?之前幫他報名的課程紀錄不會被刪除。")) return;
    setSaving(true);
    try {
      const editing = elders.find((e) => e.id === editingId);
      if (editing?.viewToken) {
        await deleteDoc(doc(db, "elder_views", editing.viewToken));
      }
      await deleteDoc(doc(db, "elder_private", editingId));
      await deleteDoc(doc(db, "elders", editingId));
      setDialogOpen(false);
    } catch (err) {
      console.error("刪除失敗:", err);
      alert("刪除失敗,請再試一次");
    } finally {
      setSaving(false);
    }
  }

  function getElderViewUrl(viewToken: string) {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/elder-view/${viewToken}`;
  }

  async function handleCopyLink(elder: ElderProfile) {
    if (!elder.viewToken) {
      alert("這位長者的專屬連結尚未建立,請聯絡管理者");
      return;
    }
    try {
      await navigator.clipboard.writeText(getElderViewUrl(elder.viewToken));
      setCopiedId(elder.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("複製連結失敗:", err);
      alert("複製失敗,請手動選取網址複製");
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF7F0]">
      <PublicHeader />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold text-gray-900">我的長者</h1>
          <Button onClick={openCreateDialog}>新增長者</Button>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          新增家中長輩的資料,之後到課程行事曆頁面就能幫他們報名課程。每位長者都有一個專屬連結,可以存到手機桌面或印出來,方便長輩自己查看課程。
        </p>

        {loading ? (
          <p className="text-sm text-gray-400 text-center py-12">載入中...</p>
        ) : elders.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
            <p className="text-sm text-gray-400">尚未新增任何長者資料,點右上角「新增長者」開始。</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {elders.map((e) => (
              <div key={e.id} className="bg-white rounded-xl border border-gray-100 p-4 space-y-2">
                <div>
                  <h4 className="font-semibold text-gray-900">{e.name}</h4>
                  {e.age && <p className="text-sm text-gray-500">年齡:{e.age}</p>}
                  {e.notes && <p className="text-sm text-gray-500">{e.notes}</p>}
                </div>
                <div className="flex gap-2 items-center pt-1 border-t">
                  <Button variant="ghost" size="sm" onClick={() => openEditDialog(e)}>
                    編輯
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleCopyLink(e)}>
                    {copiedId === e.id ? "已複製!" : "複製長者專屬連結"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "編輯長者資料" : "新增長者"}</DialogTitle>
            <DialogDescription>填寫您要協助報名課程的長者基本資料。</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-sm font-medium mb-1 block">姓名</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">年齡(選填)</label>
              <Input value={age} onChange={(e) => setAge(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">備註(選填)</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="例如:行動需要輔助、飲食禁忌等,方便據點人員留意(僅您本人、總院與據點人員可見)"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="flex-row justify-between sm:justify-between">
            {editingId ? (
              <Button variant="destructive" onClick={handleDelete} disabled={saving}>
                刪除
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                取消
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "儲存中..." : editingId ? "確認修改" : "確認新增"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function MyEldersPage() {
  return (
    <ProtectedRoute allowedRoles={["family"]}>
      <MyEldersContent />
    </ProtectedRoute>
  );
}
