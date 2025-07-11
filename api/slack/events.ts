import { App, ExpressReceiver } from '@slack/bolt';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config({
    path: './.env'
});


const SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET!;
const BOT_TOKEN = process.env.SLACK_BOT_TOKEN!;

const receiver = new ExpressReceiver({
    signingSecret: SIGNING_SECRET,
    processBeforeResponse: true,
});

const app = new App({
    token: BOT_TOKEN,
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

module.exports = receiver.app;

if (require.main === module) {
    const port = process.env.PORT || 3001;
    receiver.app.listen(port, () => {
        console.log(`⚡️ Bolt app is running on port ${port}!`);
    });
}