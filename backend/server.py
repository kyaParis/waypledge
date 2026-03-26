from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field
from bson import ObjectId
import os
import logging
from pathlib import Path
import uuid

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
SECRET_KEY = os.environ.get("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30

# Admin emails (comma-separated)
ADMIN_EMAILS = [e.strip().lower() for e in os.environ.get("ADMIN_EMAILS", "").split(",") if e.strip()]

def is_user_admin(email: str) -> bool:
    """Check if a user email is in the admin list"""
    return email.lower() in ADMIN_EMAILS

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication")
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication")

# Models
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    bio: Optional[str] = ""
    location: Optional[str] = ""

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    bio: str
    location: str
    avatar: Optional[str] = None
    created_at: datetime
    is_admin: bool = False

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class PledgeCreate(BaseModel):
    title: str
    description: str
    category: str
    tags: List[str] = []
    location: Optional[str] = ""
    image: Optional[str] = None
    hive_id: Optional[str] = None  # Tag pledge to a hive

class PledgeResponse(BaseModel):
    id: str
    user_id: str
    user_name: str
    title: str
    description: str
    category: str
    tags: List[str]
    location: str
    status: str
    image: Optional[str] = None
    hive_id: Optional[str] = None
    hive_name: Optional[str] = None
    created_at: datetime

class WishCreate(BaseModel):
    title: str
    description: str
    category: str
    tags: List[str] = []
    location: Optional[str] = ""
    hive_id: Optional[str] = None  # Tag wish to a hive

class WishResponse(BaseModel):
    id: str
    user_id: str
    user_name: str
    title: str
    description: str
    category: str
    tags: List[str]
    location: str
    status: str
    fulfilled_by: Optional[str] = None
    hive_id: Optional[str] = None
    hive_name: Optional[str] = None
    created_at: datetime

class ConnectionCreate(BaseModel):
    pledge_id: Optional[str] = None
    wish_id: Optional[str] = None
    receiver_id: str
    message: str

class ConnectionResponse(BaseModel):
    id: str
    pledge_id: Optional[str] = None
    wish_id: Optional[str] = None
    pledger_id: str
    wisher_id: str
    status: str
    created_at: datetime

class MessageCreate(BaseModel):
    connection_id: str
    content: str

class MessageResponse(BaseModel):
    id: str
    connection_id: str
    sender_id: str
    sender_name: str
    receiver_id: str
    content: str
    read: bool
    created_at: datetime

class GratitudeCreate(BaseModel):
    to_user_id: str
    connection_id: Optional[str] = None
    message: str

class GratitudeResponse(BaseModel):
    id: str
    from_user_id: str
    from_user_name: str
    to_user_id: str
    to_user_name: str
    connection_id: Optional[str] = None
    message: str
    created_at: datetime

class ReportCreate(BaseModel):
    report_type: str  # "pledge", "wish", "user", "other"
    item_id: Optional[str] = None  # ID of pledge/wish/user being reported
    item_title: Optional[str] = None
    reason: str  # "inappropriate", "spam", "abuse", "scam", "other"
    description: str

class ReportResponse(BaseModel):
    id: str
    reporter_id: str
    reporter_name: str
    report_type: str
    item_id: Optional[str] = None
    item_title: Optional[str] = None
    reason: str
    description: str
    status: str  # "pending", "reviewed", "resolved"
    created_at: datetime

class CategoryResponse(BaseModel):
    id: str
    name: str
    icon: str

# Hive Models - Federation-Ready Architecture
class HiveCreate(BaseModel):
    name: str
    description: str
    location: str
    vision: Optional[str] = ""  # What this hive stands for
    image: Optional[str] = None
    parent_hive_id: Optional[str] = None  # Link to parent (e.g., Spain for Altaona)

class HiveResponse(BaseModel):
    id: str
    name: str
    description: str
    location: str
    vision: str
    image: Optional[str] = None
    hive_type: str  # "local" (within WayPledge) or "federated" (external platform)
    founder_id: str
    founder_name: str
    member_count: int
    pledge_count: int
    wish_count: int
    external_url: Optional[str] = None  # For federated hives
    api_endpoint: Optional[str] = None  # For future federation
    is_verified: bool
    parent_hive_id: Optional[str] = None  # Parent hive (e.g., Spain)
    parent_hive_name: Optional[str] = None
    child_hive_count: int = 0  # Number of sub-communities
    created_at: datetime

# Federation Models - Connect External Platforms
class FederationRequest(BaseModel):
    platform_name: str  # e.g., "UPledge"
    platform_url: str  # e.g., "https://upledge.org"
    api_endpoint: str  # e.g., "https://upledge.org/api"
    contact_email: str
    description: str  # About the platform
    location: str  # Where they're based
    pledge_agreement: bool  # Must agree to Do No Harm Pledge

class FederationResponse(BaseModel):
    id: str
    platform_name: str
    platform_url: str
    api_endpoint: str
    contact_email: str
    description: str
    location: str
    status: str  # "pending", "approved", "rejected"
    api_key: Optional[str] = None  # Generated on approval for API access
    created_at: datetime
    approved_at: Optional[datetime] = None

class HiveMemberResponse(BaseModel):
    id: str
    user_id: str
    user_name: str
    hive_id: str
    role: str  # "founder", "guardian", "member"
    joined_at: datetime

# Auth endpoints
@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserRegister):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_dict = {
        "email": user_data.email,
        "password_hash": get_password_hash(user_data.password),
        "name": user_data.name,
        "bio": user_data.bio,
        "location": user_data.location,
        "avatar": None,
        "created_at": datetime.utcnow()
    }
    result = await db.users.insert_one(user_dict)
    user_dict["_id"] = result.inserted_id
    
    # Create token
    token = create_access_token({"sub": str(result.inserted_id)})
    
    user_response = UserResponse(
        id=str(user_dict["_id"]),
        email=user_dict["email"],
        name=user_dict["name"],
        bio=user_dict["bio"],
        location=user_dict["location"],
        avatar=user_dict["avatar"],
        created_at=user_dict["created_at"],
        is_admin=is_user_admin(user_dict["email"])
    )
    
    return TokenResponse(access_token=token, token_type="bearer", user=user_response)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(user_data: UserLogin):
    user = await db.users.find_one({"email": user_data.email})
    if not user or not verify_password(user_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_access_token({"sub": str(user["_id"])})
    
    user_response = UserResponse(
        id=str(user["_id"]),
        email=user["email"],
        name=user["name"],
        bio=user["bio"],
        location=user["location"],
        avatar=user.get("avatar"),
        created_at=user["created_at"],
        is_admin=is_user_admin(user["email"])
    )
    
    return TokenResponse(access_token=token, token_type="bearer", user=user_response)

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user = Depends(get_current_user)):
    return UserResponse(
        id=str(current_user["_id"]),
        email=current_user["email"],
        name=current_user["name"],
        bio=current_user["bio"],
        location=current_user["location"],
        avatar=current_user.get("avatar"),
        created_at=current_user["created_at"],
        is_admin=is_user_admin(current_user["email"])
    )

