jest.mock('../../src/config/db', () => ({
    booking: { findFirst: jest.fn() },
  }));
  
  const prisma = require('../../src/config/db');
  const { hasConflict } = require('../../src/modules/scheduling/scheduling.service');
  
  describe('Conflict Detection', () => {
    beforeEach(() => jest.clearAllMocks());
  
    it('returns false when no conflict exists', async () => {
      prisma.booking.findFirst.mockResolvedValue(null);
      const result = await hasConflict({
        instructorId: 'instructor-1',
        date: '2026-03-01',
        startTime: '09:00',
        endTime: '10:00',
      });
      expect(result).toBe(false);
    });
  
    it('returns true when instructor is double booked', async () => {
      prisma.booking.findFirst.mockResolvedValue({ id: 'existing-booking' });
      const result = await hasConflict({
        instructorId: 'instructor-1',
        date: '2026-03-01',
        startTime: '09:00',
        endTime: '10:00',
      });
      expect(result).toBe(true);
    });
  
    it('returns false when excluded booking is the only conflict', async () => {
      prisma.booking.findFirst.mockResolvedValue(null);
      const result = await hasConflict({
        instructorId: 'instructor-1',
        date: '2026-03-01',
        startTime: '09:00',
        endTime: '10:00',
        excludeBookingId: 'booking-to-exclude',
      });
      expect(result).toBe(false);
    });
  
    it('detects partial overlap - new booking starts during existing', async () => {
      prisma.booking.findFirst.mockResolvedValue({ id: 'conflict' });
      const result = await hasConflict({
        instructorId: 'instructor-1',
        date: '2026-03-01',
        startTime: '09:30',
        endTime: '10:30',
      });
      expect(result).toBe(true);
    });
  
    it('does not flag back-to-back bookings as conflict', async () => {
      prisma.booking.findFirst.mockResolvedValue(null);
      const result = await hasConflict({
        instructorId: 'instructor-1',
        date: '2026-03-01',
        startTime: '10:00',
        endTime: '11:00',
      });
      expect(result).toBe(false);
    });
  });