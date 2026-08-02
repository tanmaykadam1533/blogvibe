import React, { useEffect } from 'react';
import { AlertTriangle, XCircle, CheckCircle2, X } from 'lucide-react';

export default function ModerationReport({ report, onClose }) {
  // Prevent scrolling on body when dialog is open
  useEffect(() => {
    if (report) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [report]);

  if (!report) return null;

  const categories = report.categories || {};
  const hasViolations = Object.values(categories).some(Boolean);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-card, #1a1917)',
          border: '1px solid var(--border, #2e2c2a)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '560px',
          padding: '2rem',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.5)',
          position: 'relative',
          maxHeight: '90vh',
          overflowY: 'auto',
          color: 'var(--text, #f5f0ea)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '1.25rem',
              right: '1.25rem',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted, #8a8480)',
              cursor: 'pointer',
              padding: '0.4rem',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s, color 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-hover, #222120)';
              e.currentTarget.style.color = 'var(--text, #f5f0ea)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-muted, #8a8480)';
            }}
          >
            <X size={20} />
          </button>
        )}

        {/* Dialog Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              backgroundColor: 'rgba(224, 85, 85, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--danger, #e05555)',
              flexShrink: 0
            }}
          >
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.3rem', fontFamily: "'Playfair Display', serif", color: 'var(--text, #f5f0ea)' }}>
              AI Moderation Report
            </h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--danger, #e05555)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Status: REJECTED {report.confidence ? `(${report.confidence}% Confidence)` : ''}
            </span>
          </div>
        </div>

        {/* Reason Box */}
        <div
          style={{
            backgroundColor: 'rgba(224, 85, 85, 0.08)',
            borderLeft: '4px solid var(--danger, #e05555)',
            padding: '1rem 1.25rem',
            borderRadius: '0 8px 8px 0',
            marginBottom: '1.5rem'
          }}
        >
          <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted, #8a8480)', fontWeight: '600', marginBottom: '0.25rem' }}>
            Rejection Reason
          </div>
          <div style={{ fontWeight: '500', color: 'var(--text, #f5f0ea)', fontSize: '0.95rem' }}>
            {report.reason}
          </div>
        </div>

        {/* Violation Breakdown */}
        {hasViolations && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted, #8a8480)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Content Safety Audit
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
                gap: '0.6rem'
              }}
            >
              {Object.entries(categories).map(([key, violated]) => (
                <div
                  key={key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.6rem 0.85rem',
                    borderRadius: '8px',
                    backgroundColor: violated ? 'rgba(224, 85, 85, 0.12)' : 'var(--bg-hover, #222120)',
                    border: `1px solid ${violated ? 'rgba(224, 85, 85, 0.3)' : 'var(--border, #2e2c2a)'}`
                  }}
                >
                  <span style={{ textTransform: 'capitalize', fontSize: '0.85rem', fontWeight: '500' }}>
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  {violated ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--danger, #e05555)', fontSize: '0.85rem', fontWeight: '700' }}>
                      <XCircle size={15} /> Flagged
                    </span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--success, #5eb87a)', fontSize: '0.85rem' }}>
                      <CheckCircle2 size={15} /> Safe
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <p style={{ color: 'var(--text-muted, #8a8480)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
          Your post was not published because it does not meet our content guidelines. Please update your draft and try publishing again.
        </p>

        {/* Dialog Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border, #2e2c2a)', paddingTop: '1.25rem' }}>
          <button
            className="btn btn-primary"
            onClick={onClose}
            style={{
              padding: '0.6rem 1.5rem',
              borderRadius: '8px',
              fontWeight: '600'
            }}
          >
            Review & Edit Content
          </button>
        </div>
      </div>
    </div>
  );
}
