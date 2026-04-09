const ws = new WebSocket("wss://stealth-6l2j.onrender.com/");

ws.onopen = () => {
  console.log("Connected ✅");
  ws.send("ping");
};

ws.onmessage = (msg) => {
  console.log("Message:", msg.data);
};

ws.onerror = (err) => {
  console.log("Error ❌", err);
};

ws.onclose = () => {
  console.log("Closed");
};