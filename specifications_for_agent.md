Auxilium Agent architecture.

Basically, its your own personal secretary, who knows you better than you know yourself.

Requirements: 
1. Be able to create/modify/delete objectives with all of the parameters
2. Chat with the user
3. Understand them, give advice, look for overlaps in the schedule, ensure their wellbeing and prevent burnout. Be a brilliant secretary.

Stages of the langgraph graph:

1. Planning agent is invoked, and (Gemini-2.5-Flash with thinking enabled) should use tools to retrieve all the data that is needed for it to make a good decision.
2. The tool calls are executed, and the response is returned to the llm in history as a LangChain ToolMessage
3. The llm is invoked again (already with tool responses)

The above process repeats until the llm returns no tool calls. In that response, the planner's message should contain analysis, it should be detailed, featuring time, tasks, id's of events, names and ALL relevant information regarding it, burnout, energy levels, overlaps, estimations. 

This analysis should be processed, and put into a single piece of text, containing the user prompt, and planning agent's thoughts. 

1. Then, it goes to the executor agent, which follows the analysis, and makes a plan in its thoughts (because thining SHOULD be enabled for this llm, search the web to see how langchain supports the thinking mode of gemini),

2. It then should call the plan tool, to give its complete and super detailed plan of action in a single string (passed to the tool). Then a toolmessage - returns a plain "Continue"

3. Then, the executor agent can call as many tools as it needs, for as long as possible. Each time, you simply return the tool output, as a tool message and call the llm again. The llm is allowed to call the planning tool again to continue its plans, based on the tool outputs and changing considerations.

4. The process repeats until the final_response_to_user tool is called, which returns the response to the user. 

All of these things should be specified in the LLMs' prompts. 

Furthermore, here's the list of all the tools that each llm has access to:

Planer LLM:

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

System message - will always contain current date (in ISO format), as well as all user-memories. Furthermore, it will also have instructions about the prompt and stuff.

Memory system (for multi-turn dialogue)