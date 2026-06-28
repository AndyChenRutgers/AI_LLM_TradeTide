from anthropic import Anthropic
import openai
from google import genai
from google.genai import types
from typing import Any
from models.schemas import LLMConfig
from config import settings


def resolve_client(llm_config: LLMConfig) -> Any:
    print(f"[LLMRouter] Resolving client provider={llm_config.provider} model={llm_config.llm_model}")

    if llm_config.provider == "anthropic":
        if not settings.ANTHROPIC_API_KEY:
            raise ValueError("ANTHROPIC_API_KEY not set")
        return Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    if llm_config.provider == "openai":
        if not settings.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY not set")
        return openai.OpenAI(api_key=settings.OPENAI_API_KEY)

    if llm_config.provider == "google":
        if not settings.GOOGLE_API_KEY:
            raise ValueError("GOOGLE_API_KEY not set")
        return genai.Client(api_key=settings.GOOGLE_API_KEY)

    raise ValueError(f"Unsupported provider: {llm_config.provider}")


def call_llm(
    client: Any,
    llm_config: LLMConfig,
    system_prompt: str,
    user_message: str,
) -> tuple[str, int, int]:
    """
    Simple LLM call with no tools — used by orchestrator
    for self-correction and synthesis steps.
    """
    print(f"[LLMRouter] call_llm provider={llm_config.provider} model={llm_config.llm_model}")

    try:
        if llm_config.provider == "anthropic":
            response = client.messages.create(
                model=llm_config.llm_model,
                max_tokens=llm_config.max_token,
                temperature=llm_config.temperature,
                system=system_prompt,
                messages=[{"role": "user", "content": user_message}],
            )
            text = next((b.text for b in response.content if hasattr(b, "text")), "")
            print(f"[LLMRouter] Anthropic done tokens={response.usage.input_tokens}+{response.usage.output_tokens}")
            return text, response.usage.input_tokens, response.usage.output_tokens

        if llm_config.provider == "openai":
            response = client.chat.completions.create(
                model=llm_config.llm_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user",   "content": user_message},
                ],
                max_completion_tokens=llm_config.max_token,
                temperature=llm_config.temperature,
            )
            text  = response.choices[0].message.content or ""
            usage = response.usage
            print(f"[LLMRouter] OpenAI done tokens={usage.prompt_tokens}+{usage.completion_tokens}")
            return text, usage.prompt_tokens, usage.completion_tokens

        if llm_config.provider == "google":
            response = client.models.generate_content(
                model=llm_config.llm_model,
                contents=user_message,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    temperature=llm_config.temperature,
                    max_output_tokens=llm_config.max_token,
                ),
            )
            text = response.text or ""
            prompt_token   = getattr(response.usage_metadata, "prompt_token_count", 0)
            completion_token   = getattr(response.usage_metadata, "candidates_token_count", 0)
            print(f"[LLMRouter] Google done tokens={prompt_token}+{completion_token}")
            return text, prompt_token, completion_token

        raise ValueError(f"Unsupported provider: {llm_config.provider}")

    except Exception as e:
        print(f"[LLMRouter] ERROR provider={llm_config.provider}: {e}")
        raise


def call_llm_with_tools(
    client: Any,
    llm_config: LLMConfig,
    system_prompt: str,
    user_message: str,
    tools: list[dict],
    tool_results: dict | None = None,
) -> tuple[str, list[dict], int, int]:
    """
    Agentic LLM call with tool definitions.
    Returns (final_text, tool_calls, prompt_tokens, completion_tokens).
    tool_calls is a list of { name, input } dicts the LLM wants to execute.
    If tool_results is provided, sends them back to the LLM for final reasoning.
    """
    print(f"[LLMRouter] call_llm_with_tools provider={llm_config.provider} tools={[t['name'] for t in tools]}")

    try:
        if llm_config.provider == "anthropic":
            return _anthropic_tool_call(client, llm_config, system_prompt, user_message, tools, tool_results)

        if llm_config.provider == "openai":
            return _openai_tool_call(client, llm_config, system_prompt, user_message, tools, tool_results)

        if llm_config.provider == "google":
            return _google_tool_call(client, llm_config, system_prompt, user_message, tools, tool_results)

        raise ValueError(f"Unsupported provider: {llm_config.provider}")

    except Exception as e:
        print(f"[LLMRouter] tool call ERROR provider={llm_config.provider}: {e}")
        raise


