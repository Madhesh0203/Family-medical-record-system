// ===================== FamilyMed Auth Logic =====================
console.log('auth.js module loading...');

// Safe environment variable access
function getEnv(key, fallback = '') {
  try {
    if (import.meta && import.meta.env) {
      return import.meta.env[key] || fallback;
    }
  } catch (e) {
    // Silently fallback if import.meta is not accessible
  }
  return fallback;
}

// Global Error Handler for easier debugging
window.onerror = function(msg, url, line, col, error) {
  console.error('[Global Error]', msg, 'at', url, 'line', line);
  alert('A system error occurred: ' + msg + '\nPlease check the console for details.');
  return false;
};

// Initialize EmailJS
(function() {
  try {
    const publicKey = getEnv('VITE_EMAILJS_PUBLIC_KEY');
    if (typeof emailjs !== 'undefined' && publicKey && publicKey !== 'your_public_key') {
      emailjs.init(publicKey);
      console.log('EmailJS initialized successfully');
    } else if (typeof emailjs === 'undefined') {
      console.warn('EmailJS SDK not loaded yet. Retrying in 1s...');
      setTimeout(() => {
        try {
          if (typeof emailjs !== 'undefined' && publicKey && publicKey !== 'your_public_key') {
            emailjs.init(publicKey);
            console.log('EmailJS initialized after delay');
          }
        } catch (e) {
          console.error('Error in delayed EmailJS init:', e);
        }
      }, 1000);
    } else {
      console.warn('EmailJS Public Key not set or using placeholder. Email sending will fail.');
    }
  } catch (e) {
    console.error('Error in EmailJS init:', e);
  }
})();
const STORAGE_KEY = 'familymed_users';
const SESSION_KEY = 'familymed_session';

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch (e) {
    console.error('Error parsing users from localStorage:', e);
    return [];
  }
}
function saveUsers(users) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Error saving users to localStorage:', e);
  }
}
function setSession(user) {
  const session = { uid: user.uid, email: user.email, name: user.name, loggedIn: true, ts: Date.now() };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  if (document.getElementById('rememberMe')?.checked) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
}
function getSession() {
  return JSON.parse(sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY) || 'null');
}

// Redirect if already logged in
(function () {
  const s = getSession();
  if (s && s.loggedIn) window.location.href = 'app.html';
})();

function showTab(tab) {
  document.getElementById('loginForm').style.display = tab === 'login' ? 'block' : 'none';
  document.getElementById('registerForm').style.display = tab === 'register' ? 'block' : 'none';
  document.getElementById('loginTabBtn').classList.toggle('active', tab === 'login');
  document.getElementById('registerTabBtn').classList.toggle('active', tab === 'register');
}

function togglePassword(id, btn) {
  const input = document.getElementById(id);
  if (input.type === 'password') {
    input.type = 'text';
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
  } else {
    input.type = 'password';
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
  }
}

function showError(id, msg) {
  const el = document.getElementById(id);
  el.textContent = msg; el.style.display = 'block';
  setTimeout(() => el.style.display = 'none', 4000);
}
function showSuccess(id, msg) {
  const el = document.getElementById(id);
  el.textContent = msg; el.style.display = 'block';
}

