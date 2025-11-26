import asyncio
import sys
import os

# Add current directory to path so we can import core and models
sys.path.append(os.getcwd())

from core.database import MongoDB
from models.user import User
from models.project import Project

async def reset():
    print("Connecting to DB...")
    try:
        await MongoDB.connect()
    except Exception as e:
        print(f"Error connecting: {e}")
        return

    print("Deleting all projects...")
    await Project.delete_all()
    
    print("Deleting all users...")
    await User.delete_all()
    
    print("Database cleared successfully.")

if __name__ == "__main__":
    # Fix for Windows asyncio loop policy if needed, but usually fine for simple scripts
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
        
    asyncio.run(reset())
