"""FastAPI application main entry point."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.config import get_settings
from src.models.predictor import get_predictor
from src.models.explainer import get_explainer
from src.etl.loader import get_data_loader
from src.api.routes import predict, intervention, students, dashboard, chat, upload


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager - load models on startup."""
    settings = get_settings()

    # Startup: Load prediction model
    predictor = get_predictor()
    predictor.load()
    print(f"[OK] Model loaded from {settings.model_path}")

    # Load SHAP explainer
    explainer = get_explainer()
    try:
        explainer.load()
        print("[OK] SHAP explainer initialized")
    except Exception as e:
        print(f"[WARN] Could not load SHAP explainer: {e}")

    # Don't auto-load student data - user will upload via /upload endpoint
    print("[INFO] No data auto-loaded. Upload CSV via /api/v1/upload/csv")

    yield

    # Shutdown: Cleanup if needed
    print("Shutting down...")


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    settings = get_settings()

    app = FastAPI(
        title=settings.api_title,
        version=settings.api_version,
        description="API for predicting student risk and generating interventions",
        lifespan=lifespan,
    )

    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Configure appropriately for production
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include routers
    app.include_router(predict.router, prefix=settings.api_prefix)
    app.include_router(intervention.router, prefix=settings.api_prefix)
    app.include_router(students.router, prefix=settings.api_prefix)
    app.include_router(dashboard.router, prefix=settings.api_prefix)
    app.include_router(chat.router, prefix=settings.api_prefix)
    app.include_router(upload.router, prefix=settings.api_prefix)

    @app.get("/", tags=["Health"])
    async def root():
        """Root endpoint - health check."""
        return {
            "status": "healthy",
            "api_version": settings.api_version,
            "model_loaded": get_predictor().is_loaded,
        }

    @app.get("/health", tags=["Health"])
    async def health_check():
        """Health check endpoint."""
        return {"status": "healthy", "model_loaded": get_predictor().is_loaded}

    @app.get(f"{settings.api_prefix}/health", tags=["Health"])
    async def api_health_check():
        """Health check endpoint under API prefix."""
        return {"status": "healthy", "model_loaded": get_predictor().is_loaded}

    return app


app = create_app()
