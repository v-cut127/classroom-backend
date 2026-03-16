import express from "express";
import {db} from "../db/index.js";
import {classes} from "../db/schema/app.js";

const router = express.Router();

router.post('/', async(req, res) => {
    try{
        const [createdClass] = await db.insert(classes).values({
            ...req.body,
            inviteCode: Math.random().toString(36).substring(2, 9),
            schedules: []
        }).returning({id: classes.id});

        if(!createdClass) throw new Error("Failed to create class");

        res.status(201).json({
            data: createdClass,
            message: "Class created successfully"
        });

    }catch(e){
        console.error(`POST /classes error ${e}`);
        res.status(500).json({error: e instanceof Error ? e.message : 'Failed to create class'});
    }
})

export default router;