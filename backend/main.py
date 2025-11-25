"""
Point d'entrée principal de l'application FastAPI.
Configure les middlewares, les routes et le cycle de vie de l'application.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
from core.config import settings
from api.routes import auth, files, projects


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Gère le cycle de vie de l'application.
    
    Startup: Connexion MongoDB et Redis
    Shutdown: Fermeture propre des connexions
    """
    logger.info("Starting application...")
    
    try:
        from core.database import MongoDB
        from core.redis_client import RedisClient
        
        logger.info("Connecting to MongoDB...")
        await MongoDB.connect()
        logger.success("MongoDB connected")
        
        logger.info("Connecting to Redis...")
        await RedisClient.connect()
        logger.success("Redis connected")
    except Exception as e:
        logger.exception(f"Failed to connect to databases: {e}")
        logger.warning("Application will start but database features are disabled")
    
    yield
    
    logger.info("Shutting down application...")
    
    try:
        from core.database import MongoDB
        from core.redis_client import RedisClient
        
        await MongoDB.close()
        logger.info("MongoDB connection closed")
        
        await RedisClient.close()
        logger.info("Redis connection closed")
    except Exception as e:
        logger.error(f"Error during shutdown: {e}")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="API Backend pour calcul de spatialisation de graphes avec authentification JWT",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(files.router)
app.include_router(projects.router)


@app.get("/", tags=["Root"])
async def root():
    """
    Endpoint racine de l'API.
    
    Returns:
        Message de bienvenue et version
    """
    return {
        "message": "PE_Def_Project Backend API",
        "version": settings.APP_VERSION,
        "docs": "/docs"
    }


@app.get("/health", tags=["Health"])
async def health():
    """
    Endpoint de health check pour monitoring.
    
    Returns:
        Statut de l'application
    """
    return {
        "status": "healthy",
        "version": settings.APP_VERSION
    }
