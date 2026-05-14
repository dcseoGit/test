from pydantic import BaseModel
from datetime import datetime
from typing import Optional

# 업무 생성 요청 스키마
class TaskCreate(BaseModel):
    title: str
    due_time: Optional[str] = None  # 예: "09:00"

# 상태 변경 요청 스키마
class TaskStatusUpdate(BaseModel):
    status: str

# 시간 변경 요청 스키마
class TaskTimeUpdate(BaseModel):
    due_time: Optional[str] = None

# 업무 응답 스키마
class TaskResponse(BaseModel):
    id: int
    title: str
    status: str
    due_time: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
