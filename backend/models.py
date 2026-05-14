from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from database import Base

# 업무 테이블 모델
class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    status = Column(String, default="todo")  # todo | in_progress | done
    created_at = Column(DateTime, server_default=func.now())