# Pledge endpoints
async def get_hive_name(hive_id: Optional[str]) -> Optional[str]:
    """Helper to get hive name from ID"""
    if not hive_id:
        return None
    hive = await db.hives.find_one({"_id": ObjectId(hive_id)})
    return hive["name"] if hive else None

@api_router.post("/pledges", response_model=PledgeResponse)
async def create_pledge(pledge: PledgeCreate, current_user = Depends(get_current_user)):
    # Validate hive membership if hive_id provided
    hive_name = None
    if pledge.hive_id:
        member = await db.hive_members.find_one({
            "user_id": str(current_user["_id"]),
            "hive_id": pledge.hive_id
        })
        if not member:
            raise HTTPException(status_code=403, detail="You must be a member of this hive to post here")
        hive_name = await get_hive_name(pledge.hive_id)
    
    pledge_dict = {
        "user_id": str(current_user["_id"]),
        "user_name": current_user["name"],
        "title": pledge.title,
        "description": pledge.description,
        "category": pledge.category,
        "tags": pledge.tags,
        "location": pledge.location or "",
        "status": "active",
        "image": pledge.image,
        "hive_id": pledge.hive_id,
        "created_at": datetime.utcnow()
    }
    result = await db.pledges.insert_one(pledge_dict)
    pledge_dict["_id"] = result.inserted_id
    
    return PledgeResponse(
        id=str(pledge_dict["_id"]),
        user_id=pledge_dict["user_id"],
        user_name=pledge_dict["user_name"],
        title=pledge_dict["title"],
        description=pledge_dict["description"],
        category=pledge_dict["category"],
        tags=pledge_dict["tags"],
        location=pledge_dict["location"],
        status=pledge_dict["status"],
        image=pledge_dict["image"],
        hive_id=pledge_dict["hive_id"],
        hive_name=hive_name,
        created_at=pledge_dict["created_at"]
    )

@api_router.get("/pledges", response_model=List[PledgeResponse])
async def get_pledges(category: Optional[str] = None, search: Optional[str] = None, location: Optional[str] = None, hive_id: Optional[str] = None):
    query = {"status": "active"}
    if category:
        query["category"] = category
    if location:
        query["location"] = {"$regex": location, "$options": "i"}
    if hive_id:
        query["hive_id"] = hive_id
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"tags": {"$regex": search, "$options": "i"}}
        ]
    
    pledges = await db.pledges.find(query).sort("created_at", -1).to_list(100)
    
    # Build response with hive names
    result = []
    for p in pledges:
        hive_name = await get_hive_name(p.get("hive_id")) if p.get("hive_id") else None
        result.append(PledgeResponse(
            id=str(p["_id"]),
            user_id=p["user_id"],
            user_name=p["user_name"],
            title=p["title"],
            description=p["description"],
            category=p["category"],
            tags=p["tags"],
            location=p.get("location", ""),
            status=p["status"],
            image=p.get("image"),
            hive_id=p.get("hive_id"),
            hive_name=hive_name,
            created_at=p["created_at"]
        ))
    return result

@api_router.get("/pledges/mine", response_model=List[PledgeResponse])
async def get_my_pledges(current_user = Depends(get_current_user)):
    pledges = await db.pledges.find({"user_id": str(current_user["_id"])}).sort("created_at", -1).to_list(100)
    return [PledgeResponse(
        id=str(p["_id"]),
        user_id=p["user_id"],
        user_name=p["user_name"],
        title=p["title"],
        description=p["description"],
        category=p["category"],
        tags=p["tags"],
        location=p.get("location", ""),
        status=p["status"],
        image=p.get("image"),
        created_at=p["created_at"]
    ) for p in pledges]

@api_router.get("/pledges/{pledge_id}", response_model=PledgeResponse)
async def get_pledge(pledge_id: str):
    pledge = await db.pledges.find_one({"_id": ObjectId(pledge_id)})
    if not pledge:
        raise HTTPException(status_code=404, detail="Pledge not found")
    return PledgeResponse(
        id=str(pledge["_id"]),
        user_id=pledge["user_id"],
        user_name=pledge["user_name"],
        title=pledge["title"],
        description=pledge["description"],
        category=pledge["category"],
        tags=pledge["tags"],
        location=pledge.get("location", ""),
        status=pledge["status"],
        image=pledge.get("image"),
        created_at=pledge["created_at"]
    )

@api_router.put("/pledges/{pledge_id}", response_model=PledgeResponse)
async def update_pledge(pledge_id: str, pledge_data: PledgeCreate, current_user = Depends(get_current_user)):
    # Check if pledge exists and belongs to user
    pledge = await db.pledges.find_one({"_id": ObjectId(pledge_id)})
    if not pledge:
        raise HTTPException(status_code=404, detail="Pledge not found")
    if pledge["user_id"] != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Not authorized to edit this pledge")
    
    # Update the pledge
    update_data = {
        "title": pledge_data.title,
        "description": pledge_data.description,
        "category": pledge_data.category,
        "tags": pledge_data.tags,
        "location": pledge_data.location or "",
        "image": pledge_data.image
    }
    await db.pledges.update_one({"_id": ObjectId(pledge_id)}, {"$set": update_data})
    
    # Return updated pledge
    updated = await db.pledges.find_one({"_id": ObjectId(pledge_id)})
    return PledgeResponse(
        id=str(updated["_id"]),
        user_id=updated["user_id"],
        user_name=updated["user_name"],
        title=updated["title"],
        description=updated["description"],
        category=updated["category"],
        tags=updated["tags"],
        location=updated.get("location", ""),
        status=updated["status"],
        image=updated.get("image"),
        created_at=updated["created_at"]
    )

