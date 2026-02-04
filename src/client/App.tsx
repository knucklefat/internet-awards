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
  const [hasSubmitted, setHasSubmitted] = useState(false);
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
      setHasSubmitted(false);
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

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const handleDisabledButtonInteraction = () => {
    if (!submitUrl.trim()) {
      showToast('All nominees require supporting link', 'error');
    }
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
        if (result.isAdditionalVote) {
          showToast('✅ Your +1 has been recorded for this nominee!', 'success');
        } else {
          showToast('Nomination submitted successfully!', 'success');
        }
        setSubmitUrl('');
        setNominationReason('');
        setPostPreview(null);
        setHasSubmitted(true);
        // Reload nominations to show the newly submitted one
        setTimeout(() => {
          loadNominations(selectedCategory?.id);
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

  const nominateThisToo = async (postUrl: string, categoryId: string) => {
    try {
      const response = await fetch('/api/submit-nomination', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postUrl: postUrl,
          category: categoryId,
          reason: '', // No reason needed for "second" nominations
        }),
      });

      const result = await response.json();

      if (result.success) {
        if (result.isAdditionalVote) {
          showToast('✅ Your +1 has been recorded for this nominee!', 'success');
        } else {
          showToast('Your nomination has been added!', 'success');
        }
        loadNominations(categoryId);
      } else {
        showToast(result.error || 'Failed to add nomination', 'error');
      }
    } catch (error) {
      showToast('Error adding nomination', 'error');
      console.error('Nominate error:', error);
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
  // Map category group IDs to header images
  const getCategoryHeaderImage = (groupId: string): string => {
    const headerMap: Record<string, string> = {
      'gaming-hobbies': '/images/category-headers/header-games.png',
      'funny-cute': '/images/category-headers/header-funnycute.png',
      'knowledge': '/images/category-headers/header-knowledge.png',
      'lifestyle-advice': '/images/category-headers/header-lifestyle.png',
      'pop-culture': '/images/category-headers/header-culture.png',
      'the-internet': '/images/category-headers/header-internet.png',
    };
    return headerMap[groupId] || '';
  };

  const renderCategorySelect = () => {
    return (
      <div className={`main-screen ${isTransitioning ? 'view-transitioning' : ''}`}>
        <div className="banner-container">
          <img 
            src="/images/banners/main-banner.png" 
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

        <h3 className="main-title">The Awards</h3>
        <p className="main-subtitle">25 Awards across 6 categories celebrating the very best on the internet</p>

        {categoryGroups.map(group => {
          const groupCategories = categories.filter(cat => cat.categoryGroup === group.id);
          const headerImage = getCategoryHeaderImage(group.id);
          
          return (
            <div key={group.id} className="award-group-section">
              <div className="award-group-header">
                <img 
                  src={headerImage}
                  alt={group.name}
                  className="award-group-header-image"
                  onError={(e) => {
                    // Fallback to text if image fails
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
                <h4 className="award-group-title" style={{ display: 'none' }}>
                  <span className="group-emoji">{group.emoji}</span>
                  {group.name.toUpperCase()}
                </h4>
              </div>
              <p className="award-group-tagline">{group.tagline}</p>
              
              <div className="award-grid">
                {groupCategories.map(cat => (
                  <button
                    key={cat.id}
                    className="award-card"
                    onClick={() => selectCategory(cat)}
                  >
                    <div 
                      className="award-gradient-section" 
                      style={{ background: cat.cardColor || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                    />
                    <div className="award-icon-container">
                      <div className="award-icon">
                        {cat.iconPath ? (
                          <img 
                            src={cat.iconPath} 
                            alt={cat.name}
                            className="award-icon-img"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'inline';
                            }}
                          />
                        ) : null}
                        <span style={{ display: cat.iconPath ? 'none' : 'inline' }}>{cat.emoji}</span>
                      </div>
                    </div>
                    <div className="award-details-section">
                      <h3>{cat.name}</h3>
                      <p className="award-description">{cat.description}</p>
                      <div className="award-card-footer">Nominate Now</div>
                    </div>
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
        <div className="form-top-nav">
          <button className="back-button" onClick={goBack}>
            ← Back to Awards
          </button>
          <div className="submit-nomination-label">Submit Nomination</div>
        </div>

        <div className="form-header">
          {selectedCategory.headerImage && (
            <div className="award-header-banner">
              <img 
                src={selectedCategory.headerImage} 
                alt={selectedCategory.name}
                className="award-header-image"
              />
              <h1 className={`award-header-title ${selectedCategory.headerTextAlign ? `align-${selectedCategory.headerTextAlign}` : ''}`}>
                {selectedCategory.name}
              </h1>
            </div>
          )}
          {!selectedCategory.headerImage && (
            <div className="category-badge">
              <span className="category-emoji">{selectedCategory.emoji}</span>
              <span className="category-name">{selectedCategory.name}</span>
            </div>
          )}
          <p className="award-description-text">{selectedCategory.description}</p>
        </div>

        <form onSubmit={submitNomination}>
          <div className="form-group">
            <label>Nominee Name or description</label>
            <input
              type="text"
              value={nominationReason}
              onChange={(e) => setNominationReason(e.target.value)}
              placeholder="Briefly describe what this is..."
              disabled={submitting}
            />
          </div>

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

          {message && <div className="error-message">{message}</div>}

          <button 
            type="submit" 
            className="submit-button" 
            disabled={submitting || !submitUrl.trim()}
            onClick={(e) => {
              if (submitting || !submitUrl.trim()) {
                e.preventDefault();
                handleDisabledButtonInteraction();
              }
            }}
            onMouseEnter={() => {
              if (submitting || !submitUrl.trim()) {
                handleDisabledButtonInteraction();
              }
            }}
          >
            {submitting ? 'Submitting...' : 'Submit Nomination'}
          </button>
        </form>

        {!hasSubmitted && (
          <p className="submit-hint">Submit to see list of other nominees</p>
        )}

        {hasSubmitted && (
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
              <>
              <div className="nominations-grid">
                {nominations.slice(0, 5).map((nom, idx) => {
                  const category = categories.find(c => c.id === nom.category);
                  return (
                    <div key={idx} className="nomination-card">
                      {nom.thumbnail && (
                        <img 
                          src={nom.thumbnail} 
                          alt={nom.title} 
                          className="nomination-thumbnail"
                          onClick={() => window.open(nom.url, '_blank', 'noopener,noreferrer')}
                        />
                      )}
                      <div className="nomination-content">
                        {category && (
                          <div className="category-badge-small">
                            {category.iconPath ? (
                              <img 
                                src={category.iconPath} 
                                alt={category.name}
                                className="category-badge-icon"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                  if (fallback) fallback.style.display = 'inline';
                                }}
                              />
                            ) : null}
                            <span style={{ display: category.iconPath ? 'none' : 'inline' }}>{category.emoji}</span> {category.name}
                            <span className="nominee-label">Nominee</span>
                          </div>
                        )}
                        <h4 
                          className="nomination-title"
                          onClick={() => window.open(nom.url, '_blank', 'noopener,noreferrer')}
                        >
                          {truncateTitle(nom.title, 100)}
                        </h4>
                      </div>
                      <div className="nomination-actions">
                        <a 
                          href={nom.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="view-post-link"
                          onClick={(e) => e.stopPropagation()}
                        >
                          🔗 VIEW POST
                        </a>
                        <button 
                          className="nominate-too-button"
                          onClick={() => nominateThisToo(nom.url, nom.category)}
                        >
                          ⬆️ +1 <span className="nominate-text">Nominate too</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="related-awards-section">
                <h3>Nominate for other awards in this category:</h3>
                <div className="related-awards-grid">
                  {categories
                    .filter(cat => cat.categoryGroup === selectedCategory.categoryGroup && cat.id !== selectedCategory.id)
                    .slice(0, 5)
                    .map((award) => (
                      <button
                        key={award.id}
                        className="related-award-button"
                        onClick={() => {
                          setSelectedCategory(award);
                          setHasSubmitted(false);
                          setSubmitUrl('');
                          setNominationReason('');
                          setMessage('');
                          setPostPreview(null);
                          window.scrollTo(0, 0);
                        }}
                      >
                        <div className="related-award-icon">
                          {award.iconPath ? (
                            <img 
                              src={award.iconPath} 
                              alt={award.name}
                              className="related-icon-img"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = 'inline';
                              }}
                            />
                          ) : null}
                          <span style={{ display: award.iconPath ? 'none' : 'inline' }}>{award.emoji}</span>
                        </div>
                        <div className="related-award-name">{award.name}</div>
                      </button>
                    ))}
                </div>
              </div>
              </>
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
                  {nom.thumbnail && (
                    <img 
                      src={nom.thumbnail} 
                      alt={nom.title} 
                      className="nomination-thumbnail"
                      onClick={() => window.open(nom.url, '_blank', 'noopener,noreferrer')}
                    />
                  )}
                  <div className="nomination-content">
                    {category && (
                      <div className="category-badge-small">
                        {category.iconPath ? (
                          <img 
                            src={category.iconPath} 
                            alt={category.name}
                            className="category-badge-icon"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'inline';
                            }}
                          />
                        ) : null}
                        <span style={{ display: category.iconPath ? 'none' : 'inline' }}>{category.emoji}</span> {category.name}
                        <span className="nominee-label">Nominee</span>
                      </div>
                    )}
                    <h4 
                      className="nomination-title"
                      onClick={() => window.open(nom.url, '_blank', 'noopener,noreferrer')}
                    >
                      {truncateTitle(nom.title, 100)}
                    </h4>
                  </div>
                  <div className="nomination-actions">
                    <a 
                      href={nom.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="view-post-link"
                      onClick={(e) => e.stopPropagation()}
                    >
                      🔗 VIEW POST
                    </a>
                    <button 
                      className="nominate-too-button"
                      onClick={() => nominateThisToo(nom.url, nom.category)}
                    >
                      ⬆️ +1 <span className="nominate-text">Nominate too</span>
                    </button>
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