# Anthropic tool calling

def _anthropic_tool_call(
    client, llm_config, system_prompt, user_message, tools, tool_results
) -> tuple[str, list[dict], int, int]:
    # Convert tool definitions to Anthropic format
    anthropic_tools = [
        {
            "name": t["name"],
            "description": t["description"],
            "input_schema": t["input_schema"],
        }
        for t in tools
    ]

    messages = [{"role": "user", "content": user_message}]

    # If tool results provided, add them as tool_result blocks
    if tool_results:
        # Re-send with tool results so LLM can reason about them
        messages = [
            {"role": "user", "content": user_message},
            # assistant message with tool_use blocks will be injected below
        ]

    response = client.messages.create(
        model=llm_config.llm_model,
        max_tokens=llm_config.max_token,
        temperature=llm_config.temperature,
        system=system_prompt,
        tools=anthropic_tools,
        messages=messages,
    )

    prompt_token = response.usage.input_tokens
    completion_token = response.usage.output_tokens
    tool_calls = []
    text = ""

    if response.stop_reason == "tool_use":
        # LLM wants to call tools
        for block in response.content:
            if block.type == "tool_use":
                tool_calls.append({
                    "id": block.id,
                    "name": block.name,
                    "input": block.input,
                })
                print(f"[LLMRouter] Anthropic requests tool: {block.name} input={block.input}")

        if tool_results:
            # Build follow-up messages with tool results
            assistant_content = [
                {
                    "type": "tool_use",
                    "id": tc["id"],
                    "name": tc["name"],
                    "input": tc["input"],
                }
                for tc in tool_calls
            ]
            tool_result_content = [
                {
                    "type": "tool_result",
                    "tool_use_id": tc["id"],
                    "content": str(tool_results.get(tc["name"], "")),
                }
                for tc in tool_calls
            ]
            follow_up = client.messages.create(
                model=llm_config.llm_model,
                max_tokens=llm_config.max_token,
                temperature=llm_config.temperature,
                system=system_prompt,
                tools=anthropic_tools,
                messages=[
                    {"role": "user", "content": user_message},
                    {"role": "assistant", "content": assistant_content},
                    {"role": "user", "content": tool_result_content},
                ],
            )
            text = next(
                (b.text for b in follow_up.content if hasattr(b, "text")), ""
            )
            prompt_token += follow_up.usage.input_tokens
            completion_token += follow_up.usage.output_tokens

    else:
        # LLM responded directly without tool calls
        text = next(
            (b.text for b in response.content if hasattr(b, "text")), ""
        )

    print(f"[LLMRouter] Anthropic tool call done tokens={prompt_token}+{completion_token}")
    return text, tool_calls, prompt_token, completion_token


# OpenAI tool calling

