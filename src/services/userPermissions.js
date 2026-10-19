import { createPermissions } from '@/services/permissions';

export const PROFILES = {
  Admin_c: {
    label: 'Admin',
    isDefault: false,
    isPublic: false,
    canManageTeam: true,
    reportsTo: null,
  },
  Member_c: {
    label: 'Member',
    isDefault: true,
    isPublic: false,
    canManageTeam: false,
    reportsTo: 'Admin_c',
  },
  PublicProfile_c: {
    label: 'Visitor',
    isDefault: false,
    isPublic: true,
    canManageTeam: false,
    reportsTo: 'Member_c',
  },
};

const TABLE_PERMISSIONS = {
  Admin_c: {
    help_articles_c: { access: 'Full' },
    support_tickets_c: { access: 'Full' },
  },
  Member_c: {
    help_articles_c: { access: 'Read' },
    support_tickets_c: { access: 'Read,Create,Update,Delete', inaccessibleFields: [] },
  },
  PublicProfile_c: {
    help_articles_c: { access: 'Read' },
  },
};

export const { getProfileMeta, getTableAccess, getFieldAccess } = createPermissions(
  PROFILES,
  TABLE_PERMISSIONS,
);