@api_router.delete("/pledges/{pledge_id}")
async def delete_pledge(pledge_id: str, current_user = Depends(get_current_user)):
    pledge = await db.pledges.find_one({"_id": ObjectId(pledge_id)})
    if not pledge:
        raise HTTPException(status_code=404, detail="Pledge not found")
    if pledge["user_id"] != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Not authorized to delete this pledge")
    await db.pledges.delete_one({"_id": ObjectId(pledge_id)})
    return {"success": True, "message": "Pledge deleted"}

# Wish endpoints
@api_router.post("/wishes", response_model=WishResponse)
async def create_wish(wish: WishCreate, current_user = Depends(get_current_user)):
    wish_dict = {
        "user_id": str(current_user["_id"]),
        "user_name": current_user["name"],
        "title": wish.title,
        "description": wish.description,
        "category": wish.category,
        "tags": wish.tags,
        "location": wish.location or "",
        "status": "active",
        "fulfilled_by": None,
        "created_at": datetime.utcnow()
    }
    result = await db.wishes.insert_one(wish_dict)
    wish_dict["_id"] = result.inserted_id
    
    return WishResponse(
        id=str(wish_dict["_id"]),
        user_id=wish_dict["user_id"],
        user_name=wish_dict["user_name"],
        title=wish_dict["title"],
        description=wish_dict["description"],
        category=wish_dict["category"],
        tags=wish_dict["tags"],
        location=wish_dict["location"],
        status=wish_dict["status"],
        fulfilled_by=wish_dict["fulfilled_by"],
        created_at=wish_dict["created_at"]
    )

@api_router.get("/wishes", response_model=List[WishResponse])
async def get_wishes(category: Optional[str] = None, search: Optional[str] = None, location: Optional[str] = None):
    query = {"status": "active"}
    if category:
        query["category"] = category
    if location:
        query["location"] = {"$regex": location, "$options": "i"}
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"tags": {"$regex": search, "$options": "i"}}
        ]
    
    wishes = await db.wishes.find(query).sort("created_at", -1).to_list(100)
    return [WishResponse(
        id=str(w["_id"]),
        user_id=w["user_id"],
        user_name=w["user_name"],
        title=w["title"],
        description=w["description"],
        category=w["category"],
        tags=w["tags"],
        location=w.get("location", ""),
        status=w["status"],
        fulfilled_by=w.get("fulfilled_by"),
        created_at=w["created_at"]
    ) for w in wishes]

@api_router.get("/wishes/mine", response_model=List[WishResponse])
async def get_my_wishes(current_user = Depends(get_current_user)):
    wishes = await db.wishes.find({"user_id": str(current_user["_id"])}).sort("created_at", -1).to_list(100)
    return [WishResponse(
        id=str(w["_id"]),
        user_id=w["user_id"],
        user_name=w["user_name"],
        title=w["title"],
        description=w["description"],
        category=w["category"],
        tags=w["tags"],
        location=w.get("location", ""),
        status=w["status"],
        fulfilled_by=w.get("fulfilled_by"),
        created_at=w["created_at"]
    ) for w in wishes]

@api_router.get("/wishes/{wish_id}", response_model=WishResponse)
async def get_wish(wish_id: str):
    wish = await db.wishes.find_one({"_id": ObjectId(wish_id)})
    if not wish:
        raise HTTPException(status_code=404, detail="Wish not found")
    return WishResponse(
        id=str(wish["_id"]),
        user_id=wish["user_id"],
        user_name=wish["user_name"],
        title=wish["title"],
        description=wish["description"],
        category=wish["category"],
        tags=wish["tags"],
        location=wish.get("location", ""),
        status=wish["status"],
        fulfilled_by=wish.get("fulfilled_by"),
        created_at=wish["created_at"]
    )

@api_router.put("/wishes/{wish_id}", response_model=WishResponse)
async def update_wish(wish_id: str, wish_data: WishCreate, current_user = Depends(get_current_user)):
    # Check if wish exists and belongs to user
    wish = await db.wishes.find_one({"_id": ObjectId(wish_id)})
    if not wish:
        raise HTTPException(status_code=404, detail="Wish not found")
    if wish["user_id"] != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Not authorized to edit this wish")
    
    # Update the wish
    update_data = {
        "title": wish_data.title,
        "description": wish_data.description,
        "category": wish_data.category,
        "tags": wish_data.tags,
        "location": wish_data.location or ""
    }
    await db.wishes.update_one({"_id": ObjectId(wish_id)}, {"$set": update_data})
    
    # Return updated wish
    updated = await db.wishes.find_one({"_id": ObjectId(wish_id)})
    return WishResponse(
        id=str(updated["_id"]),
        user_id=updated["user_id"],
        user_name=updated["user_name"],
        title=updated["title"],
        description=updated["description"],
        category=updated["category"],
        tags=updated["tags"],
        location=updated.get("location", ""),
        status=updated["status"],
        fulfilled_by=updated.get("fulfilled_by"),
        created_at=updated["created_at"]
    )

@api_router.delete("/wishes/{wish_id}")
async def delete_wish(wish_id: str, current_user = Depends(get_current_user)):
    wish = await db.wishes.find_one({"_id": ObjectId(wish_id)})
    if not wish:
        raise HTTPException(status_code=404, detail="Wish not found")
    if wish["user_id"] != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Not authorized to delete this wish")
    await db.wishes.delete_one({"_id": ObjectId(wish_id)})
    return {"success": True, "message": "Wish deleted"}

# Connection endpoints
@api_router.post("/connections", response_model=ConnectionResponse)
async def create_connection(conn: ConnectionCreate, current_user = Depends(get_current_user)):
    connection_dict = {
        "pledge_id": conn.pledge_id,
        "wish_id": conn.wish_id,
        "pledger_id": str(current_user["_id"]) if conn.pledge_id else conn.receiver_id,
        "wisher_id": conn.receiver_id if conn.pledge_id else str(current_user["_id"]),
        "status": "active",
        "created_at": datetime.utcnow()
    }
    result = await db.connections.insert_one(connection_dict)
    
    # Send initial message
    message_dict = {
        "connection_id": str(result.inserted_id),
        "sender_id": str(current_user["_id"]),
        "sender_name": current_user["name"],
        "receiver_id": conn.receiver_id,
        "content": conn.message,
        "read": False,
        "created_at": datetime.utcnow()
    }
    await db.messages.insert_one(message_dict)
    
    return ConnectionResponse(
        id=str(result.inserted_id),
        pledge_id=connection_dict["pledge_id"],
        wish_id=connection_dict["wish_id"],
        pledger_id=connection_dict["pledger_id"],
        wisher_id=connection_dict["wisher_id"],
        status=connection_dict["status"],
        created_at=connection_dict["created_at"]
    )

