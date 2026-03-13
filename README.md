# 🏥 Family Medical Record System

A private, local-first web application for managing your family's complete medical history — including doctor visits, lab reports, medicines, and health expenses — all stored securely on your device.

---

## ✨ Features

### 👨‍👩‍👧‍👦 Family Profiles
- Add and manage multiple family members.
- Store health details: blood group, allergies, medical conditions, insurance info.
- View individual member profiles with full health history.

### 🩺 Doctor Visits
- Record doctor visits with doctor name, hospital, specialization, diagnosis, and fee.
- Attach prescription files (JPG, PNG, PDF, DOC, DOCX) — up to 5 files per visit.
- Track follow-up appointments with reminders.
- Log prescribed medicines per visit.

### 🧪 Lab Reports
- Upload and manage lab reports (Blood Test, X-Ray, MRI, CT Scan, etc.).
- Attach up to 5 files per report (images and documents).
- Edit any existing report at any time.
- Click image attachments to open in a full preview. Click documents to download.

### 💊 Medicine Tracker
- Automatically aggregates all medicines prescribed across all doctor visits.
- View prescriptions per family member.

### 💰 Health Expenses
- Tracks all consultation fees entered against doctor visits.
- View total spend, yearly spend, and average cost per visit.
- Identifies the top spending family member.

### 🔔 Notifications
- In-app alerts for upcoming follow-up appointments (within 30 days).

### ⚙️ Settings
- Toggle Two-Factor Authentication (OTP via email).
- Export your full data as a **JSON backup** or a **CSV spreadsheet**.
- Full account and security management.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, Vanilla CSS, JavaScript |
| Build Tool | [Vite](https://vitejs.dev/) |
| Storage | Browser `localStorage` (local-first, no backend) |
| Auth OTP | [EmailJS](https://www.emailjs.com/) |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or above recommended)
- npm

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Madhesh0203/Family-medical-record-system.git
    cd Family-medical-record-system
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure EmailJS (for OTP login):**
    - Copy `.env.example` to `.env`:
      ```bash
      cp .env.example .env
      ```
    - Fill in your EmailJS credentials in `.env`:
      ```
      VITE_EMAILJS_SERVICE_ID=your_service_id
      VITE_EMAILJS_TEMPLATE_ID=your_template_id
      VITE_EMAILJS_PUBLIC_KEY=your_public_key
      ```

4.  **Start the development server:**
    ```bash
    npm run dev
    ```

5.  Open your browser and navigate to `http://localhost:5173` (or the port shown in your terminal).

---

## 📁 Project Structure

```
Family-medical-record-system/
├── index.html          # Login / Registration page
├── app.html            # Main application shell
├── css/                # Stylesheets
├── js/
│   ├── data.js         # localStorage helpers & data utilities
│   ├── ui.js           # UI helpers (toasts, navigation, search)
│   ├── dashboard.js    # Dashboard rendering
│   ├── profiles.js     # Family member management
│   ├── visits.js       # Doctor visit management
│   ├── modules.js      # Lab reports, medicines, expenses, settings
│   └── app.js          # App entry point & event listeners
└── package.json
```

---

## 🔒 Privacy & Security

- **Local-first:** All your family health data is stored only on your device via `localStorage`. No data is ever sent to an external server.
- **Optional 2FA:** Enable Two-Factor Authentication via OTP for an extra layer of security.
- **Data Portability:** Export your data at any time as a JSON or CSV file.

---

## 🐛 Issues & Contributions

Found a bug or want to suggest a feature? Please open an issue on [GitHub Issues](https://github.com/Madhesh0203/Family-medical-record-system/issues).


