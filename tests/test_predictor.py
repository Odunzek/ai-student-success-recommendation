"""
Edge case tests for the RiskPredictor.

Tests cover:
- _prepare_features: None/NaN/bad types → safe defaults
- Categorical fields: None/empty → 'Unknown'
- Output shape: single-row DataFrame with 12 columns
- Risk threshold boundaries (exactly 40, exactly 70)
- model_not_loaded guard
- Typical student profiles (high risk vs low risk)
"""

import pandas as pd
import numpy as np
import pytest
from unittest.mock import MagicMock

import src.models.predictor as predictor_module


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(autouse=True)
def reset_singleton():
    """Reset the RiskPredictor singleton before each test."""
    predictor_module.RiskPredictor._instance = None
    predictor_module.RiskPredictor._initialized = False
    yield
    predictor_module.RiskPredictor._instance = None
    predictor_module.RiskPredictor._initialized = False


@pytest.fixture
def loaded_predictor():
    """Return a RiskPredictor with a mocked CatBoost model."""
    from src.models.predictor import RiskPredictor
    predictor = RiskPredictor()
    predictor.model = MagicMock()
    return predictor


def set_risk_probability(predictor, probability: float):
    """Configure mock model to return a specific dropout probability."""
    predictor.model.predict_proba.return_value = np.array(
        [[1 - probability, probability]]
    )


# Full valid student — used as base for most tests
VALID_STUDENT = {
    "num_of_prev_attempts": 0,
    "studied_credits": 60,
    "avg_score": 72.0,
    "total_clicks": 1200,
    "completion_rate": 0.83,
    "code_module": "BBB",
    "gender": "F",
    "region": "Scotland",
    "highest_education": "HE Qualification",
    "imd_band": "80-90%",
    "age_band": "35-55",
    "disability": "N",
}


# ---------------------------------------------------------------------------
# _prepare_features — output type and shape
# ---------------------------------------------------------------------------

class TestPrepareFeaturesOutput:

    def test_returns_dataframe(self, loaded_predictor):
        result = loaded_predictor._prepare_features(VALID_STUDENT)
        assert isinstance(result, pd.DataFrame)

    def test_single_row(self, loaded_predictor):
        result = loaded_predictor._prepare_features(VALID_STUDENT)
        assert len(result) == 1

    def test_has_12_columns(self, loaded_predictor):
        result = loaded_predictor._prepare_features(VALID_STUDENT)
        assert result.shape[1] == 12

    def test_has_all_expected_columns(self, loaded_predictor):
        result = loaded_predictor._prepare_features(VALID_STUDENT)
        expected_cols = {
            "num_of_prev_attempts", "studied_credits", "avg_score",
            "total_clicks", "completion_rate",
            "code_module", "gender", "region", "highest_education",
            "imd_band", "age_band", "disability",
        }
        assert expected_cols == set(result.columns)

    def test_empty_dict_produces_valid_dataframe(self, loaded_predictor):
        result = loaded_predictor._prepare_features({})
        assert isinstance(result, pd.DataFrame)
        assert result.shape == (1, 12)


# ---------------------------------------------------------------------------
# _prepare_features — numeric defaults
# ---------------------------------------------------------------------------

class TestNumericDefaults:

    def test_none_numeric_values_use_defaults(self, loaded_predictor):
        data = {
            "num_of_prev_attempts": None,
            "studied_credits": None,
            "avg_score": None,
            "total_clicks": None,
            "completion_rate": None,
        }
        result = loaded_predictor._prepare_features(data)
        assert result["num_of_prev_attempts"].iloc[0] == 0.0
        assert result["studied_credits"].iloc[0] == 60.0
        assert result["avg_score"].iloc[0] == 50.0
        assert result["total_clicks"].iloc[0] == 0.0
        assert result["completion_rate"].iloc[0] == 0.5

    def test_nan_numeric_values_use_defaults(self, loaded_predictor):
        data = {
            "avg_score": float("nan"),
            "completion_rate": float("nan"),
            "total_clicks": float("nan"),
        }
        result = loaded_predictor._prepare_features(data)
        assert result["avg_score"].iloc[0] == 50.0
        assert result["completion_rate"].iloc[0] == 0.5
        assert result["total_clicks"].iloc[0] == 0.0

    def test_non_numeric_strings_use_defaults(self, loaded_predictor):
        data = {"avg_score": "bad_value", "completion_rate": "??"}
        result = loaded_predictor._prepare_features(data)
        assert result["avg_score"].iloc[0] == 50.0
        assert result["completion_rate"].iloc[0] == 0.5

    def test_valid_numeric_values_pass_through(self, loaded_predictor):
        result = loaded_predictor._prepare_features(VALID_STUDENT)
        assert result["avg_score"].iloc[0] == 72.0
        assert result["completion_rate"].iloc[0] == 0.83
        assert result["total_clicks"].iloc[0] == 1200.0

    def test_extreme_high_values_pass_through(self, loaded_predictor):
        data = {**VALID_STUDENT, "avg_score": 100.0, "total_clicks": 999_999}
        result = loaded_predictor._prepare_features(data)
        assert result["avg_score"].iloc[0] == 100.0
        assert result["total_clicks"].iloc[0] == 999_999.0

    def test_zero_values_pass_through(self, loaded_predictor):
        data = {**VALID_STUDENT, "avg_score": 0.0, "total_clicks": 0, "completion_rate": 0.0}
        result = loaded_predictor._prepare_features(data)
        assert result["avg_score"].iloc[0] == 0.0
        assert result["completion_rate"].iloc[0] == 0.0


