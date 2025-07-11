import dotenv from 'dotenv';
dotenv.config({
    path: './.env'
});
import axios from 'axios';
import { App } from '@slack/bolt';


const signingSecret: string = process.env['SLACK_SIGNING_SECRET'] as string;
const botToken: string = process.env['SLACK_BOT_TOKEN'] as string;

const app = new App({
    signingSecret: signingSecret,
    token: botToken,
});

(async () => {
    await app.start(process.env.PORT || 12000);

    app.message('quote', async ({ message, say }) => {
        const resp = await axios.get(`https://api.quotable.io/random`);
        const quote: string = resp.data.content;
        await say(`Hello, <@${message}>, ${quote}`);
    });

    console.log(`⚡️ Bolt app is running!`);
})();