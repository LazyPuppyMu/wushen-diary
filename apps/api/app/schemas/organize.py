from datetime import date
from enum import StrEnum

from pydantic import BaseModel, Field


class Category(StrEnum):
    JOY = "joy"
    FULFILLMENT = "fulfillment"
    REFLECTION = "reflection"
    IMPROVEMENT = "improvement"
    GRATITUDE = "gratitude"
    WEIGHT = "weight"
    MURMUR = "murmur"


class ConclusionType(StrEnum):
    FACT = "fact"
    INFERENCE = "inference"


class Confidence(StrEnum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INSUFFICIENT = "insufficient"


class EntryInput(BaseModel):
    id: str = Field(min_length=1, max_length=100)
    date: date
    content: str = Field(min_length=1, max_length=10000)


class OrganizeRequest(BaseModel):
    entries: list[EntryInput] = Field(min_length=1, max_length=20)


class Evidence(BaseModel):
    entry_id: str
    quote: str
    start: int = Field(ge=0)
    end: int = Field(ge=1)


class Conclusion(BaseModel):
    category: Category
    type: ConclusionType
    text: str = Field(min_length=1, max_length=500)
    confidence: Confidence
    evidence: list[Evidence] = Field(min_length=1)


class OrganizeResponse(BaseModel):
    items: list[Conclusion]
