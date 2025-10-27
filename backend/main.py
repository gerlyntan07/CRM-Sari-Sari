import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from database import Base, engine
from dotenv import load_dotenv
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

# Import models to create tables
import models.auth
import models.company
import models.subscription
import models.auditlog
import models.territory
import models.lead
import models.account
import models.contact
import models.deal
import models.task

# Import routers
import routers.auth as auth_router
import routers.company as company_router
import routers.users as users_router
import routers.subscription as subscription_router
import routers.territory as territory_router
import routers.lead as lead_router
import routers.task as task_router
import routers.auditlog as auditlog_router
import routers.account as account_router
import routers.contact as contact_router

app = FastAPI()

# === Routers ===
app.include_router(auth_router.router, prefix='/api')
app.include_router(company_router.router, prefix='/api')
app.include_router(users_router.router, prefix='/api')
app.include_router(subscription_router.router, prefix='/api')
app.include_router(territory_router.router, prefix='/api')
app.include_router(lead_router.router, prefix='/api')
app.include_router(task_router.router, prefix='/api')
app.include_router(auditlog_router.router, prefix='/api')
app.include_router(account_router.router, prefix='/api')
app.include_router(contact_router.router, prefix='/api')

# === Database initialization ===
Base.metadata.create_all(bind=engine)

# === CORS setup ===
origins = [
    "http://localhost:5173",  # local dev
    "*",  # allow all in production; adjust later for security
    "http://crm-sari-sari-env.eba-pdpixtqe.ap-southeast-1.elasticbeanstalk.com",
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
