"""
FitRoom Layer 3 - Real Anthropometric Fit Engine
Performs biomechanical and tailored ease calculations using only verified body measurements
and actual garment size-chart data.
"""

from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field

import hashlib

# Unit conversion constants
INCH_TO_CM = 2.54
CM_TO_INCH = 1 / 2.54

def to_cm(val: float, unit: str) -> float:
    if val is None:
        return None
    return round(val * INCH_TO_CM if unit == 'in' else val, 2)

def to_in(val: float, unit: str) -> float:
    if val is None:
        return None
    return round(val if unit == 'in' else val * CM_TO_INCH, 2)

def generate_fingerprint(input_str: str) -> str:
    return hashlib.sha256(input_str.strip().lower().encode('utf-8')).hexdigest()[:16]

def infer_garment_type(title: str = "") -> str:
    t = (title or "").lower()
    if 't-shirt' in t or 'tee' in t: return 'T-Shirt'
    if 'hoodie' in t: return 'Hoodie'
    if 'sweater' in t or 'knitwear' in t: return 'Sweater'
    if 'shirt' in t or 'oxford' in t or 'button-up' in t: return 'Shirt'
    if 'blazer' in t or 'suit' in t: return 'Blazer'
    if 'trench' in t or 'coat' in t: return 'Coat'
    if 'jacket' in t: return 'Jacket'
    if 'jean' in t or 'denim' in t: return 'Jeans'
    if 'trouser' in t or 'pant' in t: return 'Trousers'
    if 'dress' in t: return 'Dress'
    if 'skirt' in t: return 'Skirt'
    return 'Apparel'

def infer_category(title: str = "", garment_type: str = "") -> str:
    t = f"{title} {garment_type}".lower()
    if any(k in t for k in ['jean', 'trouser', 'pant', 'short', 'skirt', 'jogger']):
        return 'Bottom'
    if any(k in t for k in ['blazer', 'coat', 'jacket', 'trench', 'parka', 'outerwear']):
        return 'Outerwear'
    if any(k in t for k in ['dress', 'gown', 'jumpsuit', 'romper']):
        return 'Dress'
    return 'Top'


# Ease threshold rules per garment category & fit silhouette (in Centimeters)
EASE_RULES = {
    'top': {
        'chest': {'min': 3.0, 'ideal_min': 5.0, 'ideal_max': 10.0, 'max': 16.0},
        'shoulder': {'min': -1.0, 'ideal_min': 0.5, 'ideal_max': 2.5, 'max': 5.0},
        'arm_length': {'min': -2.5, 'ideal_min': -1.0, 'ideal_max': 2.0, 'max': 5.0},
        'waist': {'min': 2.0, 'ideal_min': 4.0, 'ideal_max': 10.0, 'max': 16.0}
    },
    'shirt': {
        'chest': {'min': 4.0, 'ideal_min': 6.0, 'ideal_max': 10.0, 'max': 14.0},
        'shoulder': {'min': 0.0, 'ideal_min': 1.0, 'ideal_max': 2.5, 'max': 4.5},
        'arm_length': {'min': -1.5, 'ideal_min': 0.0, 'ideal_max': 2.0, 'max': 4.0},
        'waist': {'min': 3.0, 'ideal_min': 5.0, 'ideal_max': 9.0, 'max': 14.0}
    },
    'blazer': {
        'chest': {'min': 5.0, 'ideal_min': 7.0, 'ideal_max': 11.0, 'max': 15.0},
        'shoulder': {'min': 1.0, 'ideal_min': 1.5, 'ideal_max': 3.0, 'max': 5.0},
        'arm_length': {'min': -1.5, 'ideal_min': 0.0, 'ideal_max': 2.0, 'max': 4.0},
        'waist': {'min': 4.0, 'ideal_min': 6.0, 'ideal_max': 10.0, 'max': 15.0}
    },
    'outerwear': {
        'chest': {'min': 8.0, 'ideal_min': 11.0, 'ideal_max': 18.0, 'max': 24.0},
        'shoulder': {'min': 1.5, 'ideal_min': 2.5, 'ideal_max': 4.5, 'max': 7.0},
        'arm_length': {'min': -1.0, 'ideal_min': 0.5, 'ideal_max': 3.0, 'max': 6.0},
        'waist': {'min': 6.0, 'ideal_min': 9.0, 'ideal_max': 16.0, 'max': 22.0}
    },
    'bottom': {
        'waist': {'min': 0.0, 'ideal_min': 1.0, 'ideal_max': 3.0, 'max': 6.0},
        'hip': {'min': 2.0, 'ideal_min': 3.5, 'ideal_max': 7.0, 'max': 11.0},
        'inseam': {'min': -3.0, 'ideal_min': -1.0, 'ideal_max': 1.5, 'max': 4.0}
    },
    'dress': {
        'chest': {'min': 1.5, 'ideal_min': 3.0, 'ideal_max': 7.0, 'max': 12.0},
        'waist': {'min': 1.0, 'ideal_min': 2.5, 'ideal_max': 6.0, 'max': 10.0},
        'hip': {'min': 2.0, 'ideal_min': 4.0, 'ideal_max': 8.0, 'max': 14.0}
    }
}


