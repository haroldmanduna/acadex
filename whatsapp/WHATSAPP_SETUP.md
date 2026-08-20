# ACADEX real WhatsApp auto-replies

There is **no** way for WhatsApp to auto-reply with zero action. Meta Cloud API needs a Facebook Developer app, tokens, and it **kicks this number off the WhatsApp app**.

The method that does **not** need Facebook, tokens, or a new SIM:

## Link this phone (like WhatsApp Web) — 30 seconds

1. Open the live bot: `https://acadex-r6z0.onrender.com/link`
2. On the phone that is **+263 71 698 7183**:
   - WhatsApp → **Linked devices** → **Link a device**
   - **Link with phone number instead**
   - Type the 8-digit code on that page
3. You get a confirmation message on WhatsApp.
4. From any student phone: send **mhoro acadex** to **+263716987183**

Keep using WhatsApp on the phone as normal. Unlink anytime: Linked devices → log out.

Do not bulk-message strangers — WhatsApp can ban the number. Inbound tutoring is the intended use.

## Official Cloud API (optional, later)

If you later create a Meta WhatsApp Cloud API number, set `WHATSAPP_TOKEN` and `PHONE_NUMBER_ID` on Render. Phone-link turns off automatically. That number cannot stay in the normal WhatsApp app.
