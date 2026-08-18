import { Router } from "express";
import {createNote, deleteNote, getAllNotes, updateNote } from './notes.controller'
import { Middleware } from "middlewares";
const {verifyToken}=Middleware
const router = Router();
// Note routes
// Create a new carrier
router.post('/:loadid',verifyToken, createNote);

// Get all carriers
router.get('/:loadid',verifyToken, getAllNotes);

// Get a carrier by ID
router.delete('/:id',verifyToken, deleteNote);

// Update a carrier by ID
router.put('/:id',verifyToken, updateNote);

export default router;
