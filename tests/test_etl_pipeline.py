"""
Edge case tests for the ETL pipeline.

Tests cover:
- detect_format: correct identification for all 4 formats
- transform_portuguese: grade conversion, absences→completion_rate,
  study_time→total_clicks, missing columns, extreme values
- process_uploaded_file routing: portuguese format now calls transform_portuguese
  (the bug that was previously causing all students to be flagged high-risk)
"""

import io
import pandas as pd
import numpy as np
import pytest

from src.etl.pipeline import detect_format, transform_portuguese, REQUIRED_FEATURES


# ---------------------------------------------------------------------------
# detect_format
# ---------------------------------------------------------------------------

class TestDetectFormat:

    def test_detects_processed_when_all_features_present(self):
        df = pd.DataFrame(columns=REQUIRED_FEATURES + ["student_id"])
        assert detect_format(df) == "processed"

    def test_detects_processed_with_extra_columns(self):
        cols = REQUIRED_FEATURES + ["student_id", "extra_col"]
        df = pd.DataFrame(columns=cols)
        assert detect_format(df) == "processed"

    def test_detects_combined_raw_with_id_student(self):
        df = pd.DataFrame(columns=["id_student", "score", "sum_click", "code_module"])
        assert detect_format(df) == "combined_raw"

    def test_detects_combined_raw_with_only_id_student(self):
        # id_student alone is enough for combined_raw detection
        df = pd.DataFrame(columns=["id_student", "some_other_col"])
        assert detect_format(df) == "combined_raw"

    def test_detects_portuguese_with_all_indicators(self):
        df = pd.DataFrame(columns=["g1", "g2", "g3", "failures", "absences", "study_time", "school"])
        assert detect_format(df) == "portuguese"

    def test_detects_portuguese_requires_all_six_indicators(self):
        # Missing 'study_time' → should NOT match portuguese
        df = pd.DataFrame(columns=["g1", "g2", "g3", "failures", "absences"])
        result = detect_format(df)
        assert result != "portuguese"

    def test_detects_unknown_for_random_columns(self):
        df = pd.DataFrame(columns=["name", "age", "score", "pass"])
        assert detect_format(df) == "unknown"

    def test_detects_unknown_for_empty_dataframe(self):
        df = pd.DataFrame()
        assert detect_format(df) == "unknown"


# ---------------------------------------------------------------------------
# transform_portuguese — grade conversion
# ---------------------------------------------------------------------------

class TestTransformPortugueseGrades:

    def _make_df(self, **kwargs):
        defaults = {
            "g1": [10], "g2": [10], "g3": [10],
            "failures": [0], "absences": [0], "study_time": [2],
        }
        defaults.update(kwargs)
        return pd.DataFrame(defaults)

    def test_grades_converted_from_20_to_100_scale(self):
        df = self._make_df(g1=[20], g2=[20], g3=[20])
        result = transform_portuguese(df)
        assert result["avg_score"].iloc[0] == 100.0

    def test_zero_grades_give_zero_score(self):
        df = self._make_df(g1=[0], g2=[0], g3=[0])
        result = transform_portuguese(df)
        assert result["avg_score"].iloc[0] == 0.0

    def test_mixed_grades_average_correctly(self):
        # g1=10, g2=20, g3=10 → mean=13.33 → *5 = 66.67
        df = self._make_df(g1=[10], g2=[20], g3=[10])
        result = transform_portuguese(df)
        expected = (10 + 20 + 10) / 3 * 5
        assert abs(result["avg_score"].iloc[0] - expected) < 0.01

    def test_avg_score_clamped_to_100(self):
        # If somehow a grade > 20 slips in, result should still be <= 100
        df = self._make_df(g1=[25], g2=[25], g3=[25])
        result = transform_portuguese(df)
        assert result["avg_score"].iloc[0] == 100.0

    def test_missing_grade_columns_defaults_to_50(self):
        df = pd.DataFrame({
            "failures": [0], "absences": [5], "study_time": [2],
        })
        result = transform_portuguese(df)
        assert result["avg_score"].iloc[0] == 50.0

    def test_partial_grade_columns(self):
        # Only g1 and g2, no g3
        df = pd.DataFrame({
            "g1": [10], "g2": [14],
            "failures": [0], "absences": [0], "study_time": [2],
        })
        result = transform_portuguese(df)
        expected = (10 + 14) / 2 * 5
        assert abs(result["avg_score"].iloc[0] - expected) < 0.01


# ---------------------------------------------------------------------------
# transform_portuguese — absences → completion_rate
# ---------------------------------------------------------------------------

class TestTransformPortugueseAbsences:

    def _base(self, absences):
        return pd.DataFrame({
            "g1": [10], "g2": [10], "g3": [10],
            "failures": [0], "absences": [absences], "study_time": [2],
        })

    def test_zero_absences_gives_completion_rate_1(self):
        result = transform_portuguese(self._base(0))
        assert result["completion_rate"].iloc[0] == 1.0

    def test_30_absences_gives_completion_rate_0(self):
        result = transform_portuguese(self._base(30))
        assert result["completion_rate"].iloc[0] == 0.0

    def test_15_absences_gives_completion_rate_0_5(self):
        result = transform_portuguese(self._base(15))
        assert abs(result["completion_rate"].iloc[0] - 0.5) < 0.01

    def test_absences_above_30_clamped_to_0(self):
        result = transform_portuguese(self._base(100))
        assert result["completion_rate"].iloc[0] == 0.0

    def test_missing_absences_column_defaults_to_0_8(self):
        df = pd.DataFrame({
            "g1": [10], "g2": [10], "g3": [10],
            "failures": [0], "study_time": [2],
        })
        result = transform_portuguese(df)
        assert result["completion_rate"].iloc[0] == 0.8