function generateUID() {
  return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Password Strength
document.addEventListener('DOMContentLoaded', () => {
  const passInput = document.getElementById('regPassword');
  if (passInput) {
    passInput.addEventListener('input', function () {
      const val = this.value;
      const div = document.getElementById('passStrength');
      const fill = document.getElementById('strengthFill');
      const text = document.getElementById('strengthText');
      if (!val) { div.style.display = 'none'; return; }
      div.style.display = 'flex';
      let score = 0;
      if (val.length >= 8) score++;
      if (/[A-Z]/.test(val)) score++;
      if (/[0-9]/.test(val)) score++;
      if (/[^A-Za-z0-9]/.test(val)) score++;
      const levels = [
        { w: '25%', color: '#ef4444', label: 'Weak' },
        { w: '50%', color: '#f59e0b', label: 'Fair' },
        { w: '75%', color: '#3b82f6', label: 'Good' },
        { w: '100%', color: '#10b981', label: 'Strong' }
      ];
      const l = levels[Math.max(0, score - 1)];
      fill.style.width = l.w; fill.style.background = l.color;
      text.textContent = l.label; text.style.color = l.color;
    });
  }
});

// Binding listeners (Modules run after DOM by default, but let's be safe)
function bindListeners() {
  console.log('Binding listeners...');
  
  // Tabs
  document.getElementById('loginTabBtn')?.addEventListener('click', () => showTab('login'));
  document.getElementById('registerTabBtn')?.addEventListener('click', () => showTab('register'));

  // Login
  document.getElementById('loginBtn')?.addEventListener('click', handleLogin);
  document.querySelector('.btn-demo')?.addEventListener('click', loginDemo);

  // Register
  document.getElementById('registerBtn')?.addEventListener('click', handleRegister);

  // Forgot Password
  document.querySelector('.forgot-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    showForgotModal();
  });
  document.querySelector('.modal-close')?.addEventListener('click', closeForgotModal);
  document.getElementById('forgotSubmitBtn')?.addEventListener('click', handleForgot);

  // OTP
  document.getElementById('verifyOtpBtn')?.addEventListener('click', verifyOTP);
  document.getElementById('backToLogin')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('otpForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
  });

  // Toggle Password listeners
  document.querySelectorAll('.toggle-pass').forEach(btn => {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      const input = this.parentElement.querySelector('input');
      if (input) {
        togglePassword(input.id, this);
      }
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    try {
      console.log('DOM Content Loaded (via listener)');
      bindListeners();
    } catch (e) {
      console.error('Error in DOMContentLoaded listener:', e);
    }
  });
} else {
  try {
    console.log('DOM already ready, binding immediately');
    bindListeners();
  } catch (e) {
    console.error('Error during immediate binding:', e);
  }
}

async function handleLogin() {
  try {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    if (!email || !password) { showError('loginError', 'Please fill in all fields.'); return; }
    const btn = document.getElementById('loginBtn');
    btn.classList.add('loading'); btn.querySelector('span').textContent = 'Signing in...';
    await sleep(800);
    const users = getUsers();
    // Seed demo user if empty
    if (users.length === 0) seedDemoData();
    const allUsers = getUsers();
    const user = allUsers.find(u => u.email === email && u.password === btoa(password));
    if (!user) {
      btn.classList.remove('loading'); btn.querySelector('span').textContent = 'Sign In';
      showError('loginError', 'Invalid email or password. Try the Demo Account!');
      return;
    }

    // Check for 2FA
    if (user.twoFA) {
      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      window._pendingUser = user;
      window._generatedOtp = otp;
      
      // Send real email via EmailJS
      const sent = await sendOTPEmail(user, otp);
      
      if (sent) {
        showSuccess('loginError', `✓ Verification code sent to ${user.email}`);
      } else {
        // Fallback for demo/debug if EmailJS is not configured
        console.log(`[OTP DEBUG] Email sending failed or not configured. Use OTP: ${otp}`);
        alert(`[SYSTEM] Real email sending failed. Using debug alert: Your verification code is: ${otp}`);
      }
      
      btn.classList.remove('loading'); btn.querySelector('span').textContent = 'Sign In';
      document.getElementById('loginForm').style.display = 'none';
      document.getElementById('otpForm').style.display = 'block';
      return;
    }

    setSession(user);
    window.location.href = 'app.html';
  } catch (e) {
    console.error('Login error:', e);
    const btn = document.getElementById('loginBtn');
    if (btn) {
      btn.classList.remove('loading');
      btn.querySelector('span').textContent = 'Sign In';
    }
    showError('loginError', 'An error occurred during login: ' + e.message);
  }
}

async function verifyOTP() {
  const otpInput = document.getElementById('otpInput').value.trim();
  if (!otpInput) { showError('otpError', 'Please enter the verification code.'); return; }
  
  if (otpInput === window._generatedOtp) {
    const btn = document.getElementById('verifyOtpBtn');
    btn.classList.add('loading'); btn.querySelector('span').textContent = 'Verifying...';
    await sleep(800);
    setSession(window._pendingUser);
    window.location.href = 'app.html';
  } else {
    showError('otpError', 'Invalid verification code. Please try again.');
  }
}

async function sendOTPEmail(user, otp) {
  const serviceId = getEnv('VITE_EMAILJS_SERVICE_ID');
  const templateId = getEnv('VITE_EMAILJS_TEMPLATE_ID');
  
  if (!serviceId || serviceId === 'your_service_id' || !templateId || templateId === 'your_template_id') {
    return false;
  }

  const templateParams = {
    to_name: user.name,
    to_email: user.email,
    otp_code: otp,
    app_name: 'FamilyMed'
  };

  try {
    await emailjs.send(serviceId, templateId, templateParams);
    console.log(`OTP successfully sent to ${user.email}`);
    return true;
  } catch (error) {
    console.error('Failed to send OTP email:', error);
    return false;
  }
}

