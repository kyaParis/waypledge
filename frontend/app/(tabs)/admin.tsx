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
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { MaterialIcons } from '@expo/vector-icons';
import api from '../../utils/api';
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
  created_at: string;
}

export default function AdminScreen() {
  const [activeTab, setActiveTab] = useState<'reports' | 'users'>('reports');
  const [reports, setReports] = useState<Report[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'reviewed' | 'resolved'>('all');

  useEffect(() => {
    if (activeTab === 'reports') {
      loadReports();
    } else {
      loadUsers();
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
    } else {
      await loadUsers();
    }
    setRefreshing(false);
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
      ) : (
        <ScrollView
          style={styles.scrollView}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {loading && <ActivityIndicator size="large" color={Colors.primary} style={{ marginVertical: 20 }} />}
          
          <Text style={styles.sectionLabel}>All Users ({users.length})</Text>
          
          {users.map((user) => (
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
                  <Text style={styles.userDate}>
                    Joined {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                  </Text>
                </View>
              </View>
              
              <TouchableOpacity
                style={[
                  styles.adminToggle,
                  user.is_admin ? styles.adminToggleRemove : styles.adminToggleAdd
                ]}
                onPress={() => toggleAdmin(user)}
              >
                <MaterialIcons 
                  name={user.is_admin ? "remove-circle" : "add-circle"} 
                  size={20} 
                  color={Colors.surface} 
                />
                <Text style={styles.adminToggleText}>
                  {user.is_admin ? 'Remove' : 'Make Admin'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
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
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  adminToggleAdd: {
    backgroundColor: Colors.primary,
  },
  adminToggleRemove: {
    backgroundColor: Colors.error,
  },
  adminToggleText: {
    color: Colors.surface,
    fontSize: 14,
    fontWeight: '600',
  },
});
