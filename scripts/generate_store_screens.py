import cairo
import math

SW, SH = 1080, 2400

screens = [
    {
        "raw": "store-assets/raw/screen_1_empire.png",
        "tag": "PASSIVE EMPIRE SIMULATION",
        "title": "BUILD A MULTI-TRILLION\nDOLLAR DYNASTY",
        "desc": "Scale grassroots operations to quantum computing conglomerates.",
        "out": "store-assets/playstore/screenshot_1_empire.png",
        "accent": (0.98, 0.75, 0.15) # Gold
    },
    {
        "raw": "store-assets/raw/screen_2_market.png",
        "tag": "HIGH-FREQUENCY TRADING",
        "title": "TRADE REAL-TIME MARKETS\n& CORPORATE ASSETS",
        "desc": "Leverage insider leaks, margin accounts, and execute hostile takeovers.",
        "out": "store-assets/playstore/screenshot_2_market.png",
        "accent": (0.1, 0.85, 0.45) # Emerald Bull Green
    },
    {
        "raw": "store-assets/raw/screen_4_shop.png",
        "tag": "BLACK MARKET VAULT",
        "title": "DEPLOY QUANTUM BOOSTS\n& SWISS CYBER-SHIELDS",
        "desc": "Defend your vault with cryptographic shields and automated tappers.",
        "out": "store-assets/playstore/screenshot_3_vault.png",
        "accent": (0.2, 0.65, 1.0) # Electric Blue
    },
    {
        "raw": "store-assets/raw/screen_5_status.png",
        "tag": "GLOBAL SYNDICATE RANKS",
        "title": "CLIMB FROM STREET HUSTLER\nTO APEX TITAN",
        "desc": "Compete against rival tycoons worldwide and dominate the leaderboard.",
        "out": "store-assets/playstore/screenshot_4_ranks.png",
        "accent": (0.95, 0.35, 0.2) # High Stakes Amber
    }
]

