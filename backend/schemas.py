from pydantic import BaseModel
from datetime import datetime

# 업무 생성 요청 스키마
class TaskCreate(BaseModel):
    title: str

# 상태 변경 요청 스키마
class TaskStatusUpdate(BaseModel):
    status: str

# 업무 응답 스키마
class TaskResponse(BaseModel):
    id: int
    title: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
