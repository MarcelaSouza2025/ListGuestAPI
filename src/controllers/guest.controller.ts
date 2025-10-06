// src/controllers/guest.controller.ts
import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { prisma } from '../config/prisma.js';
import { AuthedRequest } from '../middlewares/auth.js';
import type { GuestStatus } from '@prisma/client';

const ALLOWED_STATUS = new Set<GuestStatus>(['pending', 'present', 'absent']);

function parseBirthdateOr400(birthdate: unknown) {
  if (birthdate === undefined) return undefined;
  const d = new Date(String(birthdate));
  if (isNaN(d.getTime())) throw new Error('INVALID_BIRTHDATE');
  return d;
}

export async function createGuest(req: AuthedRequest, res: Response) {
  try {
    // defesa extra: apenas admin cria convidados
    if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Admins only' });

    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { eventId } = req.params;
    const { name, birthdate, document, status } = req.body as {
      name: string;
      birthdate: string;
      document: string;
      status?: GuestStatus;
    };

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (status && !ALLOWED_STATUS.has(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    let birth: Date | undefined;
    try {
      birth = parseBirthdateOr400(birthdate);
    } catch {
      return res.status(400).json({ message: 'Invalid birthdate' });
    }

    const guest = await prisma.guest.create({
      data: {
        eventId,
        name,
        birthdate: birth!,
        document,
        status: status ?? 'pending',
        createdById: req.user!.id,
        updatedById: req.user!.id
      },
      include: {
        event: { select: { id: true, title: true, date: true, location: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        updatedBy: { select: { id: true, name: true, email: true } }
      }
    });

    return res.status(201).json(guest);
  } catch (e: any) {
    if (e?.message === 'INVALID_BIRTHDATE') {
      return res.status(400).json({ message: 'Invalid birthdate' });
    }
    return res.status(500).json({ message: 'Create guest error', error: e.message });
  }
}

export async function listGuests(req: Request, res: Response) {
  const { eventId } = req.params;
  const guests = await prisma.guest.findMany({
    where: { eventId },
    orderBy: [{ name: 'asc' }],
    include: {
      event: { select: { id: true, title: true, date: true, location: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      updatedBy: { select: { id: true, name: true, email: true } }
    }
  });
  return res.json(guests);
}

export async function getGuest(req: Request, res: Response) {
  const { eventId, id } = req.params;
  const guest = await prisma.guest.findFirst({
    where: { id, eventId },
    include: {
      event: { select: { id: true, title: true, date: true, location: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      updatedBy: { select: { id: true, name: true, email: true } }
    }
  });
  if (!guest) return res.status(404).json({ message: 'Guest not found' });
  return res.json(guest);
}

export async function updateGuest(req: AuthedRequest, res: Response) {
  try {
    const { eventId, id } = req.params;
    const isAdmin = req.user?.role === 'admin';

    // garante que pertence ao evento informado
    const existing = await prisma.guest.findFirst({ where: { id, eventId } });
    if (!existing) return res.status(404).json({ message: 'Guest not found' });

    if (!isAdmin) {
      // Usuário comum: só pode alterar "status"
      const extraKeys = Object.keys(req.body).filter(k => k !== 'status');
      if (extraKeys.length) {
        return res.status(403).json({ message: 'Users can only update "status"' });
      }
      const { status } = req.body as { status?: GuestStatus };
      if (!status || !ALLOWED_STATUS.has(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      const updated = await prisma.guest.update({
        where: { id },
        data: { status, updatedById: req.user!.id },
        include: {
          event: { select: { id: true, title: true, date: true, location: true } },
          createdBy: { select: { id: true, name: true, email: true } },
          updatedBy: { select: { id: true, name: true, email: true } }
        }
      });
      return res.json(updated);
    }

    // Admin: pode alterar todos os campos
    const { name, birthdate, document, status } = req.body as {
      name?: string; birthdate?: string; document?: string; status?: GuestStatus;
    };

    const data: any = { updatedById: req.user!.id };
    if (name !== undefined) data.name = name;
    if (document !== undefined) data.document = document;
    if (status !== undefined) {
      if (!ALLOWED_STATUS.has(status)) return res.status(400).json({ message: 'Invalid status' });
      data.status = status; // <- tipado como GuestStatus
    }
    if (birthdate !== undefined) {
      let b: Date;
      try {
        b = parseBirthdateOr400(birthdate)!;
      } catch {
        return res.status(400).json({ message: 'Invalid birthdate' });
      }
      data.birthdate = b;
    }

    const updated = await prisma.guest.update({
      where: { id },
      data,
      include: {
        event: { select: { id: true, title: true, date: true, location: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        updatedBy: { select: { id: true, name: true, email: true } }
      }
    });

    return res.json(updated);
  } catch (e: any) {
    return res.status(500).json({ message: 'Update guest error', error: e.message });
  }
}

export async function deleteGuest(req: AuthedRequest, res: Response) {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Admins only' });

    const { eventId, id } = req.params;

    // garante que pertence ao evento informado
    const existing = await prisma.guest.findFirst({ where: { id, eventId } });
    if (!existing) return res.status(404).json({ message: 'Guest not found' });

    await prisma.guest.delete({ where: { id } });
    return res.json({ message: 'Guest deleted' });
  } catch (e: any) {
    return res.status(500).json({ message: 'Delete guest error', error: e.message });
  }
}
