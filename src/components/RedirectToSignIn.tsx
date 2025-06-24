import { Link } from 'react-router-dom';
import './RedirectToSignIn.css';

export default function RedirectToSignIn() {
    return (
        <div className="redirect-container">
            <div className="redirect-box">
                <h2 className="redirect-title">Restricted Access</h2>
                <p className="redirect-message">
                    You need to be signed in to view this page.
                </p>
                <div className="redirect-actions">
                    <Link to="/sign-in" className="redirect-button primary">
                        Sign In
                    </Link>
                    <Link to="/sign-up" className="redirect-button secondary">
                        Sign Up
                    </Link>
                </div>
                <Link to="/" className="back-link">
                    &larr; Go back to Home
                </Link>
            </div>
        </div>
    );
} 