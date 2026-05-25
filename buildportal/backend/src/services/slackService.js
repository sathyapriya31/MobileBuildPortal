import axios from 'axios';

export async function notifySlack({ buildId, projectName, branch, platform, apkUrl, s3Link, error }) {
  if (!process.env.SLACK_BOT_TOKEN) return null;

  const isSuccess = !error;
  const color = isSuccess ? '#2eb886' : '#e01e5a';
  const title = isSuccess
    ? `✅ Build Success: ${projectName}`
    : `❌ Build Failed: ${projectName}`;

  const blocks = [
    {
      type: 'section',
      text: { type: 'mrkdwn', text: `*${title}*\nBranch: \`${branch}\` | Platform: \`${platform}\`` },
    },
  ];

  if (isSuccess && s3Link) {
    const isAab = s3Link.toLowerCase().includes('.aab');
    const label = isAab ? 'AAB' : 'APK';
    const emoji = isAab ? '🎁' : '📦';
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: `${emoji} *Download ${label}:*\n${s3Link}` },
    });
  }

  if (error) {
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: `*Error:* ${error}` },
    });
  }

  const res = await axios.post(
    'https://slack.com/api/chat.postMessage',
    { channel: process.env.SLACK_CHANNEL_ID, blocks, attachments: [{ color }] },
    { headers: { Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`, 'Content-Type': 'application/json' } }
  );
  return res.data.ts;
}