import { Link } from 'react-router-dom';
import { SignedIn, SignedOut } from '@clerk/clerk-react';
import './Home.css';

export default function Home() {
  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="security-grid"></div>
        <div className="particles-background"></div>
        
        <div className="hero-content">
  <div className="security-badge pulse">
    <i className="fas fa-shield-alt"></i>
    <span>Military-Grade AES-256 Encryption</span>
  </div>

  <h1 className="hero-title">
    <span className="gradient-text">Zero-Knowledge</span> Note Storage
  </h1>

  <p className="hero-subtitle">
    Your privacy isn’t just a feature — it’s a foundation. <strong>Not even our team</strong> can access your notes.
    <br />
    All data is end-to-end encrypted using AES-256 with Secure Enclave protection.
  </p>

  <div className="cta-container">
    <SignedOut>
      <Link to="/sign-up" className="cta-button primary">
        <i className="fas fa-lock"></i> Get Started — 100% Private & Free
      </Link>
    </SignedOut>
    <SignedIn>
      <Link to="/dashboard" className="cta-button primary">
        <i className="fas fa-vault"></i> Go to Your Encrypted Vault
      </Link>
    </SignedIn>
  </div>

  <div className="security-proof">
    <div className="proof-item">
      <i className="fas fa-eye-slash"></i>
      <span>Zero backdoors — your data stays yours</span>
    </div>
    <div className="proof-item">
      <i className="fas fa-user-secret"></i>
      <span>Zero-Knowledge Framework — we can’t see your notes</span>
    </div>
    <div className="proof-item">
      <i className="fas fa-fingerprint"></i>
      <span>Biometric Encryption Support</span>
    </div>
  </div>
</div>

        
     
      </section>
      

      <section className='second-section'>
      <div className="security-visual">
          <div className="encryption-animation">
            <div className="data-block locked">
              <i className="fas fa-lock"></i>
              <span>Your Private Note</span>
            </div>
            <div className="encryption-process">
              <div className="encryption-step">
                <i className="fas fa-key"></i>
                <span>256-bit Key</span>
              </div>
              <div className="encryption-step">
                <i className="fas fa-lock"></i>
                <span>Encrypted</span>
              </div>
              <div className="encryption-step">
                <i className="fas fa-cloud"></i>
                <span>Secure Cloud</span>
              </div>
            </div>
            <div className="data-block unlocked">
              <i className="fas fa-lock-open"></i>
              <span>Only You Can Access</span>
            </div>
          </div>
        </div>
      </section>

      {/* Security Deep Dive */}
      <section className="security-section">
        <div className="section-header">
          <h2>How We Protect Your <span className="gradient-text">Most Private Thoughts</span></h2>
          <p>Engineered to the highest security standards used by governments and banks</p>
        </div>
        
        <div className="security-features">
          <div className="feature-card">
            <div className="feature-icon">
              <i className="fas fa-user-lock"></i>
            </div>
            <h3>Client-Side Encryption</h3>
            <p>Your notes are encrypted on your device before they ever reach our servers. We never see your unencrypted data.</p>
            <div className="tech-badge">AES-256</div>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">
              <i className="fas fa-microchip"></i>
            </div>
            <h3>Secure Enclave</h3>
            <p>Encryption keys are stored in hardware-protected secure enclaves on your device, inaccessible to anyone else.</p>
            <div className="tech-badge">T2/T1 Chip</div>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">
              <i className="fas fa-shield-alt"></i>
            </div>
            <h3>Zero-Knowledge Proof</h3>
            <p>We've mathematically proven we can't access your data, even if compelled by authorities.</p>
            <div className="tech-badge">ZK-SNARKs</div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <div className="cta-content">
          <h2>Ready to Experience <span className="gradient-text">True Digital Privacy</span>?</h2>
          <p>Join security experts, journalists, and privacy-conscious individuals worldwide</p>
          <div className="cta-buttons">
            <SignedOut>
              <Link to="/sign-up" className="cta-button primary">
                <i className="fas fa-lock"></i> Get Started — Free Forever
              </Link>
              <Link to="/security" className="cta-button secondary">
                <i className="fas fa-shield-alt"></i> Security White Paper
              </Link>
            </SignedOut>
            <SignedIn>
              <Link to="/dashboard" className="cta-button primary">
                <i className="fas fa-vault"></i> Open Your Secure Vault
              </Link>
            </SignedIn>
          </div>
        </div>
      </section>


      <footer>
        <p>Developed by <span>Muhammad Haseeb</span></p>
      </footer>
    </div>
  );
}