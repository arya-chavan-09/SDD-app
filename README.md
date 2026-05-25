# SDD-App — Employee Management Dashboard

A simple Employee Management Dashboard with CRUD operations, built with **FastAPI** (Python) backend and **vanilla JavaScript** frontend.

## Features

- Dashboard with employee statistics (total, active, inactive, departments)
- Full CRUD — add, view, edit, and delete employees
- SQLite database for persistence
- Clean dark-themed UI

## Setup

```bash
# Install dependencies
pip install -r requirements.txt

# Run the server
python3 run.py
```

Open **http://127.0.0.1:8000** in your browser.

The app seeds 6 sample employees on first run.

## Project Structure

```
SDD-app/
├── backend/                 # Python backend
│   ├── __init__.py
│   ├── main.py              # FastAPI app + API routes
│   ├── database.py          # SQLite / SQLAlchemy setup
│   └── models.py            # ORM model + Pydantic schemas
├── frontend/                # Static frontend
│   ├── index.html
│   ├── index.css
│   └── app.js
├── run.py                   # Entry point
├── requirements.txt         # Python dependencies
├── Prompt.md
└── README.md
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/employees` | List all employees |
| GET | `/api/employees/{id}` | Get one employee |
| POST | `/api/employees` | Create employee |
| PUT | `/api/employees/{id}` | Update employee |
| DELETE | `/api/employees/{id}` | Delete employee |
| GET | `/api/stats` | Dashboard stats |