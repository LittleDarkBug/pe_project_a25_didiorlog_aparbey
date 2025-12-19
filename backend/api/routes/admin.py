from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List
from api.dependencies import get_current_admin_user
from models.user import User
from models.project import Project
from schemas.admin import AdminStats, UserAdminView, UserUpdateAdmin, ProjectAdminView, UserCreateAdmin
from beanie import PydanticObjectId
from core.security import hash_password

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/stats", response_model=AdminStats)
async def get_admin_stats(admin: User = Depends(get_current_admin_user)):
    total_users = await User.count()
    active_users = await User.find(User.is_active == True).count()
    total_projects = await Project.count()
    public_projects = await Project.find(Project.is_public == True).count()
    
    return AdminStats(
        total_users=total_users,
        total_projects=total_projects,
        active_users=active_users,
        public_projects=public_projects
    )

@router.get("/users", response_model=List[UserAdminView])
async def get_users(
    skip: int = 0,
    limit: int = 50,
    search: str = None,
    admin: User = Depends(get_current_admin_user)
):
    query = User.find_all()
    if search:
        # Simple regex search for email or full_name
        query = User.find({"$or": [
            {"email": {"$regex": search, "$options": "i"}},
            {"full_name": {"$regex": search, "$options": "i"}}
        ]})
    
    users = await query.skip(skip).limit(limit).sort("-created_at").to_list()
    
    return [
        UserAdminView(
            id=str(user.id),
            email=user.email,
            full_name=user.full_name,
            is_active=user.is_active,
            is_superuser=user.is_superuser,
            role=user.role,
            created_at=user.created_at
        ) for user in users
    ]

@router.post("/users", response_model=UserAdminView, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_in: UserCreateAdmin,
    admin: User = Depends(get_current_admin_user)
):
    existing_user = await User.find_one(User.email == user_in.email)
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="User with this email already exists"
        )
    
    hashed_password = hash_password(user_in.password)
    user = User(
        email=user_in.email,
        hashed_password=hashed_password,
        full_name=user_in.full_name,
        role=user_in.role,
        is_active=user_in.is_active,
        is_superuser=(user_in.role == "admin")
    )
    await user.create()
    
    return UserAdminView(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        is_active=user.is_active,
        is_superuser=user.is_superuser,
        role=user.role,
        created_at=user.created_at
    )

@router.patch("/users/{user_id}", response_model=UserAdminView)
async def update_user(
    user_id: PydanticObjectId,
    update_data: UserUpdateAdmin,
    admin: User = Depends(get_current_admin_user)
):
    user = await User.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if update_data.is_active is not None:
        user.is_active = update_data.is_active
    if update_data.role is not None:
        user.role = update_data.role
        if user.role == "admin":
            user.is_superuser = True
        else:
            user.is_superuser = False
            
    await user.save()
    
    return UserAdminView(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        is_active=user.is_active,
        is_superuser=user.is_superuser,
        role=user.role,
        created_at=user.created_at
    )

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: PydanticObjectId,
    admin: User = Depends(get_current_admin_user)
):
    user = await User.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent self-deletion
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
        
    await user.delete()
    return {"message": "User deleted successfully"}

@router.get("/projects", response_model=List[ProjectAdminView])
async def get_projects(
    skip: int = 0,
    limit: int = 50,
    search: str = None,
    admin: User = Depends(get_current_admin_user)
):
    query = Project.find_all()
    if search:
        query = Project.find({"name": {"$regex": search, "$options": "i"}})
        
    projects = await query.skip(skip).limit(limit).sort("-created_at").to_list()
    
    results = []
    for p in projects:
        # Fetch owner email if possible
        owner_email = "Unknown"
        if p.owner:
            # Assuming owner is a Link, we might need to fetch it if not populated
            # Beanie fetch_link
            try:
                if isinstance(p.owner, User):
                    owner_email = p.owner.email
                else:
                    # It's a Link/DBRef, fetch it
                    owner = await p.owner.fetch()
                    if owner:
                        owner_email = owner.email
            except:
                pass
        
        node_count = 0
        edge_count = 0
        if p.metadata:
            node_count = p.metadata.get("node_count", 0)
            edge_count = p.metadata.get("edge_count", 0)
            
        results.append(ProjectAdminView(
            id=str(p.id),
            name=p.name,
            owner_email=owner_email,
            is_public=p.is_public,
            created_at=p.created_at,
            node_count=node_count,
            edge_count=edge_count
        ))
        
    return results

@router.delete("/projects/{project_id}")
async def delete_project(
    project_id: PydanticObjectId,
    admin: User = Depends(get_current_admin_user)
):
    project = await Project.get(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    await project.delete()
    return {"message": "Project deleted successfully"}
