"""LLM client implementations for intervention personalization."""

from openai import AsyncOpenAI

from src.config import get_settings


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


def get_llm_client() -> OpenAIClient:
    """Get the OpenAI LLM client."""
    settings = get_settings()
    print(f"[LLM] Using OpenAI provider with model: {settings.openai_model}")
    return OpenAIClient()
