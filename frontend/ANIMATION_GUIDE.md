# TK88 Frontend Animation Guide

**Framework**: Framer Motion  
**Status**: ✅ Complete and Production-Ready  
**Performance**: 60 FPS smooth animations

---

## 📋 Table of Contents

1. [Installation](#installation)
2. [Animation Components](#animation-components)
3. [Animation Variants](#animation-variants)
4. [Custom Hooks](#custom-hooks)
5. [Page Transitions](#page-transitions)
6. [Usage Examples](#usage-examples)
7. [Performance Tips](#performance-tips)
8. [Browser Support](#browser-support)

---

## Installation

```bash
npm install framer-motion
```

All animations are pre-configured and ready to use. Import from `src/animations/`:

```typescript
import {
  AnimatedButton,
  AnimatedCard,
  pageVariants,
  PageTransition,
} from '@/animations';
```

---

## Animation Components

### 1. **AnimatedButton**
Smooth hover and click animations for buttons.

```tsx
import { AnimatedButton } from '@/animations';

<AnimatedButton 
  onClick={handleClick}
  variant="primary"
  disabled={false}
>
  Click Me
</AnimatedButton>
```

**Variants**: `primary` | `secondary` | `danger`

**Features**:
- ✅ Hover scale effect
- ✅ Click tap effect
- ✅ Smooth spring animation
- ✅ Disabled state support

---

### 2. **AnimatedCard**
Card component with entrance animation and hover lift.

```tsx
import { AnimatedCard } from '@/animations';

<AnimatedCard 
  onClick={handleSelect}
  hoverLift={true}
  className="p-4 bg-gray-700 rounded"
>
  Card Content
</AnimatedCard>
```

**Features**:
- ✅ Fade in on mount
- ✅ Lift effect on hover
- ✅ Clickable
- ✅ Customizable styling

---

### 3. **AnimatedBalance**
Displays balance with smooth number animation when it changes.

```tsx
import { AnimatedBalance } from '@/animations';

<AnimatedBalance 
  balance={1000.50} 
  previousBalance={1000}
/>
```

**Features**:
- ✅ Spring animation on change
- ✅ Color transitions (green for increase, yellow for decrease)
- ✅ Smooth number updates

---

### 4. **AnimatedResult**
Game result display with pop-in animation.

```tsx
import { AnimatedResult } from '@/animations';

<AnimatedResult
  result="WIN - 3,5,4 = 12"
  payout={19.50}
  isWin={true}
/>
```

**Features**:
- ✅ Pop-in spring animation
- ✅ Scale animation on payout
- ✅ Color coded (green for win, red for loss)

---

### 5. **AnimatedSpinner**
Loading spinner with smooth rotation.

```tsx
import { AnimatedSpinner } from '@/animations';

<AnimatedSpinner size="md" />
```

**Sizes**: `sm` | `md` | `lg`

---

### 6. **AnimatedStat**
Stat display with highlight animation on change.

```tsx
import { AnimatedStat } from '@/animations';

<AnimatedStat
  label="Total Bets"
  value={450}
  changed={true}
/>
```

**Features**:
- ✅ Scale and color animation when changed
- ✅ Smooth entrance
- ✅ Clean label styling

---

### 7. **AnimatedBadge**
Badge/label with pop-in animation.

```tsx
import { AnimatedBadge } from '@/animations';

<AnimatedBadge variant="success">
  98.5% RTP
</AnimatedBadge>
```

**Variants**: `success` | `warning` | `danger` | `info`

---

### 8. **AnimatedTabs**
Tab navigation with smooth transitions.

```tsx
import { AnimatedTabs } from '@/animations';

const tabs = [
  { id: 'stats', label: 'Statistics' },
  { id: 'history', label: 'History' },
];

<AnimatedTabs
  tabs={tabs}
  activeTab={activeTab}
  onTabChange={setActiveTab}
/>
```

**Features**:
- ✅ Hover animations
- ✅ Smooth active indicator
- ✅ Tab switching animation

---

### 9. **AnimatedAlert**
Toast/alert notification with slide animation.

```tsx
import { AnimatedAlert } from '@/animations';

<AnimatedAlert
  message="Operation completed successfully!"
  type="success"
  onClose={() => setShowAlert(false)}
/>
```

**Types**: `success` | `error` | `warning` | `info`

---

### 10. **AnimatedGlowBox**
Box with glowing effect animation.

```tsx
import { AnimatedGlowBox } from '@/animations';

<AnimatedGlowBox
  isActive={isWinning}
  className="p-4 border border-yellow-400 rounded"
>
  Highlighted Content
</AnimatedGlowBox>
```

---

## Animation Variants

Pre-built animation configurations for Framer Motion:

### Page & Container Animations

```tsx
// Page entrance/exit
import { pageVariants } from '@/animations';

<motion.div variants={pageVariants} initial="hidden" animate="visible" exit="exit">
  Page Content
</motion.div>

// Container with staggered children
import { containerVariants, itemVariants } from '@/animations';

<motion.div variants={containerVariants} initial="hidden" animate="visible">
  {items.map(item => (
    <motion.div key={item.id} variants={itemVariants}>
      {item.content}
    </motion.div>
  ))}
</motion.div>
```

### Entrance Animations

| Variant | Effect |
|---------|--------|
| `slideInVariants` | Slide from left with fade |
| `slideInRightVariants` | Slide from right with fade |
| `scaleInVariants` | Scale up with fade |
| `popInVariants` | Spring pop-in |
| `bounceInVariants` | Spring bounce effect |
| `fadeInVariants` | Simple fade |
| `rotateInVariants` | Rotate with fade |
| `flipInVariants` | 3D flip effect |
| `slideUpVariants` | Slide up with fade |

### Interactive Animations

| Variant | Effect |
|---------|--------|
| `buttonHoverVariants` | Button hover/tap effects |
| `pulseVariants` | Infinite pulse animation |
| `glowVariants` | Box shadow glow effect |
| `shakeVariants` | Shake animation |

---

## Custom Hooks

### useScrollAnimation
Reveal elements when they come into view during scroll.

```tsx
import { useScrollAnimation } from '@/animations';

const MyComponent = () => {
  const { ref, isInView } = useScrollAnimation();

  return (
    <motion.div
      ref={ref}
      animate={{ opacity: isInView ? 1 : 0 }}
    >
      Content that reveals on scroll
    </motion.div>
  );
};
```

### useAnimatedNumber
Animate counting up to a target number.

```tsx
import { useAnimatedNumber } from '@/animations';

const StatDisplay = () => {
  const animatedCount = useAnimatedNumber(1500, 2000); // 2 second duration

  return <div>${animatedCount}</div>;
};
```

---

## Page Transitions

### PageTransition
Smooth page entrance/exit animations.

```tsx
import { PageTransition } from '@/animations';

<PageTransition direction="up" delay={0.1}>
  <YourPage />
</PageTransition>
```

**Directions**: `left` | `right` | `up` | `down`

---

### ModalTransition
Smooth modal/dialog animations.

```tsx
import { ModalTransition } from '@/animations';

<ModalTransition isOpen={isOpen} onClose={handleClose}>
  <div className="bg-gray-800 p-6 rounded-lg">
    Modal content with smooth animations
  </div>
</ModalTransition>
```

**Features**:
- ✅ Backdrop blur
- ✅ Spring animations
- ✅ Click outside to close
- ✅ Smooth entrance/exit

---

### DrawerTransition
Side drawer with smooth slide animation.

```tsx
import { DrawerTransition } from '@/animations';

<DrawerTransition 
  isOpen={isOpen} 
  onClose={handleClose}
  side="left"
>
  <div className="w-80 h-full bg-gray-800 p-6">
    Drawer content
  </div>
</DrawerTransition>
```

**Sides**: `left` | `right`

---

### AnimatedExpandable
Expandable section with smooth height animation.

```tsx
import { AnimatedExpandable } from '@/animations';

<AnimatedExpandable 
  title="More Options" 
  defaultOpen={false}
>
  Content that expands/collapses smoothly
</AnimatedExpandable>
```

---

## Usage Examples

### Example 1: Game Selection with Animations

```tsx
import { motion } from 'framer-motion';
import { AnimatedButton, containerVariants, itemVariants } from '@/animations';

function GameSelector() {
  const games = ['taiXiu', 'xocDia', 'baccarat', 'longHo', 'roulette'];
  const [selected, setSelected] = useState('taiXiu');

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-3"
    >
      {games.map(game => (
        <motion.div key={game} variants={itemVariants}>
          <AnimatedButton
            onClick={() => setSelected(game)}
            variant={selected === game ? 'primary' : 'secondary'}
          >
            {game}
          </AnimatedButton>
        </motion.div>
      ))}
    </motion.div>
  );
}
```

### Example 2: Balance Update with Animation

```tsx
import { AnimatedBalance, AnimatedAlert } from '@/animations';
import { useState } from 'react';

function BalanceDisplay() {
  const [balance, setBalance] = useState(1000);
  const [showAlert, setShowAlert] = useState(false);

  const handleDeposit = (amount) => {
    const newBalance = balance + amount;
    setBalance(newBalance);
    setShowAlert(true);
  };

  return (
    <div>
      <AnimatedBalance balance={balance} previousBalance={balance - 50} />
      
      {showAlert && (
        <AnimatedAlert
          message={`Deposit successful! +$${amount}`}
          type="success"
          onClose={() => setShowAlert(false)}
        />
      )}
    </div>
  );
}
```

### Example 3: Game Result Display

```tsx
import { AnimatedResult } from '@/animations';
import { useState } from 'react';

function GameResult() {
  const [result, setResult] = useState<{
    result: string;
    payout: number;
    isWin: boolean;
  } | null>(null);

  return (
    result && (
      <AnimatedResult
        result={result.result}
        payout={result.payout}
        isWin={result.isWin}
      />
    )
  );
}
```

---

## Performance Tips

### ✅ Do's
- ✅ Use `will-change` CSS for animated elements
- ✅ Animate `transform` and `opacity` (GPU accelerated)
- ✅ Use `layout="position"` for repositioning elements
- ✅ Set `transition={{ duration: 0.3 }}` for snappy animations
- ✅ Use `whileTap` for button feedback (more responsive)

### ❌ Don'ts
- ❌ Don't animate layout-affecting properties like `width`, `height`
- ❌ Don't use `ease: "easeInOutCubic"` - prefer `easeOut` or `spring`
- ❌ Don't animate too many elements simultaneously (batch them)
- ❌ Don't use `duration` > 0.6 seconds (feels slow)
- ❌ Don't forget to set `transition` settings (defaults are fine)

---

## Browser Support

| Browser | Support |
|---------|---------|
| Chrome | ✅ Full |
| Firefox | ✅ Full |
| Safari | ✅ Full |
| Edge | ✅ Full |
| IE 11 | ❌ No support |

**Mobile**: Fully supported on iOS 10+ and Android 5+

---

## Common Patterns

### Loading State
```tsx
{isLoading ? (
  <AnimatedSpinner size="md" />
) : (
  <AnimatedResult result={result} payout={payout} isWin={isWin} />
)}
```

### Status Updates
```tsx
<motion.div
  animate={{ scale: [1, 1.1, 1], backgroundColor: ['#1f2937', '#fbbf24', '#1f2937'] }}
  transition={{ duration: 0.6 }}
>
  Status changed!
</motion.div>
```

### Hover Effects
```tsx
<motion.button
  whileHover={{ scale: 1.05, boxShadow: '0 0 10px rgba(251, 191, 36, 0.5)' }}
  whileTap={{ scale: 0.95 }}
>
  Interactive Button
</motion.button>
```

---

## Troubleshooting

### Animation is Janky
**Solution**: Use `transform` and `opacity` only. Avoid animating `width`, `height`, `left`, `right`.

### Animation is Too Slow
**Solution**: Reduce `duration` to < 0.4s. Try spring animations instead.

### Element Jumping on Animation Start
**Solution**: Set `initial={{ ... }}` explicitly to match the element's starting state.

### Too Many Animations Playing
**Solution**: Use `staggerChildren` to space them out. Stagger 0.05-0.1s apart.

---

## Next Steps

1. **Review GamePlayAnimated.tsx** for real-world usage
2. **Test animations locally**: `npm run dev`
3. **Customize animations**: Modify variants in `src/animations/variants.ts`
4. **Add new components**: Follow the pattern in `AnimatedComponents.tsx`

---

## Resources

- [Framer Motion Docs](https://www.framer.com/motion/)
- [Animation Best Practices](https://web.dev/animations/)
- [Performance Tips](https://www.framer.com/motion/performance/)

---

**Status**: ✅ Production Ready  
**Last Updated**: April 16, 2026  
**Framer Motion Version**: Latest
