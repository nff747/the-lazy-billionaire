import cairo
import math
import os

# 1. 7-inch Tablet Screenshots (1200 x 1920 px, 16:10 portrait)
tab7_screens = [
    {
        "raw": "store-assets/raw/tablet/tab7_1_empire.png",
        "tag": "TABLET OPTIMIZED • 7-INCH",
        "title": "PASSIVE CONGLOMERATE\nMANAGEMENT",
        "desc": "Orchestrate your commercial empire with high-density tablet analytics.",
        "out": "store-assets/playstore/tablet_7inch/tablet7_screenshot_1_empire.png",
        "accent": (0.98, 0.75, 0.15)
    },
    {
        "raw": "store-assets/raw/tablet/tab7_2_market.png",
        "tag": "HIGH-VELOCITY EXCHANGE",
        "title": "DESKTOP-GRADE STOCK\n& CRYPTO TRADING",
        "desc": "Execute multi-asset trades and hostile board takeovers on larger glass.",
        "out": "store-assets/playstore/tablet_7inch/tablet7_screenshot_2_market.png",
        "accent": (0.1, 0.85, 0.45)
    }
]

W7, H7 = 1200, 1920
for s in tab7_screens:
    surface = cairo.ImageSurface(cairo.FORMAT_ARGB32, W7, H7)
    ctx = cairo.Context(surface)

    # Luxury Background Gradient
    bg = cairo.LinearGradient(W7/2, 0, W7/2, H7)
    bg.add_color_stop_rgb(0.0, 0.04, 0.04, 0.05)
    bg.add_color_stop_rgb(0.25, 0.02, 0.02, 0.025)
    bg.add_color_stop_rgb(1.0, 0.008, 0.008, 0.01)
    ctx.set_source(bg)
    ctx.paint()

    # Ambient glow
    glow = cairo.RadialGradient(W7/2, 1100, 80, W7/2, 1100, 650)
    glow.add_color_stop_rgba(0.0, s["accent"][0], s["accent"][1], s["accent"][2], 0.20)
    glow.add_color_stop_rgba(1.0, 0.0, 0.0, 0.0, 0.0)
    ctx.set_source(glow)
    ctx.arc(W7/2, 1100, 650, 0, 2*math.pi)
    ctx.fill()

    # Typography
    ctx.select_font_face('DejaVu Sans', cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_BOLD)
    ctx.set_font_size(20)
    pill_w = ctx.text_extents(s["tag"]).width + 48
    pill_x = (W7 - pill_w) / 2
    ctx.set_source_rgba(s["accent"][0], s["accent"][1], s["accent"][2], 0.15)
    ctx.rectangle(pill_x, 80, pill_w, 40)
    ctx.fill()
    ctx.set_source_rgba(s["accent"][0], s["accent"][1], s["accent"][2], 0.65)
    ctx.set_line_width(1.5)
    ctx.rectangle(pill_x, 80, pill_w, 40)
    ctx.stroke()
    ctx.set_source_rgb(s["accent"][0], s["accent"][1], s["accent"][2])
    ctx.move_to(pill_x + 24, 107)
    ctx.show_text(s["tag"])

    # Title
    ctx.set_font_size(48)
    lines = s["title"].split('\n')
    ty = 185
    for l in lines:
        lx = (W7 - ctx.text_extents(l).width) / 2
        ctx.set_source_rgb(1.0, 1.0, 1.0)
        ctx.move_to(lx, ty)
        ctx.show_text(l)
        ty += 58

    # Desc
    ctx.select_font_face('DejaVu Sans', cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_NORMAL)
    ctx.set_font_size(22)
    ctx.set_source_rgba(0.72, 0.76, 0.82, 0.85)
    dx = (W7 - ctx.text_extents(s["desc"]).width) / 2
    ctx.move_to(dx, ty + 10)
    ctx.show_text(s["desc"])

    # Tablet Frame
    frame_w, frame_h = 960, 1420
    fx = (W7 - frame_w) / 2
    fy = 420
    cr = 36

    # Tablet Bezel
    ctx.save()
    ctx.new_sub_path()
    ctx.arc(fx + frame_w - cr, fy + cr, cr, -math.pi/2, 0)
    ctx.arc(fx + frame_w - cr, fy + frame_h - cr, cr, 0, math.pi/2)
    ctx.arc(fx + cr, fy + frame_h - cr, cr, math.pi/2, math.pi)
    ctx.arc(fx + cr, fy + cr, cr, math.pi, 3*math.pi/2)
    ctx.close_path()
    ctx.set_source_rgb(0.18, 0.18, 0.2)
    ctx.set_line_width(8.0)
    ctx.stroke()
    ctx.restore()

    # Inner Screen Clip
    pad = 5
    sx, sy, sw, sh, sr = fx + pad, fy + pad, frame_w - pad*2, frame_h - pad*2, cr - pad
    ctx.save()
    ctx.new_sub_path()
    ctx.arc(sx + sw - sr, sy + sr, sr, -math.pi/2, 0)
    ctx.arc(sx + sw - sr, sy + sh - sr, sr, 0, math.pi/2)
    ctx.arc(sx + sr, sy + sh - sr, sr, math.pi/2, math.pi)
    ctx.arc(sx + sr, sy + sr, sr, math.pi, 3*math.pi/2)
    ctx.close_path()
    ctx.clip()

    raw_s = cairo.ImageSurface.create_from_png(s["raw"])
    scale = sw / raw_s.get_width()
    ctx.translate(sx, sy)
    ctx.scale(scale, scale)
    ctx.set_source_surface(raw_s, 0, 0)
    ctx.paint()
    ctx.restore()

    surface.write_to_png(s["out"])
    print(f"Rendered 7-inch tablet: {s['out']}")


