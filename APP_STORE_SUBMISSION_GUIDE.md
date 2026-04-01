# WayPledge App Store Submission Guide

## Quick Start Checklist

### Already Done ✅
- [x] App icon (1024x1024)
- [x] Splash screen
- [x] Bundle identifier: `me.waypledge.app`
- [x] Privacy Policy page in app
- [x] iOS permission descriptions (camera, photos, location)
- [x] Android permissions configured
- [x] EAS build configuration
- [x] "Do No Harm" pledge content
- [x] Encryption declaration (usesNonExemptEncryption: false)

### When Apple Account is Active ⏳

#### Step 1: Link Expo Account (5 mins)
```bash
# In your terminal, login to Expo
npx expo login

# Then link this project (one time)
npx eas init
```
This will give you a real `projectId` to replace in `app.json`

#### Step 2: Create App in App Store Connect (10 mins)
1. Go to https://appstoreconnect.apple.com
2. Click "My Apps" → "+" → "New App"
3. Fill in:
   - **Platform**: iOS
   - **Name**: WayPledge
   - **Primary Language**: English
   - **Bundle ID**: me.waypledge.app
   - **SKU**: waypledge-ios-001

#### Step 3: Build & Submit (20-30 mins)
```bash
# Build for iOS App Store
npx eas build --platform ios --profile production

# Submit to App Store (after build completes)
npx eas submit --platform ios
```

---

## App Store Content (Copy & Paste Ready)

### App Name
```
WayPledge
```

### Subtitle (30 chars max)
```
A Gift Economy Community
```

### Promotional Text (170 chars - can change anytime)
```
Join a community where giving flows freely. No money, no fees - just people helping people. Create pledges, make wishes, and watch trust grow in circles.
```

### Description (4000 chars max)
```
WayPledge is the flagship of The Way - a gift economy platform where wishes and pledges move in trust.

🎁 THE PHILOSOPHY
Give Freely. Receive Gratefully. Trust Flows in Circles.

This is not a marketplace. There's no money, no fees, no selling. Everything is given freely from the heart. We help each other - if someone can help, they do. If not, that's okay too. No shame, just community.

🤝 HOW IT WORKS

PLEDGES - What You Can Give
Share your skills, time, or items with your community:
• "I can teach guitar lessons"
• "Offering home-cooked meals"
• "Happy to help with gardening"

WISHES - What You Need
Ask for help without shame:
• "Looking for moving assistance"
• "Need help learning to cook"
• "Seeking advice on job applications"

HIVES - Your Communities
Join local or interest-based groups. Find people nearby who share your values. Discover pledges in your area.

💛 THE DO NO HARM PLEDGE
Every member commits to:
• Act with honesty and integrity
• Respect others' boundaries
• Give without expectation
• Receive with gratitude
• Report concerns, not drama

🌍 A RIPPLE EFFECT
Each act of kindness makes the next one easier. Over time, giving and receiving move in unity. Communities become self-supporting through simple acts of generosity.

WayPledge is free to use. No subscriptions, no premium features, no hidden costs. We're funded by voluntary contributions through Open Collective.

Join the movement. Start giving. Start receiving. Watch trust flow.
```

### Keywords (100 chars max, comma-separated)
```
gift economy,community,volunteer,free stuff,sharing,neighbors,local help,giving,kindness,mutual aid
```

### Support URL
```
https://waypledge.me/support
```

### Marketing URL
```
https://waypledge.me
```

### Privacy Policy URL
```
https://waypledge.me/privacy
```

---

## App Store Category

**Primary Category**: Social Networking
**Secondary Category**: Lifestyle

---

## Age Rating Questionnaire Answers

| Question | Answer |
|----------|--------|
| Cartoon or Fantasy Violence | None |
| Realistic Violence | None |
| Prolonged Graphic Violence | None |
| Sexual Content | None |
| Graphic Sexual Content | None |
| Profanity or Crude Humor | None |
| Mature/Suggestive Themes | None |
| Alcohol, Tobacco, Drug Use | None |
| Simulated Gambling | None |
| Horror/Fear Themes | None |
| Medical/Treatment Info | None |
| Unrestricted Web Access | No |
| Gambling and Contests | None |

**Result**: Age 4+ (Everyone)

---

## Screenshots Needed

### iPhone 6.7" Display (Required) - iPhone 14 Pro Max
Size: 1290 x 2796 pixels

Suggested screenshots:
1. **Home Screen** - "Welcome back! Give Freely. Receive Gratefully."
2. **Browse Pledges** - Show pledge cards with categories
3. **Create Pledge** - Creating a new pledge form
4. **Hive View** - Community/local group
5. **Messages** - Connection between users
6. **About/Philosophy** - The Do No Harm pledge

### iPhone 6.5" Display (Required) - iPhone 11 Pro Max
Size: 1284 x 2778 pixels
(Same screenshots, scaled)

### iPhone 5.5" Display (Optional) - iPhone 8 Plus
Size: 1242 x 2208 pixels

### iPad Pro 12.9" (If supporting tablets)
Size: 2048 x 2732 pixels

---

## What's New (Version 1.0.0)
```
Welcome to WayPledge! 

🎁 Create pledges - share what you can give
⭐ Post wishes - ask for what you need  
🏠 Join hives - connect with local communities
💬 Message members - coordinate directly
❤️ Send gratitude - celebrate kindness

Give Freely. Receive Gratefully. Trust Flows in Circles.
```

---

## Update eas.json Before Submitting

Replace the placeholder values in `/app/frontend/eas.json`:

```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-actual-apple-id@email.com",
        "ascAppId": "your-app-store-connect-app-id"
      }
    }
  }
}
```

To find your `ascAppId`:
1. Go to App Store Connect → Your App
2. Look at the URL: `https://appstoreconnect.apple.com/apps/XXXXXXXXXX`
3. The number is your ascAppId

---

## Build Commands Reference

```bash
# Development build (for testing)
npx eas build --platform ios --profile development

# Preview build (TestFlight internal)
npx eas build --platform ios --profile preview

# Production build (App Store)
npx eas build --platform ios --profile production

# Submit to App Store
npx eas submit --platform ios --latest

# Android builds
npx eas build --platform android --profile production
npx eas submit --platform android --latest
```

---

## Common Review Rejection Reasons & How We Avoid Them

| Rejection Reason | Our Status |
|-----------------|------------|
| Crashes or bugs | ✅ Tested |
| Broken links | ✅ All internal |
| Placeholder content | ✅ Real content |
| Privacy policy missing | ✅ Included in app |
| Login required without guest mode | ⚠️ We require login - but it's free |
| Incomplete metadata | ✅ All provided above |
| Poor UI/UX | ✅ Native feel, tested |

---

## After Approval

1. **Set release date** - Choose when to make it live
2. **Announce** - Share on waypledge.me and social media
3. **Monitor reviews** - Respond to user feedback
4. **Plan updates** - Version 1.1 features ready

---

## Questions?

This guide should get you through submission quickly once Apple activates your account. The app is technically ready - just needs the account linkage.
