"""
Test script for Layer 5 Color Intelligence
"""

import os
import json
from backend.color_intelligence import analyze_color_intelligence

def main():
    person_path = os.path.abspath("backend/tryon_results/test_person_input.png")
    garment_path = os.path.abspath("backend/tryon_results/test_clean_garment.png")

    print("=== Testing Color Intelligence Engine ===")
    res = analyze_color_intelligence(person_path, garment_path)
    print(json.dumps(res, indent=2))
    assert res["success"] is True
    assert "dominant_color" in res["garment_colors"]
    assert "undertone" in res["user_skin"]
    assert "compatibility_score" in res["compatibility"]
    assert len(res["alternatives"]) == 4
    print("\nALL COLOR INTELLIGENCE ASSERTIONS PASSED!")

if __name__ == "__main__":
    main()
