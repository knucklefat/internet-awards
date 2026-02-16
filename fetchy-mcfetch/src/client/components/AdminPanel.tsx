import { useEffect, useState, useMemo } from 'react';
import type { EventStats } from '../../shared/types/event';

type Props = {
  onClose: () => void;
};

type AdminView = 'nominations' | 'categories' | 'awards' | 'nominators';
type NominationSort = 'newest' | 'most_seconded' | 'flagged';
type NominatorSort = 'active' | 'shadow_banned';

type NominatorRow = { username: string; count: number; shadowBanned: boolean };

export const AdminPanel = ({ onClose }: Props) => {
  const [stats, setStats] = useState<EventStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [eventConfig, setEventConfig] = useState<{ categories: any[]; awards: any[] } | null>(null);
  const [nominations, setNominations] = useState<any[]>([]);
  const [nominators, setNominators] = useState<NominatorRow[]>([]);
  const [activeView, setActiveView] = useState<AdminView>('nominations');
  const [sortNominations, setSortNominations] = useState<NominationSort>('newest');
  const [sortNominators, setSortNominators] = useState<NominatorSort>('active');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedAwardId, setSelectedAwardId] = useState<string | null>(null);
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<string[]>([]);
  const [exporting, setExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState('');
  const [hideUnhideLoading, setHideUnhideLoading] = useState<string | null>(null);
  const [banUnbanLoading, setBanUnbanLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
    fetchEventConfig();
  }, []);

  useEffect(() => {
    if (activeView === 'nominations' || activeView === 'categories' || activeView === 'awards') {
      fetchNominations(true);
    }
  }, [activeView]);

  useEffect(() => {
    if (activeView === 'nominators') {
      fetchNominators(sortNominators);
    }
  }, [activeView, sortNominators]);

  useEffect(() => {
    if (activeView === 'categories' && eventConfig?.categories?.length) {
      setSelectedCategoryId((prev) => (prev !== null && prev !== '' ? prev : null));
    }
  }, [activeView, eventConfig?.categories]);

  useEffect(() => {
    if (activeView === 'awards' && eventConfig?.awards?.length) {
      setSelectedAwardId((prev) => prev || (eventConfig.awards[0]?.id ?? null));
    }
  }, [activeView, eventConfig?.awards]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/stats/event');
      const result = await res.json();
      if (result.success) setStats(result.data);
    } catch (e) {
      console.error('Error fetching stats:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchEventConfig = async () => {
    try {
      const res = await fetch('/api/event/config');
      const result = await res.json();
      if (result.success) setEventConfig(result.data);
    } catch (e) {
      console.error('Error fetching event config:', e);
    }
  };

  const fetchNominations = async (includeHidden: boolean) => {
    try {
      const url = includeHidden ? '/api/nominations?includeHidden=1' : '/api/nominations';
      const res = await fetch(url);
      const result = await res.json();
      if (result.success) setNominations(result.data || []);
    } catch (e) {
      console.error('Error fetching nominations:', e);
    }
  };

  const fetchNominators = async (sort: NominatorSort) => {
    try {
      const res = await fetch(`/api/admin/nominators?sort=${sort}`);
      const result = await res.json();
      if (result.success) setNominators(result.data || []);
    } catch (e) {
      console.error('Error fetching nominators:', e);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    setExportMessage('');
    try {
      const res = await fetch('/api/export-csv', { credentials: 'include', headers: { Accept: 'text/csv' } });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setExportMessage(`❌ ${err.error || res.status}`);
        return;
      }
      const blob = await res.blob();
      if (blob.size === 0) {
        setExportMessage('⚠️ No nominations to export');
        return;
      }
      const text = await blob.text();
      await navigator.clipboard.writeText(text);
      setExportMessage('✅ CSV copied to clipboard');
      setTimeout(() => setExportMessage(''), 5000);
    } catch (e) {
      setExportMessage(`❌ ${e instanceof Error ? e.message : 'Export failed'}`);
    } finally {
      setExporting(false);
    }
  };

  const handleHide = async (memberKey: string) => {
    if (!memberKey || hideUnhideLoading) return;
    setHideUnhideLoading(memberKey);
    try {
      const res = await fetch('/api/admin/hide-nomination', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberKey }),
      });
      const result = await res.json();
      if (result.success) setNominations((prev) => prev.map((n) => (n.memberKey === memberKey ? { ...n, hidden: true } : n)));
      else alert(result.error || 'Failed to hide');
    } catch (e) {
      alert('Failed to hide');
    } finally {
      setHideUnhideLoading(null);
    }
  };

  const handleUnhide = async (memberKey: string) => {
    if (!memberKey || hideUnhideLoading) return;
    setHideUnhideLoading(memberKey);
    try {
      const res = await fetch('/api/admin/unhide-nomination', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberKey }),
      });
      const result = await res.json();
      if (result.success) setNominations((prev) => prev.map((n) => (n.memberKey === memberKey ? { ...n, hidden: false } : n)));
      else alert(result.error || 'Failed to unhide');
    } catch (e) {
      alert('Failed to unhide');
    } finally {
      setHideUnhideLoading(null);
    }
  };

  const handleShadowBan = async (username: string) => {
    if (!username || banUnbanLoading) return;
    setBanUnbanLoading(username);
    try {
      const res = await fetch('/api/admin/shadow-ban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      const result = await res.json();
      if (result.success) await fetchNominators(sortNominators);
      else alert(result.error || 'Failed to ban');
    } catch (e) {
      alert('Failed to ban');
    } finally {
      setBanUnbanLoading(null);
    }
  };

  const handleUnban = async (username: string) => {
    if (!username || banUnbanLoading) return;
    setBanUnbanLoading(username);
    try {
      const res = await fetch('/api/admin/unban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      const result = await res.json();
      if (result.success) await fetchNominators(sortNominators);
      else alert(result.error || 'Failed to unban');
    } catch (e) {
      alert('Failed to unban');
    } finally {
      setBanUnbanLoading(null);
    }
  };

  const goToAward = (awardId: string) => {
    setSelectedAwardId(awardId);
    setActiveView('awards');
  };

  const toggleCategoryExpanded = (groupId: string) => {
    setExpandedCategoryIds((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  };

  const awardsInCategory = (categoryId: string) => {
    if (!eventConfig?.awards) return [];
    return eventConfig.awards.filter((a: any) => a.category === categoryId);
  };

  const getSecondLine = (nom: any) => {
    const hasLink = Boolean(nom.url && nom.url.trim());
    if (!hasLink) return '';
    const postTitle = (nom.postTitle || '').trim();
    if (!postTitle) return '';
    if ((nom.title || '').trim() === postTitle) return '';
    return postTitle;
  };

  const sortedNominations = useMemo(() => {
    let list = [...nominations];
    if (sortNominations === 'flagged') {
      list = list.filter((n: any) => n.flagged);
    }
    if (sortNominations === 'most_seconded' || sortNominations === 'flagged') {
      list.sort((a, b) => parseInt(b.voteCount || '0', 10) - parseInt(a.voteCount || '0', 10));
    }
    return list;
  }, [nominations, sortNominations]);

  const categoriesWithCounts = useMemo(() => {
    if (!eventConfig?.categories || !stats?.nominationsByCategory) return [];
    return eventConfig.categories.map((c: any) => ({
      ...c,
      count: stats.nominationsByCategory[c.id] ?? 0,
    }));
  }, [eventConfig?.categories, stats?.nominationsByCategory]);

  const awardsWithCounts = useMemo(() => {
    if (!eventConfig?.awards || !stats?.nominationsByAward) return [];
    return eventConfig.awards.map((a: any) => ({
      ...a,
      count: stats.nominationsByAward[a.id] ?? 0,
    }));
  }, [eventConfig?.awards, stats?.nominationsByAward]);

  const awardsInSelectedCategory = useMemo(() => {
    if (!selectedCategoryId || !eventConfig?.awards) return [];
    return eventConfig.awards.filter((a: any) => a.category === selectedCategoryId);
  }, [selectedCategoryId, eventConfig?.awards]);

  if (loading || !stats) {
    return (
      <div className="admin-panel-overlay" onClick={onClose}>
        <div className="admin-panel" onClick={(e) => e.stopPropagation()}>
          <div className="admin-header">
            <h2>Admin Panel</h2>
            <button type="button" className="close-button" onClick={onClose}>✕</button>
          </div>
          <div className="admin-content"><div className="admin-loading">Loading stats...</div></div>
        </div>
      </div>
    );
  }

  const categoryCount = eventConfig?.categories?.length ?? 0;
  const awardCount = eventConfig?.awards?.length ?? 0;

  return (
    <div className="admin-panel-overlay" onClick={onClose}>
      <div className="admin-panel" onClick={(e) => e.stopPropagation()}>
        <div className="admin-header">
          <h2>Admin Panel</h2>
          <button type="button" className="close-button" onClick={onClose}>✕</button>
        </div>

        {/* Sticky stat row: title + download, then view cards */}
        <div className="admin-stats-row-sticky">
          <div className="admin-stats-header-row">
            <h3 className="admin-stats-title">NOMINATION STATISTICS</h3>
            <button
              type="button"
              className="admin-download-icon-btn"
              onClick={handleExport}
              disabled={exporting}
              title="Export CSV to clipboard"
            >
              {exporting ? (
                <span className="admin-download-icon-text">…</span>
              ) : (
                <img src="/images/icons/download.png" alt="Export CSV" className="admin-download-icon-img" />
              )}
            </button>
          </div>
          <div className="admin-stats-cards-row">
            <div
              className={`admin-stat-card ${activeView === 'nominations' ? 'active' : ''}`}
              onClick={() => setActiveView('nominations')}
            >
              <span className="admin-stat-number">{stats.totalNominations}</span>
              <span className="admin-stat-label">NOMINEES</span>
            </div>
            <div
              className={`admin-stat-card ${activeView === 'categories' ? 'active' : ''}`}
              onClick={() => setActiveView('categories')}
            >
              <span className="admin-stat-number">{categoryCount}</span>
              <span className="admin-stat-label">CATEGORIES</span>
            </div>
            <div
              className={`admin-stat-card ${activeView === 'awards' ? 'active' : ''}`}
              onClick={() => setActiveView('awards')}
            >
              <span className="admin-stat-number">{awardCount}</span>
              <span className="admin-stat-label">AWARDS</span>
            </div>
            <div
              className={`admin-stat-card ${activeView === 'nominators' ? 'active' : ''}`}
              onClick={() => setActiveView('nominators')}
            >
              <span className="admin-stat-number">{stats.totalNominators}</span>
              <span className="admin-stat-label">SUBMITORS</span>
            </div>
          </div>
        </div>

        <div className="admin-content admin-content-scroll">
          {/* NOMINATIONS VIEW */}
          {activeView === 'nominations' && (
            <div className="admin-view-section">
              <div className="admin-view-toolbar">
                <span className="admin-view-title">NOMINEES ({nominations.length})</span>
                <div className="admin-toolbar-right">
                  <select
                    className="admin-sort-dropdown"
                    value={sortNominations}
                    onChange={(e) => setSortNominations(e.target.value as NominationSort)}
                    aria-label="Sort nominees"
                  >
                    <option value="most_seconded">SECONDED</option>
                    <option value="newest">Newest</option>
                    <option value="flagged">Flagged</option>
                  </select>
                </div>
              </div>
              {exportMessage && <div className="admin-export-msg">{exportMessage}</div>}
              <div className="admin-nominee-list">
                {sortedNominations.length === 0 ? (
                  <div className="admin-empty">No nominations yet.</div>
                ) : (
                  sortedNominations.map((nom, idx) => {
                    const category = eventConfig?.categories?.find((c: any) => c.id === nom.category);
                    const secondLine = getSecondLine(nom);
                    return (
                      <div key={nom.memberKey ?? `${nom.category}-${idx}`} className="admin-nominee-card">
                        <div className="admin-nominee-thumb">
                          {nom.thumbnail ? (
                            <img src={nom.thumbnail} alt="" />
                          ) : category?.iconPath ? (
                            <img src={category.iconPath} alt={category.name} />
                          ) : (
                            <span>{category?.emoji ?? '?'}</span>
                          )}
                        </div>
                        <div className="admin-nominee-body">
                          <div className="admin-nominee-title">{nom.title}</div>
                          {secondLine && <div className="admin-nominee-sub">{secondLine}</div>}
                          {nom.hidden && <div className="admin-nominee-sub admin-hidden-tag">Hidden from public</div>}
                          {nom.flagged && <div className="admin-nominee-sub admin-flagged-tag">Flagged</div>}
                        </div>
                        <div className="admin-nominee-action">
                          {nom.hidden ? (
                            <button type="button" className="admin-hide-btn unhide" onClick={() => handleUnhide(nom.memberKey)} disabled={hideUnhideLoading === nom.memberKey} title="Show">
                              <svg className="admin-hide-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            </button>
                          ) : (
                            <button type="button" className="admin-hide-btn hide" onClick={() => handleHide(nom.memberKey)} disabled={hideUnhideLoading === nom.memberKey} title="Hide">
                              <svg className="admin-hide-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* CATEGORIES VIEW */}
          {activeView === 'categories' && (
            <div className="admin-view-section">
              <div className="admin-view-toolbar">
                <div className="admin-toolbar-title-with-dropdown">
                  <span className="admin-view-title admin-view-title-inline">CATEGORY:</span>
                  <select
                    className="admin-dropdown admin-dropdown-inline"
                    value={selectedCategoryId ?? ''}
                    onChange={(e) => setSelectedCategoryId(e.target.value === '' ? '' : e.target.value || null)}
                  >
                    <option value="">ALL</option>
                    {categoriesWithCounts.map((c: any, i: number) => (
                      <option key={c.id} value={c.id}>{i + 1}. {c.name} ({c.count})</option>
                    ))}
                  </select>
                </div>
              </div>
              {(selectedCategoryId === '' || selectedCategoryId === null) ? (
                <div className="admin-categories-all-list">
                  {categoriesWithCounts.map((c: any) => {
                    const isExpanded = expandedCategoryIds.includes(c.id);
                    const categoryAwards = awardsInCategory(c.id);
                    return (
                      <div key={c.id} className="admin-category-row">
                        <button
                          type="button"
                          className="admin-category-header"
                          onClick={() => toggleCategoryExpanded(c.id)}
                          aria-expanded={isExpanded}
                        >
                          <span className="admin-category-name">{c.name}</span>
                          <span className="admin-category-count">({c.count})</span>
                          <span className={`admin-expand-icon ${isExpanded ? 'expanded' : ''}`} aria-hidden>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                          </span>
                        </button>
                        {isExpanded && (
                          <div className="admin-category-awards">
                            {categoryAwards.map((award: any) => (
                              <div key={award.id} className="admin-award-header">
                                <span className="admin-award-icon">
                                  {award.iconPath ? <img src={award.iconPath} alt="" /> : <span>{award.emoji}</span>}
                                </span>
                                <span className="admin-award-name">{award.name}</span>
                                <button type="button" className="admin-see-award-btn" onClick={() => goToAward(award.id)}>
                                  SEE AWARD
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : selectedCategoryId ? (
                <div className="admin-category-awards-only">
                  {awardsInSelectedCategory.map((award: any) => (
                    <div key={award.id} className="admin-category-award-block">
                      <div className="admin-award-header">
                        <span className="admin-award-icon">
                          {award.iconPath ? <img src={award.iconPath} alt="" /> : <span>{award.emoji}</span>}
                        </span>
                        <span className="admin-award-name">{award.name}</span>
                        <button type="button" className="admin-see-award-btn" onClick={() => goToAward(award.id)}>
                          SEE AWARD
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          )}

          {/* AWARDS VIEW */}
          {activeView === 'awards' && (
            <div className="admin-view-section">
              <div className="admin-view-toolbar">
                <div className="admin-toolbar-title-with-dropdown">
                  <span className="admin-view-title admin-view-title-inline">AWARD:</span>
                  <select
                    className="admin-dropdown admin-dropdown-inline"
                    value={selectedAwardId ?? ''}
                    onChange={(e) => setSelectedAwardId(e.target.value || null)}
                  >
                    {awardsWithCounts.map((a: any) => (
                      <option key={a.id} value={a.id}>{a.name} ({a.count})</option>
                    ))}
                  </select>
                </div>
                <div className="admin-toolbar-right">
                  <select
                    className="admin-sort-dropdown"
                    value={sortNominations}
                    onChange={(e) => setSortNominations(e.target.value as NominationSort)}
                    aria-label="Sort nominees"
                  >
                    <option value="most_seconded">SECONDED</option>
                    <option value="newest">Newest</option>
                    <option value="flagged">Flagged</option>
                  </select>
                </div>
              </div>
              {selectedAwardId && (() => {
                const award = eventConfig?.awards?.find((a: any) => a.id === selectedAwardId);
                const awardNoms = sortedNominations.filter((n: any) => n.category === selectedAwardId);
                return (
                  <div className="admin-nominee-list">
                    {awardNoms.length === 0 ? (
                      <div className="admin-empty">No nominees for this award.</div>
                    ) : (
                      awardNoms.map((nom: any, idx: number) => {
                        const secondLine = getSecondLine(nom);
                        return (
                          <div key={nom.memberKey ?? `${selectedAwardId}-${idx}`} className="admin-nominee-card">
                            <div className="admin-nominee-thumb">
                              {nom.thumbnail ? <img src={nom.thumbnail} alt="" /> : award?.iconPath ? <img src={award.iconPath} alt="" /> : <span>{award?.emoji}</span>}
                            </div>
                            <div className="admin-nominee-body">
                              <div className="admin-nominee-title">{nom.title}</div>
                              {secondLine && <div className="admin-nominee-sub">{secondLine}</div>}
                              {nom.hidden && <div className="admin-nominee-sub admin-hidden-tag">Hidden from public</div>}
                              {nom.flagged && <div className="admin-nominee-sub admin-flagged-tag">Flagged</div>}
                            </div>
                            <div className="admin-nominee-action">
                              {nom.hidden ? (
                                <button type="button" className="admin-hide-btn unhide" onClick={() => handleUnhide(nom.memberKey)} disabled={hideUnhideLoading === nom.memberKey} title="Show">
                                  <svg className="admin-hide-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                </button>
                              ) : (
                                <button type="button" className="admin-hide-btn hide" onClick={() => handleHide(nom.memberKey)} disabled={hideUnhideLoading === nom.memberKey} title="Hide">
                                  <svg className="admin-hide-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* NOMINATORS VIEW */}
          {activeView === 'nominators' && (
            <div className="admin-view-section">
              <div className="admin-view-toolbar">
                <span className="admin-view-title">NOMINATORS</span>
                <div className="admin-toolbar-right">
                  <select
                    className="admin-sort-dropdown"
                    value={sortNominators}
                    onChange={(e) => setSortNominators(e.target.value as NominatorSort)}
                    aria-label="Filter nominators"
                  >
                    <option value="active">Active</option>
                    <option value="shadow_banned">Banned</option>
                  </select>
                </div>
              </div>
              <div className="admin-nominators-list">
                {nominators.length === 0 ? (
                  <div className="admin-empty">No nominators in this list.</div>
                ) : (
                  nominators.map((row) => (
                    <div key={row.username} className="admin-nominator-row">
                      <span className="admin-nominator-name">u/{row.username} ({row.count})</span>
                      <div className="admin-nominee-action">
                        {row.shadowBanned ? (
                          <button type="button" className="admin-hide-btn unhide" onClick={() => handleUnban(row.username)} disabled={banUnbanLoading === row.username}>UNBAN</button>
                        ) : (
                          <button type="button" className="admin-hide-btn hide" onClick={() => handleShadowBan(row.username)} disabled={banUnbanLoading === row.username}>BAN</button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
