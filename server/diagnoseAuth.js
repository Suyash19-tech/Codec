
const axios = require('axios');

const BASE_URL = 'http://localhost:5050/api/auth';
const TEST_EMAIL = 'test_professor@university.edu';
const TEST_PASS = 'SecurePass123!';

async function diagnoseAuth() {
    console.log('--- 🛡️ CODEC AUTH PIPELINE DIAGNOSIS ---');
    
    try {
        // 1. Test Signup OTP
        console.log('\n[1/5] Testing Signup OTP...');
        const signupOtpRes = await axios.post(`${BASE_URL}/signup-otp`, { email: TEST_EMAIL });
        console.log('✅ Signup OTP sent:', signupOtpRes.data.message);

        // Since we can't read the email, we'll need to check the DB or use a known value if we modify the controller for testing.
        // For now, let's just check if the endpoints exist and respond.
        
        // 2. Test Login (expecting failure because not verified)
        console.log('\n[2/5] Testing Login (Unverified)...');
        try {
            await axios.post(`${BASE_URL}/login`, { email: TEST_EMAIL, password: TEST_PASS });
        } catch (err) {
            console.log('✅ Expected Failure:', err.response?.data?.message || err.message);
        }

        // 3. Test Forgot Password OTP
        console.log('\n[3/5] Testing Forgot Password OTP...');
        const forgotRes = await axios.post(`${BASE_URL}/forgot-password-otp`, { email: TEST_EMAIL });
        console.log('✅ Forgot Pw OTP sent:', forgotRes.data.message);

        console.log('\n--- 🧪 Diagnosis Complete ---');
        console.log('Summary: Endpoints are reachable. Now checking logic integrity in controllers...');

    } catch (error) {
        console.error('\n❌ DIAGNOSIS FAILED:', error.response?.data || error.message);
        process.exit(1);
    }
}

diagnoseAuth();
