import axios from 'axios';
import { generateSecretKey, getPublicKey, finalizeEvent, getEventHash, validateEvent } from 'nostr-tools';

// Wrapper function for backward compatibility
function generatePrivateKey() {
return generateSecretKey(); }

const sk = generatePrivateKey();
const pk = getPublicKey(sk);
console.log(`Private Key: ${sk}`);
console.log(`Public Key: ${pk}`);

const NOSTR_RELAY_URL = 'wss://relay.damus.io';

// Function to post a message to the Nostr relay
async function postMessage(content) {
  const event = {
    pubkey: pk,
    created_at: Math.floor(Date.now() / 1000),
    kind: 1,
    tags: [],
    content,
  };

  event.id = getEventHash(event);
event.sig = finalizeEvent(event, sk);

  if (!validateEvent(event)) {
    throw new Error('Invalid event.');
  }

  try {
    const response = await axios.post(NOSTR_RELAY_URL, event);
    console.log('Message posted:', response.data);
  } catch (error) {
    console.error('Failed to post message:', error);
  }
}

// Function to determine message content based on the day of the week
function getDailyMessage() {
  const today = new Date();
  const dayOfWeek = today.getUTCDay();

  // Check if today is the weekend (Saturday or Sunday)
  if (dayOfWeek === 6 || dayOfWeek === 0) {
    return 'gfy fiatjaf';
  } else {
    return 'GM fiatjaf';
  }
}

// Function to calculate milliseconds until next 11:11 Dakar time
function getMsUntilNext1111DakarTime()
const now = new Date();
const next1111 = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    11,
    11,
    0,
    0
));

if (next1111 <= now) {
    next1111.setUTCDate(next1111.getUTCDate() + 1);
}

return next1111.getTime() - now.getTime();
}

// Function to schedule the next post
function scheduleNextPost() {
const msUntilNext = getMsUntilNext1111DakarTime();
setTimeout(async () => {
    const message = getDailyMessage();
    await postMessage(message);
    scheduleNextPost(); // Schedule next day's post
}, msUntilNext);

console.log(`Next post scheduled for: ${new Date(Date.now() + msUntilNext).toUTCString()} (11:11 Dakar time)`)
}

// Start scheduling posts
scheduleNextPost();
