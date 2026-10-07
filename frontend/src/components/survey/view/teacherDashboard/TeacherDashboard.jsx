import React, { useState, useEffect } from "react";
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
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText
} from "@mui/material";
import {
  Logout,
  Assignment,
  Analytics,
  Group,
  School,
  BarChart,
  TrendingUp,
  Refresh
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { getUsersByDepartment } from "../surveyAdmin/userStorage";
import { 
  getSurveysByDepartmentAndRole, 
  getSurveyResponsesForTeacher, 
  getTeacherSurveyStats
} from "../surveyAdmin/surveyStorage";

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState([]);
  const [students, setStudents] = useState([]);
  const [tab, setTab] = useState(0);
  const [teacherInfo, setTeacherInfo] = useState(null);
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [surveyResponses, setSurveyResponses] = useState([]);

  useEffect(() => {
    const role = localStorage.getItem("role");
    const userId = localStorage.getItem("userId");
    
    if (role !== "teacher") {
      navigate("/landing/cms");
      return;
    }

    const teacherData = {
      name: "Teacher Name",
      department: "Science",
      email: "teacher@example.com",
      id: userId
    };
    setTeacherInfo(teacherData);

    loadData(teacherData.department);
  }, [navigate]);

  const loadData = (department) => {
    // Get surveys assigned to teacher's department
    const departmentSurveys = getSurveysByDepartmentAndRole(department, 'teacher');
    setSurveys(departmentSurveys);
    
    // Get students from same department
    const departmentStudents = getUsersByDepartment(department)
      .filter(user => user.role === 'student');
    setStudents(departmentStudents);
  };

  const handleLogout = () => {
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    navigate("/landing/cms");
  };

  const handleViewResponses = (survey) => {
    const responses = getSurveyResponsesForTeacher(survey.id, teacherInfo.department);
    setSelectedSurvey(survey);
    setSurveyResponses(responses);
    setResponseDialogOpen(true);
  };

  const handleCloseResponseDialog = () => {
    setResponseDialogOpen(false);
    setSelectedSurvey(null);
    setSurveyResponses([]);
  };

  const getSurveyStats = () => {
    if (!teacherInfo) return { 
      totalSurveys: 0, 
      activeSurveys: 0, 
      totalResponses: 0, 
      completionRate: 0, 
      completedSurveys: 0,
      studentsCount: 0
    };
    const stats = getTeacherSurveyStats(teacherInfo.department);
    return {
      ...stats,
      studentsCount: students.length
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

  const refreshData = () => {
    if (teacherInfo) {
      loadData(teacherInfo.department);
    }
  };

  const activeSurveys = surveys.filter(s => s.isActive);

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
          color: "primary.main",
        }}
      >
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <School sx={{ fontSize: 32, color: "primary.main" }} />
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Teacher Dashboard
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {teacherInfo?.department} Department
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Button
              startIcon={<Refresh />}
              onClick={refreshData}
              sx={{ textTransform: "none" }}
            >
              Refresh
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<Logout />}
              onClick={handleLogout}
              sx={{ textTransform: "none", borderRadius: 2, fontWeight: 600 }}
            >
              Logout
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Stats Overview */}
      <Box sx={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
                  {stats.totalSurveys}
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
                <Badge badgeContent={activeSurveys.length} color="success" max={99}>
                  <Typography variant="h3" fontWeight={700} sx={{ mb: 1 }}>
                    {activeSurveys.length}
                  </Typography>
                </Badge>
                <Typography variant="h6" sx={{ opacity: 0.9 }}>Active Surveys</Typography>
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
                  {stats.totalResponses}
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9 }}>Total Responses</Typography>
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
                <Badge badgeContent={surveys.length} color="primary" max={99}>
                  Class Surveys
                </Badge>
              } 
            />
            <Tab 
              icon={<Group />} 
              iconPosition="start" 
              label={`Students (${students.length})`} 
            />
            <Tab 
              icon={<Analytics />} 
              iconPosition="start" 
              label="Analytics" 
            />
          </Tabs>
        </Paper>

        {/* Refresh Button */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button
            startIcon={<Refresh />}
            onClick={refreshData}
            sx={{ textTransform: 'none' }}
          >
            Refresh
          </Button>
        </Box>

        {/* Tab Content */}
        {tab === 0 && (
          <Box>
            <Typography variant="h5" fontWeight={700} color="primary" gutterBottom>
              Class Surveys
            </Typography>
            <Typography variant="body1" color="text.secondary" mb={3}>
              Surveys assigned to {teacherInfo?.department} department for teacher review.
            </Typography>

            {surveys.length === 0 ? (
              <Card sx={{ textAlign: 'center', py: 6, bgcolor: 'background.default' }}>
                <Assignment sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Surveys Available
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  No surveys have been assigned to your class yet.
                </Typography>
              </Card>
            ) : (
              <Grid container spacing={3}>
                {surveys.map((survey) => (
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
                              <Avatar sx={{ bgcolor: 'primary.main', mt: 0.5 }}>
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
                                    label={survey.isActive ? "Active" : "Inactive"}
                                    color={survey.isActive ? "success" : "default"}
                                    size="small"
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
                                  {survey.createdAt && (
                                    <Chip 
                                      label={`Created: ${formatTime(survey.createdAt)}`}
                                      size="small"
                                      variant="outlined"
                                    />
                                  )}
                                  {survey.assignedTo?.teachers && (
                                    <Chip 
                                      label="For Teachers"
                                      size="small"
                                      color="primary"
                                    />
                                  )}
                                  {survey.assignedTo?.students && (
                                    <Chip 
                                      label="For Students" 
                                      size="small"
                                      color="secondary"
                                    />
                                  )}
                                </Stack>
                              </Box>
                            </Box>
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: { md: 'flex-end' } }}>
                              <Button
                                startIcon={<BarChart />}
                                variant="contained"
                                color="primary"
                                onClick={() => handleViewResponses(survey)}
                                disabled={!survey.responses || survey.responses.length === 0}
                                sx={{ textTransform: "none", borderRadius: 2, fontWeight: 600 }}
                              >
                                View Responses ({survey.responses?.length || 0})
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
            <Typography variant="h5" fontWeight={700} color="primary" gutterBottom>
              Class Students
            </Typography>
            <Typography variant="body1" color="text.secondary" mb={3}>
              Students enrolled in the {teacherInfo?.department} department.
            </Typography>

            {students.length === 0 ? (
              <Card sx={{ textAlign: 'center', py: 6, bgcolor: 'background.default' }}>
                <Group sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Students Found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  No students are currently enrolled in your class.
                </Typography>
              </Card>
            ) : (
              <Grid container spacing={3}>
                {students.map((student) => (
                  <Grid item xs={12} md={6} key={student.id}>
                    <Card elevation={1} sx={{ borderRadius: 3 }}>
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            <Group />
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" fontWeight={600} gutterBottom>
                              {student.firstName} {student.lastName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" paragraph>
                              {student.email}
                            </Typography>
                            <Stack direction="row" spacing={1}>
                              <Chip 
                                label={student.isActive ? "Active" : "Inactive"}
                                color={student.isActive ? "success" : "default"}
                                size="small"
                              />
                              <Chip 
                                label={`Username: ${student.username}`}
                                size="small"
                                variant="outlined"
                              />
                            </Stack>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}

        {tab === 2 && (
          <Box>
            <Typography variant="h5" fontWeight={700} color="primary" gutterBottom>
              Survey Analytics
            </Typography>
            <Typography variant="body1" color="text.secondary" mb={3}>
              Insights and statistics for your class surveys.
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card 
                  elevation={2}
                  sx={{
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white'
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      Survey Completion Rate
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                      <Typography variant="h3" fontWeight={700}>
                        {stats.completionRate}%
                      </Typography>
                      <TrendingUp sx={{ fontSize: 40, opacity: 0.8 }} />
                    </Box>
                    <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                      {stats.completedSurveys} of {stats.totalSurveys} surveys completed
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card 
                  elevation={2}
                  sx={{
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    color: 'white'
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      Student Participation
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                      <Typography variant="h3" fontWeight={700}>
                        {stats.studentsCount}
                      </Typography>
                      <Group sx={{ fontSize: 40, opacity: 0.8 }} />
                    </Box>
                    <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                      Students in your class
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card 
                  elevation={2}
                  sx={{
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    color: 'white'
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      Total Responses
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                      <Typography variant="h3" fontWeight={700}>
                        {stats.totalResponses}
                      </Typography>
                      <Analytics sx={{ fontSize: 40, opacity: 0.8 }} />
                    </Box>
                    <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                      Across all class surveys
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card 
                  elevation={2}
                  sx={{
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                    color: 'white'
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      Active Surveys
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                      <Typography variant="h3" fontWeight={700}>
                        {activeSurveys.length}
                      </Typography>
                      <Assignment sx={{ fontSize: 40, opacity: 0.8 }} />
                    </Box>
                    <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                      Currently active in your class
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}
      </Container>

      {/* Response Dialog */}
      <Dialog 
        open={responseDialogOpen} 
        onClose={handleCloseResponseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BarChart color="primary" />
            <Typography variant="h6">
              Responses for {selectedSurvey?.title}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {surveyResponses.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Analytics sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No Responses Yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This survey hasn't received any responses yet.
              </Typography>
            </Box>
          ) : (
            <Box>
              <Typography variant="body1" color="text.secondary" mb={2}>
                Total Responses: {surveyResponses.length}
              </Typography>
              <List>
                {surveyResponses.map((response, index) => (
                  <React.Fragment key={response.id}>
                    <ListItem alignItems="flex-start">
                      <ListItemText
                        primary={
                          <Typography variant="subtitle1" fontWeight={600}>
                            Response #{index + 1}
                          </Typography>
                        }
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Submitted: {formatTime(response.submittedAt)}
                            </Typography>
                            {Object.entries(response.answers || {}).map(([questionId, answer], answerIdx) => (
                              <Box key={answerIdx} sx={{ mb: 1, p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
                                <Typography variant="body2" fontWeight={600}>
                                  Q: {selectedSurvey.questions?.find(q => q.id === questionId)?.questionText || questionId}
                                </Typography>
                                <Typography variant="body2" color="text.primary">
                                  A: {Array.isArray(answer) ? answer.join(', ') : answer.toString()}
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < surveyResponses.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseResponseDialog}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeacherDashboard;