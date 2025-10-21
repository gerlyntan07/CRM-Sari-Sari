// src/components/FormattedDate.jsx
import React from "react";

const FormattedDate = ({ date, className }) => {
  if (!date) return null;

  const formatted = new Date(date).toLocaleString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return <p className={className}>{formatted}</p>;
};

export default FormattedDate;
