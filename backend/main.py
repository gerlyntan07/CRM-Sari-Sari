# main.py
import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from database import Base, engine

# Import models to create tables
import models.auth
import models.company

# Import routers
import routers.auth as auth_router
import routers.company as company_router
import routers.users as users_router
app = FastAPI()
app.include_router(auth_router.router, prefix='/api')
app.include_router(company_router.router, prefix='/api')
app.include_router(users_router.router, prefix='/api')


MEDIA_ROOT = os.getenv("MEDIA_ROOT", "./media")
app.mount("/media", StaticFiles(directory=MEDIA_ROOT), name="media")

origins = [
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

@app.on_event("startup")
def startup_event():
    print("Backend API is starting up...")

@app.get("/")
def root():
    return {"msg": "Notes API is running"}