@api_router.get("/connections", response_model=List[ConnectionResponse])
async def get_connections(current_user = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    connections = await db.connections.find({
        "$or": [{"pledger_id": user_id}, {"wisher_id": user_id}]
    }).sort("created_at", -1).to_list(100)
    
    return [ConnectionResponse(
        id=str(c["_id"]),
        pledge_id=c.get("pledge_id"),
        wish_id=c.get("wish_id"),
        pledger_id=c["pledger_id"],
        wisher_id=c["wisher_id"],
        status=c["status"],
        created_at=c["created_at"]
    ) for c in connections]

# Message endpoints
@api_router.post("/messages", response_model=MessageResponse)
async def send_message(msg: MessageCreate, current_user = Depends(get_current_user)):
    # Get connection to find receiver
    connection = await db.connections.find_one({"_id": ObjectId(msg.connection_id)})
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")
    
    receiver_id = connection["wisher_id"] if connection["pledger_id"] == str(current_user["_id"]) else connection["pledger_id"]
    
    message_dict = {
        "connection_id": msg.connection_id,
        "sender_id": str(current_user["_id"]),
        "sender_name": current_user["name"],
        "receiver_id": receiver_id,
        "content": msg.content,
        "read": False,
        "created_at": datetime.utcnow()
    }
    result = await db.messages.insert_one(message_dict)
    
    return MessageResponse(
        id=str(result.inserted_id),
        connection_id=message_dict["connection_id"],
        sender_id=message_dict["sender_id"],
        sender_name=message_dict["sender_name"],
        receiver_id=message_dict["receiver_id"],
        content=message_dict["content"],
        read=message_dict["read"],
        created_at=message_dict["created_at"]
    )

@api_router.get("/messages/{connection_id}", response_model=List[MessageResponse])
async def get_messages(connection_id: str, current_user = Depends(get_current_user)):
    messages = await db.messages.find({"connection_id": connection_id}).sort("created_at", 1).to_list(1000)
    
    # Mark messages as read
    await db.messages.update_many(
        {"connection_id": connection_id, "receiver_id": str(current_user["_id"])},
        {"$set": {"read": True}}
    )
    
    return [MessageResponse(
        id=str(m["_id"]),
        connection_id=m["connection_id"],
        sender_id=m["sender_id"],
        sender_name=m["sender_name"],
        receiver_id=m["receiver_id"],
        content=m["content"],
        read=m["read"],
        created_at=m["created_at"]
    ) for m in messages]

# Gratitude endpoints
@api_router.post("/gratitude", response_model=GratitudeResponse)
async def create_gratitude(gratitude: GratitudeCreate, current_user = Depends(get_current_user)):
    to_user = await db.users.find_one({"_id": ObjectId(gratitude.to_user_id)})
    if not to_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    gratitude_dict = {
        "from_user_id": str(current_user["_id"]),
        "from_user_name": current_user["name"],
        "to_user_id": gratitude.to_user_id,
        "to_user_name": to_user["name"],
        "connection_id": gratitude.connection_id,
        "message": gratitude.message,
        "created_at": datetime.utcnow()
    }
    result = await db.gratitude.insert_one(gratitude_dict)
    
    return GratitudeResponse(
        id=str(result.inserted_id),
        from_user_id=gratitude_dict["from_user_id"],
        from_user_name=gratitude_dict["from_user_name"],
        to_user_id=gratitude_dict["to_user_id"],
        to_user_name=gratitude_dict["to_user_name"],
        connection_id=gratitude_dict["connection_id"],
        message=gratitude_dict["message"],
        created_at=gratitude_dict["created_at"]
    )

@api_router.get("/gratitude/wall", response_model=List[GratitudeResponse])
async def get_gratitude_wall():
    gratitudes = await db.gratitude.find().sort("created_at", -1).to_list(100)
    return [GratitudeResponse(
        id=str(g["_id"]),
        from_user_id=g["from_user_id"],
        from_user_name=g["from_user_name"],
        to_user_id=g["to_user_id"],
        to_user_name=g["to_user_name"],
        connection_id=g.get("connection_id"),
        message=g["message"],
        created_at=g["created_at"]
    ) for g in gratitudes]

@api_router.get("/gratitude/mine", response_model=List[GratitudeResponse])
async def get_my_gratitude(current_user = Depends(get_current_user)):
    gratitudes = await db.gratitude.find({"to_user_id": str(current_user["_id"])}).sort("created_at", -1).to_list(100)
    return [GratitudeResponse(
        id=str(g["_id"]),
        from_user_id=g["from_user_id"],
        from_user_name=g["from_user_name"],
        to_user_id=g["to_user_id"],
        to_user_name=g["to_user_name"],
        connection_id=g.get("connection_id"),
        message=g["message"],
        created_at=g["created_at"]
    ) for g in gratitudes]

# Report endpoints
@api_router.post("/reports", response_model=ReportResponse)
async def create_report(report: ReportCreate, current_user = Depends(get_current_user)):
    report_dict = {
        "reporter_id": str(current_user["_id"]),
        "reporter_name": current_user["name"],
        "report_type": report.report_type,
        "item_id": report.item_id,
        "item_title": report.item_title,
        "reason": report.reason,
        "description": report.description,
        "status": "pending",
        "created_at": datetime.utcnow()
    }
    result = await db.reports.insert_one(report_dict)
    
    # Log the report for admin notification
    logger.warning(f"NEW REPORT: {report.reason} - {report.report_type} - Reporter: {current_user['name']} ({current_user['email']})")
    
    return ReportResponse(
        id=str(result.inserted_id),
        reporter_id=report_dict["reporter_id"],
        reporter_name=report_dict["reporter_name"],
        report_type=report_dict["report_type"],
        item_id=report_dict["item_id"],
        item_title=report_dict["item_title"],
        reason=report_dict["reason"],
        description=report_dict["description"],
        status=report_dict["status"],
        created_at=report_dict["created_at"]
    )

@api_router.get("/reports/all", response_model=List[ReportResponse])
async def get_all_reports(current_user = Depends(get_current_user)):
    # Only admins can view all reports
    if not is_user_admin(current_user["email"]):
        raise HTTPException(status_code=403, detail="Admin access required")
    reports = await db.reports.find().sort("created_at", -1).to_list(200)
    return [ReportResponse(
        id=str(r["_id"]),
        reporter_id=r["reporter_id"],
        reporter_name=r["reporter_name"],
        report_type=r["report_type"],
        item_id=r.get("item_id"),
        item_title=r.get("item_title"),
        reason=r["reason"],
        description=r["description"],
        status=r["status"],
        created_at=r["created_at"]
    ) for r in reports]

@api_router.patch("/reports/{report_id}/status")
async def update_report_status(report_id: str, status: str, current_user = Depends(get_current_user)):
    # Only admins can update report status
    if not is_user_admin(current_user["email"]):
        raise HTTPException(status_code=403, detail="Admin access required")
    await db.reports.update_one(
        {"_id": ObjectId(report_id)},
        {"$set": {"status": status}}
    )
    return {"success": True, "message": f"Report marked as {status}"}

# Categories endpoint
@api_router.get("/categories", response_model=List[CategoryResponse])
async def get_categories():
    categories = [
        {"id": "1", "name": "Food & Meals", "icon": "restaurant"},
        {"id": "2", "name": "Housing & Shelter", "icon": "home"},
        {"id": "3", "name": "Skills & Knowledge", "icon": "school"},
        {"id": "4", "name": "Services", "icon": "build"},
        {"id": "5", "name": "Items & Goods", "icon": "inventory"},
        {"id": "6", "name": "Transportation", "icon": "directions-car"},
        {"id": "7", "name": "Health & Wellness", "icon": "favorite"},
        {"id": "8", "name": "Childcare", "icon": "child-care"},
        {"id": "9", "name": "Other", "icon": "more-horiz"}
    ]
    return [CategoryResponse(**cat) for cat in categories]

# User profile endpoint
@api_router.get("/users/{user_id}", response_model=UserResponse)
async def get_user_profile(user_id: str):
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserResponse(
        id=str(user["_id"]),
        email=user["email"],
        name=user["name"],
        bio=user["bio"],
        location=user["location"],
        avatar=user.get("avatar"),
        created_at=user["created_at"]
    )

# ==========================================
# HIVE ENDPOINTS - The Honeycomb Network
# ==========================================

async def get_hive_stats(hive_id: str):
    """Get member, pledge, wish, and child hive counts for a hive"""
    member_count = await db.hive_members.count_documents({"hive_id": hive_id})
    pledge_count = await db.pledges.count_documents({"hive_id": hive_id, "status": "active"})
    wish_count = await db.wishes.count_documents({"hive_id": hive_id, "status": "active"})
    child_count = await db.hives.count_documents({"parent_hive_id": hive_id})
    return member_count, pledge_count, wish_count, child_count

async def get_parent_hive_info(parent_id: Optional[str]):
    """Get parent hive name"""
    if not parent_id:
        return None, None
    parent = await db.hives.find_one({"_id": ObjectId(parent_id)})
    if parent:
        return parent_id, parent["name"]
    return None, None

async def build_hive_response(h: dict) -> HiveResponse:
    """Build a HiveResponse from a hive document"""
    hive_id = str(h["_id"])
    member_count, pledge_count, wish_count, child_count = await get_hive_stats(hive_id)
    parent_id, parent_name = await get_parent_hive_info(h.get("parent_hive_id"))
    
    return HiveResponse(
        id=hive_id,
        name=h["name"],
        description=h["description"],
        location=h["location"],
        vision=h.get("vision", ""),
        image=h.get("image"),
        hive_type=h["hive_type"],
        founder_id=h["founder_id"],
        founder_name=h["founder_name"],
        member_count=member_count,
        pledge_count=pledge_count,
        wish_count=wish_count,
        external_url=h.get("external_url"),
        api_endpoint=h.get("api_endpoint"),
        is_verified=h.get("is_verified", False),
        parent_hive_id=parent_id,
        parent_hive_name=parent_name,
        child_hive_count=child_count,
        created_at=h["created_at"]
    )

async def find_similar_hives(name: str, location: str):
    """Find hives with similar name or in same location"""
    # Extract key location words (city, region, country)
    location_words = [w.strip().lower() for w in location.split(',') if len(w.strip()) > 2]
    
    similar = []
    
    # Check for similar names
    name_matches = await db.hives.find({
        "name": {"$regex": name.split()[0] if name.split() else name, "$options": "i"}
    }).to_list(10)
    similar.extend(name_matches)
    
    # Check for same location
    for word in location_words:
        location_matches = await db.hives.find({
            "location": {"$regex": word, "$options": "i"},
            "_id": {"$nin": [h["_id"] for h in similar]}  # Avoid duplicates
        }).to_list(10)
        similar.extend(location_matches)
    
    return similar[:5]  # Return top 5 similar hives

@api_router.post("/hives/check-similar")
async def check_similar_hives(hive: HiveCreate, current_user = Depends(get_current_user)):
    """Check if similar hives exist before creating - returns suggestions"""
    similar = await find_similar_hives(hive.name, hive.location)
    
    if not similar:
        return {"has_similar": False, "similar_hives": [], "can_create": True}
    
    # Build response with similar hives info
    similar_list = []
    for h in similar:
        member_count, _, _ = await get_hive_stats(str(h["_id"]))
        similar_list.append({
            "id": str(h["_id"]),
            "name": h["name"],
            "location": h["location"],
            "member_count": member_count,
            "is_verified": h.get("is_verified", False)
        })
    
    return {
        "has_similar": True,
        "similar_hives": similar_list,
        "can_create": True,  # They can still create if they confirm
        "message": "Similar hives exist in this area. Consider joining one instead of creating a new one."
    }

@api_router.post("/hives", response_model=HiveResponse)
async def create_hive(hive: HiveCreate, force: bool = False, current_user = Depends(get_current_user)):
    """Create a new local hive (chapter)"""
    # Check if hive name already exists (exact match)
    existing = await db.hives.find_one({"name": {"$regex": f"^{hive.name}$", "$options": "i"}})
    if existing:
        raise HTTPException(status_code=400, detail="A hive with this name already exists")
    
    # Validate parent hive if specified
    parent_name = None
    if hive.parent_hive_id:
        parent = await db.hives.find_one({"_id": ObjectId(hive.parent_hive_id)})
        if not parent:
            raise HTTPException(status_code=404, detail="Parent hive not found")
        parent_name = parent["name"]
    
    # If not forcing, check for similar hives and warn
    if not force:
        similar = await find_similar_hives(hive.name, hive.location)
        if similar:
            similar_names = [h["name"] for h in similar[:3]]
            raise HTTPException(
                status_code=409,  # Conflict
                detail={
                    "message": "Similar hives exist in this area",
                    "similar": similar_names,
                    "action": "Use force=true to create anyway, or join an existing hive"
                }
            )
    
    hive_dict = {
        "name": hive.name,
        "description": hive.description,
        "location": hive.location,
        "vision": hive.vision or "",
        "image": hive.image,
        "hive_type": "local",  # Local chapter within WayPledge
        "founder_id": str(current_user["_id"]),
        "founder_name": current_user["name"],
        "external_url": None,
        "api_endpoint": None,
        "is_verified": False,  # Admins can verify hives
        "parent_hive_id": hive.parent_hive_id,  # Link to parent country/region
        "created_at": datetime.utcnow()
    }
    result = await db.hives.insert_one(hive_dict)
    hive_id = str(result.inserted_id)
    
    # Auto-add founder as member with "founder" role
    member_dict = {
        "user_id": str(current_user["_id"]),
        "user_name": current_user["name"],
        "hive_id": hive_id,
        "role": "founder",
        "joined_at": datetime.utcnow()
    }
    await db.hive_members.insert_one(member_dict)
    
    logger.info(f"NEW HIVE CREATED: {hive.name} in {hive.location} by {current_user['name']} (parent: {parent_name})")
    
    return HiveResponse(
        id=hive_id,
        name=hive_dict["name"],
        description=hive_dict["description"],
        location=hive_dict["location"],
        vision=hive_dict["vision"],
        image=hive_dict["image"],
        hive_type=hive_dict["hive_type"],
        founder_id=hive_dict["founder_id"],
        founder_name=hive_dict["founder_name"],
        member_count=1,
        pledge_count=0,
        wish_count=0,
        external_url=hive_dict["external_url"],
        api_endpoint=hive_dict["api_endpoint"],
        is_verified=hive_dict["is_verified"],
        parent_hive_id=hive.parent_hive_id,
        parent_hive_name=parent_name,
        child_hive_count=0,
        created_at=hive_dict["created_at"]
    )

@api_router.post("/hives/{hive_id}/verify")
async def verify_hive(hive_id: str, current_user = Depends(get_current_user)):
    """Admin: Verify a hive as legitimate"""
    if not is_user_admin(current_user["email"]):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    hive = await db.hives.find_one({"_id": ObjectId(hive_id)})
    if not hive:
        raise HTTPException(status_code=404, detail="Hive not found")
    
    await db.hives.update_one(
        {"_id": ObjectId(hive_id)},
        {"$set": {"is_verified": True}}
    )
    
    logger.info(f"HIVE VERIFIED: {hive['name']} by admin {current_user['email']}")
    return {"success": True, "message": f"Hive '{hive['name']}' is now verified"}

@api_router.post("/hives/{hive_id}/unverify")
async def unverify_hive(hive_id: str, current_user = Depends(get_current_user)):
    """Admin: Remove verification from a hive"""
    if not is_user_admin(current_user["email"]):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    await db.hives.update_one(
        {"_id": ObjectId(hive_id)},
        {"$set": {"is_verified": False}}
    )
    return {"success": True, "message": "Hive verification removed"}

@api_router.get("/hives", response_model=List[HiveResponse])
async def get_hives(location: Optional[str] = None, search: Optional[str] = None, verified_only: bool = False, parent_id: Optional[str] = None, country_only: bool = False):
    """Get all hives, optionally filtered. Verified hives shown first."""
    query = {}
    if location:
        query["location"] = {"$regex": location, "$options": "i"}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    if verified_only:
        query["is_verified"] = True
    if parent_id:
        query["parent_hive_id"] = parent_id
    if country_only:
        query["is_country_hive"] = True
    
    # Sort: verified first, then by creation date
    hives = await db.hives.find(query).sort([("is_verified", -1), ("created_at", -1)]).to_list(100)
    
    result = []
    for h in hives:
        hive_response = await build_hive_response(h)
        result.append(hive_response)
    return result

@api_router.get("/hives/{hive_id}/children", response_model=List[HiveResponse])
async def get_child_hives(hive_id: str):
    """Get all child/sub hives of a parent hive"""
    # Verify parent exists
    parent = await db.hives.find_one({"_id": ObjectId(hive_id)})
    if not parent:
        raise HTTPException(status_code=404, detail="Parent hive not found")
    
    children = await db.hives.find({"parent_hive_id": hive_id}).sort([("is_verified", -1), ("name", 1)]).to_list(100)
    
    result = []
    for h in children:
        hive_response = await build_hive_response(h)
        result.append(hive_response)
    return result

@api_router.get("/hives/{hive_id}", response_model=HiveResponse)
async def get_hive(hive_id: str):
    """Get a single hive by ID"""
    hive = await db.hives.find_one({"_id": ObjectId(hive_id)})
    if not hive:
        raise HTTPException(status_code=404, detail="Hive not found")
    
    member_count, pledge_count, wish_count = await get_hive_stats(hive_id)
    
    return HiveResponse(
        id=str(hive["_id"]),
        name=hive["name"],
        description=hive["description"],
        location=hive["location"],
        vision=hive.get("vision", ""),
        image=hive.get("image"),
        hive_type=hive["hive_type"],
        founder_id=hive["founder_id"],
        founder_name=hive["founder_name"],
        member_count=member_count,
        pledge_count=pledge_count,
        wish_count=wish_count,
        external_url=hive.get("external_url"),
        api_endpoint=hive.get("api_endpoint"),
        is_verified=hive.get("is_verified", False),
        created_at=hive["created_at"]
    )

@api_router.post("/hives/{hive_id}/join")
async def join_hive(hive_id: str, current_user = Depends(get_current_user)):
    """Join a hive as a member"""
    # Check if hive exists
    hive = await db.hives.find_one({"_id": ObjectId(hive_id)})
    if not hive:
        raise HTTPException(status_code=404, detail="Hive not found")
    
    # Check if already a member
    existing = await db.hive_members.find_one({
        "user_id": str(current_user["_id"]),
        "hive_id": hive_id
    })
    if existing:
        raise HTTPException(status_code=400, detail="You are already a member of this hive")
    
    member_dict = {
        "user_id": str(current_user["_id"]),
        "user_name": current_user["name"],
        "hive_id": hive_id,
        "role": "member",
        "joined_at": datetime.utcnow()
    }
    await db.hive_members.insert_one(member_dict)
    
    return {"success": True, "message": f"Welcome to {hive['name']}!"}

@api_router.post("/hives/{hive_id}/leave")
async def leave_hive(hive_id: str, current_user = Depends(get_current_user)):
    """Leave a hive"""
    # Check membership
    member = await db.hive_members.find_one({
        "user_id": str(current_user["_id"]),
        "hive_id": hive_id
    })
    if not member:
        raise HTTPException(status_code=400, detail="You are not a member of this hive")
    
    if member["role"] == "founder":
        raise HTTPException(status_code=400, detail="Founders cannot leave their hive. Transfer ownership first.")
    
    await db.hive_members.delete_one({"_id": member["_id"]})
    return {"success": True, "message": "You have left the hive"}

@api_router.get("/hives/{hive_id}/members", response_model=List[HiveMemberResponse])
async def get_hive_members(hive_id: str):
    """Get all members of a hive"""
    members = await db.hive_members.find({"hive_id": hive_id}).sort("joined_at", 1).to_list(500)
    return [HiveMemberResponse(
        id=str(m["_id"]),
        user_id=m["user_id"],
        user_name=m["user_name"],
        hive_id=m["hive_id"],
        role=m["role"],
        joined_at=m["joined_at"]
    ) for m in members]

@api_router.get("/hives/my/memberships", response_model=List[HiveResponse])
async def get_my_hives(current_user = Depends(get_current_user)):
    """Get all hives the current user is a member of"""
    memberships = await db.hive_members.find({"user_id": str(current_user["_id"])}).to_list(50)
    hive_ids = [ObjectId(m["hive_id"]) for m in memberships]
    
    if not hive_ids:
        return []
    
    hives = await db.hives.find({"_id": {"$in": hive_ids}}).to_list(50)
    
    result = []
    for h in hives:
        member_count, pledge_count, wish_count = await get_hive_stats(str(h["_id"]))
        result.append(HiveResponse(
            id=str(h["_id"]),
            name=h["name"],
            description=h["description"],
            location=h["location"],
            vision=h.get("vision", ""),
            image=h.get("image"),
            hive_type=h["hive_type"],
            founder_id=h["founder_id"],
            founder_name=h["founder_name"],
            member_count=member_count,
            pledge_count=pledge_count,
            wish_count=wish_count,
            external_url=h.get("external_url"),
            api_endpoint=h.get("api_endpoint"),
            is_verified=h.get("is_verified", False),
            created_at=h["created_at"]
        ))
    return result

# ==========================================
# FEDERATION ENDPOINTS - Connect The Network
# ==========================================

import secrets

@api_router.post("/federation/request", response_model=FederationResponse)
async def request_federation(request: FederationRequest):
    """
    External platforms request to join the WayPledge network.
    They must agree to the Do No Harm Pledge.
    """
    if not request.pledge_agreement:
        raise HTTPException(
            status_code=400, 
            detail="You must agree to the Do No Harm Pledge to join the network"
        )
    
    # Check if platform already registered
    existing = await db.federation.find_one({
        "$or": [
            {"platform_url": request.platform_url},
            {"api_endpoint": request.api_endpoint}
        ]
    })
    if existing:
        raise HTTPException(status_code=400, detail="This platform is already registered or pending")
    
    federation_dict = {
        "platform_name": request.platform_name,
        "platform_url": request.platform_url,
        "api_endpoint": request.api_endpoint,
        "contact_email": request.contact_email,
        "description": request.description,
        "location": request.location,
        "status": "pending",
        "api_key": None,
        "created_at": datetime.utcnow(),
        "approved_at": None
    }
    result = await db.federation.insert_one(federation_dict)
    
    logger.info(f"NEW FEDERATION REQUEST: {request.platform_name} from {request.platform_url}")
    
    return FederationResponse(
        id=str(result.inserted_id),
        platform_name=federation_dict["platform_name"],
        platform_url=federation_dict["platform_url"],
        api_endpoint=federation_dict["api_endpoint"],
        contact_email=federation_dict["contact_email"],
        description=federation_dict["description"],
        location=federation_dict["location"],
        status=federation_dict["status"],
        api_key=None,
        created_at=federation_dict["created_at"],
        approved_at=None
    )

@api_router.get("/federation/requests", response_model=List[FederationResponse])
async def get_federation_requests(current_user = Depends(get_current_user)):
    """Admin: View all federation requests"""
    if not is_user_admin(current_user["email"]):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    requests = await db.federation.find().sort("created_at", -1).to_list(100)
    return [FederationResponse(
        id=str(r["_id"]),
        platform_name=r["platform_name"],
        platform_url=r["platform_url"],
        api_endpoint=r["api_endpoint"],
        contact_email=r["contact_email"],
        description=r["description"],
        location=r["location"],
        status=r["status"],
        api_key=r.get("api_key"),
        created_at=r["created_at"],
        approved_at=r.get("approved_at")
    ) for r in requests]

@api_router.post("/federation/{request_id}/approve")
async def approve_federation(request_id: str, current_user = Depends(get_current_user)):
    """Admin: Approve a federation request and generate API key"""
    if not is_user_admin(current_user["email"]):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    fed_request = await db.federation.find_one({"_id": ObjectId(request_id)})
    if not fed_request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    if fed_request["status"] == "approved":
        raise HTTPException(status_code=400, detail="Already approved")
    
    # Generate secure API key for the federated platform
    api_key = f"wpf_{secrets.token_urlsafe(32)}"
    
    # Update federation request
    await db.federation.update_one(
        {"_id": ObjectId(request_id)},
        {"$set": {
            "status": "approved",
            "api_key": api_key,
            "approved_at": datetime.utcnow()
        }}
    )
    
    # Create a federated hive entry for this platform
    hive_dict = {
        "name": fed_request["platform_name"],
        "description": fed_request["description"],
        "location": fed_request["location"],
        "vision": "Federated partner in the gift economy network",
        "image": None,
        "hive_type": "federated",
        "founder_id": "federation",
        "founder_name": fed_request["platform_name"],
        "external_url": fed_request["platform_url"],
        "api_endpoint": fed_request["api_endpoint"],
        "is_verified": True,
        "federation_id": str(fed_request["_id"]),
        "created_at": datetime.utcnow()
    }
    await db.hives.insert_one(hive_dict)
    
    logger.info(f"FEDERATION APPROVED: {fed_request['platform_name']} - API Key generated")
    
    return {
        "success": True,
        "message": f"Federation approved for {fed_request['platform_name']}",
        "api_key": api_key,
        "note": "Share this API key securely with the platform. They will use it to sync data."
    }

@api_router.post("/federation/{request_id}/reject")
async def reject_federation(request_id: str, current_user = Depends(get_current_user)):
    """Admin: Reject a federation request"""
    if not is_user_admin(current_user["email"]):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    await db.federation.update_one(
        {"_id": ObjectId(request_id)},
        {"$set": {"status": "rejected"}}
    )
    return {"success": True, "message": "Federation request rejected"}

@api_router.get("/federation/partners", response_model=List[HiveResponse])
async def get_federated_partners():
    """Public: Get all approved federated platforms"""
    hives = await db.hives.find({"hive_type": "federated"}).to_list(100)
    
    result = []
    for h in hives:
        member_count, pledge_count, wish_count = await get_hive_stats(str(h["_id"]))
        result.append(HiveResponse(
            id=str(h["_id"]),
            name=h["name"],
            description=h["description"],
            location=h["location"],
            vision=h.get("vision", ""),
            image=h.get("image"),
            hive_type=h["hive_type"],
            founder_id=h["founder_id"],
            founder_name=h["founder_name"],
            member_count=member_count,
            pledge_count=pledge_count,
            wish_count=wish_count,
            external_url=h.get("external_url"),
            api_endpoint=h.get("api_endpoint"),
            is_verified=h.get("is_verified", False),
            created_at=h["created_at"]
        ))
    return result

# ==========================================
# FEDERATION SYNC API - For External Platforms
# ==========================================

async def verify_federation_key(api_key: str):
    """Verify an API key belongs to an approved federated platform"""
    fed = await db.federation.find_one({"api_key": api_key, "status": "approved"})
    return fed

@api_router.post("/federation/sync/pledges")
async def sync_pledges_from_partner(
    pledges: List[dict],
    api_key: str = Header(..., alias="X-Federation-Key")
):
    """
    Federated platforms push their pledges to WayPledge.
    This creates a unified global search across all platforms.
    """
    partner = await verify_federation_key(api_key)
    if not partner:
        raise HTTPException(status_code=401, detail="Invalid or expired federation key")
    
    # Find the hive for this federated partner
    hive = await db.hives.find_one({"federation_id": str(partner["_id"])})
    if not hive:
        raise HTTPException(status_code=404, detail="Federated hive not found")
    
    hive_id = str(hive["_id"])
    synced = 0
    
    for pledge_data in pledges:
        # Check if this pledge already exists (by external_id)
        external_id = pledge_data.get("id") or pledge_data.get("external_id")
        if not external_id:
            continue
            
        existing = await db.pledges.find_one({
            "external_id": external_id,
            "source_platform": partner["platform_name"]
        })
        
        pledge_dict = {
            "user_id": "federated",
            "user_name": pledge_data.get("user_name", "Anonymous"),
            "title": pledge_data.get("title", "Untitled"),
            "description": pledge_data.get("description", ""),
            "category": pledge_data.get("category", "Other"),
            "tags": pledge_data.get("tags", []),
            "location": pledge_data.get("location", partner["location"]),
            "status": "active",
            "image": pledge_data.get("image"),
            "hive_id": hive_id,
            "external_id": external_id,
            "source_platform": partner["platform_name"],
            "source_url": f"{partner['platform_url']}/pledge/{external_id}",
            "synced_at": datetime.utcnow()
        }
        
        if existing:
            await db.pledges.update_one(
                {"_id": existing["_id"]},
                {"$set": pledge_dict}
            )
        else:
            pledge_dict["created_at"] = datetime.utcnow()
            await db.pledges.insert_one(pledge_dict)
        
        synced += 1
    
    return {"success": True, "synced": synced, "message": f"Synced {synced} pledges from {partner['platform_name']}"}

@api_router.post("/federation/sync/wishes")
async def sync_wishes_from_partner(
    wishes: List[dict],
    api_key: str = Header(..., alias="X-Federation-Key")
):
    """Federated platforms push their wishes to WayPledge."""
    partner = await verify_federation_key(api_key)
    if not partner:
        raise HTTPException(status_code=401, detail="Invalid or expired federation key")
    
    hive = await db.hives.find_one({"federation_id": str(partner["_id"])})
    if not hive:
        raise HTTPException(status_code=404, detail="Federated hive not found")
    
    hive_id = str(hive["_id"])
    synced = 0
    
    for wish_data in wishes:
        external_id = wish_data.get("id") or wish_data.get("external_id")
        if not external_id:
            continue
            
        existing = await db.wishes.find_one({
            "external_id": external_id,
            "source_platform": partner["platform_name"]
        })
        
        wish_dict = {
            "user_id": "federated",
            "user_name": wish_data.get("user_name", "Anonymous"),
            "title": wish_data.get("title", "Untitled"),
            "description": wish_data.get("description", ""),
            "category": wish_data.get("category", "Other"),
            "tags": wish_data.get("tags", []),
            "location": wish_data.get("location", partner["location"]),
            "status": "active",
            "fulfilled_by": None,
            "hive_id": hive_id,
            "external_id": external_id,
            "source_platform": partner["platform_name"],
            "source_url": f"{partner['platform_url']}/wish/{external_id}",
            "synced_at": datetime.utcnow()
        }
        
        if existing:
            await db.wishes.update_one(
                {"_id": existing["_id"]},
                {"$set": wish_dict}
            )
        else:
            wish_dict["created_at"] = datetime.utcnow()
            await db.wishes.insert_one(wish_dict)
        
        synced += 1
    
    return {"success": True, "synced": synced, "message": f"Synced {synced} wishes from {partner['platform_name']}"}

# Include the router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
