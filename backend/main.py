import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from database import Base, engine

# Import models to create tables
import models.auth
import models.company

# Import routers
import routers.auth as auth_router
import routers.company as company_router
import routers.users as users_router


app = FastAPI()

# === Routers ===
app.include_router(auth_router.router, prefix='/api')
app.include_router(company_router.router, prefix='/api')
app.include_router(users_router.router, prefix='/api')

# === Database initialization ===
Base.metadata.create_all(bind=engine)

# === CORS setup ===
origins = [
    "http://localhost:5173",  # local dev
    "*",  # allow all in production; adjust later for security
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === Media setup ===
MEDIA_ROOT = os.getenv("MEDIA_ROOT", "./media")
app.mount("/media", StaticFiles(directory=MEDIA_ROOT), name="media")

# === Frontend setup ===
# Assuming your built React files are inside: backend/static/
FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "static")

if os.path.exists(FRONTEND_DIR):
    app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
else:
    @app.get("/")
    def root_fallback():
        return {"msg": "Notes API is running (no frontend found)"}


@app.on_event("startup")
def startup_event():
    print("Backend API is starting up...")


# Optional: Serve index.html for any unknown route (React Router support)
@app.get("/{full_path:path}")
def serve_react_app(full_path: str):
    index_path = os.path.join(FRONTEND_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"msg": "Notes API is running"}
