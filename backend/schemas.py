from datetime import date
from typing import Optional
from pydantic import BaseModel

class ReportCreate(BaseModel):
    student_name: str
    course_name: str
    logic_score: int
    focus_level: str
    teacher_comments: str

class ReportResponse(ReportCreate):
    id: int
    created_at: date

class TaskCreate(BaseModel):
    task_name: str

class TaskChecklist(BaseModel):
    id: int
    task_name: str
    is_completed_today: bool = False
    current_streak: int = 0
    last_completed_date: Optional[date] = None