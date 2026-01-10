from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

class AdminStats(BaseModel):
    total_users: int
    total_projects: int
    active_users: int
    public_projects: int

class UserAdminView(BaseModel):
    id: str
    email: EmailStr
    full_name: Optional[str] = None
    is_active: bool
    is_superuser: bool
    role: str
    is_elite: bool = False
    elite_request_status: str = "NONE"
    elite_request_date: Optional[datetime] = None
    created_at: datetime
    last_login: Optional[datetime] = None

class UserCreateAdmin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: Optional[str] = None
    role: str = "user"
    is_active: bool = True

class UserUpdateAdmin(BaseModel):
    is_active: Optional[bool] = None
    role: Optional[str] = None
    is_elite: Optional[bool] = None
    elite_request_status: Optional[str] = None

class ProjectAdminView(BaseModel):
    id: str
    name: str
    owner_email: Optional[str] = None
    is_public: bool
    created_at: datetime
    node_count: int = 0
    edge_count: int = 0

class ProjectUpdateAdmin(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_public: Optional[bool] = None
