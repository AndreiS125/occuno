Auxilium Agent architecture.

Basically, its your own personal secretary, who knows you better than you know yourself.

Requirements: 
1. Be able to create/modify/delete objectives with all of the parameters
2. Chat with the user
3. Understand them, give advice, look for overlaps in the schedule, ensure their wellbeing and prevent burnout. Be a brilliant secretary.

Stages of the LangGraph graph:

1. Planning agent is invoked, and (Gemini-2.5-Flash with thinking enabled) should use tools to retrieve all the data that is needed for it to make a good decision. The user message (the one after the system message) should provide the user prompt, and only then the entire history of last 10 exchange summaries. 
2. The tool calls are executed, and the response is returned to the llm in history as a LangChain ToolMessage
3. The llm is invoked again (already with tool responses)

The above process repeats until the llm calls the final_response tool. In that response, the planner's message should contain analysis, it should be detailed, featuring time, tasks, id's of events, names and ALL relevant information regarding it, burnout, energy levels, overlaps, estimations. And, also a summary of its thoughts, but in another argument of the tool call.

This analysis should be processed, and put into a single piece of text, containing the user prompt, and planning agent's thoughts below (in a similar fashion to planner's past history dump). 

1. Then, it goes to the executor agent, which follows the analysis, and makes a plan in its thoughts (because thining SHOULD be enabled for this llm, search the web to see how langchain supports the thinking mode of gemini),

2. It then should call the plan tool, to give its complete and super detailed plan of action in a single string (passed to the tool). Then a toolmessage - returns a plain "Continue"

3. Then, the executor agent can call as many tools as it needs, for as long as possible. Each time, you simply return the tool output, as a tool message and call the llm again. The llm is allowed to call the planning tool again to continue its plans, based on the tool outputs and changing considerations.

4. The process repeats until the final_response_to_user tool is called, which returns the response to the user. Similarly, in another argument, the llm should provide a detailed the summary of the entire action sequence and rationals. 

All of these things should be specified in the LLMs' prompts. 

Furthermore, here's the list of all the tools that each llm has access to:

Planer Agents:

1. Retrieve objective by id (should be a boolean (withchildren = false by default)). When set to true, the tool works exactly like tool 3.
2. Retrieve objective by name (returns the top 3 most similar ones)
3. Retrieve full tree of an objective by id (e.g. a massive json containing the children objectives as well)
4. Return all objectives for a given time period (ISO time format.)
5. Return all objectives ever.
6. Save some facts (memories) about the user

Executor Agent:

1. Create new objectives/edit/delete them
2. Retrieve objective by id (with the withchildren boolean)
3. Retrieve objectives for a given time period
4. Check/modify various gamification statistics
5. Move events from one parent to another.
6. Save some facts about the user

Also, every one of the agents will have access to the final_response tool, which allows you to pass the final response, and a summary of the entire thought/action sequence.

System message - will always contain current date (in ISO format), as well as all user-memories. Furthermore, it will also have instructions about the prompt and stuff, e.g. "call the final response tool at the end, generate summaries etc etc."

Memory system (for multi-turn dialogue) - for each user message you store three things. 1. The user message 2. The planner summary (the one that it provides in the final_response tool) 3. The executor summary (the one that it provides in the final_response tool). You will need to create a custom BaseMemory class for this.

At the end of each graph execution, you save them. When the graph is called for the second time with history, you just paste the user prompt and the entire history of those summaries to the planer. You don't paste the history to the executor though. To the executor you only provide the planner's output, and the user prompt, just like the first run.