# ---------------------------------------------------------------------------
# transform_portuguese — study_time → total_clicks
# ---------------------------------------------------------------------------

class TestTransformPortugueseStudyTime:

    def _base(self, study_time):
        return pd.DataFrame({
            "g1": [10], "g2": [10], "g3": [10],
            "failures": [0], "absences": [0], "study_time": [study_time],
        })

    def test_study_time_1_gives_500_clicks(self):
        result = transform_portuguese(self._base(1))
        assert result["total_clicks"].iloc[0] == 500

    def test_study_time_4_gives_2000_clicks(self):
        result = transform_portuguese(self._base(4))
        assert result["total_clicks"].iloc[0] == 2000

    def test_missing_study_time_defaults_to_1000_clicks(self):
        df = pd.DataFrame({
            "g1": [10], "g2": [10], "g3": [10],
            "failures": [0], "absences": [0],
        })
        result = transform_portuguese(df)
        assert result["total_clicks"].iloc[0] == 1000


# ---------------------------------------------------------------------------
# transform_portuguese — other fields
# ---------------------------------------------------------------------------

class TestTransformPortugueseOther:

    def _standard_df(self):
        return pd.DataFrame({
            "g1": [12], "g2": [14], "g3": [13],
            "failures": [2], "absences": [5], "study_time": [3],
        })

    def test_failures_mapped_to_prev_attempts(self):
        result = transform_portuguese(self._standard_df())
        assert result["num_of_prev_attempts"].iloc[0] == 2

    def test_studied_credits_always_60(self):
        result = transform_portuguese(self._standard_df())
        assert result["studied_credits"].iloc[0] == 60

    def test_all_module_flags_are_zero(self):
        result = transform_portuguese(self._standard_df())
        for module in ["module_BBB", "module_CCC", "module_DDD", "module_EEE", "module_FFF", "module_GGG"]:
            assert result[module].iloc[0] == 0, f"{module} should be 0"

    def test_output_has_all_required_features(self):
        result = transform_portuguese(self._standard_df())
        for feat in REQUIRED_FEATURES:
            assert feat in result.columns, f"Missing required feature: {feat}"

    def test_student_id_generated_when_missing(self):
        result = transform_portuguese(self._standard_df())
        assert "student_id" in result.columns

    def test_explicit_student_id_preserved(self):
        df = self._standard_df()
        df["student_id"] = ["S001"]
        result = transform_portuguese(df)
        assert result["student_id"].iloc[0] == "S001"

    def test_multiple_rows_processed_correctly(self):
        df = pd.DataFrame({
            "g1": [20, 0, 10], "g2": [20, 0, 10], "g3": [20, 0, 10],
            "failures": [0, 3, 1],
            "absences": [0, 30, 15],
            "study_time": [4, 1, 2],
        })
        result = transform_portuguese(df)
        assert len(result) == 3
        assert result["avg_score"].iloc[0] == 100.0
        assert result["avg_score"].iloc[1] == 0.0
        assert result["completion_rate"].iloc[0] == 1.0
        assert result["completion_rate"].iloc[1] == 0.0
        assert result["total_clicks"].iloc[0] == 2000
        assert result["total_clicks"].iloc[1] == 500


# ---------------------------------------------------------------------------
# process_uploaded_file routing — the original bug
# ---------------------------------------------------------------------------

class TestProcessUploadedFileRouting:

    def _make_csv_bytes(self, df: pd.DataFrame) -> bytes:
        buf = io.BytesIO()
        df.to_csv(buf, index=False)
        return buf.getvalue()

    def test_portuguese_format_is_routed_correctly(self):
        """Previously fell through to 'unknown' handler — this was the root cause
        of every student being flagged high-risk with default zero values."""
        from src.etl.pipeline import process_uploaded_file

        df = pd.DataFrame({
            "g1": [18], "g2": [16], "g3": [17],
            "failures": [0], "absences": [3], "study_time": [3],
        })
        csv_bytes = self._make_csv_bytes(df)
        result_df, fmt = process_uploaded_file(csv_bytes, "students.csv")

        assert fmt == "portuguese", f"Expected 'portuguese', got '{fmt}'"
        # total_clicks should NOT be 0 (that was the default zero bug)
        assert result_df["total_clicks"].iloc[0] > 0
        # avg_score should reflect actual grades, not 50.0 default
        expected_score = (18 + 16 + 17) / 3 * 5
        assert abs(result_df["avg_score"].iloc[0] - expected_score) < 0.1
        # studied_credits should be 60, not 0
        assert result_df["studied_credits"].iloc[0] == 60

    def test_portuguese_students_not_all_zero_engagement(self):
        """Regression test: uploading Portuguese data must NOT produce
        total_clicks=0 for all students (which caused universal high-risk flagging)."""
        from src.etl.pipeline import process_uploaded_file

        rows = [
            {"g1": 15, "g2": 14, "g3": 16, "failures": 0, "absences": 2, "study_time": 3},
            {"g1": 8,  "g2": 9,  "g3": 7,  "failures": 1, "absences": 10, "study_time": 1},
            {"g1": 19, "g2": 18, "g3": 20, "failures": 0, "absences": 0,  "study_time": 4},
        ]
        df = pd.DataFrame(rows)
        csv_bytes = self._make_csv_bytes(df)
        result_df, fmt = process_uploaded_file(csv_bytes, "class.csv")

        assert fmt == "portuguese"
        # None of the students should have 0 total_clicks
        assert (result_df["total_clicks"] > 0).all(), \
            "Some students have 0 clicks — the old zero-default bug is back"
        # All studied_credits should be 60
        assert (result_df["studied_credits"] == 60).all()
