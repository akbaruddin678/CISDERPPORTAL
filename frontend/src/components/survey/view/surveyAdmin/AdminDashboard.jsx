import React, { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Container,
  Button,
  Paper,
  Tabs,
  Tab,
  Grid,
  Card,
  alpha,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  AddCircle,
  Logout,
  TableChart,
  Assessment,
  Group,
  Dashboard,
  Description,
  TrendingUp,
  People,
  Analytics,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import SurveyModalNew from "./SurveyModalNew.jsx";
import SurveyTable from "./SurveyTable";
import SurveyResponses from "./SurveyResponses";
import UserManagement from "./UserManagement";
import { getSurveys, addSurvey, toggleSurveyStatus, deleteSurvey, updateSurvey } from "./surveyStorage";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [openModal, setOpenModal] = useState(false);
  const [surveys, setSurveys] = useState([]);
  const [tab, setTab] = useState(0);
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [viewSurvey, setViewSurvey] = useState(null);
  const [editSurvey, setEditSurvey] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadSurveys();
  }, []);

  const loadSurveys = () => {
    setSurveys(getSurveys());
  };

  const handleCreateSurvey = (newSurvey) => {
    addSurvey(newSurvey);
    loadSurveys();
    setTab(1);
    setOpenModal(false);
  };

  const handleToggleSurvey = (id) => {
    setSurveys(toggleSurveyStatus(id));
  };

  const handleDeleteSurvey = (id) => {
    setSurveys(deleteSurvey(id));
  };

  const handleViewSurvey = (survey) => {
    setViewSurvey(survey);
    setViewDialogOpen(true);
  };

  const handleEditSurvey = (survey) => {
  
    setEditSurvey(survey);
    setIsEditing(true);
    setOpenModal(true);
  };

  const handleUpdateSurvey = (updatedSurvey) => {
   
    if (editSurvey) {
      updateSurvey(editSurvey.id, updatedSurvey);
      loadSurveys();
      setEditSurvey(null);
      setIsEditing(false);
      setOpenModal(false);
    }
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setEditSurvey(null);
    setIsEditing(false);
  };

  const handleCloseViewDialog = () => {
    setViewDialogOpen(false);
    setViewSurvey(null);
  };

  const handleNewSurveyClick = () => {
    setEditSurvey(null);
    setIsEditing(false);
    setOpenModal(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("role");
    navigate("/landing/cms");
  };

  const handleSurveySelect = (survey) => {
    setSelectedSurvey(survey);
  };

  const handleBackToReports = () => {
    setSelectedSurvey(null);
  };

  const getTotalResponses = () => {
    return surveys.reduce((total, survey) => total + (survey.responses?.length || 0), 0);
  };

  const getActiveSurveys = () => {
    return surveys.filter(survey => survey.isActive).length;
  };

  const StatCard = ({ icon, value, label, color }) => (
    <Card 
      sx={{
        p: 3,
        height: '100%',
        backgroundColor: 'white',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            backgroundColor: alpha(color, 0.1),
            color: color,
            mr: 2,
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography variant="h4" fontWeight={700} color="text.primary">
            {value}
          </Typography>
          <Typography variant="body1" color="text.secondary" fontWeight={500}>
            {label}
          </Typography>
        </Box>
      </Box>
    </Card>
  );

  const TabPanel = ({ children, value, index }) => (
    value === index && <Box sx={{ py: 3 }}>{children}</Box>
  );

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: '#fafafa' }}>
      {/* Header */}
      <AppBar position="sticky" elevation={1} sx={{ backgroundColor: 'white' }}>
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Dashboard sx={{ fontSize: 32, color: 'primary.main' }} />
            <Box>
              <Typography variant="h6" fontWeight={700} color="text.primary">
                Survey Dashboard
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Administrator
              </Typography>
            </Box>
          </Box>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<Logout />}
            onClick={handleLogout}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      {/* Dashboard Stats - Simplified */}
      {!selectedSurvey && tab !== 0 && (
        <Box sx={{ backgroundColor: 'white', py: 4, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Container maxWidth="lg">
            <Typography variant="h5" fontWeight={600} color="text.primary" gutterBottom>
              Overview
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  icon={<Description sx={{ fontSize: 24 }} />}
                  value={surveys.length}
                  label="Total Surveys"
                  color="#1976d2"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  icon={<TrendingUp sx={{ fontSize: 24 }} />}
                  value={getActiveSurveys()}
                  label="Active Surveys"
                  color="#2e7d32"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  icon={<People sx={{ fontSize: 24 }} />}
                  value={getTotalResponses()}
                  label="Total Responses"
                  color="#ed6c02"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  icon={<Analytics sx={{ fontSize: 24 }} />}
                  value={getTotalResponses()}
                  label="Total Responses"
                  color="#9c27b0"
                />
              </Grid>
            </Grid>
          </Container>
        </Box>
      )}

      {/* Tabs */}
      <Paper elevation={0} sx={{ backgroundColor: 'white', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Container maxWidth="lg">
          <Tabs
            value={tab}
            onChange={(e, v) => {
              setTab(v);
              setSelectedSurvey(null);
            }}
            textColor="primary"
            indicatorColor="primary"
          >
            <Tab 
              label="Create" 
              icon={<AddCircle />} 
              iconPosition="start"
              sx={{ minHeight: 60, fontWeight: 600 }}
            />
            <Tab 
              label="Manage" 
              icon={<TableChart />} 
              iconPosition="start"
              sx={{ minHeight: 60, fontWeight: 600 }}
            />
            <Tab 
              label="Users" 
              icon={<Group />} 
              iconPosition="start"
              sx={{ minHeight: 60, fontWeight: 600 }}
            />
            <Tab 
              label="Analytics" 
              icon={<Assessment />} 
              iconPosition="start"
              sx={{ minHeight: 60, fontWeight: 600 }}
            />
          </Tabs>
        </Container>
      </Paper>

      {/* Content */}
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Create Survey Tab */}
        <TabPanel value={tab} index={0}>
          <Card sx={{ p: 6, textAlign: 'center', backgroundColor: 'white' }}>
            <Box sx={{ width: 64, height: 64, backgroundColor: 'primary.main', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3 }}>
              <AddCircle sx={{ fontSize: 32, color: 'white' }} />
            </Box>
            <Typography variant="h5" fontWeight={600} gutterBottom>
              Create New Survey
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 400, mx: 'auto' }}>
              Design surveys with multiple question types to gather valuable insights.
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<AddCircle />}
              onClick={handleNewSurveyClick}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, px: 4 }}
            >
              Create Survey
            </Button>
          </Card>
        </TabPanel>

        {/* Manage Surveys Tab */}
        <TabPanel value={tab} index={1}>
          <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
              <Typography variant="h5" fontWeight={600}>
                Manage Surveys
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddCircle />}
                onClick={handleNewSurveyClick}
                sx={{ borderRadius: 2 }}
              >
                New Survey
              </Button>
            </Box>
            <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
              <SurveyTable
                surveys={surveys}
                onToggle={handleToggleSurvey}
                onDelete={handleDeleteSurvey}
                onViewReports={handleSurveySelect}
                onView={handleViewSurvey}
                onEdit={handleEditSurvey}
              />
            </Card>
          </Box>
        </TabPanel>

        {/* User Management Tab */}
        <TabPanel value={tab} index={2}>
          <UserManagement />
        </TabPanel>

        {/* Analytics Tab */}
        <TabPanel value={tab} index={3}>
          <Box>
            {selectedSurvey ? (
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4 }}>
                  <Button 
                    startIcon={<Assessment />}
                    onClick={handleBackToReports}
                    sx={{ textTransform: 'none' }}
                  >
                    Back to Reports
                  </Button>
                  <Typography variant="h6" fontWeight={600}>
                    {selectedSurvey.title}
                  </Typography>
                </Box>
                <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
                  <SurveyResponses survey={selectedSurvey} isDetailedView={true} />
                </Card>
              </Box>
            ) : (
              <Box>
                <Typography variant="h5" fontWeight={600} gutterBottom>
                  Survey Analytics
                </Typography>
                <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
                  <SurveyResponses 
                    surveys={surveys}
                    onSurveySelect={handleSurveySelect}
                    isDetailedView={false}
                  />
                </Card>
              </Box>
            )}
          </Box>
        </TabPanel>
      </Container>

      {/* Survey View Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={handleCloseViewDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Survey: {viewSurvey?.title}
        </DialogTitle>
        <DialogContent>
          {viewSurvey && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Description:
              </Typography>
              <Typography variant="body1" paragraph>
                {viewSurvey.description || "No description provided."}
              </Typography>
              
              <Box sx={{ mb: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Survey Details:
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      <strong>Status:</strong> {viewSurvey.isActive ? 'Active' : 'Inactive'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      <strong>Responses:</strong> {viewSurvey.responses?.length || 0}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      <strong>Created:</strong> {new Date(viewSurvey.createdAt).toLocaleDateString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      <strong>Departments:</strong> {viewSurvey.departments?.join(', ') || 'All'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2">
                      <strong>Assigned To:</strong> 
                      {viewSurvey.assignedTo?.teachers ? ' Teachers' : ''}
                      {viewSurvey.assignedTo?.teachers && viewSurvey.assignedTo?.students ? ' & ' : ''}
                      {viewSurvey.assignedTo?.students ? ' Students' : ''}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
              
              <Typography variant="h6" gutterBottom>
                Questions ({viewSurvey.questions?.length || 0}):
              </Typography>
              {viewSurvey.questions?.map((question, index) => (
                <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {index + 1}. {question.questionText}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Type: {question.type}
                    {question.required && <span style={{color: 'red', marginLeft: '8px'}}>* Required</span>}
                  </Typography>
                  {question.options && question.options.length > 0 && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" fontWeight={600}>
                        Options:
                      </Typography>
                      {question.options.map((option, optIndex) => (
                        <Typography key={optIndex} variant="body2">
                          • {option}
                        </Typography>
                      ))}
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseViewDialog}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <SurveyModalNew
        open={openModal}
        onClose={handleCloseModal}
        onCreate={isEditing ? handleUpdateSurvey : handleCreateSurvey}
        editSurvey={editSurvey}
        isEditing={isEditing}
      />
    </Box>
  );
};

export default AdminDashboard;