import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Image,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { MaterialIcons } from '@expo/vector-icons';

export default function AboutScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/waypledge-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>WayPledge</Text>
          <Text style={styles.subtitle}>Give and Receive With Love</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>What is WayPledge?</Text>
          <Text style={styles.text}>
            WayPledge is the flagship of The Way, a place where wishes and pledges move in trust.
          </Text>
          <Text style={styles.text}>
            A wish can be shared when someone needs support, and a pledge can be offered freely without waiting for a wish. Both flow into the same circle.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>How It Works</Text>
          
          <View style={styles.step}>
            <View style={[styles.stepIcon, { backgroundColor: Colors.pledgeLight }]}>
              <MaterialIcons name="card-giftcard" size={24} color={Colors.pledgeDark} />
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>1. Create a Pledge</Text>
              <Text style={styles.stepText}>
                Offer something you can give - goods, services, skills, or time. Add your location to help local community members find you.
              </Text>
            </View>
          </View>

          <View style={styles.step}>
            <View style={[styles.stepIcon, { backgroundColor: Colors.wishLight }]}>
              <MaterialIcons name="star" size={24} color={Colors.wishDark} />
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>2. Make a Wish</Text>
              <Text style={styles.stepText}>
                Share what you need without judgment. Add your location to connect with nearby supporters.
              </Text>
            </View>
          </View>

          <View style={styles.step}>
            <View style={[styles.stepIcon, { backgroundColor: Colors.primary + '20' }]}>
              <MaterialIcons name="search" size={24} color={Colors.primary} />
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>3. Browse & Search</Text>
              <Text style={styles.stepText}>
                Find pledges and wishes by category, keywords, or location. Filter by your community, city, region, or country.
              </Text>
            </View>
          </View>

          <View style={styles.step}>
            <View style={[styles.stepIcon, { backgroundColor: Colors.accent + '20' }]}>
              <MaterialIcons name="chat" size={24} color={Colors.accent} />
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>4. Connect & Coordinate</Text>
              <Text style={styles.stepText}>
                Click "Connect" on any pledge or wish to start a private conversation and coordinate support
              </Text>
            </View>
          </View>

          <View style={styles.step}>
            <View style={[styles.stepIcon, { backgroundColor: Colors.success + '20' }]}>
              <MaterialIcons name="favorite" size={24} color={Colors.success} />
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>5. Express Gratitude</Text>
              <Text style={styles.stepText}>
                Thank those who help on the public Gratitude Wall
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>Our Philosophy</Text>
          <Text style={styles.text}>
            When a wish is met by pledges, the outcome is confirmed and the story is shared so trust grows. When a pledge is offered first, it waits in the field until the right wish appears.
          </Text>
          <Text style={styles.text}>
            Over time this creates a living network where giving and receiving move in unity.
          </Text>
          <Text style={styles.highlightText}>
            It is not charity, not transaction, but circular exchange in the energy of love and unity.
          </Text>
          <Text style={styles.text}>
            Each act makes the next easier, safer, and clearer. Communities become self-supporting through simple, human gestures of trust.
          </Text>
        </View>

        <View style={styles.taglineContainer}>
          <MaterialIcons name="favorite" size={32} color={Colors.accent} />
          <Text style={styles.tagline}>Every Pledge Lights the Way</Text>
        </View>

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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 32,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
  },
  text: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
    marginBottom: 16,
  },
  highlightText: {
    fontSize: 16,
    color: Colors.primary,
    lineHeight: 24,
    fontWeight: '600',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  step: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  stepIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepContent: {
    flex: 1,
    paddingTop: 4,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
  },
  stepText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  taglineContainer: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 24,
    borderRadius: 16,
    marginTop: 16,
  },
  tagline: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.accent,
    marginTop: 12,
    textAlign: 'center',
  },
});
