import Account from '@/pages/Account';

export const route = { path: '/admin/account', layout: 'owner', access: "profile === 'Admin_c'" };

export default function AdminAccount() {
  return <Account pad={false} supportPath='/admin/tickets' />;
}
