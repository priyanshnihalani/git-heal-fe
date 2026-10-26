import json
import base64
import os
import math
from PIL import Image

BASE_DIR = r"D:\genAI\GIT_HEAL\git_heal_fe\public\main-bears"
OUT_DIR = BASE_DIR

IMAGES = [
    {
        "id": "bear_eating",
        "file": "bear-1-happy.png",
        "title": "Eating Repos",
        "marker": "eating_repos"
    },
    {
        "id": "bear_reading",
        "file": "bear-2-reading-repos.png",
        "title": "Reading Repos",
        "marker": "reading_repos"
    },
    {
        "id": "bear_raising_pr",
        "file": "bear-3-raising-pr.png",
        "title": "Raising PR",
        "marker": "raising_pr"
    },
    {
        "id": "bear_waving",
        "file": "bear-3-waving.png",
        "title": "Waving the Repos",
        "marker": "waving_repos"
    }
]

WIDTH = 1254
HEIGHT = 1254
FPS = 30
STAGE_FRAMES = 75     # 2.5 seconds per stage
FADE_FRAMES = 18      # 0.6 seconds transition overlap
TOTAL_FRAMES = STAGE_FRAMES * len(IMAGES) # 300 frames = 10.0 seconds

def get_base64_image(filepath, optimize=False, max_size=800):
    if not optimize:
        with open(filepath, "rb") as f:
            encoded = base64.b64encode(f.read()).decode('utf-8')
        return f"data:image/png;base64,{encoded}"
    else:
        # Resize and optimize using PIL
        im = Image.open(filepath)
        im = im.convert("RGB")
        im.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
        import io
        buf = io.BytesIO()
        im.save(buf, format="JPEG", quality=85, optimize=True)
        encoded = base64.b64encode(buf.getvalue()).decode('utf-8')
        return f"data:image/jpeg;base64,{encoded}"

