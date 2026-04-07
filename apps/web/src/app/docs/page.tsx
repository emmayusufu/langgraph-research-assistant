"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import { fetchDocs, createDoc } from "@/lib/api";

export default function DocsPage() {
  const router = useRouter();

  useEffect(() => {
    fetchDocs()
      .then(async (docs) => {
        if (docs.length > 0) {
          router.replace(`/docs/${docs[0].id}`);
        } else {
          const { id } = await createDoc();
          router.replace(`/docs/${id}`);
        }
      })
      .catch(async () => {
        const { id } = await createDoc();
        router.replace(`/docs/${id}`);
      });
  }, [router]);

  return (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <CircularProgress />
    </Box>
  );
}