def get_rule_category(garment_type: str, category: str) -> str:
    g = (garment_type or '').lower()
    c = (category or '').lower()
    if 'blazer' in g or 'suit' in g:
        return 'blazer'
    if 'coat' in g or 'trench' in g or 'jacket' in g or 'outerwear' in c:
        return 'outerwear'
    if 'shirt' in g or 'oxford' in g:
        return 'shirt'
    if 'pant' in g or 'trouser' in g or 'jean' in g or 'bottom' in c:
        return 'bottom'
    if 'dress' in g or 'skirt' in g or 'dress' in c:
        return 'dress'
    return 'top'


def evaluate_single_region(
    region_name: str,
    garment_val: Optional[float],
    garment_unit: str,
    body_val: Optional[float],
    body_unit: str,
    rule_category: str
) -> Dict[str, Any]:
    """
    Evaluates ease for a single anatomical region.
    If garment_val or body_val is missing, returns status='unspecified' without hallucinating.
    """
    if garment_val is None or body_val is None:
        return {
            'region': region_name,
            'has_data': False,
            'status': 'unspecified',
            'ease_cm': None,
            'ease_in': None,
            'garment_val': garment_val,
            'body_val': body_val,
            'explanation': f"{region_name.capitalize()} dimension not specified in garment size chart."
        }

    garment_cm = to_cm(garment_val, garment_unit)
    body_cm = to_cm(body_val, body_unit)
    ease_cm = round(garment_cm - body_cm, 1)
    ease_in = round(ease_cm * CM_TO_INCH, 1)

    rules = EASE_RULES.get(rule_category, EASE_RULES['top']).get(region_name, {
        'min': 1.0, 'ideal_min': 3.0, 'ideal_max': 8.0, 'max': 14.0
    })

    if ease_cm < rules['min']:
        status = 'tight'
        deficit = round(rules['min'] - ease_cm, 1)
        explanation = f"{region_name.capitalize()} is tight ({ease_in}\" / {ease_cm}cm ease). Needs at least +{round(rules['min']*CM_TO_INCH,1)}\" ({rules['min']}cm) ease for comfort."
    elif ease_cm > rules['max']:
        status = 'loose'
        excess = round(ease_cm - rules['max'], 1)
        explanation = f"{region_name.capitalize()} is oversized/loose (+{ease_in}\" / +{ease_cm}cm ease). Exceeds tailored threshold."
    else:
        status = 'suitable'
        explanation = f"{region_name.capitalize()} drape is optimal (+{ease_in}\" / +{ease_cm}cm ease)."

    # Calculate sub-score for this region (0 to 100)
    ideal_mid = (rules['ideal_min'] + rules['ideal_max']) / 2.0
    diff_from_ideal = abs(ease_cm - ideal_mid)
    tolerance = (rules['max'] - rules['min']) / 2.0
    region_score = max(50, min(100, round(100 - (diff_from_ideal / max(tolerance, 1.0)) * 40)))

    return {
        'region': region_name,
        'has_data': True,
        'status': status,
        'ease_cm': ease_cm,
        'ease_in': ease_in,
        'garment_cm': garment_cm,
        'body_cm': body_cm,
        'region_score': region_score,
        'explanation': explanation
    }


