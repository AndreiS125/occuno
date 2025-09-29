"""
Simplified User Profile Repository using SQLModel

This repository replaces the complex SQLAlchemy repository with manual conversions
with a much simpler SQLModel-based approach that eliminates conversion boilerplate.
"""

from typing import Optional, List
from uuid import UUID
from datetime import datetime
from sqlmodel import Session, select
from sqlalchemy.orm import selectinload
from sqlalchemy.inspection import inspect as sqlalchemy_inspect

from core.models import UserProfile, UserAchievement, EarnedCoupon, UserCouponDefinition, UserAchievementDefinition
from core.sqlalchemy_database import sqlalchemy_db_manager
from core.logging_config import get_logger

logger = get_logger("user_profile_repository")

class UserProfileRepository:
    """Simplified repository for managing user profiles using SQLModel"""
    
    def __init__(self):
        self.logger = get_logger("user_profile_repo")
    
    def get_by_id(self, user_id: UUID) -> Optional[UserProfile]:
        """Get user profile by ID with all relationships loaded"""
        try:
            with sqlalchemy_db_manager.get_session() as session:
                statement = (
                    select(UserProfile)
                    .options(
                        selectinload(UserProfile.achievements),
                        selectinload(UserProfile.earned_coupons),
                        selectinload(UserProfile.coupon_definitions),
                        selectinload(UserProfile.achievement_definitions)
                    )
                    .where(UserProfile.id == user_id)
                )
                result = session.exec(statement).first()
                
                if result:
                    self.logger.debug(f"✅ Found user profile: {user_id}")
                else:
                    self.logger.debug(f"❌ User profile not found: {user_id}")
                
                return result
                
        except Exception as e:
            self.logger.error(f"❌ Error getting user profile {user_id}: {e}")
            raise
    
    
    def get_by_email(self, email: str) -> Optional[UserProfile]:
        """Get user profile by email"""
        try:
            with sqlalchemy_db_manager.get_session() as session:
                statement = select(UserProfile).where(UserProfile.email == email)
                result = session.exec(statement).first()
                
                if result:
                    self.logger.debug(f"✅ Found user profile by email: {email}")
                else:
                    self.logger.debug(f"❌ User profile not found by email: {email}")
                
                return result
                
        except Exception as e:
            self.logger.error(f"❌ Error getting user profile by email {email}: {e}")
            raise
    
    def get_by_google_id(self, google_id: str) -> Optional[UserProfile]:
        """Get user profile by Google ID"""
        try:
            with sqlalchemy_db_manager.get_session() as session:
                statement = select(UserProfile).where(UserProfile.google_id == google_id)
                result = session.exec(statement).first()
                
                if result:
                    self.logger.debug(f"✅ Found user profile by Google ID: {google_id}")
                else:
                    self.logger.debug(f"❌ User profile not found by Google ID: {google_id}")
                
                return result
                
        except Exception as e:
            self.logger.error(f"❌ Error getting user profile by Google ID {google_id}: {e}")
            raise
    
    def create(self, user_profile: UserProfile) -> UserProfile:
        """Create a new user profile"""
        try:
            with sqlalchemy_db_manager.get_transaction() as session:
                session.add(user_profile)
                session.flush()  # Flush to get the ID
                session.refresh(user_profile)  # Refresh to get relationships
                
                # Expunge from session to make it detached but accessible
                session.expunge(user_profile)
                
                self.logger.info(f"✅ Created user profile: {user_profile.id}")
                return user_profile
                
        except Exception as e:
            self.logger.error(f"❌ Error creating user profile: {e}")
            raise
    
    def update(self, user_profile: UserProfile) -> UserProfile:
        """Update an existing user profile"""
        try:
            with sqlalchemy_db_manager.get_transaction() as session:
                # Reload the persistent entity and copy only column attributes to avoid
                # cascading relationship merges that can NULL out FKs (e.g., earned_coupons.user_id)
                db_profile = session.exec(
                    select(UserProfile).where(UserProfile.id == user_profile.id)
                ).first()

                if not db_profile:
                    raise ValueError(f"UserProfile {user_profile.id} not found for update")

                # Get column attribute names (exclude relationships automatically)
                column_keys = [attr.key for attr in sqlalchemy_inspect(UserProfile).mapper.column_attrs]

                for key in column_keys:
                    if key == "id":
                        continue
                    setattr(db_profile, key, getattr(user_profile, key))

                session.flush()
                session.refresh(db_profile)
                session.expunge(db_profile)

                self.logger.info(f"✅ Updated user profile: {user_profile.id}")
                return db_profile
                
        except Exception as e:
            self.logger.error(f"❌ Error updating user profile {user_profile.id}: {e}")
            raise
    
    def delete(self, user_id: UUID) -> bool:
        """Delete a user profile"""
        try:
            with sqlalchemy_db_manager.get_transaction() as session:
                statement = select(UserProfile).where(UserProfile.id == user_id)
                user_profile = session.exec(statement).first()
                
                if user_profile:
                    session.delete(user_profile)
                    self.logger.info(f"✅ Deleted user profile: {user_id}")
                    return True
                else:
                    self.logger.warning(f"⚠️ User profile not found for deletion: {user_id}")
                    return False
                    
        except Exception as e:
            self.logger.error(f"❌ Error deleting user profile {user_id}: {e}")
            raise
    
    def get_all(self) -> List[UserProfile]:
        """Get all user profiles"""
        try:
            with sqlalchemy_db_manager.get_session() as session:
                statement = (
                    select(UserProfile)
                    .options(
                        selectinload(UserProfile.achievements),
                        selectinload(UserProfile.earned_coupons)
                    )
                )
                results = session.exec(statement).all()
                
                self.logger.debug(f"✅ Retrieved {len(results)} user profiles")
                return list(results)
                
        except Exception as e:
            self.logger.error(f"❌ Error getting all user profiles: {e}")
            raise
    
    def add_achievement(self, user_id: UUID, achievement_id: str) -> UserAchievement:
        """Add an achievement to a user"""
        try:
            with sqlalchemy_db_manager.get_transaction() as session:
                # Check if achievement already exists
                existing_statement = (
                    select(UserAchievement)
                    .where(UserAchievement.user_id == user_id)
                    .where(UserAchievement.achievement_id == achievement_id)
                )
                existing = session.exec(existing_statement).first()
                
                if existing:
                    self.logger.warning(f"⚠️ Achievement {achievement_id} already exists for user {user_id}")
                    return existing
                
                # Create new achievement
                achievement = UserAchievement(
                    user_id=user_id,
                    achievement_id=achievement_id
                )
                session.add(achievement)
                session.flush()
                session.refresh(achievement)
                session.expunge(achievement)
                
                self.logger.info(f"✅ Added achievement {achievement_id} to user {user_id}")
                return achievement
                
        except Exception as e:
            self.logger.error(f"❌ Error adding achievement {achievement_id} to user {user_id}: {e}")
            raise
    
    def add_coupon(self, user_id: UUID, coupon: EarnedCoupon) -> EarnedCoupon:
        """Add a coupon to a user"""
        try:
            with sqlalchemy_db_manager.get_transaction() as session:
                coupon.user_id = user_id
                session.add(coupon)
                session.flush()
                session.refresh(coupon)
                session.expunge(coupon)
                
                self.logger.info(f"✅ Added coupon {coupon.coupon_type} to user {user_id}")
                return coupon
                
        except Exception as e:
            self.logger.error(f"❌ Error adding coupon to user {user_id}: {e}")
            raise
    
    def get_unused_coupons(self, user_id: UUID) -> List[EarnedCoupon]:
        """Get all unused coupons for a user"""
        try:
            with sqlalchemy_db_manager.get_session() as session:
                statement = (
                    select(EarnedCoupon)
                    .where(EarnedCoupon.user_id == user_id)
                    .where(EarnedCoupon.is_used == False)
                    .order_by(EarnedCoupon.earned_at.desc())
                )
                results = session.exec(statement).all()
                
                self.logger.debug(f"✅ Retrieved {len(results)} unused coupons for user {user_id}")
                return list(results)
                
        except Exception as e:
            self.logger.error(f"❌ Error getting unused coupons for user {user_id}: {e}")
            raise
    
    def use_coupon(self, coupon_id: UUID) -> Optional[EarnedCoupon]:
        """Mark a coupon as used"""
        try:
            with sqlalchemy_db_manager.get_transaction() as session:
                statement = select(EarnedCoupon).where(EarnedCoupon.id == coupon_id)
                coupon = session.exec(statement).first()
                
                if coupon and not coupon.is_used:
                    coupon.is_used = True
                    coupon.used_at = datetime.utcnow()
                    session.add(coupon)
                    session.flush()
                    session.refresh(coupon)
                    
                    self.logger.info(f"✅ Marked coupon {coupon_id} as used")
                    return coupon
                else:
                    self.logger.warning(f"⚠️ Coupon {coupon_id} not found or already used")
                    return None
                    
        except Exception as e:
            self.logger.error(f"❌ Error using coupon {coupon_id}: {e}")
            raise

    def ensure_coupon_definitions(self, user_id: UUID) -> List[UserCouponDefinition]:
        """Ensure the user has coupon definitions; create defaults if missing."""
        try:
            with sqlalchemy_db_manager.get_transaction() as session:
                existing_stmt = select(UserCouponDefinition).where(UserCouponDefinition.user_id == user_id)
                existing = session.exec(existing_stmt).all()
                if existing and len(existing) > 0:
                    for item in existing:
                        session.expunge(item)
                    self.logger.debug(f"✅ Found {len(existing)} coupon definitions for user {user_id}")
                    return list(existing)

                # Create defaults
                defaults = self._create_default_coupon_definitions(user_id)
                for d in defaults:
                    session.add(d)
                session.flush()
                # Refresh and detach
                for d in defaults:
                    session.refresh(d)
                    session.expunge(d)
                self.logger.info(f"🧩 Created {len(defaults)} default coupon definitions for user {user_id}")
                return defaults
        except Exception as e:
            self.logger.error(f"❌ Error ensuring coupon definitions for user {user_id}: {e}")
            raise

    def ensure_achievement_definitions(self, user_id: UUID) -> List[UserAchievementDefinition]:
        """Ensure the user has achievement definitions; create defaults if missing."""
        try:
            with sqlalchemy_db_manager.get_transaction() as session:
                existing_stmt = select(UserAchievementDefinition).where(UserAchievementDefinition.user_id == user_id)
                existing = session.exec(existing_stmt).all()
                if existing and len(existing) > 0:
                    for item in existing:
                        session.expunge(item)
                    self.logger.debug(f"✅ Found {len(existing)} achievement definitions for user {user_id}")
                    return list(existing)

                # Create defaults
                defaults = self._create_default_achievement_definitions(user_id)
                for d in defaults:
                    session.add(d)
                session.flush()
                # Refresh and detach
                for d in defaults:
                    session.refresh(d)
                    session.expunge(d)
                self.logger.info(f"🏅 Created {len(defaults)} default achievement definitions for user {user_id}")
                return defaults
        except Exception as e:
            self.logger.error(f"❌ Error ensuring achievement definitions for user {user_id}: {e}")
            raise
    
    def _create_default_coupon_definitions(self, user_id: UUID) -> List[UserCouponDefinition]:
        """Create default coupon definitions for a new user"""
        default_definitions = [
            UserCouponDefinition(
                user_id=user_id,
                coupon_type="scroll_instagram",
                display_name="📱 Social Media",
                description="30 minutes of mindless scrolling",
                icon="📱",
                duration_minutes=30,
                rarity="common"
            ),
            UserCouponDefinition(
                user_id=user_id,
                coupon_type="play_games",
                display_name="🎮 Gaming Break",
                description="Time to play your favorite game",
                icon="🎮",
                duration_minutes=45,
                rarity="common"
            ),
            UserCouponDefinition(
                user_id=user_id,
                coupon_type="watch_youtube",
                display_name="📺 YouTube",
                description="Watch videos guilt-free",
                icon="📺",
                duration_minutes=30,
                rarity="common"
            ),
            UserCouponDefinition(
                user_id=user_id,
                coupon_type="take_nap",
                display_name="😴 Power Nap",
                description="Recharge with a quick nap",
                icon="😴",
                duration_minutes=20,
                rarity="rare"
            ),
            UserCouponDefinition(
                user_id=user_id,
                coupon_type="eat_snack",
                display_name="☕ Coffee Break",
                description="Guilt-free snack time",
                icon="☕",
                duration_minutes=15,
                rarity="common"
            ),
            UserCouponDefinition(
                user_id=user_id,
                coupon_type="watch_netflix",
                display_name="🍿 Netflix",
                description="Binge your favorite show",
                icon="🍿",
                duration_minutes=60,
                rarity="epic"
            ),
            UserCouponDefinition(
                user_id=user_id,
                coupon_type="browse_reddit",
                display_name="🔍 Reddit Dive",
                description="Explore the front page of the internet",
                icon="🔍",
                duration_minutes=25,
                rarity="common"
            ),
            UserCouponDefinition(
                user_id=user_id,
                coupon_type="listen_music",
                display_name="🎵 Music Time",
                description="Listen to your favorite playlist",
                icon="🎵",
                duration_minutes=30,
                rarity="common"
            ),
            UserCouponDefinition(
                user_id=user_id,
                coupon_type="chat_friends",
                display_name="💬 Social Chat",
                description="Catch up with friends",
                icon="💬",
                duration_minutes=20,
                rarity="rare"
            )
        ]
        return default_definitions
    
    def _create_default_achievement_definitions(self, user_id: UUID) -> List[UserAchievementDefinition]:
        """Create default achievement definitions for a new user"""
        default_achievements = [
            UserAchievementDefinition(
                user_id=user_id,
                achievement_id="daily_hero",
                name="🦸 Daily Hero",
                description="Complete 3 tasks in a single day",
                criteria_code="daily_tasks_completed >= 3",
                icon="🦸",
                points_value=100
            ),
            UserAchievementDefinition(
                user_id=user_id,
                achievement_id="streak_master",
                name="🔥 Streak Master",
                description="Maintain a 7-day completion streak",
                criteria_code="current_streak_days >= 7",
                icon="🔥",
                points_value=200
            ),
            UserAchievementDefinition(
                user_id=user_id,
                achievement_id="task_crusher",
                name="💪 Task Crusher",
                description="Complete 10 tasks in one day",
                criteria_code="daily_tasks_completed >= 10",
                icon="💪",
                points_value=300
            ),
            UserAchievementDefinition(
                user_id=user_id,
                achievement_id="early_bird",
                name="🌅 Early Bird",
                description="Complete first task before 9 AM",
                criteria_code="first_task_time < 09:00",
                icon="🌅",
                points_value=50
            ),
            UserAchievementDefinition(
                user_id=user_id,
                achievement_id="perfectionist",
                name="✨ Perfectionist",
                description="Complete all planned tasks for the day",
                criteria_code="completion_rate == 100",
                icon="✨",
                points_value=150
            )
        ]
        return default_achievements
    
    def ensure_default_profile(self) -> UserProfile:
        """Removed: default-user fallback is not allowed.
        Any call to this method is a bug. All operations must be scoped to an authenticated user.
        """
        # Hard fail to surface misuse immediately
        raise RuntimeError(
            "ensure_default_profile() has been removed. Use authenticated user context (user_id) everywhere."
        )
