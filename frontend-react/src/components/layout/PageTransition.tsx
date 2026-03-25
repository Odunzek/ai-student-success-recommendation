import { type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { pageTransition, staggerContainer } from '../../lib/animations'

interface PageTransitionProps {
  children: ReactNode
  pageKey: string
  className?: string
  mode?: 'wait' | 'sync' | 'popLayout'
}

export function PageTransition({
  children,
  pageKey,
  className,
  mode = 'wait',
}: PageTransitionProps) {
  return (
    <AnimatePresence mode={mode}>
      <motion.div
        key={pageKey}
        variants={pageTransition}
        initial="initial"
        animate="animate"
        exit="exit"
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

interface StaggerContainerProps {
  children: ReactNode
  className?: string
  delay?: number
}

export function StaggerContainer({
  children,
  className,
  delay = 0,
}: StaggerContainerProps) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      exit="exit"
      className={className}
      style={{ '--stagger-delay': `${delay}s` } as React.CSSProperties}
    >
      {children}
    </motion.div>
  )
}

interface FadeInProps {
  children: ReactNode
  className?: string
  delay?: number
  duration?: number
  direction?: 'up' | 'down' | 'left' | 'right' | 'none'
}

export function FadeIn({
  children,
  className,
  delay = 0,
  duration = 0.4,
  direction = 'up',
}: FadeInProps) {
  const directions = {
    up: { y: 20 },
    down: { y: -20 },
    left: { x: 20 },
    right: { x: -20 },
    none: {},
  }

  return (
    <motion.div
      initial={{ opacity: 0, ...directions[direction] }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface ScaleInProps {
  children: ReactNode
  className?: string
  delay?: number
}

export function ScaleIn({ children, className, delay = 0 }: ScaleInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.3,
        delay,
        type: 'spring',
        stiffness: 300,
        damping: 25,
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface SlideInProps {
  children: ReactNode
  className?: string
  direction?: 'left' | 'right' | 'up' | 'down'
  delay?: number
}

export function SlideIn({
  children,
  className,
  direction = 'left',
  delay = 0,
}: SlideInProps) {
  const initial = {
    left: { x: -50, opacity: 0 },
    right: { x: 50, opacity: 0 },
    up: { y: 50, opacity: 0 },
    down: { y: -50, opacity: 0 },
  }

  return (
    <motion.div
      initial={initial[direction]}
      animate={{ x: 0, y: 0, opacity: 1 }}
      transition={{
        duration: 0.4,
        delay,
        type: 'spring',
        stiffness: 200,
        damping: 25,
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Stagger children animation wrapper
interface StaggerChildrenProps {
  children: ReactNode
  className?: string
  staggerDelay?: number
}

export function StaggerChildren({
  children,
  className,
  staggerDelay = 0.1,
}: StaggerChildrenProps) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      className={className}
      variants={{
        animate: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
    >
      {children}
    </motion.div>
  )
}

// Child element for stagger animations
interface StaggerItemProps {
  children: ReactNode
  className?: string
}

export function StaggerItem({ children, className }: StaggerItemProps) {
  return (
    <motion.div
      variants={{
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Hover animation wrapper
interface HoverScaleProps {
  children: ReactNode
  className?: string
  scale?: number
}

export function HoverScale({
  children,
  className,
  scale = 1.02,
}: HoverScaleProps) {
  return (
    <motion.div
      whileHover={{ scale }}
      whileTap={{ scale: 0.98 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Animate on scroll wrapper (intersection observer)
interface AnimateOnScrollProps {
  children: ReactNode
  className?: string
  threshold?: number
}

export function AnimateOnScroll({
  children,
  className,
  threshold = 0.1,
}: AnimateOnScrollProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: threshold }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