# 2. 10-inch Tablet & Chromebook / Desktop Screenshots (1920 x 1200 px, 16:10 landscape)
tab10_screens = [
    {
        "raw": "store-assets/raw/tablet/tab10_1_empire.png",
        "tag": "10-INCH TABLET & CHROMEBOOK / DESKTOP",
        "title": "EXPANDED WAR ROOM DASHBOARD",
        "desc": "Command multi-billion dollar operations with comprehensive widescreen fidelity.",
        "out_tab": "store-assets/playstore/tablet_10inch/tablet10_screenshot_1_empire.png",
        "out_desk": "store-assets/playstore/chromebook/chromebook_screenshot_1_empire.png",
        "accent": (0.98, 0.75, 0.15)
    },
    {
        "raw": "store-assets/raw/tablet/tab10_2_market.png",
        "tag": "TERMINAL TRADING INTERFACE",
        "title": "REAL-TIME SYNDICATE EXCHANGE",
        "desc": "Real-time liquidity pools, insider intelligence feeds, and automated acquisitions.",
        "out_tab": "store-assets/playstore/tablet_10inch/tablet10_screenshot_2_market.png",
        "out_desk": "store-assets/playstore/chromebook/chromebook_screenshot_2_market.png",
        "accent": (0.1, 0.85, 0.45)
    }
]

W10, H10 = 1920, 1200
for s in tab10_screens:
    surface = cairo.ImageSurface(cairo.FORMAT_ARGB32, W10, H10)
    ctx = cairo.Context(surface)

    # Background
    bg = cairo.LinearGradient(W10/2, 0, W10/2, H10)
    bg.add_color_stop_rgb(0.0, 0.04, 0.04, 0.05)
    bg.add_color_stop_rgb(0.3, 0.02, 0.02, 0.025)
    bg.add_color_stop_rgb(1.0, 0.008, 0.008, 0.01)
    ctx.set_source(bg)
    ctx.paint()

    # Ambient glow
    glow = cairo.RadialGradient(W10/2, 700, 80, W10/2, 700, 750)
    glow.add_color_stop_rgba(0.0, s["accent"][0], s["accent"][1], s["accent"][2], 0.18)
    glow.add_color_stop_rgba(1.0, 0.0, 0.0, 0.0, 0.0)
    ctx.set_source(glow)
    ctx.arc(W10/2, 700, 750, 0, 2*math.pi)
    ctx.fill()

    # Header
    ctx.select_font_face('DejaVu Sans', cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_BOLD)
    ctx.set_font_size(18)
    pill_w = ctx.text_extents(s["tag"]).width + 44
    pill_x = (W10 - pill_w) / 2
    ctx.set_source_rgba(s["accent"][0], s["accent"][1], s["accent"][2], 0.15)
    ctx.rectangle(pill_x, 50, pill_w, 36)
    ctx.fill()
    ctx.set_source_rgba(s["accent"][0], s["accent"][1], s["accent"][2], 0.65)
    ctx.set_line_width(1.5)
    ctx.rectangle(pill_x, 50, pill_w, 36)
    ctx.stroke()
    ctx.set_source_rgb(s["accent"][0], s["accent"][1], s["accent"][2])
    ctx.move_to(pill_x + 22, 75)
    ctx.show_text(s["tag"])

    # Title
    ctx.set_font_size(44)
    lx = (W10 - ctx.text_extents(s["title"]).width) / 2
    ctx.set_source_rgb(1.0, 1.0, 1.0)
    ctx.move_to(lx, 140)
    ctx.show_text(s["title"])

    # Subtitle
    ctx.select_font_face('DejaVu Sans', cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_NORMAL)
    ctx.set_font_size(20)
    ctx.set_source_rgba(0.72, 0.76, 0.82, 0.85)
    dx = (W10 - ctx.text_extents(s["desc"]).width) / 2
    ctx.move_to(dx, 180)
    ctx.show_text(s["desc"])

    # Widescreen Tablet / Laptop Frame
    fw, fh = 1480, 925
    fx = (W10 - fw) / 2
    fy = 225
    cr = 28

    # Frame Bezel
    ctx.save()
    ctx.new_sub_path()
    ctx.arc(fx + fw - cr, fy + cr, cr, -math.pi/2, 0)
    ctx.arc(fx + fw - cr, fy + fh - cr, cr, 0, math.pi/2)
    ctx.arc(fx + cr, fy + fh - cr, cr, math.pi/2, math.pi)
    ctx.arc(fx + cr, fy + cr, cr, math.pi, 3*math.pi/2)
    ctx.close_path()
    ctx.set_source_rgb(0.2, 0.2, 0.22)
    ctx.set_line_width(7.0)
    ctx.stroke()
    ctx.restore()

    # Screen Clip
    pad = 4
    sx, sy, sw, sh, sr = fx + pad, fy + pad, fw - pad*2, fh - pad*2, cr - pad
    ctx.save()
    ctx.new_sub_path()
    ctx.arc(sx + sw - sr, sy + sr, sr, -math.pi/2, 0)
    ctx.arc(sx + sw - sr, sy + sh - sr, sr, 0, math.pi/2)
    ctx.arc(sx + sr, sy + sh - sr, sr, math.pi/2, math.pi)
    ctx.arc(sx + sr, sy + sr, sr, math.pi, 3*math.pi/2)
    ctx.close_path()
    ctx.clip()

    raw_s = cairo.ImageSurface.create_from_png(s["raw"])
    scale = sw / raw_s.get_width()
    ctx.translate(sx, sy)
    ctx.scale(scale, scale)
    ctx.set_source_surface(raw_s, 0, 0)
    ctx.paint()
    ctx.restore()

    surface.write_to_png(s["out_tab"])
    surface.write_to_png(s["out_desk"])
    print(f"Rendered 10-inch tablet: {s['out_tab']}")