# ---------------------------------------------------------------------------
# _prepare_features — categorical defaults
# ---------------------------------------------------------------------------

class TestCategoricalDefaults:

    def test_none_categorical_values_become_unknown(self, loaded_predictor):
        data = {
            **VALID_STUDENT,
            "code_module": None,
            "gender": None,
            "region": None,
        }
        result = loaded_predictor._prepare_features(data)
        assert result["code_module"].iloc[0] == "Unknown"
        assert result["gender"].iloc[0] == "Unknown"
        assert result["region"].iloc[0] == "Unknown"

    def test_empty_string_categorical_becomes_unknown(self, loaded_predictor):
        data = {**VALID_STUDENT, "code_module": "", "disability": "  "}
        result = loaded_predictor._prepare_features(data)
        assert result["code_module"].iloc[0] == "Unknown"
        assert result["disability"].iloc[0] == "Unknown"

    def test_valid_categorical_values_pass_through(self, loaded_predictor):
        result = loaded_predictor._prepare_features(VALID_STUDENT)
        assert result["code_module"].iloc[0] == "BBB"
        assert result["gender"].iloc[0] == "F"
        assert result["region"].iloc[0] == "Scotland"
        assert result["highest_education"].iloc[0] == "HE Qualification"
        assert result["imd_band"].iloc[0] == "80-90%"
        assert result["age_band"].iloc[0] == "35-55"
        assert result["disability"].iloc[0] == "N"

    def test_missing_categoricals_default_to_unknown(self, loaded_predictor):
        # Only numeric features provided — all categoricals should be 'Unknown'
        data = {"avg_score": 60, "completion_rate": 0.7, "total_clicks": 500}
        result = loaded_predictor._prepare_features(data)
        for col in ["code_module", "gender", "region", "highest_education",
                    "imd_band", "age_band", "disability"]:
            assert result[col].iloc[0] == "Unknown", f"{col} should be 'Unknown'"

    def test_categorical_values_are_strings(self, loaded_predictor):
        result = loaded_predictor._prepare_features(VALID_STUDENT)
        for col in ["code_module", "gender", "region", "highest_education",
                    "imd_band", "age_band", "disability"]:
            assert isinstance(result[col].iloc[0], str), f"{col} should be a string"


# ---------------------------------------------------------------------------
# predict — risk level thresholds
# ---------------------------------------------------------------------------

