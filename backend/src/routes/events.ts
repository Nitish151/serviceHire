import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// All routes require authentication
router.use(authMiddleware);

// Get all events for the logged-in user
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const events = await prisma.event.findMany({
      where: { userId: req.userId },
      orderBy: { startTime: 'asc' },
    });

    res.json(events);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Get a single event
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const event = await prisma.event.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// Create a new event
router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('startTime').isISO8601().withMessage('Valid start time is required'),
    body('endTime').isISO8601().withMessage('Valid end time is required'),
    body('status').optional().isIn(['BUSY', 'SWAPPABLE']).withMessage('Status must be BUSY or SWAPPABLE'),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { title, startTime, endTime, status } = req.body;

      // Validate that endTime is after startTime
      if (new Date(endTime) <= new Date(startTime)) {
        return res.status(400).json({ error: 'End time must be after start time' });
      }

      const event = await prisma.event.create({
        data: {
          title,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          status: status || 'BUSY',
          userId: req.userId!,
        },
      });

      res.status(201).json(event);
    } catch (error) {
      console.error('Create event error:', error);
      res.status(500).json({ error: 'Failed to create event' });
    }
  }
);

// Update an event
router.put(
  '/:id',
  [
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
    body('startTime').optional().isISO8601().withMessage('Valid start time is required'),
    body('endTime').optional().isISO8601().withMessage('Valid end time is required'),
    body('status').optional().isIn(['BUSY', 'SWAPPABLE']).withMessage('Status must be BUSY or SWAPPABLE'),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { title, startTime, endTime, status } = req.body;

      // Check if event exists and belongs to user
      const existingEvent = await prisma.event.findFirst({
        where: {
          id: req.params.id,
          userId: req.userId,
        },
      });

      if (!existingEvent) {
        return res.status(404).json({ error: 'Event not found' });
      }

      // Prevent updating status if it's SWAP_PENDING
      if (existingEvent.status === 'SWAP_PENDING' && status && status !== 'SWAP_PENDING') {
        return res.status(400).json({ 
          error: 'Cannot update status of an event with pending swap request' 
        });
      }

      // Validate time if both are provided
      const newStartTime = startTime ? new Date(startTime) : existingEvent.startTime;
      const newEndTime = endTime ? new Date(endTime) : existingEvent.endTime;

      if (newEndTime <= newStartTime) {
        return res.status(400).json({ error: 'End time must be after start time' });
      }

      const updatedEvent = await prisma.event.update({
        where: { id: req.params.id },
        data: {
          ...(title && { title }),
          ...(startTime && { startTime: new Date(startTime) }),
          ...(endTime && { endTime: new Date(endTime) }),
          ...(status && { status }),
        },
      });

      res.json(updatedEvent);
    } catch (error) {
      console.error('Update event error:', error);
      res.status(500).json({ error: 'Failed to update event' });
    }
  }
);

// Delete an event
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    // Check if event exists and belongs to user
    const event = await prisma.event.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Prevent deletion if it's SWAP_PENDING
    if (event.status === 'SWAP_PENDING') {
      return res.status(400).json({ 
        error: 'Cannot delete an event with pending swap request' 
      });
    }

    await prisma.event.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

export default router;
