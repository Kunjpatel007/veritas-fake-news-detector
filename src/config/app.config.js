export const APP_CONFIG = {
  name: 'Veritas',
  tagline: 'Read it twice. Share it once.',
  emoji: '🗞️',
  icon: 'ShieldCheck',
  defaultTheme: 'dark',
  defaultLoginRoute: '/member/login',
};

export const AUTH_PROFILES = [
  {
    key: 'member',
    name: 'Member_c',
    label: 'Member',
    redirectAfterAuth: '/home',
    hasSignup: true,
    reportsTo: 'Admin_c',
    authPage: {
      loginTitle: 'Welcome back',
      signupTitle: 'Create your Veritas account',
      loginDescription: 'Sign in to check messages, read the Help Center and reach our team.',
      signupDescription: 'One free account for the checker, the Help Center and your support tickets.',
    },
    altLinksLeadIn: 'Work on the Veritas team?',
    altLinks: [{ href: '/admin/login', label: 'Admin console sign in' }],
  },
  {
    key: 'admin',
    name: 'Admin_c',
    label: 'Admin',
    redirectAfterAuth: '/admin',
    hasSignup: false,
    reportsTo: null,
    authPage: {
      loginTitle: 'Admin console',
      signupTitle: 'Create admin account',
      loginDescription: 'Answer support tickets, publish Help Center articles and manage customers.',
      signupDescription: null,
    },
    altLinksLeadIn: 'Not on the team?',
    altLinks: [{ href: '/member/login', label: 'Customer sign in' }],
  },
];

export const GENERIC_AUTH = {
  loginTitle: 'Welcome back',
  signupTitle: 'Create account',
  loginDescription: null,
  signupDescription: null,
  redirectAfterAuth: '/home',
};