def _openai_tool_call(
    client, llm_config, system_prompt, user_message, tools, tool_results
) -> tuple[str, list[dict], int, int]:
    # Convert tool definitions to OpenAI function format
    openai_tools = [
        {
            "type": "function",
            "function": {
                "name": t["name"],
                "description": t["description"],
                "parameters": t["input_schema"],
            },
        }
        for t in tools
    ]

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_message},
    ]

    response = client.chat.completions.create(
        model=llm_config.llm_model,
        messages=messages,
        tools=openai_tools,
        tool_choice="auto",
        max_completion_tokens=llm_config.max_token,
        temperature=llm_config.temperature,
    )

    prompt_token = response.usage.prompt_tokens
    completion_token = response.usage.completion_tokens
    tool_calls = []
    text = ""
    message = response.choices[0].message

    if message.tool_calls:
        import json
        for tc in message.tool_calls:
            tool_calls.append({
                "id": tc.id,
                "name": tc.function.name,
                "input": json.loads(tc.function.arguments),
            })
            print(f"[LLMRouter] OpenAI requests tool: {tc.function.name}")

        if tool_results:
            # Add assistant message and tool results then call again
            messages.append(message)
            for tc in message.tool_calls:
                messages.append({
                    "role": "tool",
                    "tool_call_id": tc.id,
                    "content": str(tool_results.get(tc.function.name, "")),
                })

            follow_up = client.chat.completions.create(
                model=llm_config.llm_model,
                messages=messages,
                max_completion_tokens=llm_config.max_token,
                temperature=llm_config.temperature,
            )
            text = follow_up.choices[0].message.content or ""
            prompt_token += follow_up.usage.prompt_tokens
            completion_token += follow_up.usage.completion_tokens

    else:
        text = message.content or ""

    print(f"[LLMRouter] OpenAI tool call done tokens={prompt_token}+{completion_token}")
    return text, tool_calls, prompt_token, completion_token


# Google/Gemini tool calling

def _google_tool_call(
    client, llm_config, system_prompt, user_message, tools, tool_results
) -> tuple[str, list[dict], int, int]:
    import json

    # Convert tool definitions to Google function declarations
    def to_schema(schema: dict) -> types.Schema:
        props = {}
        for k, v in schema.get("properties", {}).items():
            if isinstance(v, dict):
                props[k] = types.Schema(
                    type=v.get("type", "string"),
                    description=v.get("description", ""),
                )
        return types.Schema(
            type=schema.get("type", "object"),
            properties=props,
        )

    google_tools = [
        types.Tool(function_declarations=[
            types.FunctionDeclaration(
                name=t["name"],
                description=t["description"],
                parameters=to_schema(t["input_schema"]),
            )
            for t in tools
        ])
    ]

    config = types.GenerateContentConfig(
        system_instruction=system_prompt,
        temperature=llm_config.temperature,
        max_output_tokens=llm_config.max_token,
        tools=google_tools,
    )

    response = client.models.generate_content(
        model=llm_config.llm_model,
        contents=user_message,
        config=config,
    )

    prompt_token = getattr(response.usage_metadata, "prompt_token_count", 0)
    completion_token = getattr(response.usage_metadata, "candidates_token_count", 0)
    tool_calls = []
    text = ""

    # Check for function calls in response parts
    model_parts = []
    candidate = response.candidates[0] if response.candidates else None
    if candidate:
        model_parts = candidate.content.parts
        for part in model_parts:
            if hasattr(part, "function_call") and part.function_call:
                fc = part.function_call
                tool_calls.append({
                    "name":  fc.name,
                    "input": dict(fc.args),
                })
                print(f"[LLMRouter] Google requests tool: {fc.name}")

    if tool_calls and tool_results:
        # Build follow-up with function responses
        function_responses = [
            types.Part(
                function_response=types.FunctionResponse(
                    name=tc["name"],
                    response={"result": str(tool_results.get(tc["name"], ""))},
                )
            )
            for tc in tool_calls
        ]

        follow_up = client.models.generate_content(
            model=llm_config.llm_model,
            contents=[
                types.Content(role="user",  parts=[types.Part(text=user_message)]),
                types.Content(role="model", parts=model_parts),
                types.Content(role="user", parts=function_responses),
            ],
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                temperature=llm_config.temperature,
                max_output_tokens=llm_config.max_token,
                tools=google_tools,
            ),
        )
        text = follow_up.text or ""
        prompt_token += getattr(follow_up.usage_metadata, "prompt_token_count",     0)
        completion_token += getattr(follow_up.usage_metadata, "candidates_token_count", 0)

    elif not tool_calls:
        text = response.text or ""

    print(f"[LLMRouter] Google tool call done tokens={prompt_token}+{completion_token}")
    return text, tool_calls, prompt_token, completion_token
