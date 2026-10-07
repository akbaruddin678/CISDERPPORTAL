import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
} from "@mui/material";
import { Upload, Trash2, CheckCircle2, ExternalLink } from "lucide-react";

const sectionSx = { fontFamily: "'Montserrat', sans-serif" };
const fieldSx = { "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "#fff", fontFamily: "'Montserrat', sans-serif" } };

const CATEGORIES = ["Onboarding", "Academic", "Identity", "Contract", "Financial", "Other"];

const daysUntil = (dateStr) => {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
};

const HrDocumentsTab = ({ documents, isLoadingDocs, uploadDocument, isUploadingDoc, verifyDocument, deleteDocument }) => {
  const [file, setFile] = useState(null);
  const [docType, setDocType] = useState("");
  const [category, setCategory] = useState("Other");
  const [expiryDate, setExpiryDate] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  const handleUpload = async () => {
    const ok = await uploadDocument({ file, docType, category, expiryDate: expiryDate || null });
    if (ok) {
      setFile(null);
      setDocType("");
      setCategory("Other");
      setExpiryDate("");
      const input = document.getElementById("hr-doc-file-input");
      if (input) input.value = "";
    }
  };

  const filteredDocs =
    categoryFilter === "ALL" ? documents : documents.filter((d) => d.category === categoryFilter);

  return (
    <Box>
      <Typography variant="overline" fontWeight={800} color="#94a3b8" sx={sectionSx}>
        Upload Document
      </Typography>
      <Box display="flex" gap={1.5} flexWrap="wrap" alignItems="center" mt={1} mb={4}>
        <TextField
          size="small"
          label="Document Type"
          placeholder="e.g. Transcript, CNIC, Contract"
          value={docType}
          onChange={(e) => setDocType(e.target.value)}
          sx={{ ...fieldSx, minWidth: 220 }}
        />
        <TextField
          select
          size="small"
          label="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          sx={{ ...fieldSx, minWidth: 160 }}
        >
          {CATEGORIES.map((c) => (
            <MenuItem key={c} value={c}>
              {c}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          size="small"
          type="date"
          label="Expiry Date (optional)"
          InputLabelProps={{ shrink: true }}
          value={expiryDate}
          onChange={(e) => setExpiryDate(e.target.value)}
          sx={{ ...fieldSx, minWidth: 180 }}
        />
        <Button
          component="label"
          variant="outlined"
          sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, fontFamily: "'Montserrat', sans-serif" }}
        >
          {file ? file.name.slice(0, 20) : "Choose File"}
          <input
            id="hr-doc-file-input"
            type="file"
            hidden
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={(e) => setFile(e.target.files[0] || null)}
          />
        </Button>
        <Button
          variant="contained"
          startIcon={<Upload size={16} />}
          onClick={handleUpload}
          disabled={isUploadingDoc || !file || !docType}
          sx={{ bgcolor: "#2563eb", fontWeight: 700, borderRadius: 2, boxShadow: "none", textTransform: "none", fontFamily: "'Montserrat', sans-serif" }}
        >
          {isUploadingDoc ? "Uploading..." : "Upload"}
        </Button>
      </Box>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
        <Typography variant="subtitle2" fontWeight={800} sx={sectionSx}>
          Documents
        </Typography>
        <TextField
          select
          size="small"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          sx={{ ...fieldSx, minWidth: 160 }}
        >
          <MenuItem value="ALL">All Categories</MenuItem>
          {CATEGORIES.map((c) => (
            <MenuItem key={c} value={c}>
              {c}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      {isLoadingDocs ? (
        <Box py={6} textAlign="center">
          <CircularProgress size={28} sx={{ color: "#2563eb" }} />
        </Box>
      ) : filteredDocs.length === 0 ? (
        <Typography variant="body2" color="#94a3b8" sx={sectionSx} py={4} textAlign="center">
          No documents in this category.
        </Typography>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "#f8fafc" }}>
                {["Type", "Category", "Uploaded", "Expiry", "Status", "Actions"].map((h) => (
                  <TableCell key={h} sx={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", fontFamily: "'Montserrat', sans-serif" }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredDocs.map((doc) => {
                const expDays = daysUntil(doc.expiryDate);
                const isExpiringSoon = expDays !== null && expDays <= 30;
                return (
                  <TableRow key={doc._id} hover>
                    <TableCell sx={sectionSx}>
                      <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#2563eb", fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
                        {doc.docType} <ExternalLink size={12} />
                      </a>
                    </TableCell>
                    <TableCell sx={sectionSx}>
                      <Chip size="small" label={doc.category} sx={{ fontSize: 10, fontWeight: 700, bgcolor: "#eef2ff", color: "#4338ca" }} />
                    </TableCell>
                    <TableCell sx={sectionSx}>{new Date(doc.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell sx={sectionSx}>
                      {doc.expiryDate ? (
                        <span style={{ color: isExpiringSoon ? "#dc2626" : undefined, fontWeight: isExpiringSoon ? 700 : 400 }}>
                          {new Date(doc.expiryDate).toLocaleDateString()}
                          {isExpiringSoon && expDays >= 0 ? ` (${expDays}d)` : isExpiringSoon ? " (expired)" : ""}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={doc.verified ? "Verified" : "Unverified"}
                        sx={{
                          fontSize: 10,
                          fontWeight: 700,
                          bgcolor: doc.verified ? "#dcfce7" : "#fef9c3",
                          color: doc.verified ? "#166534" : "#854d0e",
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      {!doc.verified && (
                        <IconButton size="small" title="Verify" onClick={() => verifyDocument(doc._id)}>
                          <CheckCircle2 size={16} color="#059669" />
                        </IconButton>
                      )}
                      <IconButton size="small" title="Delete" onClick={() => deleteDocument(doc._id)}>
                        <Trash2 size={16} color="#dc2626" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default HrDocumentsTab;
