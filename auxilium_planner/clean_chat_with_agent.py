#!/usr/bin/env python3
"""
Clean Chat with Agent

Simple interface to interact with the Auxilium AI agent system.
Supports both single messages and interactive chat mode with multi-turn conversations.

Usage: 
  python clean_chat_with_agent.py "Your message here"
  python clean_chat_with_agent.py --interactive
  python clean_chat_with_agent.py --list-threads
  python clean_chat_with_agent.py --continue <thread_id> "Your message"
"""

import asyncio
import sys
import os
import json
from datetime import datetime
from typing import Optional, Dict, Any, List
import traceback
import argparse

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from agents.agent_graph import AgentGraph
from agents.memory_system import MemorySystem
from core.config import settings
from core.logging_config import get_logger
from core.quota_manager import get_quota_manager

logger = get_logger("clean_chat")


class EnhancedAgentGraph(AgentGraph):
    """Enhanced AgentGraph with detailed logging for clean_chat interface."""
    
    def __init__(self):
        super().__init__()
        self.step_count = 0
        self.current_agent = None
        self.token_usage = {'input': 0, 'output': 0, 'total': 0}
        self.tool_calls = []
        self.tool_results = []
    
    async def process_user_input(self, user_input: str, thread_id: Optional[str] = None) -> str:
        """Process user input with enhanced logging."""
        # Reset counters
        self.step_count = 0
        self.current_agent = None
        self.token_usage = {'input': 0, 'output': 0, 'total': 0}
        self.tool_calls = []
        self.tool_results = []
        
        print(f"\n🚀 STARTING AGENT EXECUTION")
        print(f"{'═' * 60}")
        print(f"📥 User Input: {user_input}")
        print(f"🧵 Thread: {thread_id[:8] + '...' if thread_id else 'NEW'}")
        print(f"🕐 Time: {datetime.now().strftime('%H:%M:%S')}")
        print(f"{'═' * 60}")
        
        try:
            # Execute with detailed step logging
            result = await self._execute_with_detailed_logging(user_input, thread_id)
            
            # Print execution summary
            self._print_execution_summary()
            
            return result
        except Exception as e:
            print(f"\n❌ EXECUTION ERROR: {e}")
            traceback.print_exc()
            raise
    
    async def _execute_with_detailed_logging(self, user_input: str, thread_id: Optional[str] = None) -> str:
        """Execute the graph with step-by-step logging."""
        from langchain_core.messages import HumanMessage
        from langchain_core.runnables import RunnableConfig
        
        # Create or get thread ID
        if not thread_id:
            thread_id = await self.memory_system.create_new_thread()
        
        # Create initial state
        initial_state = {
            "messages": [HumanMessage(content=user_input)],
            "thread_id": thread_id
        }
        
        # Configure the run
        config = RunnableConfig(
            configurable={"thread_id": thread_id},
            recursion_limit=100
        )
        
        print(f"\n🎬 WORKFLOW EXECUTION")
        print(f"{'─' * 60}")
        
        # Stream execution to capture each step
        async for chunk in self.graph.astream(initial_state, config):
            await self._log_workflow_step(chunk)
        
        # Get final result
        final_result = await self.graph.ainvoke(initial_state, config)
        return self._extract_final_response(final_result)
    
    async def _log_workflow_step(self, chunk: Dict[str, Any]):
        """Log each workflow step with clear organization."""
        self.step_count += 1
        
        for node_name, node_data in chunk.items():
            # Agent transitions
            if node_name in ['planning_agent', 'executor_agent']:
                await self._log_agent_transition(node_name, node_data)
            
            # Tool execution
            elif node_name in ['planning_tools', 'executor_tools']:
                await self._log_tool_execution(node_name, node_data)
            
            # Other nodes
            else:
                await self._log_other_node(node_name, node_data)
    
    async def _log_agent_transition(self, node_name: str, node_data: Dict[str, Any]):
        """Log agent transitions with clear headers."""
        if self.current_agent != node_name:
            self.current_agent = node_name
            
            if node_name == 'planning_agent':
                print(f"\n🧠 PLANNING AGENT")
                print(f"{'─' * 40}")
                print(f"⏰ Step {self.step_count} | Analyzing user request and creating plan")
            else:
                print(f"\n⚡ EXECUTOR AGENT") 
                print(f"{'─' * 40}")
                print(f"⏰ Step {self.step_count} | Executing planned actions")
        
        # Log agent messages
        messages = node_data.get('messages', [])
        for msg in messages:
            await self._log_agent_message(msg)
    
    async def _log_agent_message(self, message):
        """Log individual agent messages with token tracking."""
        msg_type = type(message).__name__
        
        if msg_type == 'AIMessage':
            content = getattr(message, 'content', '')
            tool_calls = getattr(message, 'tool_calls', [])
            usage_metadata = getattr(message, 'usage_metadata', {})
            
            # Track token usage - try multiple sources
            input_tokens = 0
            output_tokens = 0
            total_tokens = 0
            
            # First try: usage_metadata from message (traditional way)
            if usage_metadata:
                input_tokens = usage_metadata.get('input_tokens', 0)
                output_tokens = usage_metadata.get('output_tokens', 0)
                total_tokens = usage_metadata.get('total_tokens', 0)
            
            # Second try: get from LLM instances if available
            if total_tokens == 0:
                try:
                    # Try to get token usage from planning or executor LLM
                    if hasattr(self, 'planning_llm') and hasattr(self.planning_llm, 'last_token_usage'):
                        usage = self.planning_llm.last_token_usage
                        if usage['total'] > 0:
                            input_tokens = usage['input']
                            output_tokens = usage['output']
                            total_tokens = usage['total']
                            # Reset to avoid double counting
                            self.planning_llm.last_token_usage = {'input': 0, 'output': 0, 'total': 0}
                    
                    elif hasattr(self, 'executor_llm') and hasattr(self.executor_llm, 'last_token_usage'):
                        usage = self.executor_llm.last_token_usage
                        if usage['total'] > 0:
                            input_tokens = usage['input']
                            output_tokens = usage['output']
                            total_tokens = usage['total']
                            # Reset to avoid double counting
                            self.executor_llm.last_token_usage = {'input': 0, 'output': 0, 'total': 0}
                except:
                    pass  # Ignore errors in token extraction
            
            # Update totals if we found token usage
            if total_tokens > 0:
                self.token_usage['input'] += input_tokens
                self.token_usage['output'] += output_tokens  
                self.token_usage['total'] += total_tokens
                
                print(f"📊 Tokens: {input_tokens} in + {output_tokens} out = {total_tokens} total")
                
                # Calculate and show cost for this request - Gemini 2.5 Flash pricing
                input_cost = (input_tokens / 1_000_000) * 0.30   # $0.30 per 1M input tokens
                output_cost = (output_tokens / 1_000_000) * 2.50  # $2.50 per 1M output tokens
                total_cost = input_cost + output_cost
                
                if total_cost > 0.0001:  # Show cost if > 0.01 cents
                    print(f"💵 Request Cost: ${total_cost:.4f}")
            
            # Show AI response content
            if content:
                if isinstance(content, list):
                    # Handle structured content with thinking
                    thoughts = []
                    text_content = []
                    
                    for part in content:
                        if isinstance(part, dict):
                            if part.get("type") == "thinking":
                                thoughts.append(part.get("thinking", ""))
                            elif part.get("type") == "text":
                                text_content.append(part.get("text", ""))
                        else:
                            text_content.append(str(part))
                    
                    if thoughts:
                        print(f"💭 AI Thinking:")
                        for thought in thoughts[:1]:  # Show first thinking block
                            print(f"   {thought[:200]}{'...' if len(thought) > 200 else ''}")
                    
                    if text_content:
                        combined_text = ' '.join(text_content)
                        print(f"🤖 AI Response: {combined_text[:200]}{'...' if len(combined_text) > 200 else ''}")
                else:
                    print(f"🤖 AI Response: {str(content)[:200]}{'...' if len(str(content)) > 200 else ''}")
            
            # Show tool calls
            if tool_calls:
                print(f"🔧 Tool Calls ({len(tool_calls)}):")
                for i, tool_call in enumerate(tool_calls, 1):
                    tool_name = tool_call.get('name', 'unknown')
                    args = tool_call.get('args', {})
                    tool_id = tool_call.get('id', 'unknown')
                    
                    print(f"   {i}. {tool_name} (id: {tool_id[:8]}...)")
                    
                    # Show key arguments (limit display)
                    if args:
                        for key, value in list(args.items())[:3]:  # Show first 3 args
                            if isinstance(value, str):
                                display_value = value[:80] + '...' if len(value) > 80 else value
                            else:
                                display_value = str(value)[:80]
                            print(f"      {key}: {display_value}")
                        
                        if len(args) > 3:
                            print(f"      ... and {len(args) - 3} more arguments")
                    
                    # Store for summary
                    self.tool_calls.append({
                        'name': tool_name,
                        'id': tool_id,
                        'args_count': len(args)
                    })
        
        elif msg_type == 'HumanMessage':
            content = getattr(message, 'content', '')
            print(f"👤 User Input: {content}")
    
    async def _log_tool_execution(self, node_name: str, node_data: Dict[str, Any]):
        """Log tool execution results."""
        print(f"\n🔧 TOOL EXECUTION")
        print(f"{'─' * 40}")
        
        messages = node_data.get('messages', [])
        for msg in messages:
            if hasattr(msg, 'name') and hasattr(msg, 'content'):
                tool_name = msg.name
                content = msg.content
                tool_call_id = getattr(msg, 'tool_call_id', 'unknown')
                
                print(f"✅ {tool_name} (id: {tool_call_id[:8]}...)")
                
                # Try to parse and display tool results nicely
                try:
                    if content.startswith('{') and content.endswith('}'):
                        result_data = json.loads(content)
                        if isinstance(result_data, dict):
                            # Show key results
                            for key, value in list(result_data.items())[:3]:
                                if isinstance(value, (list, dict)):
                                    print(f"   {key}: {type(value).__name__} with {len(value)} items")
                                elif isinstance(value, str):
                                    display_value = value[:100] + '...' if len(value) > 100 else value
                                    print(f"   {key}: {display_value}")
                                else:
                                    print(f"   {key}: {value}")
                            
                            if len(result_data) > 3:
                                print(f"   ... and {len(result_data) - 3} more fields")
                        else:
                            print(f"   Result: {str(result_data)[:150]}{'...' if len(str(result_data)) > 150 else ''}")
                    else:
                        print(f"   Result: {content[:150]}{'...' if len(content) > 150 else ''}")
                except json.JSONDecodeError:
                    print(f"   Raw Result: {content[:150]}{'...' if len(content) > 150 else ''}")
                
                # Store for summary
                self.tool_results.append({
                    'name': tool_name,
                    'id': tool_call_id,
                    'success': True
                })
    
    async def _log_other_node(self, node_name: str, node_data: Dict[str, Any]):
        """Log other workflow nodes."""
        if node_name in ['initialize', 'finalize']:
            print(f"\n🔄 {node_name.upper()}")
            print(f"{'─' * 40}")
    
    def _print_execution_summary(self):
        """Print comprehensive execution summary."""
        print(f"\n📊 EXECUTION SUMMARY")
        print(f"{'═' * 60}")
        
        # Basic stats
        print(f"🔢 Total Workflow Steps: {self.step_count}")
        print(f"🔧 Tool Calls Made: {len(self.tool_calls)}")
        print(f"✅ Tool Results: {len(self.tool_results)}")
        
        # Token usage (real API counts)
        if self.token_usage['total'] > 0:
            print(f"\n💰 TOKEN USAGE (Gemini API):")
            print(f"   📥 Input Tokens:  {self.token_usage['input']:,}")
            print(f"   📤 Output Tokens: {self.token_usage['output']:,}")
            print(f"   🔢 Total Tokens:  {self.token_usage['total']:,}")
            
            # Cost estimation for Gemini 2.5 Flash
            input_cost = (self.token_usage['input'] / 1_000_000) * 0.30   # $0.30 per 1M input tokens
            output_cost = (self.token_usage['output'] / 1_000_000) * 2.50  # $2.50 per 1M output tokens
            total_cost = input_cost + output_cost
            
            if total_cost > 0.001:  # Only show if cost > 0.1 cents
                print(f"   💵 Estimated Cost: ${total_cost:.4f}")
        
        # Tool summary
        if self.tool_calls:
            print(f"\n🔧 TOOLS USED:")
            tool_counts = {}
            for tool in self.tool_calls:
                name = tool['name']
                tool_counts[name] = tool_counts.get(name, 0) + 1
            
            for tool_name, count in tool_counts.items():
                print(f"   • {tool_name}: {count}x")
        
        # Quota manager summary
        try:
            quota_manager = get_quota_manager()
            summary = quota_manager.get_usage_summary()
            print(f"\n🔑 QUOTA MANAGER:")
            print(f"   🎯 Current Key: ...{summary['current_key_suffix']}")
            print(f"   ✅ Available Keys: {summary['available_keys']}/{summary['total_keys']}")
            print(f"   📊 Today's Requests: {summary['total_requests_today']}")
        except:
            print(f"\n🔑 QUOTA MANAGER: Not available")
        
        print(f"{'═' * 60}")
    
    def _extract_final_response(self, final_result: Dict[str, Any]) -> str:
        """Extract final response from the graph result."""
        # Check if final response content is in state
        final_response_content = final_result.get('final_response_content', '')
        if final_response_content:
            return final_response_content
        
        # Fallback to extracting from messages
        messages = final_result.get('messages', [])
        for msg in reversed(messages):
            if hasattr(msg, 'content') and msg.content:
                # Check if it's a tool result with final response
                if hasattr(msg, 'name') and msg.name == 'final_response_to_user':
                    try:
                        result_data = json.loads(msg.content)
                        return result_data.get('response_content', msg.content)
                    except:
                        return msg.content
                # Check if it's an AI message
                elif hasattr(msg, 'content') and len(str(msg.content)) > 50:
                    return str(msg.content)
        
        return "No final response found in execution result."


