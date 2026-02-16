import { useEffect, useRef, useState } from 'react';
import { navigateTo } from '@devvit/web/client';
import { AdminPanel } from './components/AdminPanel';
import type { Award, Category, Nomination, EventStats } from '../shared/types/event';

type View = 'category-select' | 'submit' | 'list';

/** Gradient colors per category (start, middle, end). Used for award card tops. */
const GROUP_GRADIENTS: Record<string, { start: string; middle: string; end: string }> = {
  'gaming-hobbies': { start: '#00e2b7', middle: '#92ffea', end: '#dfff00' },
  'funny-cute': { start: '#ff5fc2', middle: '#ff9fdf', end: '#ffde55' },
  'knowledge': { start: '#9df000', middle: '#dfff00', end: '#ffde55' },
  'lifestyle-advice': { start: '#ff4500', middle: '#ff5fc2', end: '#ff9fdf' },
  'pop-culture': { start: '#00e2b7', middle: '#92ffea', end: '#dfff00' },
  'the-internet': { start: '#ff5fc2', middle: '#ff9fdf', end: '#ffde55' },
};

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Deterministic gradient per card: group colors with random angle and middle stop for variety. */
function getGroupGradient(groupId: string, seed: string): string {
  const g = GROUP_GRADIENTS[groupId] ?? { start: '#667eea', middle: '#764ba2', end: '#764ba2' };
  const angle = 90 + (hash(seed) % 180); // 90–270deg
  const midStop = 35 + (hash(seed + 'm') % 30); // 35–65%
  return `linear-gradient(${angle}deg, ${g.start} 0%, ${g.middle} ${midStop}%, ${g.end} 100%)`;
}

