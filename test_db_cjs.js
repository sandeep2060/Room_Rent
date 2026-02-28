const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
    const { data, error } = await supabase.from('rooms').select('*').limit(1)
    if (error) {
        console.error("Error:", error)
        return
    }
    if (data && data.length > 0) {
        console.log("Room columns:", Object.keys(data[0]))
    } else {
        console.log("No rooms found, checking for empty array:", data)
        // If empty, let's insert a dummy row or query schema but supabase REST doesn't easily return schema 
        // We can check by doing a select of a non-existent column to see the error message which says column doesn't exist, but we already know some.
        // Wait, if we just do a POST to REST API it tells us. Let's try to fetch another table? No, rooms is what we need.
    }
}

test()
