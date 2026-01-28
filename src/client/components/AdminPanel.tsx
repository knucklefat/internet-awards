import { useEffect, useState } from 'react';
import type { EventStats } from '../../shared/types/event';

type Props = {
  onClose: () => void;
};

type ExpandedSection = 'categories' | 'awards' | 'nominations' | null;

export const AdminPanel = ({ onClose }: Props) => {
  const [stats, setStats] = useState<EventStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [expandedSection, setExpandedSection] = useState<ExpandedSection>(null);
  const [eventConfig, setEventConfig] = useState<any>(null);
  const [nominations, setNominations] = useState<any[]>([]);

  useEffect(() => {
    fetchStats();
    fetchEventConfig();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/stats/event');
      const result = await response.json();
      
      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEventConfig = async () => {
    try {
      const response = await fetch('/api/event/config');
      const result = await response.json();
      if (result.success) {
        setEventConfig(result.data);
      }
    } catch (error) {
      console.error('Error fetching event config:', error);
    }
  };

  const fetchNominations = async () => {
    try {
      const response = await fetch('/api/nominations');
      const result = await response.json();
      if (result.success) {
        setNominations(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching nominations:', error);
    }
  };

  const handleTileClick = async (section: ExpandedSection) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
      if (section === 'nominations' && nominations.length === 0) {
        await fetchNominations();
      }
    }
  };

  const handleDeleteAll = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 5000);
      return;
    }

    try {
      setDeleting(true);
      const response = await fetch('/api/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmationKey: 'DELETE_INTERNET_AWARDS_2026'
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        alert(`Successfully deleted ${result.deletedCount} nominations`);
        await fetchStats();
        setConfirmDelete(false);
      } else {
        alert('Failed to delete nominations');
      }
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Error deleting nominations');
    } finally {
      setDeleting(false);
    }
  };

  const handleExportAll = async () => {
    console.log('Export button clicked');
    setExporting(true);
    
    try {
      console.log('Fetching /api/export-csv...');
      const response = await fetch('/api/export-csv');
      console.log('Response received:', response.status, response.statusText);
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          const text = await response.text();
          errorMessage = text || errorMessage;
        }
        console.error('Export failed:', errorMessage);
        alert(`Export failed: ${errorMessage}`);
        setExporting(false);
        return;
      }
      
      console.log('Converting to blob...');
      const blob = await response.blob();
      console.log('Blob size:', blob.size, 'bytes');
      
      if (blob.size === 0) {
        alert('Export returned empty file - there may be no nominations yet');
        setExporting(false);
        return;
      }
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `internet-awards-nominations-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      console.log('Download triggered successfully');
      alert('Export complete! Check your downloads folder.');
    } catch (error) {
      console.error('Export error:', error);
      alert(`Failed to export nominations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="admin-panel-overlay" onClick={onClose}>
      <div className="admin-panel" onClick={(e) => e.stopPropagation()}>
        <div className="admin-header">
          <h2>Admin Panel</h2>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>

        <div className="admin-content">
          {loading ? (
            <div className="admin-loading">Loading stats...</div>
          ) : stats ? (
            <>
              {/* Event Overview */}
              <div className="admin-section">
                <h3>📊 Event Statistics</h3>
                <div className="stats-grid">
                  <div 
                    className={`stat-card clickable ${expandedSection === 'nominations' ? 'expanded' : ''}`}
                    onClick={() => handleTileClick('nominations')}
                  >
                    <div className="stat-number">{stats.totalNominations}</div>
                    <div className="stat-label">Nominations</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">{stats.totalNominators}</div>
                    <div className="stat-label">Unique Nominators</div>
                  </div>
                  <div 
                    className={`stat-card clickable ${expandedSection === 'categories' ? 'expanded' : ''}`}
                    onClick={() => handleTileClick('categories')}
                  >
                    <div className="stat-number">{eventConfig?.categoryGroups?.length || 6}</div>
                    <div className="stat-label">Categories</div>
                  </div>
                  <div 
                    className={`stat-card clickable ${expandedSection === 'awards' ? 'expanded' : ''}`}
                    onClick={() => handleTileClick('awards')}
                  >
                    <div className="stat-number">{eventConfig?.categories?.length || 25}</div>
                    <div className="stat-label">Awards</div>
                  </div>
                </div>
              </div>

              {/* Expanded Lists */}
              {expandedSection === 'categories' && eventConfig?.categoryGroups && (
                <div className="admin-section expanded-list">
                  <h3>📂 All Categories</h3>
                  <div className="list-items">
                    {eventConfig.categoryGroups.map((group: any) => (
                      <div key={group.id} className="list-item">
                        <span className="item-emoji">{group.emoji}</span>
                        <span className="item-name">{group.name}</span>
                        <span className="item-detail">{group.tagline}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {expandedSection === 'awards' && eventConfig?.categories && (
                <div className="admin-section expanded-list">
                  <h3>🏆 All Awards</h3>
                  <div className="list-items">
                    {eventConfig.categories.map((award: any) => (
                      <div key={award.id} className="list-item">
                        <span className="item-emoji">{award.emoji}</span>
                        <span className="item-name">{award.name}</span>
                        <span className="item-detail">{award.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {expandedSection === 'nominations' && nominations.length > 0 && (
                <div className="admin-section expanded-list">
                  <h3>📝 All Nominations</h3>
                  <div className="list-items">
                    {nominations.map((nom: any, idx: number) => (
                      <div key={`${nom.category}-${nom.postId}-${idx}`} className="list-item">
                        <span className="item-name">{nom.title}</span>
                        <span className="item-detail">
                          {nom.category} • by u/{nom.author} • {nom.karma} karma
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Category Group Breakdown */}
              <div className="admin-section">
                <h3>📂 Nominations by Category Group</h3>
                <div className="group-stats">
                  {Object.entries(stats.nominationsByCategoryGroup || {}).map(([group, count]) => (
                    <div key={group} className="group-stat-row">
                      <span className="group-name">{group.replace('-', ' ')}</span>
                      <span className="group-count">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Posts */}
              {stats.topPosts && stats.topPosts.length > 0 && (
                <div className="admin-section">
                  <h3>🏆 Top Nominated Posts</h3>
                  <div className="top-posts-list">
                    {stats.topPosts.slice(0, 5).map((post, idx) => (
                      <div key={post.postId} className="top-post-item">
                        <span className="post-rank">#{idx + 1}</span>
                        <span className="post-title">{post.title}</span>
                        <span className="post-count">{post.nominationCount} nominations</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Export Section */}
              <div className="admin-section">
                <h3>📥 Export Data</h3>
                <button 
                  className="admin-action-button export-btn"
                  onClick={handleExportAll}
                  disabled={exporting}
                >
                  {exporting ? 'Exporting...' : 'Export All Nominations to CSV'}
                </button>
              </div>

              {/* Danger Zone */}
              <div className="admin-section danger-zone">
                <h3>⚠️ Danger Zone</h3>
                <p className="danger-warning">
                  This will permanently delete ALL nominations. This action cannot be undone.
                </p>
                <button 
                  className={`admin-action-button delete-btn ${confirmDelete ? 'confirm-active' : ''}`}
                  onClick={handleDeleteAll}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting...' : confirmDelete ? 'Click Again to Confirm Delete' : 'Delete All Nominations'}
                </button>
              </div>
            </>
          ) : (
            <div className="admin-error">Failed to load stats</div>
          )}
        </div>
      </div>
    </div>
  );
};
