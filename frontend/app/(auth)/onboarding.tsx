import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

interface OnboardingSlide {
  id: number;
  icon: keyof typeof MaterialIcons.glyphMap;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle: string;
  description: string;
  examples?: string[];
}

const slides: OnboardingSlide[] = [
  {
    id: 1,
    icon: 'card-giftcard',
    iconColor: '#2E7D32',
    iconBg: '#E8F5E9',
    title: 'Make a Pledge',
    subtitle: 'Offer what you can give',
    description: 'A pledge is something you can offer freely — your time, skills, items you no longer need, or help you\'re happy to give.',
    examples: [
      '"I can help with gardening"',
      '"Free guitar lessons"',
      '"Giving away children\'s books"',
    ],
  },
  {
    id: 2,
    icon: 'star',
    iconColor: '#1565C0',
    iconBg: '#E3F2FD',
    title: 'Make a Wish',
    subtitle: 'Ask for what you need',
    description: 'A wish is something you need help with. No shame, no obligation — just ask. Someone nearby may be ready to help.',
    examples: [
      '"Need help moving furniture"',
      '"Looking for a mentor"',
      '"Could use some company"',
    ],
  },
  {
    id: 3,
    icon: 'hexagon',
    iconColor: '#F9A825',
    iconBg: '#FFF8E1',
    title: 'Join a Community',
    subtitle: 'We call them Hives',
    description: 'Communities (Hives) connect you with people nearby. Like a honeycomb — many groups working together in harmony.',
    examples: [
      'Your neighbourhood',
      'Your town or city',
      'Interest-based groups',
    ],
  },
  {
    id: 4,
    icon: 'favorite',
    iconColor: '#C62828',
    iconBg: '#FFEBEE',
    title: 'Do No Harm',
    subtitle: 'The heart of WayPledge',
    description: 'This isn\'t a rule — it\'s a resonance. By being here, you\'re saying: I\'m oriented toward care. You can trust me. We\'re building something beautiful together.',
    examples: [],
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleScroll = (event: any) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(slideIndex);
  };

  const goToSlide = (index: number) => {
    scrollViewRef.current?.scrollTo({ x: index * width, animated: true });
    setCurrentIndex(index);
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      goToSlide(currentIndex + 1);
    } else {
      completeOnboarding();
    }
  };

  const handleSkip = () => {
    completeOnboarding();
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    } catch (e) {
      console.error('Error saving onboarding state:', e);
    }
    router.replace('/(tabs)/browse');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Skip button */}
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Slides */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {slides.map((slide) => (
          <View key={slide.id} style={styles.slide}>
            {/* Icon */}
            <View style={[styles.iconContainer, { backgroundColor: slide.iconBg }]}>
              <MaterialIcons name={slide.icon} size={64} color={slide.iconColor} />
            </View>

            {/* Content */}
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.subtitle}>{slide.subtitle}</Text>
            <Text style={styles.description}>{slide.description}</Text>

            {/* Examples */}
            {slide.examples && slide.examples.length > 0 && (
              <View style={styles.examplesContainer}>
                {slide.examples.map((example, index) => (
                  <View key={index} style={styles.exampleItem}>
                    <MaterialIcons name="check" size={16} color={slide.iconColor} />
                    <Text style={styles.exampleText}>{example}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Pagination dots */}
      <View style={styles.pagination}>
        {slides.map((_, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => goToSlide(index)}
            style={[
              styles.dot,
              currentIndex === index && styles.dotActive,
            ]}
          />
        ))}
      </View>

      {/* Bottom button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>
            {currentIndex === slides.length - 1 ? "Let's Begin" : 'Next'}
          </Text>
          <MaterialIcons 
            name={currentIndex === slides.length - 1 ? "check" : "arrow-forward"} 
            size={20} 
            color="#fff" 
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  skipText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  slide: {
    width: width,
    paddingHorizontal: 32,
    paddingTop: 100,
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '500',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  examplesContainer: {
    alignSelf: 'stretch',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  exampleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  exampleText: {
    fontSize: 15,
    color: Colors.text,
    fontStyle: 'italic',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  dotActive: {
    width: 24,
    backgroundColor: Colors.primary,
  },
  bottomContainer: {
    paddingHorizontal: 32,
    paddingBottom: 32,
  },
  nextButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
