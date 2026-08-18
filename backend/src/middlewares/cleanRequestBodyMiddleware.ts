import { Request, Response, NextFunction } from "express";
import { AnySchema } from "yup";
export const clean = (obj: Record<string, any>): void => {
  for (const key in obj) {
    const val = obj[key];
    console.log("value length",val)

    if (val == null || val === "") {
      delete obj[key];
      continue;
    }

    if (Array.isArray(val)) {
      for (let i = val.length - 1; i >= 0; i--) {
        const item = val[i];

        if (item == null || item === "") {
          val.splice(i, 1);
        } else if (typeof item === "object") {
          clean(item);
        }
      }

      if (val.length === 0) delete obj[key];
      continue;
    }

    if (typeof val === "object") {
      clean(val);

      // 🔥 faster empty check
      let isEmpty = true;
      for (const _k in val) {
        isEmpty = false;
        break;
      }

      if (isEmpty) delete obj[key];
    }
  }
};

export const parseCleanValidate = async <T = any>(
  rawData: any,
  schema: AnySchema
): Promise<T> => {
  let data;

  // 1. Parse safely
  try {
    data = typeof rawData === "string"
      ? JSON.parse(rawData)
      : rawData;
  } catch {
    throw new Error("Invalid JSON format");
  }

  // 2. Clean only if parse succeeded
  if (data && typeof data === "object") {
    clean(data);
  }

  // 3. Validate
  return await schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });
};
export const cleanRequestBodyMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const body = req.body;
  // console.log("before clean up",req.body)

  if (body && typeof body === "object") {
    clean(body);
  }
  //  console.log("after clean up",req.body)
  next();
};