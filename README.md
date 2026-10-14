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
首頁 <img width="1896" height="966" alt="image" src="https://github.com/user-attachments/assets/d1cb3dbf-65a7-4cfc-a903-47d91aaafedd" />
課程簡介 <img width="1897" height="967" alt="image" src="https://github.com/user-attachments/assets/13e4535a-241c-4bf8-aa59-5f7203072422" />
課程行事曆 <img width="1897" height="965" alt="image" src="https://github.com/user-attachments/assets/db21c9b6-7cf9-406a-8b2c-b2d42be4a9db" />
課程評鑑 <img width="1917" height="968" alt="image" src="https://github.com/user-attachments/assets/205078c3-ff76-4f4b-b77c-033c08261777" />

- 總院管理者介面
講師履歷 <img width="1917" height="971" alt="image" src="https://github.com/user-attachments/assets/5b538146-62a2-488c-8b92-fa07eb386717" />
課程管理 <img width="1917" height="1027" alt="image" src="https://github.com/user-attachments/assets/14cc3a4d-aab5-43a3-bcaf-90b0d32d826b" />
講師排班 <img width="1917" height="1026" alt="image" src="https://github.com/user-attachments/assets/3f4bc723-5d44-4154-8c7f-acfa0649324a" />
費用結算 <img width="1917" height="1030" alt="image" src="https://github.com/user-attachments/assets/92df5a60-5fcb-4c77-a551-142a86e7f9d6" />
出席確認 (已完成) <img width="1895" height="968" alt="image" src="https://github.com/user-attachments/assets/e301c5ae-94a5-4aba-a2ad-58cb7ef5ef43" />
出席確認 (待確認) <img width="1892" height="972" alt="image" src="https://github.com/user-attachments/assets/1463eea9-645c-4a51-b478-e5795b4097e4" />
講師對話 <img width="1897" height="971" alt="image" src="https://github.com/user-attachments/assets/04ed307b-8e43-4ecd-b3a7-1aa85959393a" />

- 據點人員介面
講師排班 <img width="1917" height="1028" alt="image" src="https://github.com/user-attachments/assets/697e6fcd-bd5c-4e84-8cdf-0cb688bd397a" />
出席確認 (已完成) <img width="1917" height="967" alt="image" src="https://github.com/user-attachments/assets/356c898f-7e91-4f23-af54-11c1dbc2a3c2" />
出席確認 (待確認) <img width="1917" height="968" alt="image" src="https://github.com/user-attachments/assets/6e9c64f6-2d01-44b5-9731-4a4d5db46303" />

- 家屬介面
我的長者 <img width="1917" height="967" alt="image" src="https://github.com/user-attachments/assets/0b21d70c-8a03-4ad8-bc8e-c4710a9d6112" />
課程紀錄 <img width="1917" height="968" alt="image" src="https://github.com/user-attachments/assets/6ede892d-471d-4f60-b762-d00658f7caaf" />

- 長者專屬連結
<img width="1917" height="968" alt="image" src="https://github.com/user-attachments/assets/d4b5da53-69e1-42ad-9bd8-2c65afc2bbe4" />

#### 備註

- 系統內資料皆為測試資料，不含任何真實個人資訊。
- 後續規劃：以 FastAPI 串接 MS SQL Server，實作長者連續缺席等狀態變化示警功能。
