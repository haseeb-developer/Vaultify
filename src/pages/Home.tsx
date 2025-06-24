import { Link } from 'react-router-dom';
import './Home.css';
import { SignedIn, SignedOut } from '@clerk/clerk-react';

export default function Home() {
  return (
    <div className="home-container">
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Welcome to SAFE UR DATA</h1>
          <p className="hero-subtitle">
            Your private, secure, and intuitive space to capture what's on your mind.
            Create, group, and lock your notes with advanced, end-to-end encryption.
          </p>
          <SignedOut>
            <Link to="/sign-up" className="cta-button">
              Get Started for Free
            </Link>
          </SignedOut>
          <SignedIn>
            <Link to="/dashboard" className="cta-button">
              Go to Your Dashboard
            </Link>
          </SignedIn>
        </div>
      </section>

      <section className="features-section">
        <h2 className="section-title">Everything You Need, Securely</h2>
        <div className="features-grid">
          <div className="feature-card">
            <h3 className="feature-title">Create & Edit with Ease</h3>
            <p className="feature-description">
              A rich text editor that makes note-taking simple and enjoyable. Format your thoughts your way.
            </p>
          </div>
          <div className="feature-card">
            <h3 className="feature-title">Organize in Groups</h3>
            <p className="feature-description">
              Keep your notes tidy by grouping them into categories. Perfect for separating work, home, and personal projects.
            </p>
          </div>
          <div className="feature-card">
            <h3 className="feature-title">Advanced Security</h3>
            <p className="feature-description">
              Lock individual notes with a password. Your content is encrypted and can only be accessed by you.
            </p>
          </div>
        </div>
      </section>

      {/* Docs Section */}
      <section className="docs-section">
        <h2 className="section-title">Docs & Help</h2>
        <div className="docs-content">
          <p className="docs-description">
            Need help or want to learn more? Check out our documentation and guides to get the most out of SAFE UR DATA.
          </p>
          <ul className="docs-links">
            <li><a href="https://docs.safeurdata.com/getting-started" target="_blank" rel="noopener noreferrer">Getting Started Guide</a></li>
            <li><a href="https://docs.safeurdata.com/security" target="_blank" rel="noopener noreferrer">Security Best Practices</a></li>
            <li><a href="https://docs.safeurdata.com/faq" target="_blank" rel="noopener noreferrer">Frequently Asked Questions</a></li>
            <li><a href="mailto:support@safeurdata.com">Contact Support</a></li>
          </ul>
        </div>
      </section>
    </div>
  );
} 