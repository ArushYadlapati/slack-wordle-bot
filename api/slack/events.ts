import { App, ExpressReceiver } from '@slack/bolt';
import axios from 'axios';

const signingSecret = "7ffc0286a42b75edec744eb60f9814b6";
const botToken = "xoxb-2210535565-9165205323462-LftSZY0vWxxMopDHZ9DLA8vJ";

// Create a custom receiver for Vercel
const receiver = new ExpressReceiver({
    signingSecret,
    processBeforeResponse: true,
});

const app = new App({
    token: botToken,
    receiver,
});

app.message('quote', async ({ message, say }) => {
    if ("user" in message) {
        try {
            const resp = await axios.get('https://api.quotable.io/random');
            const quote = resp.data.content;
            await say(`Hello, <@${message.user}>, ${quote}`);
        } catch (error) {
            console.error("Error fetching quote:", error);
            await say("Sorry, I couldn't fetch a quote right now.");
        }
    }
});

// Export the Express app for Vercel
module.exports = receiver.app;

// Start the server locally (only when running directly, not in Vercel)
if (require.main === module) {
    const port = process.env.PORT || 3003;
    receiver.app.listen(port, () => {
        console.log(`⚡️ Bolt app is running on port ${port}!`);
    });
}