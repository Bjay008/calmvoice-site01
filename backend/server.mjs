    import express from "express";
    import path from "path";
    import { fileURLToPath } from "url";
    import cors from "cors";
    import { Resend } from "resend";
import rateLimit from "express-rate-limit";

    const app = express();
    app.use(express.json());
    app.use(cors());

    const resend = new Resend(process.env.RESEND_API_KEY);
    const audienceId = process.env.RESEND_AUDIENCE_ID;
    const subscribeLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 10,
      standardHeaders: true,
      legacyHeaders: false,
      message: { ok: false, error: "Too many signup attempts. Please try again later." },
    });
    

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

     app.post("/subscribe", subscribeLimiter, async (req, res) => {
      try {
        const { email, firstName = "", lastName = "" } = req.body || {};

        if (!email || !email.includes("@")) {
          return res.status(400).json({ ok: false, error: "Valid email is required" });
        }

        const { data: contact, error: contactError } = await resend.contacts.create({
          audienceId,
          email,
          firstName,
          lastName,
          unsubscribed: false,
        });

        if (contactError) {
          return res.status(400).json({ ok: false, error: contactError });
        }

        const { data: emailData, error: emailError } = await resend.emails.send({
          from: "CalmVoice Parenting <hello@success.graywolf.fun>",
          to: [email],
          subject: "Your Calm Phrases PDF is here",
          html: `
            <p>Hi ${firstName || "there"},</p>
            <p>Thanks for joining CalmVoice Parenting.</p>
            <p>Download your free PDF here:</p>
            <p><a href="https://www.graywolf.fun/calm-phrases.pdf">Get the Calm Phrases PDF</a></p>
            <p>Follow us on YouTube: <a href="https://youtube.com/@CalmVoiceParenting">@CalmVoiceParenting</a></p>
            <p>— CalmVoice Parenting</p>
          `,
        });

        return res.status(200).json({
          ok: true,
          contact,
          emailSent: !emailError,
          emailError: emailError || null,
          emailData: emailData || null,
        });
      } catch (err) {
        return res.status(500).json({ ok: false, error: err.message });
      }
    });


    const port = process.env.PORT || 3000;
    app.listen(port, () => {
    console.log(`API listening on ${port}`);
    });