for s in screens:
    surface = cairo.ImageSurface(cairo.FORMAT_ARGB32, SW, SH)
    ctx = cairo.Context(surface)

    # 1. Background Luxury Gradient
    bg = cairo.LinearGradient(SW/2, 0, SW/2, SH)
    bg.add_color_stop_rgb(0.0, 0.04, 0.04, 0.05)
    bg.add_color_stop_rgb(0.25, 0.02, 0.02, 0.025)
    bg.add_color_stop_rgb(1.0, 0.008, 0.008, 0.01)
    ctx.set_source(bg)
    ctx.paint()

    # Ambient radial glow behind device
    gw, gh = SW/2, 1320
    glow = cairo.RadialGradient(gw, gh, 80, gw, gh, 650)
    glow.add_color_stop_rgba(0.0, s["accent"][0], s["accent"][1], s["accent"][2], 0.18)
    glow.add_color_stop_rgba(0.5, s["accent"][0], s["accent"][1], s["accent"][2], 0.04)
    glow.add_color_stop_rgba(1.0, 0.0, 0.0, 0.0, 0.0)
    ctx.set_source(glow)
    ctx.arc(gw, gh, 650, 0, 2*math.pi)
    ctx.fill()

    # Subtle horizontal grid lines in header zone
    ctx.set_line_width(1.0)
    for y in range(40, 520, 36):
        ctx.set_source_rgba(1.0, 1.0, 1.0, 0.015)
        ctx.move_to(0, y)
        ctx.line_to(SW, y)
        ctx.stroke()

    # 2. Marketing Header Typography
    ctx.select_font_face('DejaVu Sans', cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_BOLD)

    # Pill Tag
    ctx.set_font_size(22)
    tag_text = s["tag"]
    extents = ctx.text_extents(tag_text)
    pill_w = extents.width + 50
    pill_h = 44
    pill_x = (SW - pill_w) / 2
    pill_y = 100

    ctx.set_source_rgba(s["accent"][0], s["accent"][1], s["accent"][2], 0.15)
    ctx.rectangle(pill_x, pill_y, pill_w, pill_h)
    ctx.fill()
    ctx.set_line_width(1.5)
    ctx.set_source_rgba(s["accent"][0], s["accent"][1], s["accent"][2], 0.65)
    ctx.rectangle(pill_x, pill_y, pill_w, pill_h)
    ctx.stroke()

    # Pill dot
    ctx.arc(pill_x + 22, pill_y + 22, 5, 0, 2*math.pi)
    ctx.set_source_rgb(s["accent"][0], s["accent"][1], s["accent"][2])
    ctx.fill()

    # Pill text
    ctx.set_source_rgb(s["accent"][0], s["accent"][1], s["accent"][2])
    ctx.move_to(pill_x + 36, pill_y + 30)
    ctx.show_text(tag_text)

    # Title - perfectly calculated to never clip
    ctx.set_font_size(54)
    title_lines = s["title"].split('\n')
    ty = 215
    for line in title_lines:
        line_extents = ctx.text_extents(line)
        lx = (SW - line_extents.width) / 2
        # Shadow
        ctx.set_source_rgba(0.0, 0.0, 0.0, 0.7)
        ctx.move_to(lx + 2, ty + 2)
        ctx.show_text(line)

        # White title
        ctx.set_source_rgb(1.0, 1.0, 1.0)
        ctx.move_to(lx, ty)
        ctx.show_text(line)
        ty += 68

    # Sub-description
    ctx.select_font_face('DejaVu Sans', cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_NORMAL)
    ctx.set_font_size(24)
    desc_extents = ctx.text_extents(s["desc"])
    dx = (SW - desc_extents.width) / 2
    ctx.set_source_rgba(0.72, 0.76, 0.82, 0.85)
    ctx.move_to(dx, ty + 15)
    ctx.show_text(s["desc"])

    # 3. Phone Device Mockup
    phone_w = 880
    phone_h = 1880
    phone_x = (SW - phone_w) / 2
    phone_y = 515
    corner_r = 54

    # Phone Outer Bezel (Sleek Titanium Frame)
    ctx.save()
    ctx.new_sub_path()
    ctx.arc(phone_x + phone_w - corner_r, phone_y + corner_r, corner_r, -math.pi/2, 0)
    ctx.arc(phone_x + phone_w - corner_r, phone_y + phone_h - corner_r, corner_r, 0, math.pi/2)
    ctx.arc(phone_x + corner_r, phone_y + phone_h - corner_r, corner_r, math.pi/2, math.pi)
    ctx.arc(phone_x + corner_r, phone_y + corner_r, corner_r, math.pi, 3*math.pi/2)
    ctx.close_path()

    bezel_grad = cairo.LinearGradient(phone_x, phone_y, phone_x + phone_w, phone_y + phone_h)
    bezel_grad.add_color_stop_rgb(0.0, 0.28, 0.28, 0.3)
    bezel_grad.add_color_stop_rgb(0.5, 0.12, 0.12, 0.14)
    bezel_grad.add_color_stop_rgb(1.0, 0.24, 0.24, 0.26)
    ctx.set_source(bezel_grad)
    ctx.set_line_width(8.0)
    ctx.stroke()
    ctx.restore()

    # Clip to Phone Screen Display
    inner_pad = 6
    disp_x = phone_x + inner_pad
    disp_y = phone_y + inner_pad
    disp_w = phone_w - (inner_pad * 2)
    disp_h = phone_h - (inner_pad * 2)
    disp_r = corner_r - inner_pad

    ctx.save()
    ctx.new_sub_path()
    ctx.arc(disp_x + disp_w - disp_r, disp_y + disp_r, disp_r, -math.pi/2, 0)
    ctx.arc(disp_x + disp_w - disp_r, disp_y + disp_h - disp_r, disp_r, 0, math.pi/2)
    ctx.arc(disp_x + disp_r, disp_y + disp_h - disp_r, disp_r, math.pi/2, math.pi)
    ctx.arc(disp_x + disp_r, disp_y + disp_r, disp_r, math.pi, 3*math.pi/2)
    ctx.close_path()
    ctx.clip()

    # Draw Game Screen
    raw_surface = cairo.ImageSurface.create_from_png(s["raw"])
    rw, rh = raw_surface.get_width(), raw_surface.get_height()
    scale = disp_w / rw
    ctx.translate(disp_x, disp_y)
    ctx.scale(scale, scale)
    ctx.set_source_surface(raw_surface, 0, 0)
    ctx.paint()
    ctx.restore()

    # Inner subtle rim light
    ctx.save()
    ctx.new_sub_path()
    ctx.arc(disp_x + disp_w - disp_r, disp_y + disp_r, disp_r, -math.pi/2, 0)
    ctx.arc(disp_x + disp_w - disp_r, disp_y + disp_h - disp_r, disp_r, 0, math.pi/2)
    ctx.arc(disp_x + disp_r, disp_y + disp_h - disp_r, disp_r, math.pi/2, math.pi)
    ctx.arc(disp_x + disp_r, disp_y + disp_r, disp_r, math.pi, 3*math.pi/2)
    ctx.close_path()
    ctx.set_line_width(1.5)
    ctx.set_source_rgba(1.0, 1.0, 1.0, 0.15)
    ctx.stroke()
    ctx.restore()

    surface.write_to_png(s["out"])
    print(f"Rendered: {s['out']}")

print("All marketing screenshots polished!")
