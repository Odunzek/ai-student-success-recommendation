"""
Edge case tests for the RiskPredictor.

Tests cover:
- Feature preparation: None/NaN/bad types → safe defaults
- Extreme input values (0, 100, negatives, huge numbers)
- Risk threshold boundaries (exactly 40, exactly 70)
- model_not_loaded guard
- All-default input produces a valid result
"""

import math
from unittest.mock import MagicMock, patch
import numpy as np
import pytest

# Reset singleton state between tests so each test gets a clean predictor
import src.models.predictor as predictor_module


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
    """Return a RiskPredictor with a mocked XGBoost model."""
    from src.models.predictor import RiskPredictor

    predictor = RiskPredictor()

    # Mock the model so predict_proba is controllable
    mock_model = MagicMock()
    predictor.model = mock_model
    predictor.feature_list = [
        "num_of_prev_attempts", "studied_credits", "avg_score",
        "total_clicks", "completion_rate",
        "module_BBB", "module_CCC", "module_DDD",
        "module_EEE", "module_FFF", "module_GGG",
    ]
    return predictor


def set_risk_probability(predictor, probability: float):
    """Configure mock model to return a specific dropout probability."""
    predictor.model.predict_proba.return_value = np.array([[1 - probability, probability]])


# ---------------------------------------------------------------------------
# _prepare_features — input sanitisation
# ---------------------------------------------------------------------------

class TestPrepareFeatures:

    def test_none_values_use_defaults(self, loaded_predictor):
        data = {
            "num_of_prev_attempts": None,
            "studied_credits": None,
            "avg_score": None,
            "total_clicks": None,
            "completion_rate": None,
        }
        features = loaded_predictor._prepare_features(data)
        # defaults: [0, 60, 50, 0, 0.5, 0, 0, 0, 0, 0, 0]
        assert features[0][0] == 0.0       # num_of_prev_attempts
        assert features[0][1] == 60.0      # studied_credits
        assert features[0][2] == 50.0      # avg_score
        assert features[0][3] == 0.0       # total_clicks
        assert features[0][4] == 0.5       # completion_rate

    def test_nan_values_use_defaults(self, loaded_predictor):
        data = {
            "num_of_prev_attempts": float("nan"),
            "studied_credits": float("nan"),
            "avg_score": float("nan"),
            "total_clicks": float("nan"),
            "completion_rate": float("nan"),
        }
        features = loaded_predictor._prepare_features(data)
        assert features[0][2] == 50.0      # avg_score default
        assert features[0][4] == 0.5       # completion_rate default

    def test_string_values_use_defaults(self, loaded_predictor):
        data = {
            "avg_score": "not_a_number",
            "completion_rate": "bad",
            "total_clicks": "??",
        }
        features = loaded_predictor._prepare_features(data)
        assert features[0][2] == 50.0      # avg_score default
        assert features[0][4] == 0.5       # completion_rate default
        assert features[0][3] == 0.0       # total_clicks default

    def test_empty_dict_all_defaults(self, loaded_predictor):
        features = loaded_predictor._prepare_features({})
        assert features.shape == (1, 11)
        assert features[0][0] == 0.0
        assert features[0][1] == 60.0
        assert features[0][2] == 50.0
        assert features[0][3] == 0.0
        assert features[0][4] == 0.5
        # all module flags should be 0
        assert list(features[0][5:]) == [0, 0, 0, 0, 0, 0]

    def test_extreme_high_values_pass_through(self, loaded_predictor):
        data = {
            "avg_score": 100.0,
            "total_clicks": 999_999,
            "studied_credits": 600,
            "num_of_prev_attempts": 10,
            "completion_rate": 1.0,
        }
        features = loaded_predictor._prepare_features(data)
        assert features[0][2] == 100.0
        assert features[0][3] == 999_999.0
        assert features[0][4] == 1.0

    def test_zero_values_pass_through(self, loaded_predictor):
        data = {
            "avg_score": 0.0,
            "total_clicks": 0,
            "studied_credits": 0,
            "num_of_prev_attempts": 0,
            "completion_rate": 0.0,
        }
        features = loaded_predictor._prepare_features(data)
        assert features[0][0] == 0.0
        assert features[0][1] == 0.0
        assert features[0][2] == 0.0
        assert features[0][3] == 0.0
        assert features[0][4] == 0.0

    def test_module_flags_truthy_values(self, loaded_predictor):
        data = {"module_BBB": 1, "module_CCC": True, "module_DDD": "1"}
        features = loaded_predictor._prepare_features(data)
        assert features[0][5] == 1   # module_BBB
        assert features[0][6] == 1   # module_CCC
        assert features[0][7] == 1   # module_DDD

    def test_module_flags_falsy_values(self, loaded_predictor):
        data = {"module_BBB": 0, "module_CCC": False, "module_DDD": None}
        features = loaded_predictor._prepare_features(data)
        assert features[0][5] == 0
        assert features[0][6] == 0
        assert features[0][7] == 0

    def test_output_shape_always_1x11(self, loaded_predictor):
        for data in [{}, {"avg_score": 50}, {"module_BBB": True}]:
            features = loaded_predictor._prepare_features(data)
            assert features.shape == (1, 11), f"Wrong shape for input {data}"