def build_smooth_crossfade_lottie(embed_mode="none"):
    """
    embed_mode: 'none' (relative path /main-bears/), 'full' (lossless base64), 'optimized' (compressed base64)
    """
    assets = []
    for item in IMAGES:
        filepath = os.path.join(BASE_DIR, item["file"])
        if embed_mode == "none":
            assets.append({
                "id": item["id"],
                "w": WIDTH,
                "h": HEIGHT,
                "u": "/main-bears/",
                "p": item["file"],
                "e": 0
            })
        elif embed_mode == "full":
            data_uri = get_base64_image(filepath, optimize=False)
            assets.append({
                "id": item["id"],
                "w": WIDTH,
                "h": HEIGHT,
                "u": "",
                "p": data_uri,
                "e": 1
            })
        elif embed_mode == "optimized":
            data_uri = get_base64_image(filepath, optimize=True, max_size=800)
            assets.append({
                "id": item["id"],
                "w": WIDTH,
                "h": HEIGHT,
                "u": "",
                "p": data_uri,
                "e": 1
            })

    # Markers for stage jumping
    markers = []
    for i, item in enumerate(IMAGES):
        markers.append({
            "tm": i * STAGE_FRAMES,
            "cm": item["marker"],
            "dr": STAGE_FRAMES
        })

    # Build layers
    # In Lottie, layers are rendered back to front or index 1 is on top.
    # To keep layer order intuitive, higher index = rendered behind or we control strictly by opacity and ip/op.
    layers = []
    ind = 1

    # Gentle breathing and floating keyframe generator for a stage
    def make_floating_position(start_f, end_f, center_x=WIDTH/2, center_y=HEIGHT/2, amp=10):
        dur = end_f - start_f
        # 4 control points in the stage for a smooth sinusoidal wave
        steps = 4
        kfs = []
        for s in range(steps + 1):
            t = start_f + (s / steps) * dur
            # sine wave
            offset_y = amp * math.sin(s * 2 * math.pi / steps)
            kfs.append({
                "t": round(t, 2),
                "s": [center_x, center_y + offset_y, 0],
                "i": {"x": [0.42, 0.42, 0.42], "y": [1.0, 1.0, 1.0]},
                "o": {"x": [0.58, 0.58, 0.58], "y": [0.0, 0.0, 0.0]}
            })
        return {"a": 1, "k": kfs}

    def make_breathing_scale(start_f, end_f, base_scale=100.0, breath_amp=1.8):
        dur = end_f - start_f
        steps = 4
        kfs = []
        for s in range(steps + 1):
            t = start_f + (s / steps) * dur
            scale_val = base_scale + breath_amp * math.sin(s * 2 * math.pi / steps)
            kfs.append({
                "t": round(t, 2),
                "s": [round(scale_val, 2), round(scale_val, 2), 100.0],
                "i": {"x": [0.42, 0.42, 0.42], "y": [1.0, 1.0, 1.0]},
                "o": {"x": [0.58, 0.58, 0.58], "y": [0.0, 0.0, 0.0]}
            })
        return {"a": 1, "k": kfs}

    # Layers for each stage:
    # Stage 0: Eating (t = 0 to 75 + FADE)
    # Stage 1: Reading (t = 75 - FADE to 150 + FADE)
    # Stage 2: Raising PR (t = 150 - FADE to 225 + FADE)
    # Stage 3: Waving (t = 225 - FADE to 300)
    # Stage 0 Loop: Eating (t = 300 - FADE to 300) -> transitions smoothly back into Stage 0 at t=0

    # Let's create the layers in top-to-bottom rendering order:
    # 1. Stage 0 Loop Return (top layer, fades in at end 282..300)
    # 2. Stage 3 (fades in 207..225, visible until 300)
    # 3. Stage 2 (fades in 132..150, visible until 225)
    # 4. Stage 1 (fades in 57..75, visible until 150)
    # 5. Stage 0 (base layer, visible 0..75)

    # 1. Loop transition layer (Stage 0 fading in over Stage 3 at the very end)
    loop_start = TOTAL_FRAMES - FADE_FRAMES
    loop_end = TOTAL_FRAMES
    layers.append({
        "ddd": 0,
        "ind": ind,
        "ty": 2,
        "nm": "Loop Return - Eating Repos",
        "cl": "png",
        "refId": IMAGES[0]["id"],
        "sr": 1,
        "ks": {
            "o": {
                "a": 1,
                "k": [
                    {
                        "t": loop_start,
                        "s": [0],
                        "i": {"x": [0.42], "y": [1.0]},
                        "o": {"x": [0.58], "y": [0.0]}
                    },
                    {
                        "t": loop_end,
                        "s": [100]
                    }
                ]
            },
            "r": {"a": 0, "k": 0},
            "p": make_floating_position(loop_start, loop_end, amp=8),
            "a": {"a": 0, "k": [WIDTH / 2, HEIGHT / 2, 0]},
            "s": make_breathing_scale(loop_start, loop_end, breath_amp=1.2)
        },
        "ao": 0,
        "ip": loop_start,
        "op": loop_end,
        "st": 0,
        "bm": 0
    })
    ind += 1

    # Stage 3: Waving (enters at 225 - FADE = 207, solid at 225..300)
    s3_in = 3 * STAGE_FRAMES - FADE_FRAMES
    s3_solid = 3 * STAGE_FRAMES
    s3_out = TOTAL_FRAMES
    layers.append({
        "ddd": 0,
        "ind": ind,
        "ty": 2,
        "nm": f"Stage 4 - {IMAGES[3]['title']}",
        "cl": "png",
        "refId": IMAGES[3]["id"],
        "sr": 1,
        "ks": {
            "o": {
                "a": 1,
                "k": [
                    {
                        "t": s3_in,
                        "s": [0],
                        "i": {"x": [0.42], "y": [1.0]},
                        "o": {"x": [0.58], "y": [0.0]}
                    },
                    {
                        "t": s3_solid,
                        "s": [100],
                        "i": {"x": [0.42], "y": [1.0]},
                        "o": {"x": [0.58], "y": [0.0]}
                    },
                    {
                        "t": s3_out,
                        "s": [100]
                    }
                ]
            },
            "r": {"a": 0, "k": 0},
            "p": make_floating_position(s3_in, s3_out, amp=10),
            "a": {"a": 0, "k": [WIDTH / 2, HEIGHT / 2, 0]},
            "s": make_breathing_scale(s3_in, s3_out, breath_amp=1.8)
        },
        "ao": 0,
        "ip": s3_in,
        "op": s3_out,
        "st": 0,
        "bm": 0
    })
    ind += 1

    # Stage 2: Raising PR (enters at 150 - FADE = 132, solid at 150..225)
    s2_in = 2 * STAGE_FRAMES - FADE_FRAMES
    s2_solid = 2 * STAGE_FRAMES
    s2_out = 3 * STAGE_FRAMES
    layers.append({
        "ddd": 0,
        "ind": ind,
        "ty": 2,
        "nm": f"Stage 3 - {IMAGES[2]['title']}",
        "cl": "png",
        "refId": IMAGES[2]["id"],
        "sr": 1,
        "ks": {
            "o": {
                "a": 1,
                "k": [
                    {
                        "t": s2_in,
                        "s": [0],
                        "i": {"x": [0.42], "y": [1.0]},
                        "o": {"x": [0.58], "y": [0.0]}
                    },
                    {
                        "t": s2_solid,
                        "s": [100],
                        "i": {"x": [0.42], "y": [1.0]},
                        "o": {"x": [0.58], "y": [0.0]}
                    },
                    {
                        "t": s2_out,
                        "s": [100]
                    }
                ]
            },
            "r": {"a": 0, "k": 0},
            "p": make_floating_position(s2_in, s2_out, amp=10),
            "a": {"a": 0, "k": [WIDTH / 2, HEIGHT / 2, 0]},
            "s": make_breathing_scale(s2_in, s2_out, breath_amp=1.8)
        },
        "ao": 0,
        "ip": s2_in,
        "op": s2_out,
        "st": 0,
        "bm": 0
    })
    ind += 1

    # Stage 1: Reading Repos (enters at 75 - FADE = 57, solid at 75..150)
    s1_in = 1 * STAGE_FRAMES - FADE_FRAMES
    s1_solid = 1 * STAGE_FRAMES
    s1_out = 2 * STAGE_FRAMES
    layers.append({
        "ddd": 0,
        "ind": ind,
        "ty": 2,
        "nm": f"Stage 2 - {IMAGES[1]['title']}",
        "cl": "png",
        "refId": IMAGES[1]["id"],
        "sr": 1,
        "ks": {
            "o": {
                "a": 1,
                "k": [
                    {
                        "t": s1_in,
                        "s": [0],
                        "i": {"x": [0.42], "y": [1.0]},
                        "o": {"x": [0.58], "y": [0.0]}
                    },
                    {
                        "t": s1_solid,
                        "s": [100],
                        "i": {"x": [0.42], "y": [1.0]},
                        "o": {"x": [0.58], "y": [0.0]}
                    },
                    {
                        "t": s1_out,
                        "s": [100]
                    }
                ]
            },
            "r": {"a": 0, "k": 0},
            "p": make_floating_position(s1_in, s1_out, amp=10),
            "a": {"a": 0, "k": [WIDTH / 2, HEIGHT / 2, 0]},
            "s": make_breathing_scale(s1_in, s1_out, breath_amp=1.8)
        },
        "ao": 0,
        "ip": s1_in,
        "op": s1_out,
        "st": 0,
        "bm": 0
    })
    ind += 1

    # Stage 0: Eating Repos (Base layer, visible 0..75)
    s0_in = 0
    s0_out = 1 * STAGE_FRAMES
    layers.append({
        "ddd": 0,
        "ind": ind,
        "ty": 2,
        "nm": f"Stage 1 - {IMAGES[0]['title']}",
        "cl": "png",
        "refId": IMAGES[0]["id"],
        "sr": 1,
        "ks": {
            "o": {
                "a": 0,
                "k": 100
            },
            "r": {"a": 0, "k": 0},
            "p": make_floating_position(s0_in, s0_out, amp=10),
            "a": {"a": 0, "k": [WIDTH / 2, HEIGHT / 2, 0]},
            "s": make_breathing_scale(s0_in, s0_out, breath_amp=1.8)
        },
        "ao": 0,
        "ip": s0_in,
        "op": s0_out,
        "st": 0,
        "bm": 0
    })

    lottie_data = {
        "v": "5.7.4",
        "fr": FPS,
        "ip": 0,
        "op": TOTAL_FRAMES,
        "w": WIDTH,
        "h": HEIGHT,
        "nm": "Bear Lifecycle Animation - Git Heal",
        "ddd": 0,
        "assets": assets,
        "layers": layers,
        "markers": markers
    }

    return lottie_data

