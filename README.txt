FREELANCER TELEGRAM JOIN-REQUEST TRACKER

This project preserves the existing landing page and adds a Netlify Function that listens for Telegram chat_join_request updates. It sends one Meta Conversions API custom event named TelegramJoinRequest for each genuine request. It does NOT auto-approve members.

DEPLOY
1. Deploy this project to the EXISTING Netlify site using a Git-connected deploy or Netlify CLI. A plain static-only upload may not deploy serverless functions.
2. Keep the Netlify publish directory set to public and functions directory set to netlify/functions (netlify.toml already sets both).

NETLIFY ENVIRONMENT VARIABLES
These must be set in Production and scoped to Functions:
- TELEGRAM_BOT_TOKEN (secret): your current BotFather token
- META_ACCESS_TOKEN (secret): the Meta Conversions API token you generated
- META_PIXEL_ID: 3710330712456303
- TELEGRAM_WEBHOOK_SECRET (secret): create a private random string of 32+ characters using only A-Z, a-z, 0-9, _ and -
- WEBHOOK_SETUP_KEY (secret): create a different private random string of 32+ characters
Optional:
- META_GRAPH_API_VERSION: v25.0 (default)

CONNECT TELEGRAM
After deployment and after all variables are saved, open:
https://YOUR-SITE-DOMAIN/setup-webhook.html
Enter the WEBHOOK_SETUP_KEY and click Connect Telegram webhook. Do not share this key or a screenshot containing it.

VERIFY
- A Telegram join request should still appear for your manual approval.
- Events Manager should show a server event named TelegramJoinRequest.
- TelegramButtonClick remains a separate browser click metric and is not treated as a join request.

IMPORTANT LIMITATION
This event proves a Telegram join request occurred. Since the channel uses one shared invite link, this integration does not reliably associate each Telegram request with a particular Meta ad click/campaign. Meta may also show limited match quality because Telegram does not provide a browser fbp/fbc cookie for the join request. Do not use this event as a claim of approved membership; it is a join-request event only.

SECURITY
Never place bot tokens, Meta tokens, or setup secrets in public source files or send them in screenshots. After setup is verified, remove the setup page and setup-telegram-webhook function in a later deployment, and remove WEBHOOK_SETUP_KEY from Netlify. The webhook function remains active.
