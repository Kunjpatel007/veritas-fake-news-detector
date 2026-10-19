import Tickets from '@/pages/Support/Tickets';

export const route = { path: '/admin/tickets', layout: 'owner', access: "profile === 'Admin_c'" };
export const nav = {
  icon: 'LifeBuoy',
  label: 'Tickets',
  section: 'Console',
  profiles: ['Admin_c'],
  order: 20,
};

export default function AdminTickets() {
  return <Tickets basePath='/admin/tickets' pad={false} />;
}
