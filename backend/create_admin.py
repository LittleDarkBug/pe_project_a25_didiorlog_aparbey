import asyncio
import os
import sys

# Add the current directory to sys.path to make imports work
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from core.config import settings
from models.user import User
from models.project import Project
from models.share_link import ShareLink
from core.security import get_password_hash

async def create_admin():
    print(f"Connecting to MongoDB at {settings.MONGODB_URI}...")
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    await init_beanie(database=client[settings.DATABASE_NAME], document_models=[User, Project, ShareLink])

    email = "admin@test.com"
    password = "admin"
    
    print(f"Checking for user {email}...")
    user = await User.find_one(User.email == email)
    if user:
        print(f"User {email} already exists. Updating to admin...")
        user.role = "admin"
        user.is_superuser = True
        user.hashed_password = get_password_hash(password)
        await user.save()
        print("User updated successfully.")
    else:
        print(f"Creating admin user {email}...")
        user = User(
            email=email,
            hashed_password=get_password_hash(password),
            full_name="Admin User",
            role="admin",
            is_superuser=True,
            is_active=True
        )
        await user.create()
        print("Admin user created successfully.")

if __name__ == "__main__":
    asyncio.run(create_admin())
