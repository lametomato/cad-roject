import cadquery as cq


def generate_box(length, width, height):

    # Create a rectangular solid
    model = (
        cq.Workplane("XY")
        .box(length, width, height)
    )

    return model

def generate_cylinder(radius, height):

    # Create a cylindrical solid
    model = (
        cq.Workplane("XY")
        .cylinder(height, radius)
    )

    return model

def generate_sphere(radius):

    # Create a spherical solid
    model = (
        cq.Workplane("XY")
        .sphere(radius)
    )

    return model

def generate_cone(radius, height):
    # Create a cone with a pointed top
    model = cq.Workplane("XY").newObject([
        cq.Solid.makeCone(radius, 0, height)
    ])
    return model

def generate_hollow_cylinder(outer_radius, inner_radius, height):

    # Create a hollow cylindrical solid
    model = (
        cq.Workplane("XY")
        .circle(outer_radius)
        .circle(inner_radius)
        .extrude(height)
    )

    return model

def generate_plate_with_holes(length, width, thickness, hole_diameter):

    # Create the rectangular plate
    model = (
        cq.Workplane("XY")
        .box(length, width, thickness)
        .faces(">Z")
        .workplane()
        .pushPoints([
            (-length / 3, -width / 3),
            (length / 3, -width / 3),
            (-length / 3, width / 3),
            (length / 3, width / 3)
        ])
        .hole(hole_diameter)
    )

    return model


def export_stl(model, filename="generated_model.stl"):

    cq.exporters.export(model, filename)

    return filename

def generate_phone_case(
    length,
    width,
    height,
    wall_thickness,
    corner_radius,
    camera_width,
    camera_height,
    camera_x,
    camera_y,
    port_width,
    port_height,
    button_width=None,
    button_height=None,
    button_length=None,
    button_positions=None
):

    # Outer phone case
    outer = (
        cq.Workplane("XY")
        .rect(length, width)
        .extrude(height)
        .edges("|Z")
        .fillet(corner_radius)
    )

    # Inner hollow section
    inner = (
        cq.Workplane("XY")
        .workplane(offset=wall_thickness)
        .rect(
            length - 2 * wall_thickness,
            width - 2 * wall_thickness
        )
        .extrude(height)
        .edges("|Z")
        .fillet(max(0.1, corner_radius - wall_thickness))
    )

    model = outer.cut(inner)

    # Raised screen protection lip
    lip_height = 1.5

    lip_outer = (
        cq.Workplane("XY")
        .workplane(offset=height)
        .rect(length, width)
        .extrude(lip_height)
        .edges("|Z")
        .fillet(corner_radius)
    )

    lip_inner = (
        cq.Workplane("XY")
        .workplane(offset=height)
        .rect(
            length - 2 * wall_thickness,
            width - 2 * wall_thickness
        )
        .extrude(lip_height)
        .edges("|Z")
        .fillet(max(0.1, corner_radius - wall_thickness))
    )

    screen_lip = lip_outer.cut(lip_inner)

    model = model.union(screen_lip)

    # Camera opening on the back
    camera_cutout = (
        cq.Workplane("XY")
        .box(camera_width, camera_height, height + 2)
        .translate((
            camera_x,
            camera_y,
            height / 2
        ))
    )

    model = model.cut(camera_cutout)

    # Raised camera protection rim
    camera_rim_height = 1.5
    camera_rim_width = 2

    camera_rim_outer = (
        cq.Workplane("XY")
        .workplane(offset=0)
        .center(camera_x, camera_y)
        .rect(
            camera_width + 2 * camera_rim_width,
            camera_height + 2 * camera_rim_width
        )
        .extrude(-camera_rim_height)
    )

    camera_rim_inner = (
        cq.Workplane("XY")
        .workplane(offset=0)
        .center(camera_x, camera_y)
        .rect(camera_width, camera_height)
        .extrude(-camera_rim_height)
    )

    camera_rim = camera_rim_outer.cut(camera_rim_inner)

    model = model.union(camera_rim)

    # Charging port on the short bottom end
    port_cutout = (
        cq.Workplane("XY")
        .box(
            wall_thickness + 2,
            port_width,
            port_height
        )
        .translate((
            length / 2,
            0,
            wall_thickness + port_height / 2
        ))
    )

    model = model.cut(port_cutout)

    
    # Side button openings
    if (
        button_width is not None
        and button_height is not None
        and button_length is not None
        and button_positions is not None
    ):

        for position in button_positions:

            button_cutout = (
                cq.Workplane("XY")
                .box(
                    button_width,
                    wall_thickness + 4,
                    button_height
                )
                .translate((
                    position,
                    width / 2 - wall_thickness / 2,
                    height / 2
                ))
            )

            model = model.cut(button_cutout)

    return model