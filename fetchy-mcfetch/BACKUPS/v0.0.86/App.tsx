import { useEffect, useState } from 'react';
import { AdminPanel } from './components/AdminPanel';
import type { AwardCategory, CategoryGroup, Nomination, EventStats } from '../shared/types/event';

type View = 'category-select' | 'submit' | 'list';

export const App = () => {
  const [view, setView] = useState<View>('category-select');
  const [categories, setCategories] = useState<AwardCategory[]>([]);
  const [categoryGroups, setCategoryGroups] = useState<CategoryGroup[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<AwardCategory | null>(null);
  const [nominations, setNominations] = useState<Nomination[]>([]);
  const [eventStats, setEventStats] = useState<EventStats | null>(null);
  
  // Form state
  const [submitUrl, setSubmitUrl] = useState('');
  const [nominationReason, setNominationReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  
  // UI state
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showNominees, setShowNominees] = useState(false);
  const [toast, setToast] = useState<{message: string; type: 'success'|'error'} | null>(null);
  const [postPreview, setPostPreview] = useState<{title: string; thumbnail: string | null} | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  
  // Load event configuration on mount
  useEffect(() => {
    loadEventConfig();
  }, []);

  // Admin hotkey
  useEffect(() => {
    let adminKeys = '';
    const handleKeyPress = (e: KeyboardEvent) => {
      adminKeys += e.key.toLowerCase();
      if (adminKeys.includes('admin')) {
        setShowAdminPanel(true);
        adminKeys = '';
      }
      if (adminKeys.length > 10) adminKeys = adminKeys.slice(-10);
    };
    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, []);

  const loadEventConfig = async () => {
    try {
      const response = await fetch('/api/event/config');
      const result = await response.json();
      
      if (result.success) {
        setCategories(result.data.categories || []);
        setCategoryGroups(result.data.categoryGroups || []);
      }
    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNominations = async (category?: string) => {
    try {
      setLoading(true);
      const url = category ? `/api/nominations?category=${category}` : '/api/nominations';
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success) {
        setNominations(result.data);
      }
    } catch (error) {
      console.error('Error loading nominations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEventStats = async () => {
    try {
      const response = await fetch('/api/stats/event');
      const result = await response.json();
      
      if (result.success) {
        setEventStats(result.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  // Debounced URL preview
  useEffect(() => {
    if (!submitUrl) {
      setPostPreview(null);
      return;
    }

    const timer = setTimeout(async () => {
      if (submitUrl.includes('reddit.com') || submitUrl.includes('redd.it')) {
        try {
          setPreviewLoading(true);
          const response = await fetch(`/api/preview-post?url=${encodeURIComponent(submitUrl)}`);
          const result = await response.json();
          
          if (result.success) {
            setPostPreview(result.data);
          }
        } catch (error) {
          console.error('Error fetching preview:', error);
        } finally {
          setPreviewLoading(false);
        }
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [submitUrl]);

  const selectCategory = (category: AwardCategory) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setSelectedCategory(category);
      setView('submit');
      setShowNominees(false);
      setIsTransitioning(false);
    }, 300);
  };

  const switchView = (newView: View) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setView(newView);
      if (newView === 'list') {
        loadNominations();
        loadEventStats();
      }
      setIsTransitioning(false);
    }, 300);
  };

  const goBack = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      if (view === 'submit') {
        setView('category-select');
        setSelectedCategory(null);
        setSubmitUrl('');
        setNominationReason('');
        setMessage('');
        setPostPreview(null);
      } else if (view === 'list') {
        setView('category-select');
      }
      setIsTransitioning(false);
    }, 300);
  };

  const toggleNomineesVisibility = () => {
    loadNominations(selectedCategory?.id);
    setShowNominees(!showNominees);
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const submitNomination = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');

    try {
      const response = await fetch('/api/submit-nomination', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postUrl: submitUrl,
          category: selectedCategory?.id,
          reason: nominationReason,
        }),
      });

      const result = await response.json();

      if (result.success) {
        showToast('Nomination submitted successfully!', 'success');
        setSubmitUrl('');
        setNominationReason('');
        setPostPreview(null);
        setTimeout(() => {
          loadNominations(selectedCategory?.id);
          setShowNominees(true);
        }, 1000);
      } else {
        setMessage(result.error || 'Failed to submit nomination');
        showToast(result.error || 'Failed to submit nomination', 'error');
      }
    } catch (error) {
      const errorMsg = 'Error submitting nomination. Please try again.';
      setMessage(errorMsg);
      showToast(errorMsg, 'error');
      console.error('Submit error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const exportCSV = async () => {
    try {
      const url = selectedCategory 
        ? `/api/export-csv?category=${selectedCategory.id}`
        : '/api/export-csv';
      
      window.location.href = url;
      showToast('Exporting nominations...', 'success');
    } catch (error) {
      console.error('Export error:', error);
      showToast('Failed to export', 'error');
    }
  };

  const truncateTitle = (title: string, maxLength: number = 80) => {
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength) + '...';
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  // Map category group IDs to header images
  const getCategoryHeaderImage = (groupId: string): string => {
    const headerMap: Record<string, string> = {
      'gaming-hobbies': '/images/headers/header-games.png',
      'funny-cute': '/images/headers/header-funnycute.png',
      'knowledge': '/images/headers/header-knowledge.png',
      'lifestyle-advice': '/images/headers/header-lifestyle.png',
      'pop-culture': '/images/headers/header-culture.png',
      'the-internet': '/images/headers/header-internet.png',
    };
    return headerMap[groupId] || '';
  };

  const renderCategorySelect = () => {
    return (
      <div className={`category-select-screen ${isTransitioning ? 'view-transitioning' : ''}`}>
        <div className="banner-container">
          <img 
            src="/images/banners/internet-awards.gif" 
            alt="The Internet Awards"
            className="banner-image"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const fallback = e.currentTarget.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = 'block';
            }}
          />
          <div className="banner-placeholder" style={{ display: 'none' }}>
            <h1>THE INTERNET AWARDS 2026</h1>
            <h2>3 Days of Celebrating Reddit</h2>
          </div>
        </div>

        <h3 className="category-select-title">—— THE AWARDS ——</h3>

        {categoryGroups.map(group => {
          const groupCategories = categories.filter(cat => cat.categoryGroup === group.id);
          const headerImage = getCategoryHeaderImage(group.id);
          
          return (
            <div key={group.id} className="category-group-section">
              <div className="category-group-header">
                <img 
                  src={headerImage}
                  alt={group.name}
                  className="category-group-header-image"
                  onError={(e) => {
                    // Fallback to text if image fails
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
                <h4 className="category-group-title" style={{ display: 'none' }}>
                  <span className="group-emoji">{group.emoji}</span>
                  {group.name.toUpperCase()}
                </h4>
              </div>
              <p className="category-group-tagline">{group.tagline}</p>
              
              <div className="category-grid">
                {groupCategories.map(cat => (
                  <button
                    key={cat.id}
                    className="category-card-button"
                    onClick={() => selectCategory(cat)}
                  >
                    <div className="category-icon">{cat.emoji}</div>
                    <h3>{cat.name}</h3>
                    <p className="category-desc">{cat.description}</p>
                    <div className="category-arrow">→</div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}

        <button className="stats-button" onClick={() => { loadEventStats(); switchView('list'); }}>
          📊 View All Nominations & Stats
        </button>
      </div>
    );
  };

  const renderSubmitForm = () => {
    if (!selectedCategory) return null;

    return (
      <div className={`submit-form ${isTransitioning ? 'view-transitioning' : ''}`}>
        <button className="back-button" onClick={goBack}>
          ← Back to Awards
        </button>

        {selectedCategory.bannerImage && (
          <div className="banner-container nomination-banner">
            <img 
              src={`/images/banners/${selectedCategory.bannerImage}`}
              alt={selectedCategory.name}
              className="banner-image"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}

        <div className="form-header">
          <div className="category-badge">
            <span className="category-emoji">{selectedCategory.emoji}</span>
            <span className="category-name">{selectedCategory.name}</span>
          </div>
          <h2>Submit Nomination</h2>
          <p className="day-indicator">{selectedCategory.description}</p>
        </div>

        <form onSubmit={submitNomination}>
          <div className="form-group">
            <label>Reddit Post URL *</label>
            <input
              type="url"
              value={submitUrl}
              onChange={(e) => setSubmitUrl(e.target.value)}
              placeholder="https://reddit.com/r/subreddit/comments/..."
              required
              disabled={submitting}
            />
            {previewLoading && <div className="preview-loading">Loading preview...</div>}
            {postPreview && (
              <div className="post-preview-card">
                {postPreview.thumbnail && (
                  <img src={postPreview.thumbnail} alt="Preview" className="preview-thumbnail" />
                )}
                <div className="preview-title">{postPreview.title}</div>
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Why does this deserve to win? (optional)</label>
            <textarea
              value={nominationReason}
              onChange={(e) => setNominationReason(e.target.value)}
              placeholder="Share why you think this post deserves recognition..."
              rows={4}
              disabled={submitting}
            />
          </div>

          {message && <div className="error-message">{message}</div>}

          <button type="submit" className="submit-button" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Nomination'}
          </button>
        </form>

        <button 
          className="show-nominees-button" 
          onClick={toggleNomineesVisibility}
        >
          {showNominees ? '▼ Hide Current Nominees' : '▶ Show Current Nominees'}
        </button>

        {showNominees && (
          <div className="nominees-section">
            <h3>Current Nominees in {selectedCategory.name}</h3>
            {loading ? (
              <div className="skeleton-grid">
                {[1, 2, 3].map(i => (
                  <div key={i} className="skeleton-card">
                    <div className="skeleton-title"></div>
                    <div className="skeleton-text"></div>
                    <div className="skeleton-text"></div>
                  </div>
                ))}
              </div>
            ) : nominations.length === 0 ? (
              <p className="no-data">No nominations yet. Be the first!</p>
            ) : (
              <div className="nominations-grid">
                {nominations.map((nom, idx) => (
                  <div key={idx} className="nomination-card">
                    {nom.thumbnail && (
                      <img src={nom.thumbnail} alt={nom.title} className="nomination-thumbnail" />
                    )}
                    <h4>{truncateTitle(nom.title)}</h4>
                    <div className="nomination-stats-compact">
                      <span>↑ {formatNumber(parseInt(nom.karma))}</span>
                      <span>u/{nom.author}</span>
                      <span>r/{nom.subreddit}</span>
                    </div>
                    {nom.nominationReason && (
                      <p className="nomination-reason">"{nom.nominationReason}"</p>
                    )}
                    <div className="nomination-footer">
                      <span>by u/{nom.nominatedBy}</span>
                      <a href={nom.url} target="_blank" rel="noopener noreferrer" className="view-post-link">
                        View Post →
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderNominationsList = () => {
    return (
      <div className={`nominations-list-screen ${isTransitioning ? 'view-transitioning' : ''}`}>
        <button className="back-button" onClick={goBack}>
          ← Back to Categories
        </button>

        <div className="list-header">
          <h2>All Nominations</h2>
          
          {eventStats && (
            <div className="event-stats-compact">
              <div className="stat-item">
                <span className="stat-value">{eventStats.totalNominations}</span>
                <span className="stat-label">Total Nominations</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{eventStats.totalNominators}</span>
                <span className="stat-label">Nominators</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{eventStats.totalCategories}</span>
                <span className="stat-label">Categories</span>
              </div>
            </div>
          )}

          <button className="export-button" onClick={exportCSV}>
            📥 Export All to CSV
          </button>
        </div>

        {loading ? (
          <div className="skeleton-grid">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="skeleton-card">
                <div className="skeleton-title"></div>
                <div className="skeleton-text"></div>
                <div className="skeleton-text"></div>
              </div>
            ))}
          </div>
        ) : nominations.length === 0 ? (
          <p className="no-data">No nominations yet.</p>
        ) : (
          <div className="nominations-grid">
            {nominations.map((nom, idx) => {
              const category = categories.find(c => c.id === nom.category);
              return (
                <div key={idx} className="nomination-card">
                  {category && (
                    <div className="category-badge-small">
                      {category.emoji} {category.name}
                    </div>
                  )}
                  {nom.thumbnail && (
                    <img src={nom.thumbnail} alt={nom.title} className="nomination-thumbnail" />
                  )}
                  <h4>{truncateTitle(nom.title)}</h4>
                  <div className="nomination-stats-compact">
                    <span>↑ {formatNumber(parseInt(nom.karma))}</span>
                    <span>u/{nom.author}</span>
                    <span>r/{nom.subreddit}</span>
                  </div>
                  {nom.nominationReason && (
                    <p className="nomination-reason">"{nom.nominationReason}"</p>
                  )}
                  <div className="nomination-footer">
                    <span>by u/{nom.nominatedBy}</span>
                    <a href={nom.url} target="_blank" rel="noopener noreferrer" className="view-post-link">
                      View Post →
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  if (loading && view === 'category-select') {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading The Internet Awards...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}

      {view === 'category-select' && renderCategorySelect()}
      {view === 'submit' && renderSubmitForm()}
      {view === 'list' && renderNominationsList()}

      {/* Admin Panel Trigger Button (always visible) */}
      <button
        className="admin-trigger-button"
        onClick={() => setShowAdminPanel(true)}
        title="Admin Panel (or type 'admin' anywhere)"
      >
        ⚙️
      </button>

      {/* Admin Panel Modal */}
      {showAdminPanel && <AdminPanel onClose={() => setShowAdminPanel(false)} />}
    </div>
  );
};
