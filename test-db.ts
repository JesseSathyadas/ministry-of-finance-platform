import { createClient } from './lib/supabase/server'

async function testConnection() {
    const supabase = createClient()
    try {
        const { data, error } = await supabase.from('user_profiles').select('count', { count: 'exact', head: true })
        if (error) {
            console.error('Database Connection Error:', error)
            process.exit(1)
        }
        console.log('Database Connection Successful. Profile count access confirmed.')
        process.exit(0)
    } catch (err) {
        console.error('Unexpected error during connection test:', err)
        process.exit(1)
    }
}

testConnection()
