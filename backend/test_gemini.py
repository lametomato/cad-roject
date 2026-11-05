from ai_engine import extract_parameters

print("Testing Gemini phone case parameter extraction...")

description = """
Create a smartphone case with:
length 150 mm,
width 75 mm,
height 12 mm,
wall thickness 2 mm,
corner radius 8 mm,
camera opening width 25 mm,
camera opening height 25 mm,
camera position x = -55 mm and y = 20 mm,
charging port width 12 mm,
charging port height 5 mm.
"""

try:
    result = extract_parameters(description)

    print("\nSUCCESS!")
    print("Extracted parameters:")
    print(result.model_dump_json(indent=4))

except Exception as error:
    print("\nFAILED!")
    print("Error type:", type(error).__name__)
    print("Error message:", str(error))