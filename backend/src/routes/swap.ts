import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient, Prisma } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// All routes require authentication
router.use(authMiddleware);

// GET /api/swappable-slots - Get all swappable slots from other users
router.get('/swappable-slots', async (req: AuthRequest, res: Response) => {
  try {
    const swappableSlots = await prisma.event.findMany({
      where: {
        status: 'SWAPPABLE',
        userId: {
          not: req.userId, 
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    res.json(swappableSlots);
  } catch (error) {
    console.error('Get swappable slots error:', error);
    res.status(500).json({ error: 'Failed to fetch swappable slots' });
  }
});

// POST /api/swap-request - Create a new swap request
router.post(
  '/swap-request',
  [
    body('mySlotId').notEmpty().withMessage('Your slot ID is required'),
    body('theirSlotId').notEmpty().withMessage('Their slot ID is required'),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { mySlotId, theirSlotId } = req.body;
      const requesterId = req.userId!;

      // Validate that the two slot IDs are different
      if (mySlotId === theirSlotId) {
        return res.status(400).json({ error: 'Cannot swap a slot with itself' });
      }

      // Use transaction to ensure data consistency
      const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // 1. Verify mySlot exists, belongs to requester, and is SWAPPABLE
        const mySlot = await tx.event.findUnique({
          where: { id: mySlotId },
        });

        if (!mySlot) {
          throw new Error('Your slot not found');
        }

        if (mySlot.userId !== requesterId) {
          throw new Error('You do not own this slot');
        }

        if (mySlot.status !== 'SWAPPABLE') {
          throw new Error('Your slot must be SWAPPABLE');
        }

        // 2. Verify theirSlot exists, belongs to another user, and is SWAPPABLE
        const theirSlot = await tx.event.findUnique({
          where: { id: theirSlotId },
          include: { user: true },
        });

        if (!theirSlot) {
          throw new Error('The requested slot not found');
        }

        if (theirSlot.userId === requesterId) {
          throw new Error('Cannot swap with your own slot');
        }

        if (theirSlot.status !== 'SWAPPABLE') {
          throw new Error('The requested slot is no longer available for swapping');
        }

        // 3. Create the swap request
        const swapRequest = await tx.swapRequest.create({
          data: {
            requesterId,
            recipientId: theirSlot.userId,
            mySlotId,
            theirSlotId,
            status: 'PENDING',
          },
          include: {
            requester: {
              select: { id: true, name: true, email: true },
            },
            recipient: {
              select: { id: true, name: true, email: true },
            },
            mySlot: true,
            theirSlot: true,
          },
        });

        // 4. Update both slots to SWAP_PENDING
        await tx.event.update({
          where: { id: mySlotId },
          data: { status: 'SWAP_PENDING' },
        });

        await tx.event.update({
          where: { id: theirSlotId },
          data: { status: 'SWAP_PENDING' },
        });

        return swapRequest;
      });

      res.status(201).json({
        message: 'Swap request created successfully',
        swapRequest: result,
      });
    } catch (error: any) {
      console.error('Create swap request error:', error);
      res.status(400).json({ error: error.message || 'Failed to create swap request' });
    }
  }
);

// GET /api/swap-requests - Get all swap requests (incoming and outgoing)
router.get('/swap-requests', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    // Get incoming requests (where user is the recipient)
    const incomingRequests = await prisma.swapRequest.findMany({
      where: {
        recipientId: userId,
      },
      include: {
        requester: {
          select: { id: true, name: true, email: true },
        },
        mySlot: true,
        theirSlot: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get outgoing requests (where user is the requester)
    const outgoingRequests = await prisma.swapRequest.findMany({
      where: {
        requesterId: userId,
      },
      include: {
        recipient: {
          select: { id: true, name: true, email: true },
        },
        mySlot: true,
        theirSlot: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      incoming: incomingRequests,
      outgoing: outgoingRequests,
    });
  } catch (error) {
    console.error('Get swap requests error:', error);
    res.status(500).json({ error: 'Failed to fetch swap requests' });
  }
});

// POST /api/swap-response/:requestId - Accept or reject a swap request
router.post(
  '/swap-response/:requestId',
  [body('accepted').isBoolean().withMessage('Accepted must be a boolean')],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { requestId } = req.params;
      const { accepted } = req.body;
      const userId = req.userId!;

      const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // 1. Find the swap request
        const swapRequest = await tx.swapRequest.findUnique({
          where: { id: requestId },
          include: {
            mySlot: true,
            theirSlot: true,
          },
        });

        if (!swapRequest) {
          throw new Error('Swap request not found');
        }

        // 2. Verify that the current user is the recipient
        if (swapRequest.recipientId !== userId) {
          throw new Error('You are not authorized to respond to this request');
        }

        // 3. Verify that the request is still pending
        if (swapRequest.status !== 'PENDING') {
          throw new Error('This swap request has already been processed');
        }

        if (accepted) {
          // ACCEPT: Exchange ownership and set status to BUSY
          
          // Update swap request status
          await tx.swapRequest.update({
            where: { id: requestId },
            data: { status: 'ACCEPTED' },
          });

          // Exchange the ownership of the two slots
          // mySlot (requester's slot) goes to recipient
          await tx.event.update({
            where: { id: swapRequest.mySlotId },
            data: {
              userId: swapRequest.recipientId,
              status: 'BUSY',
            },
          });

          // theirSlot (recipient's slot) goes to requester
          await tx.event.update({
            where: { id: swapRequest.theirSlotId },
            data: {
              userId: swapRequest.requesterId,
              status: 'BUSY',
            },
          });

          return {
            status: 'ACCEPTED',
            message: 'Swap request accepted successfully. Slots have been exchanged.',
          };
        } else {
          // REJECT: Reset both slots to SWAPPABLE
          
          // Update swap request status
          await tx.swapRequest.update({
            where: { id: requestId },
            data: { status: 'REJECTED' },
          });

          // Reset both slots to SWAPPABLE
          await tx.event.update({
            where: { id: swapRequest.mySlotId },
            data: { status: 'SWAPPABLE' },
          });

          await tx.event.update({
            where: { id: swapRequest.theirSlotId },
            data: { status: 'SWAPPABLE' },
          });

          return {
            status: 'REJECTED',
            message: 'Swap request rejected. Both slots are now available for swapping again.',
          };
        }
      });

      res.json(result);
    } catch (error: any) {
      console.error('Swap response error:', error);
      res.status(400).json({ error: error.message || 'Failed to process swap response' });
    }
  }
);

export default router;
