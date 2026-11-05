from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi.responses import FileResponse
import os
import uuid
import json
from datetime import datetime

from ai_engine import extract_parameters
from cad_engine import (
    generate_box,
    generate_cylinder,
    generate_sphere,
    generate_cone,
    generate_hollow_cylinder,
    generate_plate_with_holes,
    generate_phone_case,
    export_stl
)

app = FastAPI(title="AI CAD Generator API")

# File used to store generated model information
MODELS_DATA_FILE = os.path.join(
    os.path.dirname(__file__),
    "models_data.json"
)

# Allow communication with the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class GenerateRequest(BaseModel):
    description: str
    name: str = "Untitled Model"

class RenameModelRequest(BaseModel):
    new_name: str

def save_model_data(model_data):
    models = []

    if os.path.exists(MODELS_DATA_FILE):
        with open(MODELS_DATA_FILE, "r") as file:
            models = json.load(file)

    models.append(model_data)

    with open(MODELS_DATA_FILE, "w") as file:
        json.dump(models, file, indent=4)


@app.get("/")
def home():
    return {"message": "AI CAD Generator API is running"}


@app.post("/generate")
def generate_model(request: GenerateRequest):
    try:
        result = extract_parameters(request.description)
        return result.model_dump()

    except Exception as error:
        print("Generation error:", error)
        raise HTTPException(
            status_code=503,
            detail="AI parameter extraction is temporarily unavailable. Please try again."
        )

@app.post("/generate-cad")
def generate_cad(request: GenerateRequest):

    try:
        # Extract parameters using Gemini
        result = extract_parameters(request.description)

        # Check whether all required dimensions are available
        # Generate the 3D model based on the detected object type
        if result.object_type == "box":
            if not all([result.length, result.width, result.height]):
                raise HTTPException(status_code=400, detail="Length, width and height are required.")

            model = generate_box(result.length, result.width, result.height)

        elif result.object_type == "cylinder":
            if not all([result.radius, result.height]):
                raise HTTPException(status_code=400, detail="Radius and height are required.")

            model = generate_cylinder(result.radius, result.height)

        elif result.object_type == "sphere":
            if not result.radius:
                raise HTTPException(status_code=400, detail="Radius is required.")

            model = generate_sphere(result.radius)

        elif result.object_type == "cone":
            if not all([result.radius, result.height]):
                raise HTTPException(status_code=400, detail="Radius and height are required.")

            model = generate_cone(result.radius, result.height)

        elif result.object_type == "hollow_cylinder":
            if not all([result.radius, result.inner_radius, result.height]):
                raise HTTPException(status_code=400, detail="Outer radius, inner radius and height are required.")

            model = generate_hollow_cylinder(
        result.radius,
        result.inner_radius,
        result.height
    )

        elif result.object_type == "plate_with_holes":
            if not all([result.length, result.width, result.thickness, result.hole_diameter]):
                raise HTTPException(status_code=400, detail="Length, width, thickness and hole diameter are required.")

            model = generate_plate_with_holes(
        result.length,
        result.width,
        result.thickness,
        result.hole_diameter
    )

        elif result.object_type == "phone_case":
            required = [
                result.length,
                result.width,
                result.height,
                result.wall_thickness,
                result.corner_radius,
                result.camera_width,
                result.camera_height,
                result.camera_x,
                result.camera_y,
                result.port_width,
                result.port_height
            ]

            if any(value is None for value in required):
                raise HTTPException(
                    status_code=400,
                    detail="Phone case dimensions are incomplete."
                )

            model = generate_phone_case(
                length=result.length,
                width=result.width,
                height=result.height,
                wall_thickness=result.wall_thickness,
                corner_radius=result.corner_radius,
                camera_width=result.camera_width,
                camera_height=result.camera_height,
                camera_x=result.camera_x,
                camera_y=result.camera_y,
                port_width=result.port_width,
                port_height=result.port_height,

                # Side button openings
                button_width=12,
                button_height=3,
                button_length=5,
                button_positions=[-25, -10, 25]
            )

        else:
            raise HTTPException(
            status_code=400,
            detail="This object type is not supported yet."
    )

        # Create a folder for generated models
        models_dir = os.path.join(os.path.dirname(__file__), "generated_models")
        os.makedirs(models_dir, exist_ok=True)

        # Generate a unique filename
        model_id = uuid.uuid4().hex
        filename = f"{model_id}.stl"
        file_path = os.path.join(models_dir, filename)

        # Export the STL file
        export_stl(model, file_path)
        save_model_data({
            "model_id": model_id,
            "name": request.name,
            "description": request.description,
            "parameters": result.model_dump(),
            "filename": filename,
            "created_at": datetime.now().isoformat()
        })



        return {
    "message": "3D model generated successfully",
    "parameters": result.model_dump(),
    "filename": filename,
    "model_id": model_id
}

    except HTTPException:
        raise

    except Exception as error:
        print("CAD generation error:", error)
        raise HTTPException(
            status_code=500,
            detail="Unable to generate the CAD model."
        )

@app.get("/models")
def get_saved_models():
    if not os.path.exists(MODELS_DATA_FILE):
        return []

    with open(MODELS_DATA_FILE, "r") as file:
        return json.load(file)

@app.delete("/models/{model_id}")
def delete_model(model_id: str):
    try:
        model_id = uuid.UUID(model_id).hex
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid model ID.")

    if not os.path.exists(MODELS_DATA_FILE):
        raise HTTPException(status_code=404, detail="Model not found.")

    with open(MODELS_DATA_FILE, "r") as file:
        models = json.load(file)

    updated_models = [
        model for model in models
        if model["model_id"] != model_id
    ]

    if len(updated_models) == len(models):
        raise HTTPException(status_code=404, detail="Model not found.")

    file_path = os.path.join(
        os.path.dirname(__file__),
        "generated_models",
        f"{model_id}.stl"
    )

    if os.path.exists(file_path):
        os.remove(file_path)

    with open(MODELS_DATA_FILE, "w") as file:
        json.dump(updated_models, file, indent=4)

    return {"message": "Model deleted successfully."}


@app.put("/models/{model_id}")
def rename_model(model_id: str, request: RenameModelRequest):

    try:
        model_id = uuid.UUID(model_id).hex
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid model ID.")

    new_name = request.new_name.strip()

    if not new_name:
        raise HTTPException(status_code=400, detail="Model name cannot be empty.")

    if not os.path.exists(MODELS_DATA_FILE):
        raise HTTPException(status_code=404, detail="Model not found.")

    with open(MODELS_DATA_FILE, "r") as file:
        models = json.load(file)

    model_found = False

    for model in models:
        if model["model_id"] == model_id:
            model["name"] = new_name
            model_found = True
            break

    if not model_found:
        raise HTTPException(status_code=404, detail="Model not found.")

    with open(MODELS_DATA_FILE, "w") as file:
        json.dump(models, file, indent=4)

    return {"message": "Model renamed successfully."}

@app.get("/download-model/{model_id}")
def download_model(model_id: str):

    try:
        model_id = uuid.UUID(model_id).hex
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid model ID.")

    file_path = os.path.join(
        os.path.dirname(__file__),
        "generated_models",
        f"{model_id}.stl"
    )

    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=404,
            detail="Model not found."
        )

    return FileResponse(
        path=file_path,
        media_type="model/stl",
        filename=f"{model_id}.stl"
    )