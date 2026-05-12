import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Example: Mock endpoint for Dropbox Sign / DocuSign integration
  // In a real app, this would use the respective SDK with process.env.SIGNATURE_API_KEY
  app.post("/api/signature-request", async (req, res) => {
    const { loanId, clientEmail, clientName } = req.body;
    console.log(`Simulating signature request for Loan: ${loanId} to ${clientEmail}`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    res.json({
      success: true,
      requestId: `sig_${Math.random().toString(36).substr(2, 9)}`,
      status: "sent"
    });
  });

  app.post("/api/send-email", (req, res) => {
    const { to, subject, body } = req.body;
    console.log(`Simulating Email sent to ${to}`);
    console.log(`Subject: ${subject}`);
    res.json({ success: true });
  });

  // Serve static files in production or Vite in dev
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
