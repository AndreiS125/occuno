from uuid import UUID
from sqlalchemy.types import TypeDecorator, VARCHAR

class UUIDType(TypeDecorator):
    """Custom UUID type that stores UUIDs as strings in SQLite"""
    impl = VARCHAR
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        elif isinstance(value, UUID):
            return str(value)
        else:
            return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        else:
            from uuid import UUID as _UUID
            return _UUID(value)