async def list_conversation_threads():
    """List all conversation threads."""
    try:
        memory_system = MemorySystem()
        data = memory_system._load_memory_data()
        
        if not data:
            print("🔍 No conversation threads found.")
            return
        
        print("🧵 CONVERSATION THREADS:")
        print("=" * 60)
        
        for thread_id, thread_data in data.items():
            exchanges = thread_data.get('exchanges', [])
            last_updated = thread_data.get('last_updated', 'Unknown')
            created_at = thread_data.get('created_at', 'Unknown')
            
            print(f"\n📍 Thread ID: {thread_id}")
            print(f"📅 Created: {created_at[:19] if created_at != 'Unknown' else 'Unknown'}")
            print(f"🕒 Last Updated: {last_updated[:19] if last_updated != 'Unknown' else 'Unknown'}")
            print(f"💬 Exchanges: {len(exchanges)}")
            
            # Show recent exchange preview
            if exchanges:
                latest = exchanges[-1]
                user_msg = latest.get('user_message', 'No message')[:80]
                print(f"💭 Latest: {user_msg}{'...' if len(latest.get('user_message', '')) > 80 else ''}")
    
    except Exception as e:
        print(f"❌ Error listing threads: {e}")


async def show_conversation_history(thread_id: str):
    """Show conversation history for a thread."""
    try:
        memory_system = MemorySystem()
        history = await memory_system.get_conversation_history(thread_id)
        
        if not history.exchanges:
            print(f"📭 No conversation history found for thread {thread_id}")
            return
        
        print(f"🧵 CONVERSATION HISTORY: {thread_id}")
        print("=" * 80)
        print(f"📅 Created: {history.created_at[:19]}")
        print(f"🕒 Last Updated: {history.last_updated[:19]}")
        print(f"💬 Total Exchanges: {len(history.exchanges)}")
        print("=" * 80)
        
        for i, exchange in enumerate(history.exchanges, 1):
            print(f"\n🔄 EXCHANGE {i} [{exchange.timestamp[:19]}]")
            print("─" * 60)
            print(f"👤 USER: {exchange.user_message}")
            
            if exchange.planner_summary:
                print(f"\n🧠 PLANNER: {exchange.planner_summary}")
            
            if exchange.executor_summary:
                print(f"\n⚡ EXECUTOR: {exchange.executor_summary}")
            
            print("─" * 60)
    
    except Exception as e:
        print(f"❌ Error showing conversation history: {e}")


