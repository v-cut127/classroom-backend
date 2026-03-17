import express from "express";
import {and, eq, getTableColumns, sql} from "drizzle-orm";
import {enrollments, user, classes} from "../db/schema/schema.js";
import { db } from "../db/index.js";

const router = express.Router();

// Get enrollments for a specific class
router.get('/class/:classId', async (req, res) => {
    try {
        const { classId } = req.params;
        const students = await db
            .select({
                ...getTableColumns(user),
            })
            .from(enrollments)
            .innerJoin(user, eq(enrollments.studentId, user.id))
            .where(eq(enrollments.classId, parseInt(classId)));

        res.status(200).json({ data: students });
    } catch (e) {
        console.error(`GET /enrollments/class/${req.params.classId} error: ${e}`);
        res.status(500).json({ error: 'Failed to load enrolled students' });
    }
});

// Enroll a student in a class
router.post('/', async (req, res) => {
    try {
        const { studentId, classId } = req.body;
        
        // Check capacity
        const classData = await db.select().from(classes).where(eq(classes.id, classId)).limit(1);
        if (classData.length === 0) return res.status(404).json({ error: 'Class not found' });
        
        const countResult = await db.select({ count: sql<number>`count(*)` }).from(enrollments).where(eq(enrollments.classId, classId));
        if (countResult[0].count >= classData[0].capacity) {
            return res.status(400).json({ error: 'Class is full' });
        }

        const result = await db.insert(enrollments).values({ studentId, classId }).returning();
        res.status(201).json({ data: result[0] });
    } catch (e) {
        res.status(500).json({ error: 'Failed to enroll student' });
    }
});

// Unenroll a student from a class
router.delete('/:classId/:studentId', async (req, res) => {
    try {
        const { classId, studentId } = req.params;
        await db.delete(enrollments).where(
            and(
                eq(enrollments.classId, parseInt(classId)),
                eq(enrollments.studentId, studentId)
            )
        );
        res.status(200).json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Failed to unenroll student' });
    }
});

export default router;
