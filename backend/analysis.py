"""
Automated non-parametric statistical analysis engine for UX research data.

Detects data types, selects appropriate tests, runs them, generates
chart specifications, and produces plain-language insights.
"""

from __future__ import annotations

import warnings
from itertools import combinations
from typing import Any

import numpy as np
import pandas as pd
from scipy import stats

warnings.filterwarnings("ignore", category=FutureWarning)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _safe_json(obj: Any) -> Any:
    """Convert numpy/pandas types to JSON-safe Python primitives."""
    if isinstance(obj, (np.integer,)):
        return int(obj)
    if isinstance(obj, (np.floating,)):
        v = float(obj)
        if np.isnan(v) or np.isinf(v):
            return None
        return v
    if isinstance(obj, np.ndarray):
        return [_safe_json(x) for x in obj.tolist()]
    if isinstance(obj, (pd.Timestamp,)):
        return str(obj)
    if isinstance(obj, dict):
        return {k: _safe_json(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [_safe_json(x) for x in obj]
    if isinstance(obj, float) and (np.isnan(obj) or np.isinf(obj)):
        return None
    return obj


def _effect_size_label(r: float) -> str:
    r = abs(r)
    if r < 0.1:
        return "negligible"
    if r < 0.3:
        return "small"
    if r < 0.5:
        return "medium"
    return "large"


def _format_p(p: float) -> str:
    if p < 0.001:
        return "p < 0.001"
    return f"p = {p:.4f}"


def _col_is_numeric(series: pd.Series) -> bool:
    return pd.api.types.is_numeric_dtype(series)


def _col_is_categorical(series: pd.Series, max_unique: int = 25) -> bool:
    if pd.api.types.is_bool_dtype(series):
        return True
    is_cat = hasattr(pd.api.types, "is_categorical_dtype") and pd.api.types.is_categorical_dtype(series)
    if pd.api.types.is_string_dtype(series) or pd.api.types.is_object_dtype(series) or is_cat:
        return series.nunique() <= max_unique
    if pd.api.types.is_numeric_dtype(series) and series.nunique() <= 10:
        return True
    return False


def _col_is_ordinal(series: pd.Series) -> bool:
    if pd.api.types.is_numeric_dtype(series) and 3 <= series.nunique() <= 10:
        return True
    return False


# ---------------------------------------------------------------------------
# Column classification
# ---------------------------------------------------------------------------

def classify_columns(df: pd.DataFrame) -> dict:
    classification = {"numeric": [], "categorical": [], "ordinal": [], "id_like": [], "ignored": []}

    id_patterns = ["id", "uuid", "key", "index", "pk"]

    for col in df.columns:
        s = df[col].dropna()
        if len(s) == 0:
            classification["ignored"].append(col)
            continue

        nunique = s.nunique()
        col_lower = col.lower().replace(" ", "_")

        is_id = any(p == col_lower or col_lower.endswith(f"_{p}") or col_lower.startswith(f"{p}_") for p in id_patterns)
        if is_id and nunique > len(s) * 0.5:
            classification["id_like"].append(col)
            continue

        if not _col_is_numeric(s) and nunique == len(s) and nunique > 20:
            classification["id_like"].append(col)
            continue

        if _col_is_categorical(s):
            classification["categorical"].append(col)
        elif _col_is_numeric(s):
            if _col_is_ordinal(s):
                classification["ordinal"].append(col)
            else:
                classification["numeric"].append(col)
        else:
            classification["ignored"].append(col)

    return classification


# ---------------------------------------------------------------------------
# Descriptive statistics
# ---------------------------------------------------------------------------

def compute_descriptives(df: pd.DataFrame, numeric_cols: list, categorical_cols: list) -> dict:
    desc = {}

    for col in numeric_cols:
        s = df[col].dropna()
        desc[col] = {
            "type": "numeric",
            "count": int(len(s)),
            "mean": float(s.mean()),
            "median": float(s.median()),
            "std": float(s.std()),
            "min": float(s.min()),
            "max": float(s.max()),
            "q1": float(s.quantile(0.25)),
            "q3": float(s.quantile(0.75)),
            "skewness": float(s.skew()),
            "kurtosis": float(s.kurtosis()),
        }

    for col in categorical_cols:
        s = df[col].dropna()
        vc = s.value_counts()
        desc[col] = {
            "type": "categorical",
            "count": int(len(s)),
            "unique": int(s.nunique()),
            "top": str(vc.index[0]),
            "freq": int(vc.iloc[0]),
            "distribution": {str(k): int(v) for k, v in vc.items()},
        }

    return desc


# ---------------------------------------------------------------------------
# Test runners
# ---------------------------------------------------------------------------

def _mann_whitney(groups: list[np.ndarray], group_names: list[str], col: str, grouping_col: str) -> dict | None:
    if len(groups) != 2:
        return None
    a, b = groups
    if len(a) < 3 or len(b) < 3:
        return None
    stat, p = stats.mannwhitneyu(a, b, alternative="two-sided")
    n = len(a) + len(b)
    z = (stat - (len(a) * len(b) / 2)) / np.sqrt(len(a) * len(b) * (n + 1) / 12)
    r = abs(z) / np.sqrt(n)
    effect = _effect_size_label(r)
    sig = "Yes" if p < 0.05 else "No"
    medians = {str(group_names[i]): float(np.median(groups[i])) for i in range(2)}

    higher = group_names[0] if np.median(a) > np.median(b) else group_names[1]

    insight = (
        f"Comparing '{col}' between the two groups in '{grouping_col}': "
        f"The Mann-Whitney U test {'found a statistically significant difference' if p < 0.05 else 'did not find a significant difference'} "
        f"(U = {stat:.1f}, {_format_p(p)}). "
        f"The effect size is {effect} (r = {r:.3f}). "
    )
    if p < 0.05:
        insight += f"The '{higher}' group tends to have higher values (median = {medians[str(higher)]:.2f})."

    return {
        "test": "Mann-Whitney U",
        "variable": col,
        "grouping_variable": grouping_col,
        "statistic": float(stat),
        "p_value": float(p),
        "effect_size": float(r),
        "effect_label": effect,
        "significant": sig,
        "group_medians": medians,
        "insight": insight,
    }


def _kruskal_wallis(groups: list[np.ndarray], group_names: list[str], col: str, grouping_col: str) -> dict | None:
    valid = [(g, n) for g, n in zip(groups, group_names) if len(g) >= 3]
    if len(valid) < 3:
        return None
    groups_v = [v[0] for v in valid]
    names_v = [v[1] for v in valid]

    stat, p = stats.kruskal(*groups_v)
    n = sum(len(g) for g in groups_v)
    k = len(groups_v)
    eta_sq = (stat - k + 1) / (n - k)
    eta_sq = max(0, eta_sq)
    effect = _effect_size_label(np.sqrt(eta_sq))

    medians = {str(names_v[i]): float(np.median(groups_v[i])) for i in range(len(groups_v))}
    highest = max(medians, key=medians.get)

    sig = "Yes" if p < 0.05 else "No"

    insight = (
        f"Comparing '{col}' across {len(groups_v)} groups in '{grouping_col}': "
        f"The Kruskal-Wallis test {'found a statistically significant difference' if p < 0.05 else 'did not find a significant difference'} "
        f"(H = {stat:.2f}, {_format_p(p)}). "
        f"Effect size η² = {eta_sq:.3f} ({effect}). "
    )
    if p < 0.05:
        insight += f"The '{highest}' group had the highest median ({medians[highest]:.2f})."

    post_hoc = None
    if p < 0.05 and len(groups_v) > 2:
        post_hoc = _dunn_post_hoc(groups_v, names_v, col)

    result = {
        "test": "Kruskal-Wallis H",
        "variable": col,
        "grouping_variable": grouping_col,
        "statistic": float(stat),
        "p_value": float(p),
        "effect_size": float(eta_sq),
        "effect_label": effect,
        "significant": sig,
        "group_medians": medians,
        "insight": insight,
    }
    if post_hoc:
        result["post_hoc"] = post_hoc
    return result


def _dunn_post_hoc(groups: list[np.ndarray], names: list[str], col: str) -> list[dict]:
    results = []
    try:
        import scikit_posthocs as sp
        data = pd.DataFrame()
        all_values = []
        all_groups = []
        for g, n in zip(groups, names):
            all_values.extend(g.tolist())
            all_groups.extend([n] * len(g))
        data["value"] = all_values
        data["group"] = all_groups
        dunn = sp.posthoc_dunn(data, val_col="value", group_col="group", p_adjust="bonferroni")
        for i, n1 in enumerate(names):
            for j, n2 in enumerate(names):
                if i < j:
                    p_val = dunn.loc[n1, n2]
                    results.append({
                        "comparison": f"{n1} vs {n2}",
                        "p_value": float(p_val),
                        "significant": "Yes" if p_val < 0.05 else "No",
                    })
    except ImportError:
        for i, j in combinations(range(len(groups)), 2):
            s, p = stats.mannwhitneyu(groups[i], groups[j], alternative="two-sided")
            p_adj = min(p * len(list(combinations(range(len(groups)), 2))), 1.0)
            results.append({
                "comparison": f"{names[i]} vs {names[j]}",
                "p_value": float(p_adj),
                "significant": "Yes" if p_adj < 0.05 else "No",
            })
    return results


def _chi_squared(df: pd.DataFrame, col1: str, col2: str) -> dict | None:
    ct = pd.crosstab(df[col1].dropna(), df[col2].dropna())
    if ct.shape[0] < 2 or ct.shape[1] < 2:
        return None
    if (ct.values < 5).sum() / ct.size > 0.2:
        pass  # still run but note it

    chi2, p, dof, expected = stats.chi2_contingency(ct)
    n = ct.values.sum()
    k = min(ct.shape) - 1
    cramers_v = np.sqrt(chi2 / (n * k)) if k > 0 and n > 0 else 0
    effect = _effect_size_label(cramers_v)

    sig = "Yes" if p < 0.05 else "No"

    insight = (
        f"Testing association between '{col1}' and '{col2}': "
        f"The Chi-squared test {'found a statistically significant association' if p < 0.05 else 'did not find a significant association'} "
        f"(χ² = {chi2:.2f}, df = {dof}, {_format_p(p)}). "
        f"Cramér's V = {cramers_v:.3f} ({effect} association)."
    )

    contingency = {}
    for row_label in ct.index:
        contingency[str(row_label)] = {str(c): int(ct.loc[row_label, c]) for c in ct.columns}

    return {
        "test": "Chi-squared",
        "variable_1": col1,
        "variable_2": col2,
        "statistic": float(chi2),
        "p_value": float(p),
        "degrees_of_freedom": int(dof),
        "effect_size": float(cramers_v),
        "effect_label": effect,
        "significant": sig,
        "contingency_table": contingency,
        "insight": insight,
    }


def _spearman_correlation(df: pd.DataFrame, col1: str, col2: str) -> dict | None:
    clean = df[[col1, col2]].dropna()
    if len(clean) < 5:
        return None
    rho, p = stats.spearmanr(clean[col1], clean[col2])
    if np.isnan(rho):
        return None

    direction = "positive" if rho > 0 else "negative"
    strength = _effect_size_label(rho)
    sig = "Yes" if p < 0.05 else "No"

    insight = (
        f"Spearman correlation between '{col1}' and '{col2}': "
        f"ρ = {rho:.3f} ({_format_p(p)}), indicating a {strength} {direction} monotonic relationship. "
    )
    if p < 0.05:
        insight += f"As '{col1}' increases, '{col2}' tends to {'increase' if rho > 0 else 'decrease'}."
    else:
        insight += "No significant monotonic relationship was detected."

    return {
        "test": "Spearman Correlation",
        "variable_1": col1,
        "variable_2": col2,
        "statistic": float(rho),
        "p_value": float(p),
        "effect_size": abs(float(rho)),
        "effect_label": strength,
        "direction": direction,
        "significant": sig,
        "insight": insight,
        "scatter_data": {
            "x": clean[col1].tolist()[:500],
            "y": clean[col2].tolist()[:500],
        },
    }


def _wilcoxon_signed_rank(df: pd.DataFrame, col1: str, col2: str) -> dict | None:
    clean = df[[col1, col2]].dropna()
    diff = clean[col1] - clean[col2]
    diff = diff[diff != 0]
    if len(diff) < 6:
        return None
    stat, p = stats.wilcoxon(diff)
    n = len(diff)
    z = (stat - n * (n + 1) / 4) / np.sqrt(n * (n + 1) * (2 * n + 1) / 24)
    r = abs(z) / np.sqrt(n)
    effect = _effect_size_label(r)
    sig = "Yes" if p < 0.05 else "No"

    insight = (
        f"Wilcoxon signed-rank test comparing '{col1}' vs '{col2}' (paired): "
        f"W = {stat:.1f}, {_format_p(p)}. "
        f"Effect size r = {r:.3f} ({effect}). "
    )
    if p < 0.05:
        higher = col1 if clean[col1].median() > clean[col2].median() else col2
        insight += f"'{higher}' values tend to be significantly higher."
    else:
        insight += "No significant difference between the paired measurements."

    return {
        "test": "Wilcoxon Signed-Rank",
        "variable_1": col1,
        "variable_2": col2,
        "statistic": float(stat),
        "p_value": float(p),
        "effect_size": float(r),
        "effect_label": effect,
        "significant": sig,
        "medians": {col1: float(clean[col1].median()), col2: float(clean[col2].median())},
        "insight": insight,
    }


# ---------------------------------------------------------------------------
# Chart generation specs (consumed by frontend)
# ---------------------------------------------------------------------------

def _generate_charts(df: pd.DataFrame, classification: dict, test_results: list) -> list:
    charts = []

    for col in classification["numeric"][:8]:
        s = df[col].dropna()
        charts.append({
            "id": f"hist_{col}",
            "type": "histogram",
            "title": f"Distribution of {col}",
            "data": {"values": s.tolist()[:2000], "label": col},
        })

    for col in classification["categorical"][:6]:
        vc = df[col].dropna().value_counts()
        charts.append({
            "id": f"bar_{col}",
            "type": "bar",
            "title": f"Distribution of {col}",
            "data": {"labels": [str(l) for l in vc.index.tolist()], "values": vc.values.tolist()},
        })

    for res in test_results:
        if res["test"] == "Mann-Whitney U":
            grouping = res["grouping_variable"]
            var = res["variable"]
            group_data = []
            for g_name, g_df in df.groupby(grouping):
                vals = g_df[var].dropna().tolist()[:1000]
                if vals:
                    group_data.append({"group": str(g_name), "values": vals})
            if group_data:
                charts.append({
                    "id": f"box_{var}_by_{grouping}",
                    "type": "box",
                    "title": f"{var} by {grouping}",
                    "data": {"groups": group_data},
                    "test_ref": res["test"],
                    "significant": res["significant"],
                })

        elif res["test"] == "Kruskal-Wallis H":
            grouping = res["grouping_variable"]
            var = res["variable"]
            group_data = []
            for g_name, g_df in df.groupby(grouping):
                vals = g_df[var].dropna().tolist()[:1000]
                if vals:
                    group_data.append({"group": str(g_name), "values": vals})
            if group_data:
                charts.append({
                    "id": f"box_{var}_by_{grouping}",
                    "type": "box",
                    "title": f"{var} by {grouping}",
                    "data": {"groups": group_data},
                    "test_ref": res["test"],
                    "significant": res["significant"],
                })

        elif res["test"] == "Chi-squared":
            ct = res.get("contingency_table", {})
            if ct:
                charts.append({
                    "id": f"heatmap_{res['variable_1']}_vs_{res['variable_2']}",
                    "type": "heatmap",
                    "title": f"{res['variable_1']} vs {res['variable_2']}",
                    "data": ct,
                    "test_ref": res["test"],
                    "significant": res["significant"],
                })

        elif res["test"] == "Spearman Correlation":
            scatter = res.get("scatter_data")
            if scatter:
                charts.append({
                    "id": f"scatter_{res['variable_1']}_vs_{res['variable_2']}",
                    "type": "scatter",
                    "title": f"{res['variable_1']} vs {res['variable_2']} (ρ = {res['statistic']:.3f})",
                    "data": scatter,
                    "x_label": res["variable_1"],
                    "y_label": res["variable_2"],
                    "test_ref": res["test"],
                    "significant": res["significant"],
                })

        elif res["test"] == "Wilcoxon Signed-Rank":
            medians = res.get("medians", {})
            if medians:
                charts.append({
                    "id": f"paired_{res['variable_1']}_vs_{res['variable_2']}",
                    "type": "paired_bar",
                    "title": f"Paired Comparison: {res['variable_1']} vs {res['variable_2']}",
                    "data": {"labels": list(medians.keys()), "values": list(medians.values())},
                    "test_ref": res["test"],
                    "significant": res["significant"],
                })

    num_cols = classification["numeric"][:6]
    if len(num_cols) >= 2:
        corr_matrix = df[num_cols].corr(method="spearman").round(3)
        charts.append({
            "id": "correlation_matrix",
            "type": "correlation_matrix",
            "title": "Spearman Correlation Matrix",
            "data": {
                "labels": num_cols,
                "matrix": corr_matrix.values.tolist(),
            },
        })

    return charts


# ---------------------------------------------------------------------------
# Normality check (for context)
# ---------------------------------------------------------------------------

def _normality_tests(df: pd.DataFrame, numeric_cols: list) -> list:
    results = []
    for col in numeric_cols[:10]:
        s = df[col].dropna()
        if len(s) < 8:
            continue
        sample = s.sample(min(len(s), 5000), random_state=42)
        stat, p = stats.shapiro(sample) if len(sample) <= 5000 else stats.kstest(sample, "norm", args=(sample.mean(), sample.std()))
        results.append({
            "variable": col,
            "test": "Shapiro-Wilk" if len(sample) <= 5000 else "Kolmogorov-Smirnov",
            "statistic": float(stat),
            "p_value": float(p),
            "normal": "Yes" if p >= 0.05 else "No",
            "note": (
                "Data appears normally distributed — non-parametric tests are still valid and more robust."
                if p >= 0.05
                else "Data is not normally distributed — non-parametric tests are appropriate."
            ),
        })
    return results


# ---------------------------------------------------------------------------
# Main analysis orchestrator
# ---------------------------------------------------------------------------

def analyze_dataset(df: pd.DataFrame) -> dict:
    df = df.copy()

    for col in df.select_dtypes(include=["object"]).columns:
        df[col] = df[col].astype(str).str.strip()

    classification = classify_columns(df)

    numeric_cols = classification["numeric"] + classification["ordinal"]
    categorical_cols = classification["categorical"]

    descriptives = compute_descriptives(df, numeric_cols, categorical_cols)
    normality = _normality_tests(df, numeric_cols)

    test_results = []

    for cat_col in categorical_cols:
        groups_series = df.groupby(cat_col)
        n_groups = df[cat_col].nunique()
        group_names = [str(g) for g in sorted(df[cat_col].dropna().unique())]

        for num_col in numeric_cols:
            groups = [g[num_col].dropna().values for _, g in groups_series if len(g[num_col].dropna()) > 0]
            if n_groups == 2:
                result = _mann_whitney(groups, group_names, num_col, cat_col)
            elif n_groups >= 3:
                result = _kruskal_wallis(groups, group_names, num_col, cat_col)
            else:
                continue
            if result:
                test_results.append(result)

    if len(categorical_cols) >= 2:
        for i, j in combinations(range(min(len(categorical_cols), 6)), 2):
            result = _chi_squared(df, categorical_cols[i], categorical_cols[j])
            if result:
                test_results.append(result)

    if len(numeric_cols) >= 2:
        for i, j in combinations(range(min(len(numeric_cols), 8)), 2):
            result = _spearman_correlation(df, numeric_cols[i], numeric_cols[j])
            if result:
                test_results.append(result)

    paired_candidates = _detect_paired_columns(df, numeric_cols)
    for col1, col2 in paired_candidates:
        result = _wilcoxon_signed_rank(df, col1, col2)
        if result:
            test_results.append(result)

    charts = _generate_charts(df, classification, test_results)

    summary = _generate_summary(df, classification, test_results)

    return _safe_json({
        "dataset_info": {
            "rows": len(df),
            "columns": len(df.columns),
            "column_names": df.columns.tolist(),
        },
        "classification": classification,
        "descriptives": descriptives,
        "normality_tests": normality,
        "test_results": test_results,
        "charts": charts,
        "summary": summary,
    })


def _detect_paired_columns(df: pd.DataFrame, numeric_cols: list) -> list[tuple]:
    pairs = []
    keywords = ["pre", "post", "before", "after", "baseline", "followup", "follow_up", "t1", "t2", "time1", "time2"]
    for i, col1 in enumerate(numeric_cols):
        for col2 in numeric_cols[i + 1:]:
            c1, c2 = col1.lower(), col2.lower()
            is_paired = False
            if any(k in c1 for k in keywords) and any(k in c2 for k in keywords):
                is_paired = True
            common = set(c1.split("_")) & set(c2.split("_"))
            if len(common) >= 1 and len(common) / max(len(c1.split("_")), len(c2.split("_"))) > 0.3:
                diff_words = set(c1.split("_")).symmetric_difference(set(c2.split("_")))
                if diff_words & set(keywords):
                    is_paired = True
            if is_paired:
                pairs.append((col1, col2))
    return pairs[:5]


def _generate_summary(df: pd.DataFrame, classification: dict, test_results: list) -> dict:
    significant = [r for r in test_results if r.get("significant") == "Yes"]
    not_significant = [r for r in test_results if r.get("significant") == "No"]

    key_findings = []
    for r in significant:
        key_findings.append(r["insight"])

    recommendations = []
    if significant:
        recommendations.append("Significant differences were found — consider follow-up qualitative investigation to understand *why* these differences exist.")
    if any(r["test"] == "Kruskal-Wallis H" and r.get("post_hoc") for r in significant):
        recommendations.append("Post-hoc comparisons are provided for significant Kruskal-Wallis results — review pairwise differences to identify which specific groups differ.")
    if any(r["test"] == "Spearman Correlation" and r.get("significant") == "Yes" for r in test_results):
        recommendations.append("Significant correlations found — note that correlation does not imply causation. Consider experimental designs to establish causal relationships.")
    if not significant:
        recommendations.append("No statistically significant differences were found. Consider increasing sample size or exploring qualitative methods for deeper insights.")
    recommendations.append("All tests used are non-parametric, which means they make fewer assumptions about data distribution and are robust for typical UX research data.")

    return {
        "total_tests_run": len(test_results),
        "significant_results": len(significant),
        "not_significant_results": len(not_significant),
        "key_findings": key_findings,
        "recommendations": recommendations,
    }
