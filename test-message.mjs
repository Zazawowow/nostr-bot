import { WebSocket } from 'ws'
import { SimplePool, getPublicKey, nip19, getEventHash, finalizeEvent } from 'nostr-tools'

// Set global WebSocket for nostr-tools
global.WebSocket = WebSocket

const RELAYS = [
'wss://relay.damus.io',
'wss://nostr.fmt.wiz.biz',
'wss://relay.nostr.band',
'wss://nos.lol',
'wss://relay.snort.social'
]

// Convert numeric string to hex
function convertNumericToHex(numericString) {
    console.log('Debug: Starting numeric to hex conversion')
    
    // Remove any non-numeric characters
    const cleanNumeric = numericString.replace(/[^0-9]/g, '')
    console.log(`Debug: Cleaned numeric string length: ${cleanNumeric.length}`)
    
    // Validate input length (should be 96 characters for 32 bytes)
    if (cleanNumeric.length !== 96) {
        throw new Error(`Invalid numeric string length: ${cleanNumeric.length}, expected 96`)
    }
    
    // Convert to array of numbers (3 digits per byte)
    const numbers = []
    for (let i = 0; i < cleanNumeric.length; i += 3) {
        const num = parseInt(cleanNumeric.substr(i, 3), 10)
        if (num > 255) {
            throw new Error(`Invalid byte value at position ${i}: ${num} (must be 0-255)`)
        }
        console.log(`Debug: Processing byte ${numbers.length + 1}/32: ${num}`)
        numbers.push(num)
    }
    
    // Validate we have exactly 32 bytes
    if (numbers.length !== 32) {
        throw new Error(`Invalid number of bytes: ${numbers.length}, expected 32`)
    }
    
    // Convert to hex string
    const hexString = numbers
        .map(num => num.toString(16).padStart(2, '0'))
        .join('')
    
    console.log(`Debug: Generated hex string length: ${hexString.length}`)
    return hexString
    }

    async function main() {
try {
    // Get private key from environment and validate
    const privateKeyInput = process.env.NOSTR_PRIVATE_KEY
    if (!privateKeyInput) {
        throw new Error('NOSTR_PRIVATE_KEY environment variable is required')
    }

    let privateKey = privateKeyInput
    const hexPattern = /^[0-9a-fA-F]{64}$/
    
    // Try numeric format first
    if (!hexPattern.test(privateKeyInput)) {
        console.log('Debug: Attempting to convert numeric format to hex')
        privateKey = convertNumericToHex(privateKeyInput)
        
        if (!hexPattern.test(privateKey)) {
            throw new Error('Failed to convert input to valid hex format')
        }
        console.log('Debug: Successfully converted numeric format to hex')
    }

    console.log('Debug: Private key format validated')
    const publicKey = getPublicKey(privateKey)
    console.log(`Using public key: ${nip19.npubEncode(publicKey)}`)

    // Initialize pool and connect to relays
    const pool = new SimplePool()
    console.log('Connecting to relays...')

    // Prepare the event
    const event = {
    kind: 1,
    created_at: Math.floor(Date.now() / 1000),
    tags: [],
    content: 'testing',
    pubkey: publicKey,
    }

    // Sign the event
    event.id = getEventHash(event)
    console.log('Debug: Signing event with validated private key')
    const signedEvent = finalizeEvent(event, privateKey)
    event.sig = signedEvent.sig

    console.log('Sending test message...')
    const pubs = pool.publish(RELAYS, event)

    // Wait for publication
    await Promise.all(pubs)
    console.log('Message sent successfully!')

    // Close all connections
    pool.close(RELAYS)
} catch (error) {
    console.error('Error:', error.message)
    process.exit(1)
}
}

main()

