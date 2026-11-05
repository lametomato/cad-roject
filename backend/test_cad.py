from cad_engine import generate_phone_case, export_stl

print("Generating phone case...")

model = generate_phone_case(
    length=150,
    width=75,
    height=12,
    wall_thickness=2,
    corner_radius=8,
    camera_width=25,
    camera_height=25,
    camera_x=-55,
    camera_y=20,
    port_width=12,
    port_height=5,

    # Side button openings
    button_width=12,
    button_height=3,
    button_length=5,
    button_positions=[-25, 0, 25]
)

filename = export_stl(model, "test_phone_case.stl")

print("Phone case generated successfully!")
print("Saved as:", filename)