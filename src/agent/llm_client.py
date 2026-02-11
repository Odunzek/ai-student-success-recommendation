"""LLM client implementations for intervention personalization."""

import httpx
from openai import AsyncOpenAI

from src.config import get_settings
from src.api.routes.settings import get_current_model


class OpenAIClient:
    """Client for OpenAI API."""

    def __init__(self):
        self.settings = get_settings()
        self.client = AsyncOpenAI(
            api_key=self.settings.openai_api_key,
            base_url=self.settings.openai_base_url,  # None uses default
        )
        self.model = self.settings.openai_model
        self.timeout = self.settings.llm_timeout

    async def generate(
        self,
        prompt: str,
        system_prompt: str | None = None,
    ) -> str | None:
        """Generate a response from OpenAI."""
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        print(f"[LLM] Calling OpenAI {self.model} with prompt length: {len(prompt)}")

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.7,
                max_tokens=1500,
                timeout=self.timeout,
            )
            result = response.choices[0].message.content
            print(f"[LLM] Response length: {len(result) if result else 0}")

            if not result or not result.strip():
                return "I apologize, but I couldn't generate a response. Please try again."

            return result.strip()
        except Exception as e:
            print(f"[LLM] OpenAI error: {type(e).__name__}: {e}")
            return None

    async def is_available(self) -> bool:
        """Check if OpenAI API is accessible."""
        return self.settings.openai_api_key is not None and len(self.settings.openai_api_key) > 0


class OllamaClient:
    """Client for Ollama LLM API (local inference)."""

    def __init__(self):
        self.settings = get_settings()
        self.base_url = self.settings.ollama_base_url
        self.timeout = self.settings.llm_timeout

    @property
    def model(self) -> str:
        """Get current model, respecting runtime override."""
        return get_current_model()

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

        print(f"[LLM] Calling Ollama {self.model} with prompt length: {len(prompt)}")

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


def get_llm_client() -> OpenAIClient | OllamaClient:
    """Get the configured LLM client based on settings."""
    settings = get_settings()

    # Use OpenAI if configured
    if settings.llm_provider == "openai" and settings.openai_api_key:
        print(f"[LLM] Using OpenAI provider with model: {settings.openai_model}")
        return OpenAIClient()

    # Fall back to Ollama
    print(f"[LLM] Using Ollama provider with model: {settings.ollama_model}")
    return OllamaClient()
