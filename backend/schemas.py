from typing import Optional, Literal
from pydantic import BaseModel, Field


class CADFeature(BaseModel):
    type: Literal["hole", "slot", "fillet", "chamfer"]

    diameter: Optional[float] = None
    radius: Optional[float] = None
    count: Optional[int] = None

    position: Optional[list[float]] = None
    location: Optional[str] = None


class CADParameters(BaseModel):

    object_type: Literal[
    "box",
    "cylinder",
    "sphere",
    "cone",
    "hollow_cylinder",
    "plate_with_holes",
    "bracket",
    "phone_case",
    "unknown"
]

    length: Optional[float] = None
    width: Optional[float] = None
    height: Optional[float] = None

    radius: Optional[float] = None
    inner_radius: Optional[float] = None
    hole_diameter: Optional[float] = None
    thickness: Optional[float] = None
    angle: Optional[float] = None

    corner_radius: Optional[float] = None
    wall_thickness: Optional[float] = None
    camera_width: Optional[float] = None
    camera_height: Optional[float] = None
    camera_x: Optional[float] = None
    camera_y: Optional[float] = None
    port_width: Optional[float] = None
    port_height: Optional[float] = None
    button_width: Optional[float] = None
    button_height: Optional[float] = None
    button_length: Optional[float] = None
    button_positions: Optional[list[float]] = None

    features: list[CADFeature] = Field(default_factory=list)

    missing_parameters: list[str] = Field(default_factory=list)

    clarification_needed: bool = False
    clarification_question: Optional[str] = None