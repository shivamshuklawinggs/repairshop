import { Request, Response, NextFunction } from 'express';
import Note  from 'models/Note.model';
import { AppError } from 'middlewares/error';
/**
 * @description Create a new Note
 * @type POST
 * @path /api/Notes
 */
const createNote = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const payload=req.body
    const userId=req.user?._id
    payload.createdBy=userId
    payload.updatedBy=userId
    payload.manager=req.user?.manager
    payload.ownerAdminId=req.user?.ownerAdminId
    const data = await Note.create(payload);
    res.status(201).json({ data: data, success: true, statusCode: 201 });
  } catch (error) {
    next(error);
  }
};

/**
 * @description Get all Notes
 * @type GET
 * @path /api/Notes
 */
const getAllNotes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let {  loadid } = req.params;
   
    const Notes = await Note.find({
      loadid:loadid
    }).sort({updatedAt:-1}).populate({
      path:"updatedBy",
      select:"name email",
    }).populate({
      path:"createdBy",
      select:"name email"
    })
    res.status(200).json({
      data: Notes,
      success: true,
      statusCode: 200,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @description Update Note
 * @type PUT
 * @path /api/Notes/:id
 */
const updateNote = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId=req.user?._id
    req.body.updatedBy=userId
    const data = await Note.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!Note) {
      throw new AppError('Note not found', 404);
    }
    res.status(200).json({ data: data, success: true, statusCode: 200 });
  } catch (error) {
    next(error);
  }
};


/**
 * @description Delete Note
 * @type DELETE
 * @path /api/Notes/:id
 */
const deleteNote = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await Note.findByIdAndDelete(req.params.id);
    if (!Note) {
      throw new AppError('Note not found', 404);
    }
    res.status(200).json({ data: data, success: true, statusCode: 200 });
  } catch (error) {
    next(error);
  }
};

export {
  createNote,
  getAllNotes,
  updateNote,
  deleteNote
};
