from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
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
    created_at: datetime

class WishCreate(BaseModel):
    title: str
    description: str
    category: str
    tags: List[str] = []
    location: Optional[str] = ""

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
@api_router.post("/pledges", response_model=PledgeResponse)
async def create_pledge(pledge: PledgeCreate, current_user = Depends(get_current_user)):
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
        created_at=pledge_dict["created_at"]
    )

@api_router.get("/pledges", response_model=List[PledgeResponse])
async def get_pledges(category: Optional[str] = None, search: Optional[str] = None, location: Optional[str] = None):
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
    
    pledges = await db.pledges.find(query).sort("created_at", -1).to_list(100)
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
