# Smart Quality Test System - Setup & Running Guide

## Prerequisites

- Python 3.9+
- Node.js 18+
- npm or yarn

## Setup Instructions

### 1. Backend Setup (Flask Server)

```bash
# Navigate to project root
cd /Users/peeyush.shukla/Desktop/MiniProject/FlipKart-GRiD-6.0-Robotics

# Install Python dependencies
pip3 install flask flask-cors opencv-python sqlite3 hashlib secrets datetime

# Or install from requirements if it exists
pip3 install -r requirements.txt
```

### 2. Frontend Setup (React App)

```bash
# Navigate to frontend directory
cd frontend

# Install Node.js dependencies
npm install

# Go back to project root
cd ..
```

## Running the Servers

### Terminal 1 - Backend Server (Flask)

```bash
# From project root directory
python3 app.py
```

**Expected Output:**
```
* Serving Flask app 'app'
* Debug mode: on
* Running on http://127.0.0.1:5000
* Press CTRL+C to quit
```

### Terminal 2 - Frontend Server (React)

```bash
# Navigate to frontend directory
cd frontend

# Start the development server
npm run dev
```

**Expected Output:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5174/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

## Quick Start Commands

### Option 1: Two Terminal Setup

**Terminal 1:**
```bash
cd /Users/peeyush.shukla/Desktop/MiniProject/FlipKart-GRiD-6.0-Robotics
python3 app.py
```

**Terminal 2:**
```bash
cd /Users/peeyush.shukla/Desktop/MiniProject/FlipKart-GRiD-6.0-Robotics/frontend
npm run dev
```

### Option 2: Background Process (Advanced)

```bash
# Start backend in background
cd /Users/peeyush.shukla/Desktop/MiniProject/FlipKart-GRiD-6.0-Robotics
python3 app.py &

# Start frontend
cd frontend
npm run dev
```

## Accessing the Application

1. **Frontend (Main Application)**: http://localhost:5174
2. **Backend API**: http://127.0.0.1:5000
3. **API Health Check**: http://127.0.0.1:5000/api/health

## Default Login Credentials

- **Email**: admin@company.com
- **Password**: admin123

Or create a new account using the signup feature.

## Features Available

- 🔐 **User Authentication**: Login/Signup system
- 📸 **Image Analysis**: Upload or capture images
- 🔍 **AI Services**: 
  - OCR (Text Recognition)
  - Product Count (Object Detection)
  - Freshness Detection
  - Brand Recognition
- 📊 **Personal Dashboard**: User analytics and history
- 📚 **Help Documentation**: Complete user guide

## Troubleshooting

### Backend Issues

- **Port 5000 in use**: Kill existing processes or disable AirPlay Receiver on macOS
- **Module not found**: Ensure all dependencies are installed with `pip3 install`
- **Database errors**: Delete `users.db` to reset the database

### Frontend Issues

- **Port 5174 in use**: Frontend will automatically use next available port
- **Dependencies missing**: Run `npm install` in the frontend directory
- **Build errors**: Check Node.js version (requires 18+)

### Authentication Issues

- Clear browser cookies and local storage
- Restart both servers
- Check network requests in browser developer tools

## Development Notes

- Backend runs on port 5000 with CORS enabled
- Frontend runs on port 5174 with hot reload
- Database is SQLite (`users.db`) - automatically created
- File uploads stored in `static/uploads/` (ignored by git)
- All user data is session-based and persistent

## Stopping the Servers

- **Backend**: Press `Ctrl+C` in the terminal running `python3 app.py`
- **Frontend**: Press `Ctrl+C` in the terminal running `npm run dev`
