import { SimplePool, getPublicKey, getEventHash, signEvent } from 'nostr-tools'
import 'websocket-polyfill'

async function main() {
try {
    // Get private key from environment variable
    const privateKey = process.env.NOSTR_PRIVATE_KEY
    if (!privateKey) {
    throw new Error('NOSTR_PRIVATE_KEY environment variable is not set')
    }

    // Initialize connection pool and connect to relay
    const pool = new SimplePool()
    const relay = 'wss://relay.damus.io'
    
    console.log('Connecting to relay...')
    
    // Prepare the event
    const publicKey = getPublicKey(privateKey)
    let event = {
    kind: 1,
    pubkey: publicKey,
    created_at: Math.floor(Date.now() / 1000),
    tags: [],
    content: 'testing'
    }
    
    // Sign the event
    event.id = getEventHash(event)
    event.sig = signEvent(event, privateKey)
    
    // Publish the event
    console.log('Publishing event...')
    const pub = pool.publish([relay], event)
    
    // Wait for confirmation
    await Promise.race([
    pub,
    new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout waiting for publish')), 5000)
    )
    ])
    
    console.log('Event published successfully!')
    
} catch (error) {
    console.error('Error:', error.message)
    process.exit(1)
} finally {
    // Cleanup
    process.exit(0)
}
}

main()

