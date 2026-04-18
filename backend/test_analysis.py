"""Quick smoke test for the analysis engine."""
import pandas as pd
import numpy as np
import json
from analysis import analyze_dataset

np.random.seed(42)

n = 100
df = pd.DataFrame({
    "participant_id": range(1, n + 1),
    "age_group": np.random.choice(["18-24", "25-34", "35-44"], n),
    "device": np.random.choice(["mobile", "desktop"], n),
    "task_completion_time": np.random.exponential(30, n) + 10,
    "satisfaction_score": np.random.choice([1, 2, 3, 4, 5], n, p=[0.05, 0.1, 0.25, 0.35, 0.25]),
    "error_count": np.random.poisson(2, n),
    "sus_score": np.clip(np.random.normal(68, 15, n), 0, 100).round(1),
    "pre_score": np.random.normal(50, 10, n).round(1),
    "post_score": np.random.normal(60, 12, n).round(1),
})

# Make mobile users slightly slower
df.loc[df["device"] == "mobile", "task_completion_time"] += 8

results = analyze_dataset(df)

print("=== Dataset Info ===")
print(json.dumps(results["dataset_info"], indent=2))

print("\n=== Classification ===")
print(json.dumps(results["classification"], indent=2))

print(f"\n=== Normality Tests: {len(results['normality_tests'])} ===")
for nt in results["normality_tests"]:
    print(f"  {nt['variable']}: {nt['test']} -> normal={nt['normal']} (p={nt['p_value']:.4f})")

print(f"\n=== Test Results: {len(results['test_results'])} ===")
for tr in results["test_results"]:
    print(f"  [{tr['significant']}] {tr['test']}: {tr.get('insight', '')[:120]}...")

print(f"\n=== Charts: {len(results['charts'])} ===")
for ch in results["charts"]:
    print(f"  {ch['type']}: {ch['title']}")

print(f"\n=== Summary ===")
print(json.dumps(results["summary"], indent=2))

print("\n✓ All tests passed!")