class TestPredictThresholds:

    def test_score_70_is_high_risk(self, loaded_predictor):
        set_risk_probability(loaded_predictor, 0.70)
        result = loaded_predictor.predict(VALID_STUDENT)
        assert result["risk_level"] == "high"
        assert result["risk_score"] == 70

    def test_score_69_is_medium_risk(self, loaded_predictor):
        set_risk_probability(loaded_predictor, 0.69)
        result = loaded_predictor.predict(VALID_STUDENT)
        assert result["risk_level"] == "medium"

    def test_score_40_is_medium_risk(self, loaded_predictor):
        set_risk_probability(loaded_predictor, 0.40)
        result = loaded_predictor.predict(VALID_STUDENT)
        assert result["risk_level"] == "medium"
        assert result["risk_score"] == 40

    def test_score_39_is_low_risk(self, loaded_predictor):
        set_risk_probability(loaded_predictor, 0.39)
        result = loaded_predictor.predict(VALID_STUDENT)
        assert result["risk_level"] == "low"

    def test_score_100_is_high_risk(self, loaded_predictor):
        set_risk_probability(loaded_predictor, 1.0)
        result = loaded_predictor.predict(VALID_STUDENT)
        assert result["risk_level"] == "high"
        assert result["risk_score"] == 100

    def test_score_0_is_low_risk(self, loaded_predictor):
        set_risk_probability(loaded_predictor, 0.0)
        result = loaded_predictor.predict(VALID_STUDENT)
        assert result["risk_level"] == "low"
        assert result["risk_score"] == 0

    def test_prediction_flag_at_50_percent(self, loaded_predictor):
        set_risk_probability(loaded_predictor, 0.50)
        result = loaded_predictor.predict(VALID_STUDENT)
        assert result["prediction"] == 1

    def test_prediction_flag_below_50_percent(self, loaded_predictor):
        set_risk_probability(loaded_predictor, 0.49)
        result = loaded_predictor.predict(VALID_STUDENT)
        assert result["prediction"] == 0

    def test_result_has_required_keys(self, loaded_predictor):
        set_risk_probability(loaded_predictor, 0.55)
        result = loaded_predictor.predict(VALID_STUDENT)
        assert "risk_score" in result
        assert "risk_probability" in result
        assert "risk_level" in result
        assert "prediction" in result

    def test_risk_probability_matches_score(self, loaded_predictor):
        set_risk_probability(loaded_predictor, 0.73)
        result = loaded_predictor.predict(VALID_STUDENT)
        assert result["risk_score"] == 73
        assert abs(result["risk_probability"] - 0.73) < 0.001


# ---------------------------------------------------------------------------
# predict — model not loaded guard
# ---------------------------------------------------------------------------

class TestModelNotLoaded:

    def test_predict_raises_when_not_loaded(self):
        from src.models.predictor import RiskPredictor
        predictor = RiskPredictor()
        with pytest.raises(RuntimeError, match="Model not loaded"):
            predictor.predict(VALID_STUDENT)

    def test_is_loaded_false_before_load(self):
        from src.models.predictor import RiskPredictor
        predictor = RiskPredictor()
        assert predictor.is_loaded is False

    def test_is_loaded_true_after_mock_load(self, loaded_predictor):
        assert loaded_predictor.is_loaded is True


# ---------------------------------------------------------------------------
# Typical student profiles — sanity checks with real-looking data
# ---------------------------------------------------------------------------

class TestTypicalProfiles:

    def test_high_risk_profile(self, loaded_predictor):
        """Zero engagement, failed before, low scores — should be called correctly."""
        set_risk_probability(loaded_predictor, 0.88)
        result = loaded_predictor.predict({
            "avg_score": 18.5,
            "completion_rate": 0.08,
            "total_clicks": 95,
            "studied_credits": 60,
            "num_of_prev_attempts": 2,
            "code_module": "CCC",
            "gender": "M",
            "region": "North Western Region",
            "highest_education": "No Formal quals",
            "imd_band": "10-20%",
            "age_band": "0-35",
            "disability": "N",
        })
        loaded_predictor.model.predict_proba.assert_called_once()
        assert result["risk_level"] == "high"

    def test_low_risk_profile(self, loaded_predictor):
        """Strong engagement, high scores, postgrad — should be called correctly."""
        set_risk_probability(loaded_predictor, 0.05)
        result = loaded_predictor.predict({
            "avg_score": 91.0,
            "completion_rate": 0.98,
            "total_clicks": 3200,
            "studied_credits": 120,
            "num_of_prev_attempts": 0,
            "code_module": "DDD",
            "gender": "F",
            "region": "London Region",
            "highest_education": "Post Graduate Qualification",
            "imd_band": "90-100%",
            "age_band": "35-55",
            "disability": "N",
        })
        assert result["risk_level"] == "low"
        assert result["prediction"] == 0

    def test_model_receives_dataframe(self, loaded_predictor):
        """CatBoost must receive a DataFrame, not a numpy array."""
        set_risk_probability(loaded_predictor, 0.55)
        loaded_predictor.predict(VALID_STUDENT)
        call_args = loaded_predictor.model.predict_proba.call_args[0][0]
        assert isinstance(call_args, pd.DataFrame), \
            "Model must receive a DataFrame (CatBoost native categorical requirement)"

    def test_model_receives_single_row(self, loaded_predictor):
        set_risk_probability(loaded_predictor, 0.55)
        loaded_predictor.predict(VALID_STUDENT)
        call_args = loaded_predictor.model.predict_proba.call_args[0][0]
        assert len(call_args) == 1
