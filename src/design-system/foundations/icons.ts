/**
 * Design System Foundation: Icons
 * 
 * This file defines the icon system for the application.
 * Icons are organized here and can be imported and used throughout the application.
 */

// Icon sizing system
export const iconSizes = {
  xs: '12px',
  sm: '16px',
  md: '20px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
}

// Path to the icons directory
export const ICONS_PATH = '/assets/icons'

// Path to student avatar icons
export const STUDENT_AVATARS_PATH = '/assets/icons/student-avatars'

// Icon names
export const AppIcons = {
  // Navigation icons
  NAV_LOGO: 'nav_logo',
  NAV_SEARCH: 'nav_search',
  NAV_SEARCH_FILL: 'nav_search_fill',
  NAV_FEED: 'nav_feed',
  NAV_FEED_FILL: 'nav_feed_fill',
  NAV_ASSIGNMENT: 'nav_assignment',
  NAV_ASSIGNMENT_FILL: 'nav_assignment_fill',
  NAV_FILES: 'nav_files',
  NAV_FILES_FILL: 'nav_files_fill',
  NAV_PEOPLE: 'nav_people',
  NAV_PEOPLE_FILL: 'nav_people_fill',
  NAV_NOTIFICATION: 'nav_notification',
  NAV_NOTIFICATION_FILL: 'nav_notification_fill',
  NAV_GRADEBOOK: 'nav_gradebook',
  NAV_GRADEBOOK_FILL: 'nav_gradebook_fill',
  NAV_AI_DASHBOARD: 'nav_ai_dashboard',
  NAV_AI_DASHBOARD_FILL: 'nav_ai_dashboard_fill',
  // Filter icons
  FILTER_PERSONA: 'filter_persona',
  FILTER_POSTED_ON: 'filter_posted_on',
  FILTER_STUDENTS: 'filter_students',
  FILTER_SUBJECTS: 'filter_subjects',
  FILTER_TAGS: 'filter_tags',
  FILTER_FILETYPE: 'filter_files',
  // Action icons
  ACTION_EDIT: 'action_edit',
  ACTION_PIN: 'action_pin',
  // Empty state icons
  GRADEBOOK_EMPTY: 'gradebook_empty',
  ASSIGNMENTS_EMPTY: 'assignments_empty',
}

export default {
  iconSizes,
  ICONS_PATH,
  AppIcons,
} 