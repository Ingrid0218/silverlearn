### SilverLearn 銀學歷｜智慧長照教育管理系統

2025 永續智慧創新黑客松「樂齡學院數位管理平台建置概念設計」命題**第一名**作品之延伸實作。
針對埔里基督教醫院長照據點「樂齡課程管理未流程化、行政作業繁雜」的問題，
建置一套整合課程排班、報名、點名與課後紀錄的管理平台。

🔗 線上展示：https://manager-hs5218.vercel.app

#### 主要功能

- **四種角色與分層權限**：總院管理者、據點承辦人、講師、家屬
- **課程管理**：講師履歷審核、課程排班、家屬線上報名（含報名截止）
- **課堂紀錄**：課前點名、長者現場反應紀錄（開心 / 普通 / 不開心）
- **課後回報**：講師課後回報、據點人員個別觀察紀錄（非公開，僅限權限角色檢視）

#### 權限設計

| 資料 | 可寫入 | 畫面上可見 | 資料庫讀取權限 |
| --- | --- | --- | --- |
| 點名 | 據點人員 | 據點人員、總院管理者 | 公開可讀（與報名紀錄同存，供長者免登入連結使用） |
| 現場反應 | 據點人員 | 據點人員、總院管理者 / 家屬可見自家長者 / 公開評鑑頁呈現統計 | 公開可讀（同上） |
| 家屬課後分享 | 家屬（需長者確實報名且課程已完成） | 公開評鑑頁 | 公開可讀 |
| 據點人員個別觀察 | 該據點人員 | 該據點人員、總院管理者 | 僅該據點人員、總院管理者 |
| 講師課後回報 | 講師 | 講師本人、據點人員、總院管理者 | 公開可讀（與排班紀錄同存） |

#### 使用技術

- 前端：Next.js、TypeScript、Tailwind CSS、shadcn/ui
- 資料庫與登入：Firebase Firestore、Firebase Authentication
- 部署：Vercel
- 開發工具：Firebase Studio、AI 輔助開發工具

#### 畫面截圖

- 可瀏覽公開頁面
| <img width="1917" height="1027" alt="image" src="https://github.com/user-attachments/assets/0220df3d-97bf-461e-8aa7-b7ce1f49b5d0" /> | <img width="1917" height="1025" alt="image" src="https://github.com/user-attachments/assets/8070a10d-ad5b-4f96-b1f4-31eb79d9318c" /> | <img width="1917" height="1028" alt="image" src="https://github.com/user-attachments/assets/c00feeba-6fd8-44d9-a828-031da14a4e4a" /> | 




#### 備註

- 系統內資料皆為測試資料，不含任何真實個人資訊。
- 後續規劃：以 FastAPI 串接 MS SQL Server，實作長者連續缺席等狀態變化示警功能。
