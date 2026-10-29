# CENTRALIZED ADMISSION MANAGEMENT SYSTEM

**Business Domain:** CR Garments (Garment Business Management System)

## 1. Project Objective
This project is a centralized web application that digitizes the day-to-day business operations of CR Garments. It replaces manual registers and spreadsheets with a cohesive, full-stack application.

## 2. Problem Statement
Managing inventory, tracking sales, and analyzing business performance manually is time-consuming and error-prone. Without a centralized system, CR Garments struggles to maintain accurate stock levels, track supplier payments, and analyze customer purchasing trends.

## 3. Proposed Solution
A custom-built Garments Business Management System named the "Centralized Admission Management System" (Academic Project Title). The system offers modules for inventory, sales, purchases, customer management, role-based access, and data analytics (including demand prediction using ML).

## 4. Features
- **Dashboard:** Real-time business metrics and charts.
- **Role-based Authentication:** Admin, Manager, and Staff access levels.
- **Inventory & Product Management:** Real-time stock updates on sales/purchases.
- **Sales & Billing:** POS-style checkout with automated PDF invoice generation.
- **Purchases & Suppliers:** Track supplier invoices and payments.
- **Analytics & Reports:** Data visualization of sales trends.
- **ML Demand Prediction:** Sales forecasting using Scikit-learn.

## 5. Technology Stack
- **Frontend:** React.js, Vite, React Router, Recharts, Axios, Tailwind CSS (Vanilla CSS structure used in base).
- **Backend:** Python, Flask, Flask-SQLAlchemy, Flask-RESTful.
- **Database:** SQLite (Migratable to MySQL/PostgreSQL).
- **Analytics & ML:** Pandas, NumPy, Scikit-learn.
- **PDF Generation:** jsPDF, jsPDF-AutoTable.

## 6. System Architecture
The application uses a standard 3-tier architecture:
- **Presentation Layer:** React single-page application (SPA).
- **Application Layer:** Flask REST API handling business logic and ML predictions.
- **Data Layer:** SQLite database accessed via SQLAlchemy ORM.

## 7. Installation & Setup

### Backend Setup
1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Create a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the server:
   ```bash
   python run.py
   ```
   The backend will start at `http://localhost:5000`

### Frontend Setup
1. Navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   npm install react-router-dom axios recharts jspdf jspdf-autotable lucide-react
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   The frontend will start at `http://localhost:5173`

## 8. Future Enhancements
- Online payment gateway integration
- WhatsApp / Email notifications
- Barcode scanner hardware support
- Advanced AI forecasting models
- Multi-branch management
