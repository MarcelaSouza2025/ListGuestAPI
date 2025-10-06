import { validationResult } from 'express-validator';
import { prisma } from '../config/prisma.js';
export async function createEvent(req, res) {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(400).json({ errors: errors.array() });
        const { title, artist, date, location } = req.body;
        const event = await prisma.event.create({
            data: {
                title, artist, date: new Date(date), location,
                createdById: req.user.id, updatedById: req.user.id
            },
            include: {
                createdBy: { select: { name: true, email: true, id: true } },
                updatedBy: { select: { name: true, email: true, id: true } }
            }
        });
        return res.status(201).json(event);
    }
    catch (e) {
        return res.status(500).json({ message: 'Create event error', error: e.message });
    }
}
export async function listEvents(_req, res) {
    const events = await prisma.event.findMany({
        orderBy: { date: 'asc' },
        include: {
            createdBy: { select: { id: true, name: true, email: true } },
            updatedBy: { select: { id: true, name: true, email: true } }
        }
    });
    return res.json(events);
}
export async function getEvent(req, res) {
    const event = await prisma.event.findUnique({
        where: { id: req.params.id },
        include: {
            createdBy: { select: { id: true, name: true, email: true } },
            updatedBy: { select: { id: true, name: true, email: true } }
        }
    });
    if (!event)
        return res.status(404).json({ message: 'Event not found' });
    return res.json(event);
}
export async function updateEvent(req, res) {
    const { title, artist, date, location } = req.body;
    const event = await prisma.event.update({
        where: { id: req.params.id },
        data: {
            ...(title !== undefined ? { title } : {}),
            ...(artist !== undefined ? { artist } : {}),
            ...(date !== undefined ? { date: new Date(date) } : {}),
            ...(location !== undefined ? { location } : {}),
            updatedById: req.user.id
        },
        include: {
            createdBy: { select: { id: true, name: true, email: true } },
            updatedBy: { select: { id: true, name: true, email: true } }
        }
    }).catch(() => null);
    if (!event)
        return res.status(404).json({ message: 'Event not found' });
    return res.json(event);
}
export async function deleteEvent(req, res) {
    const event = await prisma.event.delete({ where: { id: req.params.id } }).catch(() => null);
    if (!event)
        return res.status(404).json({ message: 'Event not found' });
    return res.json({ message: 'Event deleted' });
}
