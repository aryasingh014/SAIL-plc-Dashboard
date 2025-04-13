const opcua = require("node-opcua");
const { createClient } = require("@supabase/supabase-js");

// ✅ Supabase credentials (replace with your values)
const supabaseUrl = "https://ankjwtmwclzqvgpjkeyr.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFua2p3dG13Y2x6cXZncGprZXlyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDIyMzg1MCwiZXhwIjoyMDU5Nzk5ODUwfQ.iuZo_Qgqidb9P0au6j3FIjZqBthZ-fGz3WKQb5o6O6A";
const supabase = createClient(supabaseUrl, supabaseKey);

// ✅ OPC UA config
const client = opcua.OPCUAClient.create({ endpoint_must_exist: false });
const endpointUrl = "opc.tcp://Aryasingh:53530/OPCUA/SimulationServer"; // Your local server
const nodeIdToRead = "ns=5;s=Simulation.Sine1.Value";

async function main() {
  try {
    await client.connect(endpointUrl);
    console.log("✅ Connected to OPC UA Server");

    const session = await client.createSession();
    console.log("✅ OPC UA Session created");

    const subscription = await session.createSubscription2({
      requestedPublishingInterval: 1000,
      requestedMaxKeepAliveCount: 10,
      requestedLifetimeCount: 30,
      maxNotificationsPerPublish: 10,
      publishingEnabled: true,
      priority: 10,
    });

    const monitoredItem = await subscription.monitor(
      {
        nodeId: nodeIdToRead,
        attributeId: opcua.AttributeIds.Value,
      },
      {
        samplingInterval: 1000,
        discardOldest: true,
        queueSize: 10,
      },
      opcua.TimestampsToReturn.Both
    );

    monitoredItem.on("changed", async (dataValue) => {
      const value = dataValue.value.value;
      const timestamp = new Date().toISOString();
      console.log("📈 Live Value:", value);

      // 🔄 Insert into Supabase
      const { error } = await supabase
        .from("plc_data") // Make sure this table exists in Supabase
        .insert([{ value, timestamp }]);

      if (error) console.error("❌ Supabase Insert Error:", error.message);
    });

  } catch (err) {
    console.error("❌ OPC UA Error:", err);
  }
}

main();
