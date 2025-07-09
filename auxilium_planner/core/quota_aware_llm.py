#!/usr/bin/env python3
"""
Quota-Aware LLM Wrapper

Wraps Google Generative AI chat models with automatic quota management and API key rotation.
"""

import os
import logging
from typing import Any, Dict, List, Optional, Iterator, AsyncIterator

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import BaseMessage, HumanMessage
from langchain_core.outputs import ChatGeneration, LLMResult
from langchain_core.callbacks import CallbackManagerForLLMRun, AsyncCallbackManagerForLLMRun

from .quota_manager import get_quota_manager, QuotaManager
import asyncio
logger = logging.getLogger(__name__)


class QuotaAwareLLMFactory:
    """
    Factory for creating quota-aware LLM instances that automatically handle API key rotation.
    
    This approach creates fresh LLM instances with working API keys instead of trying to 
    modify existing instances, which is more reliable.
    """
    
    def __init__(self, **default_kwargs):
        self.default_kwargs = default_kwargs
        self.quota_manager = None
        try:
            self.quota_manager = get_quota_manager()
            logger.info("🔑 Quota-aware LLM factory initialized with quota manager")
        except RuntimeError:
            logger.warning("⚠️ Quota manager not available, using standard LLM")
    
    async def create_working_llm(self, pause_callback=None) -> ChatGoogleGenerativeAI:
        """
        Create an LLM instance with a working API key.
        
        Args:
            pause_callback: Optional callback for quota pause notifications
        
        Returns:
            ChatGoogleGenerativeAI instance with a working API key
        """
        if not self.quota_manager:
            # No quota manager, use the default key
            return ChatGoogleGenerativeAI(**self.default_kwargs)
        
        # Check if we need to wait for rate limit management
        await self.quota_manager.check_and_wait_if_needed(pause_callback)
        
        # Try to find a working API key
        max_attempts = len(self.quota_manager.api_keys)
        
        for attempt in range(max_attempts):
            try:
                # Get current API key from quota manager
                current_key = self.quota_manager.record_request()
                
                # Create LLM instance with this key
                kwargs = self.default_kwargs.copy()
                kwargs['google_api_key'] = current_key
                
                llm = ChatGoogleGenerativeAI(**kwargs)
                
                # Test the key with a simple request
                test_message = HumanMessage(content="Test")
                await llm.ainvoke([test_message])
                
                logger.info(f"✅ Found working API key ending in ...{current_key[-4:]}")
                return llm
                
            except Exception as e:
                error_str = str(e).lower()
                if "429" in error_str or "quota" in error_str or "rate limit" in error_str:
                    logger.warning(f"🚨 Key ending in ...{current_key[-4:]} is quota exhausted")
                    
                    # Mark this key as exhausted and try next one
                    if self.quota_manager.handle_rate_limit_error(str(e)):
                        logger.info(f"🔄 Trying next available API key...")
                        continue
                    else:
                        logger.error("❌ All API keys are exhausted!")
                        break
                else:
                    # Non-quota error, re-raise
                    logger.error(f"❌ Non-quota error with key: {e}")
                    raise e
        
        # If we get here, all keys are exhausted
        raise Exception("All API keys have reached their quotas. Please try again later or upgrade your plan.")
    
    async def get_working_llm(self, pause_callback=None) -> ChatGoogleGenerativeAI:
        """Get a working LLM instance, alias for create_working_llm."""
        return await self.create_working_llm(pause_callback)


