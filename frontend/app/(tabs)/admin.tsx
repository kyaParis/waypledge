import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
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

export default function AdminScreen() {
  const [reports, setReports] = useState<Report[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'reviewed' | 'resolved'>('all');

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const response = await api.get('/reports/all');
      setReports(response.data);
    } catch (error) {
      console.error('Error loading reports:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReports();
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

  const filteredReports = reports.filter((r) => filter === 'all' || r.status === filter);

  const getReasonIcon = (reason: string) => {
    switch (reason) {
      case 'inappropriate':
        return 'warning';
      case 'spam':
        return 'block';
      case 'abuse':
        return 'report';
      case 'scam':
        return 'gavel';
      default:
        return 'more-horiz';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return Colors.warning;
      case 'reviewed':
        return Colors.primary;
      case 'resolved':
        return Colors.success;
      default:
        return Colors.textSecondary;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="admin-panel-settings" size={28} color={Colors.primary} />
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
      </View>

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
                <Text style={styles.reporter}>
                  Reported by: {report.reporter_name}
                </Text>
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
                    <Text style={styles.actionButtonText}>Mark Reviewed</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: Colors.success }]}
                    onPress={() => updateReportStatus(report.id, 'resolved')}
                  >
                    <Text style={styles.actionButtonText}>Resolve</Text>
                  </TouchableOpacity>
                </View>
              )}

              {report.status === 'reviewed' && (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: Colors.success, width: '100%' }]}
                  onPress={() => updateReportStatus(report.id, 'resolved')}
                >
                  <Text style={styles.actionButtonText}>Mark Resolved</Text>
                </TouchableOpacity>
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
    padding: 20,
    paddingTop: 10,
    gap: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
  },
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
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
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  filterTextActive: {
    color: Colors.surface,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  reportCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.error,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  reportHeaderText: {
    flex: 1,
    marginLeft: 12,
  },
  reportReason: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.error,
  },
  reportType: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  itemInfo: {
    backgroundColor: Colors.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  itemLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  description: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
    marginBottom: 12,
  },
  reportFooter: {
    marginBottom: 12,
  },
  reporter: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: Colors.surface,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
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
    textAlign: 'center',
    marginTop: 8,
  },
});
