    import express from "express";
    import path from "path";
    import { fileURLToPath } from "url";
    import cors from "cors";
    import { Resend } from "resend";

    const app = express();
    app.use(express.json());
    app.use(cors());

    const resend = new Resend(process.env.RESEND_API_KEY);
    const audienceId = process.env.RESEND_AUDIENCE_ID;

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const publicDir = path.join(__dirname, "../public");

    app.use(express.static(publicDir));

    app.get("/", (_req, res) => {
      res.sendFile(path.join(publicDir, "index.html"));
    });

    app.get("/health", (_req, res) => {
      res.status(200).json({ ok: true });
    });

    app.post("/subscribe", async (req, res) => {
      try {
        const { email, firstName = "", lastName = "" } = req.body || {};

        if (!email || !email.includes("@")) {
          return res.status(400).json({ ok: false, error: "Valid email is required" });
        }

        const { data, error } = await resend.contacts.create({
          audienceId,
          email,
          firstName,
          lastName,
          unsubscribed: false,
        });

        if (error) return res.status(400).json({ ok: false, error });

        return res.status(200).json({ ok: true, contact: data });
      } catch (err) {
        return res.status(500).json({ ok: false, error: err.message });
      }
    });

    const port = process.env.PORT || 3000;
    app.listen(port, () => {
    console.log(`API listening on ${port}`);
    });

