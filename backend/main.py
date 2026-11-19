from datetime import date, timedelta
from typing import List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from schemas import ReportCreate, ReportResponse, TaskChecklist, TaskCreate

app = FastAPI(title="WorkFlow & Streak API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

reports_db: List[ReportResponse] = []
tasks_db: List[TaskChecklist] = [
    TaskChecklist(
        id=1,
        task_name="Chấm bài tập về nhà",
        is_completed_today=False,
        current_streak=5,
        last_completed_date=date.today() - timedelta(days=1),
    ),
]

@app.get("/reports/", response_model=List[ReportResponse])
async def get_reports():
    return reports_db

@app.post("/reports/", response_model=ReportResponse)
async def create_report(payload: ReportCreate):
    new_report = ReportResponse(
        id=len(reports_db) + 1,
        created_at=date.today(),
        **payload.model_dump(),
    )
    reports_db.append(new_report)
    return new_report

@app.get("/tasks/", response_model=List[TaskChecklist])
async def get_tasks():
    today = date.today()
    for task in tasks_db:
        if task.last_completed_date and task.last_completed_date < today - timedelta(days=1):
            task.current_streak = 0
            task.is_completed_today = False
    return tasks_db

@app.post("/tasks/", response_model=TaskChecklist)
async def create_task(payload: TaskCreate):
    new_id = max((t.id for t in tasks_db), default=0) + 1
    task = TaskChecklist(id=new_id, task_name=payload.task_name)
    tasks_db.append(task)
    return task

@app.post("/tasks/{task_id}/check")
async def check_task(task_id: int):
    today = date.today()
    for task in tasks_db:
        if task.id == task_id:
            if task.last_completed_date == today:
                raise HTTPException(status_code=400, detail="Task đã được check hôm nay!")
            task.current_streak = (
                task.current_streak + 1
                if task.last_completed_date == today - timedelta(days=1)
                else 1
            )
            task.last_completed_date = today
            task.is_completed_today = True
            return {"message": "Thành công", "task": task}
    raise HTTPException(status_code=404, detail="Không tìm thấy Task")