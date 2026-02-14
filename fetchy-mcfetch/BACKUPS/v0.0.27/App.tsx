import React, { useState, useEffect } from 'react';

interface Nomination {
  postId: string;
  title: string;
  author: string;
  subreddit: string;
  karma: number;
  url: string;
  category: string;
  nominatedBy: string;
  nominationReason?: string;
  fetchedAt: number;
  thumbnail?: string;
  permalink?: string;
}

const AWARD_CATEGORIES = [
  { id: 'best-game', name: 'Best Game - Digital or Analog', emoji: '🎮' },
  { id: 'most-collectable', name: 'Most Collectable Collectable', emoji: '🏆' },
  { id: 'best-creation', name: 'Best Original Creation', emoji: '🎨' },
  { id: 'best-story', name: 'Best Original Story', emoji: '📖' },
];

export const App = () => {
  const [nominations, setNominations] = useState<Nomination[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'category-select' | 'list' | 'submit'>('category-select');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [submitUrl, setSubmitUrl] = useState('');
  const [nominationReason, setNominationReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showNominees, setShowNominees] = useState(false);
  const [postPreview, setPostPreview] = useState<{ title: string; thumbnail?: string } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    if (selectedCategory) {
      loadNominations();
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Fetch post preview when URL changes
  useEffect(() => {
    const fetchPreview = async () => {
      if (!submitUrl.trim()) {
        setPostPreview(null);
        return;
      }

      // Extract post ID from URL
      const postIdMatch = submitUrl.match(/\/comments\/([a-zA-Z0-9]+)/);
      if (!postIdMatch) {
        setPostPreview(null);
        return;
      }

      setPreviewLoading(true);
      try {
        const response = await fetch(`/api/preview-post?url=${encodeURIComponent(submitUrl)}`);
        const data = await response.json();
        
        if (data.success) {
          setPostPreview({
            title: data.data.title,
            thumbnail: data.data.thumbnail
          });
        } else {
          setPostPreview(null);
        }
      } catch (error) {
        console.error('Failed to fetch preview:', error);
        setPostPreview(null);
      } finally {
        setPreviewLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchPreview, 500); // Debounce for 500ms
    return () => clearTimeout(debounceTimer);
  }, [submitUrl]);

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
  };

  const switchView = (newView: 'category-select' | 'list' | 'submit') => {
    setIsTransitioning(true);
    setTimeout(() => {
      setView(newView);
      setIsTransitioning(false);
    }, 300);
  };

  const selectCategory = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setLoading(true);
    setShowNominees(false); // Reset nominee visibility when switching categories
    switchView('submit');
  };

  const loadNominations = async () => {
    if (!selectedCategory) return;
    
    try {
      console.log('Loading nominations for category:', selectedCategory);
      const response = await fetch(`/api/nominations?category=${selectedCategory}`);
      console.log('Nominations response status:', response.status);
      
      const data = await response.json();
      console.log('Nominations data:', data);
      
      if (data.success) {
        setNominations(data.nominations || []);
        console.log('Set nominations:', data.nominations?.length || 0, 'items');
      } else {
        console.error('Failed to load nominations:', data.error);
      }
    } catch (error) {
      console.error('Failed to load nominations:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitNomination = async () => {
    if (!submitUrl.trim()) {
      setMessage('❌ Please enter a Reddit URL');
      return;
    }

    if (!selectedCategory) {
      setMessage('❌ Please select an award category');
      return;
    }

    setSubmitting(true);
    setMessage('');

    try {
      console.log('Submitting nomination:', { postUrl: submitUrl, category: selectedCategory, reason: nominationReason });
      
      const response = await fetch('/api/submit-nomination', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          postUrl: submitUrl,
          category: selectedCategory,
          reason: nominationReason
        })
      });

      console.log('Response status:', response.status);
      
      const data = await response.json();
      console.log('Response data:', data);

      if (data.success) {
        setMessage('✅ Nomination submitted successfully!');
        showToast('Nomination submitted successfully! 🎉', 'success');
        setSubmitUrl('');
        setNominationReason('');
        setSelectedCategory('');
        await loadNominations();
        setTimeout(() => switchView('list'), 1500);
      } else {
        const errorMsg = '❌ Error: ' + (data.error || 'Failed to submit');
        setMessage(errorMsg);
        showToast(data.error || 'Failed to submit nomination', 'error');
        console.error('Submission failed:', data);
      }
    } catch (error) {
      const errorMsg = '❌ Error submitting nomination: ' + (error instanceof Error ? error.message : 'Unknown error');
      setMessage(errorMsg);
      showToast(error instanceof Error ? error.message : 'Network error', 'error');
      console.error('Submission error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const exportCSV = () => {
    window.open(`/api/export-csv?category=${selectedCategory}`, '_blank');
    showToast('Exporting nominations to CSV...', 'info');
  };

  const getCategoryName = (catId: string) => {
    return AWARD_CATEGORIES.find(c => c.id === catId)?.name || catId;
  };

  const getCategoryEmoji = (catId: string) => {
    return AWARD_CATEGORIES.find(c => c.id === catId)?.emoji || '🏆';
  };

  const shareNomination = (nom: Nomination) => {
    const text = `Check out this nomination for ${getCategoryName(nom.category)}: "${nom.title}" by u/${nom.author}`;
    const shareUrl = nom.url;
    
    if (navigator.share) {
      navigator.share({
        title: 'The Internet Awards Nomination',
        text: text,
        url: shareUrl,
      }).catch(() => {
        // Fallback to clipboard
        copyToClipboard(shareUrl);
      });
    } else {
      copyToClipboard(shareUrl);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      showToast('Link copied to clipboard! 📋', 'success');
    }).catch(() => {
      showToast('Failed to copy link', 'error');
    });
  };

  const truncateTitle = (title: string, maxLength: number = 80) => {
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength).trim() + '...';
  };

  const renderCategorySelect = () => (
    <div className="category-select-view">
      <div className="banner-container">
        <img 
          src="/images/internet-awards.gif" 
          alt="The Internet Awards"
          className="banner-image"
          onError={(e) => {
            // Try SVG fallback if GIF not found
            if (e.currentTarget.src.endsWith('.gif')) {
              e.currentTarget.src = '/images/internet-awards-banner.svg';
            } else {
              // Final fallback to placeholder
              e.currentTarget.style.display = 'none';
              const fallback = e.currentTarget.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = 'block';
            }
          }}
        />
        <div className="banner-placeholder" style={{ display: 'none' }}>
          <h1>THE INTERNET AWARDS</h1>
          <h2>Games & Hobbies</h2>
        </div>
      </div>

      <div className="category-select-content">
        <h1>Select an Award Category</h1>
        <p className="subtitle">Choose a category to view nominations or submit your own</p>

        <div className="day-label">—— DAY 1 AWARD CATEGORIES ——</div>

        <div className="category-grid">
          {AWARD_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              className="category-card-button"
              onClick={() => selectCategory(cat.id)}
            >
              <div className="category-icon">{cat.emoji}</div>
              <h3>{cat.name}</h3>
              <div className="category-arrow">→</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderNominationCard = (nom: Nomination) => (
    <div key={nom.postId} className="nomination-card">
      {/* Thumbnail Section */}
      {nom.thumbnail && nom.thumbnail !== 'self' && nom.thumbnail !== 'default' && (
        <div className="nomination-thumbnail">
          <img 
            src={nom.thumbnail} 
            alt={nom.title}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}

      <div className="nomination-content">
        <div className="nomination-header">
          <h3 title={nom.title}>{truncateTitle(nom.title)}</h3>
        </div>

        <div className="nomination-meta-compact">
          <span className="meta-item karma">
            ⬆️ {nom.karma.toLocaleString()}
          </span>
          <span className="meta-divider">•</span>
          <span className="meta-item">
            u/{nom.author}
          </span>
          <span className="meta-divider">•</span>
          <span className="meta-item">
            {nom.subreddit}
          </span>
        </div>

        {nom.nominationReason && (
          <div className="nomination-reason">
            <strong>💭 Why it deserves to win:</strong>
            <p>{nom.nominationReason}</p>
          </div>
        )}

        <div className="nomination-footer">
          <div className="footer-actions">
            <a
              href={nom.url}
              target="_blank"
              rel="noopener noreferrer"
              className="action-btn primary"
            >
              <span className="btn-icon">🔗</span>
              View Post
            </a>
            <button
              className="action-btn secondary"
              onClick={() => shareNomination(nom)}
              title="Share nomination"
            >
              <span className="btn-icon">📤</span>
              Share
            </button>
          </div>
          <div className="footer-meta">
            <span className="nominated-by">
              Nominated by <strong>u/{nom.nominatedBy}</strong>
            </span>
            <span className="date">
              {new Date(nom.fetchedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSubmitForm = () => {
    // Try GIF first, then PNG, then default SVG
    const categoryBannerUrl = `/images/banners/${selectedCategory}.gif`;
    
    return (
      <div className="submit-form">
        <div className="banner-container">
          <img 
            src={categoryBannerUrl}
            alt={getCategoryName(selectedCategory)}
            className="banner-image"
            onError={(e) => {
              // Try PNG fallback
              if (e.currentTarget.src.endsWith('.gif')) {
                e.currentTarget.src = `/images/banners/${selectedCategory}.png`;
              } else if (e.currentTarget.src.includes('/banners/')) {
                // Fallback to default banner
                e.currentTarget.src = '/images/internet-awards-banner.svg';
              } else {
                // Final fallback to placeholder
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'block';
              }
            }}
          />
          <div className="banner-placeholder" style={{ display: 'none' }}>
            <h1>THE INTERNET AWARDS</h1>
            <h2>{getCategoryName(selectedCategory)}</h2>
          </div>
        </div>

      <div className="form-header">
        <button 
          className="back-button" 
          onClick={() => switchView('category-select')}
          disabled={submitting}
        >
          ← Back to Categories
        </button>
        <div className="form-category-badge">
          {getCategoryEmoji(selectedCategory)} {getCategoryName(selectedCategory)}
        </div>
      </div>

      <h2>Submit a Nomination</h2>
      <p className="instructions">
        Nominate a Reddit post for {getCategoryName(selectedCategory)}
      </p>

      <div className="form-group">
        <label>Reddit Post URL *</label>
        <input
          type="text"
          value={submitUrl}
          onChange={(e) => setSubmitUrl(e.target.value)}
          placeholder="https://www.reddit.com/r/subreddit/comments/..."
          disabled={submitting}
        />
      </div>

      {/* Post Preview */}
      {previewLoading && (
        <div className="post-preview loading">
          <div className="preview-skeleton">
            <div className="skeleton-thumb"></div>
            <div className="skeleton-title-preview"></div>
          </div>
        </div>
      )}
      
      {postPreview && !previewLoading && (
        <div className="post-preview">
          {postPreview.thumbnail && 
           postPreview.thumbnail !== 'self' && 
           postPreview.thumbnail !== 'default' && (
            <img 
              src={postPreview.thumbnail} 
              alt="Post thumbnail"
              className="preview-thumbnail"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
          <div className="preview-title">
            {postPreview.title}
          </div>
        </div>
      )}

      <div className="form-group">
        <label>Why does this deserve to win? (Optional)</label>
        <textarea
          value={nominationReason}
          onChange={(e) => setNominationReason(e.target.value)}
          placeholder="Tell us what makes this nomination special..."
          disabled={submitting}
          rows={3}
        />
      </div>

      {message && (
        <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <div className="form-actions">
        <button
          className="btn btn-primary"
          onClick={submitNomination}
          disabled={submitting || !submitUrl.trim() || !selectedCategory}
        >
          {submitting ? (
            <>
              <span className="spinner-small">⏳</span> Submitting...
            </>
          ) : (
            'Submit Nomination'
          )}
        </button>
      </div>

      {/* Toggle button for showing nominees */}
      <div className="nominees-toggle-container">
        <button
          className="btn btn-toggle"
          onClick={() => setShowNominees(!showNominees)}
        >
          {showNominees ? '▼' : '▶'} {showNominees ? 'Hide' : 'Show'} Nominees ({nominations.length})
        </button>
      </div>

      {/* Render nominees list inline when toggled */}
      {showNominees && (
        <div className="inline-nominees-section">
          <div className="nominees-header">
            <h3>Current Nominations</h3>
            <button className="btn btn-success btn-small" onClick={exportCSV}>
              📥 Export CSV
            </button>
          </div>
          
          {loading ? (
            <div className="loading-container">
              <div className="skeleton-list">
                {[1, 2, 3].map(i => (
                  <div key={i} className="skeleton-card">
                    <div className="skeleton-thumbnail"></div>
                    <div className="skeleton-content">
                      <div className="skeleton-line skeleton-title"></div>
                      <div className="skeleton-line skeleton-text"></div>
                      <div className="skeleton-line skeleton-text-short"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : nominations.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h3>No nominations yet</h3>
              <p>Be the first to nominate for this category!</p>
            </div>
          ) : (
            <div className="nominations-grid">
              {nominations.map(nomination => renderNominationCard(nomination))}
            </div>
          )}
        </div>
      )}
      </div>
    );
  };

  const renderNominationsList = () => {
    // Try GIF first, then PNG, then default SVG
    const categoryBannerUrl = `/images/banners/${selectedCategory}.gif`;
    
    return (
      <div className="nominations-list">
        <div className="banner-container">
          <img 
            src={categoryBannerUrl}
            alt={getCategoryName(selectedCategory)}
            className="banner-image"
            onError={(e) => {
              // Try PNG fallback
              if (e.currentTarget.src.endsWith('.gif')) {
                e.currentTarget.src = `/images/banners/${selectedCategory}.png`;
              } else if (e.currentTarget.src.includes('/banners/')) {
                // Fallback to default banner
                e.currentTarget.src = '/images/internet-awards-banner.svg';
              } else {
                // Final fallback to placeholder
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'block';
              }
            }}
          />
          <div className="banner-placeholder" style={{ display: 'none' }}>
            <h1>THE INTERNET AWARDS</h1>
            <h2>{getCategoryName(selectedCategory)}</h2>
          </div>
        </div>

      <div className="header">
        <div className="header-left">
          <button className="back-button" onClick={() => switchView('category-select')}>
            ← Change Category
          </button>
          <div className="header-title">
            <span className="category-emoji">{getCategoryEmoji(selectedCategory)}</span>
            <h1>{getCategoryName(selectedCategory)}</h1>
          </div>
          <p className="nomination-count">{nominations.length} nomination{nominations.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-success" onClick={exportCSV}>
            📥 Export CSV
          </button>
          <button className="btn btn-primary" onClick={() => switchView('submit')}>
            ➕ Submit Nomination
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          {/* Skeleton Loading */}
          <div className="stats">
            {[1, 2, 3].map(i => (
              <div key={i} className="stat-card skeleton">
                <div className="skeleton-line skeleton-stat-value"></div>
                <div className="skeleton-line skeleton-stat-label"></div>
              </div>
            ))}
          </div>
          <div className="nominations-grid">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="nomination-card skeleton">
                <div className="skeleton-badge"></div>
                <div className="skeleton-line skeleton-title"></div>
                <div className="skeleton-line skeleton-meta"></div>
                <div className="skeleton-line skeleton-meta"></div>
                <div className="skeleton-line skeleton-footer"></div>
              </div>
            ))}
          </div>
        </div>
      ) : nominations.length === 0 ? (
        <div className="empty-state">
          <h2>No nominations yet!</h2>
          <p>Be the first to nominate a post for {getCategoryName(selectedCategory)}.</p>
          <button className="btn btn-primary" onClick={() => switchView('submit')}>
            Submit First Nomination
          </button>
        </div>
      ) : (
        <>
          <div className="stats">
            <div className="stat-card">
              <div className="stat-value">{nominations.length}</div>
              <div className="stat-label">Nominations</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {new Set(nominations.map(n => n.subreddit)).size}
              </div>
              <div className="stat-label">Subreddits</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {nominations.reduce((sum, n) => sum + n.karma, 0).toLocaleString()}
              </div>
              <div className="stat-label">Total Karma</div>
            </div>
          </div>

          <div className="nominations-grid">
            {nominations
              .sort((a, b) => b.karma - a.karma)
              .map((nom) => (
                <div key={nom.postId} className="nomination-card">
                  {/* Thumbnail Section */}
                  {nom.thumbnail && nom.thumbnail !== 'self' && nom.thumbnail !== 'default' && (
                    <div className="nomination-thumbnail">
                      <img 
                        src={nom.thumbnail} 
                        alt={nom.title}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  <div className="nomination-content">
                    <div className="nomination-header">
                      <h3 title={nom.title}>{truncateTitle(nom.title)}</h3>
                    </div>

                    <div className="nomination-meta-compact">
                      <span className="meta-item karma">
                        ⬆️ {nom.karma.toLocaleString()}
                      </span>
                      <span className="meta-divider">•</span>
                      <span className="meta-item">
                        u/{nom.author}
                      </span>
                      <span className="meta-divider">•</span>
                      <span className="meta-item">
                        {nom.subreddit}
                      </span>
                    </div>

                    {nom.nominationReason && (
                      <div className="nomination-reason">
                        <strong>💭 Why it deserves to win:</strong>
                        <p>{nom.nominationReason}</p>
                      </div>
                    )}

                    <div className="nomination-footer">
                      <div className="footer-actions">
                        <a
                          href={nom.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="action-btn primary"
                        >
                          <span className="btn-icon">🔗</span>
                          View Post
                        </a>
                        <button
                          className="action-btn secondary"
                          onClick={() => shareNomination(nom)}
                          title="Share nomination"
                        >
                          <span className="btn-icon">📤</span>
                          Share
                        </button>
                      </div>
                      <div className="footer-meta">
                        <span className="nominated-by">
                          Nominated by <strong>u/{nom.nominatedBy}</strong>
                        </span>
                        <span className="date">
                          {new Date(nom.fetchedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </>
      )}
      </div>
    );
  };

  return (
    <div className="app">
      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        .app {
          min-height: 100vh;
          background: #000000;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          position: relative;
        }

        .banner-container {
          width: 100%;
          margin-bottom: 20px;
          position: relative;
        }

        .banner-image {
          width: 100%;
          height: auto;
          display: block;
          border-radius: 0 0 12px 12px;
        }

        .banner-placeholder {
          background: linear-gradient(135deg, #FF6B35 0%, #FF1744 50%, #FF69B4 100%);
          padding: 40px 20px;
          text-align: center;
          border-radius: 0 0 12px 12px;
          position: relative;
          overflow: hidden;
        }

        .banner-placeholder::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 20px;
          background: repeating-linear-gradient(
            45deg,
            #FFD700,
            #FFD700 10px,
            #000 10px,
            #000 20px
          );
        }

        .banner-placeholder h1 {
          font-size: 48px;
          font-weight: 900;
          color: white;
          margin: 0;
          text-shadow: 3px 3px 0 #000;
          letter-spacing: 2px;
        }

        .banner-placeholder h2 {
          font-size: 28px;
          font-weight: 700;
          color: white;
          margin: 10px 0 0 0;
          text-shadow: 2px 2px 0 #000;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin: 0 20px 30px;
          padding: 20px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          flex-wrap: wrap;
          gap: 20px;
        }

        .header-left {
          flex: 1;
          min-width: 300px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .category-emoji {
          font-size: 32px;
        }

        .header-left h1 {
          margin: 0;
          color: #333;
          font-size: 28px;
        }

        .nomination-count {
          margin: 0;
          color: #666;
          font-size: 14px;
        }

        .back-button {
          background: #f5f5f5;
          border: 1px solid #e0e0e0;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          color: #666;
          align-self: flex-start;
        }

        .back-button:hover:not(:disabled) {
          background: #e9ecef;
          color: #333;
          transform: translateX(-2px);
        }

        .back-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .filter-tabs {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .filter-dropdown {
          padding: 10px 16px;
          border: 2px solid #ddd;
          background: white;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          min-width: 250px;
          transition: all 0.2s;
        }

        .filter-dropdown:hover {
          border-color: #FF6B35;
        }

        .filter-dropdown:focus {
          outline: none;
          border-color: #FF6B35;
          box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.1);
        }

        .header-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .btn {
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          font-size: 14px;
          white-space: nowrap;
          position: relative;
          overflow: hidden;
        }

        .btn::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.3);
          transform: translate(-50%, -50%);
          transition: width 0.6s, height 0.6s;
        }

        .btn:active::before {
          width: 300px;
          height: 300px;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-primary {
          background: linear-gradient(135deg, #FF6B35 0%, #FF5722 100%);
          color: white;
          box-shadow: 0 2px 8px rgba(255, 107, 53, 0.3);
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(255, 107, 53, 0.4);
        }

        .btn-primary:active:not(:disabled) {
          transform: translateY(0);
        }

        .btn-secondary {
          background: #6c757d;
          color: white;
          box-shadow: 0 2px 8px rgba(108, 117, 125, 0.3);
        }

        .btn-secondary:hover:not(:disabled) {
          background: #5a6268;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(108, 117, 125, 0.4);
        }

        .btn-success {
          background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
          color: white;
          box-shadow: 0 2px 8px rgba(40, 167, 69, 0.3);
        }

        .btn-success:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(40, 167, 69, 0.4);
        }

        .stats {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 40px;
          margin: 0 20px 20px;
          padding: 16px 20px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          animation: fadeIn 0.4s ease-out;
        }

        .stat-card {
          display: flex;
          align-items: center;
          gap: 8px;
          text-align: left;
        }

        .stat-value {
          font-size: 24px;
          font-weight: 700;
          color: #FF6B35;
        }

        .stat-label {
          font-size: 13px;
          color: #666;
          font-weight: 500;
        }

        .nominations-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 20px;
          padding: 0 20px 20px;
        }

        .nomination-card {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          animation: slideInUp 0.4s ease-out backwards;
          display: flex;
          flex-direction: column;
        }

        .nomination-card:nth-child(1) { animation-delay: 0.05s; }
        .nomination-card:nth-child(2) { animation-delay: 0.1s; }
        .nomination-card:nth-child(3) { animation-delay: 0.15s; }
        .nomination-card:nth-child(4) { animation-delay: 0.2s; }
        .nomination-card:nth-child(5) { animation-delay: 0.25s; }
        .nomination-card:nth-child(6) { animation-delay: 0.3s; }

        .nomination-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(255, 107, 53, 0.25);
        }

        .nomination-thumbnail {
          width: 100%;
          height: 200px;
          overflow: hidden;
          background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
          position: relative;
        }

        .nomination-thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .nomination-card:hover .nomination-thumbnail img {
          transform: scale(1.05);
        }

        .nomination-content {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 15px;
          flex: 1;
        }

        /* Category Selection Screen */
        .category-select-view {
          animation: fadeIn 0.4s ease-out;
        }

        .category-select-content {
          max-width: 900px;
          margin: 0 auto;
          padding: 40px 20px;
        }

        .category-select-content h1 {
          text-align: center;
          color: white;
          font-size: 36px;
          font-weight: 700;
          margin: 0 0 10px 0;
        }

        .subtitle {
          text-align: center;
          color: #666;
          font-size: 18px;
          margin: 0 0 20px 0;
        }

        .day-label {
          text-align: center;
          color: #999;
          font-size: 8pt;
          font-weight: 600;
          letter-spacing: 1px;
          margin: 0 0 20px 0;
          text-transform: uppercase;
        }

        .category-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 12px;
        }

        .category-card-button {
          background: white;
          border: 2px solid #e0e0e0;
          border-radius: 12px;
          padding: 16px 20px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          text-align: left;
          position: relative;
          overflow: hidden;
        }

        .category-card-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(135deg, #FF6B35 0%, #FF5722 100%);
          transform: scaleX(0);
          transition: transform 0.3s ease;
        }

        .category-card-button:hover {
          border-color: #FF6B35;
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(255, 107, 53, 0.2);
        }

        .category-card-button:hover::before {
          transform: scaleX(1);
        }

        .category-icon {
          font-size: 28px;
          margin-bottom: 8px;
        }

        .category-card-button h3 {
          margin: 0;
          font-size: 16px;
          color: #333;
          line-height: 1.3;
        }

        .category-arrow {
          position: absolute;
          top: 50%;
          right: 20px;
          transform: translateY(-50%);
          font-size: 20px;
          color: #FF6B35;
          opacity: 0;
          transition: all 0.3s ease;
        }

        .category-card-button:hover .category-arrow {
          opacity: 1;
          right: 16px;
        }

        /* Form Category Badge */
        .form-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .form-category-badge {
          background: linear-gradient(135deg, #FF6B35 0%, #FF5722 100%);
          color: white;
          padding: 8px 20px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 700;
        }

        .nomination-header h3 {
          margin: 0;
          font-size: 20px;
          font-weight: 700;
          color: #1a1a1a;
          line-height: 1.4;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }

        .nomination-meta-compact {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          font-size: 13px;
          color: #666;
          padding: 8px 0;
        }

        .meta-item {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .meta-item.karma {
          background: linear-gradient(135deg, #ff4500 0%, #ff6b35 100%);
          color: white;
          padding: 4px 10px;
          border-radius: 12px;
          font-weight: 600;
        }

        .meta-divider {
          color: #ddd;
          font-weight: bold;
        }

        .nomination-reason {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          padding: 14px 16px;
          border-radius: 12px;
          font-size: 14px;
          border-left: 3px solid #FF6B35;
        }

        .nomination-reason strong {
          display: block;
          margin-bottom: 8px;
          color: #333;
          font-size: 13px;
        }

        .nomination-reason p {
          margin: 0;
          color: #555;
          line-height: 1.6;
          font-style: italic;
        }

        .nomination-footer {
          margin-top: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .footer-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .action-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
          white-space: nowrap;
        }

        .action-btn.primary {
          background: linear-gradient(135deg, #FF6B35 0%, #FF5722 100%);
          color: white;
          flex: 1;
          justify-content: center;
        }

        .action-btn.primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
        }

        .action-btn.secondary {
          background: #f5f5f5;
          color: #666;
          border: 1px solid #e0e0e0;
        }

        .action-btn.secondary:hover {
          background: #e9ecef;
          color: #333;
          border-color: #ccc;
        }

        .btn-icon {
          font-size: 16px;
        }

        .footer-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          color: #999;
          padding-top: 8px;
          border-top: 1px solid #f0f0f0;
        }

        .nominated-by {
          color: #666;
        }

        .nominated-by strong {
          color: #FF6B35;
          font-weight: 600;
        }

        .date {
          font-size: 11px;
          color: #999;
        }

        .submit-form {
          max-width: 700px;
          margin: 0 auto 20px;
          background: white;
          padding: 40px;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          animation: slideInUp 0.4s ease-out;
        }

        .submit-form h2 {
          margin-top: 0;
          color: #333;
        }

        .instructions {
          color: #666;
          margin-bottom: 30px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #333;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 12px;
          border: 2px solid #ddd;
          border-radius: 8px;
          font-size: 14px;
          box-sizing: border-box;
          font-family: inherit;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #FF6B35;
          box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.1);
          transform: translateY(-1px);
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          transition: all 0.3s ease;
        }

        .form-group textarea {
          resize: vertical;
        }

        /* Post Preview Styles */
        .post-preview {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: #f8f9fa;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          margin-bottom: 20px;
          animation: slideInUp 0.3s ease-out;
        }

        .post-preview.loading {
          background: #f8f9fa;
        }

        .preview-thumbnail {
          width: 60px;
          height: 60px;
          object-fit: cover;
          border-radius: 6px;
          flex-shrink: 0;
        }

        .preview-title {
          flex: 1;
          font-size: 14px;
          font-weight: 600;
          color: #333;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .preview-skeleton {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
        }

        .skeleton-thumb {
          width: 60px;
          height: 60px;
          background: #e0e0e0;
          border-radius: 6px;
          flex-shrink: 0;
          position: relative;
          overflow: hidden;
        }

        .skeleton-thumb::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.4),
            transparent
          );
          animation: shimmer 1.5s infinite;
        }

        .skeleton-title-preview {
          flex: 1;
          height: 16px;
          background: #e0e0e0;
          border-radius: 4px;
          position: relative;
          overflow: hidden;
        }

        .skeleton-title-preview::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.4),
            transparent
          );
          animation: shimmer 1.5s infinite;
        }

        .message {
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-weight: 600;
          animation: slideInDown 0.3s ease-out;
        }

        .message.success {
          background: #d4edda;
          color: #155724;
          border-left: 4px solid #28a745;
        }

        .message.error {
          background: #f8d7da;
          color: #721c24;
          border-left: 4px solid #dc3545;
        }

        /* Toast Notification */
        .toast-container {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 9999;
          pointer-events: none;
        }

        .toast {
          background: white;
          padding: 16px 24px;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 300px;
          max-width: 500px;
          pointer-events: all;
          animation: slideInDown 0.3s ease-out, pulse 0.3s ease-out 0.3s;
          border-left: 4px solid;
        }

        .toast.success {
          border-left-color: #28a745;
        }

        .toast.error {
          border-left-color: #dc3545;
        }

        .toast.info {
          border-left-color: #17a2b8;
        }

        .toast-icon {
          font-size: 24px;
          flex-shrink: 0;
        }

        .toast-message {
          flex: 1;
          font-weight: 500;
          color: #333;
        }

        .toast-close {
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          color: #999;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .toast-close:hover {
          background: #f0f0f0;
          color: #333;
        }

        .form-actions {
          display: flex;
          gap: 10px;
        }

        /* Toggle button for showing nominees */
        .nominees-toggle-container {
          margin-top: 24px;
          padding-top: 24px;
          border-top: 2px solid #e0e0e0;
          text-align: center;
        }

        .btn-toggle {
          background: #f8f9fa;
          border: 2px solid #dee2e6;
          color: #495057;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .btn-toggle:hover {
          background: #e9ecef;
          border-color: #adb5bd;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        .btn-toggle:active {
          transform: translateY(0);
        }

        /* Inline nominees section */
        .inline-nominees-section {
          margin-top: 20px;
          animation: slideInDown 0.3s ease-out;
        }

        .nominees-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          background: white;
          border-radius: 12px 12px 0 0;
          border-bottom: 2px solid #e0e0e0;
        }

        .nominees-header h3 {
          margin: 0;
          color: #333;
          font-size: 20px;
        }

        .btn-small {
          padding: 8px 16px;
          font-size: 14px;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          margin: 0 20px;
          animation: fadeIn 0.5s ease-out;
        }

        .empty-state h2 {
          color: #333;
          margin-bottom: 10px;
        }

        .empty-state p {
          color: #666;
          margin-bottom: 30px;
        }

        .loading-container {
          animation: fadeIn 0.3s ease-in;
        }

        /* Skeleton Loading Styles */
        .skeleton {
          position: relative;
          overflow: hidden;
        }

        .skeleton::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.4),
            transparent
          );
          animation: shimmer 1.5s infinite;
        }

        .skeleton-line {
          background: #e0e0e0;
          border-radius: 4px;
          margin: 8px 0;
        }

        .skeleton-stat-value {
          height: 36px;
          width: 80px;
          margin: 0 auto 8px;
        }

        .skeleton-stat-label {
          height: 14px;
          width: 120px;
          margin: 0 auto;
        }

        .skeleton-badge {
          position: absolute;
          top: 10px;
          right: 10px;
          width: 100px;
          height: 20px;
          background: #e0e0e0;
          border-radius: 12px;
        }

        .skeleton-title {
          height: 24px;
          width: 80%;
          margin-bottom: 15px;
        }

        .skeleton-meta {
          height: 16px;
          width: 60%;
          margin-bottom: 10px;
        }

        .skeleton-footer {
          height: 16px;
          width: 40%;
          margin-top: 15px;
        }

        @keyframes shimmer {
          0% {
            left: -100%;
          }
          100% {
            left: 100%;
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideInUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes slideInDown {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        .view-transitioning {
          opacity: 0.5;
          pointer-events: none;
          transition: opacity 0.3s ease;
        }

        .spinner-small {
          display: inline-block;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Button Styles */
        .btn {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-primary {
          background: #FF6B35;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #FF5722;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
        }

        .btn-primary:active:not(:disabled) {
          transform: translateY(0);
        }

        .btn-success {
          background: #28a745;
          color: white;
        }

        .btn-success:hover:not(:disabled) {
          background: #218838;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
        }

        .btn-success:active:not(:disabled) {
          transform: translateY(0);
        }

        .btn-secondary {
          background: #6c757d;
          color: white;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #5a6268;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(108, 117, 125, 0.3);
        }

        .btn-secondary:active:not(:disabled) {
          transform: translateY(0);
        }

        @media (max-width: 768px) {
          .toast-container {
            top: 10px;
            right: 10px;
            left: 10px;
          }

          .toast {
            min-width: unset;
            width: 100%;
          }
          .banner-placeholder h1 {
            font-size: 32px;
          }

          .banner-placeholder h2 {
            font-size: 20px;
          }

          .header {
            flex-direction: column;
          }

          .nominations-grid {
            grid-template-columns: 1fr;
          }

          .stats {
            flex-direction: column;
            gap: 12px;
            padding: 12px 16px;
          }

          .stat-card {
            width: 100%;
            justify-content: center;
          }

          .submit-form {
            padding: 20px;
          }

          .filter-tabs {
            flex-direction: column;
            align-items: flex-start;
            width: 100%;
          }

          .filter-dropdown {
            width: 100%;
            min-width: unset;
          }

          .nomination-thumbnail {
            height: 160px;
          }

          .footer-actions {
            flex-direction: column;
          }

          .action-btn {
            width: 100%;
            justify-content: center;
          }

          .footer-meta {
            flex-direction: column;
            gap: 8px;
            align-items: flex-start;
          }

          .category-grid {
            grid-template-columns: 1fr;
          }

          .category-select-content h1 {
            font-size: 28px;
          }

          .subtitle {
            font-size: 16px;
          }

          .header-title {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .category-emoji {
            font-size: 24px;
          }

          .form-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .nomination-meta-compact {
            font-size: 12px;
          }
        }
      `}</style>

      {/* Toast Notification */}
      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type}`}>
            <span className="toast-icon">
              {toast.type === 'success' && '✅'}
              {toast.type === 'error' && '❌'}
              {toast.type === 'info' && 'ℹ️'}
            </span>
            <span className="toast-message">{toast.message}</span>
            <button className="toast-close" onClick={() => setToast(null)}>
              ×
            </button>
          </div>
        </div>
      )}

      {/* Main Content with Transition */}
      <div className={isTransitioning ? 'view-transitioning' : ''}>
        {view === 'category-select' && renderCategorySelect()}
        {view === 'list' && renderNominationsList()}
        {view === 'submit' && renderSubmitForm()}
      </div>
    </div>
  );
};