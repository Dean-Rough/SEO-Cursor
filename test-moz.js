// Quick test to verify Moz API is working (JSON-RPC endpoint)
const mozToken = "bW96c2NhcGUtR3JwUk43WnhnWTozd1BOR2ljMjFabGxpbzFyUmtSNDlNTEs1cGYxd2daWg==";

async function testMozAPI() {
  console.log("🔍 Testing Moz Data API connection (JSON-RPC)...\n");

  try {
    const response = await fetch("https://api.moz.com/jsonrpc", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-moz-token": mozToken,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "test-moz-api-connection-12345678",
        method: "data.keyword.metrics.fetch",
        params: {
          data: {
            serp_query: {
              keyword: "cocktail bar edinburgh",
              locale: "en-GB",
              device: "desktop",
              engine: "google",
            },
          },
        },
      }),
    });

    console.log("Status:", response.status, response.statusText);

    const data = await response.json();

    if (data.error) {
      console.error("❌ Moz API Error:");
      console.error("Code:", data.error.code);
      console.error("Message:", data.error.message);
      console.error("Data:", JSON.stringify(data.error.data, null, 2));
      return;
    }

    if (!data.result) {
      console.error("❌ No result returned from Moz API");
      console.log("Response:", JSON.stringify(data, null, 2));
      return;
    }

    console.log("✅ Moz API Working!\n");
    console.log("Test Keyword: cocktail bar edinburgh");
    console.log("Volume:", data.result.keyword_metrics?.volume ?? "N/A");
    console.log("Difficulty:", data.result.keyword_metrics?.difficulty ?? "N/A");
    console.log("\n🎉 Moz credentials are valid and working!");

  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

testMozAPI();