# ---------------------------------------------------------------------------
# predict — risk level thresholds
# ---------------------------------------------------------------------------

class TestPredictThresholds:

    def test_score_70_is_high_risk(self, loaded_predictor):
        set_risk_probability(loaded_predictor, 0.70)
        result = loaded_predictor.predict({"avg_score": 50})
        assert result["risk_level"] == "high"
        assert result["risk_score"] == 70

    def test_score_69_is_medium_risk(self, loaded_predictor):
        set_risk_probability(loaded_predictor, 0.69)
        result = loaded_predictor.predict({"avg_score": 50})
        assert result["risk_level"] == "medium"
        assert result["risk_score"] == 69

    def test_score_40_is_medium_risk(self, loaded_predictor):
        set_risk_probability(loaded_predictor, 0.40)
        result = loaded_predictor.predict({"avg_score": 50})
        assert result["risk_level"] == "medium"
        assert result["risk_score"] == 40

    def test_score_39_is_low_risk(self, loaded_predictor):
        set_risk_probability(loaded_predictor, 0.39)
        result = loaded_predictor.predict({"avg_score": 50})
        assert result["risk_level"] == "low"
        assert result["risk_score"] == 39

    def test_score_100_is_high_risk(self, loaded_predictor):
        set_risk_probability(loaded_predictor, 1.0)
        result = loaded_predictor.predict({})
        assert result["risk_level"] == "high"
        assert result["risk_score"] == 100

    def test_score_0_is_low_risk(self, loaded_predictor):
        set_risk_probability(loaded_predictor, 0.0)
        result = loaded_predictor.predict({})
        assert result["risk_level"] == "low"
        assert result["risk_score"] == 0

    def test_prediction_flag_at_50_percent(self, loaded_predictor):
        set_risk_probability(loaded_predictor, 0.50)
        result = loaded_predictor.predict({})
        assert result["prediction"] == 1  # >= 0.5 → at risk

    def test_prediction_flag_below_50_percent(self, loaded_predictor):
        set_risk_probability(loaded_predictor, 0.49)
        result = loaded_predictor.predict({})
        assert result["prediction"] == 0  # < 0.5 → not at risk

    def test_result_always_has_required_keys(self, loaded_predictor):
        set_risk_probability(loaded_predictor, 0.55)
        result = loaded_predictor.predict({"avg_score": 45, "completion_rate": 0.3})
        assert "risk_score" in result
        assert "risk_probability" in result
        assert "risk_level" in result
        assert "prediction" in result

    def test_risk_probability_matches_score(self, loaded_predictor):
        set_risk_probability(loaded_predictor, 0.73)
        result = loaded_predictor.predict({})
        assert result["risk_score"] == 73
        assert abs(result["risk_probability"] - 0.73) < 0.001


# ---------------------------------------------------------------------------
# predict — model not loaded guard
# ---------------------------------------------------------------------------

class TestModelNotLoaded:

    def test_predict_raises_when_not_loaded(self, reset_singleton):
        from src.models.predictor import RiskPredictor
        predictor = RiskPredictor()
        # model is None by default (not loaded)
        with pytest.raises(RuntimeError, match="Model not loaded"):
            predictor.predict({"avg_score": 50})

    def test_is_loaded_false_before_load(self, reset_singleton):
        from src.models.predictor import RiskPredictor
        predictor = RiskPredictor()
        assert predictor.is_loaded is False

    def test_is_loaded_true_after_mock_load(self, loaded_predictor):
        assert loaded_predictor.is_loaded is True


# ---------------------------------------------------------------------------
# Typical student profiles — sanity checks with real-looking data
# ---------------------------------------------------------------------------

class TestTypicalProfiles:

    def test_high_risk_profile_calls_model(self, loaded_predictor):
        """Zero engagement, failed before — model should be called with correct shape."""
        set_risk_probability(loaded_predictor, 0.85)
        result = loaded_predictor.predict({
            "avg_score": 20.0,
            "completion_rate": 0.1,
            "total_clicks": 0,
            "studied_credits": 0,
            "num_of_prev_attempts": 3,
        })
        loaded_predictor.model.predict_proba.assert_called_once()
        call_args = loaded_predictor.model.predict_proba.call_args[0][0]
        assert call_args.shape == (1, 11)
        assert result["risk_level"] == "high"

    def test_low_risk_profile_calls_model(self, loaded_predictor):
        """Strong engagement, high scores — model should be called correctly."""
        set_risk_probability(loaded_predictor, 0.08)
        result = loaded_predictor.predict({
            "avg_score": 88.0,
            "completion_rate": 0.95,
            "total_clicks": 3500,
            "studied_credits": 120,
            "num_of_prev_attempts": 0,
        })
        assert result["risk_level"] == "low"
        assert result["prediction"] == 0

    def test_all_defaults_returns_valid_result(self, loaded_predictor):
        """The literal default student should produce a structured result."""
        set_risk_probability(loaded_predictor, 0.50)
        result = loaded_predictor.predict({
            "avg_score": 50.0,
            "completion_rate": 0.5,
            "total_clicks": 0,
            "studied_credits": 60,
            "num_of_prev_attempts": 0,
        })
        assert isinstance(result["risk_score"], int)
        assert 0 <= result["risk_score"] <= 100
        assert result["risk_level"] in ("low", "medium", "high")