# 3. Android XR / Spatial Computing Screenshots & Banners (1920 x 1080 px & Spatial Hero)
xr_screens = [
    {
        "raw": "store-assets/raw/tablet/tab10_1_empire.png",
        "tag": "SPATIAL COMPUTING • ANDROID XR",
        "title": "IMMERSIVE FINANCIAL COMMAND",
        "desc": "Architect your corporate empire in high-fidelity spatial glass windows.",
        "out": "store-assets/playstore/android_xr/xr_screenshot_1_spatial_empire.png",
        "accent": (0.35, 0.75, 1.0) # XR Cyan
    },
    {
        "raw": "store-assets/raw/tablet/tab10_2_market.png",
        "tag": "SPATIAL TRADING DESK • ANDROID XR",
        "title": "HOLOGRAPHIC MARKET DYNAMICS",
        "desc": "Real-time stock feeds and portfolio synergies hovering in infinite spatial canvas.",
        "out": "store-assets/playstore/android_xr/xr_screenshot_2_spatial_market.png",
        "accent": (0.9, 0.4, 1.0) # XR Neon Magenta
    }
]

W_XR, H_XR = 1920, 1080
for s in xr_screens:
    surface = cairo.ImageSurface(cairo.FORMAT_ARGB32, W_XR, H_XR)
    ctx = cairo.Context(surface)

    # Spatial Deep Space / Infinite Canvas Gradient
    bg = cairo.RadialGradient(W_XR/2, H_XR/2, 100, W_XR/2, H_XR/2, 1100)
    bg.add_color_stop_rgb(0.0, 0.05, 0.05, 0.08)
    bg.add_color_stop_rgb(0.6, 0.015, 0.015, 0.025)
    bg.add_color_stop_rgb(1.0, 0.005, 0.005, 0.008)
    ctx.set_source(bg)
    ctx.paint()

    # Spatial Grid Matrix lines
    ctx.set_line_width(0.7)
    for y in range(0, H_XR, 45):
        ctx.set_source_rgba(1.0, 1.0, 1.0, 0.018)
        ctx.move_to(0, y)
        ctx.line_to(W_XR, y)
        ctx.stroke()
    for x in range(0, W_XR, 60):
        ctx.set_source_rgba(1.0, 1.0, 1.0, 0.012)
        ctx.move_to(x, 0)
        ctx.line_to(x, H_XR)
        ctx.stroke()

    # Ambient Spatial Aura
    glow = cairo.RadialGradient(W_XR/2, 600, 100, W_XR/2, 600, 700)
    glow.add_color_stop_rgba(0.0, s["accent"][0], s["accent"][1], s["accent"][2], 0.25)
    glow.add_color_stop_rgba(0.7, s["accent"][0], s["accent"][1], s["accent"][2], 0.04)
    glow.add_color_stop_rgba(1.0, 0.0, 0.0, 0.0, 0.0)
    ctx.set_source(glow)
    ctx.arc(W_XR/2, 600, 700, 0, 2*math.pi)
    ctx.fill()

    # Spatial Header
    ctx.select_font_face('DejaVu Sans', cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_BOLD)
    ctx.set_font_size(17)
    pill_w = ctx.text_extents(s["tag"]).width + 44
    pill_x = (W_XR - pill_w) / 2
    ctx.set_source_rgba(s["accent"][0], s["accent"][1], s["accent"][2], 0.15)
    ctx.rectangle(pill_x, 40, pill_w, 34)
    ctx.fill()
    ctx.set_source_rgba(s["accent"][0], s["accent"][1], s["accent"][2], 0.7)
    ctx.set_line_width(1.5)
    ctx.rectangle(pill_x, 40, pill_w, 34)
    ctx.stroke()
    ctx.set_source_rgb(s["accent"][0], s["accent"][1], s["accent"][2])
    ctx.move_to(pill_x + 22, 63)
    ctx.show_text(s["tag"])

    # Title
    ctx.set_font_size(40)
    lx = (W_XR - ctx.text_extents(s["title"]).width) / 2
    ctx.set_source_rgb(1.0, 1.0, 1.0)
    ctx.move_to(lx, 120)
    ctx.show_text(s["title"])

    # Desc
    ctx.select_font_face('DejaVu Sans', cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_NORMAL)
    ctx.set_font_size(19)
    ctx.set_source_rgba(0.75, 0.8, 0.88, 0.85)
    dx = (W_XR - ctx.text_extents(s["desc"]).width) / 2
    ctx.move_to(dx, 155)
    ctx.show_text(s["desc"])

    # Floating Spatial Glass Panel Window (VisionOS / Android XR Floating Window Style)
    pw, ph = 1380, 820
    px = (W_XR - pw) / 2
    py = 195
    pr = 32

    # Glass Shadow & Depth
    glass_shadow = cairo.RadialGradient(W_XR/2, py + ph/2, pw/2, W_XR/2, py + ph/2, pw/2 + 100)
    glass_shadow.add_color_stop_rgba(0.0, 0.0, 0.0, 0.0, 0.85)
    glass_shadow.add_color_stop_rgba(1.0, 0.0, 0.0, 0.0, 0.0)
    ctx.set_source(glass_shadow)
    ctx.rectangle(px - 60, py - 30, pw + 120, ph + 80)
    ctx.fill()

    # Glass Window Border Glow (Prismatic Holographic Rim)
    ctx.save()
    ctx.new_sub_path()
    ctx.arc(px + pw - pr, py + pr, pr, -math.pi/2, 0)
    ctx.arc(px + pw - pr, py + ph - pr, pr, 0, math.pi/2)
    ctx.arc(px + pr, py + ph - pr, pr, math.pi/2, math.pi)
    ctx.arc(px + pr, py + pr, pr, math.pi, 3*math.pi/2)
    ctx.close_path()

    rim_grad = cairo.LinearGradient(px, py, px + pw, py + ph)
    rim_grad.add_color_stop_rgba(0.0, s["accent"][0], s["accent"][1], s["accent"][2], 0.8)
    rim_grad.add_color_stop_rgba(0.5, 1.0, 1.0, 1.0, 0.4)
    rim_grad.add_color_stop_rgba(1.0, s["accent"][0], s["accent"][1], s["accent"][2], 0.8)
    ctx.set_source(rim_grad)
    ctx.set_line_width(4.0)
    ctx.stroke()
    ctx.restore()

    # Clip to Spatial Floating Window
    pad = 3
    wx, wy, ww, wh, wr = px + pad, py + pad, pw - pad*2, ph - pad*2, pr - pad
    ctx.save()
    ctx.new_sub_path()
    ctx.arc(wx + ww - wr, wy + wr, wr, -math.pi/2, 0)
    ctx.arc(wx + ww - wr, wy + wh - wr, wr, 0, math.pi/2)
    ctx.arc(wx + wr, wy + wh - wr, wr, math.pi/2, math.pi)
    ctx.arc(wx + wr, wy + wr, wr, math.pi, 3*math.pi/2)
    ctx.close_path()
    ctx.clip()

    raw_s = cairo.ImageSurface.create_from_png(s["raw"])
    scale = ww / raw_s.get_width()
    ctx.translate(wx, wy)
    ctx.scale(scale, scale)
    ctx.set_source_surface(raw_s, 0, 0)
    ctx.paint()
    ctx.restore()

    surface.write_to_png(s["out"])
    print(f"Rendered Android XR Asset: {s['out']}")

print("All Tablet, Chromebook, Desktop, and Android XR assets rendered successfully!")
