// utils/renderDefaultCellValue.tsx
import React from "react";
import { Typography } from "@mui/material";

export const renderDefaultCellValue = (
  value: unknown
): React.ReactNode => {
  // Primitive types
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return <Typography fontSize={{xs:13, md:14}}>{String(value)}</Typography>;
  }

  // Date
  if (value instanceof Date) {
    return <Typography fontSize={{xs:13, md:14}}>{value.toLocaleDateString()}</Typography>;
  }

  // Array
  if (Array.isArray(value)) {
    const data = value
      .map((item) => {
        if (typeof item === "object" && item !== null) {
          return renderDefaultCellValue(item); // recursion
        }
        return String(item);
      })
      .join(", ");

    return <Typography fontSize={{xs:13, md:14}}>{data}</Typography>;
  }

  // Object
  if (typeof value === "object" && value !== null) {
    const keys = Object.keys(value);
    if (keys.length > 0) {
      // pick first key that's not "_id"
      const key =
        keys.find((k) => k !== "_id") || keys[0];

      return (
        <Typography fontSize={{xs:13, md:14}}>
          {String((value as any)[key])}
        </Typography>
      );
    }
    return <Typography fontSize={{xs:13, md:14}}>N/A</Typography>;
  }

  return <Typography fontSize={{xs:13, md:14}}>N/A</Typography>;
};
