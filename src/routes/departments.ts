import express from "express";
import {and, desc, eq, getTableColumns, ilike, or, sql} from "drizzle-orm";
import {departments} from "../db/schema/schema.js";
import { db } from "../db/index.js";

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const { search, page = 1, limit = 10} = req.query;

        const currentPage = Math.max(1, parseInt(String(page), 10) || 1);
        const limitPerPage = Math.max(1, Math.min(100, parseInt(String(limit), 10) || 10));

        const offset = (currentPage - 1) * limitPerPage;

        const filterConditions = [];

        if (search) {
            filterConditions.push(
                or(
                    ilike(departments.name, `%${search}%`),
                    ilike(departments.code, `%${search}%`)
                )
            );
        }

        const whereClause = filterConditions.length > 0 ? and(...filterConditions) : undefined;

        const countResult = await db
            .select({ count: sql<number>`count(*)`})
            .from(departments)
            .where(whereClause);

        const totalCount = Number(countResult[0]?.count) || 0;

        const departmentsList = await db
            .select({
                ...getTableColumns(departments),
            }).from(departments)
            .where(whereClause)
            .orderBy(desc(departments.createdAt))
            .limit(limitPerPage)
            .offset(offset);

        res.status(200).json({
            data: departmentsList,
            pagination: {
                page: currentPage,
                limit: limitPerPage,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limitPerPage),
            }
        })

    } catch (e) {
        console.error(`GET /departments error: ${e}`);
        res.status(500).json({ error: 'Failed to load departments' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.select().from(departments).where(eq(departments.id, parseInt(id))).limit(1);
        if (result.length === 0) {
            return res.status(404).json({ error: 'Department not found' });
        }
        res.status(200).json({ data: result[0] });
    } catch (e) {
        res.status(500).json({ error: 'Failed to load department' });
    }
});

router.post('/', async (req, res) => {
    try {
        const { name, code, description } = req.body;
        const result = await db.insert(departments).values({ name, code, description }).returning();
        res.status(201).json({ data: result[0] });
    } catch (e) {
        res.status(500).json({ error: 'Failed to create department' });
    }
});

router.patch('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, code, description } = req.body;
        const result = await db.update(departments)
            .set({ name, code, description, updatedAt: new Date() })
            .where(eq(departments.id, parseInt(id)))
            .returning();
        res.status(200).json({ data: result[0] });
    } catch (e) {
        res.status(500).json({ error: 'Failed to update department' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await db.delete(departments).where(eq(departments.id, parseInt(id)));
        res.status(200).json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Failed to delete department' });
    }
});

export default router;