async def interactive_chat():
    """Interactive chat mode with multi-turn support."""
    print("🤖 Auxilium Agent - Interactive Chat Mode")
    print("=" * 60)
    print("Commands:")
    print("  /new     - Start a new conversation thread")
    print("  /list    - List all conversation threads")
    print("  /history - Show current conversation history")
    print("  /switch <thread_id> - Switch to a different thread")
    print("  /exit    - Exit interactive mode")
    print("=" * 60)
    
    current_thread_id = None
    agent = EnhancedAgentGraph()
    
    while True:
        try:
            # Show current thread info
            if current_thread_id:
                print(f"\n🧵 Current thread: {current_thread_id[:8]}...")
            else:
                print(f"\n🧵 No active thread")
            
            user_input = input("\n💬 You: ").strip()
            
            if not user_input:
                continue
            
            # Handle commands
            if user_input.startswith('/'):
                command_parts = user_input.split(' ', 1)
                command = command_parts[0].lower()
                
                if command == '/exit':
                    print("👋 Goodbye!")
                    break
                
                elif command == '/new':
                    current_thread_id = None
                    print("✨ Starting new conversation thread...")
                    continue
                
                elif command == '/list':
                    await list_conversation_threads()
                    continue
                
                elif command == '/history':
                    if current_thread_id:
                        await show_conversation_history(current_thread_id)
                    else:
                        print("❌ No active thread. Start a conversation first.")
                    continue
                
                elif command == '/switch':
                    if len(command_parts) > 1:
                        thread_id = command_parts[1].strip()
                        # Verify thread exists
                        memory_system = MemorySystem()
                        history = await memory_system.get_conversation_history(thread_id)
                        if history.exchanges:
                            current_thread_id = thread_id
                            print(f"🔄 Switched to thread {thread_id[:8]}...")
                            await show_conversation_history(thread_id)
                        else:
                            print(f"❌ Thread {thread_id} not found or empty.")
                    else:
                        print("❌ Usage: /switch <thread_id>")
                    continue
                
                else:
                    print(f"❌ Unknown command: {command}")
                    continue
            
            # Process user message
            start_time = datetime.now()
            response = await agent.process_user_input(user_input, thread_id=current_thread_id)
            end_time = datetime.now()
            
            # Update current thread ID if this was a new conversation
            if not current_thread_id:
                current_thread_id = agent.memory_system.current_thread_id
                print(f"\n🆕 New thread created: {current_thread_id[:8]}...")
            
            # Print final response
            print(f"\n🏁 FINAL RESPONSE:")
            print(f"{'═' * 60}")
            print(response)
            print(f"{'═' * 60}")
            
            # Show execution time
            execution_time = (end_time - start_time).total_seconds()
            print(f"\n⏱️ Execution time: {execution_time:.2f} seconds")
        
        except KeyboardInterrupt:
            print("\n👋 Goodbye!")
            break
        except Exception as e:
            print(f"\n❌ Error: {e}")
            traceback.print_exc()