export const App = () => {
  const [view, setView] = useState<View>('category-select');
  const [categories, setCategories] = useState<Category[]>([]); // The 6 categories
  const [awards, setAwards] = useState<Award[]>([]); // The 24 awards
  const [selectedAward, setSelectedAward] = useState<Award | null>(null);
  const [nominations, setNominations] = useState<Nomination[]>([]);
  const [eventStats, setEventStats] = useState<EventStats | null>(null);
  
  // Form state: name/description (required), optional link, optional reason
  const [nominationTitle, setNominationTitle] = useState('');
  const [submitUrl, setSubmitUrl] = useState('');
  const [nominationReason, setNominationReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  
  // UI state
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [toast, setToast] = useState<{message: string; type: 'success'|'error'} | null>(null);
  const [toastLeaving, setToastLeaving] = useState(false);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [justSecondedKey, setJustSecondedKey] = useState<string | null>(null);
  const [postPreview, setPostPreview] = useState<{title: string; thumbnail: string | null} | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [isModerator, setIsModerator] = useState(false);
  const [nominationCount, setNominationCount] = useState<{ used: number; limit: number; unlimited?: boolean } | null>(null);
  const [showEntryForm, setShowEntryForm] = useState(true);
  const [nomineesStartIndex, setNomineesStartIndex] = useState(0);
  const [reportedMemberKeys, setReportedMemberKeys] = useState<Set<string>>(new Set());

  /** When true, show "Other Nominees" on submit screen. Option B (global): once user has submitted any nomination in this event. For Option A (per-award), replace with: hasSubmitted || hasNominatedForCategory and set hasNominatedForCategory from GET /api/user/has-nominated?category=... */
  const showNomineeList = hasSubmitted || (nominationCount != null && nominationCount.used > 0);

  // Load event configuration and check moderator status on mount
  useEffect(() => {
    loadEventConfig();
    checkModeratorStatus();
  }, []);

  // Scroll to top when entering a view that shows nomination cards (submit form or list)
  useEffect(() => {
    if (view !== 'submit' && view !== 'list') return;
    const id = requestAnimationFrame(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    });
    return () => cancelAnimationFrame(id);
  }, [view]);

  // Refresh nomination count when entering submit form so limit display is up to date
  useEffect(() => {
    if (view === 'submit' && selectedAward) loadNominationCount();
  }, [view, selectedAward?.id]);

  // When nominee list is visible on submit view, ensure we have nominations for this category (e.g. user returned to award)
  useEffect(() => {
    if (view === 'submit' && selectedAward?.id && showNomineeList) {
      loadNominations(selectedAward.id);
    }
  }, [view, selectedAward?.id, showNomineeList]);

  const wasLoadingNominations = useRef(false);
  useEffect(() => {
    if (loading) wasLoadingNominations.current = true;
    if (!loading && wasLoadingNominations.current && (view === 'submit' || view === 'list')) {
      wasLoadingNominations.current = false;
      const t = setTimeout(() => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }, 50);
      return () => clearTimeout(t);
    }
    if (!loading) wasLoadingNominations.current = false;
  }, [view, loading]);

  // Admin hotkey (only for moderators)
  useEffect(() => {
    if (!isModerator) return;
    
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
  }, [isModerator]);

  const loadNominationCount = async () => {
    try {
      const response = await fetch('/api/user/nomination-count');
      const data = await response.json();
      if (data?.success && typeof data.used === 'number' && typeof data.limit === 'number') {
        setNominationCount({ used: data.used, limit: data.limit, unlimited: data.unlimited === true });
      }
    } catch {
      setNominationCount(null);
    }
  };

  const loadEventConfig = async () => {
    try {
      const response = await fetch('/api/event/config');
      const result = await response.json();
      
      if (result.success) {
        setCategories(result.data.categories || []);
        setAwards(result.data.awards || []);
      }
      loadNominationCount();
    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkModeratorStatus = async () => {
    try {
      const response = await fetch('/api/user/is-moderator');
      const result = await response.json();
      if (result.success) {
        setIsModerator(Boolean(result.isModerator));
      } else {
        setIsModerator(false);
      }
    } catch (error) {
      console.error('[CLIENT] Moderator check failed:', error);
      setIsModerator(false);
    }
  };

  const loadNominations = async (category?: string) => {
    try {
      setLoading(true);
      const base = category ? `/api/nominations?category=${category}` : '/api/nominations';
      const url = isModerator ? `${base}${base.includes('?') ? '&' : '?'}includeHidden=1` : base;
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
          setPostPreview(null);
          const response = await fetch(`/api/preview-post?url=${encodeURIComponent(submitUrl)}`);
          const result = await response.json();

          if (result.success) {
            setPostPreview(result.data);
          } else {
            setPostPreview({
              title: result?.error ?? 'Preview unavailable',
              thumbnail: null,
            });
          }
        } catch (error) {
          console.error('Error fetching preview:', error);
          setPostPreview({ title: 'Preview unavailable', thumbnail: null });
        } finally {
          setPreviewLoading(false);
        }
      } else {
        setPostPreview(null);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [submitUrl]);

  const selectAward = (award: Award) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setSelectedAward(award);
      setView('submit');
      setShowEntryForm(true);
      setNomineesStartIndex(0);
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
        setSelectedAward(null);
        setNominationTitle('');
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
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = null;
    }
    setToastLeaving(false);
    setToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToastLeaving(true);
      toastTimeoutRef.current = setTimeout(() => {
        setToast(null);
        setToastLeaving(false);
        toastTimeoutRef.current = null;
      }, 300);
    }, 5000);
  };

  const handleDisabledButtonInteraction = () => {
    const atLimit = nominationCount != null && !nominationCount.unlimited && nominationCount.used >= nominationCount.limit;
    if (atLimit) {
      showToast(`You've reached the limit of ${nominationCount!.limit} nominations.`, 'error');
      return;
    }
    if (!nominationTitle.trim()) {
      showToast('Please enter a nominee name or description', 'error');
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
          category: selectedAward?.id,
          title: nominationTitle.trim(),
          postUrl: submitUrl.trim() || undefined,
          reason: nominationReason.trim() || undefined,
        }),
      });

      const result = await response.json();

      if (response.status === 429) {
        const msg = result.error || "You've reached the limit of 30 nominations.";
        setMessage(msg);
        showToast(msg, 'error');
        loadNominationCount();
        return;
      }

      if (result.success) {
        if (result.isAdditionalVote) {
          showToast('YOU HAVE SECONDED THIS NOMINATION!', 'success');
        } else {
          showToast('Nominee submitted successfully', 'success');
          loadNominationCount();
        }
        setSubmitUrl('');
        setNominationReason('');
        setPostPreview(null);
        setHasSubmitted(true);
        setShowEntryForm(false);
        // Reload nominations to show the newly submitted one
        setTimeout(() => {
          loadNominations(selectedAward?.id);
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

  /** Build post URL for "second" when nomination has postId but url may be missing (e.g. legacy data). */
  const getSecondPostUrl = (nom: Nomination): string | undefined => {
    if (nom.url && nom.url.trim()) return nom.url.trim();
    const pid = (nom.postId || '').replace(/^t3_/, '');
    if (pid) return `https://www.reddit.com/comments/${pid}`;
    return undefined;
  };

  /** Unique key for a nomination for second/optimistic-update matching. */
  const getNominationSecondKey = (nom: Nomination): string =>
    `${nom.category}:${nom.thingSlug || getSecondPostUrl(nom) || ''}`;

  const handleToggleFlag = async (nom: Nomination) => {
    const memberKey = nom.memberKey?.trim();
    if (!memberKey) return;
    const isFlagged = nom.flagged || reportedMemberKeys.has(memberKey);
    const endpoint = isFlagged ? '/api/unflag-nomination' : '/api/flag-nomination';
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberKey }),
      });
      const result = await res.json();
      if (result.success) {
        if (isFlagged) {
          setReportedMemberKeys((prev) => {
            const next = new Set(prev);
            next.delete(memberKey);
            return next;
          });
          setNominations((prev) =>
            prev.map((n) => (n.memberKey === memberKey ? { ...n, flagged: false } : n))
          );
          showToast('Unflagged', 'success');
        } else {
          setReportedMemberKeys((prev) => new Set(prev).add(memberKey));
          setNominations((prev) =>
            prev.map((n) => (n.memberKey === memberKey ? { ...n, flagged: true } : n))
          );
          showToast('Flagged', 'error');
        }
      } else {
        showToast(result.error || (isFlagged ? 'Failed to unflag' : 'Failed to flag'), 'error');
      }
    } catch {
      showToast(isFlagged ? 'Failed to unflag' : 'Failed to flag', 'error');
    }
  };

  const nominateThisToo = async (
    categoryId: string,
    options: { postUrl?: string; thingSlug?: string },
    reloadCategoryId?: string
  ) => {
    const { postUrl, thingSlug } = options;
    if (!postUrl && !thingSlug) return;
    try {
      const response = await fetch('/api/submit-nomination', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: categoryId,
          ...(postUrl ? { postUrl } : {}),
          ...(thingSlug ? { thingSlug } : {}),
        }),
      });

      const result = await response.json();

      if (response.status === 429) {
        showToast(result.error || "You've reached the limit of 30 nominations.", 'error');
        loadNominationCount();
        return;
      }

      if (result.success) {
        if (result.isAdditionalVote) {
          showToast('YOU HAVE SECONDED THIS NOMINATION!', 'success');
          const secondKey = `${categoryId}:${thingSlug || postUrl || ''}`;
          setNominations((prev) =>
            prev.map((n) =>
              getNominationSecondKey(n) === secondKey ? { ...n, currentUserHasSeconded: true } : n
            )
          );
          setJustSecondedKey(secondKey);
          setTimeout(() => setJustSecondedKey(null), 350);
        } else {
          showToast('Nominee submitted successfully', 'success');
          loadNominationCount();
          if (reloadCategoryId != null) {
            loadNominations(reloadCategoryId);
          } else {
            loadNominations();
            loadEventStats();
          }
        }
      } else {
        showToast(result.error || 'Failed to add nomination', 'error');
      }
    } catch (error) {
      showToast('Error adding nomination', 'error');
      console.error('Nominate error:', error);
    }
  };

  const truncateTitle = (title: string, maxLength: number = 80) => {
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength) + '...';
  };

  /** Second line: post title when link submitted, only if different from first line. Never same as first line. */
  const getNominationSecondLine = (nom: Nomination): string => {
    const hasLink = Boolean(nom.url && nom.url.trim());
    if (!hasLink) return '';
    const postTitle = (nom.postTitle || '').trim();
    if (!postTitle) return '';
    const firstLine = (nom.title || '').trim();
    if (firstLine === postTitle) return '';
    return postTitle;
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

        <p className="main-subtitle">Celebrating the very best of The Internet</p>

        <div className="award-count-divider">
          <p className="category-break-title">24 AWARDS ACROSS 6 CATEGORIES</p>
        </div>

        {categories.map(cat => {
          const categoryAwards = awards.filter(a => a.category === cat.id);
          const headerImage = getCategoryHeaderImage(cat.id);
          
          return (
            <div key={cat.id} className="category-section">
              <div className="category-header">
                <img 
                  src={headerImage}
                  alt={cat.name}
                  className="category-header-image"
                  onError={(e) => {
                    // Fallback to text if image fails
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
                <h4 className="category-title" style={{ display: 'none' }}>
                  <span className="group-emoji">{cat.emoji}</span>
                  {cat.name.toUpperCase()}
                </h4>
              </div>
              <p className="category-tagline">{cat.tagline}</p>
              <p className="category-break-title">CATEGORY AWARDS</p>
              <div className="award-grid">
                {categoryAwards.map(award => (
                  <button
                    key={award.id}
                    className="award-card"
                    onClick={() => selectAward(award)}
                  >
                    <div 
                      className="award-gradient-section" 
                      style={{ background: getGroupGradient(cat.id, award.id) }}
                    />
                    <div className="award-icon-container">
                      <div className="award-icon">
                        {award.iconPath ? (
                          <img 
                            src={award.iconPath} 
                            alt={award.name}
                            className="award-icon-img"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'inline';
                            }}
                          />
                        ) : null}
                        <span style={{ display: award.iconPath ? 'none' : 'inline' }}>{award.emoji}</span>
                      </div>
                    </div>
                    <div className="award-details-section">
                      <h3>{award.name}</h3>
                      <p className="award-description">{award.description}</p>
                      <div className="award-card-footer">Nominate Now</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}

        <footer className="main-footer">
          <div className="main-footer-links">
            <button type="button" className="footer-link" onClick={() => navigateTo('https://www.reddit.com/help/contentpolicy/')}>RULES</button>
            <button type="button" className="footer-link" onClick={() => navigateTo('https://www.redditinc.com/policies')}>LEGAL</button>
            <button type="button" className="footer-link" onClick={() => navigateTo('https://www.reddit.com/help/')}>HELP</button>
          </div>
          <div className="main-footer-copy">©2026 Reddit, Inc.</div>
        </footer>
      </div>
    );
  };

  const renderSubmitForm = () => {
    if (!selectedAward) return null;

    const nomineesWindowStart =
      nominations.length <= 5 ? 0 : Math.min(nomineesStartIndex, Math.max(0, nominations.length - 5));

    return (
      <div className={`submit-form ${isTransitioning ? 'view-transitioning' : ''}`}>
        <div className="form-top-nav">
          <button type="button" className="back-button back-button-link" onClick={goBack}>
            ← BACK TO AWARDS
          </button>
          <div className="submit-nomination-label">AWARD NOMINEE</div>
        </div>

        <div className="form-header">
          {selectedAward.headerImage && (
            <div className="award-header-banner">
              <img 
                src={selectedAward.headerImage} 
                alt={selectedAward.name}
                className="award-header-image"
              />
              <h1 className={`award-header-title ${selectedAward.headerTextAlign ? `align-${selectedAward.headerTextAlign}` : ''} ${selectedAward.name.length > 20 ? 'award-header-title-long' : ''}`}>
                {selectedAward.name}
              </h1>
            </div>
          )}
          {!selectedAward.headerImage && (
            <div className="category-badge">
              <span className="category-emoji">{selectedAward.emoji}</span>
              <span className="category-name">{selectedAward.name}</span>
            </div>
          )}
          <p className="award-description-text">{selectedAward.description}</p>
          <button
            type="button"
            className="eligibility-link"
            onClick={() => navigateTo('https://www.reddit.com/help/contentpolicy/')}
          >
            ELIGIBILITY REQUIREMENTS
          </button>
        </div>

        {(hasSubmitted && !showEntryForm) ? (
          <div className="nominate-another-row">
            <button
              type="button"
              className="nominate-another-button"
              onClick={() => setShowEntryForm(true)}
            >
              NOMINATE ANOTHER
            </button>
          </div>
        ) : (
        <form onSubmit={submitNomination} noValidate>
          <div className="form-group">
            <label>Nominee name or description *</label>
            <input
              type="text"
              value={nominationTitle}
              onChange={(e) => setNominationTitle(e.target.value)}
              placeholder={selectedAward?.nomineeNamePlaceholder ?? 'e.g. Elden Ring, that breakdancing cat, 6-7...'}
              disabled={submitting}
              required
            />
          </div>

          <div className="form-group">
            <label>Supporting Post/community (Optional)</label>
            <input
              type="text"
              inputMode="url"
              autoComplete="url"
              value={submitUrl}
              onChange={(e) => setSubmitUrl(e.target.value)}
              placeholder="https://reddit.com/r/subreddit/comments/..."
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
            <label>Why does this deserve the award? (optional)</label>
            <input
              type="text"
              value={nominationReason}
              onChange={(e) => setNominationReason(e.target.value)}
              placeholder="Briefly say why..."
              disabled={submitting}
            />
          </div>

          {message && <div className="error-message">{message}</div>}

          <button 
            type="submit" 
            className="submit-button" 
            disabled={
              submitting ||
              !nominationTitle.trim() ||
              (nominationCount != null && !nominationCount.unlimited && nominationCount.used >= nominationCount.limit)
            }
            onClick={(e) => {
              const atLimit = nominationCount != null && !nominationCount.unlimited && nominationCount.used >= nominationCount.limit;
              if (submitting || !nominationTitle.trim() || atLimit) {
                e.preventDefault();
                handleDisabledButtonInteraction();
              }
            }}
            onMouseEnter={() => {
              const atLimit = nominationCount != null && !nominationCount.unlimited && nominationCount.used >= nominationCount.limit;
              if (submitting || !nominationTitle.trim() || atLimit) {
                handleDisabledButtonInteraction();
              }
            }}
          >
            {submitting
              ? 'Submitting...'
              : nominationCount != null && !nominationCount.unlimited && nominationCount.used >= nominationCount.limit
                ? 'Limit reached (30)'
                : 'Submit Nomination'}
          </button>
        </form>
        )}

        {!showNomineeList && (
          <p className="submit-hint">Submit to see list of other nominees</p>
        )}

        {showNomineeList && (
          <div className="nominees-section">
            <div className="nominees-section-header">
              {selectedAward && (
                <div className="category-badge-small category-flair-in-header">
                  {selectedAward.iconPath ? (
                    <img
                      src={selectedAward.iconPath}
                      alt=""
                      className="category-badge-icon"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'inline';
                      }}
                    />
                  ) : null}
                  <span style={{ display: selectedAward.iconPath ? 'none' : 'inline' }}>{selectedAward.emoji}</span>
                  <span className="nominee-label">OTHER AWARD NOMINEES</span>
                </div>
              )}
              <button
                type="button"
                className="nominees-refresh-button"
                onClick={() => setNomineesStartIndex((prev) => (prev + 5 >= nominations.length ? 0 : prev + 5))}
                title="Cycle list"
                aria-label="Cycle list"
              >
                <img src="/images/refresh.png" alt="" className="nominees-refresh-icon" />
              </button>
            </div>
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
                {nominations.slice(nomineesWindowStart, nomineesWindowStart + 5).map((nom, idx) => {
                  const award = awards.find(a => a.id === nom.category);
                  const secondPostUrl = getSecondPostUrl(nom);
                  const linkUrl = (nom.url && nom.url.trim()) || secondPostUrl || undefined;
                  const hasLink = Boolean(linkUrl);
                  const secondLine = getNominationSecondLine(nom);
                  return (
                    <div key={idx} className="nomination-card">
                      <div className="nomination-card-body">
                        <div className="nomination-card-content">
                          <h4
                            className={`nomination-title ${hasLink ? 'clickable' : ''}`}
                            onClick={() => hasLink && linkUrl && navigateTo(linkUrl)}
                          >
                            {truncateTitle(nom.title, 100)}
                          </h4>
                          {secondLine && (
                            <p className="nomination-second-line">{truncateTitle(secondLine, 80)}</p>
                          )}
                        </div>
                        <div className="nomination-thumbnail-slot">
                          {nom.thumbnail && nom.thumbnail.trim() ? (
                            <img
                              src={nom.thumbnail}
                              alt=""
                              className="nomination-thumbnail"
                              onClick={() => hasLink && linkUrl && navigateTo(linkUrl)}
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = 'block';
                              }}
                            />
                          ) : null}
                          {award ? (
                            <div
                              className="nomination-thumbnail nomination-thumbnail-award-icon"
                              style={{ display: nom.thumbnail && nom.thumbnail.trim() ? 'none' : 'block' }}
                              onClick={() => hasLink && linkUrl && navigateTo(linkUrl)}
                              role={hasLink ? 'button' : undefined}
                              tabIndex={hasLink ? 0 : undefined}
                              onKeyDown={hasLink && linkUrl ? (e) => e.key === 'Enter' && navigateTo(linkUrl) : undefined}
                            >
                              {award.iconPath ? (
                                <img src={award.iconPath} alt="" className="nomination-award-icon-img" onError={(e) => { e.currentTarget.style.display = 'none'; const s = e.currentTarget.nextElementSibling as HTMLElement; if (s) s.style.display = 'block'; }} />
                              ) : null}
                              <span className="nomination-award-icon-emoji" style={{ display: award.iconPath ? 'none' : 'block' }}>{award.emoji}</span>
                            </div>
                          ) : null}
                        </div>
                      </div>
                      <div className="nomination-card-actions">
                        {(secondPostUrl || nom.thingSlug) && (
                          <button
                            type="button"
                            className={`second-nominee-button ${nom.currentUserHasSeconded ? 'has-votes' : ''} ${getNominationSecondKey(nom) === justSecondedKey ? 'just-seconded' : ''}`}
                            onClick={() =>
                              nominateThisToo(
                                nom.category,
                                {
                                  ...(secondPostUrl ? { postUrl: secondPostUrl } : {}),
                                  ...(nom.thingSlug ? { thingSlug: nom.thingSlug } : {}),
                                },
                                selectedAward?.id
                              )
                            }
                          >
                            <img src={nom.currentUserHasSeconded ? '/images/icons/nominee/nominee-arrow-upvoted.png' : '/images/icons/nominee/nominee-arrow.png'} alt="" className="second-nominee-arrow" onError={(e) => { e.currentTarget.style.display = 'none'; const s = e.currentTarget.nextElementSibling; if (s) (s as HTMLElement).style.display = 'inline'; }} />
                            <span className="second-nominee-arrow-fallback" style={{ display: 'none' }} aria-hidden>↑</span>
                            <span className="second-nominee-text">{nom.currentUserHasSeconded ? 'Seconded!' : '+1'}</span>
                          </button>
                        )}
                        {hasLink && linkUrl && (
                          <button
                            type="button"
                            className="nominee-link-button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(linkUrl).then(
                                () => setToast({ message: 'Link copied', type: 'success' }),
                                () => {}
                              );
                            }}
                            aria-label="Copy link"
                          >
                            <img src="/images/icons/nominee/nominee-link-icon.png" alt="" className="nominee-link-icon" onError={(e) => { e.currentTarget.style.display = 'none'; const s = e.currentTarget.nextElementSibling; if (s) (s as HTMLElement).style.display = 'inline'; }} />
                            <span className="nominee-link-icon-fallback" style={{ display: 'none' }} aria-hidden>🔗</span>
                          </button>
                        )}
                        {isModerator && nom.memberKey && (
                          <button
                            type="button"
                            className="nominee-report-button"
                            onClick={(e) => { e.stopPropagation(); handleToggleFlag(nom); }}
                            aria-label={nom.flagged || reportedMemberKeys.has(nom.memberKey) ? 'Flagged (tap to unflag)' : 'Flag'}
                          >
                            <img src={nom.flagged || reportedMemberKeys.has(nom.memberKey) ? '/images/icons/nominee/nominee-reported.png' : '/images/icons/nominee/nominee-report.png'} alt="" className="nominee-report-icon" onError={(e) => { e.currentTarget.style.display = 'none'; const s = e.currentTarget.nextElementSibling; if (s) (s as HTMLElement).style.display = 'inline'; }} />
                            <span className="nominee-report-icon-fallback" style={{ display: 'none' }} aria-hidden>🚩</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {nominations.length > nomineesWindowStart + 5 && (
                <div className="nominees-load-more-wrap">
                  <button
                    type="button"
                    className="nominees-load-more-button"
                    onClick={() => setNomineesStartIndex((prev) => Math.min(prev + 5, nominations.length - 5))}
                  >
                    LOAD MORE
                  </button>
                </div>
              )}

              <div className="related-awards-section">
                <h3>Other Awards In This Category</h3>
                <div className="related-awards-grid">
                  {awards
                    .filter(a => a.category === selectedAward.category && a.id !== selectedAward.id)
                    .slice(0, 5)
                    .map((award) => (
                      <button
                        key={award.id}
                        className="related-award-button"
                        onClick={() => {
                          setSelectedAward(award);
                          setShowEntryForm(true);
                          setNomineesStartIndex(0);
                          setNominationTitle('');
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

              <footer className="nomination-cards-footer">
                <div className="nomination-footer-links">
                  <span>RULES</span>
                  <span className="footer-sep">|</span>
                  <span>HELP</span>
                  <span className="footer-sep">|</span>
                  <span>REPORT</span>
                </div>
                <div className="nomination-footer-copyright">©2026 Reddit, Inc.</div>
              </footer>
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
          <>
          <div className="nominations-grid">
            {nominations.map((nom, idx) => {
              const award = awards.find(a => a.id === nom.category);
              const secondPostUrl = getSecondPostUrl(nom);
              const linkUrl = (nom.url && nom.url.trim()) || secondPostUrl || undefined;
              const hasLink = Boolean(linkUrl);
              const secondLine = getNominationSecondLine(nom);
              return (
                <div key={idx} className="nomination-card">
                  <div className="nomination-card-body">
                    <div className="nomination-card-content">
                      <h4
                        className={`nomination-title ${hasLink ? 'clickable' : ''}`}
                        onClick={() => hasLink && linkUrl && navigateTo(linkUrl)}
                      >
                        {truncateTitle(nom.title, 100)}
                      </h4>
                      {secondLine && (
                        <p className="nomination-second-line">{truncateTitle(secondLine, 80)}</p>
                      )}
                    </div>
                    <div className="nomination-thumbnail-slot">
                      {nom.thumbnail && nom.thumbnail.trim() ? (
                        <img
                          src={nom.thumbnail}
                          alt=""
                          className="nomination-thumbnail"
                          onClick={() => hasLink && linkUrl && navigateTo(linkUrl)}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'block';
                          }}
                        />
                      ) : null}
                      {award ? (
                        <div
                          className="nomination-thumbnail nomination-thumbnail-award-icon"
                          style={{ display: nom.thumbnail && nom.thumbnail.trim() ? 'none' : 'block' }}
                          onClick={() => hasLink && linkUrl && navigateTo(linkUrl)}
                          role={hasLink ? 'button' : undefined}
                          tabIndex={hasLink ? 0 : undefined}
                          onKeyDown={hasLink && linkUrl ? (e) => e.key === 'Enter' && navigateTo(linkUrl) : undefined}
                        >
                          {award.iconPath ? (
                            <img src={award.iconPath} alt="" className="nomination-award-icon-img" onError={(e) => { e.currentTarget.style.display = 'none'; const s = e.currentTarget.nextElementSibling as HTMLElement; if (s) s.style.display = 'block'; }} />
                          ) : null}
                          <span className="nomination-award-icon-emoji" style={{ display: award.iconPath ? 'none' : 'block' }}>{award.emoji}</span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div className="nomination-card-actions">
                    {(secondPostUrl || nom.thingSlug) && (
                      <button
                        type="button"
                        className={`second-nominee-button ${nom.currentUserHasSeconded ? 'has-votes' : ''} ${getNominationSecondKey(nom) === justSecondedKey ? 'just-seconded' : ''}`}
                        onClick={() =>
                          nominateThisToo(
                            nom.category,
                            {
                              ...(secondPostUrl ? { postUrl: secondPostUrl } : {}),
                              ...(nom.thingSlug ? { thingSlug: nom.thingSlug } : {}),
                            }
                          )
                        }
                      >
                        <img src={nom.currentUserHasSeconded ? '/images/icons/nominee/nominee-arrow-upvoted.png' : '/images/icons/nominee/nominee-arrow.png'} alt="" className="second-nominee-arrow" onError={(e) => { e.currentTarget.style.display = 'none'; const s = e.currentTarget.nextElementSibling; if (s) (s as HTMLElement).style.display = 'inline'; }} />
                        <span className="second-nominee-arrow-fallback" style={{ display: 'none' }} aria-hidden>↑</span>
                        <span className="second-nominee-text">{nom.currentUserHasSeconded ? 'Seconded!' : '+1'}</span>
                      </button>
                    )}
                    {hasLink && linkUrl && (
                      <button
                        type="button"
                        className="nominee-link-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(linkUrl).then(
                            () => setToast({ message: 'Link copied', type: 'success' }),
                            () => {}
                          );
                        }}
                        aria-label="Copy link"
                      >
                        <img src="/images/icons/nominee/nominee-link-icon.png" alt="" className="nominee-link-icon" onError={(e) => { e.currentTarget.style.display = 'none'; const s = e.currentTarget.nextElementSibling; if (s) (s as HTMLElement).style.display = 'inline'; }} />
                        <span className="nominee-link-icon-fallback" style={{ display: 'none' }} aria-hidden>🔗</span>
                      </button>
                    )}
                    {isModerator && nom.memberKey && (
                      <button
                        type="button"
                        className="nominee-report-button"
                        onClick={(e) => { e.stopPropagation(); handleToggleFlag(nom); }}
                        aria-label={nom.flagged || reportedMemberKeys.has(nom.memberKey) ? 'Flagged (tap to unflag)' : 'Flag'}
                      >
                        <img src={nom.flagged || reportedMemberKeys.has(nom.memberKey) ? '/images/icons/nominee/nominee-reported.png' : '/images/icons/nominee/nominee-report.png'} alt="" className="nominee-report-icon" onError={(e) => { e.currentTarget.style.display = 'none'; const s = e.currentTarget.nextElementSibling; if (s) (s as HTMLElement).style.display = 'inline'; }} />
                        <span className="nominee-report-icon-fallback" style={{ display: 'none' }} aria-hidden>🚩</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <footer className="nomination-cards-footer">
            <div className="nomination-footer-links">
              <span>RULES</span>
              <span className="footer-sep">|</span>
              <span>HELP</span>
              <span className="footer-sep">|</span>
              <span>REPORT</span>
            </div>
            <div className="nomination-footer-copyright">©2026 Reddit, Inc.</div>
          </footer>
          </>
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
        <div className={`toast toast-${toast.type} ${toastLeaving ? 'toast-leave' : ''}`}>
          {toast.message}
        </div>
      )}

      {view === 'category-select' && renderCategorySelect()}
      {view === 'submit' && renderSubmitForm()}
      {view === 'list' && renderNominationsList()}

      {/* Admin Panel Trigger Button (moderators only) */}
      {isModerator && (
        <button
          type="button"
          className="admin-trigger-button"
          onClick={() => {
            setShowAdminPanel(true);
          }}
          title="Admin Panel (or type 'admin' anywhere)"
        >
          <img
            src="/images/icons/admin/mod.png"
            alt="Admin"
            className="admin-icon"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const fallback = e.currentTarget.nextElementSibling;
              if (fallback) (fallback as HTMLElement).style.display = 'block';
            }}
          />
          <span className="admin-trigger-emoji-fallback" style={{ display: 'none', fontSize: '1.5rem' }} aria-hidden>⚙️</span>
        </button>
      )}

      {/* Admin Panel Modal (moderators only) */}
      {isModerator && showAdminPanel && <AdminPanel onClose={() => setShowAdminPanel(false)} />}
    </div>
  );
};