def evaluate_size_fit(
    size_entry: Dict[str, Any],
    garment_unit: str,
    body_measurements: Dict[str, float],
    body_unit: str,
    rule_category: str
) -> Dict[str, Any]:
    """
    Evaluates fit for an individual size entry against verified body measurements.
    """
    regions_to_check = ['chest', 'waist', 'hip', 'shoulder', 'arm_length', 'inseam']
    regional_results = {}
    valid_scores = []
    issues = []
    tight_regions = []
    loose_regions = []

    # Map possible synonyms in size charts
    garment_chest = size_entry.get('chest') or size_entry.get('bust')
    garment_waist = size_entry.get('waist')
    garment_hip = size_entry.get('hip')
    garment_shoulder = size_entry.get('shoulder')
    garment_arm = size_entry.get('arm_length') or size_entry.get('length') if rule_category in ['top', 'shirt', 'blazer'] else None
    garment_inseam = size_entry.get('inseam')

    garment_data_map = {
        'chest': garment_chest,
        'waist': garment_waist,
        'hip': garment_hip,
        'shoulder': garment_shoulder,
        'arm_length': size_entry.get('arm_length') or size_entry.get('sleeve'),
        'inseam': garment_inseam
    }

    body_data_map = {
        'chest': body_measurements.get('chest'),
        'waist': body_measurements.get('waist'),
        'hip': body_measurements.get('hip'),
        'shoulder': body_measurements.get('shoulder'),
        'arm_length': body_measurements.get('armLength') or body_measurements.get('arm_length'),
        'inseam': body_measurements.get('inseam')
    }

    for region in regions_to_check:
        res = evaluate_single_region(
            region_name=region,
            garment_val=garment_data_map.get(region),
            garment_unit=garment_unit,
            body_val=body_data_map.get(region),
            body_unit=body_unit,
            rule_category=rule_category
        )
        regional_results[region] = res

        if res['has_data']:
            valid_scores.append(res['region_score'])
            if res['status'] == 'tight':
                tight_regions.append(region)
                issues.append(res['explanation'])
            elif res['status'] == 'loose':
                loose_regions.append(region)
                issues.append(res['explanation'])

    # Composite fit score
    if valid_scores:
        base_score = round(sum(valid_scores) / len(valid_scores))
        # Deduct heavily if key load-bearing regions (chest/waist) are tight
        if 'chest' in tight_regions:
            base_score = max(55, base_score - 15)
        if 'waist' in tight_regions:
            base_score = max(58, base_score - 12)
        fit_score = base_score
    else:
        fit_score = 85  # Neutral baseline if only basic size label is provided

    # Verdict
    if len(tight_regions) > 0 and len(loose_regions) > 0:
        verdict = 'Mixed Fit (Tight in some zones, loose in others)'
    elif len(tight_regions) > 0:
        verdict = 'Fitted / Snug'
    elif len(loose_regions) > 0:
        verdict = 'Relaxed / Oversized Drape'
    else:
        verdict = 'Optimal Tailored Drape'

    return {
        'size': str(size_entry.get('size', 'M')),
        'fit_score': fit_score,
        'verdict': verdict,
        'is_recommended': False,  # will be computed across all sizes
        'tight_regions': tight_regions,
        'loose_regions': loose_regions,
        'issues': issues,
        'regions': regional_results
    }


def evaluate_garment_fit(
    garment_profile: Dict[str, Any],
    body_profile: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Evaluates all sizes of a garment profile against the verified body profile.
    """
    rule_category = get_rule_category(
        garment_profile.get('garmentType') or garment_profile.get('garment_type', ''),
        garment_profile.get('category', '')
    )

    garment_unit = garment_profile.get('unit', 'in')
    body_unit = body_profile.get('unit', 'cm')
    body_measurements = body_profile.get('measurements', {})

    size_chart = garment_profile.get('sizeChart') or garment_profile.get('size_chart')
    available_sizes = garment_profile.get('availableSizes') or garment_profile.get('available_sizes') or ['S', 'M', 'L', 'XL']

    # If size chart table is missing, synthesize minimal entries for each available size without fake numbers
    if not size_chart or len(size_chart) == 0:
        size_chart = [{'size': s} for s in available_sizes]

    size_analyses = []
    for entry in size_chart:
        analysis = evaluate_size_fit(
            size_entry=entry,
            garment_unit=garment_unit,
            body_measurements=body_measurements,
            body_unit=body_unit,
            rule_category=rule_category
        )
        size_analyses.append(analysis)

    # Determine recommended size (highest score with fewest tight regions)
    sorted_sizes = sorted(size_analyses, key=lambda x: (len(x['tight_regions']) == 0, x['fit_score']), reverse=True)
    recommended_size = sorted_sizes[0]['size'] if sorted_sizes else 'M'

    for s in size_analyses:
        if s['size'] == recommended_size:
            s['is_recommended'] = True

    # Find alternative secondary size if available
    alternative_size = None
    if len(sorted_sizes) > 1:
        alt = sorted_sizes[1]
        if alt['fit_score'] >= 80 and alt['size'] != recommended_size:
            alternative_size = {
                'size': alt['size'],
                'fit_score': alt['fit_score'],
                'note': f"Alternative {alt['verdict'].lower()}"
            }

    # Best fit analysis payload
    best_analysis = next((s for s in size_analyses if s['size'] == recommended_size), size_analyses[0])

    return {
        'garment_id': garment_profile.get('id'),
        'garment_name': garment_profile.get('name'),
        'rule_category': rule_category,
        'recommended_size': recommended_size,
        'recommended_score': best_analysis['fit_score'],
        'recommended_verdict': best_analysis['verdict'],
        'alternative_size': alternative_size,
        'size_evaluations': size_analyses,
        'body_summary': {
            'height': body_profile.get('height'),
            'unit': body_unit,
            'build': body_profile.get('build', 'regular'),
            'fit_preference': body_profile.get('fitPreference', 'tailored')
        }
    }
