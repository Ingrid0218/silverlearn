"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { collection, doc, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";

type ScheduleInfo = {
  id: string;
  title: string;
  instructorName: string;
  locationName: string;
  startTime: Date;
  endTime: Date;
  status: string;
  note?: string;
};

export default function ElderViewPage() {
  const params = useParams();
  // 網址裡的是「專屬連結代碼」,不是長者 ID。
  // 長者 ID 會出現在其他資料裡,用獨立的隨機代碼才不會被拿來反查長者的姓名與課程
  // (資料夾仍沿用 [elderId] 這個名稱,不用搬移檔案)
  const viewToken = params.elderId as string;

  const [elderName, setElderName] = React.useState("");
  const [notFound, setNotFound] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [enrolledScheduleIds, setEnrolledScheduleIds] = React.useState<string[]>([]);
  const [allSchedules, setAllSchedules] = React.useState<ScheduleInfo[]>([]);

  // 只讀這位長者的專屬連結資料:姓名 + 已報名的課程清單,不需要碰報名紀錄
  React.useEffect(() => {
    if (!viewToken) return;
    const unsubscribe = onSnapshot(
      doc(db, "elder_views", viewToken),
      (snap) => {
        if (snap.exists()) {
          setElderName(snap.data().name);
          setEnrolledScheduleIds(snap.data().scheduleIds ?? []);
        } else {
          setNotFound(true);
        }
        setLoading(false);
      },
      () => {
        setNotFound(true);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [viewToken]);

  React.useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "schedules"), (snapshot) => {
      const list = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          title: data.title,
          instructorName: data.instructorName,
          locationName: data.locationName,
          startTime: (data.startTime as Timestamp).toDate(),
          endTime: (data.endTime as Timestamp).toDate(),
          status: data.status,
          note: data.note,
        } as ScheduleInfo;
      });
      setAllSchedules(list);
    });
    return () => unsubscribe();
  }, []);

  const upcomingSchedules = React.useMemo(() => {
    const now = new Date();
    return allSchedules
      .filter((s) => enrolledScheduleIds.includes(s.id) && s.status === "scheduled" && s.startTime >= now)
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }, [allSchedules, enrolledScheduleIds]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F0] flex items-center justify-center">
        <p className="text-2xl text-gray-400">載入中...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#FAF7F0] flex items-center justify-center px-6">
        <p className="text-2xl text-gray-500 text-center">找不到這個連結對應的資料</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F0] px-6 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-amber-400 flex items-center justify-center text-white text-2xl">
            ♥
          </div>
          <div>
            <p className="text-lg text-gray-500">{elderName} 的課程</p>
            <p className="text-sm text-gray-400">埔里基督教醫院樂齡課程</p>
          </div>
        </div>

        {upcomingSchedules.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 p-10 text-center">
            <p className="text-2xl text-gray-400">目前沒有安排的課程</p>
          </div>
        ) : (
          <div className="space-y-5">
            {upcomingSchedules.map((s) => (
              <div key={s.id} className="bg-white rounded-3xl border border-gray-100 p-6">
                <p className="text-lg text-amber-600 font-medium mb-1">
                  {format(s.startTime, "M月d日 (EEEE)", { locale: zhTW })}
                </p>
                <p className="text-3xl font-bold text-gray-900 mb-3">
                  {format(s.startTime, "HH:mm")} - {format(s.endTime, "HH:mm")}
                </p>
                <p className="text-2xl text-gray-800 mb-2">{s.title}</p>
                <p className="text-xl text-gray-500 mb-1">📍 {s.locationName}</p>
                <p className="text-xl text-gray-500">👤 {s.instructorName} 老師</p>

                {s.note && (
                  <div className="mt-4 bg-amber-50 border border-amber-200 rounded-2xl p-4">
                    <p className="text-lg text-amber-800 font-medium">🎒 記得帶:</p>
                    <p className="text-xl text-amber-900 mt-1">{s.note}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
