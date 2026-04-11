"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { styled } from "@mui/material/styles";
import type { TextFieldProps } from "@mui/material/TextField";

const StyledField = styled(TextField)<{ error?: boolean }>(({ theme, error }) => ({
  "& .MuiOutlinedInput-root": {
    height: 43,
    borderRadius: 10,
    fontSize: "0.875rem",
    backgroundColor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.04)" : "#fafafa",
    transition: "all 0.2s ease",
    "& fieldset": {
      borderColor: error ? theme.palette.error.main : theme.palette.divider,
      borderWidth: 1.5,
    },
    "&:hover fieldset": {
      borderColor: error ? theme.palette.error.main : theme.palette.primary.main,
      borderWidth: 1.5,
    },
    "&.Mui-focused": {
      backgroundColor: theme.palette.background.paper,
    },
    "&.Mui-focused fieldset": {
      borderColor: error ? theme.palette.error.main : theme.palette.primary.main,
      borderWidth: 2,
    },
    "&.Mui-disabled fieldset": {
      borderColor: theme.palette.divider,
    },
  },
  "& .MuiInputBase-input": {
    padding: "0 14px",
    fontSize: "0.875rem",
    "&::placeholder": {
      color: theme.palette.text.disabled,
      opacity: 1,
    },
    "& :-webkit-autofill": {
      WebkitBoxShadow: "0 0 0 1000px transparent inset",
      transition: "background-color 5000s ease-in-out 0s",
    },
  },
}));

type Props = Omit<TextFieldProps, "label" | "variant"> & {
  label?: string;
  required?: boolean;
  errorText?: string;
};

export function FormInput({ label, required, type, error, errorText, helperText, slotProps, ...rest }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  const passwordAdornment = isPassword ? {
    endAdornment: (
      <InputAdornment position="end">
        <IconButton onClick={() => setShowPassword((v) => !v)} edge="end" size="small" tabIndex={-1}>
          {showPassword
            ? <VisibilityOffOutlinedIcon sx={{ fontSize: 17 }} />
            : <VisibilityOutlinedIcon sx={{ fontSize: 17 }} />}
        </IconButton>
      </InputAdornment>
    ),
  } : {};

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75, width: "100%" }}>
      {label && (
        <Box sx={{ display: "flex", gap: 0.5, pl: "2px" }}>
          <Typography fontSize="0.75rem" fontWeight={500} color="text.secondary">
            {label}
          </Typography>
          {required && <Typography fontSize="0.75rem" color="error">*</Typography>}
        </Box>
      )}
      <StyledField
        {...rest}
        type={isPassword ? (showPassword ? "text" : "password") : type}
        variant="outlined"
        fullWidth
        error={!!error}
        slotProps={{
          ...slotProps,
          input: {
            ...(slotProps as { input?: object })?.input,
            ...passwordAdornment,
          },
        }}
      />
      {(errorText || helperText) && (
        <Typography fontSize="0.7rem" color={error ? "error" : "text.disabled"} pl="4px">
          {errorText ?? helperText}
        </Typography>
      )}
    </Box>
  );
}
