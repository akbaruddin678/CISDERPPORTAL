import React, { useEffect, useState } from "react";
import {
  Box,
  Container,
  Typography,
  TextField,
  FormControlLabel,
  Checkbox,
  Radio,
  RadioGroup,
  Button,
  Paper,
  Alert,
  Snackbar,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { getSurveys, addSurveyResponse, saveStudentResponse } from "./surveyStorage";

const SurveyForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [survey, setSurvey] = useState(null);
  const [answers, setAnswers] = useState({});
  const [alert, setAlert] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    const surveys = getSurveys();
    const found = surveys.find((s) => s.id === id); // Removed parseInt since id is string
    if (!found) {
      navigate("/landing/cms/student");
    } else {
      setSurvey(found);
    }
  }, [id, navigate]);

  const handleAnswerChange = (qid, value) => {
    setAnswers({ ...answers, [qid]: value });
  };

  const handleCheckboxChange = (qid, option) => {
    const existing = answers[qid] || [];
    if (existing.includes(option)) {
      setAnswers({ ...answers, [qid]: existing.filter((o) => o !== option) });
    } else {
      setAnswers({ ...answers, [qid]: [...existing, option] });
    }
  };

  const handleSubmit = () => {
    // Check for required questions
    const incompleteQuestions = survey.questions.filter(
      (q) => q.required && (!answers[q.id] || (Array.isArray(answers[q.id]) && answers[q.id].length === 0))
    );

    if (incompleteQuestions.length > 0) {
      setAlert({
        open: true,
        message: "Please answer all required questions.",
        severity: "error"
      });
      return;
    }

    try {
      // Get student ID from localStorage or generate one
      const studentId = localStorage.getItem("studentId") || `student_${Date.now()}`;
      localStorage.setItem("studentId", studentId);

      // Save response to both survey and student records
      const responseData = {
        studentId,
        answers,
        submittedAt: new Date().toISOString()
      };

      // Add to survey responses
      addSurveyResponse(survey.id, responseData);
      
      // Save to student's response history
      saveStudentResponse(studentId, survey.id, answers);

      setAlert({
        open: true,
        message: "Survey submitted successfully!",
        severity: "success"
      });

      // Navigate after showing success message
      setTimeout(() => {
        navigate("/landing/cms/student");
      }, 1500);

    } catch (error) {
      console.error("Error submitting survey:", error);
      setAlert({
        open: true,
        message: "Error submitting survey. Please try again.",
        severity: "error"
      });
    }
  };

  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };

  if (!survey) {
    return (
      <Box sx={{ bgcolor: "#f4f6f8", minHeight: "100vh", py: 5 }}>
        <Container maxWidth="md">
          <Typography variant="h6" textAlign="center">
            Loading survey...
          </Typography>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: "#f4f6f8", minHeight: "100vh", py: 5 }}>
      <Container maxWidth="md">
        <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
          <Typography variant="h4" fontWeight={700} color="secondary" gutterBottom>
            {survey.title}
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={3}>
            {survey.description}
          </Typography>

          {survey.questions.map((q, index) => (
            <Box key={q.id} mb={4} p={2} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                {index + 1}. {q.questionText || q.text} {/* Support both questionText and text */}
                {q.required && <span style={{ color: "red" }}> *</span>}
              </Typography>

              {/* Short Answer */}
              {q.type === "short" && (
                <TextField
                  fullWidth
                  placeholder="Your answer"
                  margin="dense"
                  value={answers[q.id] || ""}
                  onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                  variant="outlined"
                />
              )}

              {/* Paragraph */}
              {q.type === "paragraph" && (
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Your answer"
                  margin="dense"
                  value={answers[q.id] || ""}
                  onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                  variant="outlined"
                />
              )}

              {/* Multiple Choice */}
              {q.type === "multiple" && (
                <RadioGroup
                  value={answers[q.id] || ""}
                  onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                >
                  {q.options.map((opt, i) => (
                    <FormControlLabel
                      key={i}
                      value={opt}
                      control={<Radio color="secondary" />}
                      label={opt}
                    />
                  ))}
                </RadioGroup>
              )}

              {/* Checkbox */}
              {q.type === "checkbox" && (
                <Box>
                  {q.options.map((opt, i) => (
                    <FormControlLabel
                      key={i}
                      control={
                        <Checkbox
                          color="secondary"
                          checked={answers[q.id]?.includes(opt) || false}
                          onChange={() => handleCheckboxChange(q.id, opt)}
                        />
                      }
                      label={opt}
                    />
                  ))}
                </Box>
              )}

              {/* Rating Scale */}
              {q.type === "rating" && (
                <RadioGroup
                  row
                  value={answers[q.id] || ""}
                  onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                >
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <FormControlLabel
                      key={rating}
                      value={rating.toString()}
                      control={<Radio color="secondary" />}
                      label={rating}
                      labelPlacement="top"
                    />
                  ))}
                </RadioGroup>
              )}
            </Box>
          ))}

          <Button
            variant="contained"
            color="secondary"
            fullWidth
            size="large"
            sx={{ mt: 3, py: 1.5, fontWeight: 600, textTransform: "none", fontSize: "1.1rem" }}
            onClick={handleSubmit}
          >
            Submit Survey
          </Button>
        </Paper>

        <Snackbar 
          open={alert.open} 
          autoHideDuration={6000} 
          onClose={handleCloseAlert}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={handleCloseAlert} severity={alert.severity} sx={{ width: '100%' }}>
            {alert.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

export default SurveyForm;