import React, { useState, useEffect } from "react";
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  IconButton,
  Select,
  MenuItem,
  Divider,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Chip,
  Checkbox,
  ListItemText,
  OutlinedInput,
  FormGroup,
  Card,
  alpha,
  useTheme,
} from "@mui/material";
import { 
  AddCircle, 
  Delete, 
  Group, 
  School, 
  Person,
  Close,
  FormatListNumbered,
  RadioButtonChecked,
  CheckBox,
  ShortText,
  Subject,
  Star,
  Edit
} from "@mui/icons-material";
import { QUESTION_TYPES } from "./questionTypes";

const SurveyModalNew = ({ open, onClose, onCreate, editSurvey, isEditing = false }) => {
  const theme = useTheme();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [active, setActive] = useState(true);
  const [questions, setQuestions] = useState([
    { 
      id: Date.now(), 
      text: "", 
      type: "short", 
      required: false, 
      options: ["Option 1", "Option 2"] 
    },
  ]);

  const questionTypeIcons = {
    short: <ShortText />,
    paragraph: <Subject />,
    multiple: <RadioButtonChecked />,
    checkbox: <CheckBox />,
    rating: <Star />
  };

  useEffect(() => {
    if (open) {
      if (isEditing && editSurvey) {
        // Pre-populate form with editSurvey data
    
        setTitle(editSurvey.title || "");
        setDescription(editSurvey.description || "");
        setActive(editSurvey.isActive !== undefined ? editSurvey.isActive : true);
        
        // Convert survey questions to form format
        const formattedQuestions = editSurvey.questions?.map((q, index) => ({
          id: q.id || Date.now() + index,
          text: q.questionText || "",
          type: q.type || "short",
          required: q.required || false,
          options: q.options && q.options.length > 0 ? q.options : ["Option 1", "Option 2"]
        })) || [
          { 
            id: Date.now(), 
            text: "", 
            type: "short", 
            required: false, 
            options: ["Option 1", "Option 2"] 
          }
        ];
        
        setQuestions(formattedQuestions);
      } else {
        // Reset form for new survey
        setTitle("");
        setDescription("");
        setActive(true);
        setQuestions([
          { 
            id: Date.now(), 
            text: "", 
            type: "short", 
            required: false, 
            options: ["Option 1", "Option 2"] 
          },
        ]);
      }
    }
  }, [open, editSurvey, isEditing]);

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      { 
        id: Date.now() + Math.random(), 
        text: "", 
        type: "short", 
        required: false, 
        options: ["Option 1", "Option 2"] 
      },
    ]);
  };

  const handleRemoveQuestion = (id) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((q) => q.id !== id));
    }
  };

  const handleQuestionChange = (id, field, value) => {
    setQuestions(
      questions.map((q) =>
        q.id === id ? { ...q, [field]: value } : q
      )
    );
  };

  const handleAddOption = (id) => {
    setQuestions(
      questions.map((q) =>
        q.id === id
          ? { 
              ...q, 
              options: [...q.options, `Option ${q.options.length + 1}`] 
            }
          : q
      )
    );
  };

  const handleRemoveOption = (id, index) => {
    setQuestions(
      questions.map((q) =>
        q.id === id
          ? {
              ...q,
              options: q.options.filter((_, i) => i !== index),
            }
          : q
      )
    );
  };

  const handleOptionChange = (id, index, value) => {
    setQuestions(
      questions.map((q) =>
        q.id === id
          ? {
              ...q,
              options: q.options.map((opt, i) => (i === index ? value : opt)),
            }
          : q
      )
    );
  };

  const handleCreateSurvey = () => {
    if (!title.trim() || questions.length === 0) {
      alert("Please fill out all required fields.");
      return;
    }

    // Validate that all questions have text
    const invalidQuestions = questions.filter(q => !q.text.trim());
    if (invalidQuestions.length > 0) {
      alert("Please fill in all question texts.");
      return;
    }

    const surveyData = {
      title: title.trim(),
      description: description.trim(),
      isActive: active,
      questions: questions.map(q => ({
        id: `q_${q.id}`,
        questionText: q.text.trim(),
        type: q.type,
        required: q.required,
        options: (q.type === "multiple" || q.type === "checkbox" || q.type === "rating") ? q.options : []
      })),
      responses: editSurvey?.responses || [], // Preserve existing responses when editing
    };

    
    onCreate(surveyData);
    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  const QuestionCard = ({ question, index, onRemove }) => (
    <Card 
      elevation={1}
      sx={{ 
        p: 3, 
        mb: 3, 
        borderRadius: 3,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        background: alpha(theme.palette.background.paper, 0.8),
        position: 'relative',
        '&:hover': {
          borderColor: alpha(theme.palette.primary.main, 0.3),
        }
      }}
    >
      {/* Question Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3, gap: 2 }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            mt: 1
          }}
        >
          <Typography variant="body2" fontWeight={600} color="white">
            {index + 1}
          </Typography>
        </Box>
        
        <Box sx={{ flex: 1 }}>
          <TextField
            fullWidth
            label="Question Text *"
            value={question.text}
            onChange={(e) => handleQuestionChange(question.id, "text", e.target.value)}
            placeholder="Enter your question here..."
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                background: 'white',
              }
            }}
          />
        </Box>

        <IconButton 
          onClick={() => onRemove(question.id)} 
          color="error"
          disabled={questions.length === 1}
          sx={{
            border: `1px solid ${theme.palette.error.main}`,
            mt: 1
          }}
          title={questions.length === 1 ? "Cannot remove the only question" : "Remove question"}
        >
          <Delete fontSize="small" />
        </IconButton>
      </Box>

      {/* Question Type and Settings */}
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth variant="outlined">
            <InputLabel>Question Type</InputLabel>
            <Select
              value={question.type}
              onChange={(e) => handleQuestionChange(question.id, "type", e.target.value)}
              label="Question Type"
            >
              {QUESTION_TYPES.map((t) => (
                <MenuItem key={t.value} value={t.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {questionTypeIcons[t.value]}
                    {t.label}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControlLabel
            control={
              <Switch
                checked={question.required}
                onChange={(e) => handleQuestionChange(question.id, "required", e.target.checked)}
                color="primary"
              />
            }
            label={
              <Box>
                <Typography variant="body2" fontWeight={600}>
                  Required
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  User must answer this question
                </Typography>
              </Box>
            }
          />
        </Grid>
      </Grid>

      {/* Options for multiple choice, checkbox, and rating */}
      {(question.type === "multiple" || question.type === "checkbox" || question.type === "rating") && (
        <Box sx={{ mt: 3, pl: { xs: 0, sm: 4 } }}>
          <Typography variant="subtitle2" fontWeight={600} color="text.primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FormatListNumbered fontSize="small" />
            Options
          </Typography>
          
          {question.options.map((opt, i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              {question.type === "multiple" && <RadioButtonChecked color="disabled" fontSize="small" />}
              {question.type === "checkbox" && <CheckBox color="disabled" fontSize="small" />}
              {question.type === "rating" && <Star color="disabled" fontSize="small" />}
              
              <TextField
                value={opt}
                onChange={(e) => handleOptionChange(question.id, i, e.target.value)}
                placeholder={`Option ${i + 1}`}
                variant="outlined"
                fullWidth
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    background: 'white',
                  }
                }}
              />
              
              {question.options.length > 2 && (
                <IconButton 
                  size="small" 
                  color="error"
                  onClick={() => handleRemoveOption(question.id, i)}
                  sx={{ 
                    border: `1px solid ${theme.palette.error.main}`,
                    width: 32,
                    height: 32
                  }}
                >
                  <Delete fontSize="small" />
                </IconButton>
              )}
            </Box>
          ))}
          
          <Button
            size="small"
            variant="outlined"
            startIcon={<AddCircle />}
            onClick={() => handleAddOption(question.id)}
            sx={{ 
              mt: 1,
              borderRadius: 2
            }}
          >
            Add Option
          </Button>
          
          {question.type === "rating" && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              Rating scale from 1 to {question.options.length}
            </Typography>
          )}
        </Box>
      )}

      {/* Preview for text-based questions */}
      {(question.type === "short" || question.type === "paragraph") && (
        <Box sx={{ mt: 2, pl: { xs: 0, sm: 4 } }}>
          <Typography variant="caption" color="text.secondary">
            {question.type === "short" ? "Short text answer" : "Paragraph text answer"}
          </Typography>
        </Box>
      )}
    </Card>
  );

  return (
    <Modal open={open} onClose={handleClose}>
      <Box
        sx={{
          width: 800,
          maxWidth: "95vw",
          bgcolor: "background.paper",
          boxShadow: 24,
          mx: "auto",
          mt: "2vh",
          mb: "2vh",
          borderRadius: 3,
          maxHeight: "96vh",
          overflowY: "auto",
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 3,
            borderBottom: `1px solid ${theme.palette.divider}`,
            background: isEditing 
              ? 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)' 
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h5" fontWeight={700}>
                {isEditing ? 'Edit Survey' : 'Create New Survey'}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                {isEditing 
                  ? `Editing: ${editSurvey?.title || ''}` 
                  : 'Design your survey with multiple question types'
                }
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {isEditing && (
                <Chip 
                  icon={<Edit />} 
                  label="Editing" 
                  size="small" 
                  sx={{ 
                    background: 'rgba(255, 255, 255, 0.2)', 
                    color: 'white',
                    fontWeight: 600
                  }} 
                />
              )}
              <IconButton 
                onClick={handleClose}
                sx={{ 
                  color: 'white',
                  background: 'rgba(255, 255, 255, 0.2)',
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.3)',
                  }
                }}
              >
                <Close />
              </IconButton>
            </Box>
          </Box>
        </Box>

        {/* Content */}
        <Box sx={{ p: 3, flex: 1 }}>
          {/* Basic Information */}
          <Card sx={{ p: 3, mb: 4, borderRadius: 3 }} elevation={1}>
            <Typography variant="h6" fontWeight={600} gutterBottom color="primary">
              Basic Information
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  label="Survey Title *"
                  fullWidth
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a clear and descriptive survey title"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Description"
                  fullWidth
                  multiline
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the purpose of this survey..."
                  variant="outlined"
                />
              </Grid>
            </Grid>
          </Card>

          {/* Survey Status */}
          <Card sx={{ p: 3, mb: 4, borderRadius: 3 }} elevation={1}>
            <Typography variant="h6" fontWeight={600} gutterBottom color="primary">
              Survey Status
            </Typography>
            <FormControlLabel
              control={
                <Switch 
                  checked={active} 
                  onChange={(e) => setActive(e.target.checked)} 
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography variant="body1" fontWeight={600}>
                    {active ? "Active" : "Inactive"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {active 
                      ? "Survey is active and can receive responses" 
                      : "Survey is inactive and hidden from users"
                    }
                  </Typography>
                </Box>
              }
            />
            {isEditing && editSurvey?.responses && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                This survey has {editSurvey.responses.length} response{editSurvey.responses.length !== 1 ? 's' : ''}
              </Typography>
            )}
          </Card>

          {/* Questions Section */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6" fontWeight={600} color="primary">
                Survey Questions ({questions.length})
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip 
                  label={`${questions.filter(q => q.required).length} required`} 
                  color="primary" 
                  variant="outlined"
                  size="small"
                />
                {isEditing && (
                  <Chip 
                    label="Edit Mode" 
                    color="warning" 
                    size="small"
                    variant="filled"
                  />
                )}
              </Box>
            </Box>

            {questions.map((question, index) => (
              <QuestionCard
                key={question.id}
                question={question}
                index={index}
                onRemove={handleRemoveQuestion}
              />
            ))}

            <Button
              variant="outlined"
              fullWidth
              startIcon={<AddCircle />}
              onClick={handleAddQuestion}
              sx={{ 
                py: 2, 
                borderRadius: 3,
                borderStyle: 'dashed',
                borderWidth: 2,
                borderColor: 'primary.main',
                background: alpha(theme.palette.primary.main, 0.02),
                '&:hover': {
                  background: alpha(theme.palette.primary.main, 0.08),
                  borderStyle: 'solid',
                }
              }}
            >
              Add New Question
            </Button>
          </Box>
        </Box>

        {/* Footer Actions */}
        <Box
          sx={{
            p: 3,
            borderTop: `1px solid ${theme.palette.divider}`,
            background: alpha(theme.palette.background.paper, 0.9),
            position: 'sticky',
            bottom: 0,
            zIndex: 10,
          }}
        >
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              variant="outlined" 
              fullWidth 
              onClick={handleClose}
              sx={{ 
                textTransform: 'none', 
                py: 1.5,
                borderRadius: 2,
                fontWeight: 600
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="contained" 
              fullWidth 
              onClick={handleCreateSurvey}
              disabled={!title.trim() || questions.some(q => !q.text.trim())}
              sx={{ 
                textTransform: 'none', 
                py: 1.5,
                borderRadius: 2,
                fontWeight: 600,
                background: isEditing
                  ? 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)'
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: isEditing
                    ? 'linear-gradient(135deg, #f57c00 0%, #ef6c00 100%)'
                    : 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                },
                '&:disabled': {
                  background: theme.palette.action.disabled,
                }
              }}
            >
              {isEditing ? 'Update Survey' : 'Create Survey'}
            </Button>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
};

export default SurveyModalNew;