# InventoryOS

InventoryOS is a modern, full-stack Inventory Management System designed to help businesses track products, manage customers, and process orders effortlessly.

![InventoryOS UI](https://img.shields.io/badge/UI-Light_Mode-white?style=for-the-badge)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)

## ✨ Features

- **Product Management:** Add, update, and track inventory items.
- **Customer Database:** Manage customer details and order history.
- **Order Processing:** Seamlessly place orders connecting customers to products.
- **Real-time Inventory Deduction:** Stock levels automatically update when orders are placed.
- **Modern UI:** A clean, responsive light-mode interface with subtle animations.
- **Automated CI/CD:** GitHub Actions automatically builds and pushes Docker images.

## 🚀 Tech Stack

### Backend
- **Framework:** FastAPI (Python)
- **Database:** PostgreSQL via SQLAlchemy ORM
- **Deployment:** Railway
- **Containerization:** Docker & Docker Hub

### Frontend
- **Framework:** React + Vite
- **Styling:** Vanilla CSS (Light Theme Custom Properties)
- **Icons:** Lucide React
- **Deployment:** Vercel

## 🌐 Live Deployments

- **Frontend Application:** [https://frontend-nine-xi-46.vercel.app](https://frontend-nine-xi-46.vercel.app)
- **Backend API Docs:** [https://inventoryos-backend-production.up.railway.app/docs](https://inventoryos-backend-production.up.railway.app/docs)

## 💻 Local Development Setup

### 1. Clone the repository
```bash
git clone https://github.com/angaadmallick375-git/Inventory-Management.git
cd Inventory-Management
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`
pip install -r requirements.txt

# Create a .env file based on .env.example with your local database URL
# Run the server
uvicorn app.main:app --reload
```

### 3. Frontend Setup
```bash
cd frontend
npm install

# Run the development server
npm run dev
```

## 📜 License
This project is licensed under the MIT License.
