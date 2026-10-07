import React, { useEffect, useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Container,
  Paper,
  Chip,
  Button,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Divider,
  Avatar,
  Badge,
  IconButton,
  Stack,
} from "@mui/material";
import {
  Logout,
  Assignment,
  CheckCircle,
  Schedule,
  Analytics,
  Visibility,
  Refresh,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { getSurveys, getStudentResponses } from "../surveyAdmin/surveyStorage";

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState([]);
  const [tab, setTab] = useState(0);
  const [studentId] = useState(() => localStorage.getItem("studentId") || `student_${Date.now()}`);

  useEffect(() => {
    localStorage.setItem("studentId", studentId);
    loadSurveys();
  }, [studentId]);

  const loadSurveys = () => {
    const allSurveys = getSurveys().filter(s => s.isActive);
    const responses = getStudentResponses(studentId);
    
    const surveysWithStatus = allSurveys.map(survey => {
      const response = responses.find(r => r.surveyId === survey.id);
      return {
        ...survey,
        status: response ? 'completed' : 'new',
        submittedAt: response?.submittedAt,
        responseId: response?.id
      };
    });
    
    setSurveys(surveysWithStatus);
  };

  const handleLogout = () => {
    localStorage.removeItem("role");
    localStorage.removeItem("studentId");
    navigate("/landing/cms");
  };

  const newSurveys = surveys.filter(s => s.status === 'new');
  const completedSurveys = surveys.filter(s => s.status === 'completed');

  const getSurveyStats = () => {
    return {
      total: surveys.length,
      new: newSurveys.length,
      completed: completedSurveys.length,
      completionRate: surveys.length > 0 ? Math.round((completedSurveys.length / surveys.length) * 100) : 0
    };
  };

  const stats = getSurveyStats();

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeRemaining = (survey) => {
    if (!survey.deadline) return null;
    const now = new Date();
    const deadline = new Date(survey.deadline);
    const diff = deadline - now;
    
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h left`;
    return `${hours}h left`;
  };

  return (
    <Box sx={{ 
      minHeight: "100vh",
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      position: 'relative'
    }}>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
          color: "secondary.main",
        }}
      >
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Analytics sx={{ fontSize: 32, color: "secondary.main" }} />
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Student Survey Portal
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ID: {studentId}
              </Typography>
            </Box>
          </Box>
          <Button
            variant="outlined"
            color="error"
            startIcon={<Logout />}
            onClick={handleLogout}
            sx={{ textTransform: "none", borderRadius: 2, fontWeight: 600 }}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      {/* Stats Overview */}
      <Box sx={{ 
        background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        color: "white", 
        py: 4,
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
        }
      }}>
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={4} justifyContent="center">
            <Grid item xs={6} sm={3}>
              <Box 
                textAlign="center"
                sx={{
                  p: 3,
                  borderRadius: 3,
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    background: 'rgba(255, 255, 255, 0.2)',
                  }
                }}
              >
                <Typography variant="h3" fontWeight={700} sx={{ mb: 1 }}>
                  {stats.total}
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9 }}>Total Surveys</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box 
                textAlign="center"
                sx={{
                  p: 3,
                  borderRadius: 3,
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    background: 'rgba(255, 255, 255, 0.2)',
                  }
                }}
              >
                <Badge badgeContent={stats.new} color="error" max={99}>
                  <Typography variant="h3" fontWeight={700} sx={{ mb: 1 }}>
                    {stats.new}
                  </Typography>
                </Badge>
                <Typography variant="h6" sx={{ opacity: 0.9 }}>New Surveys</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box 
                textAlign="center"
                sx={{
                  p: 3,
                  borderRadius: 3,
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    background: 'rgba(255, 255, 255, 0.2)',
                  }
                }}
              >
                <Typography variant="h3" fontWeight={700} sx={{ mb: 1 }}>
                  {stats.completed}
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9 }}>Completed</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box 
                textAlign="center"
                sx={{
                  p: 3,
                  borderRadius: 3,
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    background: 'rgba(255, 255, 255, 0.2)',
                  }
                }}
              >
                <Typography variant="h3" fontWeight={700} sx={{ mb: 1 }}>
                  {stats.completionRate}%
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9 }}>Completion Rate</Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Tabs */}
        <Paper 
          elevation={0} 
          sx={{ 
            mb: 3, 
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          <Tabs
            value={tab}
            onChange={(e, newValue) => setTab(newValue)}
            sx={{
              '& .MuiTab-root': { 
                fontWeight: 600, 
                textTransform: 'none',
                borderRadius: 2,
                mx: 1,
                my: 1,
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'rgba(0, 0, 0, 0.04)',
                }
              }
            }}
          >
            <Tab 
              icon={<Assignment />} 
              iconPosition="start" 
              label={
                <Badge badgeContent={newSurveys.length} color="error" max={99}>
                  New Surveys
                </Badge>
              } 
            />
            <Tab 
              icon={<CheckCircle />} 
              iconPosition="start" 
              label={`Completed (${completedSurveys.length})`} 
            />
          </Tabs>
        </Paper>

        {/* Refresh Button */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button
            startIcon={<Refresh />}
            onClick={loadSurveys}
            sx={{ textTransform: 'none' }}
          >
            Refresh
          </Button>
        </Box>

        {/* Tab Content */}
        {tab === 0 && (
          <Box>
            <Typography variant="h5" fontWeight={700} color="secondary" gutterBottom>
              Available Surveys
            </Typography>
            <Typography variant="body1" color="text.secondary" mb={3}>
              Participate in these surveys to share your feedback and insights.
            </Typography>

            {newSurveys.length === 0 ? (
              <Card sx={{ textAlign: 'center', py: 6, bgcolor: 'background.default' }}>
                <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                <Typography variant="h6" color="success.main" gutterBottom>
                  All Caught Up!
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  You have completed all available surveys. Check back later for new surveys.
                </Typography>
              </Card>
            ) : (
              <Grid container spacing={3}>
                {newSurveys.map((survey) => (
                  <Grid item xs={12} key={survey.id}>
                    <Card 
                      elevation={2}
                      sx={{
                        borderRadius: 3,
                        transition: 'all 0.2s',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: 4
                        }
                      }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12} md={8}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                              <Avatar sx={{ bgcolor: 'secondary.main', mt: 0.5 }}>
                                <Assignment />
                              </Avatar>
                              <Box>
                                <Typography variant="h6" fontWeight={600} gutterBottom>
                                  {survey.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" paragraph>
                                  {survey.description}
                                </Typography>
                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                  <Chip 
                                    icon={<Schedule />}
                                    label={getTimeRemaining(survey) || 'No deadline'}
                                    color={getTimeRemaining(survey) === 'Expired' ? 'error' : 'default'}
                                    size="small"
                                    variant="outlined"
                                  />
                                  <Chip 
                                    label={`${survey.questions?.length || 0} questions`}
                                    size="small"
                                    variant="outlined"
                                  />
                                  <Chip 
                                    label={`${survey.responses?.length || 0} responses`}
                                    size="small"
                                    variant="outlined"
                                  />
                                </Stack>
                              </Box>
                            </Box>
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: { md: 'flex-end' } }}>
                              <Button
                                variant="contained"
                                color="secondary"
                                onClick={() => navigate(`/landing/cms/student/survey/${survey.id}`)}
                                sx={{ textTransform: "none", borderRadius: 2, fontWeight: 600 }}
                                disabled={getTimeRemaining(survey) === 'Expired'}
                              >
                                {getTimeRemaining(survey) === 'Expired' ? 'Expired' : 'Take Survey'}
                              </Button>
                            </Box>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}

        {tab === 1 && (
          <Box>
            <Typography variant="h5" fontWeight={700} color="secondary" gutterBottom>
              Completed Surveys
            </Typography>
            <Typography variant="body1" color="text.secondary" mb={3}>
              Review the surveys you have already completed.
            </Typography>

            {completedSurveys.length === 0 ? (
              <Card sx={{ textAlign: 'center', py: 6, bgcolor: 'background.default' }}>
                <Assignment sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Completed Surveys
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Complete available surveys to see them listed here.
                </Typography>
              </Card>
            ) : (
              <Grid container spacing={3}>
                {completedSurveys.map((survey) => (
                  <Grid item xs={12} key={survey.id}>
                    <Card elevation={1} sx={{ borderRadius: 3 }}>
                      <CardContent sx={{ p: 3 }}>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12} md={8}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                              <Avatar sx={{ bgcolor: 'success.main', mt: 0.5 }}>
                                <CheckCircle />
                              </Avatar>
                              <Box>
                                <Typography variant="h6" fontWeight={600} gutterBottom>
                                  {survey.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" paragraph>
                                  {survey.description}
                                </Typography>
                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                  <Chip 
                                    icon={<CheckCircle />}
                                    label="Completed"
                                    color="success"
                                    size="small"
                                  />
                                  <Chip 
                                    label={`Submitted: ${formatTime(survey.submittedAt)}`}
                                    size="small"
                                    variant="outlined"
                                  />
                                  <Chip 
                                    label={`${survey.questions?.length || 0} questions`}
                                    size="small"
                                    variant="outlined"
                                  />
                                </Stack>
                              </Box>
                            </Box>
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: { md: 'flex-end' } }}>
                              <Button
                                startIcon={<Visibility />}
                                onClick={() => navigate(`/landing/cms/student/survey/${survey.id}/review`)}
                                sx={{ textTransform: "none", borderRadius: 2 }}
                                variant="outlined"
                              >
                                View Response
                              </Button>
                            </Box>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default StudentDashboard;