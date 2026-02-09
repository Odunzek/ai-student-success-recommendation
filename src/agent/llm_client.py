"""Ollama LLM client for intervention personalization."""

import httpx

from src.config import get_settings


class OllamaClient:
    """Client for Ollama LLM API."""

    def __init__(self):
        self.settings = get_settings()
        self.base_url = self.settings.ollama_base_url
        self.model = self.settings.ollama_model
        self.timeout = self.settings.llm_timeout

    async def generate(
        self,
        prompt: str,
        system_prompt: str | None = None,
    ) -> str | None:
        """Generate a response from the LLM."""
        url = f"{self.base_url}/api/generate"

        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
        }

        if system_prompt:
            payload["system"] = system_prompt

        print(f"[LLM] Calling {self.model} with prompt length: {len(prompt)}")

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(url, json=payload)
                response.raise_for_status()
                data = response.json()

                result = data.get("response", "")
                print(f"[LLM] Response length: {len(result)}")

                # Handle empty response
                if not result or not result.strip():
                    print(f"[LLM] Empty response. Full data: {data}")
                    return "I apologize, but I couldn't generate a response. Please try again."

                return result.strip()
        except httpx.TimeoutException:
            print(f"[LLM] Request timed out after {self.timeout}s")
            return None
        except httpx.HTTPStatusError as e:
            print(f"[LLM] HTTP error: {e.response.status_code} - {e.response.text}")
            return None
        except httpx.ConnectError:
            print("[LLM] Could not connect to Ollama. Is it running?")
            return None
        except Exception as e:
            print(f"[LLM] Error: {type(e).__name__}: {e}")
            return None

    async def is_available(self) -> bool:
        """Check if Ollama is available and the model is loaded."""
        url = f"{self.base_url}/api/tags"

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(url)
                response.raise_for_status()
                data = response.json()

                # Check if our model is available
                models = data.get("models", [])
                model_names = [m.get("name", "") for m in models]

                # Check for exact match or match without tag
                model_base = self.model.split(":")[0]
                for name in model_names:
                    if name == self.model or name.startswith(model_base):
                        return True

                print(f"Model {self.model} not found. Available: {model_names}")
                return False

        except Exception as e:
            print(f"Ollama availability check failed: {e}")
            return False


def get_llm_client() -> OllamaClient:
    """Get an LLM client instance."""
    return OllamaClient()
