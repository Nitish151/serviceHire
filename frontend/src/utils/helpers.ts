import { format, parseISO } from 'date-fns';

export const formatDate = (dateString: string): string => {
  return format(parseISO(dateString), 'MMM dd, yyyy');
};

export const formatTime = (dateString: string): string => {
  return format(parseISO(dateString), 'h:mm a');
};

export const formatDateTime = (dateString: string): string => {
  return format(parseISO(dateString), 'MMM dd, yyyy h:mm a');
};

export const formatDateTimeRange = (start: string, end: string): string => {
  const startDate = parseISO(start);
  const endDate = parseISO(end);
  
  return `${format(startDate, 'MMM dd, yyyy h:mm a')} - ${format(endDate, 'h:mm a')}`;
};

export const getStatusBadgeClass = (status: string): string => {
  switch (status) {
    case 'BUSY':
      return 'bg-red-100 text-red-800';
    case 'SWAPPABLE':
      return 'bg-green-100 text-green-800';
    case 'SWAP_PENDING':
      return 'bg-yellow-100 text-yellow-800';
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800';
    case 'ACCEPTED':
      return 'bg-emerald-100 text-emerald-800';
    case 'REJECTED':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'BUSY':
      return 'Busy';
    case 'SWAPPABLE':
      return 'Swappable';
    case 'SWAP_PENDING':
      return 'Swap Pending';
    case 'PENDING':
      return 'Pending';
    case 'ACCEPTED':
      return 'Accepted';
    case 'REJECTED':
      return 'Rejected';
    default:
      return status;
  }
};
