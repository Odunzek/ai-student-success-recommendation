"""Student data loader utilities."""

from pathlib import Path

import pandas as pd

from src.config import get_settings


class StudentDataLoader:
    """Loader for student data from CSV files."""

    _instance: "StudentDataLoader | None" = None
    _initialized: bool = False

    def __new__(cls) -> "StudentDataLoader":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._initialized = True
        self.settings = get_settings()
        self._data: pd.DataFrame | None = None
        self._source_path: Path | None = None

    def load(self, path: Path | None = None) -> None:
        """Load student data from CSV.

        Args:
            path: Optional path to CSV file. Uses default from settings if not provided.
        """
        file_path = path or self.settings.student_data_path
        self._data = pd.read_csv(file_path)
        self._source_path = Path(file_path)

        # Create a simple index if not present
        if "student_id" not in self._data.columns:
            self._data["student_id"] = self._data.index.astype(str)

    def reload(self, path: Path | None = None) -> None:
        """Hot-reload data from a new path without restart.

        Args:
            path: Path to new CSV file. Uses default from settings if not provided.
        """
        self.load(path)

    def get_source_info(self) -> dict:
        """Get information about the current data source.

        Returns:
            Dict with source path, record count, and available features
        """
        if not self.is_loaded:
            return {
                "source": "none",
                "record_count": 0,
                "features": [],
            }

        # Determine source name
        if self._source_path:
            source_name = self._source_path.name
            # Check if it's an uploaded file
            if "uploads" in str(self._source_path):
                source_name = f"uploaded: {source_name}"
        else:
            source_name = "unknown"

        return {
            "source": source_name,
            "record_count": len(self._data),
            "features": list(self._data.columns),
        }

    @property
    def data(self) -> pd.DataFrame:
        """Get the loaded data."""
        if self._data is None:
            raise RuntimeError("Data not loaded. Call load() first.")
        return self._data

    @property
    def is_loaded(self) -> bool:
        """Check if data is loaded."""
        return self._data is not None

    def get_student(self, student_id: str) -> dict | None:
        """Get a student record by ID.

        Args:
            student_id: Student identifier (row index as string)

        Returns:
            Dict of student data or None if not found
        """
        if not self.is_loaded:
            return None

        try:
            idx = int(student_id)
            if 0 <= idx < len(self._data):
                row = self._data.iloc[idx]
                return row.to_dict()
        except (ValueError, IndexError):
            pass

        # Try matching on student_id column if exists
        if "student_id" in self._data.columns:
            matches = self._data[self._data["student_id"] == student_id]
            if len(matches) > 0:
                return matches.iloc[0].to_dict()

        return None

    def get_all_students(
        self,
        limit: int = 100,
        offset: int = 0,
        search: str | None = None,
        risk_level: str | None = None,
    ) -> tuple[list[dict], int]:
        """Get paginated list of students with optional filtering.

        Args:
            limit: Maximum number of records to return
            offset: Number of records to skip
            search: Optional search string to filter by student_id
            risk_level: Optional risk level filter ('low', 'medium', 'high')

        Returns:
            Tuple of (list of student dicts, total matching count)
        """
        if not self.is_loaded:
            return [], 0

        df = self._data.copy()

        # Apply search filter if provided
        if search:
            search_lower = search.lower()
            # Search in student_id column
            if "student_id" in df.columns:
                mask = df["student_id"].astype(str).str.lower().str.contains(search_lower, na=False)
                df = df[mask]

        # Apply risk level filter if provided
        if risk_level and risk_level in ("low", "medium", "high"):
            # Calculate risk scores for filtering
            # Using the same thresholds as predictor.py (70 for high, 40 for medium)
            from src.models.predictor import get_predictor
            predictor = get_predictor()

            if predictor.is_loaded:
                # Filter by predicted risk level
                risk_mask = []
                for idx, row in df.iterrows():
                    try:
                        features = {
                            "num_of_prev_attempts": int(row.get("num_of_prev_attempts", 0)),
                            "studied_credits": int(row.get("studied_credits", 60)),
                            "avg_score": float(row.get("avg_score", 50)),
                            "total_clicks": int(row.get("total_clicks", 0)),
                            "completion_rate": float(row.get("completion_rate", 0.5)),
                        }
                        result = predictor.predict(features)
                        risk_mask.append(result.get("risk_level", "low") == risk_level)
                    except Exception:
                        risk_mask.append(False)
                df = df[risk_mask]

        total_count = len(df)
        subset = df.iloc[offset:offset + limit]
        return subset.to_dict(orient="records"), total_count

    def get_statistics(self) -> dict:
        """Get summary statistics of the student data.

        Returns:
            Dict with counts and aggregations
        """
        if not self.is_loaded:
            return {}

        df = self._data
        total = len(df)

        # Risk distribution
        at_risk_count = int(df["at_risk"].sum()) if "at_risk" in df.columns else 0

        # Average metrics
        stats = {
            "total_students": total,
            "at_risk_count": at_risk_count,
            "not_at_risk_count": total - at_risk_count,
            "risk_percentage": round(at_risk_count / total * 100, 1) if total > 0 else 0,
        }

        # Numeric column stats
        numeric_cols = ["avg_score", "completion_rate", "total_clicks", "studied_credits"]
        for col in numeric_cols:
            if col in df.columns:
                stats[f"avg_{col}"] = round(float(df[col].mean()), 2)
                stats[f"min_{col}"] = round(float(df[col].min()), 2)
                stats[f"max_{col}"] = round(float(df[col].max()), 2)

        return stats

    def get_risk_distribution(self) -> dict:
        """Get distribution of students by risk level.

        Returns:
            Dict with counts by risk category
        """
        if not self.is_loaded:
            return {}

        df = self._data

        # Calculate risk scores if not present
        # (In production, these would be pre-calculated)
        if "at_risk" in df.columns:
            at_risk = df["at_risk"].value_counts().to_dict()
            return {
                "at_risk": int(at_risk.get(1, 0)),
                "not_at_risk": int(at_risk.get(0, 0)),
            }

        return {}


def get_data_loader() -> StudentDataLoader:
    """Get the singleton data loader instance."""
    return StudentDataLoader()
