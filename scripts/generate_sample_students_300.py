"""Generate sample_students_300.csv with all model features + g1, g2, g3 grades."""
import csv
import random
from pathlib import Path

# Reproducible
random.seed(42)

MODULES = ["module_BBB", "module_CCC", "module_DDD", "module_EEE", "module_FFF", "module_GGG"]
REGIONS = [
    "region_East Midlands Region",
    "region_Ireland",
    "region_London Region",
    "region_North Region",
    "region_North Western Region",
    "region_Scotland",
    "region_South East Region",
    "region_South Region",
    "region_South West Region",
    "region_Wales",
    "region_West Midlands Region",
    "region_Yorkshire Region",
]

# Realistic profiles: (gender, highest_ed, imd, age_band, prev_attempts, credits, disability, avg_score, clicks, completion)
PROFILES = [
    (1, 3, 9, 2, 0, 240, 0, 82, 1800, 0.9),
    (0, 3, 6, 1, 1, 120, 0, 55, 900, 0.65),
    (1, 2, 4, 1, 2, 60, 0, 45, 500, 0.4),
    (0, 1, 2, 0, 0, 60, 1, 40, 300, 0.3),
    (1, 3, 8, 2, 1, 90, 0, 65, 1200, 0.75),
    (0, 4, 7, 3, 0, 240, 0, 88, 2400, 0.95),
    (1, 2, 3, 2, 2, 120, 0, 52, 700, 0.5),
    (0, 2, 5, 1, 1, 60, 0, 60, 400, 0.6),
    (1, 1, 1, 0, 0, 60, 0, 70, 900, 0.4),
    (0, 4, 9, 3, 0, 240, 0, 90, 2600, 0.98),
]

# Grades (g1, g2, g3) roughly aligned with avg_score
def grades_for_avg(avg):
    base = max(0, min(20, int(avg / 5) + random.randint(-1, 2)))
    g3 = max(0, min(20, base + random.randint(-1, 1)))
    g2 = max(0, min(20, g3 - random.randint(0, 2)))
    g1 = max(0, min(20, g2 - random.randint(0, 2)))
    return g1, g2, g3

def at_risk(avg, completion, clicks, prev):
    return 1 if (avg < 50 or completion < 0.5 or clicks < 600 or prev >= 2) else 0

def main():
    out_path = Path(__file__).resolve().parent.parent / "data" / "sample_students_300.csv"
    out_path.parent.mkdir(parents=True, exist_ok=True)

    header = [
        "student_id", "gender", "highest_education", "imd_band", "age_band",
        "num_of_prev_attempts", "studied_credits", "disability", "avg_score",
        "total_clicks", "completion_rate",
    ] + MODULES + REGIONS + ["g1", "g2", "g3", "at_risk"]

    rows = []
    for i in range(300):
        p = PROFILES[i % len(PROFILES)]
        g1, g2, g3 = grades_for_avg(p[7])
        risk = at_risk(p[7], p[9], p[8], p[4])

        row = [
            f"STU{i + 1:03d}", p[0], p[1], p[2], p[3], p[4], p[5], p[6],
            p[7], p[8], p[9],
        ]
        for j, m in enumerate(MODULES):
            row.append(1 if (i % len(MODULES)) == j else 0)
        for j, r in enumerate(REGIONS):
            row.append(1 if (i % len(REGIONS)) == j else 0)
        row.extend([g1, g2, g3, risk])
        rows.append(row)

    with open(out_path, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(header)
        w.writerows(rows)

    print(f"Wrote {len(rows)} rows to {out_path}")

if __name__ == "__main__":
    main()
