"""
FitRoom Layer 5 - Color Intelligence Engine
Performs real pixel-level chromatic analysis on actual garment and user images.
Calculates dominant/secondary garment colors, user skin tone & undertones via CIELAB/ITA,
mathematical compatibility score with explainable reasoning, and algorithmic alternative palettes.
"""

import io
import math
import base64
import numpy as np
import cv2
from PIL import Image, ImageOps
import httpx
from typing import Dict, Any, List, Tuple, Optional

# Color name reference dictionary in LAB space
COLOR_DICTIONARY = [
    {"name": "Midnight Black", "rgb": (20, 20, 25), "lab": (8, 0, -2)},
    {"name": "Charcoal Grey", "rgb": (60, 64, 68), "lab": (27, -1, -2)},
    {"name": "Silver Mist", "rgb": (195, 200, 205), "lab": (80, -1, -3)},
    {"name": "Pure Ivory", "rgb": (245, 245, 240), "lab": (96, -1, 3)},
    {"name": "Navy Blue", "rgb": (20, 35, 75), "lab": (16, 8, -28)},
    {"name": "Royal Cobalt", "rgb": (30, 80, 180), "lab": (38, 22, -61)},
    {"name": "Sky Cerulean", "rgb": (100, 180, 230), "lab": (71, -15, -31)},
    {"name": "Emerald Green", "rgb": (20, 120, 75), "lab": (45, -42, 17)},
    {"name": "Forest Pine", "rgb": (25, 70, 45), "lab": (27, -24, 11)},
    {"name": "Sage Olive", "rgb": (140, 160, 120), "lab": (64, -14, 20)},
    {"name": "Crimson Ruby", "rgb": (180, 25, 45), "lab": (38, 59, 34)},
    {"name": "Burgundy Wine", "rgb": (100, 20, 40), "lab": (22, 39, 14)},
    {"name": "Sunset Coral", "rgb": (235, 100, 80), "lab": (58, 51, 37)},
    {"name": "Terracotta Rust", "rgb": (190, 85, 55), "lab": (48, 41, 39)},
    {"name": "Mustard Saffron", "rgb": (220, 165, 35), "lab": (70, 11, 68)},
    {"name": "Golden Honey", "rgb": (225, 190, 110), "lab": (78, 4, 46)},
    {"name": "Lavender Lilac", "rgb": (180, 150, 210), "lab": (66, 21, -25)},
    {"name": "Plum Violet", "rgb": (110, 40, 120), "lab": (31, 41, -28)},
    {"name": "Rose Blush", "rgb": (225, 160, 175), "lab": (72, 27, 4)},
    {"name": "Camel Khaki", "rgb": (185, 150, 105), "lab": (64, 7, 29)},
    {"name": "Denim Indigo", "rgb": (45, 75, 125), "lab": (33, 3, -33)},
]


def load_image_np(source: str) -> np.ndarray:
    """Loads image source into RGB NumPy array."""
    if not source:
        raise ValueError("Image source is required.")

    if source.startswith("data:image"):
        header, base64_data = source.split(",", 1)
        image_bytes = base64.b64decode(base64_data)
        img = Image.open(io.BytesIO(image_bytes))
        img = ImageOps.exif_transpose(img)
        return np.array(img.convert("RGB"))

    if source.startswith("http://") or source.startswith("https://"):
        resp = httpx.get(source, timeout=15.0, follow_redirects=True)
        resp.raise_for_status()
        img = Image.open(io.BytesIO(resp.content))
        img = ImageOps.exif_transpose(img)
        return np.array(img.convert("RGB"))

    img = Image.open(source)
    img = ImageOps.exif_transpose(img)
    return np.array(img.convert("RGB"))


def rgb_to_hex(r: int, g: int, b: int) -> str:
    """Converts RGB integers (0-255) to hex string."""
    return f"#{int(r):02x}{int(g):02x}{int(b):02x}".upper()


def match_color_name(rgb: Tuple[int, int, int], lab: Tuple[float, float, float]) -> str:
    """Finds closest color name in CIELAB color space."""
    min_dist = float("inf")
    best_name = "Custom Shade"
    for ref in COLOR_DICTIONARY:
        dist = math.sqrt(
            (lab[0] - ref["lab"][0]) ** 2 +
            (lab[1] - ref["lab"][1]) ** 2 +
            (lab[2] - ref["lab"][2]) ** 2
        )
        if dist < min_dist:
            min_dist = dist
            best_name = ref["name"]
    return best_name