def build_slide_transition_lottie(embed_mode="none"):
    """
    Slide transition: Each stage slides in smoothly from right (X + 250px) while fading in.
    Previous stage slides slightly to left (X - 100px) while fading out.
    """
    assets = []
    for item in IMAGES:
        filepath = os.path.join(BASE_DIR, item["file"])
        if embed_mode == "none":
            assets.append({
                "id": item["id"],
                "w": WIDTH,
                "h": HEIGHT,
                "u": "/main-bears/",
                "p": item["file"],
                "e": 0
            })
        elif embed_mode == "full":
            data_uri = get_base64_image(filepath, optimize=False)
            assets.append({
                "id": item["id"],
                "w": WIDTH,
                "h": HEIGHT,
                "u": "",
                "p": data_uri,
                "e": 1
            })

    markers = []
    for i, item in enumerate(IMAGES):
        markers.append({
            "tm": i * STAGE_FRAMES,
            "cm": item["marker"],
            "dr": STAGE_FRAMES
        })

    TRANS_DUR = 20 # 20 frames = ~0.66s transition
    cx, cy = WIDTH / 2, HEIGHT / 2
    layers = []
    ind = 1

    # Loop Return Layer (Stage 0 sliding in over Stage 3 at t = 280..300)
    loop_in = TOTAL_FRAMES - TRANS_DUR
    loop_end = TOTAL_FRAMES
    layers.append({
        "ddd": 0,
        "ind": ind,
        "ty": 2,
        "nm": "Loop Return Slide - Eating Repos",
        "cl": "png",
        "refId": IMAGES[0]["id"],
        "sr": 1,
        "ks": {
            "o": {
                "a": 1,
                "k": [
                    {"t": loop_in, "s": [0], "i": {"x": [0.25], "y": [1.0]}, "o": {"x": [0.25], "y": [0.0]}},
                    {"t": loop_end, "s": [100]}
                ]
            },
            "r": {"a": 0, "k": 0},
            "p": {
                "a": 1,
                "k": [
                    {"t": loop_in, "s": [cx + 350, cy, 0], "i": {"x": [0.25, 0.25, 0.25], "y": [1.0, 1.0, 1.0]}, "o": {"x": [0.25, 0.25, 0.25], "y": [0.0, 0.0, 0.0]}},
                    {"t": loop_end, "s": [cx, cy, 0]}
                ]
            },
            "a": {"a": 0, "k": [cx, cy, 0]},
            "s": {
                "a": 1,
                "k": [
                    {"t": loop_in, "s": [95, 95, 100], "i": {"x": [0.25, 0.25, 0.25], "y": [1.0, 1.0, 1.0]}, "o": {"x": [0.25, 0.25, 0.25], "y": [0.0, 0.0, 0.0]}},
                    {"t": loop_end, "s": [100, 100, 100]}
                ]
            }
        },
        "ao": 0,
        "ip": loop_in,
        "op": loop_end,
        "st": 0,
        "bm": 0
    })
    ind += 1

    for i in reversed(range(len(IMAGES))):
        st_start = i * STAGE_FRAMES
        st_end = (i + 1) * STAGE_FRAMES

        # Entry transition
        t_enter = max(0, st_start - TRANS_DUR)
        t_solid = st_start
        t_exit = st_end

        # Layer lifespan:
        ip = 0 if i == 0 else t_enter
        op = t_exit

        # Opacity keyframes
        o_kfs = []
        if i > 0:
            o_kfs.append({"t": t_enter, "s": [0], "i": {"x": [0.25], "y": [1.0]}, "o": {"x": [0.25], "y": [0.0]}})
            o_kfs.append({"t": t_solid, "s": [100], "i": {"x": [0.25], "y": [1.0]}, "o": {"x": [0.25], "y": [0.0]}})
        else:
            o_kfs.append({"t": 0, "s": [100], "i": {"x": [0.25], "y": [1.0]}, "o": {"x": [0.25], "y": [0.0]}})

        o_kfs.append({"t": t_exit, "s": [100]})

        # Position keyframes
        p_kfs = []
        if i > 0:
            p_kfs.append({"t": t_enter, "s": [cx + 350, cy, 0], "i": {"x": [0.22, 0.22, 0.22], "y": [1.0, 1.0, 1.0]}, "o": {"x": [0.25, 0.25, 0.25], "y": [0.0, 0.0, 0.0]}})
            p_kfs.append({"t": t_solid, "s": [cx, cy, 0], "i": {"x": [0.42, 0.42, 0.42], "y": [1.0, 1.0, 1.0]}, "o": {"x": [0.58, 0.58, 0.58], "y": [0.0, 0.0, 0.0]}})
        else:
            p_kfs.append({"t": 0, "s": [cx, cy, 0], "i": {"x": [0.42, 0.42, 0.42], "y": [1.0, 1.0, 1.0]}, "o": {"x": [0.58, 0.58, 0.58], "y": [0.0, 0.0, 0.0]}})

        # Gentle float during active window
        half_t = (t_solid + t_exit) / 2
        p_kfs.append({"t": half_t, "s": [cx, cy - 8, 0], "i": {"x": [0.42, 0.42, 0.42], "y": [1.0, 1.0, 1.0]}, "o": {"x": [0.58, 0.58, 0.58], "y": [0.0, 0.0, 0.0]}})
        p_kfs.append({"t": t_exit, "s": [cx, cy, 0]})

        # Scale keyframes
        s_kfs = []
        if i > 0:
            s_kfs.append({"t": t_enter, "s": [95, 95, 100], "i": {"x": [0.25, 0.25, 0.25], "y": [1.0, 1.0, 1.0]}, "o": {"x": [0.25, 0.25, 0.25], "y": [0.0, 0.0, 0.0]}})
            s_kfs.append({"t": t_solid, "s": [100, 100, 100], "i": {"x": [0.42, 0.42, 0.42], "y": [1.0, 1.0, 1.0]}, "o": {"x": [0.58, 0.58, 0.58], "y": [0.0, 0.0, 0.0]}})
        else:
            s_kfs.append({"t": 0, "s": [100, 100, 100], "i": {"x": [0.42, 0.42, 0.42], "y": [1.0, 1.0, 1.0]}, "o": {"x": [0.58, 0.58, 0.58], "y": [0.0, 0.0, 0.0]}})

        s_kfs.append({"t": half_t, "s": [101.5, 101.5, 100], "i": {"x": [0.42, 0.42, 0.42], "y": [1.0, 1.0, 1.0]}, "o": {"x": [0.58, 0.58, 0.58], "y": [0.0, 0.0, 0.0]}})
        s_kfs.append({"t": t_exit, "s": [100, 100, 100]})

        layers.append({
            "ddd": 0,
            "ind": ind,
            "ty": 2,
            "nm": f"Stage {i+1} - {IMAGES[i]['title']}",
            "cl": "png",
            "refId": IMAGES[i]["id"],
            "sr": 1,
            "ks": {
                "o": {"a": 1, "k": o_kfs},
                "r": {"a": 0, "k": 0},
                "p": {"a": 1, "k": p_kfs},
                "a": {"a": 0, "k": [cx, cy, 0]},
                "s": {"a": 1, "k": s_kfs}
            },
            "ao": 0,
            "ip": ip,
            "op": op,
            "st": 0,
            "bm": 0
        })
        ind += 1

    lottie_data = {
        "v": "5.7.4",
        "fr": FPS,
        "ip": 0,
        "op": TOTAL_FRAMES,
        "w": WIDTH,
        "h": HEIGHT,
        "nm": "Bear Lifecycle Slide Animation - Git Heal",
        "ddd": 0,
        "assets": assets,
        "layers": layers,
        "markers": markers
    }
    return lottie_data

