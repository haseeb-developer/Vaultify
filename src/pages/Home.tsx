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
    </div>
  );
} 