async function handleRegister() {
  const firstName = document.getElementById('regFirstName').value.trim();
  const lastName = document.getElementById('regLastName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const confirm = document.getElementById('regConfirmPassword').value;
  const terms = document.getElementById('termsCheck').checked;

  if (!firstName || !lastName || !email || !password || !confirm) {
    showError('registerError', 'Please fill in all fields.'); return;
  }
  if (password !== confirm) { showError('registerError', 'Passwords do not match.'); return; }
  if (password.length < 8) { showError('registerError', 'Password must be at least 8 characters.'); return; }
  if (!terms) { showError('registerError', 'Please accept the Terms of Service.'); return; }

  const users = getUsers();
  if (users.find(u => u.email === email)) {
    showError('registerError', 'An account with this email already exists.'); return;
  }

  const btn = document.getElementById('registerBtn');
  btn.classList.add('loading'); btn.querySelector('span').textContent = 'Creating Account...';
  await sleep(1000);

  const newUser = {
    uid: generateUID(), email,
    name: firstName + ' ' + lastName,
    password: btoa(password),
    createdAt: new Date().toISOString(),
    role: 'admin'
  };
  users.push(newUser);
  saveUsers(users);
  btn.classList.remove('loading'); btn.querySelector('span').textContent = 'Create Account';
  showSuccess('registerSuccess', '✓ Account created! Redirecting...');
  setSession(newUser);
  setTimeout(() => window.location.href = 'app.html', 1200);
}

function loginDemo() {
  try {
    console.log('loginDemo called');
    seedDemoData();
    const users = getUsers();
    const demoEmail = getEnv('VITE_DEMO_EMAIL', 'demo@familymed.com');
    const demo = users.find(u => u.email === demoEmail);
    if (demo) { 
      setSession(demo); 
      window.location.href = 'app.html'; 
    } else {
      showError('loginError', 'Demo account not found. Please refresh.');
    }
  } catch (e) {
    console.error('Demo login error:', e);
    showError('loginError', 'Demo login failed: ' + e.message);
  }
}

function seedDemoData() {
  try {
    let users = getUsers();
    if (users.find(u => u.email === 'demo@familymed.com')) return;
    const demoEmail = getEnv('VITE_DEMO_EMAIL', 'demo@familymed.com');
    const demoPassword = getEnv('VITE_DEMO_PASSWORD', 'demo1234');

    const demoUser = {
      uid: 'demo_user_001', email: demoEmail,
      name: 'Demo User', password: btoa(demoPassword),
      createdAt: new Date().toISOString(), role: 'admin'
    };
    users.push(demoUser);
    saveUsers(users);
    
    // Seed demo family & records
    const families = JSON.parse(localStorage.getItem('familymed_families') || '{}');
    families['demo_user_001'] = getDemoFamily();
    localStorage.setItem('familymed_families', JSON.stringify(families));
    console.log('Demo data seeded successfully');
  } catch (e) {
    console.error('Error seeding demo data:', e);
  }
}

function getDemoFamily() {
  return {
    members: [
      {
        id: 'mem_001', name: 'Rajesh Kumar', dob: '1975-06-15', gender: 'Male',
        bloodGroup: 'B+', phone: '+91 98765 43210', emergency: '+91 99887 76655',
        allergies: 'Penicillin', conditions: 'Hypertension, Type 2 Diabetes',
        insurance: 'Star Health - Policy #SH2024001', photo: null, role: 'Father'
      },
      {
        id: 'mem_002', name: 'Priya Kumar', dob: '1978-03-22', gender: 'Female',
        bloodGroup: 'A+', phone: '+91 98765 11111', emergency: '+91 98765 43210',
        allergies: 'Sulfa drugs', conditions: 'Thyroid (Hypothyroidism)',
        insurance: 'Star Health - Policy #SH2024002', photo: null, role: 'Mother'
      },
      {
        id: 'mem_003', name: 'Arjun Kumar', dob: '2005-09-10', gender: 'Male',
        bloodGroup: 'O+', phone: '+91 98765 22222', emergency: '+91 98765 43210',
        allergies: 'None', conditions: 'Mild Asthma',
        insurance: 'Star Health - Policy #SH2024003', photo: null, role: 'Son'
      },
      {
        id: 'mem_004', name: 'Ananya Kumar', dob: '2010-12-05', gender: 'Female',
        bloodGroup: 'B+', phone: 'N/A', emergency: '+91 98765 43210',
        allergies: 'Dust, Pollen', conditions: 'None',
        insurance: 'Star Health - Policy #SH2024004', photo: null, role: 'Daughter'
      }
    ],
    visits: [
      {
        id: 'v001', memberId: 'mem_001', doctorName: 'Dr. Suresh Menon', specialization: 'Cardiologist',
        hospital: 'Apollo Hospitals', date: '2026-02-15', fee: 800,
        diagnosis: 'Hypertension well-controlled. Continue current medications. BP: 130/85.',
        followUp: true, followUpDate: '2026-05-15',
        medicines: ['Amlodipine 5mg (1-0-0)', 'Metformin 500mg (1-0-1)', 'Aspirin 75mg (0-1-0)'],
        notes: 'Patient advised lifestyle modifications and regular exercise.'
      },
      {
        id: 'v002', memberId: 'mem_002', doctorName: 'Dr. Kavitha Rao', specialization: 'Endocrinologist',
        hospital: 'Fortis Hospital', date: '2026-01-20', fee: 600,
        diagnosis: 'TSH levels elevated. Dosage adjustment needed.',
        followUp: true, followUpDate: '2026-04-20',
        medicines: ['Levothyroxine 75mcg (1-0-0)'],
        notes: 'Repeat thyroid panel in 3 months.'
      },
      {
        id: 'v003', memberId: 'mem_003', doctorName: 'Dr. Vinod Sharma', specialization: 'Pulmonologist',
        hospital: 'Manipal Hospital', date: '2025-12-10', fee: 500,
        diagnosis: 'Mild intermittent asthma. Seasonal triggers identified.',
        followUp: false, followUpDate: null,
        medicines: ['Salbutamol Inhaler (as needed)', 'Montelukast 10mg (0-0-1)'],
        notes: 'Avoid cold air. Use peak flow meter weekly.'
      },
      {
        id: 'v004', memberId: 'mem_001', doctorName: 'Dr. Priya Iyer', specialization: 'General Physician',
        hospital: 'City Clinic', date: '2025-11-05', fee: 300,
        diagnosis: 'Seasonal flu. Viral fever resolved.',
        followUp: false, followUpDate: null,
        medicines: ['Paracetamol 500mg (1-1-1)', 'Cetirizine 10mg (0-0-1)'],
        notes: 'Rest for 3 days. Stay hydrated.'
      }
    ],
    reports: [
      { id: 'r001', memberId: 'mem_001', type: 'Blood Test', name: 'Lipid Profile', date: '2026-02-14', doctor: 'Dr. Suresh Menon', fileName: 'lipid_profile.pdf' },
      { id: 'r002', memberId: 'mem_001', type: 'Blood Test', name: 'HbA1c Report', date: '2026-02-14', doctor: 'Dr. Suresh Menon', fileName: 'hba1c.pdf' },
      { id: 'r003', memberId: 'mem_002', type: 'Blood Test', name: 'Thyroid Panel (TSH, T3, T4)', date: '2026-01-18', doctor: 'Dr. Kavitha Rao', fileName: 'thyroid.pdf' },
      { id: 'r004', memberId: 'mem_003', type: 'X-Ray', name: 'Chest X-Ray', date: '2025-12-08', doctor: 'Dr. Vinod Sharma', fileName: 'chest_xray.jpg' }
    ]
  };
}

function showForgotModal() { document.getElementById('forgotModal').style.display = 'flex'; }
function closeForgotModal() { document.getElementById('forgotModal').style.display = 'none'; }
function handleForgot() {
  const email = document.getElementById('forgotEmail').value.trim();
  const msg = document.getElementById('forgotMsg');
  if (!email) { msg.textContent = 'Please enter your email.'; msg.style.color = '#ef4444'; return; }
  msg.textContent = '✓ If an account exists with this email, reset instructions have been sent.';
  msg.style.color = '#10b981';
}

// Attach to window for HTML onclick compatibility
window.showTab = showTab;
window.togglePassword = togglePassword;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.loginDemo = loginDemo;
window.showForgotModal = showForgotModal;
window.closeForgotModal = closeForgotModal;
window.handleForgot = handleForgot;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
