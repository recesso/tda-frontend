import * as dotenv from "dotenv";

// Load from .env.local first, then .env
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const apiKey = process.env.LANGSMITH_API_KEY;

// Agent Builder deployment
const agentBuilderUrl = "https://prod-deepagents-agent-build-d4c1479ed8ce53fbb8c3eefc91f0aa7d.us.langgraph.app";
const agentBuilderId = "50bd6c8e-2996-455b-83c1-3c815899a69b";

console.log("API Key:", apiKey?.substring(0, 30) + "...");
console.log("Testing at:", new Date().toISOString());

async function testWithExistingThread() {
  const headers = {
    "Content-Type": "application/json",
    "x-api-key": apiKey!,
    "X-Auth-Scheme": "langsmith-api-key",
  };

  console.log("\n=== Finding existing threads on Agent Builder ===\n");

  const searchThreads = await fetch(`${agentBuilderUrl}/threads/search`, {
    method: "POST",
    headers,
    body: JSON.stringify({ limit: 20 }),
  });

  if (!searchThreads.ok) {
    console.log("Failed to search threads");
    return;
  }

  const threads = await searchThreads.json();
  console.log(`Found ${threads.length} threads:\n`);

  for (const t of threads) {
    console.log(`Thread: ${t.thread_id}`);
    console.log(`  Created: ${t.created_at}`);
    console.log(`  Updated: ${t.updated_at}`);
    console.log(`  Metadata: ${JSON.stringify(t.metadata)}`);
    console.log("");
  }

  if (threads.length > 0) {
    // Use the first thread to run a test
    const threadId = threads[0].thread_id;
    console.log(`\n=== Testing with thread: ${threadId} ===\n`);

    const runRes = await fetch(`${agentBuilderUrl}/threads/${threadId}/runs/stream`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        assistant_id: agentBuilderId,
        input: { messages: [{ role: "user", content: "What skills are in demand for nurses in Georgia?" }] },
      }),
    });

    console.log(`Status: ${runRes.status} ${runRes.ok ? "✅" : "❌"}`);

    if (runRes.ok) {
      console.log("\nStreaming response (first 3000 chars):\n");
      const text = await runRes.text();
      console.log(text.substring(0, 3000));
      console.log(`\n... (total ${text.length} chars)`);
    } else {
      console.log(`Error: ${await runRes.text()}`);
    }
  }
}

testWithExistingThread().catch(console.error);