async def send_message(message: str, thread_id: Optional[str] = None):
    """Send a message to the agent."""
    print(f"🤖 Auxilium Agent")
    print(f"═" * 60)
    print(f"📍 Model: {settings.planning_model}")
    print(f"🔑 API Key: {'✅ Present' if settings.google_api_key else '❌ Missing'}")
    print(f"⚙️ Max Iterations: {settings.max_agent_iterations}")
    
    if thread_id:
        print(f"🧵 Thread ID: {thread_id[:8]}...")
        # Show conversation history
        await show_conversation_history(thread_id)
    
    try:
        # Initialize enhanced agent
        agent = EnhancedAgentGraph()
        
        print(f"\n👤 USER MESSAGE:")
        print(f"{'─' * 60}")
        print(f"{message}")
        print(f"{'─' * 60}")
        
        # Get response
        start_time = datetime.now()
        response = await agent.process_user_input(message, thread_id=thread_id)
        end_time = datetime.now()
        
        # Update thread ID if this was a new conversation
        if not thread_id:
            thread_id = agent.memory_system.current_thread_id
            print(f"\n🆕 New thread created: {thread_id}")
        
        # Print final response
        print(f"\n🏁 FINAL RESPONSE:")
        print(f"{'═' * 60}")
        print(response)
        print(f"{'═' * 60}")
        
        # Show execution time
        execution_time = (end_time - start_time).total_seconds()
        print(f"\n⏱️ Execution time: {execution_time:.2f} seconds")
        
        # Check if objectives were created
        try:
            with open(settings.data_file_path, "r") as f:
                data = json.load(f)
                objectives = data.get("objectives", [])
                print(f"📋 Current objectives: {len(objectives)}")
                
                # Show latest objectives
                if objectives:
                    print(f"\n📋 Latest objectives:")
                    for obj in objectives[-3:]:  # Show last 3
                        status = obj.get('status', 'unknown')
                        title = obj.get('title', 'Untitled')
                        print(f"  • {title} ({status})")
        except Exception as e:
            print(f"❌ Error reading objectives: {e}")
        
        # Show updated conversation info
        print(f"\n🧵 Thread ID: {thread_id}")
        print(f"💡 Use this thread ID to continue the conversation")
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        print(f"\n🔍 Stack trace:")
        traceback.print_exc()


