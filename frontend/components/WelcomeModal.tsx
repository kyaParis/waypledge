import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Colors } from '../constants/Colors';
import { MaterialIcons } from '@expo/vector-icons';

interface WelcomeModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function WelcomeModal({ visible, onClose }: WelcomeModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <MaterialIcons name="favorite" size={48} color={Colors.accent} />
              <Text style={styles.title}>Welcome to WayPledge!</Text>
              <Text style={styles.subtitle}>Give and Receive With Love</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>What is WayPledge?</Text>
              <Text style={styles.text}>
                A community platform for mutual support through shared intention, not
                transactions. No money, no fees, no selling - just genuine human connection.
              </Text>
            </View>

            <View style={styles.section}>
              <View style={styles.feature}>
                <View style={[styles.iconCircle, { backgroundColor: Colors.pledgeLight }]}>
                  <MaterialIcons name="card-giftcard" size={28} color={Colors.pledgeDark} />
                </View>
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>1. Create Pledges</Text>
                  <Text style={styles.featureDesc}>
                    Offer goods, services, skills, or time you can share
                  </Text>
                </View>
              </View>

              <View style={styles.feature}>
                <View style={[styles.iconCircle, { backgroundColor: Colors.wishLight }]}>
                  <MaterialIcons name="star" size={28} color={Colors.wishDark} />
                </View>
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>2. Make Wishes</Text>
                  <Text style={styles.featureDesc}>
                    Request what you need - no judgment, just community support
                  </Text>
                </View>
              </View>

              <View style={styles.feature}>
                <View style={[styles.iconCircle, { backgroundColor: Colors.primary + '20' }]}>
                  <MaterialIcons name="search" size={28} color={Colors.primary} />
                </View>
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>3. Browse & Connect</Text>
                  <Text style={styles.featureDesc}>
                    Find pledges and wishes, then click "Connect" to start chatting
                  </Text>
                </View>
              </View>

              <View style={styles.feature}>
                <View style={[styles.iconCircle, { backgroundColor: Colors.accent + '20' }]}>
                  <MaterialIcons name="chat" size={28} color={Colors.accent} />
                </View>
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>4. Message & Coordinate</Text>
                  <Text style={styles.featureDesc}>
                    Chat privately to coordinate giving and receiving
                  </Text>
                </View>
              </View>

              <View style={styles.feature}>
                <View style={[styles.iconCircle, { backgroundColor: Colors.success + '20' }]}>
                  <MaterialIcons name="favorite" size={28} color={Colors.success} />
                </View>
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>5. Express Gratitude</Text>
                  <Text style={styles.featureDesc}>
                    Thank those who help on the public Gratitude Wall
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.tipBox}>
              <MaterialIcons name="lightbulb" size={20} color={Colors.warning} />
              <Text style={styles.tipText}>
                <Text style={styles.tipBold}>Tip: </Text>
                Start by creating a pledge or wish in the Create tab, then browse what others
                have shared!
              </Text>
            </View>

            <TouchableOpacity style={styles.button} onPress={onClose}>
              <Text style={styles.buttonText}>Get Started</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: Colors.background,
    borderRadius: 20,
    width: '90%',
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  content: {
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  text: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
  },
  feature: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureText: {
    flex: 1,
    paddingTop: 4,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  tipBox: {
    flexDirection: 'row',
    backgroundColor: Colors.warning + '10',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderLeftWidth: 3,
    borderLeftColor: Colors.warning,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginLeft: 12,
  },
  tipBold: {
    fontWeight: '600',
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonText: {
    color: Colors.surface,
    fontSize: 18,
    fontWeight: '600',
  },
});
