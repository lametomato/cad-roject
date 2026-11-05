import os
import time

from dotenv import load_dotenv
from google import genai
from google.genai import types

from schemas import CADParameters


# Load environment variables
load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")
MODEL = os.getenv("GEMINI_MODEL")

if not API_KEY:
    raise ValueError("Gemini API key is missing. Check your .env file.")

if not MODEL:
    raise ValueError("Gemini model name is missing. Check your .env file.")


# Connect to Gemini
client = genai.Client(
    api_key=API_KEY,
    http_options=types.HttpOptions(
        timeout=60000
    )
)


def extract_parameters(description):

    prompt = f"""
    You are an AI assistant for a CAD model generator.

    Extract the object's dimensions and features.

    Supported objects:
    box, cylinder, sphere, cone, hollow_cylinder, plate_with_holes, bracket, phone_case, unknown.

    Supported features:
    hole, slot, fillet, chamfer.

    Shape dimensions:
    - box: length, width, height.
    - cylinder: radius, height.
    - sphere: radius.
    - cone: radius, height.
    - hollow_cylinder: radius (outer radius), inner_radius, height.
    - plate_with_holes: length, width, thickness, hole_diameter.
    - phone_case: length, width, height, wall_thickness, corner_radius,
      camera_width, camera_height, camera_x, camera_y,
      port_width, port_height.

    Phone case instructions:
    - length means the phone case's longer dimension.
    - width means the phone case's shorter dimension.
    - height means the case's overall depth.
    - wall_thickness means the thickness of the case walls.
    - corner_radius means the radius of the rounded corners.
    - camera_width and camera_height define the camera opening.
    - camera_x and camera_y define the camera opening's center position.
    - port_width and port_height define the charging port opening.
    - Use millimeters.
    - Camera position is measured from the center of the case.

    For hollow cylinders, radius means the outer radius.
    For plates with holes, identify the requested hole diameter.

    Rules:
    1. Use millimeters.
    2. Never invent dimensions.
    3. Identify all requested features.
    4. List important missing dimensions.
    5. Ask a clarification question when necessary.

    User description:
    {description}
    """

    # Try the request up to 3 times
    for attempt in range(2):

        try:
            print("Connecting to Gemini...")

            response = client.models.generate_content(
    model=MODEL,
    contents=prompt,
    config=types.GenerateContentConfig(
        response_mime_type="application/json",
        response_schema=CADParameters
    )
)

            if not response.text:
                raise ValueError("Gemini returned an empty response.")

            print("Gemini response received!")

            return CADParameters.model_validate_json(response.text)

        except Exception as error:

            print("\n========== ERROR DETAILS ==========")

            print("Error type:", type(error).__name__)
            print("Error message:", str(error))
            print("Error code:", getattr(error, "code", None))

            print("===================================")

            raise

            try:
                status = int(status)
            except (TypeError, ValueError):
                status = None

            # Retry temporary server or rate-limit errors
            if status in (429, 500, 502, 503, 504):

                if attempt < 2:
                    wait_time = [2, 5][attempt]

                    print(
                        f"Temporary Gemini error ({status}). "
                        f"Retrying in {wait_time} seconds..."
                    )

                    time.sleep(wait_time)

                else:
                    raise RuntimeError(
                        "Gemini is temporarily unavailable. "
                        "Please try again later."
                    ) from error

            else:
                raise RuntimeError(
                    f"AI request failed: {error}"
                ) from error