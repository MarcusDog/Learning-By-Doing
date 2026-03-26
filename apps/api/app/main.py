from fastapi import FastAPI

from .routers.auth import router as auth_router
from .routers.admin import router as admin_router
from .routers.ai import router as ai_router
from .routers.content import router as content_router
from .routers.exercise import router as exercise_router
from .routers.health import router as health_router
from .routers.imports import router as imports_router
from .routers.progress import router as progress_router
from .routers.run import router as run_router
from .routers.studio import router as studio_router

app = FastAPI(title="Learning By Doing API", version="0.1.0")

app.include_router(auth_router)
app.include_router(health_router)
app.include_router(content_router)
app.include_router(progress_router)
app.include_router(exercise_router)
app.include_router(run_router)
app.include_router(ai_router)
app.include_router(studio_router)
app.include_router(admin_router)
app.include_router(imports_router)
