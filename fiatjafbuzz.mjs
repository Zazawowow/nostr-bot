import { generateSecretKey, getPublicKey, finalizeEvent, getEventHash, validateEvent, nip19, SimplePool } from 'nostr-tools';
import cron from 'node-cron';
import { WebSocket } from 'ws';
global.WebSocket = WebSocket;
// Get private key from environment variable
const sk = process.env.NOSTR_PRIVATE_KEY;
if (!sk) {
    throw new Error('NOSTR_PRIVATE_KEY environment variable must be set');
}
if (sk.length !== 64) {
    throw new Error(`Invalid private key length: ${sk.length} chars (must be 64 chars)`);
}

// Generate public key from private key
const pk = getPublicKey(sk);
console.log('Using existing private key');
console.log(`Public Key (${pk.length} chars):`, pk);
console.log('='.repeat(50));
console.log('Your Nostr address:');
console.log(nip19.npubEncode(pk));
console.log('='.repeat(50));
// Validate public key
if (pk.length !== 64) {
    throw new Error(`Invalid public key length: ${pk.length}`);
}

// Define relay URLs
const RELAYS = ['wss://relay.damus.io', 'wss://nos.lol', 'wss://relay.nostr.band'];
const pool = new SimplePool({
websocketImplementation: WebSocket
});
const BOT_NAME = 'zazabot';

// Function to set up the bot's profile
async function setupProfile() {
const event = {
    pubkey: pk,
    created_at: Math.floor(Date.now() / 1000),
    kind: 0,
    tags: [],
    content: JSON.stringify({
    name: BOT_NAME,
    about: 'A friendly bot that says GM/GFY to fiatjaf'
    }),
};

event.id = getEventHash(event);
event.sig = finalizeEvent(event, sk).sig;

if (!validateEvent(event)) {
    throw new Error('Invalid profile event.');
}

try {
    const pub = pool.publish(RELAYS, event);
    await Promise.race([
        pub,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
    ]);
    console.log('Profile set up successfully');
} catch (error) {
    console.error('Failed to set up profile:', error);
}
}

// Function to post a message to the Nostr relay
async function postMessage(content) {
  const event = {
    pubkey: pk,
    created_at: Math.floor(Date.now() / 1000),
    kind: 1,
    tags: [['name', BOT_NAME]],
    content: `${BOT_NAME}: ${content}`,
  };

event.id = getEventHash(event);
event.sig = finalizeEvent(event, sk).sig;

// Generate nevent1 format
const nevent = nip19.neventEncode({ id: event.id });

if (!validateEvent(event)) {
    throw new Error('Invalid event.');
  }

try {
    const pub = pool.publish(RELAYS, event);
    await Promise.race([
        pub,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
    ]);
    console.log('Message posted:', {
        eventId: event.id,
        nevent: nevent
    });
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

// Initialize the bot and set up cron job
(async () => {
    try {
        // Set up bot profile
        console.log('Setting up bot profile...');
        await setupProfile();
        
        // Schedule daily posts at 11:11 Dakar time (UTC+0)
        console.log('Setting up cron job for 11:11 Dakar time...');
        cron.schedule('11 11 * * *', async () => {
            try {
                console.log('Executing scheduled post...');
                const message = getDailyMessage();
                await postMessage(message);
                console.log('Scheduled post completed successfully');
            } catch (error) {
                console.error('Error in scheduled post:', error);
            }
        }, {
            scheduled: true,
            timezone: "Africa/Dakar"
        });
        
        console.log('Bot initialization completed. Running in schedule mode.');
    } catch (error) {
        console.error('Bot initialization failed:', error);
        process.exit(1);
    }
    
    // Handle shutdown gracefully
    process.on('SIGINT', () => {
        console.log('Shutting down...');
        pool.close(RELAYS);
        process.exit(0);
    });
})();
