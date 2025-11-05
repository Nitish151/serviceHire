export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Event {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  status: 'BUSY' | 'SWAPPABLE' | 'SWAP_PENDING';
  userId: string;
  user?: User;
  createdAt: string;
  updatedAt: string;
}

export interface SwapRequest {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  requesterId: string;
  recipientId: string;
  mySlotId: string;
  theirSlotId: string;
  requester?: User;
  recipient?: User;
  mySlot: Event;
  theirSlot: Event;
  createdAt: string;
  updatedAt: string;
}