def extract_garment_colors(garment_img_np: np.ndarray) -> Dict[str, Any]:
    """
    Extracts dominant and secondary garment colors using real K-Means clustering
    in CIELAB space, ignoring white background / transparent pixels.
    """
    h, w = garment_img_np.shape[:2]
    rgb = garment_img_np.reshape(-1, 3)

    # Filter out near-white background pixels (R,G,B > 240) and pure black borders
    mask = ~((rgb[:, 0] > 235) & (rgb[:, 1] > 235) & (rgb[:, 2] > 235)) & ~((rgb[:, 0] < 15) & (rgb[:, 1] < 15) & (rgb[:, 2] < 15))
    cloth_pixels = rgb[mask]

    if len(cloth_pixels) < 100:
        cloth_pixels = rgb  # fallback to all pixels if mask is too aggressive

    # Convert to CIELAB float32
    cloth_pixels_f = cloth_pixels.astype(np.float32) / 255.0
    cloth_lab = cv2.cvtColor(cloth_pixels_f.reshape(-1, 1, 3), cv2.COLOR_RGB2LAB).reshape(-1, 3)

    # K-Means clustering with k=3
    k = min(3, len(cloth_pixels))
    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 15, 1.0)
    _, labels, centers_lab = cv2.kmeans(cloth_lab, k, None, criteria, 5, cv2.KMEANS_PP_CENTERS)

    # Calculate cluster percentages
    unique, counts = np.unique(labels, return_counts=True)
    cluster_order = np.argsort(-counts)

    clusters = []
    for idx in cluster_order:
        pct = float(counts[idx] / len(cloth_pixels))
        center_l, center_a, center_b = centers_lab[idx]

        # Convert center LAB back to RGB
        lab_pixel = np.array([[[center_l, center_a, center_b]]], dtype=np.float32)
        rgb_center = cv2.cvtColor(lab_pixel, cv2.COLOR_LAB2RGB)[0, 0] * 255.0
        r, g, b = int(np.clip(rgb_center[0], 0, 255)), int(np.clip(rgb_center[1], 0, 255)), int(np.clip(rgb_center[2], 0, 255))
        
        # HSV metrics
        hsv_pixel = cv2.cvtColor(np.array([[[r, g, b]]], dtype=np.uint8), cv2.COLOR_RGB2HSV)[0, 0]
        hue = int(hsv_pixel[0] * 2)  # 0-360 deg
        saturation = int(hsv_pixel[1] / 255.0 * 100)
        value = int(hsv_pixel[2] / 255.0 * 100)

        name = match_color_name((r, g, b), (center_l, center_a, center_b))

        # Temperature
        is_warm = (hue < 75 or hue > 320)
        temp_str = "Warm" if is_warm else ("Cool" if 135 < hue < 290 else "Neutral")

        clusters.append({
            "name": name,
            "hex": rgb_to_hex(r, g, b),
            "rgb": [r, g, b],
            "lab": [round(float(center_l), 1), round(float(center_a), 1), round(float(center_b), 1)],
            "hsv": [hue, saturation, value],
            "percentage": round(pct * 100, 1),
            "temperature": temp_str
        })

    dominant = clusters[0] if clusters else {}
    secondary = clusters[1] if len(clusters) > 1 else None

    return {
        "dominant_color": dominant,
        "secondary_color": secondary,
        "all_palette": clusters
    }


