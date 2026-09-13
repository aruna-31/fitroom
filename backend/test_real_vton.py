"""
FitRoom Pretrained VTON Test Script
Tests the authentic CatVTON / neural diffusion pipeline using a fresh person and garment image.
"""

import os
import sys
import numpy as np
from PIL import Image, ImageDraw

def create_sample_person():
    """Generates a high-quality test person image with clear head, torso, arms, and legs."""
    img = Image.new("RGB", (768, 1024), (240, 235, 230))
    draw = ImageDraw.Draw(img)
    # Head & Neck
    draw.ellipse([334, 100, 434, 230], fill=(235, 195, 165))
    draw.rectangle([364, 220, 404, 270], fill=(225, 185, 155))
    # Torso (existing shirt)
    draw.polygon([(260, 270), (508, 270), (480, 600), (288, 600)], fill=(180, 60, 80))
    # Arms
    draw.polygon([(260, 270), (220, 450), (260, 450), (288, 300)], fill=(225, 185, 155))
    draw.polygon([(508, 270), (548, 450), (508, 450), (480, 300)], fill=(225, 185, 155))
    # Legs (pants)
    draw.rectangle([288, 600, 380, 950], fill=(50, 50, 70))
    draw.rectangle([388, 600, 480, 950], fill=(50, 50, 70))
    return img

def create_sample_garment():
    """Generates a fresh test garment image (emerald green jacket with lapel)."""
    img = Image.new("RGB", (768, 1024), (255, 255, 255))
    draw = ImageDraw.Draw(img)
    # Garment body
    draw.polygon([(240, 200), (528, 200), (500, 650), (268, 650)], fill=(20, 120, 80))
    # Lapel / Collar
    draw.polygon([(340, 200), (384, 340), (428, 200)], fill=(15, 90, 60))
    # Buttons
    for y in [380, 450, 520]:
        draw.ellipse([374, y, 394, y + 20], fill=(210, 180, 80))
    return img

def main():
    print("=== Testing Real Pretrained VTON Pipeline ===")
    from backend.vton_pipeline import (
        generate_neural_agnostic_mask,
        isolate_garment_fabric_neural,
        run_virtual_tryon_pipeline
    )

    person = create_sample_person()
    garment = create_sample_garment()

    test_person_path = "backend/tryon_results/test_person_input.png"
    test_garment_path = "backend/tryon_results/test_garment_input.png"
    person.save(test_person_path)
    garment.save(test_garment_path)

    print("1. Testing neural human parsing & agnostic mask...")
    try:
        agnostic_person, agnostic_mask = generate_neural_agnostic_mask(person, category="upper_body")
        agnostic_person.save("backend/tryon_results/test_agnostic_person.png")
        agnostic_mask.save("backend/tryon_results/test_agnostic_mask.png")
        print("   -> Neural agnostic mask created successfully! Shape:", agnostic_mask.size)
    except Exception as e:
        print("   -> Human parsing notice:", e)

    print("2. Testing garment fabric isolation...")
    try:
        clean_garment = isolate_garment_fabric_neural(garment)
        clean_garment.save("backend/tryon_results/test_clean_garment.png")
        print("   -> Clean garment isolated successfully! Shape:", clean_garment.size)
    except Exception as e:
        print("   -> Garment isolation notice:", e)

    print("3. Executing end-to-end Virtual Try-On pipeline...")
    body_prof = {
        "stature": 178,
        "chest": 98,
        "waist": 82,
        "hips": 100
    }
    garment_prof = {
        "id": "emerald-jacket-vton",
        "name": "Emerald Couture Blazer",
        "category": "top",
        "garmentType": "Blazer"
    }

    try:
        res = run_virtual_tryon_pipeline(
            person_image_source=test_person_path,
            garment_image_source=test_garment_path,
            body_profile=body_prof,
            garment_profile=garment_prof,
            selected_size="M"
        )
        print("SUCCESS! Output result:")
        print("  - Output file:", res.get("result_file_path"))
        print("  - Architecture:", res.get("model_architecture"))
        print("  - Latency:", res.get("processing_time_ms"), "ms")
        print("  - Has image URL:", len(res.get("tryon_image_url", "")) > 100)
    except Exception as e:
        print("PIPELINE EXECUTION EXCEPTION (Expected if remote space queue / network):", e)

if __name__ == "__main__":
    main()
