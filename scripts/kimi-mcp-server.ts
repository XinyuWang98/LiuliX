#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import 'dotenv/config';

const API_KEY = process.env.MOONSHOT_API_KEY;

if (!API_KEY) {
    console.error("错误: 未找到 MOONSHOT_API_KEY 环境变量。");
    process.exit(1);
}

const server = new Server(
    {
        name: "kimi-mcp-server",
        version: "0.1.0",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "ask_kimi",
                description: "Ask Kimi (Moonshot AI) a question or request assistance with a task.",
                inputSchema: {
                    type: "object",
                    properties: {
                        prompt: {
                            type: "string",
                            description: "The prompt or question to send to Kimi.",
                        },
                    },
                    required: ["prompt"],
                },
            },
        ],
    };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === "ask_kimi") {
        const prompt = String(request.params.arguments?.prompt);

        try {
            const response = await fetch("https://api.moonshot.cn/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${API_KEY}`,
                },
                body: JSON.stringify({
                    model: "moonshot-v1-8k",
                    messages: [
                        {
                            role: "system",
                            content: "You are Kimi, a helpful assistant integrated via MCP.",
                        },
                        {
                            role: "user",
                            content: prompt,
                        },
                    ],
                    temperature: 0.3,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                return {
                    content: [
                        {
                            type: "text",
                            text: `API Error: ${response.status} ${response.statusText} - ${errorText}`,
                        },
                    ],
                    isError: true,
                };
            }

            const data = await response.json();
            const content = data.choices[0]?.message?.content || "No content returned.";

            return {
                content: [
                    {
                        type: "text",
                        text: content,
                    },
                ],
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Network error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
                isError: true,
            };
        }
    }

    throw new Error("Tool not found");
});

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}

main().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
});