def estimate_user_skin_characteristics(person_img_np: np.ndarray) -> Dict[str, Any]:
    """
    Estimates user skin chromaticity using face detection and dermal region sampling.
    Excludes hair, eyes, lips, and background. Computes ITA and undertone.
    """
    h, w = person_img_np.shape[:2]
    rgb = person_img_np

    # 1. Focus primarily on the visible FACE & NECK region (y: 6% to 42%, x: 26% to 74%)
    face_crop = rgb[int(h * 0.06):int(h * 0.42), int(w * 0.26):int(w * 0.74)]
    fh, fw = face_crop.shape[:2]

    # Skin segmentation in YCrCb & HSV
    ycrcb = cv2.cvtColor(face_crop, cv2.COLOR_RGB2YCrCb)
    skin_ycrcb = cv2.inRange(
        ycrcb,
        np.array([0, 133, 77], dtype=np.uint8),
        np.array([255, 173, 127], dtype=np.uint8)
    )

    hsv = cv2.cvtColor(face_crop, cv2.COLOR_RGB2HSV)
    skin_hsv = cv2.inRange(
        hsv,
        np.array([0, 18, 45], dtype=np.uint8),
        np.array([32, 230, 255], dtype=np.uint8)
    )

    skin_mask = cv2.bitwise_and(skin_ycrcb, skin_hsv)

    # 2. Exclude non-skin features:
    # - Dark hair/eyebrows/pupils (L* < 28 or V < 40)
    # - Bright specular glare (L* > 94 or S < 12)
    # - Lips / lipstick (a* > 28)
    face_lab = cv2.cvtColor((face_crop.astype(np.float32) / 255.0), cv2.COLOR_RGB2LAB)
    valid_skin_mask = (
        (skin_mask > 0) & 
        (face_lab[:, :, 0] > 28) & 
        (face_lab[:, :, 0] < 94) & 
        (face_lab[:, :, 1] < 28)
    )

    skin_pixels = face_crop[valid_skin_mask]

    # Fallback to central facial locus if strict mask yields too few pixels
    if len(skin_pixels) < 200:
        center_crop = face_crop[int(fh * 0.25):int(fh * 0.75), int(fw * 0.25):int(fw * 0.75)].reshape(-1, 3)
        skin_pixels = center_crop
        confidence = 0.68
        confidence_label = "Color analysis confidence is low"
    else:
        # Confidence calculated from pixel variance and cluster uniformity
        std_rgb = np.std(skin_pixels, axis=0)
        confidence = round(float(np.clip(1.0 - (np.mean(std_rgb) / 90.0), 0.78, 0.96)), 2)
        confidence_label = "Optimal Facial Sampling"

    # Convert sampled skin pixels to CIELAB
    skin_pixels_f = skin_pixels.astype(np.float32) / 255.0
    skin_lab = cv2.cvtColor(skin_pixels_f.reshape(-1, 1, 3), cv2.COLOR_RGB2LAB).reshape(-1, 3)

    # Median skin values (robust against specular highlights and shadows)
    l_star = float(np.median(skin_lab[:, 0]))
    a_star = float(np.median(skin_lab[:, 1]))
    b_star = float(np.median(skin_lab[:, 2]))

    # Mean RGB
    mean_rgb = np.mean(skin_pixels, axis=0)
    r, g, b = int(np.clip(mean_rgb[0], 0, 255)), int(np.clip(mean_rgb[1], 0, 255)), int(np.clip(mean_rgb[2], 0, 255))

    # 3. Individual Typology Angle (ITA) Calculation:
    # ITA = arctan((L* - 50) / b*) * (180 / pi)
    denom = max(b_star, 1.0)
    ita_deg = math.atan((l_star - 50.0) / denom) * (180.0 / math.pi)

    # Estimated Skin Tone Category
    if ita_deg > 55:
        skin_type = "Very Light"
    elif ita_deg > 41:
        skin_type = "Light / Fair"
    elif ita_deg > 28:
        skin_type = "Intermediate / Medium"
    elif ita_deg > 10:
        skin_type = "Tan / Golden"
    elif ita_deg > -30:
        skin_type = "Deep / Rich"
    else:
        skin_type = "Very Deep"

    # 4. Estimated Undertone Calculation (b* yellowness vs a* redness balance)
    ab_ratio = b_star / max(a_star, 1.0)
    if ab_ratio > 1.45:
        undertone = "Warm Golden"
    elif ab_ratio < 0.95:
        undertone = "Cool Rosy"
    elif 0.95 <= ab_ratio <= 1.25 and a_star < 12:
        undertone = "Olive"
    else:
        undertone = "Neutral Balanced"

    # 5. Generate Fashion-Oriented Recommended Colors Palette
    if "Warm" in undertone:
        recommended_colors = [
            {"name": "Emerald Green", "hex": "#15764F", "reason": "Rich jewel contrast accentuating warm golden skin glow."},
            {"name": "Royal Cobalt", "hex": "#153A76", "reason": "Crisp cool complement providing striking facial definition."},
            {"name": "Burgundy Wine", "hex": "#641428", "reason": "Deep harmonious warmth that grounds the complexion."},
            {"name": "Mustard Saffron", "hex": "#DC973F", "reason": "Analogous radiant warmth complementing natural dermal tones."},
            {"name": "Pure Ivory", "hex": "#F5F5F0", "reason": "High-luminance crisp neutral that illuminates features."}
        ]
        colors_to_avoid = [
            {"name": "Washed Ash Grey", "hex": "#A8A8A8", "reason": "Mutes natural golden warmth and creates dermal fatigue."},
            {"name": "Fluorescent Neon", "hex": "#D4FF00", "reason": "Harsh artificial clash against natural warm melanin."},
            {"name": "Pale Mud Khaki", "hex": "#8C8472", "reason": "Lacks sufficient luminance contrast against warm skin."}
        ]
    elif "Cool" in undertone:
        recommended_colors = [
            {"name": "Royal Sapphire", "hex": "#153A76", "reason": "Direct analogous harmony enhancing cool porcelain radiance."},
            {"name": "Forest Pine", "hex": "#14784B", "reason": "Sophisticated deep green creating crisp silhouette definition."},
            {"name": "Crimson Ruby", "hex": "#B4192D", "reason": "Vibrant chromatic contrast accentuating rosy undertones."},
            {"name": "Sky Cerulean", "hex": "#64B4E6", "reason": "Bright refreshing pastel providing daytime lift."},
            {"name": "Charcoal Slate", "hex": "#3C4044", "reason": "Timeless dark neutral framing facial contours cleanly."}
        ]
        colors_to_avoid = [
            {"name": "Muddy Mustard", "hex": "#C8A028", "reason": "Yellow-green cast conflicts with cool pinkish skin undertones."},
            {"name": "Warm Terracotta", "hex": "#C85A32", "reason": "Creates jarring clash against cool rosy complexion."},
            {"name": "Dull Olive", "hex": "#6E784B", "reason": "Can impart a sallow appearance to cool skin tones."}
        ]
    elif "Olive" in undertone:
        recommended_colors = [
            {"name": "Rich Plum", "hex": "#6E2878", "reason": "Complementary purple tone neutralizing excess green cast."},
            {"name": "Terracotta Rust", "hex": "#B44628", "reason": "Earthy warm red bringing radiant energy to olive skin."},
            {"name": "Navy Indigo", "hex": "#1E2850", "reason": "Deep classic contrast that sharpens facial jawline."},
            {"name": "Sage Olive", "hex": "#8CA078", "reason": "Subtle tonal harmony for elegant everyday wear."},
            {"name": "Golden Honey", "hex": "#D0B250", "reason": "Luminous highlight shade emphasizing healthy skin tone."}
        ]
        colors_to_avoid = [
            {"name": "Pastel Bubblegum", "hex": "#F0A0B4", "reason": "Exaggerates greenish undertone contrast unflatteringly."},
            {"name": "Pale Chartreuse", "hex": "#B4D246", "reason": "Blends into olive undertones without defining silhouette."},
            {"name": "Washed Tan", "hex": "#B4A08C", "reason": "Low-contrast muddying effect against medium olive skin."}
        ]
    else:  # Neutral Balanced
        recommended_colors = [
            {"name": "True Navy", "hex": "#142850", "reason": "Universal luxury neutral providing sharp contrast."},
            {"name": "Burgundy Wine", "hex": "#641428", "reason": "Rich jewel tone with balanced warm-cool resonance."},
            {"name": "Emerald Green", "hex": "#15764F", "reason": "Lush vibrant shade flattering neutral balance."},
            {"name": "Soft Cream", "hex": "#F5EFEB", "reason": "Gentle organic lift that highlights facial symmetry."},
            {"name": "Classic Charcoal", "hex": "#32363C", "reason": "Refined structural foundation for any formal silhouette."}
        ]
        colors_to_avoid = [
            {"name": "Low-Contrast Taupe", "hex": "#968C82", "reason": "Lacks sufficient value separation, creating a washed-out look."},
            {"name": "Muddy Ochre", "hex": "#9B7D32", "reason": "Dulls natural neutral skin clarity."}
        ]

    return {
        "skin_type": skin_type,
        "undertone": undertone,
        "ita_angle_degrees": round(ita_deg, 1),
        "lab": [round(l_star, 1), round(a_star, 1), round(b_star, 1)],
        "hex": rgb_to_hex(r, g, b),
        "rgb": [r, g, b],
        "confidence": confidence,
        "confidence_label": confidence_label,
        "recommended_colors": recommended_colors,
        "colors_to_avoid": colors_to_avoid
    }


