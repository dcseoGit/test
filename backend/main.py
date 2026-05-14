from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List
import models
import schemas
from database import engine, get_db

# 테이블 자동 생성
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="업무 관리 앱")

# CORS 설정 (프론트엔드 연결 허용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def migrate_db():
    # 기존 DB에 due_time 컬럼이 없을 경우 추가
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE tasks ADD COLUMN due_time TEXT"))
            conn.commit()
        except Exception:
            pass


@app.get("/api/tasks", response_model=List[schemas.TaskResponse])
def get_tasks(db: Session = Depends(get_db)):
    # 최신 업무 순으로 조회
    return db.query(models.Task).order_by(models.Task.created_at.desc()).all()


@app.post("/api/tasks", response_model=schemas.TaskResponse)
def create_task(task: schemas.TaskCreate, db: Session = Depends(get_db)):
    # 새 업무 생성
    db_task = models.Task(title=task.title, due_time=task.due_time)
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task


@app.patch("/api/tasks/{task_id}/status", response_model=schemas.TaskResponse)
def update_task_status(task_id: int, status_update: schemas.TaskStatusUpdate, db: Session = Depends(get_db)):
    # 업무 상태 변경
    valid_statuses = ["todo", "in_progress", "done"]
    if status_update.status not in valid_statuses:
        raise HTTPException(status_code=400, detail="유효하지 않은 상태값입니다")

    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="업무를 찾을 수 없습니다")

    task.status = status_update.status
    db.commit()
    db.refresh(task)
    return task


@app.patch("/api/tasks/{task_id}/time", response_model=schemas.TaskResponse)
def update_task_time(task_id: int, time_update: schemas.TaskTimeUpdate, db: Session = Depends(get_db)):
    # 업무 시간 변경
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="업무를 찾을 수 없습니다")

    task.due_time = time_update.due_time
    db.commit()
    db.refresh(task)
    return task


@app.delete("/api/tasks/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db)):
    # 업무 삭제
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="업무를 찾을 수 없습니다")

    db.delete(task)
    db.commit()
    return {"message": "삭제되었습니다"}