if __name__ == "__main__":
    print("Generating Lottie animations...")

    # 1. Main Smooth Crossfade (Web-friendly, relative assets)
    crossfade_lottie = build_smooth_crossfade_lottie(embed_mode="none")
    p1 = os.path.join(OUT_DIR, "bear-transition.json")
    with open(p1, "w", encoding="utf-8") as f:
        json.dump(crossfade_lottie, f, indent=2)
    print(f"Created: {p1} ({os.path.getsize(p1):,} bytes)")

    # 2. Slide Transition (Web-friendly, relative assets)
    slide_lottie = build_slide_transition_lottie(embed_mode="none")
    p2 = os.path.join(OUT_DIR, "bear-slide-transition.json")
    with open(p2, "w", encoding="utf-8") as f:
        json.dump(slide_lottie, f, indent=2)
    print(f"Created: {p2} ({os.path.getsize(p2):,} bytes)")

    # 3. Optimized Embedded Lottie (High-res compressed base64, fully standalone ~500KB)
    opt_lottie = build_smooth_crossfade_lottie(embed_mode="optimized")
    p3 = os.path.join(OUT_DIR, "bear-transition-embedded-optimized.json")
    with open(p3, "w", encoding="utf-8") as f:
        json.dump(opt_lottie, f, indent=2)
    print(f"Created: {p3} ({os.path.getsize(p3):,} bytes)")

    # 4. Full-res Embedded Lottie (Standalone, 100% lossless)
    full_lottie = build_smooth_crossfade_lottie(embed_mode="full")
    p4 = os.path.join(OUT_DIR, "bear-transition-embedded.json")
    with open(p4, "w", encoding="utf-8") as f:
        json.dump(full_lottie, f, indent=2)
    print(f"Created: {p4} ({os.path.getsize(p4):,} bytes)")

    print("All Lottie animations created successfully!")
