import dotenv from 'dotenv';
dotenv.config({
    path: './.env'
});

import axios from 'axios';
import { createHmac } from 'crypto';
import { VercelRequest, VercelResponse } from '@vercel/node';

const signingSecret: string = process.env['SLACK_SIGNING_SECRET'] as string;
const botToken: string = process.env['SLACK_BOT_TOKEN'] as string;

function verifySlackSignature(body: string, signature: string, timestamp: string): boolean {
    const hmac = createHmac('sha256', signingSecret);
    hmac.update(`v0:${timestamp}:${body}`);
    const expectedSignature = `v0=${hmac.digest('hex')}`;
    return signature === expectedSignature;
}

async function sendSlackMessage(channel: string, text: string) {
    const response = await axios.post('https://slack.com/api/chat.postMessage', {
        channel: channel,
        text: text,
    }, {
        headers: {
            'Authorization': `Bearer ${botToken}`,
            'Content-Type': 'application/json',
        },
    });
    return response.data;
}

export default async (req: VercelRequest, res: VercelResponse) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
        const signature = req.headers['x-slack-signature'] as string;
        const timestamp = req.headers['x-slack-request-timestamp'] as string;

        if (!verifySlackSignature(body, signature, timestamp)) {
            return res.status(401).json({ error: 'Invalid signature' });
        }

        const event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

        if (event.type === 'url_verification') {
            return res.status(200).json({ challenge: event.challenge });
        }

        if (event.type === 'event_callback' && event.event.type === 'message') {
            const message = event.event;

            if (message.text && message.text.includes('quote') && message.user) {
                try {
                    const resp = await axios.get('https://api.quotable.io/random');
                    const quote: string = resp.data.content;
                    await sendSlackMessage(message.channel, `Hello, <@${message.user}>, ${quote}`);
                } catch (error) {
                    console.error('Error fetching quote:', error);
                }
            }
        }

        res.status(200).json({ ok: true });
    } catch (error) {
        console.error('Error processing Slack event:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};