def calculate_color_compatibility(
    garment_color: Dict[str, Any],
    user_skin: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Calculates optical color harmony and contrast metrics between garment and user skin.
    Returns composite score (0-100), harmonic type, and explainable natural language reasoning.
    """
    g_lab = garment_color.get("lab", [50, 0, 0])
    s_lab = user_skin.get("lab", [65, 10, 20])
    g_hsv = garment_color.get("hsv", [180, 50, 50])
    undertone = user_skin.get("undertone", "Neutral Balanced")
    skin_type = user_skin.get("skin_type", "Natural")

    # 1. Delta E (CIELAB Euclidean color distance)
    delta_e = math.sqrt(
        (g_lab[0] - s_lab[0]) ** 2 +
        (g_lab[1] - s_lab[1]) ** 2 +
        (g_lab[2] - s_lab[2]) ** 2
    )

    # 2. Luminance Contrast (prevent low-contrast washing out)
    delta_l = abs(g_lab[0] - s_lab[0])

    # 3. Harmonic Hue Compatibility
    g_hue = g_hsv[0]
    g_temp = garment_color.get("temperature", "Neutral")
    
    # Calculate synergy factor
    synergy = 0.0
    if "Warm" in undertone and g_temp in ["Warm", "Neutral"]:
        synergy += 26.0
    elif "Cool" in undertone and g_temp in ["Cool", "Neutral"]:
        synergy += 26.0
    elif "Olive" in undertone and (90 <= g_hue <= 240 or g_temp == "Neutral"):
        synergy += 26.0
    else:
        synergy += 18.0

    # Optimal Delta E for apparel is between 35 and 80
    if 35 <= delta_e <= 80:
        contrast_points = 44.0
    elif delta_e > 80:
        contrast_points = 38.0
    else:
        contrast_points = max(18.0, delta_e * 0.9)

    # Luminance separation
    lum_points = min(28.0, delta_l * 0.85)

    final_score = int(np.clip(contrast_points + synergy + lum_points, 52, 96))

    # Determine Harmonic Relationship
    if 150 <= g_hue <= 210:
        harmony_type = "Complementary Contrast"
    elif 30 <= g_hue <= 90:
        harmony_type = "Analogous Warmth"
    elif delta_l > 40:
        harmony_type = "High-Luminance Dynamic"
    else:
        harmony_type = "Harmonic Resonance"

    # Natural language explainable justification
    g_name = garment_color.get("name", "garment shade")
    explanation = (
        f"The selected {g_name} tone (Hue {g_hue}°, L* {g_lab[0]}) has good {final_score}% compatibility "
        f"with the estimated {undertone} undertone, providing a flattering silhouette with "
        f"{delta_l:.1f} luminance separation."
    )

    return {
        "compatibility_score": final_score,
        "harmony_type": harmony_type,
        "delta_e_contrast": round(delta_e, 1),
        "luminance_contrast": round(delta_l, 1),
        "explanation": explanation
    }


def analyze_color_intelligence(
    person_image_source: str,
    garment_image_source: str
) -> Dict[str, Any]:
    """
    Main entry point for Layer 5 Color Intelligence.
    Executes full chromatic pipeline on actual person face and garment pixels.
    """
    person_np = load_image_np(person_image_source)
    garment_np = load_image_np(garment_image_source)

    # 1. Garment Color Pixel Extraction
    garment_colors = extract_garment_colors(garment_np)

    # 2. User Skin & Visible Characteristics Estimation (from FACE)
    user_skin = estimate_user_skin_characteristics(person_np)

    # 3. Compatibility Evaluation
    compatibility = calculate_color_compatibility(
        garment_color=garment_colors["dominant_color"],
        user_skin=user_skin
    )

    return {
        "success": True,
        "garment_colors": garment_colors,
        "user_skin": user_skin,
        "compatibility": compatibility,
        "recommended_colors": user_skin.get("recommended_colors", []),
        "colors_to_avoid": user_skin.get("colors_to_avoid", [])
    }
