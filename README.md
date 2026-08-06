# Welcome to your Lovable project

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Open your project in the [Lovable editor](https://lovable.dev) and keep building.

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: connect the project to GitHub and every change made in Lovable is committed straight to your repository.
- **Full ownership**: this code is yours. Push to your repository and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS

## Backend setup (Firebase + Telegram bot)

1. Copy `.env.example` to `.env` (or paste the values into Vercel → Settings → Environment Variables).
2. Firebase console → Authentication → enable **Email/Password** and **Google**.
3. Firestore → create database, deploy `firestore.rules`.
4. Telegram: create a bot with @BotFather, put the token in `TELEGRAM_BOT_TOKEN`,
   send `/start` to the bot (or add it to your group) and put the chat id in `TELEGRAM_CHAT_ID`.
5. Register the webhook once after deploying:

   ```bash
   curl "https://api.telegram.org/bot<TOKEN>/setWebhook" \
     -H 'content-type: application/json' \
     -d '{"url":"https://YOUR-DOMAIN/api/public/telegram/webhook","secret_token":"<TELEGRAM_WEBHOOK_SECRET>","allowed_updates":["message","callback_query"]}'
   ```

Flow: user signs in → clicking **Proceed to payment** immediately stores the order in
Firestore (status `confirming`) so it appears in history even before a UTR is entered →
submitting the UTR sends the Telegram log with **Complete / Processing / Cancel**
buttons → tapping a button updates the order, and the user's history page updates live.
Bot commands: `/start`, `/status <orderId>`, `/upi`. The `/upi` command lists
active payment IDs with **Add UPI** and **Remove** buttons. UPI IDs and bot state
are stored in Firestore, so commands and status buttons work after the customer
closes the website. Multiple active UPI IDs are assigned randomly to new orders.

If Telegram buttons keep spinning, run `getWebhookInfo` and confirm the webhook URL is
`https://YOUR-DOMAIN/api/public/telegram/webhook`, `pending_update_count` is clearing,
and `last_error_message` is empty. Re-run the `setWebhook` command above after every
change to `TELEGRAM_WEBHOOK_SECRET`; the Vercel value and `secret_token` must match.
