import express from "express";
import {and, eq, sql} from "drizzle-orm";
import {enrollments, user, classes, departments, subjects} from "../db/schema/schema.js";
import { db } from "../db/index.js";

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        // User Distribution
        const usersByRole = await db.select({
            role: user.role,
            count: sql<number>`count(*)`.mapWith(Number)
        }).from(user).groupBy(user.role);

        // Classes by Department
        const classesByDept = await db.select({
            departmentName: departments.name,
            count: sql<number>`count(*)`.mapWith(Number)
        }).from(classes)
          .innerJoin(subjects, eq(classes.subjectId, subjects.id))
          .innerJoin(departments, eq(subjects.departmentId, departments.id))
          .groupBy(departments.name);

        // Capacity Status
        const capacityStatus = await db.select({
            classId: classes.id,
            className: classes.name,
            capacity: classes.capacity,
            enrolledCount: sql<number>`count(${enrollments.studentId})`.mapWith(Number)
        }).from(classes)
          .leftJoin(enrollments, eq(classes.id, enrollments.classId))
          .groupBy(classes.id, classes.name, classes.capacity);

        // Key Metrics
        const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(user);
        const [classCount] = await db.select({ count: sql<number>`count(*)` }).from(classes);
        const [enrollmentCount] = await db.select({ count: sql<number>`count(*)` }).from(enrollments);

        // Enrollment Trends (last 7 days - mock or real if we have timestamps)
        // Since enrollments table in schema doesn't have timestamps, we might need to add it or mock it.
        // Let's check schema again. Enrollments doesn't have timestamps.
        // I'll return mock data for trends or just total for now.

        res.status(200).json({
            usersByRole,
            classesByDept,
            capacityStatus,
            metrics: {
                totalUsers: Number(userCount.count),
                totalClasses: Number(classCount.count),
                totalEnrollments: Number(enrollmentCount.count)
            }
        });

    } catch (e) {
        console.error(`GET /stats error: ${e}`);
        res.status(500).json({ error: 'Failed to load stats' });
    }
});

export default router;
