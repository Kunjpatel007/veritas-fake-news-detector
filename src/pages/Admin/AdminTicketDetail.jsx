import TicketDetail from '@/pages/Support/TicketDetail';

export const route = { path: '/admin/tickets/:id', layout: 'owner', access: "profile === 'Admin_c'" };

export default function AdminTicketDetail() {
  return <TicketDetail basePath='/admin/tickets' backLabel='Tickets' pad={false} />;
}
