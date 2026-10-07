import React from "react";
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Button,
  Card,
  CardContent,
  Grid,
} from "@mui/material";
import {
  Visibility,
  Analytics,
  Assignment,
  QuestionAnswer,
  FormatListBulleted,
} from "@mui/icons-material";

const SurveyResponses = ({ surveys, survey, onSurveySelect, isDetailedView }) => {
  // Helper function to find question text by ID
  const findQuestionText = (survey, questionId) => {
    const question = survey.questions?.find(q => q.id === questionId);
    return question?.questionText || `Question ${questionId}`;
  };

  // If in detailed view for a single survey
  if (isDetailedView && survey) {
    return (
      <Box>
        <Box sx={{ p: 3, bgcolor: "action.hover" }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Survey Overview
              </Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: 'wrap' }}>
                <Chip 
                  icon={<FormatListBulleted />}
                  label={`${survey.questions?.length || 0} Questions`} 
                  color="primary" 
                  variant="outlined" 
                />
                <Chip 
                  icon={<QuestionAnswer />}
                  label={`${survey.responses?.length || 0} Responses`} 
                  color="secondary" 
                  variant="outlined" 
                />
                <Chip 
                  label={survey.isActive ? "Active" : "Inactive"} 
                  color={survey.isActive ? "success" : "default"} 
                  variant="outlined" 
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">
                Created: {new Date(survey.createdAt).toLocaleDateString()}
              </Typography>
            </Grid>
          </Grid>
        </Box>

        <Box sx={{ p: 3 }}>
          {survey.responses && survey.responses.length > 0 ? (
            <>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <QuestionAnswer color="primary" />
                Individual Responses ({survey.responses.length})
              </Typography>
              <List sx={{ mt: 2 }}>
                {survey.responses.map((response, idx) => (
                  <React.Fragment key={idx}>
                    <ListItem alignItems="flex-start">
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle1" fontWeight={600}>
                              Response #{idx + 1}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                              <Chip 
                                label={`${Object.keys(response.answers || {}).length} answers`} 
                                size="small" 
                                variant="outlined" 
                              />
                              {response.submittedAt && (
                                <Typography variant="caption" color="text.secondary">
                                  {new Date(response.submittedAt).toLocaleDateString()}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            {Object.entries(response.answers || {}).map(([questionId, answer], answerIdx) => (
                              <Box key={answerIdx} sx={{ mb: 1, p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
                                <Typography variant="body2" fontWeight={600}>
                                  Q: {findQuestionText(survey, questionId)}
                                </Typography>
                                <Typography variant="body2" color="text.primary">
                                  A: {typeof answer === 'object' ? JSON.stringify(answer, null, 2) : answer.toString()}
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                        }
                      />
                    </ListItem>
                    {idx < survey.responses.length - 1 && <Divider variant="inset" component="li" />}
                  </React.Fragment>
                ))}
              </List>
            </>
          ) : (
            <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'background.default' }}>
              <Analytics sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Responses Yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This survey hasn't received any responses yet. Share the survey link to start collecting data.
              </Typography>
            </Paper>
          )}
        </Box>
      </Box>
    );
  }

  // List view for all surveys
  return (
    <Box>
      {surveys.length === 0 ? (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Analytics sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No surveys available
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create your first survey to start collecting responses.
          </Typography>
        </Box>
      ) : (
        surveys.map((survey) => (
          <Card 
            key={survey.id} 
            sx={{ 
              m: 2, 
              borderRadius: 2,
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 4
              }
            }}
            onClick={() => onSurveySelect(survey)}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    {survey.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {survey.description}
                  </Typography>
                </Box>
                <Button
                  startIcon={<Visibility />}
                  color="primary"
                  variant="outlined"
                  size="small"
                  sx={{ textTransform: 'none', borderRadius: 2 }}
                >
                  View Report
                </Button>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip 
                  icon={<FormatListBulleted />}
                  label={`${survey.questions?.length || 0} questions`} 
                  size="small" 
                  variant="outlined" 
                />
                <Chip 
                  icon={<QuestionAnswer />}
                  label={`${survey.responses?.length || 0} responses`} 
                  size="small" 
                  color="primary" 
                  variant="outlined" 
                />
                <Chip 
                  label={survey.isActive ? "Active" : "Inactive"} 
                  size="small"
                  color={survey.isActive ? "success" : "default"} 
                />
                {survey.createdAt && (
                  <Chip 
                    label={new Date(survey.createdAt).toLocaleDateString()}
                    size="small"
                    variant="outlined"
                  />
                )}
              </Box>
            </CardContent>
          </Card>
        ))
      )}
    </Box>
  );
};

export default SurveyResponses;