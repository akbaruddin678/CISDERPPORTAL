import React, { useState } from "react";
import { Box, Typography, TextField, MenuItem, Button, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from "@mui/material";
import { Upload, Trash2, FileText } from "lucide-react";

const sectionSx = { fontFamily: "'Montserrat', sans-serif" };
const fieldSx = { "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "#fff", fontFamily: "'Montserrat', sans-serif" } };

const CATEGORIES = ["Onboarding", "Identity", "Academic", "Experience", "Contract", "Financial", "Medical", "Compliance", "Other"];

const SUGGESTED_DOCS = [
  ["Signed Offer Letter / Employment Contract", "Contract"],
  ["CNIC / Passport Copy", "Identity"],
  ["Attested Degree / Transcript", "Academic"],
  ["Experience Certificate", "Experience"],
  ["Medical Fitness Certificate", "Medical"],
  ["Police Clearance / Background Check", "Compliance"],
  ["Voided Cheque (payroll verification)", "Financial"],
];

const HrOnboardStep7Documents = ({ pendingDocuments, addPendingDocument, removePendingDocument, publicMode }) => {
  // No self-declared financial data on the public wizard (Payroll is
  // skipped entirely there), so the "Financial" document category and its
  // suggested voided-cheque upload don't apply.
  const categories = publicMode ? CATEGORIES.filter((c) => c !== "Financial") : CATEGORIES;
  const suggestedDocs = publicMode ? SUGGESTED_DOCS.filter(([, cat]) => cat !== "Financial") : SUGGESTED_DOCS;
  const [file, setFile] = useState(null);
  const [docType, setDocType] = useState("");
  const [category, setCategory] = useState("Onboarding");
  const [expiryDate, setExpiryDate] = useState("");

  const handleAdd = () => {
    if (!file || !docType) return;
    addPendingDocument({ file, docType, category, expiryDate });
    setFile(null);
    setDocType("");
    setCategory("Onboarding");
    setExpiryDate("");
    const input = document.getElementById("hr-onboard-doc-input");
    if (input) input.value = "";
  };

  return (
    <Box>
      <Typography variant="overline" fontWeight={800} color="#94a3b8" sx={sectionSx} display="flex" alignItems="center" gap={1}>
        <FileText size={16} /> Document Vault
      </Typography>
      <Paper elevation={0} sx={{ p: 1.5, mt: 1, mb: 3, bgcolor: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 2 }}>
        <Typography fontSize={12.5} color="#1e40af" sx={sectionSx}>
          Entirely optional here — attach what's already on hand now, or upload the rest later from the employee's
          Profile page. Suggested documents: {suggestedDocs.map(([label]) => label).join(", ")}.
        </Typography>
      </Paper>

      <Box display="flex" gap={1.5} flexWrap="wrap" alignItems="center" mb={3}>
        <TextField size="small" label="Document Type" placeholder="e.g. CNIC Copy" value={docType} onChange={(e) => setDocType(e.target.value)} sx={{ ...fieldSx, minWidth: 220 }} />
        <TextField select size="small" label="Category" value={category} onChange={(e) => setCategory(e.target.value)} sx={{ ...fieldSx, minWidth: 160 }}>
          {categories.map((c) => (
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
        <Button component="label" variant="outlined" sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, ...sectionSx }}>
          {file ? file.name.slice(0, 20) : "Choose File"}
          <input id="hr-onboard-doc-input" type="file" hidden accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => setFile(e.target.files[0] || null)} />
        </Button>
        <Button
          variant="contained"
          startIcon={<Upload size={16} />}
          onClick={handleAdd}
          disabled={!file || !docType}
          sx={{ bgcolor: "#2563eb", fontWeight: 700, borderRadius: 2, boxShadow: "none", textTransform: "none", ...sectionSx }}
        >
          Attach
        </Button>
      </Box>

      {pendingDocuments.length === 0 ? (
        <Typography variant="body2" color="#94a3b8" sx={sectionSx}>
          No documents attached yet.
        </Typography>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "#f8fafc" }}>
                {["Type", "Category", "File", "Expiry", ""].map((h) => (
                  <TableCell key={h} sx={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", ...sectionSx }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {pendingDocuments.map((d, idx) => (
                <TableRow key={idx} hover>
                  <TableCell sx={sectionSx}>{d.docType}</TableCell>
                  <TableCell sx={sectionSx}>{d.category}</TableCell>
                  <TableCell sx={sectionSx}>{d.file.name}</TableCell>
                  <TableCell sx={sectionSx}>{d.expiryDate || "—"}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => removePendingDocument(idx)}>
                      <Trash2 size={16} color="#dc2626" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default HrOnboardStep7Documents;