class QuotaAwareChatGoogleGenerativeAI:
    """
    Quota-aware wrapper that delegates to working LLM instances.
    
    This approach creates fresh instances with working keys instead of trying to 
    modify existing instances when quotas are hit.
    """
    
    def __init__(self, **kwargs):
        self.factory = QuotaAwareLLMFactory(**kwargs)
        self._current_llm = None
        self.last_token_usage = {'input': 0, 'output': 0, 'total': 0}
    
    async def _get_working_llm(self, pause_callback=None) -> ChatGoogleGenerativeAI:
        """Get a working LLM instance."""
        return await self.factory.create_working_llm(pause_callback)
    
    def _capture_token_usage(self, response):
        """Capture token usage from LLM response."""
        if hasattr(response, 'usage_metadata') and response.usage_metadata:
            usage = response.usage_metadata
            self.last_token_usage = {
                'input': usage.get('input_tokens', 0),
                'output': usage.get('output_tokens', 0),
                'total': usage.get('total_tokens', 0)
            }
            
            # Log token usage for immediate feedback
            logger.info(f"📊 Tokens: {self.last_token_usage['input']} in + {self.last_token_usage['output']} out = {self.last_token_usage['total']} total")
            
            # Calculate cost - Gemini 2.5 Flash pricing
            input_cost = (self.last_token_usage['input'] / 1_000_000) * 0.30   # $0.30 per 1M input tokens
            output_cost = (self.last_token_usage['output'] / 1_000_000) * 2.50  # $2.50 per 1M output tokens
            total_cost = input_cost + output_cost
            
            if total_cost > 0.0001:  # Show cost if > 0.01 cents
                logger.info(f"💵 Cost: ${total_cost:.4f}")
    
    async def ainvoke(self, messages: List[BaseMessage], **kwargs) -> Any:
        """Async invoke with automatic quota management."""
        llm = await self._get_working_llm()
        response = await llm.ainvoke(messages, **kwargs)
        
        # Capture token usage for logging
        self._capture_token_usage(response)
        
        return response
    
    def invoke(self, messages: List[BaseMessage], **kwargs) -> Any:
        """Sync invoke with automatic quota management."""
        import asyncio
        return asyncio.run(self.ainvoke(messages, **kwargs))
    
    async def astream(self, messages: List[BaseMessage], **kwargs) -> AsyncIterator[Any]:
        """Async stream with automatic quota management."""
        llm = await self._get_working_llm()
        async for chunk in llm.astream(messages, **kwargs):
            yield chunk
    
    def stream(self, messages: List[BaseMessage], **kwargs) -> Iterator[Any]:
        """Sync stream with automatic quota management."""
        import asyncio
        
        async def _async_stream():
            async for chunk in self.astream(messages, **kwargs):
                yield chunk
        
        # Convert async generator to sync
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            gen = _async_stream()
            while True:
                try:
                    yield loop.run_until_complete(gen.__anext__())
                except StopAsyncIteration:
                    break
        finally:
            loop.close()
    
    def bind_tools(self, tools):
        """Return a wrapper that binds tools to working LLM instances."""
        parent_self = self  # Capture reference to parent for token usage tracking
        
        class ToolBoundWrapper:
            def __init__(self, factory, tools):
                self.factory = factory
                self.tools = tools
                self.parent = parent_self
            
            async def _get_working_llm(self):
                llm = await self.factory.create_working_llm()
                return llm.bind_tools(self.tools)
            
            async def ainvoke(self, messages, **kwargs):
                bound_llm = await self._get_working_llm()
                response = await bound_llm.ainvoke(messages, **kwargs)
                
                # Capture token usage in parent for logging
                self.parent._capture_token_usage(response)
                
                return response
            
            def invoke(self, messages, **kwargs):
                import asyncio
                return asyncio.run(self.ainvoke(messages, **kwargs))
        
        return ToolBoundWrapper(self.factory, tools)
    
    # Delegate other attributes to a working LLM instance
    def __getattr__(self, name):
        """Delegate unknown attributes to the LLM class."""
        # For non-callable attributes, return defaults
        if name in ['temperature', 'max_output_tokens', 'top_p', 'top_k', 'model']:
            return getattr(ChatGoogleGenerativeAI, name, None)
        
        # For other attributes, create a wrapper that gets a working LLM
        async def _async_method(*args, **kwargs):
            llm = await self._get_working_llm()
            method = getattr(llm, name)
            return await method(*args, **kwargs) if asyncio.iscoroutinefunction(method) else method(*args, **kwargs)
        
        def _sync_method(*args, **kwargs):
            import asyncio
            return asyncio.run(_async_method(*args, **kwargs))
        
        return _sync_method


def create_quota_aware_chat_model(**kwargs) -> QuotaAwareChatGoogleGenerativeAI:
    """Factory function to create a quota-aware chat model."""
    return QuotaAwareChatGoogleGenerativeAI(**kwargs) 