def main():
    """Main function with argument parsing."""
    parser = argparse.ArgumentParser(
        description="Auxilium AI Agent - Clean Chat Interface",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python clean_chat_with_agent.py "What are my objectives this week?"
  python clean_chat_with_agent.py --interactive
  python clean_chat_with_agent.py --list-threads
  python clean_chat_with_agent.py --continue abc123def "Update my schedule"
  python clean_chat_with_agent.py --history abc123def

Features:
  🧠 Planning → ⚡ Executor workflow
  🧵 Multi-turn conversations
  💾 Exchange summaries
  📊 Token usage tracking
  🏁 Final response
        """
    )
    
    parser.add_argument('message', nargs='?', help='Message to send to the agent')
    parser.add_argument('--interactive', '-i', action='store_true', help='Start interactive chat mode')
    parser.add_argument('--list-threads', '-l', action='store_true', help='List all conversation threads')
    parser.add_argument('--continue', '-c', dest='thread_id', help='Continue conversation with thread ID')
    parser.add_argument('--history', '--hist', dest='show_history', help='Show conversation history for thread ID')
    
    args = parser.parse_args()
    
    # Handle different modes
    if args.interactive:
        asyncio.run(interactive_chat())
    elif args.list_threads:
        asyncio.run(list_conversation_threads())
    elif args.show_history:
        asyncio.run(show_conversation_history(args.show_history))
    elif args.message:
        asyncio.run(send_message(args.message, args.thread_id))
    else:
        parser.print_help()


if __name__ == "__main__":
    main() 