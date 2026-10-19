export const TICKET_CATEGORIES = ['Account', 'Checker results', 'Report a rumour', 'Privacy request', 'Bug', 'Other'];
export const TICKET_PRIORITIES = ['Low', 'Medium', 'High'];
export const TICKET_STATUSES = ['Open', 'In progress', 'Resolved', 'Closed'];

export const ARTICLE_CATEGORIES = ['Getting started', 'Understanding results', 'Scams and safety', 'Your account', 'Privacy'];

export const TICKET_FIELDS = [
  'Id',
  'Name',
  'category_c',
  'priority_c',
  'status_c',
  'message_c',
  'admin_reply_c',
  'Owner',
  'CreatedOn',
  'ModifiedOn',
];

export const ARTICLE_FIELDS = [
  'Id',
  'Name',
  'category_c',
  'summary_c',
  'body_c',
  'published_c',
  'read_time_c',
  'CreatedOn',
  'ModifiedOn',
];

export const statusStyles = {
  Open: {
    badge: 'bg-highlight/15 text-highlight border-transparent',
    row: 'bg-highlight/10',
    dot: 'bg-highlight',
  },
  'In progress': {
    badge: 'bg-chart-3/15 text-foreground border-transparent',
    row: 'bg-chart-3/10',
    dot: 'bg-chart-3',
  },
  Resolved: {
    badge: 'bg-success-muted text-success border-success-border',
    row: 'bg-success/10',
    dot: 'bg-success',
  },
  Closed: {
    badge: 'bg-muted text-muted-foreground border-transparent',
    row: '',
    dot: 'bg-muted-foreground',
  },
};

export const priorityStyles = {
  High: { text: 'text-priority-high', dot: 'bg-priority-high' },
  Medium: { text: 'text-priority-medium', dot: 'bg-priority-medium' },
  Low: { text: 'text-priority-low', dot: 'bg-priority-low' },
};
