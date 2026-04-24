import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  TextInput,
  Platform,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { MaterialIcons } from '@expo/vector-icons';
import api, { Story, getPendingStories, approveStory, rejectStory } from '../../utils/api';
import { formatDistanceToNow } from 'date-fns';

interface Report {
  id: string;
  reporter_id: string;
  reporter_name: string;
  report_type: string;
  item_id?: string;
  item_title?: string;
  reason: string;
  description: string;
  status: string;
  created_at: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  display_name: string;
  is_admin: boolean;
  is_approved: boolean;
  is_suspended?: boolean;
  suspension_reason?: string;
  created_at: string;
}

interface ArchivedMessage {
  id: string;
  connection_id: string;
  content: string;
  sender_id: string;
  sender_name: string;
  created_at: string;
  archived_at: string;
  retention_until: string;
  deleted_user_id: string;
  deleted_user_email: string;
}

export default function AdminScreen() {
  const [activeTab, setActiveTab] = useState<'reports' | 'users' | 'stories' | 'archive'>('reports');
  const [reports, setReports] = useState<Report[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [pendingStories, setPendingStories] = useState<Story[]>([]);
  const [archivedMessages, setArchivedMessages] = useState<ArchivedMessage[]>([]);
  const [archiveTotal, setArchiveTotal] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'reviewed' | 'resolved'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (activeTab === 'reports') {
      loadReports();
    } else if (activeTab === 'users') {
      loadUsers();
    } else if (activeTab === 'archive') {
      loadArchivedMessages();
    } else {
      loadPendingStories();
    }
  }, [activeTab]);

  const loadReports = async () => {
    try {
      const response = await api.get('/reports/all');
      setReports(response.data);
    } catch (error) {
      console.error('Error loading reports:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (activeTab === 'reports') {
      await loadReports();
    } else if (activeTab === 'users') {
      await loadUsers();
    } else if (activeTab === 'archive') {
      await loadArchivedMessages();
    } else {
      await loadPendingStories();
    }
    setRefreshing(false);
  };

  const loadPendingStories = async () => {
    try {
      const stories = await getPendingStories();
      setPendingStories(stories);
    } catch (error) {
      console.error('Error loading pending stories:', error);
    }
  };

  const loadArchivedMessages = async () => {
    try {
      const response = await api.get('/admin/archived-messages');
      setArchivedMessages(response.data.messages || []);
      setArchiveTotal(response.data.total || 0);
    } catch (error) {
      console.error('Error loading archived messages:', error);
    }
  };

  const handleApproveStory = async (story: Story) => {
    try {
      console.log('Approving story:', story.id);
      await approveStory(story.id);
      console.log('Story approved successfully');
      Alert.alert('Approved!', 'The story is now visible on the Gratitude Wall.');
      loadPendingStories();
    } catch (error: any) {
      console.error('Error approving story:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to approve story');
    }
  };

  const handleRejectStory = async (story: Story) => {
    try {
      console.log('Rejecting story:', story.id);
      await rejectStory(story.id);
      console.log('Story rejected successfully');
      Alert.alert('Rejected', 'The story has been rejected.');
      loadPendingStories();
    } catch (error: any) {
      console.error('Error rejecting story:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to reject story');
    }
  };

  const updateReportStatus = async (reportId: string, status: string) => {
    try {
      await api.patch(`/reports/${reportId}/status?status=${status}`);
      await loadReports();
    } catch (error) {
      console.error('Error updating report:', error);
    }
  };

  const toggleAdmin = async (user: User) => {
    const action = user.is_admin ? 'remove-admin' : 'make-admin';
    const actionText = user.is_admin ? 'remove admin access from' : 'grant admin access to';
    
    Alert.alert(
      user.is_admin ? 'Remove Admin' : 'Make Admin',
      `Are you sure you want to ${actionText} ${user.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: user.is_admin ? 'destructive' : 'default',
          onPress: async () => {
            setLoading(true);
            try {
              await api.post(`/admin/${action}/${user.id}`);
              await loadUsers();
              Alert.alert('Success', `${user.name} ${user.is_admin ? 'is no longer an admin' : 'is now an admin'}`);
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.detail || 'Failed to update admin status');
            }
            setLoading(false);
          },
        },
      ]
    );
  };

  const handleSuspendUser = (user: User) => {
    if (user.is_suspended) {
      // Unsuspend
      const doUnsuspend = async () => {
        try {
          await api.post(`/admin/unsuspend/${user.id}`);
          if (Platform.OS === 'web') {
            alert(`${user.name} has been unsuspended`);
          } else {
            Alert.alert('Success', `${user.name} has been unsuspended`);
          }
          loadUsers();
        } catch (error: any) {
          const msg = error.response?.data?.detail || 'Failed to unsuspend user';
          if (Platform.OS === 'web') {
            alert(msg);
          } else {
            Alert.alert('Error', msg);
          }
        }
      };
      
      if (Platform.OS === 'web') {
        if (window.confirm(`Are you sure you want to unsuspend ${user.name}?`)) {
          doUnsuspend();
        }
      } else {
        Alert.alert(
          'Unsuspend User',
          `Are you sure you want to unsuspend ${user.name}?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Unsuspend', onPress: doUnsuspend },
          ]
        );
      }
    } else {
      // Suspend
      const doSuspend = async () => {
        try {
          await api.post(`/admin/suspend/${user.id}`);
          if (Platform.OS === 'web') {
            alert(`${user.name} has been suspended`);
          } else {
            Alert.alert('Success', `${user.name} has been suspended`);
          }
          loadUsers();
        } catch (error: any) {
          const msg = error.response?.data?.detail || 'Failed to suspend user';
          if (Platform.OS === 'web') {
            alert(msg);
          } else {
            Alert.alert('Error', msg);
          }
        }
      };
      
      if (Platform.OS === 'web') {
        if (window.confirm(`Are you sure you want to suspend ${user.name}? They will not be able to log in.`)) {
          doSuspend();
        }
      } else {
        Alert.alert(
          'Suspend User',
          `Are you sure you want to suspend ${user.name}? They will not be able to log in.`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Suspend', style: 'destructive', onPress: doSuspend },
          ]
        );
      }
    }
  };

  const handleDeleteUser = (user: User) => {
    const doDelete = async () => {
      try {
        await api.delete(`/admin/delete-user/${user.id}`);
        if (Platform.OS === 'web') {
          alert(`${user.name} has been permanently deleted`);
        } else {
          Alert.alert('Deleted', `${user.name} has been permanently deleted`);
        }
        loadUsers();
      } catch (error: any) {
        const msg = error.response?.data?.detail || 'Failed to delete user';
        if (Platform.OS === 'web') {
          alert(msg);
        } else {
          Alert.alert('Error', msg);
        }
      }
    };
    
    if (Platform.OS === 'web') {
      if (window.confirm(`Are you sure you want to PERMANENTLY DELETE ${user.name} and all their data? This cannot be undone!`)) {
        doDelete();
      }
    } else {
      Alert.alert(
        'Delete User Permanently',
        `Are you sure you want to PERMANENTLY DELETE ${user.name} and all their data? This cannot be undone!`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete Forever', style: 'destructive', onPress: doDelete },
        ]
      );
    }
  };

  const filteredReports = reports.filter((r) => filter === 'all' || r.status === filter);

  const getReasonIcon = (reason: string) => {
    switch (reason) {
      case 'inappropriate': return 'warning';
      case 'spam': return 'block';
      case 'abuse': return 'report';
      case 'scam': return 'gavel';
      default: return 'more-horiz';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return Colors.warning;
      case 'reviewed': return Colors.primary;
      case 'resolved': return Colors.success;
      default: return Colors.textSecondary;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="admin-panel-settings" size={28} color={Colors.primary} />
        <Text style={styles.headerTitle}>Admin</Text>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'reports' && styles.tabActive]}
          onPress={() => setActiveTab('reports')}
        >
          <MaterialIcons name="report" size={20} color={activeTab === 'reports' ? Colors.primary : Colors.textSecondary} />
          <Text style={[styles.tabText, activeTab === 'reports' && styles.tabTextActive]}>Reports</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'users' && styles.tabActive]}
          onPress={() => setActiveTab('users')}
        >
          <MaterialIcons name="people" size={20} color={activeTab === 'users' ? Colors.primary : Colors.textSecondary} />
          <Text style={[styles.tabText, activeTab === 'users' && styles.tabTextActive]}>Users</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'stories' && styles.tabActive]}
          onPress={() => setActiveTab('stories')}
        >
          <MaterialIcons name="auto-stories" size={20} color={activeTab === 'stories' ? Colors.primary : Colors.textSecondary} />
          <Text style={[styles.tabText, activeTab === 'stories' && styles.tabTextActive]}>Stories</Text>
          {pendingStories.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{pendingStories.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'archive' && styles.tabActive]}
          onPress={() => setActiveTab('archive')}
        >
          <MaterialIcons name="archive" size={20} color={activeTab === 'archive' ? Colors.primary : Colors.textSecondary} />
          <Text style={[styles.tabText, activeTab === 'archive' && styles.tabTextActive]}>Archive</Text>
          {archiveTotal > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{archiveTotal}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {activeTab === 'reports' ? (
        <>
          {/* Report Filters */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            <View style={styles.filterContainer}>
              {['all', 'pending', 'reviewed', 'resolved'].map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[styles.filterButton, filter === f && styles.filterButtonActive]}
                  onPress={() => setFilter(f as any)}
                >
                  <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <ScrollView
            style={styles.scrollView}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            {filteredReports.length > 0 ? (
              filteredReports.map((report) => (
                <View key={report.id} style={styles.reportCard}>
                  <View style={styles.reportHeader}>
                    <MaterialIcons name={getReasonIcon(report.reason) as any} size={24} color={Colors.error} />
                    <View style={styles.reportHeaderText}>
                      <Text style={styles.reportReason}>{report.reason.toUpperCase()}</Text>
                      <Text style={styles.reportType}>{report.report_type}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(report.status) + '20' }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(report.status) }]}>
                        {report.status}
                      </Text>
                    </View>
                  </View>

                  {report.item_title && (
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemLabel}>Reported Item:</Text>
                      <Text style={styles.itemTitle}>{report.item_title}</Text>
                    </View>
                  )}

                  <Text style={styles.description}>{report.description}</Text>

                  <View style={styles.reportFooter}>
                    <Text style={styles.reporter}>Reported by: {report.reporter_name}</Text>
                    <Text style={styles.timestamp}>
                      {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                    </Text>
                  </View>

                  {report.status === 'pending' && (
                    <View style={styles.actions}>
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: Colors.primary }]}
                        onPress={() => updateReportStatus(report.id, 'reviewed')}
                      >
                        <Text style={styles.actionButtonText}>Reviewed</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: Colors.success }]}
                        onPress={() => updateReportStatus(report.id, 'resolved')}
                      >
                        <Text style={styles.actionButtonText}>Resolve</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <MaterialIcons name="check-circle" size={64} color={Colors.success} />
                <Text style={styles.emptyText}>No {filter !== 'all' ? filter : ''} reports</Text>
                <Text style={styles.emptySubtext}>The community is safe and healthy!</Text>
              </View>
            )}
            <View style={{ height: 40 }} />
          </ScrollView>
        </>
      ) : activeTab === 'users' ? (
        <ScrollView
          style={styles.scrollView}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {loading && <ActivityIndicator size="large" color={Colors.primary} style={{ marginVertical: 20 }} />}
          
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <MaterialIcons name="search" size={20} color={Colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or email..."
              placeholderTextColor={Colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <MaterialIcons name="close" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
          
          <Text style={styles.sectionLabel}>
            {searchQuery ? `Results (${users.filter(u => 
              u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              u.email.toLowerCase().includes(searchQuery.toLowerCase())
            ).length})` : `All Users (${users.length})`}
          </Text>
          
          {users
            .filter(u => 
              searchQuery === '' ||
              u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              u.email.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map((user) => (
            <View key={user.id} style={styles.userCard}>
              <View style={styles.userInfo}>
                <View style={styles.userAvatar}>
                  <MaterialIcons 
                    name={user.is_admin ? "admin-panel-settings" : "person"} 
                    size={24} 
                    color={user.is_admin ? Colors.primary : Colors.textSecondary} 
                  />
                </View>
                <View style={styles.userDetails}>
                  <View style={styles.userNameRow}>
                    <Text style={styles.userName}>{user.name}</Text>
                    {user.is_admin && (
                      <View style={styles.adminBadge}>
                        <Text style={styles.adminBadgeText}>Admin</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.userEmail}>{user.email}</Text>
                  {user.is_suspended && (
                    <View style={styles.suspendedBadge}>
                      <MaterialIcons name="block" size={12} color={Colors.error} />
                      <Text style={styles.suspendedText}>Suspended</Text>
                    </View>
                  )}
                  <Text style={styles.userDate}>
                    Joined {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                  </Text>
                </View>
              </View>
              
              <View style={styles.userActions}>
                <TouchableOpacity
                  style={[
                    styles.adminToggle,
                    user.is_admin ? styles.adminToggleRemove : styles.adminToggleAdd
                  ]}
                  onPress={() => toggleAdmin(user)}
                >
                  <MaterialIcons 
                    name={user.is_admin ? "remove-circle" : "add-circle"} 
                    size={18} 
                    color={Colors.surface} 
                  />
                  <Text style={styles.adminToggleText}>
                    {user.is_admin ? 'Remove Admin' : 'Make Admin'}
                  </Text>
                </TouchableOpacity>
                
                {!user.is_admin && (
                  <>
                    <TouchableOpacity
                      style={[
                        styles.actionBtn,
                        user.is_suspended ? styles.unsuspendBtn : styles.suspendBtn
                      ]}
                      onPress={() => handleSuspendUser(user)}
                    >
                      <MaterialIcons 
                        name={user.is_suspended ? "check-circle" : "pause-circle"} 
                        size={16} 
                        color={Colors.surface} 
                      />
                      <Text style={styles.actionBtnText}>
                        {user.is_suspended ? 'Unsuspend' : 'Suspend'}
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDeleteUser(user)}
                    >
                      <MaterialIcons name="delete-forever" size={16} color={Colors.surface} />
                      <Text style={styles.actionBtnText}>Delete</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      ) : activeTab === 'stories' ? (
        /* Stories Tab */
        <ScrollView
          style={styles.scrollView}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <Text style={styles.sectionLabel}>
            Pending Stories ({pendingStories.length})
          </Text>
          
          {pendingStories.length > 0 ? (
            pendingStories.map((story) => (
              <View key={story.id} style={styles.storyCard}>
                <Text style={styles.storyTitle}>{story.title}</Text>
                <Text style={styles.storyContent} numberOfLines={6}>{story.content}</Text>
                <View style={styles.storyMeta}>
                  <Text style={styles.storyAuthor}>By: {story.user_name}</Text>
                  <Text style={styles.storyDate}>
                    {formatDistanceToNow(new Date(story.created_at), { addSuffix: true })}
                  </Text>
                </View>
                <View style={styles.storyActions}>
                  <TouchableOpacity
                    style={[styles.storyActionBtn, styles.approveBtn]}
                    onPress={() => handleApproveStory(story)}
                  >
                    <MaterialIcons name="check-circle" size={18} color="#fff" />
                    <Text style={styles.storyActionText}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.storyActionBtn, styles.rejectBtn]}
                    onPress={() => handleRejectStory(story)}
                  >
                    <MaterialIcons name="cancel" size={18} color="#fff" />
                    <Text style={styles.storyActionText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="auto-stories" size={64} color={Colors.textSecondary} />
              <Text style={styles.emptyText}>No pending stories</Text>
              <Text style={styles.emptySubtext}>All stories have been reviewed!</Text>
            </View>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      ) : activeTab === 'archive' ? (
        /* Archive Tab */
        <ScrollView
          style={styles.scrollView}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View style={styles.archiveHeader}>
            <MaterialIcons name="shield" size={24} color={Colors.warning} />
            <Text style={styles.archiveHeaderText}>
              Messages from reported conversations are retained for 90 days for safety investigations.
            </Text>
          </View>
          
          <Text style={styles.sectionLabel}>
            Archived Messages ({archiveTotal})
          </Text>
          
          {archivedMessages.length > 0 ? (
            archivedMessages.map((msg, index) => (
              <View key={msg.id || index} style={styles.archiveCard}>
                <View style={styles.archiveCardHeader}>
                  <View style={styles.archiveSender}>
                    <MaterialIcons name="person" size={16} color={Colors.primary} />
                    <Text style={styles.archiveSenderName}>{msg.sender_name}</Text>
                  </View>
                  <Text style={styles.archiveDate}>
                    {msg.created_at ? formatDistanceToNow(new Date(msg.created_at), { addSuffix: true }) : 'Unknown date'}
                  </Text>
                </View>
                
                <Text style={styles.archiveContent}>{msg.content}</Text>
                
                <View style={styles.archiveMeta}>
                  <View style={styles.archiveMetaItem}>
                    <MaterialIcons name="delete" size={14} color={Colors.error} />
                    <Text style={styles.archiveMetaText}>
                      Deleted by: {msg.deleted_user_email || 'Unknown'}
                    </Text>
                  </View>
                  <View style={styles.archiveMetaItem}>
                    <MaterialIcons name="schedule" size={14} color={Colors.textSecondary} />
                    <Text style={styles.archiveMetaText}>
                      Expires: {msg.retention_until ? new Date(msg.retention_until).toLocaleDateString() : 'Unknown'}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="archive" size={64} color={Colors.textSecondary} />
              <Text style={styles.emptyText}>No archived messages</Text>
              <Text style={styles.emptySubtext}>
                Messages are only archived when a user with reported conversations deletes their account.
              </Text>
            </View>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 10,
    gap: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  tabActive: {
    backgroundColor: Colors.primary + '15',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.primary,
  },
  filterScroll: {
    maxHeight: 50,
    marginBottom: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.text,
  },
  filterTextActive: {
    color: Colors.surface,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 12,
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    marginLeft: 10,
    paddingVertical: 4,
  },
  reportCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.error,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  reportHeaderText: {
    flex: 1,
    marginLeft: 10,
  },
  reportReason: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.error,
  },
  reportType: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  itemInfo: {
    backgroundColor: Colors.background,
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  itemLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  description: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 10,
  },
  reportFooter: {
    marginBottom: 10,
  },
  reporter: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  timestamp: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: Colors.surface,
    fontSize: 13,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  userCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  adminBadge: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  adminBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
  },
  userEmail: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  userDate: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  adminToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  adminToggleAdd: {
    backgroundColor: Colors.primary,
  },
  adminToggleRemove: {
    backgroundColor: Colors.error,
  },
  adminToggleText: {
    color: Colors.surface,
    fontSize: 12,
    fontWeight: '600',
  },
  userActions: {
    gap: 8,
    marginTop: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  suspendBtn: {
    backgroundColor: Colors.warning,
  },
  unsuspendBtn: {
    backgroundColor: Colors.success,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
    backgroundColor: Colors.error,
  },
  actionBtnText: {
    color: Colors.surface,
    fontSize: 12,
    fontWeight: '600',
  },
  suspendedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.error + '20',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  suspendedText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.error,
  },
  badge: {
    backgroundColor: Colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  storyCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  storyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  storyContent: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 21,
    marginBottom: 12,
  },
  storyMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  storyAuthor: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
  },
  storyDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  storyActions: {
    flexDirection: 'row',
    gap: 12,
  },
  storyActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  approveBtn: {
    backgroundColor: Colors.success,
  },
  rejectBtn: {
    backgroundColor: Colors.error,
  },
  storyActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  // Archive tab styles
  archiveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warning + '15',
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 10,
    gap: 10,
  },
  archiveHeaderText: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
  },
  archiveCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: Colors.warning,
  },
  archiveCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  archiveSender: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  archiveSenderName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  archiveDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  archiveContent: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 12,
    padding: 10,
    backgroundColor: Colors.background,
    borderRadius: 8,
  },
  archiveMeta: {
    gap: 6,
  },
  archiveMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  archiveMetaText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});
